import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(paise: number) {
  return INR.format(paise / 100);
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  }).format(new Date(iso));
}

export function formatTime(iso: string, timeZone?: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, timeZone?: string) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(iso));
}

export function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}

export function readingTime(text: string) {
  return Math.max(3, Math.ceil(text.split(/\s+/).length / 210));
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : plural || `${singular}s`;
}

export function safeNext(path: string | null | undefined, fallback = '/dashboard') {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return fallback;
  return path;
}
