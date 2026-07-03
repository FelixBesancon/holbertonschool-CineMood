import { cn } from "@/lib/utils"
import logoColor from "@/assets/logos/logo-color.svg"

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoColor}
      alt="CinéMood"
      className={cn("h-8 w-auto", className)}
    />
  )
}
