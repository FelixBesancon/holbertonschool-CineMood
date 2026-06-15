/**
 * Film card primitives — reusable building blocks for displaying film data.
 *
 * Exports:
 *   - TagChip: a small coloured pill for a single mood tag.
 *   - ScrollingTags: a CSS-marquee carousel of mood tags (falls back to a
 *     single static chip when only one tag is present).
 *   - PosterFrame: a 2:3 aspect-ratio container with a hover scale effect.
 *     Accepts children so callers can overlay badges or buttons.
 *   - FilmCard: full vertical card — poster, prestige badge, title, year,
 *     optional tags (static or scrolling), and an optional footer slot.
 *
 * TAG_COLORS maps known mood tag labels to Tailwind colour classes.
 * Unmapped tags fall back to the neutral secondary palette.
 */
import { useState } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { PRESTIGE_RECORD } from "@/lib/constants"
import type { Tag } from "@/types/api"

interface Film {
  tmdb_id: number
  title: string | null
  poster_url: string | null
}

const TAG_COLORS: Record<string, string> = {
  "Feel-Good Movie":      "bg-green-100 text-green-700",
  "Heartwarming":         "bg-pink-100 text-pink-700",
  "Heartbreaking":        "bg-slate-100 text-slate-700",
  "Hilarious":            "bg-yellow-100 text-yellow-700",
  "Terrifying":           "bg-red-100 text-red-800",
  "Fun Jump Scares":      "bg-orange-100 text-orange-700",
  "Meh":                  "bg-zinc-100 text-zinc-500",
  "All That for What?":   "bg-purple-100 text-purple-700",
  "Epic":                 "bg-blue-200 text-blue-800",
  "Cozy Watch":           "bg-amber-100 text-amber-700",
  "Unsettling":           "bg-teal-100 text-teal-700",
  "Bittersweet":          "bg-violet-100 text-violet-700",
  "Mind-Blowing":         "bg-accent text-primary",
  "Hidden Gem":           "bg-emerald-100 text-emerald-700",
  "Cult Classic":         "bg-indigo-100 text-indigo-800",
  "Must-See":             "bg-red-100 text-red-700",
  "Nostalgia Hit":        "bg-amber-50 text-amber-800",
  "Hasn't Aged Well":     "bg-stone-100 text-stone-500",
  "Rewatchable":          "bg-lime-100 text-lime-700",
  "Masterpiece":          "bg-yellow-200 text-yellow-800",
  "I Can Die Now":        "bg-purple-200 text-purple-900",
  "Guilty Pleasure":      "bg-fuchsia-100 text-fuchsia-700",
  "So Stupid It's Good":  "bg-lime-200 text-lime-800",
  "Perfect for a Date":   "bg-rose-100 text-rose-700",
  "Crowd Pleaser":        "bg-sky-100 text-sky-700",
  "Family Friendly":      "bg-blue-100 text-blue-600",
  "Conversation Starter": "bg-cyan-100 text-cyan-700",
  "Late-Night Watch":     "bg-indigo-200 text-indigo-900",
  "Underrated":           "bg-emerald-200 text-emerald-800",
  "Overrated":            "bg-orange-100 text-orange-700",
  "Perfect Cast":         "bg-yellow-100 text-yellow-700",
  "Amazing Script":       "bg-sky-200 text-sky-800",
  "Visual Feast":         "bg-pink-200 text-pink-800",
  "Great Soundtrack":     "bg-violet-200 text-violet-800",
  "Comfort Movie":        "bg-amber-200 text-amber-800",
  "Emotional Damage":     "bg-blue-100 text-blue-700",
  "What Did I Just Watch?": "bg-fuchsia-200 text-fuchsia-900",
  "Slow Burn":            "bg-orange-200 text-orange-800",
  "Too Long":             "bg-slate-200 text-slate-600",
  "Surprisingly Good":    "bg-green-200 text-green-800",
  "Pure Chaos":           "bg-red-200 text-red-800",
  "Badass":               "bg-zinc-200 text-zinc-800",
  "Smart and Clever":     "bg-indigo-100 text-indigo-700",
  "Beautifully Weird":    "bg-fuchsia-100 text-fuchsia-800",
  "Instant Classic":      "bg-yellow-300 text-yellow-900",
  "Not for Me":           "bg-stone-200 text-stone-600",
  "Great Villain":        "bg-red-200 text-red-900",
  "Strong Ending":        "bg-emerald-300 text-emerald-900",
  "Weak Ending":          "bg-rose-200 text-rose-700",
  "Vibe Over Plot":       "bg-violet-300 text-violet-900",
}

