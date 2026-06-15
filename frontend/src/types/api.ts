/**
 * Shared TypeScript types mirroring the CinéMood backend API responses.
 *
 * These interfaces match the Pydantic schemas in backend/app/schemas/.
 * All dates are ISO 8601 strings (e.g. "2024-06-12T10:30:00Z").
 */

/** Mood/genre tag that can be attached to a viewing history entry. */
export interface Tag {
  id: number
  name: string
  description: string
}

/** A film entry in the user's viewing history (POST /history). */
export interface HistoryEntry {
  id: string
  created_at: string
  updated_at: string
  /** The Movie Database (TMDB) film identifier. */
  tmdb_id: number
  /** Film title fetched from TMDB at log time; null if lookup failed. */
  title: string | null
  /** Absolute URL to the TMDB poster image; null if unavailable. */
  poster_url: string | null
  /** Release year; null if TMDB did not provide it. */
  year: number | null
  /** Director name(s), comma-joined; null if unavailable. */
  director: string | null
  /** Film overview from TMDB; null if unavailable. */
  synopsis: string | null
  /** Genre names from TMDB; null if unavailable. */
  genres: string[] | null
  /** Duration in minutes from TMDB; null if unavailable. */
  runtime: number | null
  tags: Tag[]
  /**
   * User's personal rating for this film.
   * Ordered best → worst: Platinum, Gold, Silver, Bronze, Coal, Trash.
   * Null if the user did not assign a rating.
   */
  prestige_tier: string | null
  /** Free-text note written by the user about this viewing. */
  personal_note: string | null
}

/** A film saved to the user's watchlist (POST /watchlist). */
export interface WatchlistEntry {
  id: string
  created_at: string
  updated_at: string
  /** The Movie Database (TMDB) film identifier. */
  tmdb_id: number
  /** Film title fetched from TMDB at save time; null if lookup failed. */
  title: string | null
  /** Absolute URL to the TMDB poster image; null if unavailable. */
  poster_url: string | null
  /** Release year; null if TMDB did not provide it. */
  year: number | null
  /** Director name(s), comma-joined; null if unavailable. */
  director: string | null
  /** Film overview from TMDB; null if unavailable. */
  synopsis: string | null
  /** Genre names from TMDB; null if unavailable. */
  genres: string[] | null
  /** Duration in minutes from TMDB; null if unavailable. */
  runtime: number | null
}

export interface Film {
  tmdb_id: number
  title: string
  year: number | null
  poster_url: string | null
  synopsis: string | null
  genres: string[] | null
  director: string | null
  cast: string[] | null
  runtime: number | null
  streaming_platforms: string[] | null
}

export interface FilmWithStatus {
  film: Film
  in_history: boolean
  in_watchlist: boolean
}
