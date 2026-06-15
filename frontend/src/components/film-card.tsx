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
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { Tag } from "@/types/api"

interface Film {
  tmdb_id: number
  title: string | null
  poster_url: string | null
}

const TAG_COLORS: Record<string, string> = {
  "Mind blowing": "bg-accent text-primary",
  "Guilty pleasure": "bg-amber-100 text-amber-700",
  "Would rewatch immediately": "bg-emerald-100 text-emerald-700",
  "Emotional wreck": "bg-blue-100 text-blue-700",
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
  const TIERS: Record<string, { emoji: string; label: string }> = {
    platinum: { emoji: "💎", label: "Platinum" },
    gold: { emoji: "🥇", label: "Gold" },
    silver: { emoji: "🥈", label: "Silver" },
    bronze: { emoji: "🥉", label: "Bronze" },
    trash: { emoji: "🗑️", label: "Trash" },
  }
  const tier = TIERS[prestige]
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
  return (
    <div className={cn("relative aspect-[2/3] overflow-hidden rounded-lg bg-muted", className)}>
      <img
        src={film.poster_url || "/placeholder.svg"}
        alt={`${film.title ?? ""} poster`}
        crossOrigin="anonymous"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
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
