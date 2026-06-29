/**
 * LoadingScreen — Full-page loading overlay shown during Mistral API calls.
 *
 * Displays the CinéMood logo (Film icon inside a spinning ring) centered on
 * a blank background. Swap the Film icon for a real logo asset once the
 * graphist delivers it.
 */
import { Film } from "lucide-react"

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background">
      <div className="relative flex items-center justify-center">
        <div className="h-28 w-28 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
        <Film className="absolute h-12 w-12 text-primary" strokeWidth={1.8} />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="font-heading text-3xl font-extrabold tracking-tight">
          <span className="text-primary">Ciné</span>Mood
        </span>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}
