/**
 * mock-data.ts - Static fixture data for the recommendation questionnaire.
 *
 * MOOD_QUESTIONS: the five questionnaire steps rendered by recommendation-page.tsx.
 * All other mock data (FILMS, RECOMMENDATIONS, PLATFORM_CHIP) has been removed
 * now that the recommendation flow is fully connected to the backend API.
 */

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
      { emoji: "🚫", label: "No sequels", hint: "A stand-alone story, nothing from a franchise." },
    ],
  },
]
