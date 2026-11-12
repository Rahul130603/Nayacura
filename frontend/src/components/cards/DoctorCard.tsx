import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarCheck2, Languages, MapPin, Video } from 'lucide-react';
import type { Doctor } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { getDemoStockPortrait } from '@/data/doctors';

export function DoctorCard({
  doctor,
  className,
  priority,
}: {
  doctor: Doctor;
  className?: string;
  priority?: boolean;
}) {
  const next = doctor.nextAvailable;
  const stockPortrait = getDemoStockPortrait(doctor);
  const portraitUrl = stockPortrait?.src ?? doctor.photoUrl;

  return (
    <article
      className={cn(
        'card-surface card-lift group flex h-full flex-col overflow-hidden',
        className,
      )}
    >
      <div className="relative aspect-[4/3.3] overflow-hidden bg-gradient-to-br from-plum to-burgundy/50">
        <div className={cn(
          'absolute inset-0 z-10 bg-gradient-to-t from-midnight to-transparent',
          stockPortrait ? 'via-midnight/75 via-25%' : 'via-transparent',
        )} />
        {portraitUrl ? (
          <img
            src={portraitUrl}
            alt={stockPortrait ? 'Stock portrait for a fictional profile' : `Illustrated portrait of fictional clinician ${doctor.name}`}
            style={stockPortrait?.position ? { objectPosition: stockPortrait.position } : undefined}
            loading={priority ? 'eager' : 'lazy'}
            className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
        ) : (
          <Avatar name={doctor.name} size="xl" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
        <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-1.5">
          {doctor.onlineEnabled && (
            <Badge tone="lavender" className="bg-midnight/65 backdrop-blur-md" dot>
              Video
            </Badge>
          )}
          <Badge tone="muted" className="bg-midnight/65 text-ivory/70 backdrop-blur-md">
            {stockPortrait ? 'Demo · Stock photo' : 'Demo profile'}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-4 right-4 z-20">
          <p className="font-body text-[9.5px] uppercase tracking-[0.18em] text-rose/90">
            {doctor.specializations[0]?.name}
          </p>
          <h3 className="mt-1 font-display text-[23px] leading-tight text-ivory">{doctor.name}</h3>
          <p className="mt-1 line-clamp-1 font-sans text-[10px] text-ivory/55">{doctor.title}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-body text-[11px] text-mauve">
          <span className="inline-flex items-center gap-1.5">
            <CalendarCheck2 className="h-3.5 w-3.5 text-lavender/80" />
            {doctor.experienceYears} yrs experience
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5 text-lavender/80" />
            {doctor.languages.slice(0, 2).join(', ')}
            {doctor.languages.length > 2 && ` +${doctor.languages.length - 2}`}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-body text-[11px] text-mauve">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-lavender/80" />
            {doctor.inPersonEnabled ? doctor.city : 'Online only'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-lavender/80" />
            {doctor.onlineEnabled && doctor.inPersonEnabled
              ? 'Video or in person'
              : doctor.onlineEnabled
                ? 'Video consultation'
                : 'In-person only'}
          </span>
        </div>

        <div className="my-4 fine-line" />

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-body text-[9px] uppercase tracking-[0.16em] text-mauve/65">
              Consultation fee
            </p>
            <p className="mt-1 font-sans text-lg font-semibold text-ivory">
              ₹{(doctor.feePaise / 100).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-body text-[9px] uppercase tracking-[0.16em] text-mauve/65">
              Next available
            </p>
            <p className="mt-1 font-sans text-[11px] font-semibold text-lavender">
              {next ? formatDate(next) : 'Check calendar'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            to={`/doctors/${doctor.slug}`}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-white/12 px-3 font-sans text-[10.5px] font-semibold text-ivory/85 transition-colors hover:border-lavender/35 hover:bg-white/[0.05]"
          >
            View profile <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <ButtonLink
            to={`/book?doctor=${doctor.slug}`}
            size="sm"
            className="min-h-10 w-full px-3 text-[10.5px]"
          >
            Book now
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

export function DoctorSkeleton() {
  return (
    <div className="card-surface h-[500px] overflow-hidden">
      <div className="skeleton h-[260px] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-10 w-full" />
      </div>
    </div>
  );
}
