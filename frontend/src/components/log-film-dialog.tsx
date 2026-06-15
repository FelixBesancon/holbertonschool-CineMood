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
import { useState, useEffect } from "react"
import api from "@/services/api"
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
import type { Film, Tag } from "@/types/api"

interface LogEntry {
  tags: number[]        // IDs des tags
  prestige_tier: string | null
  personal_note: string
}

const PRESTIGE_TIERS = [
  { id: "platinum", emoji: "💎", label: "Platinum" },
  { id: "gold", emoji: "🥇", label: "Gold" },
  { id: "silver", emoji: "🥈", label: "Silver" },
  { id: "bronze", emoji: "🥉", label: "Bronze" },
  { id: "trash", emoji: "🗑️", label: "Trash" },
]

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
  const [tags, setTags] = useState<number[]>(initial?.tags ?? [])
  const [prestige, setPrestige] = useState<string | null>(initial?.prestige_tier ?? null)
  const [note, setNote] = useState(initial?.personal_note ?? "")
  const [availableTags, setAvailableTags] = useState<Tag[]>([])

  useEffect(() => {
    api.get('/tags').then(res => setAvailableTags(res.data))
  }, [])

  if (!film) return null

  const toggleTag = (t: number) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img
              src={film.poster_url || "/placeholder.svg"}
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
              {availableTags.map((t) => {
                const active = tags.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-accent text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/40",
                    )}
                  >
                    {t.name}
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
              onConfirm?.({
                tags, prestige_tier: prestige, personal_note: note
              })
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
