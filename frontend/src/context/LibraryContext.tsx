/**
 * LibraryContext — user's history and watchlist data.
 *
 * Fetches GET /history and GET /watchlist in parallel on mount and
 * exposes a refresh() function so any component can re-fetch after a
 * mutation (add / remove film).
 *
 * Error handling: these are GET endpoints with no request body, so the
 * backend only ever returns a string detail (network error, 503…).
 * 401s are caught upstream by the Axios interceptor and redirect to /.
 *
 * Usage:
 *   const { history, watchlist, loading, error, refresh } = useLibrary()
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import api from "@/services/api"
import type { HistoryEntry, WatchlistEntry } from "@/types/api"

interface LibraryContextValue {
  history: HistoryEntry[]
  watchlist: WatchlistEntry[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  getStatus: (tmdb_id: number) => string
  getHistoryEntry: (tmdb_id: number) => HistoryEntry | undefined
  removeFromWatchlist: (tmdb_id: number) => Promise<void>
  removeFromHistory: (tmdb_id: number) => Promise<void>
  addToWatchlist: (tmdb_id: number) => Promise<void>
  logFilm: (tmdb_id: number, opts?: {
    tags?: number[], prestige_tier?: string, personal_note?: string
  }) => Promise<void>
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [historyRes, watchlistRes] = await Promise.all([
        api.get('/history'),
        api.get('/watchlist'),
      ])
      setHistory(historyRes.data)
      setWatchlist(watchlistRes.data)
    } catch (err: unknown) {
      // GET endpoints never return a Pydantic array detail — string only
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? "Failed to load your library.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = () => fetchData()

  const getStatus = (tmdb_id: number) => {
    if (history.some(entry => entry.tmdb_id === tmdb_id)) return "watched"
    if (watchlist.some(entry => entry.tmdb_id === tmdb_id)) return "watchlist"
    return "none"
  }

  const getHistoryEntry = (tmdb_id: number) => {
    return history.find(entry => entry.tmdb_id === tmdb_id)
  }

  const removeFromWatchlist = async (tmdb_id: number) => {
    try {
      await api.delete(`/watchlist/${tmdb_id}`)
      await refresh()
    } catch (err: unknown) {
      throw (err)
    }
  }

  const removeFromHistory = async (tmdb_id: number) => {
    try {
      await api.delete(`/history/${tmdb_id}`)
      await refresh()
    } catch (err: unknown) {
      throw (err)
    }
  }

  const addToWatchlist = async (tmdb_id: number) => {
    try {
      await api.post('/watchlist', { tmdb_id })
      await refresh()
    } catch (err: unknown) {
      throw (err)
    }
  }

  const logFilm = async (tmdb_id: number, opts?: {
    tags?: number[], prestige_tier?: string, personal_note?: string
  }) => {
    try {
      await api.post('/history', { tmdb_id, ...opts })
      await refresh()
    } catch (err: unknown) {
      throw (err)
    }
  }

  return (
    <LibraryContext.Provider value={{
      history, watchlist, loading, error,
      refresh, getStatus, getHistoryEntry,
      removeFromWatchlist, removeFromHistory,
      addToWatchlist, logFilm
      }}>
      {children}
    </LibraryContext.Provider>
  )
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error("useLibrary must be used within a LibraryProvider")
  return ctx
}
