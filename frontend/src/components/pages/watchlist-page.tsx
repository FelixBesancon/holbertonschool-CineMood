/**
 * WatchlistPage - Films saved for later viewing.
 *
 * Displays all watchlist entries as cards: poster, title, year/director,
 * and genre badges. Sorting options: Date added (default) | A–Z.
 * Clicking a card opens the LogFilmDialog - confirming logs the film and
 * removes it from the watchlist (mark-as-watched flow via logFilm).
 * The trash button opens a ConfirmDialog before calling removeFromWatchlist.
 *
 * Data comes from LibraryContext (GET /watchlist).
 */
import { useMemo, useState } from "react"
import { Info, Bookmark, PenLine, Trash2 } from "lucide-react"
import { cn, formatRuntime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { PosterFrame } from "@/components/film-card"
import { LogFilmDialog } from "@/components/log-film-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useLibrary } from "@/context/LibraryContext"
import type { WatchlistEntry, Film } from "@/types/api"

function entryAsFilm(entry: WatchlistEntry): Film {
  return {
    tmdb_id: entry.tmdb_id,
    title: entry.title ?? "",
    poster_url: entry.poster_url,
    year: entry.year ?? null,
    director: entry.director ?? null,
    synopsis: entry.synopsis ?? null,
    genres: entry.genres ?? null,
    runtime: entry.runtime ?? null,
    cast: null,
    streaming_platforms: null,
  }
}

type SortKey = "date" | "alpha"

const SORTS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Date added" },
  { key: "alpha", label: "A–Z" },
]

export function WatchlistPage() {
  const { watchlist, removeFromWatchlist, logFilm } = useLibrary()
  const [logTarget, setLogTarget] = useState<WatchlistEntry | null>(null)
  const [open, setOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<WatchlistEntry | null>(null)
  const [sort, setSort] = useState<SortKey>("date")

  const entries = useMemo(() => {
    const list = [...watchlist]
    if (sort === "alpha") {
      list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
    } else {
      list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    }
    return list
  }, [watchlist, sort])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">My Watchlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">{watchlist.length} films saved for later.</p>

      {/* Controls + log hint */}
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
          Click on a movie to log it
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {entries.map((entry) => {
          return (
            <div
              key={entry.tmdb_id}
              className="group relative flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              {/* Whole-card log trigger */}
              <button
                type="button"
                aria-label={`Log ${entry.title}`}
                onClick={() => {
                  setLogTarget(entry)
                  setOpen(true)
                }}
                className="absolute inset-0 z-0 cursor-pointer"
              />

              <div className="pointer-events-none relative z-10 block w-20 shrink-0 sm:w-24">
                <PosterFrame film={entry} className="ring-1 ring-border" />
              </div>

              <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col">
                <span className="font-heading text-base font-bold leading-tight transition-colors group-hover:text-primary">
                  {entry.title}
                </span>

                {(entry.year || entry.director || entry.runtime) && (
                  <p className="text-xs text-muted-foreground">
                    {[entry.year, entry.director, formatRuntime(entry.runtime)].filter(Boolean).join(" · ")}
                  </p>
                )}

                {entry.genres && entry.genres.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {entry.genres.slice(0, 3).map((g) => (
                      <Badge key={g} variant="outline" className="font-normal">
                        {g}
                      </Badge>
                    ))}
                  </div>
                )}

                {entry.synopsis && (
                  <p className="mt-2 line-clamp-3 text-pretty text-sm italic text-muted-foreground">
                    {entry.synopsis}
                  </p>
                )}
              </div>

              {/* Remove from watchlist */}
              <button
                type="button"
                aria-label={`Remove ${entry.title} from watchlist`}
                onClick={() => setRemoveTarget(entry)}
                className="relative z-10 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center self-start rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Hover affordance - modern "click to log" pill, pinned bottom-right */}
              <div className="pointer-events-none absolute bottom-3 right-3 z-10">
                <span className="flex translate-y-1 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                  <PenLine className="h-3.5 w-3.5" />
                  Click to log
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {watchlist.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <Bookmark className="h-8 w-8" />
          <p>Your watchlist is empty.</p>
        </div>
      )}

      <LogFilmDialog
        film={logTarget ? entryAsFilm(logTarget) : null}
        open={open}
        onOpenChange={setOpen}
        onConfirm={(entry) => logTarget && logFilm(logTarget.tmdb_id, entry)}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(isOpen) => !isOpen && setRemoveTarget(null)}
        title="Remove from watchlist?"
        description={
          <>
            <span className="font-semibold text-foreground">{removeTarget?.title}</span> will be removed from
            your watchlist. You can always add it back later.
          </>
        }
        confirmLabel="Remove"
        onConfirm={() => removeTarget && removeFromWatchlist(removeTarget.tmdb_id)}
      />
    </div>
  )
}
