import type { Drawable } from 'roughjs/bin/core';

interface CacheEntry {
  version: number;
  drawable: Drawable;
}

const cache = new Map<string, CacheEntry>();

export function getCachedDrawable(
  elementId: string,
  elementVersion: number,
): Drawable | null {
  const entry = cache.get(elementId);
  if (entry && entry.version === elementVersion) {
    return entry.drawable;
  }
  return null;
}

export function setCachedDrawable(
  elementId: string,
  elementVersion: number,
  drawable: Drawable,
): void {
  cache.set(elementId, { version: elementVersion, drawable });
}

export function deleteCachedDrawable(elementId: string): void {
  cache.delete(elementId);
}

export function clearShapeCache(): void {
  cache.clear();
}
