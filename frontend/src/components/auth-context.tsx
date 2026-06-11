/**
 * AuthContext — Authentication state (MOCK implementation).
 *
 * Provides user identity and isAuthenticated to the component tree.
 * Currently uses a hardcoded mock user so all pages render during
 * development without a real backend.
 *
 * TODO: replace with src/context/AuthContext.tsx once the backend
 * is connected. That version calls POST /auth/login and POST /auth/register,
 * stores the JWT in sessionStorage, and handles token expiry via
 * the Axios interceptor in src/services/api.ts.
 */
import { createContext, useContext, useState, type ReactNode } from "react"

interface User {
  firstName: string
  lastName: string
  age: number
  email: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const MOCK_USER: User = {
  firstName: "Félix",
  lastName: "Moreau",
  age: 28,
  email: "felix@cinemood.app",
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Default: logged in, so all pages render
  const [user, setUser] = useState<User | null>(MOCK_USER)

  const login = () => setUser(MOCK_USER)
  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
