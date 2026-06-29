/**
 * RecommendationPage - Mood questionnaire (step 1 of the recommendation flow).
 *
 * Five chip steps followed by a free-text "Additional notes" section:
 *   Q1 Who's watching     min:1 max:1  autoAdvance → auto-scroll on selection
 *   Q2 What do you want   min:1 max:2  autoAdvance → "Next step" after 1, auto-scroll after 2
 *   Q3 What sounds good   min:1 max:1  autoAdvance → auto-scroll on selection
 *   Q4 Preferences        min:0 max:99 manual      → "Skip" / "Next step"
 *   Q5 Deal breakers      min:0 max:2  manual      → "Skip" / "Next step"
 *
 * Progression is tracked by `unlocked[]`, not `isComplete`, so optional steps
 * (min:0) don't collapse the whole flow by appearing immediately.
 *
 * Auto-advance: fires via useEffect when answers[i].length reaches q.max on a
 * question with autoAdvance:true. For Q2 specifically, "Next step" appears between
 * min and max so the user can proceed with a single choice if they prefer.
 *
 * Hints: tooltip on desktop hover, inline below button on mobile when selected.
 * exclusiveWith: selecting one option deselects its paired option (duration pair).
 *
 * TODO: pass collected answers to POST /recommendations when that endpoint exists.
 */
import { useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MOOD_QUESTIONS } from "@/lib/questionnaire"
import { discover } from "@/services/recommendations"
import { LoadingScreen } from "@/components/loading-screen"

const CHIP_STEPS = MOOD_QUESTIONS.length

