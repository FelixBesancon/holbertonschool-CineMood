/**
 * AppLayout — Persistent shell for all authenticated pages.
 *
 * Renders:
 *   - NavBar: sticky top bar with logo, navigation links (hidden on mobile,
 *     replaced by a fixed-column icon grid below the header), and a
 *     user account dropdown (Profile + Logout).
 *   - <main>: page content with a fade-in animation keyed on the pathname
 *     so each navigation triggers the animation.
 *
 * NAV_LINKS drives both the desktop nav and the mobile icon grid — the grid's
 * column count is derived from NAV_LINKS.length, so adding/removing a link
 * doesn't require touching the layout separately.
 * Active state is set via startsWith() so sub-routes (e.g. /recommendation/swipe)
 * keep the parent link highlighted.
 */
import type { ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ChevronDown, LogOut, User as UserIcon, Home, Search, History, Bookmark, Wand2 } from "lucide-react"
import { Logo } from "@/components/logo"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/history", label: "History", icon: History },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/recommendation", label: "For You", icon: Wand2 },
]

function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const isActive = (to: string) =>
    location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to))

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : "U"

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/dashboard" className="flex items-center" aria-label="CinéMood home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive(link.to)
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">My Account</span>
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {user?.first_name} {user?.last_name}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <UserIcon className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-primary"
                onClick={() => {
                  logout()
                  navigate("/auth")
                }}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile nav — fixed column grid so every link fits on screen, no horizontal scroll */}
      <nav
        className="grid gap-0.5 border-t border-border px-1 py-1.5 md:hidden"
        style={{ gridTemplateColumns: `repeat(${NAV_LINKS.length}, minmax(0, 1fr))` }}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-center text-[10px] font-medium leading-tight transition-all duration-200",
              isActive(link.to) ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <main key={location.pathname} className="flex-1 animate-fade-in-up">
        {children}
      </main>
    </div>
  )
}
