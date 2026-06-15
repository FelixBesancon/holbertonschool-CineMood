/**
 * HistoryPage — User's full viewing diary.
 *
 * Displays all history entries as rich cards: poster, prestige badge,
 * mood tags, personal note, and watched date. A platinum entry gets a
 * golden shimmer animation (animate-platinum-glow / platinum-shine).
 *
 * Sorting options: Prestige tier (default) | A–Z | Viewing date.
 * Clicking a card navigates to /films/:id for editing the log entry.
 * The trash button opens a ConfirmDialog before calling removeFromHistory.
 *
 * Data comes from LibraryContext (mock). TODO: replace with GET /history
 * and DELETE /history/{tmdb_id} when connecting to the backend.
 */
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Info, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { PosterFrame, TagChip } from "@/components/film-card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useLibrary } from "@/context/LibraryContext"
import { getFilm, PRESTIGE_TIERS, PRESTIGE_RANK, type Film } from "@/lib/mock-data"

const prestigeOf = (id: string) => PRESTIGE_TIERS.find((p) => p.id === id)

type SortKey = "prestige" | "alpha" | "date"

const SORTS: { key: SortKey; label: string }[] = [
  { key: "prestige", label: "Prestige tier" },
  { key: "alpha", label: "A–Z" },
  { key: "date", label: "Viewing date" },
]

// Subtle per-tier accent styling for the card frame.
const TIER_STYLE: Record<string, string> = {
  platinum: "border-amber-300 bg-amber-50/40",
  gold: "border-amber-200",
  silver: "border-zinc-200",
  bronze: "border-orange-200/70",
  trash: "border-border opacity-90",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
}

export function HistoryPage() {
  const navigate = useNavigate()
  const { history, removeFromHistory } = useLibrary()
  const [sort, setSort] = useState<SortKey>("prestige")
  const [removeTarget, setRemoveTarget] = useState<Film | null>(null)

  const entries = useMemo(() => {
    const list = [...history]
    if (sort === "alpha") {
      list.sort((a, b) => (getFilm(a.filmId)?.title ?? "").localeCompare(getFilm(b.filmId)?.title ?? ""))
    } else if (sort === "date") {
      list.sort((a, b) => +new Date(b.watchedAt) - +new Date(a.watchedAt))
    } else {
      list.sort((a, b) => PRESTIGE_RANK[a.prestige] - PRESTIGE_RANK[b.prestige])
    }
    return list
  }, [history, sort])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">My History</h1>
      <p className="mt-1 text-sm text-muted-foreground">{history.length} films logged in your diary.</p>

      {/* Controls + edit hint */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                sort === s.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Info className="h-4 w-4 text-primary" />
          Click on a movie to edit the log
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {entries.map((entry) => {
          const film = getFilm(entry.filmId)
          if (!film) return null
          const tier = prestigeOf(entry.prestige)
          const isPlatinum = entry.prestige === "platinum"
          return (
            <div
              key={entry.filmId}
              className={cn(
                "group relative flex gap-4 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                TIER_STYLE[entry.prestige] ?? "border-border",
                isPlatinum && "animate-platinum-glow platinum-shine",
              )}
            >
              {/* Whole-card edit trigger */}
              <button
                type="button"
                aria-label={`Edit log for ${film.title}`}
                onClick={() => navigate(`/films/${film.id}`)}
                className="absolute inset-0 z-0 cursor-pointer"
              />

              <div className="pointer-events-none relative z-10 block w-20 shrink-0 sm:w-24">
                <PosterFrame film={film} className="ring-1 ring-border" />
              </div>

              <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-heading text-base font-bold leading-tight group-hover:text-primary">
                      {film.title}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {film.year} · {film.director}
                    </p>
                  </div>
                  {tier && (
                    <Badge
                      variant="secondary"
                      className={cn("shrink-0 gap-1", isPlatinum && "bg-amber-100 text-amber-800")}
                    >
                      <span aria-hidden>{tier.emoji}</span>
                      {tier.label}
                    </Badge>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.tags.map((t) => (
                    <TagChip key={t} label={t} />
                  ))}
                </div>

                {entry.note && (
                  <p className="mt-2 text-pretty text-sm italic text-muted-foreground">
                    &ldquo;{entry.note}&rdquo;
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">Watched {formatDate(entry.watchedAt)}</p>
              </div>

              {/* Remove from history */}
              <button
                type="button"
                aria-label={`Remove ${film.title} from history`}
                onClick={() => setRemoveTarget(film)}
                className="relative z-10 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center self-start rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Hover affordance — modern "click to edit" pill, pinned bottom-right */}
              <div className="pointer-events-none absolute bottom-3 right-3 z-10">
                <span className="flex translate-y-1 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                  <Pencil className="h-3.5 w-3.5" />
                  Click to edit your log
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {history.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">No films logged yet.</div>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
        title="Remove from history?"
        description={
          <>
            This will permanently delete your log for{" "}
            <span className="font-semibold text-foreground">{removeTarget?.title}</span>, including its prestige
            tier, tags and note. This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete log"
        onConfirm={() => removeTarget && removeFromHistory(removeTarget.id)}
      />
    </div>
  )
}
