import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 60) + '-' + Math.random().toString(36).substring(2, 8);
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return 'GT';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function getDaysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    sightseeing: 'badge-terracotta',
    culture: 'badge-terracotta',
    food: 'badge-ochre',
    meals: 'badge-ochre',
    nature: 'badge-sage',
    adventure: 'badge-sage',
    shopping: 'badge-ink',
    entertainment: 'badge-ink',
    relaxation: 'badge-dusty',
    transport: 'badge-ink',
    accommodation: 'badge-terracotta',
    activities: 'badge-sage',
    other: 'badge-ink',
  };
  return map[category?.toLowerCase()] ?? 'badge-ink';
}

export function getCategoryDot(category: string): string {
  const map: Record<string, string> = {
    sightseeing: 'bg-terracotta-500',
    culture: 'bg-terracotta-500',
    food: 'bg-ochre-400',
    meals: 'bg-ochre-400',
    nature: 'bg-sage-500',
    adventure: 'bg-sage-400',
    shopping: 'bg-ink-200',
    entertainment: 'bg-ink-50',
    relaxation: 'bg-dusty-400',
    transport: 'bg-sand-500',
    accommodation: 'bg-terracotta-300',
    activities: 'bg-sage-500',
    other: 'bg-sand-400',
  };
  return map[category?.toLowerCase()] ?? 'bg-sand-400';
}

// Unsplash destination images (free, no auth required)
export const DESTINATION_IMAGES: Record<string, string> = {
  tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  paris: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  barcelona: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80',
  amsterdam: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  singapore: 'https://images.unsplash.com/photo-1555217851-6141535bd771?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
};

export function getDestinationImage(cityName: string, imageUrl?: string | null): string {
  if (imageUrl) return imageUrl;
  const key = cityName?.toLowerCase();
  return DESTINATION_IMAGES[key] ?? DESTINATION_IMAGES.default;
}
