/**
 * LogFilmDialog — Modal for logging (or updating) a film entry.
 *
 * Lets the user pick:
 *   - Mood tags (multi-select toggle buttons from MOOD_TAGS)
 *   - Prestige tier (single-select toggle buttons from PRESTIGE_TIERS)
 *   - Personal note (free-text textarea)
 *
 * Props:
 *   - film: the film being logged (pass null to render nothing)
 *   - open / onOpenChange: controlled open state
 *   - initial: pre-populated values when editing an existing log entry
 *   - onConfirm: called with the final LogEntry when the user confirms
 *
 * TODO: when connecting to the backend, onConfirm should call
 * POST /history (new log) or PUT /history/{id} (update existing).
 * The prestige and note fields map directly to the ViewingHistoryEntry schema.
 */
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MOOD_TAGS, PRESTIGE_TIERS, type Film, type LogEntry } from "@/lib/mock-data"

export function LogFilmDialog({
  film,
  open,
  onOpenChange,
  initial,
  onConfirm,
}: {
  film: Film | null
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: LogEntry
  onConfirm?: (entry: LogEntry) => void
}) {
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [prestige, setPrestige] = useState<string | null>(initial?.prestige ?? null)
  const [note, setNote] = useState(initial?.note ?? "")

  if (!film) return null

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img
              src={film.poster || "/placeholder.svg"}
              alt=""
              crossOrigin="anonymous"
              className="h-20 w-14 shrink-0 rounded-md object-cover ring-1 ring-border"
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Log this film</p>
              <DialogTitle className="text-lg">{film.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {film.year} · {film.director}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-1">
          {/* Mood tags */}
          <div className="flex flex-col gap-2">
            <Label>How was it?</Label>
            <div className="flex flex-wrap gap-2">
              {MOOD_TAGS.map((t) => {
                const active = tags.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-accent text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/40",
                    )}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Prestige */}
          <div className="flex flex-col gap-2">
            <Label>Prestige tier</Label>
            <div className="flex flex-wrap gap-2">
              {PRESTIGE_TIERS.map((p) => {
                const active = prestige === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPrestige(active ? null : p.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                      active
                        ? "border-primary bg-accent text-primary"
                        : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    <span aria-hidden>{p.emoji}</span>
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="note">Personal note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a personal note…"
              className="min-h-20 resize-none focus-visible:border-primary focus-visible:ring-primary/25"
            />
          </div>

          <Button
            size="lg"
            className="h-11 w-full"
            onClick={() => {
              onConfirm?.({ tags, prestige: prestige as LogEntry["prestige"], note })
              onOpenChange(false)
            }}
          >
            Log this film
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
