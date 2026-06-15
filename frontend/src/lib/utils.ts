/**
 * utils.ts — Shared utility helpers.
 *
 * cn(): merges Tailwind class names with clsx (conditional classes) and
 * tailwind-merge (deduplication of conflicting utilities like p-2 vs p-4).
 * Used throughout the component tree as the canonical className builder.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Converts a runtime in minutes to a human-readable string (e.g. 1h45 or 32mn). */
export function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}mn`
}
