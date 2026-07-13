/**
 * SwipePage - Optional swipe-to-refine step (step 2 of the recommendation flow).
 *
 * Reads discover cards and quiz answers from React Router location state
 * (passed by RecommendationPage after POST /recommendations/discover).
 * Presents them as a swipeable deck: right = liked, left = rejected.
 *
 * After the last card, or on "Skip this step", calls POST /recommendations/refine
 * and navigates to /recommendation/results with the response in state.
 * A full-screen LoadingScreen is shown during the Mistral call.
 *
 * Swipe mechanics:
 *   - Pointer capture tracks drag even when pointer leaves the element.
 *   - ±110px threshold triggers a dismiss animation before calling onDecide.
 *   - Snap-back uses a spring easing; exit uses a fast smooth curve.
 *   - Chevron arrows on the first card invite the user to swipe.
 */
import { useState, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { X, Check, Hand, SkipForward, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRuntime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingScreen } from "@/components/loading-screen"
import { refine } from "@/services/recommendations"
import type { SwipeCard as SwipeCardType, QuizAnswers } from "@/types/api"

function SwipeCard({
  film,
  isTop,
  showHint,
  onDecide,
}: {
  film: SwipeCardType
  isTop: boolean
  showHint: boolean
  onDecide: (dir: "left" | "right") => void
}) {
  const [drag, setDrag] = useState(0)
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null)
  const startX = useRef<number | null>(null)

  const decide = (dir: "left" | "right") => {
    setLeaving(dir)
    setTimeout(() => onDecide(dir), 300)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isTop) return
    startX.current = e.clientX
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return
    setDrag(e.clientX - startX.current)
  }
  const onPointerUp = () => {
    if (startX.current === null) return
    if (drag > 110) decide("right")
    else if (drag < -110) decide("left")
    else setDrag(0)
    startX.current = null
  }

  const offset = leaving === "right" ? 620 : leaving === "left" ? -620 : drag
  const rotate = offset / 18
  const tint = offset > 30 ? "right" : offset < -30 ? "left" : null

  // Spring snap-back when released without swipe; fast curve on exit
  const transition = startX.current !== null
    ? "none"
    : leaving
      ? "transform 0.32s cubic-bezier(0.55, 0, 1, 0.45)"
      : "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ transform: `translateX(${offset}px) rotate(${rotate}deg)`, transition, touchAction: "none" }}
      className={cn(
        "absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl",
        isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
      )}
    >
      {/* poster — object-contain shows the full image, padding keeps it off the edges */}
      <div className="relative select-none h-[58%] shrink-0 overflow-hidden bg-muted/40">
        <img
          src={film.poster_url || "/placeholder.svg"}
          alt={`${film.title} poster`}
          crossOrigin="anonymous"
          className="h-full w-full object-contain p-2"
        />

        {/* like / reject tint overlays */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity",
          tint === "right" ? "bg-emerald-500/35 opacity-100" : "opacity-0",
        )}>
          <div className="rounded-full bg-emerald-500 select-none px-5 py-3 text-base font-bold text-white shadow-lg">
            Why not 👍
          </div>
        </div>
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity",
          tint === "left" ? "bg-destructive/35 opacity-100" : "opacity-0",
        )}>
          <div className="rounded-full bg-destructive select-none px-5 py-3 text-base font-bold text-white shadow-lg">
            Not for me 👎
          </div>
        </div>

        {showHint && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center px-3 text-white">
            <span className="flex animate-pulse select-none items-center gap-1.5 rounded-full bg-foreground/65 px-3.5 py-1.5 text-center text-xs font-medium backdrop-blur-sm">
              <Hand className="h-3.5 w-3.5 shrink-0" />
              Swipe left if you&apos;re not interested, right if you&apos;d give it a chance
            </span>
          </div>
        )}
      </div>

      {/* details: title → synopsis → reason → genres */}
      <div className="flex flex-1 select-none flex-col gap-1.5 p-3.5">
        <div>
          <h2 className="font-heading text-base font-bold leading-tight">{film.title}</h2>
          <p className="text-xs text-muted-foreground">
            {film.year} · {film.director?.join(", ")} · {formatRuntime(film.runtime)}
          </p>
        </div>
        {film.synopsis && (
          <p className="line-clamp-2 text-[12px] leading-snug text-foreground/70">{film.synopsis}</p>
        )}
        <p className="line-clamp-2 text-[13px] italic leading-snug text-primary">"{film.reason}"</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {(film.genres ?? []).slice(0, 3).map((g) => (
            <Badge key={g} variant="secondary" className="font-normal">
              {g}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SwipePage() {
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state: { quizAnswers: QuizAnswers; cards: SwipeCardType[]; filterPlatforms: boolean } | null
  }

  const cards = state?.cards ?? []
  const quizAnswers = state?.quizAnswers
  const filterPlatforms = state?.filterPlatforms ?? true

  const [index, setIndex] = useState(0)
  const [likedIds, setLikedIds] = useState<number[]>([])
  const [rejectedIds, setRejectedIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendRefine = async (liked: number[], rejected: number[]) => {
    if (!quizAnswers) {
      navigate("/recommendation/results", { state: null })
      return
    }
    setIsLoading(true)
    try {
      const result = await refine({
        ...quizAnswers,
        filter_platforms: filterPlatforms,
        liked_tmdb_ids: liked,
        rejected_tmdb_ids: rejected,
      })
      navigate("/recommendation/results", { state: { result } })
    } catch {
      setIsLoading(false)
    }
  }

  const decide = (dir: "left" | "right") => {
    const film = cards[index]
    const newLiked = dir === "right" ? [...likedIds, film.tmdb_id] : likedIds
    const newRejected = dir === "left" ? [...rejectedIds, film.tmdb_id] : rejectedIds

    setLikedIds(newLiked)
    setRejectedIds(newRejected)

    const nextIndex = index + 1
    if (nextIndex >= cards.length) {
      sendRefine(newLiked, newRejected)
    } else {
      setIndex(nextIndex)
    }
  }

  if (isLoading) return <LoadingScreen message="Refining your recommendations…" />

  const current = cards[index]
  const next = cards[index + 1]

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-sm flex-col items-center px-4 py-3 sm:py-5">
      <div className="mb-2 w-full text-center sm:mb-3">
        <h1 className="font-heading text-lg font-bold sm:text-xl">Refine the recommendation tool with swipes</h1>
        <p className="mx-auto mt-1 hidden max-w-xs text-pretty text-sm text-muted-foreground sm:block">
          Optional - react to a few films to sharpen your picks, or skip straight to your recommendations.
        </p>
        <span className="mt-2 inline-block rounded-full bg-secondary px-3 py-1 text-sm font-medium text-muted-foreground sm:mt-3">
          {index + 1} / {cards.length} films
        </span>
      </div>

      {/* card stack */}
      <div className="relative aspect-[3/4.2] max-h-[48dvh] w-full sm:max-h-[64dvh]">
        {/* swipe direction arrows — only on first card */}
        {index === 0 && (
          <>
            <div className="pointer-events-none absolute left-1 top-[45%] z-10 -translate-y-1/2 animate-bounce text-destructive/50">
              <ChevronLeft className="h-8 w-8" />
            </div>
            <div className="pointer-events-none absolute right-1 top-[45%] z-10 -translate-y-1/2 animate-bounce text-emerald-500/60">
              <ChevronRight className="h-8 w-8" />
            </div>
          </>
        )}

        {next && (
          <div className="absolute inset-0 scale-95 overflow-hidden rounded-3xl border border-border bg-card opacity-70 blur-[1px]">
            <img
              src={next.poster_url || "/placeholder.svg"}
              alt=""
              crossOrigin="anonymous"
              className="h-[58%] w-full object-contain p-2"
            />
          </div>
        )}
        {current && (
          <SwipeCard
            key={index}
            film={current}
            isTop
            showHint={index === 0}
            onDecide={decide}
          />
        )}
      </div>

      {/* action buttons */}
      <div className="mt-3 flex items-center gap-8 sm:mt-5 sm:gap-10">
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon-lg"
            className="h-12 w-12 rounded-full bg-destructive text-white hover:bg-destructive/90 sm:h-14 sm:w-14"
            aria-label="Not interested"
            onClick={() => decide("left")}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground">Not for me</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon-lg"
            className="h-12 w-12 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 sm:h-14 sm:w-14"
            aria-label="Interested"
            onClick={() => decide("right")}
          >
            <Check className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground">Why not</span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-2 gap-1.5 text-muted-foreground hover:text-foreground sm:mt-6"
        onClick={() => sendRefine(likedIds, rejectedIds)}
      >
        <SkipForward className="h-4 w-4" />
        Skip this step
      </Button>
    </div>
  )
}
