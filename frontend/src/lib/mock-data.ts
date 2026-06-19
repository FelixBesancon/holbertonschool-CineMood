/**
 * mock-data.ts - Static fixture data for the recommendation flow.
 *
 * The recommendation feature (questionnaire → swipe → results) is not yet
 * connected to a backend endpoint. This file provides the mock catalogue and
 * ranked picks used by swipe-page, results-page, and recommendation-page
 * until a POST /recommendations endpoint is available.
 *
 * FILMS / getFilm: 6 curated films used by the swipe deck and results cards.
 * MOOD_QUESTIONS: questionnaire steps for recommendation-page.
 * PLATFORMS: streaming services shown in profile-page.
 * RECOMMENDATIONS / PLATFORM_CHIP: ranked picks and platform badge colours
 *     used by results-page.
 */

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

const poster = (id: string) =>
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
    poster: poster("parasite"),
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
    poster: poster("dark-knight"),
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
    poster: poster("eeaao"),
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
    poster: poster("amelie"),
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
    poster: poster("interstellar"),
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
    poster: poster("grand-budapest"),
    backdrop: backdrop("grand-budapest"),
    stills: [still("grand-budapest", 1), still("grand-budapest", 2)],
    highlights: ["Won 4 Oscars", "Visually iconic", "Guilty pleasure"],
    platform: "Disney+",
  },
]

export function getFilm(id: string) {
  return FILMS.find((film) => film.id === id)
}

export const PLATFORMS = [
  { id: "netflix", label: "Netflix", color: "#E50914" },
  { id: "prime", label: "Prime Video", color: "#00A8E1" },
  { id: "disney", label: "Disney+", color: "#113CCF" },
  { id: "canal", label: "Canal+", color: "#1a1a1a" },
  { id: "appletv", label: "Apple TV+", color: "#333333" },
  { id: "ocs", label: "OCS", color: "#F36F21" },
]

export interface MoodOption {
  emoji: string
  label: string
  hint: string
  /** Label of the mutually exclusive option - selecting this deselects that one. */
  exclusiveWith?: string
}

export interface MoodQuestion {
  key: string
  title: string
  subtitle: string
  min: number
  max: number
  /** When true, the step auto-scrolls to the next section as soon as max is reached. */
  autoAdvance: boolean
  options: MoodOption[]
}

export const MOOD_QUESTIONS: MoodQuestion[] = [
  {
    key: "audience",
    title: "Who's watching?",
    subtitle: "Select one, no wrong answer.",
    min: 1,
    max: 1,
    autoAdvance: true,
    options: [
      { emoji: "🧍", label: "Just me", hint: "Simply the best, no compromises." },
      { emoji: "💕", label: "As a couple", hint: "A safe pick for two people who get each other." },
      { emoji: "❤️‍🔥", label: "On a date", hint: "Watch, chill, and pause whenever you want." },
      { emoji: "👯", label: "With friends", hint: "This might spark a heated debate." },
      { emoji: "👥", label: "With a group", hint: "Broad, fun, and consensus-friendly." },
      { emoji: "👨‍👩‍👧‍👦", label: "With family", hint: "A cheerful movie, a better moment together." },
    ],
  },
  {
    key: "mood",
    title: "What do you want this movie to do for you?",
    subtitle: "Select up to 2.",
    min: 1,
    max: 2,
    autoAdvance: true,
    options: [
      { emoji: "😊", label: "Comfort me", hint: "Warm, cozy, reassuring." },
      { emoji: "😂", label: "Make me laugh", hint: "Fun, light-hearted, entertaining." },
      { emoji: "😭", label: "Make me feel something", hint: "Emotional, moving, memorable." },
      { emoji: "😱", label: "Keep me on edge", hint: "Suspense, mystery, crime." },
      { emoji: "🤯", label: "Blow my mind", hint: "Epic, spectacular, unforgettable." },
      { emoji: "🧟", label: "Terrifies me", hint: "Terror, thrills, chills." },
      { emoji: "🧠", label: "Make me think", hint: "Clever, thought-provoking, layered." },
      { emoji: "✨", label: "Surprise me", hint: "Unexpected, original, unusual." },
      { emoji: "🎲", label: "I'm open to anything", hint: "Show me your best shot." },
    ],
  },
  {
    key: "desire",
    title: "What sounds most appealing to watch?",
    subtitle: "",
    min: 1,
    max: 1,
    autoAdvance: true,
    options: [
      { emoji: "🍿", label: "Something easy", hint: "Fun, accessible, no homework." },
      { emoji: "🎬", label: "Something immersive", hint: "A movie to get lost in." },
      { emoji: "🧩", label: "Something challenging", hint: "Complex, layered, rewarding." },
      { emoji: "🧸", label: "Something familiar", hint: "I might already know this one, and that's fine." },
      { emoji: "🚀", label: "Something out of my comfort zone", hint: "Show me something I'd never pick myself." },
    ],
  },
  {
    key: "preferences",
    title: "Any preferences?",
    subtitle: "Optional - pick up to 4.",
    min: 0,
    max: 4,
    autoAdvance: false,
    options: [
      { emoji: "🎞️", label: "Older films welcome", hint: "Classics and films before the 2000s.", exclusiveWith: "Recent films preferred" },
      { emoji: "🔥", label: "Recent films preferred", hint: "Fresh releases and modern favorites.", exclusiveWith: "Older films welcome" },
      { emoji: "🏆", label: "Highly rated only", hint: "Well-reviewed by critics or audiences.", exclusiveWith: "Open to cheesy movies" },
      { emoji: "🗑️", label: "Open to cheesy movies", hint: "Not everything needs to be a masterpiece.", exclusiveWith: "Highly rated only" },
      { emoji: "🌍", label: "International films welcome", hint: "Bring on the world cinema." },
      { emoji: "🕜", label: "Under 90 minutes", hint: "Short and sweet.", exclusiveWith: "Under 2 hours" },
      { emoji: "🕑", label: "Under 2 hours", hint: "No epic commitments tonight.", exclusiveWith: "Under 90 minutes" },
    ],
  },
  {
    key: "dealbreakers",
    title: "Any deal breakers?",
    subtitle: "Optional - pick up to 2.",
    min: 0,
    max: 2,
    autoAdvance: false,
    options: [
      { emoji: "🚫", label: "No violence", hint: "Keep it clean and safe." },
      { emoji: "🚫", label: "No sad ending", hint: "We want to leave on a good note." },
      { emoji: "🚫", label: "No subtitles", hint: "Original language only, no reading tonight." },
      { emoji: "🚫", label: "No slow movies", hint: "Skip the arthouse pacing." },
      { emoji: "🚫", label: "No musicals", hint: "Not in the mood for singing." },
      { emoji: "🚫", label: "No sequels", hint: "	A stand-alone story, nothing from a franchise." },
    ],
  },
]

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
