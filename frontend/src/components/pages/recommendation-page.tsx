/**
 * RecommendationPage — Mood questionnaire (step 1 of the recommendation flow).
 *
 * Renders MOOD_QUESTIONS (audience, feeling, attention) one section at a time
 * inside a snap-scroll container. Each answered question unlocks the next section
 * and auto-scrolls to it. After all three are answered, a final free-text prompt
 * ("Anything specific?") is revealed. Submitting navigates to /recommendation/swipe.
 *
 * The sequential reveal is driven by `answers` state: the highest index that is
 * still null determines how many sections are visible (visibleCount).
 *
 * TODO: pass the collected answers to the recommendation engine when the backend
 * exposes a POST /recommendations endpoint. For now they are discarded on navigate.
 */
import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MOOD_QUESTIONS } from "@/lib/mock-data"

// MOOD_QUESTIONS = [audience, feeling, attention]; the free-text prompt is the final step.
const CHIP_STEPS = MOOD_QUESTIONS.length // 3

export function RecommendationPage() {
  const navigate = useNavigate()
  // answers[i] holds the selected label for chip step i
  const [answers, setAnswers] = useState<(string | null)[]>(Array(CHIP_STEPS).fill(null))
  const [specific, setSpecific] = useState("")

  // The highest step the user has unlocked. Each answered step reveals the next.
  const revealed = answers.findIndex((a) => a === null)
  const promptUnlocked = revealed === -1
  const visibleCount = promptUnlocked ? CHIP_STEPS : revealed + 1

  // Refs to each section so we can smooth-scroll to the next one on answer.
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  const select = (stepIndex: number, label: string) => {
    const firstTime = answers[stepIndex] === null
    setAnswers((prev) => {
      const nextAnswers = [...prev]
      nextAnswers[stepIndex] = label
      return nextAnswers
    })
    // Smooth-scroll to the next section once it has had a chance to render.
    if (firstTime) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          sectionRefs.current[stepIndex + 1]?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 60)
      })
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center px-4 py-8 sm:px-6">
      <div className="mb-4 text-center">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">What should you watch tonight?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Answer a few quick questions — scroll back up inside the box anytime to change an answer.
        </p>
      </div>

      {/* The questionnaire lives in a contained box so going back is just a short scroll. */}
      <div
        className="snap-y snap-mandatory overflow-y-auto scroll-smooth rounded-3xl border border-border bg-card shadow-sm"
        style={{ scrollSnapType: "y mandatory", height: "min(28rem, 65vh)" }}
      >
        {MOOD_QUESTIONS.slice(0, visibleCount).map((q, stepIndex) => (
          <section
            key={q.key}
            ref={(el) => {
              sectionRefs.current[stepIndex] = el
            }}
            className="flex h-full snap-start flex-col items-center justify-center px-6 py-8"
          >
            <div className="w-full animate-fade-in-up">
              <p className="mb-2 text-sm font-medium text-primary">
                Question {stepIndex + 1} of {CHIP_STEPS}
              </p>
              <h2 className="text-balance font-heading text-xl font-bold sm:text-2xl">{q.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Tap whatever fits — no wrong answers.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {q.options.map((opt) => {
                  const active = answers[stepIndex] === opt.label
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => select(stepIndex, opt.label)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-2xl border px-5 py-3 text-base font-medium transition-all duration-200",
                        active
                          ? "border-primary bg-accent text-primary shadow-sm"
                          : "border-border bg-card hover:-translate-y-0.5 hover:scale-105 hover:border-primary/40 hover:shadow-sm",
                      )}
                    >
                      <span className="text-xl" aria-hidden>
                        {opt.emoji}
                      </span>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Scroll affordance — hint that more is below once answered */}
            {answers[stepIndex] !== null && stepIndex + 1 < visibleCount && (
              <button
                type="button"
                aria-label="Scroll to next question"
                onClick={() =>
                  sectionRefs.current[stepIndex + 1]?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="mt-6 flex cursor-pointer animate-bounce items-center justify-center rounded-full p-1 text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                <ChevronDown className="h-6 w-6" />
              </button>
            )}
          </section>
        ))}

        {promptUnlocked && (
          <section
            ref={(el) => {
              sectionRefs.current[CHIP_STEPS] = el
            }}
            className="flex h-full snap-start flex-col items-center justify-center px-6 py-8"
          >
            <div className="w-full animate-fade-in-up">
              <p className="mb-2 text-sm font-medium text-primary">Last step</p>
              <h2 className="text-balance font-heading text-xl font-bold sm:text-2xl">Anything specific?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Optional — tell us about any dealbreakers or wishes. Scroll up anytime to change a previous answer.
              </p>
              <Textarea
                value={specific}
                onChange={(e) => setSpecific(e.target.value)}
                placeholder="e.g. No subtitles, something short, avoid horror…"
                className="mt-5 min-h-24 resize-none text-base focus-visible:border-primary focus-visible:ring-primary/25"
              />
              <div className="mt-5 flex justify-end">
                <Button
                  size="lg"
                  className="gap-1.5 transition-all duration-200 hover:scale-105"
                  onClick={() => navigate("/recommendation/swipe")}
                >
                  Find my film
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
