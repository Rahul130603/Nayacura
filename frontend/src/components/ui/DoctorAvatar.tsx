import type { ComponentProps } from 'react';
import { getDemoStockPortrait } from '@/data/doctors';
import type { Doctor } from '@/types';
import { Avatar } from './Avatar';

type DoctorAvatarProps = Pick<ComponentProps<typeof Avatar>, 'size' | 'className'> & {
  doctor: Pick<Doctor, 'slug' | 'name'> & Partial<Pick<Doctor, 'isDemo' | 'photoUrl'>>;
};

export function DoctorAvatar({ doctor, size, className }: DoctorAvatarProps) {
  const portrait = getDemoStockPortrait(doctor);
  return (
    <Avatar
      name={doctor.name}
      src={portrait?.src ?? doctor.photoUrl}
      objectPosition={portrait?.position}
      size={size}
      className={className}
    />
  );
}
