/**
 * HistoryPage - User's full viewing diary.
 *
 * Displays all history entries as rich cards: poster, prestige badge,
 * mood tags, personal note, and viewing date. A Platinum entry gets a
 * golden shimmer animation (animate-platinum-glow / platinum-shine).
 *
 * Sorting options: Prestige tier (default) | A–Z | Viewing date.
 * Clicking a card navigates to /films/:tmdb_id for editing the log entry.
 * The trash button opens a ConfirmDialog before calling removeFromHistory.
 *
 * Data comes from LibraryContext (GET /history).
 */
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Info, Pencil, Trash2 } from "lucide-react"
import { cn, formatRuntime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { PosterFrame, TagChip } from "@/components/film-card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useLibrary } from "@/context/LibraryContext"
import { PRESTIGE_RECORD, PRESTIGE_RANK } from "@/lib/constants"
import type { HistoryEntry } from "@/types/api"

type SortKey = "prestige" | "alpha" | "date"

const SORTS: { key: SortKey; label: string }[] = [
  { key: "prestige", label: "Prestige tier" },
  { key: "alpha", label: "A–Z" },
  { key: "date", label: "Viewing date" },
]

const TIER_STYLE: Record<string, string> = {
  Platinum: "border-amber-300 bg-amber-50/40",
  Gold:     "border-amber-200",
  Silver:   "border-zinc-200",
  Bronze:   "border-orange-200/70",
  Coal:     "border-zinc-300 opacity-90",
  Trash:    "border-border opacity-90",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export function HistoryPage() {
  const navigate = useNavigate()
  const { history, removeFromHistory } = useLibrary()
  const [sort, setSort] = useState<SortKey>("prestige")
  const [removeTarget, setRemoveTarget] = useState<HistoryEntry | null>(null)

  const entries = useMemo(() => {
    const list = [...history]
    if (sort === "alpha") {
      list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
    } else if (sort === "date") {
      list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    } else {
      list.sort((a, b) => {
        const ra = a.prestige_tier != null ? (PRESTIGE_RANK[a.prestige_tier] ?? 99) : 99
        const rb = b.prestige_tier != null ? (PRESTIGE_RANK[b.prestige_tier] ?? 99) : 99
        return ra - rb
      })
    }
    return list
  }, [history, sort])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">My History</h1>
      <p className="mt-1 text-sm text-muted-foreground">{history.length} films logged in your diary.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                sort === s.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Info className="h-4 w-4 text-primary" />
          Click on a movie to edit the log
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {entries.map((entry) => {
          const tier = entry.prestige_tier ? PRESTIGE_RECORD[entry.prestige_tier] : null
          const isPlatinum = entry.prestige_tier === "Platinum"
          return (
            <div
              key={entry.tmdb_id}
              className={cn(
                "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                entry.prestige_tier ? (TIER_STYLE[entry.prestige_tier] ?? "border-border") : "border-border",
                isPlatinum && "animate-platinum-glow platinum-shine",
              )}
            >
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => navigate(`/films/${entry.tmdb_id}`)}
                className="absolute inset-0 z-0 cursor-pointer"
              />

              <div className="flex gap-4">
                <div className="pointer-events-none relative z-10 block w-20 shrink-0 sm:w-24">
                  <PosterFrame film={entry} className="ring-1 ring-border" />
                </div>

                <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                    <div>
                      <span className="font-heading text-base font-bold leading-tight group-hover:text-primary">
                        {entry.title}
                      </span>
                      {(entry.year || entry.director || entry.runtime) && (
                        <p className="text-xs text-muted-foreground">
                          {[entry.year, entry.director, formatRuntime(entry.runtime)].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    {tier && (
                      <Badge
                        variant="secondary"
                        className={cn("w-fit shrink-0 gap-1", isPlatinum && "bg-amber-100 text-amber-800")}
                      >
                        <span aria-hidden>{tier.emoji}</span>
                        {tier.label}
                      </Badge>
                    )}
                  </div>

                  {/* Desktop only - tags/note/date stay inline in the content column, as before */}
                  {(entry.tags.length > 0 || entry.personal_note) && (
                    <div className="mt-2 hidden flex-col gap-2 sm:flex">
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag) => (
                            <TagChip key={tag.id} label={tag.name} />
                          ))}
                        </div>
                      )}
                      {entry.personal_note && (
                        <p className="text-pretty text-sm italic text-muted-foreground">
                          &ldquo;{entry.personal_note}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                  <p className="mt-2 hidden text-xs text-muted-foreground sm:block">
                    Watched {formatDate(entry.created_at)}
                  </p>
                </div>

                <div className="relative z-10 flex shrink-0 flex-col items-center gap-1 self-start">
                  <button
                    type="button"
                    aria-label={`Edit log for ${entry.title ?? "this film"}`}
                    onClick={() => navigate(`/films/${entry.tmdb_id}`)}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.title ?? "this film"} from history`}
                    onClick={() => setRemoveTarget(entry)}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Mobile only - tags/note/date span the full card width below */}
              {(entry.tags.length > 0 || entry.personal_note) && (
                <div className="pointer-events-none relative z-10 flex flex-col gap-2 sm:hidden">
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag) => (
                        <TagChip key={tag.id} label={tag.name} />
                      ))}
                    </div>
                  )}
                  {entry.personal_note && (
                    <p className="text-pretty text-sm italic text-muted-foreground">
                      &ldquo;{entry.personal_note}&rdquo;
                    </p>
                  )}
                </div>
              )}

              <p className="pointer-events-none relative z-10 text-xs text-muted-foreground sm:hidden">
                Watched {formatDate(entry.created_at)}
              </p>
            </div>
          )
        })}
      </div>

      {history.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">No films logged yet.</div>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(isOpen) => !isOpen && setRemoveTarget(null)}
        title="Remove from history?"
        description={
          <>
            This will permanently delete your log for{" "}
            <span className="font-semibold text-foreground">{removeTarget?.title}</span>, including its
            prestige tier, tags and note. This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete log"
        onConfirm={() => removeTarget && removeFromHistory(removeTarget.tmdb_id)}
      />
    </div>
  )
}
