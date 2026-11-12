import { DateTime } from 'luxon';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import type { DoctorAvailability, DoctorProfile } from '@prisma/client';

export type Slot = {
  startAt: string;
  endAt: string;
  mode: 'ONLINE' | 'IN_PERSON';
  label: string;
};

export type AvailabilityDay = {
  date: string;
  label: string;
  shortLabel: string;
  slots: Slot[];
};

type DoctorSchedule = Pick<
  DoctorProfile,
  'id' | 'timezone' | 'onlineEnabled' | 'inPersonEnabled'
> & { availabilities: DoctorAvailability[] };

function modeAllowed(windowMode: string, requested: 'ONLINE' | 'IN_PERSON') {
  return windowMode === 'BOTH' || windowMode === requested;
}

async function bookedIntervals(doctorId: string, from: DateTime, to: DateTime) {
  const now = new Date();
  return prisma.appointment.findMany({
    where: {
      doctorId,
      startAt: { lt: to.toUTC().toJSDate() },
      endAt: { gt: from.toUTC().toJSDate() },
      OR: [
        { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
        { status: 'PENDING_PAYMENT', holdExpiresAt: { gt: now } },
      ],
    },
    select: { startAt: true, endAt: true },
  });
}

export async function getAvailability(
  doctor: DoctorSchedule,
  mode: 'ONLINE' | 'IN_PERSON',
  days = 21,
): Promise<AvailabilityDay[]> {
  if (mode === 'ONLINE' && !doctor.onlineEnabled) return [];
  if (mode === 'IN_PERSON' && !doctor.inPersonEnabled) return [];

  const zone = doctor.timezone || 'Asia/Kolkata';
  const now = DateTime.now().setZone(zone);
  const startDay = now.startOf('day');
  const end = startDay.plus({ days }).endOf('day');
  const booked = await bookedIntervals(doctor.id, startDay, end);
  const result: AvailabilityDay[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const day = startDay.plus({ days: offset });
    const weekday = day.weekday % 7;
    const windows = doctor.availabilities.filter(
      (window) => window.active && window.weekday === weekday && modeAllowed(window.mode, mode),
    );
    if (!windows.length) continue;

    const slots: Slot[] = [];
    const seen = new Set<string>();
    for (const window of windows) {
      for (
        let minute = window.startMinute;
        minute + window.slotMinutes <= window.endMinute;
        minute += window.slotMinutes
      ) {
        const start = day.plus({ minutes: minute });
        if (start <= now.plus({ hours: 2 })) continue;
        const endAt = start.plus({ minutes: window.slotMinutes });
        const key = start.toUTC().toISO();
        if (!key || seen.has(key)) continue;
        if (booked.some((appointment) =>
          appointment.startAt.getTime() < endAt.toMillis() &&
          appointment.endAt.getTime() > start.toMillis()
        )) continue;
        seen.add(key);
        slots.push({
          startAt: key,
          endAt: endAt.toUTC().toISO() as string,
          mode,
          label: start.toFormat('h:mm a'),
        });
      }
    }

    if (slots.length) {
      slots.sort((a, b) => a.startAt.localeCompare(b.startAt));
      result.push({
        date: day.toISODate() as string,
        label: day.toFormat('cccc, d LLLL'),
        shortLabel: day.toFormat('ccc d LLL'),
        slots,
      });
    }
  }

  return result;
}

export async function getNextAvailable(
  doctor: Pick<DoctorProfile, 'id' | 'timezone' | 'onlineEnabled' | 'inPersonEnabled'> & {
    availabilities: DoctorAvailability[];
  },
  mode: 'ONLINE' | 'IN_PERSON' = 'ONLINE',
) {
  const days = await getAvailability(doctor, mode, 21);
  for (const day of days) {
    if (day.slots[0]) return day.slots[0].startAt;
  }
  return null;
}

export async function validateBookingSlot(input: {
  doctorId: string;
  timezone: string;
  startAt: string;
  mode: 'ONLINE' | 'IN_PERSON';
}) {
  const parsed = DateTime.fromISO(input.startAt, { setZone: true });
  if (!parsed.isValid) {
    return { valid: false as const, reason: 'Please choose a valid appointment time.' };
  }
  const zone = input.timezone || 'Asia/Kolkata';
  const local = parsed.setZone(zone);
  const now = DateTime.now().setZone(zone);
  if (local <= now.plus({ hours: 2 })) {
    return { valid: false as const, reason: 'Please choose a time at least two hours from now.' };
  }
  if (local > now.plus({ days: 90 })) {
    return { valid: false as const, reason: 'Appointments can be booked up to 90 days ahead.' };
  }

  const weekday = local.weekday % 7;
  const minute = local.hour * 60 + local.minute;
  const windows = await prisma.doctorAvailability.findMany({
    where: { doctorId: input.doctorId, weekday, active: true },
  });

  const matching = windows.find(
    (window) =>
      modeAllowed(window.mode, input.mode) &&
      minute >= window.startMinute &&
      minute + window.slotMinutes <= window.endMinute &&
      (minute - window.startMinute) % window.slotMinutes === 0,
  );

  if (!matching) {
    return {
      valid: false as const,
      reason: 'That time is outside the clinician’s available consultation hours.',
    };
  }

  const end = local.plus({ minutes: matching.slotMinutes });
  return {
    valid: true as const,
    startAt: local.toUTC().toJSDate(),
    endAt: end.toUTC().toJSDate(),
    slotMinutes: matching.slotMinutes,
  };
}

export async function hasBookingConflict(doctorId: string, startAt: Date, endAt: Date) {
  const now = new Date();
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      OR: [
        { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
        { status: 'PENDING_PAYMENT', holdExpiresAt: { gt: now } },
      ],
    },
    select: { id: true, bookingId: true },
  });
  return conflict;
}

export function withinJoinWindow(startAt: Date, endAt: Date) {
  if (env.isDemo) return true;
  const now = Date.now();
  return now >= startAt.getTime() - 15 * 60 * 1000 && now <= endAt.getTime() + 30 * 60 * 1000;
}

export { modeAllowed };
