/**
 * CineMoodApp — Root application component.
 *
 * Wraps the entire app with its context providers (AuthProvider,
 * LibraryProvider) and BrowserRouter, then declares all routes.
 *
 * Routing strategy:
 *   - /auth          → AuthPage (public, no layout)
 *   - /*             → ProtectedRoutes: redirect to /auth if not authenticated,
 *                      otherwise render the route inside AppLayout (navbar + main)
 *
 * The `mounted` guard prevents a hydration flash by delaying render
 * until the component is mounted on the client.
 *
 * TODO: replace AuthProvider and LibraryProvider mock implementations
 * with real API-backed versions before connecting to the backend.
 */
import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { LibraryProvider } from "@/components/library-context"
import { AppLayout } from "@/components/app-layout"
import { AuthPage } from "@/components/pages/auth-page"
import { DashboardPage } from "@/components/pages/dashboard-page"
import { SearchPage } from "@/components/pages/search-page"
import { HistoryPage } from "@/components/pages/history-page"
import { WatchlistPage } from "@/components/pages/watchlist-page"
import { FilmDetailPage } from "@/components/pages/film-detail-page"
import { RecommendationPage } from "@/components/pages/recommendation-page"
import { SwipePage } from "@/components/pages/swipe-page"
import { ResultsPage } from "@/components/pages/results-page"
import { ProfilePage } from "@/components/pages/profile-page"

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/catalog" element={<Navigate to="/search" replace />} />
        <Route path="/films/:id" element={<FilmDetailPage />} />
        <Route path="/recommendation" element={<RecommendationPage />} />
        <Route path="/recommendation/swipe" element={<SwipePage />} />
        <Route path="/recommendation/results" element={<ResultsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  )
}

function Router() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  )
}

export function CineMoodApp() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <AuthProvider>
      <LibraryProvider>
        <BrowserRouter>
          <Router />
        </BrowserRouter>
      </LibraryProvider>
    </AuthProvider>
  )
}