export function TagChip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        TAG_COLORS[label] ?? "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {label}
    </span>
  )
}

// Continuously scrolls tags to the left with faded edges, like a carousel.
// Tags are duplicated so the loop is seamless. Falls back to a static chip for a single tag.
export function ScrollingTags({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null
  if (tags.length === 1) {
    return (
      <div className="flex min-h-[20px]">
        <TagChip label={tags[0].name} />
      </div>
    )
  }

  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
    maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
  }

  return (
    <div className="tag-marquee-viewport min-h-[20px] overflow-hidden" style={maskStyle}>
      <div
        className="tag-marquee-track flex w-max"
        style={{ animation: "tag-marquee 14s linear infinite" }}
      >
        {[...tags, ...tags].map((t, i) => (
          <TagChip key={`${t.id}-${i}`} label={t.name} className="mr-1 shrink-0" />
        ))}
      </div>
    </div>
  )
}

function PrestigeBadge({ prestige }: { prestige: string }) {
  const tier = PRESTIGE_RECORD[prestige]
  if (!tier) return null
  return (
    <span
      className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-0.5 rounded-full bg-background/85 px-1.5 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm"
      title={`${tier.label} tier`}
    >
      <span aria-hidden>{tier.emoji}</span>
      <span className="sr-only">{tier.label} tier</span>
    </span>
  )
}

export function PosterFrame({
  film,
  className,
  children,
}: {
  film: Film
  className?: string
  children?: React.ReactNode
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className={cn("relative aspect-[2/3] overflow-hidden rounded-lg bg-black", className)}>
      {film.poster_url && !imgError ? (
        <img
          src={film.poster_url}
          alt={`${film.title ?? ""} poster`}
          crossOrigin="anonymous"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center px-3 text-center">
          <span className="font-heading text-base font-bold leading-tight text-red-500">
            {film.title}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}

export function FilmCard({
  film,
  tags,
  cycleTags,
  prestige,
  footer,
  className,
}: {
  film: Film
  tags?: Tag[]        // plus string[], maintenant objets Tag
  prestige?: string | null
  cycleTags?: boolean
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("group flex flex-col gap-2", className)}>
      <Link
        to={`/films/${film.tmdb_id}`}
        className="group/card block cursor-pointer rounded-lg transition-all duration-200"
      >
        <PosterFrame
          film={film}
          className="shadow-sm ring-1 ring-border transition-all duration-200 group-hover/card:-translate-y-1 group-hover/card:shadow-lg group-hover/card:ring-primary/40"
        >
          {prestige && <PrestigeBadge prestige={prestige} />}
        </PosterFrame>
        <div className="mt-2 flex flex-col gap-1">
          <span className="font-heading text-sm font-semibold leading-tight transition-colors group-hover/card:text-primary">
            {film.title}
          </span>
          {tags && tags.length > 0 && (
            <div className="mt-0.5">
              {cycleTags ? (
                <ScrollingTags tags={tags} />
              ) : (
                <div className="flex min-h-[20px] flex-wrap gap-1">
                  {tags.map((t) => (
                     <TagChip key={t.id} label={t.name} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
      {footer}
    </div>
  )
}
