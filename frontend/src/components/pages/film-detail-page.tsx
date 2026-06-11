/**
 * FilmDetailPage — Full film detail view, reachable from any card or search result.
 *
 * Hero section: blurred backdrop, poster, meta (year/director/runtime), genres,
 * synopsis, and context-sensitive action buttons that adapt to the film's status:
 *   - "none"      → Add to watchlist | Log this film
 *   - "watchlist" → Remove from watchlist | Log this film
 *   - "watched"   → Remove from history  | Edit the log
 *
 * Diary entry section (shown only when status === "watched"):
 * displays the stored prestige tier, mood tags, and personal note with an Edit button.
 *
 * Back button calls navigate(-1) to preserve the scroll position of the previous page
 * (important when returning from the recommendation results list).
 *
 * TODO: replace getFilm() with GET /films/{tmdb_id} and library reads with
 * GET /history / GET /watchlist when connecting to the backend.
 */
import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Plus, Clapperboard, Pencil, ArrowLeft, Trash2, Bookmark, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TagChip } from "@/components/film-card"
import { LogFilmDialog } from "@/components/log-film-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useLibrary } from "@/components/library-context"
import { getFilm, PRESTIGE_TIERS, type LogEntry } from "@/lib/mock-data"

export function FilmDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const film = id ? getFilm(id) : undefined
  const { getStatus, getHistoryEntry, addToWatchlist, removeFromWatchlist, removeFromHistory, logFilm } =
    useLibrary()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<"watchlist" | "history" | null>(null)

  if (!film) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Film not found.</p>
        <Button render={<Link to="/search" />} nativeButton={false} className="mt-4">
          Back to search
        </Button>
      </div>
    )
  }

  const status = getStatus(film.id)
  const entry = getHistoryEntry(film.id)
  const prestige = entry?.prestige ? PRESTIGE_TIERS.find((p) => p.id === entry.prestige) : null

  // Go back to wherever the user came from (results, watchlist, dashboard, …)
  // so the recommendation list and its scroll position are preserved.
  const goBack = () => navigate(-1)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img
            src={film.backdrop || "/placeholder.svg"}
            alt=""
            crossOrigin="anonymous"
            className="h-full w-full scale-110 object-cover blur-2xl"
          />
          <div className="absolute inset-0 bg-background/80" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            <img
              src={film.poster || "/placeholder.svg"}
              alt={`${film.title} poster`}
              crossOrigin="anonymous"
              className="mx-auto w-44 shrink-0 rounded-xl shadow-xl ring-1 ring-border sm:mx-0"
            />

            <div className="flex flex-1 flex-col">
              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">{film.title}</h1>
              <p className="mt-1 text-muted-foreground">
                {film.year} · Directed by {film.director} · {film.runtime}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {film.genres.map((g) => (
                  <Badge key={g} variant="outline" className="font-normal">
                    {g}
                  </Badge>
                ))}
              </div>

              <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-foreground/80">{film.synopsis}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                {status === "none" && (
                  <Button variant="outline" size="lg" className="gap-1.5" onClick={() => addToWatchlist(film.id)}>
                    <Plus className="h-4 w-4" />
                    Add to watchlist
                  </Button>
                )}
                {status === "watchlist" && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-1.5"
                    onClick={() => setConfirm("watchlist")}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove from watchlist
                  </Button>
                )}
                {status === "watched" && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-1.5"
                    onClick={() => setConfirm("history")}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove from history
                  </Button>
                )}

                <Button size="lg" className="gap-1.5" onClick={() => setOpen(true)}>
                  {status === "watched" ? (
                    <>
                      <Pencil className="h-4 w-4" />
                      Edit the log
                    </>
                  ) : status === "watchlist" ? (
                    <>
                      <Clapperboard className="h-4 w-4" />
                      Log this film
                    </>
                  ) : (
                    <>
                      <Clapperboard className="h-4 w-4" />
                      Log this movie
                    </>
                  )}
                </Button>
              </div>

              {status === "watchlist" && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Bookmark className="h-3.5 w-3.5 text-primary" />
                  In your watchlist — logging it will move it to your history.
                </p>
              )}
              {status === "watched" && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                  Already in your history.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      {entry && (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold">Your diary entry</h2>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>

              <div className="flex flex-col gap-4">
                {prestige && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Prestige tier:</span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-accent px-3 py-1 text-sm font-semibold text-primary">
                      <span aria-hidden>{prestige.emoji}</span>
                      {prestige.label}
                    </span>
                  </div>
                )}

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags.map((t) => (
                      <TagChip key={t} label={t} />
                    ))}
                  </div>
                )}

                {entry.note && (
                  <p className="border-l-2 border-primary/40 pl-3 text-pretty italic leading-relaxed text-foreground/80">
                    &ldquo;{entry.note}&rdquo;
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <LogFilmDialog
        film={film}
        open={open}
        onOpenChange={setOpen}
        initial={entry ? { tags: entry.tags, prestige: entry.prestige, note: entry.note ?? "" } : undefined}
        onConfirm={(e: LogEntry) => logFilm(film.id, e)}
      />

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={confirm === "history" ? "Remove from history?" : "Remove from watchlist?"}
        description={
          confirm === "history" ? (
            <>
              This will permanently delete your log for{" "}
              <span className="font-semibold text-foreground">{film.title}</span>, including its prestige tier,
              tags and note. This can&apos;t be undone.
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">{film.title}</span> will be removed from your
              watchlist. You can always add it back later.
            </>
          )
        }
        confirmLabel={confirm === "history" ? "Delete log" : "Remove"}
        onConfirm={() => {
          if (confirm === "history") removeFromHistory(film.id)
          else removeFromWatchlist(film.id)
        }}
      />
    </div>
  )
}
