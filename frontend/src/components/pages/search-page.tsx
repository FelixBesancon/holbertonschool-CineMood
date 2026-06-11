/**
 * SearchPage — Film catalogue search.
 *
 * Two-state layout:
 *   - Empty state: centred search bar (before the user submits a query).
 *   - Results state: compact grid of film cards with hover overlays.
 *
 * Each result card shows an overlay with context-sensitive actions:
 *   - "none"      → Add to watchlist | Log this film
 *   - "watchlist" → Remove from watchlist | Log this film
 *   - "watched"   → Remove from history | Edit the log
 *
 * LogFilmDialog is opened for logging/editing; ConfirmDialog is opened
 * for destructive removes. State is read from and written to LibraryContext.
 *
 * Search currently filters the static FILMS array by title, director, and
 * genre (client-side). TODO: replace with GET /films/search?q=... once the
 * backend is connected.
 */
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search as SearchIcon, Plus, Eye, Pencil, Trash2, Bookmark, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PosterFrame } from "@/components/film-card"
import { LogFilmDialog } from "@/components/log-film-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useLibrary } from "@/components/library-context"
import { FILMS, type Film, type LogEntry } from "@/lib/mock-data"

export function SearchPage() {
  const { getStatus, getHistoryEntry, addToWatchlist, removeFromWatchlist, removeFromHistory, logFilm } =
    useLibrary()
  const [input, setInput] = useState("")
  const [query, setQuery] = useState("")
  const [logTarget, setLogTarget] = useState<Film | null>(null)
  const [open, setOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{ film: Film; from: "watchlist" | "history" } | null>(null)

  const hasSearched = query.trim().length > 0

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return FILMS.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.director.toLowerCase().includes(q) ||
        f.genres.some((g) => g.toLowerCase().includes(q)),
    )
  }, [query])

  const openLog = (film: Film) => {
    setLogTarget(film)
    setOpen(true)
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6">
      {/* Centered search bar */}
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
          onSubmit={(e) => {
            e.preventDefault()
            setQuery(input)
          }}
          className={hasSearched ? "w-full" : "w-full max-w-xl"}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  if (e.target.value.trim() === "") setQuery("")
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
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((film) => {
              const status = getStatus(film.id)
              return (
                <div key={film.id} className="group flex flex-col gap-2">
                  <div className="relative">
                    <Link to={`/films/${film.id}`} className="block cursor-pointer">
                      <PosterFrame
                        film={film}
                        className="shadow-sm ring-1 ring-border transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:ring-primary/40"
                      />
                    </Link>

                    {/* Saved-status badge */}
                    {status === "watchlist" && (
                      <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-border">
                        <Bookmark className="h-3 w-3" />
                        In my watchlist
                      </span>
                    )}
                    {status === "watched" && (
                      <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-border">
                        <Clock className="h-3 w-3" />
                        In my history
                      </span>
                    )}

                    {/* hover overlay — buttons depend on the film's status */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-foreground/55 p-3 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                      {status === "none" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-40 gap-1 bg-background"
                            onClick={() => addToWatchlist(film.id)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add to watchlist
                          </Button>
                          <Button size="sm" className="w-40 gap-1" onClick={() => openLog(film)}>
                            <Eye className="h-3.5 w-3.5" />
                            Log this movie
                          </Button>
                        </>
                      )}
                      {status === "watchlist" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-40 gap-1 bg-background"
                            onClick={() => setRemoveTarget({ film, from: "watchlist" })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove from watchlist
                          </Button>
                          <Button size="sm" className="w-40 gap-1" onClick={() => openLog(film)}>
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
                            onClick={() => setRemoveTarget({ film, from: "history" })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove from history
                          </Button>
                          <Button size="sm" className="w-40 gap-1" onClick={() => openLog(film)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit the log
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <Link
                      to={`/films/${film.id}`}
                      className="cursor-pointer font-heading text-sm font-semibold leading-tight transition-colors hover:text-primary"
                    >
                      {film.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{film.year}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {film.genres.slice(0, 2).map((g) => (
                        <Badge key={g} variant="outline" className="font-normal">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {results.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              No films match &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>
      )}

      <LogFilmDialog
        film={logTarget}
        open={open}
        onOpenChange={setOpen}
        initial={(() => {
          const h = logTarget ? getHistoryEntry(logTarget.id) : undefined
          return h ? { tags: h.tags, prestige: h.prestige, note: h.note ?? "" } : undefined
        })()}
        onConfirm={(entry: LogEntry) => logTarget && logFilm(logTarget.id, entry)}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
        title={
          removeTarget?.from === "history" ? "Remove from history?" : "Remove from watchlist?"
        }
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
          if (removeTarget.from === "history") removeFromHistory(removeTarget.film.id)
          else removeFromWatchlist(removeTarget.film.id)
        }}
      />
    </div>
  )
}
