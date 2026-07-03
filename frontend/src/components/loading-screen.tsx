import logoIcon from "@/assets/logos/logo-icon-color.svg"

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background">
      <div className="relative flex items-center justify-center">
        <div className="h-36 w-36 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
        <img src={logoIcon} alt="CinéMood" className="absolute h-20 w-20 animate-popcorn-shake" />
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
