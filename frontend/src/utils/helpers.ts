import { TMDB_IMAGE_BASE_URL, IMAGE_SIZES } from './constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(
  path: string | null,
  type: 'poster' | 'backdrop' | 'profile' = 'poster',
  size: 'small' | 'medium' | 'large' | 'xlarge' | 'original' = 'medium'
): string {
  if (!path) {
    return type === 'profile'
      ? 'https://via.placeholder.com/185x278?text=No+Image'
      : 'https://via.placeholder.com/500x750?text=No+Image';
  }

  const sizeMap = IMAGE_SIZES[type];
  const imageSize = sizeMap[size as keyof typeof sizeMap];

  return `${TMDB_IMAGE_BASE_URL}/${imageSize}${path}`;
}

export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatYear(dateString: string): string {
  return new Date(dateString).getFullYear().toString();
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatVoteCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return (current / total) * 100;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getYouTubeEmbedUrl(key: string): string {
  return `https://www.youtube.com/embed/${key}`;
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function formatCertification(certification: string): string {
  // Map US certifications to display format
  const certMap: Record<string, string> = {
    'G': 'G',
    'PG': 'PG',
    'PG-13': 'T13',
    'R': 'T16',
    'NC-17': 'T18',
    'NR': 'NR',
  };

  return certMap[certification] || certification;
}

export function getCertificationFromReleaseDates(
  releaseDates: { iso_3166_1: string; release_dates: { certification: string }[] }[] | undefined
): string | null {
  if (!releaseDates || releaseDates.length === 0) return null;

  // Try to get US certification first
  const usRelease = releaseDates.find((r) => r.iso_3166_1 === 'US');
  if (usRelease && usRelease.release_dates.length > 0) {
    const cert = usRelease.release_dates.find((rd) => rd.certification);
    if (cert?.certification) return formatCertification(cert.certification);
  }

  // Fallback to any certification
  for (const release of releaseDates) {
    const cert = release.release_dates.find((rd) => rd.certification);
    if (cert?.certification) return cert.certification;
  }

  return null;
}

export function getGenreNames(genreIds: number[], allGenres: { id: number; name: string }[]): string[] {
  if (!genreIds || !allGenres) return [];
  return genreIds
    .map((id) => allGenres.find((g) => g.id === id)?.name)
    .filter((name): name is string => !!name);
}

export function getPhimImageUrl(path?: string | null): string {
  if (!path) {
    return 'https://via.placeholder.com/500x750?text=No+Image';
  }

  if (path.startsWith('http')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `https://phimimg.com${normalizedPath}`;
}

