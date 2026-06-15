/**
 * SearchPage — Film catalogue search.
 *
 * Two-state layout:
 *   - Empty state: centred search bar.
 *   - Results state: paginated grid (8 per page) of film cards.
 *
 * The search query is persisted in ?query= so navigating back from
 * a film detail page restores the previous search and results.
 *
 * Cards show a hover overlay with context-sensitive action buttons.
 * Clicking anywhere outside the buttons navigates to the film detail.
 * The overlay is rendered inside PosterFrame so it always tracks the
 * poster's position (including the hover translate animation).
 */
import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  Search as SearchIcon, Plus, Eye, Pencil, Trash2,
  Bookmark, Clock, ChevronLeft, ChevronRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PosterFrame } from "@/components/film-card"
import { LogFilmDialog } from "@/components/log-film-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useLibrary } from "@/context/LibraryContext"
import api from "@/services/api"
import type { Film } from "@/types/api"

const RESULTS_PER_PAGE = 8

export function SearchPage() {
  const { getStatus, getHistoryEntry, addToWatchlist, removeFromWatchlist, removeFromHistory, logFilm, updateLog } =
    useLibrary()
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialise from URL so navigating back from film detail restores the previous search
  const initialQuery = searchParams.get("query") ?? ""
  const [input, setInput] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Film[]>([])
  const [searching, setSearching] = useState(false)
  const [page, setPage] = useState(1)

  const [logTarget, setLogTarget] = useState<Film | null>(null)
  const [open, setOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{ film: Film; from: "watchlist" | "history" } | null>(null)

  // Fetch whenever query changes — also runs on mount to restore a URL-persisted search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    setSearching(true)
    setPage(1)
    api.get("/films/search", { params: { query } })
      .then((res) => setResults(res.data))
      .catch(() => setResults([]))
      .finally(() => setSearching(false))
  }, [query])

  const hasSearched = query.trim().length > 0

  const handleSearch = (q: string) => {
    setQuery(q)
    // replace: true keeps browser history clean — one entry per search, not one per keystroke
    setSearchParams(q.trim() ? { query: q } : {}, { replace: true })
  }

  const openLog = (film: Film) => {
    setLogTarget(film)
    setOpen(true)
  }

  const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE)
  const pagedResults = results.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE)

  return (
    <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6">
      {/* Centred search bar — collapses to top once a search is active */}
      <div
        className={
          hasSearched
            ? "w-full pt-8"
            : "flex min-h-[70vh] flex-col items-center justify-center text-center"
        }
      >
        {!hasSearched && (
          <h1 className="mb-6 text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            What did you watch?
          </h1>
        )}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(input) }}
          className={hasSearched ? "w-full" : "w-full max-w-xl"}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  if (e.target.value.trim() === "") {
                    setQuery("")
                    setSearchParams({}, { replace: true })
                    setResults([])
                  }
                }}
                placeholder="Search for a film…"
                aria-label="Search for a film"
                autoFocus
                className="h-14 pl-11 text-base focus-visible:border-primary focus-visible:ring-primary/25"
              />
            </div>
            {input.trim().length > 0 && (
              <Button type="submit" size="lg" className="h-14 shrink-0 gap-1.5 px-6 animate-fade-in-up">
                <SearchIcon className="h-5 w-5" />
                Search
              </Button>
            )}
          </div>
        </form>
      </div>

      {hasSearched && (
        <div className="py-8">
          <p className="mb-6 text-sm text-muted-foreground">
            {searching
              ? "Searching…"
              : `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"${totalPages > 1 ? ` — page ${page} of ${totalPages}` : ""}`}
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {pagedResults.map((film) => {
              const status = getStatus(film.tmdb_id)
              return (
                <div key={film.tmdb_id} className="flex flex-col gap-2">
                  {/*
                   * group is on the Link so the hover trigger and hover target
                   * are the same element. The overlay is passed as children to
                   * PosterFrame so it lives inside the same div that gets the
                   * translate animation — no alignment drift.
                   */}
                  <Link to={`/films/${film.tmdb_id}`} className="group block">
                    <PosterFrame
                      film={film}
                      className="shadow-sm ring-1 ring-border transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:ring-primary/40"
                    >
                      {/* Status badge */}
                      {status === "watchlist" && (
                        <span className="pointer-events-none absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-border">
                          <Bookmark className="h-3 w-3" />
                          In my watchlist
                        </span>
                      )}
                      {status === "watched" && (
                        <span className="pointer-events-none absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-border">
                          <Clock className="h-3 w-3" />
                          In my history
                        </span>
                      )}

                      {/*
                       * Overlay: the dark bg is part of the Link, so clicking it
                       * navigates. Buttons call preventDefault + stopPropagation
                       * to intercept only their own action.
                       */}
                      <div className="absolute inset-0 flex flex-col items-center justify-end gap-2 bg-foreground/55 px-3 pb-4 pt-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {status === "none" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-40 gap-1 bg-background"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToWatchlist(film.tmdb_id) }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add to watchlist
                            </Button>
                            <Button
                              size="sm"
                              className="w-40 gap-1"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLog(film) }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Log this film
                            </Button>
                          </>
                        )}
                        {status === "watchlist" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-40 gap-1 bg-background"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRemoveTarget({ film, from: "watchlist" }) }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </Button>
                            <Button
                              size="sm"
                              className="w-40 gap-1"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLog(film) }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Log this film
                            </Button>
                          </>
                        )}
                        {status === "watched" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-40 gap-1 bg-background"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRemoveTarget({ film, from: "history" }) }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </Button>
                            <Button
                              size="sm"
                              className="w-40 gap-1"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLog(film) }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit the log
                            </Button>
                          </>
                        )}
                      </div>
                    </PosterFrame>
                  </Link>

                  {/* Text below poster */}
                  <div>
                    <Link
                      to={`/films/${film.tmdb_id}`}
                      className="cursor-pointer font-heading text-sm font-semibold leading-tight transition-colors hover:text-primary"
                    >
                      {film.title}
                    </Link>
                    {film.year && <p className="text-xs text-muted-foreground">{film.year}</p>}
                    {film.genres && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {film.genres.slice(0, 2).map((g) => (
                          <Badge key={g} variant="outline" className="font-normal">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {!searching && results.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              No films match &ldquo;{query}&rdquo;.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <LogFilmDialog
        film={logTarget}
        open={open}
        onOpenChange={setOpen}
        initial={(() => {
          const h = logTarget ? getHistoryEntry(logTarget.tmdb_id) : undefined
          return h
            ? { tags: h.tags.map((tag) => tag.id), prestige_tier: h.prestige_tier, personal_note: h.personal_note ?? "" }
            : undefined
        })()}
        onConfirm={(entry) => {
          if (!logTarget) return
          getStatus(logTarget.tmdb_id) === "watched"
            ? updateLog(logTarget.tmdb_id, entry)
            : logFilm(logTarget.tmdb_id, entry)
        }}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(isOpen) => !isOpen && setRemoveTarget(null)}
        title={removeTarget?.from === "history" ? "Remove from history?" : "Remove from watchlist?"}
        description={
          removeTarget?.from === "history" ? (
            <>
              This will permanently delete your log for{" "}
              <span className="font-semibold text-foreground">{removeTarget?.film.title}</span>, including its
              prestige tier, tags and note. This can&apos;t be undone.
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">{removeTarget?.film.title}</span> will be removed
              from your watchlist. You can always add it back later.
            </>
          )
        }
        confirmLabel={removeTarget?.from === "history" ? "Delete log" : "Remove"}
        onConfirm={() => {
          if (!removeTarget) return
          if (removeTarget.from === "history") removeFromHistory(removeTarget.film.tmdb_id)
          else removeFromWatchlist(removeTarget.film.tmdb_id)
        }}
      />
    </div>
  )
}
