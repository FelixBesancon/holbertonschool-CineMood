/**
 * mock-data.ts — Static fixture data used during frontend development.
 *
 * Provides:
 *   - Type definitions: Film, LogEntry, PrestigeTier, FilmStatus, Recommendation
 *   - FILMS: catalogue of 6 films with poster, backdrop, genres, etc.
 *   - MOOD_TAGS / PRESTIGE_TIERS: UI constants for the log-film dialog
 *   - RECENTLY_WATCHED / WATCHLIST: pre-seeded library state (consumed by LibraryContext)
 *   - RECOMMENDATIONS: ranked film picks used on the results page
 *   - MOOD_QUESTIONS: questionnaire for the recommendation swipe flow
 *   - Helper functions: getFilm(), getFilmStatus()
 *
 * TODO: remove this file (or reduce it to type definitions) once the app
 * fetches real data from the backend. Replace FILMS with GET /films/search,
 * RECENTLY_WATCHED with GET /history, WATCHLIST with GET /watchlist, and
 * RECOMMENDATIONS with the future GET /recommendations endpoint.
 */
export type PrestigeTier = "platinum" | "gold" | "silver" | "bronze" | "trash"

export interface LogEntry {
  tags: string[]
  prestige: PrestigeTier | null
  note: string
}

export interface Film {
  id: string
  title: string
  year: number
  director: string
  runtime: string
  genres: string[]
  synopsis: string
  poster: string
  backdrop: string
  stills: string[]
  highlights: string[]
  platform: "Netflix" | "Prime" | "Disney+"
}

export const MOOD_TAGS = [
  "Great with a group",
  "Guilty pleasure",
  "Mind blowing",
  "Needs full attention",
  "Would rewatch immediately",
  "Fell asleep",
  "Emotional wreck",
  "So stupid it's good",
] as const

export const PRESTIGE_TIERS: { id: PrestigeTier; label: string; emoji: string }[] = [
  { id: "platinum", label: "Platinum", emoji: "🏆" },
  { id: "gold", label: "Gold", emoji: "🥇" },
  { id: "silver", label: "Silver", emoji: "🥈" },
  { id: "bronze", label: "Bronze", emoji: "🥉" },
  { id: "trash", label: "Trash", emoji: "🗑️" },
]

const poster = (id: string, txt: string) =>
  `https://picsum.photos/seed/${id}/400/600`
const backdrop = (id: string) => `https://picsum.photos/seed/${id}-bg/1200/675`
const still = (id: string, n: number) => `https://picsum.photos/seed/${id}-s${n}/320/180`

export const FILMS: Film[] = [
  {
    id: "parasite",
    title: "Parasite",
    year: 2019,
    director: "Bong Joon-ho",
    runtime: "2h 12m",
    genres: ["Thriller", "Drama", "Dark Comedy"],
    synopsis:
      "A poor family schemes to become employed by a wealthy household by infiltrating their lives, until a shocking turn upends everyone's plans.",
    poster: poster("parasite", "Parasite"),
    backdrop: backdrop("parasite"),
    stills: [still("parasite", 1), still("parasite", 2)],
    highlights: ["Won 4 Oscars", "Palme d'Or", "Mind-blowing ending"],
    platform: "Netflix",
  },
  {
    id: "dark-knight",
    title: "The Dark Knight",
    year: 2008,
    director: "Christopher Nolan",
    runtime: "2h 32m",
    genres: ["Action", "Crime", "Drama"],
    synopsis:
      "Batman faces the Joker, a criminal mastermind who plunges Gotham into anarchy and forces the Dark Knight closer to crossing the line.",
    poster: poster("dark-knight", "The Dark Knight"),
    backdrop: backdrop("dark-knight"),
    stills: [still("dark-knight", 1), still("dark-knight", 2)],
    highlights: ["Cult classic", "Iconic villain", "Won 2 Oscars"],
    platform: "Prime",
  },
  {
    id: "eeaao",
    title: "Everything Everywhere All at Once",
    year: 2022,
    director: "Daniels",
    runtime: "2h 19m",
    genres: ["Sci-Fi", "Comedy", "Adventure"],
    synopsis:
      "An overwhelmed laundromat owner discovers she must connect with versions of herself across the multiverse to stop a great threat.",
    poster: poster("eeaao", "EEAAO"),
    backdrop: backdrop("eeaao"),
    stills: [still("eeaao", 1), still("eeaao", 2)],
    highlights: ["Won 7 Oscars", "Mind-blowing", "Emotional wreck"],
    platform: "Disney+",
  },
  {
    id: "amelie",
    title: "Amélie",
    year: 2001,
    director: "Jean-Pierre Jeunet",
    runtime: "2h 2m",
    genres: ["Romance", "Comedy"],
    synopsis:
      "A shy Parisian waitress decides to secretly orchestrate the happiness of those around her, while discovering love of her own.",
    poster: poster("amelie", "Amélie"),
    backdrop: backdrop("amelie"),
    stills: [still("amelie", 1), still("amelie", 2)],
    highlights: ["Cult classic", "Feel-good", "Visually stunning"],
    platform: "Netflix",
  },
  {
    id: "interstellar",
    title: "Interstellar",
    year: 2014,
    director: "Christopher Nolan",
    runtime: "2h 49m",
    genres: ["Sci-Fi", "Drama", "Adventure"],
    synopsis:
      "A team of explorers travels through a wormhole in space in an attempt to ensure humanity's survival as Earth becomes uninhabitable.",
    poster: poster("interstellar", "Interstellar"),
    backdrop: backdrop("interstellar"),
    stills: [still("interstellar", 1), still("interstellar", 2)],
    highlights: ["Won 1 Oscar", "Mind-blowing ending", "Epic score"],
    platform: "Prime",
  },
  {
    id: "grand-budapest",
    title: "The Grand Budapest Hotel",
    year: 2014,
    director: "Wes Anderson",
    runtime: "1h 39m",
    genres: ["Comedy", "Adventure"],
    synopsis:
      "A legendary concierge and his trusted lobby boy become embroiled in the theft of a priceless painting and a battle for a vast fortune.",
    poster: poster("grand-budapest", "Grand Budapest"),
    backdrop: backdrop("grand-budapest"),
    stills: [still("grand-budapest", 1), still("grand-budapest", 2)],
    highlights: ["Won 4 Oscars", "Visually iconic", "Guilty pleasure"],
    platform: "Disney+",
  },
]

