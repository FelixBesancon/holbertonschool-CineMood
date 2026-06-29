/**
 * ResultsPage - Recommendation results (step 3 of the recommendation flow).
 *
 * Reads a RecommendationResponse from React Router location state
 * (passed by SwipePage after POST /recommendations/refine).
 *
 * Displays:
 *   - "Your Perfect Match": highest-scoring film — hero card with gold shimmer.
 *   - "Suggestions": up to 4 films from the pool, sorted by match_score.
 *   - "From your watchlist": 0-2 watchlist picks selected by Mistral.
 *
 * Each film title/poster links to /films/:tmdb_id. FilmDetailPage calls
 * navigate(-1) to return here without re-launching the questionnaire.
 */
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Plus, RotateCcw, Home, Bookmark, Check, Film, Sparkles, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLibrary } from "@/context/LibraryContext"
import type { FilmRecommendation, RecommendationResponse } from "@/types/api"

export function ResultsPage() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { result: RecommendationResponse } | null }
  const { getStatus, addToWatchlist } = useLibrary()

  const result = state?.result

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-balance font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
        Here&apos;s what we found for you tonight 🎬
      </h1>
      <p className="mt-2 text-muted-foreground">
        {result
          ? "Picks tuned to your mood and platforms."
          : "Something went wrong — no recommendations to display."}
      </p>

      {!result && (
        <Card className="mt-8 flex flex-col items-center gap-3 p-10 text-center">
          <Film className="h-10 w-10 text-muted-foreground" />
          <p className="text-pretty text-muted-foreground">
            No recommendations available. Try starting over with a new mood.
          </p>
        </Card>
      )}

      {result && (
        <>
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#b8860b]" />
              <h2 className="font-heading text-lg font-extrabold tracking-tight">Your Perfect Match</h2>
            </div>
            <PerfectMatchCard
              film={result.perfect_match}
              inWatchlist={getStatus(result.perfect_match.tmdb_id) === "watchlist"}
              onAdd={() => addToWatchlist(result.perfect_match.tmdb_id)}
            />
          </section>

          {result.suggestions.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 font-heading text-lg font-bold tracking-tight">You Might Also Like</h2>
              <div className="flex flex-col gap-4">
                {result.suggestions.map((film) => (
                  <RecRow
                    key={film.tmdb_id}
                    film={film}
                    inWatchlist={getStatus(film.tmdb_id) === "watchlist"}
                    onAdd={() => addToWatchlist(film.tmdb_id)}
                  />
                ))}
              </div>
            </section>
          )}

          {result.from_watchlist.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 font-heading text-base font-semibold tracking-tight text-muted-foreground">
                From your watchlist
              </h2>
              <div className="flex flex-col gap-3">
                {result.from_watchlist.map((film) => (
                  <RecRow
                    key={film.tmdb_id}
                    film={film}
                    inWatchlist
                    onAdd={() => {}}
                    muted
                  />
                ))}
              </div>
            </section>
          )}
        </>
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
          Heading home closes this session — you won&apos;t be able to return to these recommendations.
        </p>
      </div>
    </div>
  )
}

function PerfectMatchCard({
  film,
  inWatchlist,
  onAdd,
}: {
  film: FilmRecommendation
  inWatchlist: boolean
  onAdd: () => void
}) {
  return (
    <Card className="platinum-shine animate-platinum-glow relative flex flex-col gap-5 overflow-hidden border-[#d4af37]/50 bg-gradient-to-br from-background to-[#d4af37]/5 p-5 sm:flex-row sm:p-6">
      <Link to={`/films/${film.tmdb_id}`} className="mx-auto shrink-0 sm:mx-0">
        <img
          src={film.poster_url || "/placeholder.svg"}
          alt={`${film.title} poster`}
          crossOrigin="anonymous"
          className="h-56 w-40 rounded-xl object-cover shadow-lg ring-1 ring-[#d4af37]/40"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#d4af37]/15 px-2.5 py-0.5 text-xs font-bold text-[#8a6d0b]">
            <Star className="h-3 w-3 fill-current" />
            Top pick · {film.match_score}% match
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
            to={`/films/${film.tmdb_id}`}
            className="font-heading text-xl font-extrabold leading-tight hover:text-primary sm:text-2xl"
          >
            {film.title}
          </Link>
          <span className="ml-2 text-sm text-muted-foreground">{film.year}</span>
        </div>

        {film.synopsis && (
          <p className="line-clamp-3 text-pretty text-sm text-muted-foreground">{film.synopsis}</p>
        )}
        <p className="text-pretty italic text-primary">"{film.reason}"</p>

        <div className="mt-auto flex flex-wrap items-center gap-2">
          {film.available_on_my_platforms && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              On your platforms
            </span>
          )}
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
  film,
  inWatchlist,
  onAdd,
  muted,
}: {
  film: FilmRecommendation
  inWatchlist: boolean
  onAdd: () => void
  muted?: boolean
}) {
  return (
    <Card className={`flex flex-row items-center gap-4 overflow-hidden p-3 sm:p-4 ${muted ? "bg-muted/30" : ""}`}>
      <Link to={`/films/${film.tmdb_id}`} className="shrink-0">
        <img
          src={film.poster_url || "/placeholder.svg"}
          alt={`${film.title} poster`}
          crossOrigin="anonymous"
          className={`rounded-lg object-cover ring-1 ring-border ${muted ? "h-24 w-16" : "h-28 w-20"}`}
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/films/${film.tmdb_id}`} className="font-heading text-base font-bold hover:text-primary">
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

        <p className="text-pretty text-sm italic text-primary">"{film.reason}"</p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              muted ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {film.match_score}% match
          </span>
          {film.available_on_my_platforms && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              On your platforms
            </span>
          )}
        </div>
      </div>

      {!muted && (
        inWatchlist ? (
          <Button variant="ghost" size="sm" disabled className="hidden shrink-0 gap-1 sm:flex">
            <Check className="h-3.5 w-3.5" />
            Saved
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="hidden shrink-0 gap-1 sm:flex" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" />
            Watchlist
          </Button>
        )
      )}
    </Card>
  )
}
