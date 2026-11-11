import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Doctor, DoctorDetail, DoctorFilters } from '@/types';
import { demoDoctors, getDemoDoctor } from '@/data/doctors';

type DoctorListResponse = {
  doctors: Doctor[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  demo: boolean;
};

function paramsFromFilters(filters: DoctorFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null && value !== 'ANY') {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export function filterDemoDoctors(filters: DoctorFilters): Doctor[] {
  let list = [...demoDoctors];
  if (filters.gender) list = list.filter((doctor) => doctor.gender === filters.gender);
  if (filters.mode === 'ONLINE') list = list.filter((doctor) => doctor.onlineEnabled);
  if (filters.mode === 'IN_PERSON') list = list.filter((doctor) => doctor.inPersonEnabled);
  if (filters.specialization) {
    list = list.filter((doctor) =>
      doctor.specializations.some((item) => item.slug === filters.specialization),
    );
  }
  if (filters.language) {
    list = list.filter((doctor) => doctor.languages.includes(filters.language as string));
  }
  if (filters.city) list = list.filter((doctor) => doctor.city === filters.city);
  if (filters.minExperience) {
    list = list.filter((doctor) => doctor.experienceYears >= Number(filters.minExperience));
  }
  if (filters.maxFee) list = list.filter((doctor) => doctor.feePaise <= Number(filters.maxFee) * 100);
  if (filters.search) {
    const query = filters.search.toLowerCase();
    list = list.filter((doctor) =>
      `${doctor.name} ${doctor.title} ${doctor.city} ${doctor.specializations.map((s) => s.name).join(' ')}`
        .toLowerCase()
        .includes(query),
    );
  }
  if (filters.sort === 'experience') list.sort((a, b) => b.experienceYears - a.experienceYears);
  if (filters.sort === 'fee_low') list.sort((a, b) => a.feePaise - b.feePaise);
  if (filters.sort === 'fee_high') list.sort((a, b) => b.feePaise - a.feePaise);
  return list;
}

export function useDoctors(filters: DoctorFilters) {
  return useQuery({
    queryKey: ['doctors', filters],
    queryFn: async (): Promise<DoctorListResponse & { offline: boolean }> => {
      try {
        const data = await api<DoctorListResponse>(`/doctors?${paramsFromFilters(filters)}`);
        return { ...data, offline: false };
      } catch {
        const list = filterDemoDoctors(filters);
        return {
          doctors: list,
          total: list.length,
          page: 1,
          limit: 12,
          hasMore: false,
          demo: true,
          offline: true,
        };
      }
    },
    staleTime: 60_000,
  });
}

export function useDoctor(slug: string | undefined) {
  return useQuery({
    queryKey: ['doctor', slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<{ doctor: DoctorDetail; offline: boolean }> => {
      try {
        const data = await api<{ doctor: DoctorDetail }>(`/doctors/${slug}`);
        return { ...data, offline: false };
      } catch {
        const fallback = getDemoDoctor(slug || '');
        if (!fallback) throw new Error('Doctor not found');
        const doctor: DoctorDetail = {
          ...fallback,
          availabilitySummary: [],
          clinic: fallback.clinicName
            ? {
                name: fallback.clinicName,
                city: fallback.city,
                addressNote: 'Exact clinic details are shared after a confirmed booking.',
              }
            : null,
          reviews: [],
        };
        return { doctor, offline: true };
      }
    },
  });
}

export function useDoctorFilters() {
  return useQuery({
    queryKey: ['doctor-filters'],
    queryFn: async () => {
      try {
        return await api<{
          specializations: { slug: string; name: string }[];
          languages: string[];
          cities: string[];
          feeRangePaise: { min: number; max: number };
        }>('/doctors/filters');
      } catch {
        const specializations = new Map<string, string>();
        const languages = new Set<string>();
        const cities = new Set<string>();
        for (const doctor of demoDoctors) {
          doctor.specializations.forEach((item) => specializations.set(item.slug, item.name));
          doctor.languages.forEach((language) => languages.add(language));
          cities.add(doctor.city);
        }
        return {
          specializations: Array.from(specializations.entries()).map(([slug, name]) => ({
            slug,
            name,
          })),
          languages: Array.from(languages).sort(),
          cities: Array.from(cities).sort(),
          feeRangePaise: { min: 200000, max: 400000 },
        };
      }
    },
    staleTime: 5 * 60_000,
  });
}
