import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { asyncHandler, validate } from '../utils/http';
import { availabilityQuerySchema, doctorQuerySchema } from '../validators/schemas';
import { NotFoundError, ValidationError } from '../utils/errors';
import {
  doctorCardInclude,
  doctorDetailInclude,
  serializeDoctor,
  serializeDoctorDetail,
} from '../services/serializers';
import { getAvailability, getNextAvailable } from '../services/slots';

export const doctorsRouter = Router();

doctorsRouter.get(
  '/filters',
  asyncHandler(async (_req, res) => {
    const [specializations, doctors] = await Promise.all([
      prisma.specialization.findMany({ orderBy: { name: 'asc' } }),
      prisma.doctorProfile.findMany({
        where: { verified: true, status: 'VERIFIED', user: { deletedAt: null } },
        select: { city: true, languages: true, feePaise: true, onlineEnabled: true, inPersonEnabled: true },
      }),
    ]);
    const languages = new Set<string>();
    const cities = new Set<string>();
    let minFee = Number.POSITIVE_INFINITY;
    let maxFee = 0;
    for (const doctor of doctors) {
      try {
        for (const language of JSON.parse(doctor.languages)) languages.add(String(language));
      } catch {
        /* ignore malformed demo data */
      }
      cities.add(doctor.city);
      minFee = Math.min(minFee, doctor.feePaise);
      maxFee = Math.max(maxFee, doctor.feePaise);
    }
    res.json({
      specializations: specializations.map((item) => ({ slug: item.slug, name: item.name })),
      languages: Array.from(languages).sort(),
      cities: Array.from(cities).sort(),
      feeRangePaise: {
        min: Number.isFinite(minFee) ? minFee : 0,
        max: maxFee || 0,
      },
      demo: true,
    });
  }),
);

doctorsRouter.get(
  '/',
  validate(doctorQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as {
      gender?: string;
      specialization?: string;
      mode?: string;
      language?: string;
      city?: string;
      minExperience?: number;
      maxFee?: number;
      availability?: string;
      search?: string;
      sort?: string;
      page: number;
      limit: number;
    };

    const where: Prisma.DoctorProfileWhereInput = {
      verified: true,
      status: 'VERIFIED',
      user: { deletedAt: null },
      ...(query.gender ? { gender: query.gender } : {}),
      ...(query.mode === 'ONLINE'
        ? { onlineEnabled: true }
        : query.mode === 'IN_PERSON'
          ? { inPersonEnabled: true }
          : {}),
      ...(query.language ? { languages: { contains: query.language } } : {}),
      ...(query.city ? { city: { contains: query.city } } : {}),
      ...(query.minExperience ? { experienceYears: { gte: Number(query.minExperience) } } : {}),
      ...(query.maxFee ? { feePaise: { lte: Number(query.maxFee) * 100 } } : {}),
      ...(query.specialization
        ? { specializations: { some: { specialization: { slug: query.specialization } } } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { user: { name: { contains: query.search } } },
              { title: { contains: query.search } },
              { city: { contains: query.search } },
            ],
          }
        : {}),
    };

    const allDoctors = await prisma.doctorProfile.findMany({
      where,
      include: doctorCardInclude,
      orderBy:
        query.sort === 'experience'
          ? { experienceYears: 'desc' }
          : query.sort === 'fee_low'
            ? { feePaise: 'asc' }
            : query.sort === 'fee_high'
              ? { feePaise: 'desc' }
              : { createdAt: 'asc' },
    });

    const enriched = [];
    for (const doctor of allDoctors) {
      const mode = doctor.onlineEnabled ? 'ONLINE' : 'IN_PERSON';
      const nextAvailable = await getNextAvailable(doctor, mode);
      enriched.push({ doctor, nextAvailable });
    }

    let filtered = enriched;
    if (query.availability === 'TODAY' || query.availability === 'THIS_WEEK') {
      const limit = query.availability === 'TODAY' ? 1 : 7;
      const cutoff = new Date(Date.now() + limit * 24 * 60 * 60 * 1000);
      filtered = enriched.filter(
        (item) => item.nextAvailable && new Date(item.nextAvailable) <= cutoff,
      );
    }

    if (query.sort === 'earliest') {
      filtered.sort((a, b) => {
        if (!a.nextAvailable && !b.nextAvailable) return 0;
        if (!a.nextAvailable) return 1;
        if (!b.nextAvailable) return -1;
        return a.nextAvailable.localeCompare(b.nextAvailable);
      });
    }

    const total = filtered.length;
    const start = (query.page - 1) * query.limit;
    const pageItems = filtered.slice(start, start + query.limit);

    res.json({
      doctors: pageItems.map((item) => serializeDoctor(item.doctor, item.nextAvailable)),
      total,
      page: query.page,
      limit: query.limit,
      hasMore: start + pageItems.length < total,
      demo: true,
    });
  }),
);

doctorsRouter.get(
  '/:slug/availability',
  validate(availabilityQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const doctor = await prisma.doctorProfile.findFirst({
      where: { slug: req.params.slug, verified: true, status: 'VERIFIED' },
      include: { availabilities: { where: { active: true } } },
    });
    if (!doctor) throw new NotFoundError('This specialist profile is not available.');
    const mode = req.query.mode as 'ONLINE' | 'IN_PERSON';
    if (mode === 'ONLINE' && !doctor.onlineEnabled) {
      throw new ValidationError({ mode: ['This clinician does not offer video consultations.'] });
    }
    if (mode === 'IN_PERSON' && !doctor.inPersonEnabled) {
      throw new ValidationError({ mode: ['This clinician does not offer in-person consultations.'] });
    }
    const days = await getAvailability(doctor, mode, Number(req.query.days) || 21);
    res.json({
      days,
      timezone: doctor.timezone,
      mode,
      doctor: { id: doctor.id, slug: doctor.slug, timezone: doctor.timezone },
    });
  }),
);

doctorsRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const doctor = await prisma.doctorProfile.findFirst({
      where: { slug: req.params.slug, verified: true, status: 'VERIFIED' },
      include: doctorDetailInclude,
    });
    if (!doctor) throw new NotFoundError('This specialist profile is not available.');
    const mode = doctor.onlineEnabled ? 'ONLINE' : 'IN_PERSON';
    const nextAvailable = await getNextAvailable(doctor, mode);
    res.json({ doctor: serializeDoctorDetail(doctor, nextAvailable) });
  }),
);
