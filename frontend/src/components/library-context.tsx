/**
 * LibraryContext — Film library state management (MOCK implementation).
 *
 * Centralises all viewing-history and watchlist state so every page
 * reads from and writes to the same source of truth. Exposes:
 *   - history / watchlist: current entries (pre-seeded from mock-data.ts)
 *   - getStatus(filmId): "watched" | "watchlist" | "none"
 *   - addToWatchlist / removeFromWatchlist
 *   - removeFromHistory
 *   - logFilm: logs (or updates) a film and removes it from the watchlist
 *   - recommendations: films not yet in history
 *
 * State is kept in React useState — changes are lost on page refresh.
 *
 * TODO: replace mock state with real API calls when connecting to the backend:
 *   - GET  /history           → initial history state
 *   - GET  /watchlist         → initial watchlist state
 *   - POST /history           → logFilm
 *   - POST /watchlist         → addToWatchlist
 *   - DELETE /history/{id}    → removeFromHistory
 *   - DELETE /watchlist/{id}  → removeFromWatchlist
 *   - POST /watchlist/{id}/watched → mark_as_watched (logFilm from watchlist)
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  RECENTLY_WATCHED,
  WATCHLIST,
  RECOMMENDATIONS,
  type LogEntry,
  type PrestigeTier,
} from "@/lib/mock-data"

export type FilmStatus = "watched" | "watchlist" | "none"

export interface HistoryEntry {
  filmId: string
  tags: string[]
  prestige: PrestigeTier
  note?: string
  watchedAt: string
}

export interface WatchlistEntry {
  filmId: string
  addedAt: string
}

interface LibraryContextValue {
  history: HistoryEntry[]
  watchlist: WatchlistEntry[]
  getStatus: (filmId: string) => FilmStatus
  getHistoryEntry: (filmId: string) => HistoryEntry | undefined
  addToWatchlist: (filmId: string) => void
  removeFromWatchlist: (filmId: string) => void
  removeFromHistory: (filmId: string) => void
  /** Logs (or updates) a film in the history. Silently removes it from the watchlist. */
  logFilm: (filmId: string, entry: LogEntry) => void
  /** Recommendations excluding anything already in the viewing history. */
  recommendations: typeof RECOMMENDATIONS
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

const today = () => new Date().toISOString().slice(0, 10)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>(() => RECENTLY_WATCHED.map((e) => ({ ...e })))
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>(() => WATCHLIST.map((e) => ({ ...e })))

  const value = useMemo<LibraryContextValue>(() => {
    const getStatus = (filmId: string): FilmStatus => {
      if (history.some((e) => e.filmId === filmId)) return "watched"
      if (watchlist.some((e) => e.filmId === filmId)) return "watchlist"
      return "none"
    }

    const getHistoryEntry = (filmId: string) => history.find((e) => e.filmId === filmId)

    const addToWatchlist = (filmId: string) =>
      setWatchlist((prev) =>
        prev.some((e) => e.filmId === filmId) ? prev : [{ filmId, addedAt: today() }, ...prev],
      )

    const removeFromWatchlist = (filmId: string) =>
      setWatchlist((prev) => prev.filter((e) => e.filmId !== filmId))

    const removeFromHistory = (filmId: string) =>
      setHistory((prev) => prev.filter((e) => e.filmId !== filmId))

    const logFilm = (filmId: string, entry: LogEntry) => {
      // Silently remove from watchlist when logged as watched.
      setWatchlist((prev) => prev.filter((e) => e.filmId !== filmId))
      setHistory((prev) => {
        const existing = prev.find((e) => e.filmId === filmId)
        const next: HistoryEntry = {
          filmId,
          tags: entry.tags,
          prestige: (entry.prestige ?? "silver") as PrestigeTier,
          note: entry.note,
          watchedAt: existing?.watchedAt ?? today(),
        }
        if (existing) return prev.map((e) => (e.filmId === filmId ? next : e))
        return [next, ...prev]
      })
    }

    // A film already watched should never be recommended.
    const watchedIds = new Set(history.map((e) => e.filmId))
    const recommendations = RECOMMENDATIONS.filter((r) => !watchedIds.has(r.filmId))

    return {
      history,
      watchlist,
      getStatus,
      getHistoryEntry,
      addToWatchlist,
      removeFromWatchlist,
      removeFromHistory,
      logFilm,
      recommendations,
    }
  }, [history, watchlist])

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error("useLibrary must be used within a LibraryProvider")
  return ctx
}
