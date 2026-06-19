/**
 * ResultsPage - Recommendation results (step 3 of the recommendation flow).
 *
 * Displays mock recommendations sorted by match score descending, split into:
 *   - "Your Perfect Match": highest-scoring film - hero card with gold shimmer.
 *   - "You Might Also Like": films with match >= 85% - standard row cards.
 *   - "Give It a Try…": films with match < 85% - muted, smaller row cards.
 *
 * Each card shows the reason text, match %, platform badge, and an
 * "Add to watchlist" button (or a disabled "Saved" state if already in watchlist).
 *
 * Navigation: "Start over" returns to /recommendation, "Back to home" to /dashboard.
 *
 * TODO: replace static RECOMMENDATIONS with a real endpoint (POST /recommendations)
 * that takes mood answers + swipe choices and returns ranked film suggestions.
 */
import { Link, useNavigate } from "react-router-dom"
import { Plus, RotateCcw, Home, Bookmark, Check, Film, Sparkles, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLibrary } from "@/context/LibraryContext"
import { getFilm, PLATFORM_CHIP, RECOMMENDATIONS, type Recommendation } from "@/lib/mock-data"

export function ResultsPage() {
  const navigate = useNavigate()
  const { getStatus, addToWatchlist } = useLibrary()

  // Highest match score first so the very best pick becomes the hero.
  const ranked = [...RECOMMENDATIONS].sort((a, b) => b.match - a.match)
  const [perfectMatch, ...rest] = ranked

  // Split the remainder by prominence: strong matches vs. wildcards.
  const alsoLike = rest.filter((rec) => rec.match >= 85)
  const giveItATry = rest.filter((rec) => rec.match < 85)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-balance font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
        Here&apos;s what we found for you tonight 🎬
      </h1>
      <p className="mt-2 text-muted-foreground">
        {ranked.length > 0
          ? `${ranked.length} ${ranked.length === 1 ? "pick" : "picks"} tuned to your mood and platforms.`
          : "You've already seen all of tonight's picks."}
      </p>

      {ranked.length === 0 && (
        <Card className="mt-8 flex flex-col items-center gap-3 p-10 text-center">
          <Film className="h-10 w-10 text-muted-foreground" />
          <p className="text-pretty text-muted-foreground">
            Every film we&apos;d suggest is already in your viewing history. Start over to explore a different
            mood.
          </p>
        </Card>
      )}

      {perfectMatch && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#b8860b]" />
            <h2 className="font-heading text-lg font-extrabold tracking-tight">Your Perfect Match</h2>
          </div>
          <PerfectMatchCard
            rec={perfectMatch}
            inWatchlist={getStatus(perfectMatch.filmId as unknown as number) === "watchlist"}
            onAdd={() => addToWatchlist(perfectMatch.filmId as unknown as number)}
          />
        </section>
      )}

      {alsoLike.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-heading text-lg font-bold tracking-tight">You Might Also Like</h2>
          <div className="flex flex-col gap-4">
            {alsoLike.map((rec) => (
              <RecRow
                key={rec.filmId}
                rec={rec}
                inWatchlist={getStatus(rec.filmId as unknown as number) === "watchlist"}
                onAdd={() => addToWatchlist(rec.filmId as unknown as number)}
              />
            ))}
          </div>
        </section>
      )}

      {giveItATry.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-heading text-base font-semibold tracking-tight text-muted-foreground">
            Give It a Try…
          </h2>
          <div className="flex flex-col gap-3">
            {giveItATry.map((rec) => (
              <RecRow
                key={rec.filmId}
                rec={rec}
                muted
                inWatchlist={getStatus(rec.filmId as unknown as number) === "watchlist"}
                onAdd={() => addToWatchlist(rec.filmId as unknown as number)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="ghost" className="gap-1.5" onClick={() => navigate("/recommendation")}>
            <RotateCcw className="h-4 w-4" />
            Start over
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => navigate("/dashboard")}>
            <Home className="h-4 w-4" />
            Back to home
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Heading home closes this session - you won&apos;t be able to return to these recommendations.
        </p>
      </div>
    </div>
  )
}

function PerfectMatchCard({
  rec,
  inWatchlist,
  onAdd,
}: {
  rec: Recommendation
  inWatchlist: boolean
  onAdd: () => void
}) {
  const film = getFilm(rec.filmId)
  if (!film) return null

  return (
    <Card className="platinum-shine animate-platinum-glow relative flex flex-col gap-5 overflow-hidden border-[#d4af37]/50 bg-gradient-to-br from-background to-[#d4af37]/5 p-5 sm:flex-row sm:p-6">
      <Link to={`/films/${film.id}`} className="mx-auto shrink-0 sm:mx-0">
        <img
          src={film.poster || "/placeholder.svg"}
          alt={`${film.title} poster`}
          crossOrigin="anonymous"
          className="h-56 w-40 rounded-xl object-cover shadow-lg ring-1 ring-[#d4af37]/40"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#d4af37]/15 px-2.5 py-0.5 text-xs font-bold text-[#8a6d0b]">
            <Star className="h-3 w-3 fill-current" />
            Top pick · {rec.match}% match
          </span>
          {inWatchlist && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">
              <Bookmark className="h-3 w-3" />
              Already in your watchlist
            </span>
          )}
        </div>

        <div>
          <Link
            to={`/films/${film.id}`}
            className="font-heading text-xl font-extrabold leading-tight hover:text-primary sm:text-2xl"
          >
            {film.title}
          </Link>
          <span className="ml-2 text-sm text-muted-foreground">{film.year}</span>
        </div>

        <p className="text-pretty italic text-primary">{rec.reason}</p>

        <div className="mt-auto flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: PLATFORM_CHIP[rec.platform] }}
          >
            {rec.platform}
          </span>
          {inWatchlist ? (
            <Button variant="ghost" size="sm" disabled className="gap-1">
              <Check className="h-3.5 w-3.5" />
              Saved to watchlist
            </Button>
          ) : (
            <Button size="sm" className="gap-1" onClick={onAdd}>
              <Plus className="h-3.5 w-3.5" />
              Add to watchlist
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

function RecRow({
  rec,
  inWatchlist,
  onAdd,
  muted,
}: {
  rec: Recommendation
  inWatchlist: boolean
  onAdd: () => void
  muted?: boolean
}) {
  const film = getFilm(rec.filmId)
  if (!film) return null

  return (
    <Card
      className={`flex flex-row items-center gap-4 overflow-hidden p-3 sm:p-4 ${muted ? "bg-muted/30" : ""}`}
    >
      <Link to={`/films/${film.id}`} className="shrink-0">
        <img
          src={film.poster || "/placeholder.svg"}
          alt={`${film.title} poster`}
          crossOrigin="anonymous"
          className={`rounded-lg object-cover ring-1 ring-border ${muted ? "h-24 w-16" : "h-28 w-20"}`}
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/films/${film.id}`} className="font-heading text-base font-bold hover:text-primary">
            {film.title}
          </Link>
          <span className="text-sm text-muted-foreground">{film.year}</span>
          {inWatchlist && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">
              <Bookmark className="h-3 w-3" />
              Already in your watchlist
            </span>
          )}
        </div>

        <p className="text-pretty text-sm italic text-primary">{rec.reason}</p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              muted ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {rec.match}% match
          </span>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: PLATFORM_CHIP[rec.platform] }}
          >
            {rec.platform}
          </span>
        </div>
      </div>

      {inWatchlist ? (
        <Button variant="ghost" size="sm" disabled className="hidden shrink-0 gap-1 sm:flex">
          <Check className="h-3.5 w-3.5" />
          Saved
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="hidden shrink-0 gap-1 sm:flex" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Watchlist
        </Button>
      )}
    </Card>
  )
}
