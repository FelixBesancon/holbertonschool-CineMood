/**
 * SwipePage - Optional swipe-to-refine step (step 2 of the recommendation flow).
 *
 * Presents a deck of up to 6 films as swipeable cards. The user drags left
 * ("Not for me") or right ("Why not") - or uses the fallback buttons below.
 * After the last card, or after clicking "Skip this step", navigates to
 * /recommendation/results.
 *
 * SwipeCard handles drag via pointer events: pointer capture tracks the full
 * gesture even when the pointer leaves the element. A drag threshold of ±110px
 * triggers a dismiss animation (slide out) before calling onDecide.
 * Overlay tints (green / red) provide visual feedback during the drag.
 *
 * TODO: record swipe choices and send them with the mood answers to the backend
 * recommendation engine when POST /recommendations is implemented.
 */
import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { X, Check, Hand, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FILMS, type Film } from "@/lib/mock-data"

// Swipe deck capped at 6 films
const DECK: Film[] = FILMS.slice(0, 6)

function SwipeCard({
  film,
  isTop,
  showHint,
  onDecide,
}: {
  film: Film
  isTop: boolean
  showHint: boolean
  onDecide: (dir: "left" | "right") => void
}) {
  const [drag, setDrag] = useState(0)
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null)
  const startX = useRef<number | null>(null)

  const decide = (dir: "left" | "right") => {
    setLeaving(dir)
    setTimeout(() => onDecide(dir), 280)
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

  const offset = leaving === "right" ? 600 : leaving === "left" ? -600 : drag
  const rotate = offset / 20
  const tint = offset > 30 ? "right" : offset < -30 ? "left" : null

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        transform: `translateX(${offset}px) rotate(${rotate}deg)`,
        transition: startX.current !== null ? "none" : "transform 0.28s ease-out",
        touchAction: "none",
      }}
      className={cn(
        "absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl",
        isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
      )}
    >
      {/* poster ~52% */}
      <div className="relative h-[52%] shrink-0 overflow-hidden">
        <img
          src={film.poster || "/placeholder.svg"}
          alt={`${film.title} poster`}
          crossOrigin="anonymous"
          className="h-full w-full object-cover"
        />
        {/* tint overlays */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity",
            tint === "right" ? "bg-emerald-500/35 opacity-100" : "opacity-0",
          )}
        >
          <div className="rounded-full bg-emerald-500 px-5 py-3 text-base font-bold text-white shadow-lg">
            Why not 👍
          </div>
        </div>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity",
            tint === "left" ? "bg-primary/35 opacity-100" : "opacity-0",
          )}
        >
          <div className="rounded-full bg-primary px-5 py-3 text-base font-bold text-primary-foreground shadow-lg">
            Not for me 👎
          </div>
        </div>

        {showHint && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center px-3 text-white">
            <span className="flex animate-pulse items-center gap-1.5 rounded-full bg-foreground/65 px-3.5 py-1.5 text-center text-xs font-medium backdrop-blur-sm">
              <Hand className="h-3.5 w-3.5 shrink-0" />
              Swipe left if you&apos;re not interested, or right if you&apos;d give it a chance
            </span>
          </div>
        )}
      </div>

      {/* details */}
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <div className="flex gap-2">
          {film.stills.map((s, i) => (
            <img
              key={i}
              src={s || "/placeholder.svg"}
              alt=""
              crossOrigin="anonymous"
              className="h-11 w-1/2 rounded-md object-cover ring-1 ring-border"
            />
          ))}
        </div>
        <div>
          <h2 className="font-heading text-base font-bold leading-tight">{film.title}</h2>
          <p className="text-xs text-muted-foreground">
            {film.year} · {film.director} · {film.runtime}
          </p>
        </div>
        <p className="line-clamp-2 text-[13px] italic leading-snug text-foreground/75">{film.synopsis}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {film.highlights.slice(0, 3).map((h) => (
            <Badge key={h} variant="secondary" className="font-normal">
              {h}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SwipePage() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)

  const decide = () => {
    const nextIndex = index + 1
    if (nextIndex >= DECK.length) {
      navigate("/recommendation/results")
    } else {
      setIndex(nextIndex)
    }
  }

  const current = DECK[index]
  const next = DECK[index + 1]

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-sm flex-col items-center px-4 py-5">
      <div className="mb-3 w-full text-center">
        <h1 className="font-heading text-lg font-bold sm:text-xl">Refine the recommendation tool with swipes</h1>
        <p className="mx-auto mt-1 max-w-xs text-pretty text-sm text-muted-foreground">
          Optional - react to a few films to sharpen your picks, or skip straight to your recommendations.
        </p>
        <span className="mt-3 inline-block rounded-full bg-secondary px-3 py-1 text-sm font-medium text-muted-foreground">
          {index + 1} / {DECK.length} films
        </span>
      </div>

      {/* card stack */}
      <div className="relative aspect-[3/4.2] max-h-[68vh] w-full">
        {next && (
          <div className="absolute inset-0 scale-95 overflow-hidden rounded-3xl border border-border bg-card opacity-70 blur-[1px]">
            <img
              src={next.poster || "/placeholder.svg"}
              alt=""
              crossOrigin="anonymous"
              className="h-[52%] w-full object-cover"
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

      {/* desktop fallback buttons */}
      <div className="mt-5 flex items-center gap-10">
        <div className="flex flex-col items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-lg"
            className="h-14 w-14 rounded-full border-primary/30 text-primary hover:bg-accent"
            aria-label="Not interested"
            onClick={decide}
          >
            <X className="h-6 w-6" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground">Not for me</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Button
            size="icon-lg"
            className="h-14 w-14 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
            aria-label="Interested"
            onClick={decide}
          >
            <Check className="h-6 w-6" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground">Why not</span>
        </div>
      </div>

      {/* Skip - ends swiping and jumps straight to recommendations */}
      <Button
        variant="ghost"
        className="mt-6 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => navigate("/recommendation/results")}
      >
        <SkipForward className="h-4 w-4" />
        Skip this step
      </Button>
    </div>
  )
}
