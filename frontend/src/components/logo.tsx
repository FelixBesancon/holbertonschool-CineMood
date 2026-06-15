/**
 * Logo — CinéMood wordmark with the Lucide Film icon.
 *
 * Renders inline so it can be placed inside a Link, a header, or an auth page.
 * Accepts an optional className for size/colour overrides.
 */
import { Film } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-heading text-xl font-extrabold tracking-tight", className)}>
      <Film className="h-5 w-5 text-primary" strokeWidth={2.5} />
      <span>
        <span className="text-primary">Ciné</span>
        <span className="text-foreground">Mood</span>
      </span>
    </span>
  )
}
