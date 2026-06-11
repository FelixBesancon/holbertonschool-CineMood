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