export function getFilm(id: string) {
  return FILMS.find((f) => f.id === id)
}

// Pre-seeded diary state (full viewing history)
export const RECENTLY_WATCHED: {
  filmId: string
  tags: string[]
  prestige: PrestigeTier
  note?: string
  watchedAt: string
}[] = [
  {
    filmId: "parasite",
    tags: ["Mind blowing", "Needs full attention", "Would rewatch immediately"],
    prestige: "platinum",
    note: "Watched it twice in a week. The tonal shifts are masterful — still thinking about that basement.",
    watchedAt: "2024-06-02",
  },
  {
    filmId: "dark-knight",
    tags: ["Would rewatch immediately", "Mind blowing"],
    prestige: "gold",
    note: "Heath Ledger steals every scene. The interrogation still gives me chills.",
    watchedAt: "2024-05-18",
  },
  {
    filmId: "eeaao",
    tags: ["Emotional wreck", "Mind blowing"],
    prestige: "gold",
    note: "Cried during the rocks scene. Did not expect that.",
    watchedAt: "2024-06-09",
  },
]

export const WATCHLIST: { filmId: string; addedAt: string }[] = [
  { filmId: "interstellar", addedAt: "2024-06-08" },
  { filmId: "grand-budapest", addedAt: "2024-05-21" },
]

// Rank used to sort/style prestige tiers (highest first)
export const PRESTIGE_RANK: Record<PrestigeTier, number> = {
  platinum: 0,
  gold: 1,
  silver: 2,
  bronze: 3,
  trash: 4,
}

export type FilmStatus = "watched" | "watchlist" | "none"

export function getFilmStatus(id: string): FilmStatus {
  if (RECENTLY_WATCHED.some((e) => e.filmId === id)) return "watched"
  if (WATCHLIST.some((e) => e.filmId === id)) return "watchlist"
  return "none"
}

// Logged films with full diary entries (for film detail history)
export const LOGGED: Record<string, LogEntry> = {
  parasite: {
    tags: ["Mind blowing", "Needs full attention"],
    prestige: "platinum",
    note: "Watched it twice in a week. The tonal shifts are masterful — still thinking about that basement.",
  },
  eeaao: {
    tags: ["Emotional wreck", "Mind blowing"],
    prestige: "gold",
    note: "Cried during the rocks scene. Did not expect that.",
  },
}

export const PLATFORMS = [
  { id: "netflix", label: "Netflix", color: "#E50914" },
  { id: "prime", label: "Prime Video", color: "#00A8E1" },
  { id: "disney", label: "Disney+", color: "#113CCF" },
  { id: "canal", label: "Canal+", color: "#1a1a1a" },
  { id: "appletv", label: "Apple TV+", color: "#333333" },
  { id: "ocs", label: "OCS", color: "#F36F21" },
]

export const MOOD_QUESTIONS = [
  {
    key: "audience",
    title: "Who's watching tonight?",
    options: [
      { emoji: "🧍", label: "Just me" },
      { emoji: "❤️", label: "As a couple" },
      { emoji: "👯", label: "With friends" },
      { emoji: "👥", label: "Small group" },
      { emoji: "👨‍👩‍👧‍👦", label: "With family" },
    ],
  },
  {
    key: "feeling",
    title: "How are you feeling tonight?",
    options: [
      { emoji: "😴", label: "Tired" },
      { emoji: "🤩", label: "Excited" },
      { emoji: "😢", label: "Sad" },
      { emoji: "😂", label: "Need to laugh" },
      { emoji: "😤", label: "Stressed" },
      { emoji: "🥱", label: "Bored" },
    ],
  },
  {
    key: "attention",
    title: "How much attention can you give?",
    options: [
      { emoji: "🧠", label: "Full focus" },
      { emoji: "📱", label: "Half-distracted" },
      { emoji: "💤", label: "Almost asleep" },
    ],
  },
] as const

export interface Recommendation {
  filmId: string
  reason: string
  match: number
  platform: "Netflix" | "Prime" | "Disney+"
}

export const RECOMMENDATIONS: Recommendation[] = [
  {
    filmId: "amelie",
    reason: "Because you wanted something light and loved Parasite's playful side…",
    match: 92,
    platform: "Netflix",
  },
  {
    filmId: "grand-budapest",
    reason: "A cozy, whimsical pick for a half-distracted evening…",
    match: 88,
    platform: "Disney+",
  },
  {
    filmId: "interstellar",
    reason: "When you're ready to feel something huge and beautiful…",
    match: 84,
    platform: "Prime",
  },
  {
    filmId: "eeaao",
    reason: "Because you're in the mood to laugh and maybe cry a little…",
    match: 79,
    platform: "Disney+",
  },
]

export const PLATFORM_CHIP: Record<string, string> = {
  Netflix: "#E50914",
  Prime: "#00A8E1",
  "Disney+": "#113CCF",
}