export function RecommendationPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const userPlatforms = user?.platforms ?? []
  const hasPlatforms = userPlatforms.length > 0
  const [filterPlatforms, setFilterPlatforms] = useState(hasPlatforms)

  const [answers, setAnswers] = useState<string[][]>(
    () => MOOD_QUESTIONS.map(() => [])
  )
  const [specific, setSpecific] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // unlocked[i] = true once the user has confirmed step i (manually or via auto-advance).
  // visibleCount is derived from this, NOT from isComplete, so optional steps
  // (min:0, always "complete") don't all appear at once.
  const [unlocked, setUnlocked] = useState<boolean[]>(
    () => MOOD_QUESTIONS.map(() => false)
  )

  const isComplete = (i: number) => answers[i].length >= MOOD_QUESTIONS[i].min

  const visibleCount = (() => {
    const firstLocked = unlocked.findIndex(u => !u)
    return firstLocked === -1 ? CHIP_STEPS : firstLocked + 1
  })()
  const promptUnlocked = unlocked.every(u => u)

  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  const scrollToSection = (i: number) =>
    sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" })

  const advance = (i: number) => {
    setUnlocked(prev => {
      if (prev[i]) return prev
      const next = [...prev]
      next[i] = true
      return next
    })
    requestAnimationFrame(() => setTimeout(() => scrollToSection(i + 1), 80))
  }

  // Auto-advance when max is reached on autoAdvance questions.
  const prevMaxRef = useRef<boolean[]>(MOOD_QUESTIONS.map(() => false))
  useEffect(() => {
    MOOD_QUESTIONS.forEach((q, i) => {
      if (!q.autoAdvance) return
      const maxNowReached = answers[i].length >= q.max
      if (maxNowReached && !prevMaxRef.current[i]) {
        setUnlocked(prev => {
          if (prev[i]) return prev
          const next = [...prev]
          next[i] = true
          return next
        })
        requestAnimationFrame(() => setTimeout(() => scrollToSection(i + 1), 80))
      }
      prevMaxRef.current[i] = maxNowReached
    })
  }, [answers])

  const select = (stepIndex: number, label: string) => {
    const q = MOOD_QUESTIONS[stepIndex]
    const opt = q.options.find(o => o.label === label)
    setAnswers(prev => {
      const next = prev.map(a => [...a])
      const step = next[stepIndex]
      if (step.includes(label)) {
        next[stepIndex] = step.filter(l => l !== label)
      } else if (q.max === 1) {
        next[stepIndex] = [label]
      } else if (step.length < q.max) {
        let newStep = [...step, label]
        if (opt?.exclusiveWith) {
          newStep = newStep.filter(l => l !== opt.exclusiveWith)
        }
        next[stepIndex] = newStep
      }
      return next
    })
  }

  if (isLoading) return <LoadingScreen message="Searching for your films…" />

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center px-4 py-8 sm:px-6">
      <div className="mb-4 text-center">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">What should you watch tonight?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Answer a few quick questions - scroll back up inside the box anytime to change an answer.
        </p>
      </div>

      {/* Platform filter toggle - only shown when platforms are configured */}
      {hasPlatforms && (
        <div className="mb-3 flex items-center justify-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={filterPlatforms}
            onClick={() => setFilterPlatforms(prev => !prev)}
            className={cn(
              "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
              filterPlatforms ? "bg-primary" : "bg-border",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
                filterPlatforms ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
          <span className={cn("text-xs", filterPlatforms ? "text-foreground" : "text-muted-foreground")}>
            Films from my platforms only
          </span>
        </div>
      )}

      <div
        className="overflow-x-hidden overflow-y-auto scroll-smooth rounded-3xl border border-border bg-card shadow-sm"
        style={{ scrollSnapType: "y mandatory", scrollbarGutter: "stable", height: "min(28rem, 65vh)" }}
      >
        {MOOD_QUESTIONS.slice(0, visibleCount).map((q, stepIndex) => {
          const stepAnswers = answers[stepIndex]
          const maxReached = q.max > 1 && q.max < 99 && stepAnswers.length >= q.max

          // Show "Next step" / "Skip" when step is complete but not yet auto-advancing.
          // For autoAdvance steps: only show if min is met but max isn't yet reached.
          const showManualButton = !unlocked[stepIndex] && isComplete(stepIndex) &&
            (!q.autoAdvance || stepAnswers.length < q.max)

          return (
            <section
              key={q.key}
              ref={el => { sectionRefs.current[stepIndex] = el }}
              style={{ scrollSnapAlign: "start" }}
              className="flex h-full flex-col px-6 py-6"
            >
              <div className="flex flex-1 flex-col justify-center">
                <div className="w-full animate-fade-in-up">
                  <p className="mb-2 text-sm font-medium text-primary">
                    Question {stepIndex + 1} of {CHIP_STEPS}
                  </p>
                  <h2 className="text-balance font-heading text-xl font-bold sm:text-2xl">{q.title}</h2>
                  {q.subtitle && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{q.subtitle}</p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {q.options.map(opt => {
                      const active = stepAnswers.includes(opt.label)
                      const isDisabled = maxReached && !active

                      return (
                        <div key={opt.label} className="group relative">
                          <button
                            type="button"
                            onClick={() => !isDisabled && select(stepIndex, opt.label)}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                              active
                                ? "border-primary bg-accent text-primary shadow-sm"
                                : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
                              isDisabled && "cursor-not-allowed opacity-40 hover:translate-y-0 hover:border-border hover:shadow-none",
                            )}
                          >
                            <span className="text-lg" aria-hidden>{opt.emoji}</span>
                            {opt.label}
                          </button>

                          {opt.hint && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 min-w-[150px] max-w-[200px] -translate-x-1/2 rounded-lg bg-popover px-3 py-1.5 text-center text-xs text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100">
                              {opt.hint}
                            </div>
                          )}

                          {active && opt.hint && (
                            <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                              {opt.hint}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex h-10 shrink-0 items-center justify-center">
                {unlocked[stepIndex] ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(stepIndex + 1)}
                    className="animate-bounce text-muted-foreground hover:text-primary"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                ) : showManualButton ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => advance(stepIndex)}
                  >
                    {q.min === 0 && stepAnswers.length === 0 ? "Skip" : "Next step"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </section>
          )
        })}

        {promptUnlocked && (
          <section
            ref={el => { sectionRefs.current[CHIP_STEPS] = el }}
            style={{ scrollSnapAlign: "start" }}
            className="flex h-full flex-col items-center justify-center px-6 py-8"
          >
            <div className="w-full animate-fade-in-up">
              <p className="mb-2 text-sm font-medium text-primary">Last step</p>
              <h2 className="text-balance font-heading text-xl font-bold sm:text-2xl">Anything to add?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Optional - genre, director, actor, era, subject… anything to aim for or avoid.
              </p>
              <Textarea
                value={specific}
                onChange={e => setSpecific(e.target.value)}
                placeholder={"e.g. A thriller from the 2000's, directed by David Fincher, starring Jodie Foster as female lead…"}
                className="mt-5 min-h-24 resize-none text-base focus-visible:border-primary focus-visible:ring-primary/25"
              />
              <div className="mt-5 flex justify-end">
                <Button
                  size="lg"
                  className="gap-1.5 transition-all duration-200 hover:scale-105"
                  disabled={isLoading}
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      const quizAnswers = {
                        audience: answers[0][0] ?? "",
                        mood: answers[1],
                        desire: answers[2][0] ?? "",
                        preferences: answers[3],
                        dealbreakers: answers[4],
                        notes: specific,
                      }
                      const response = await discover({
                        ...quizAnswers,
                        filter_platforms: filterPlatforms,
                      })
                      navigate("/recommendation/swipe", {
                        state: { quizAnswers, cards: response.cards, filterPlatforms },
                      })
                    } catch {
                      setIsLoading(false)
                    }
                  }}
                >
                  {isLoading ? "Loading…" : "Find my film"}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
