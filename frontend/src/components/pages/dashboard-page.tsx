/**
 * DashboardPage — Authenticated home screen.
 *
 * Shows a personalised welcome, two CTA cards (Browse Films / Recommendation),
 * and two preview rows:
 *   - Recently Watched: last 5 history entries, sorted by watchedAt desc.
 *   - My Watchlist: last 5 watchlist entries, each with a "Mark as watched"
 *     quick-action button (calls logFilm with empty tags/prestige).
 *
 * All data comes from LibraryContext (GET /history and GET /watchlist).
 * Clicking a film card links to /films/:id for the full detail view.
 */
import { useState } from "react"
import { Link } from "react-router-dom"
import { Search, Wand2, ArrowRight } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useLibrary } from "@/context/LibraryContext"
import { FilmCard } from "@/components/film-card"
import { LogFilmDialog } from "@/components/log-film-dialog"
import { Button } from "@/components/ui/button"
import type { WatchlistEntry } from "@/types/api"

function FilmRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">{children}</div>
}

export function DashboardPage() {
  const { user } = useAuth()
  const { history, watchlist, logFilm } = useLibrary()
  const [logTarget, setLogTarget] = useState<WatchlistEntry | null>(null)

  // Most recently added first
  const recentHistory = [...history].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const recentWatchlist = [...watchlist].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Welcome back, {user?.username}!
          </h1>
          <p className="mt-2 max-w-lg text-pretty text-muted-foreground">
            Ready for tonight&apos;s film? Pick up where you left off or let us find the perfect match for your mood.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link to="/search" className="group">
              <div className="flex h-full min-h-[7rem] items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent text-primary transition-transform duration-200 group-hover:scale-110">
                  <Search className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h2 className="font-heading text-lg font-bold">Browse Films</h2>
                  <p className="text-sm text-muted-foreground">Search for a film and log what you watch.</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>

            <Link to="/recommendation" className="group">
              <div className="cta-gradient flex h-full min-h-[7rem] items-center gap-4 rounded-2xl border border-transparent p-6 text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6">
                  <Wand2 className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h2 className="font-heading text-lg font-bold">What to Watch Tonight?</h2>
                  <p className="text-sm text-primary-foreground/85">Answer 3 quick questions for a tailored pick.</p>
                </div>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Rows */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold">Recently Watched</h2>
            <Link to="/history" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <FilmRow>
            {recentHistory.slice(0, 5).map((entry) => (
              <FilmCard
                key={entry.tmdb_id}
                film={entry}
                tags={entry.tags}
                prestige={entry.prestige_tier}
                cycleTags
              />
            ))}
          </FilmRow>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold">My Watchlist</h2>
            <Link to="/watchlist" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <FilmRow>
            {recentWatchlist.slice(0, 5).map((entry) => (
              <FilmCard
                key={entry.tmdb_id}
                film={entry}
                footer={
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1.5 w-full gap-1"
                    onClick={() => setLogTarget(entry)}
                  >
                    Mark as watched
                  </Button>
              }
            />
          ))}
          </FilmRow>
        </section>
      </div>

      <LogFilmDialog
        film={logTarget ? {
          tmdb_id: logTarget.tmdb_id,
          title: logTarget.title ?? "",
          poster_url: logTarget.poster_url,
          year: logTarget.year,
          director: logTarget.director,
          synopsis: logTarget.synopsis,
          genres: logTarget.genres,
          cast: null,
          runtime: logTarget.runtime,
          streaming_platforms: null,
        } : null}
        open={logTarget !== null}
        onOpenChange={(isOpen) => !isOpen && setLogTarget(null)}
        onConfirm={(entry) => logTarget && logFilm(logTarget.tmdb_id, entry)}
      />
    </div>
  )
}
