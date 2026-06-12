/**
 * AuthContext — Authentication context (backend-connected).
 *
 * Manages JWT-based auth state:
 *   - login(email, password): calls POST /auth/login, stores the returned
 *     token in sessionStorage, sets user and token state.
 *   - logout(): clears token from sessionStorage and resets state.
 *   - isAuthenticated: derived from whether a token is present.
 *
 * The Axios interceptor in src/services/api.ts reads the token from
 * sessionStorage on every request, so new tabs inherit the session.
 * A 401 response in the interceptor clears the token and redirects to /.
 */
import { createContext, useContext, useState, ReactNode } from 'react'
import api from '../services/api'

interface User {
  id: string
  first_name: string
  last_name: string
  username: string
  email: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (
    first_name: string, last_name: string,
    email: string, password: string, age: number
  ) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'))

  const login = async (
    email: string, password: string
  ) => {
    const response = await api.post('/auth/login', { email, password })
    const { user, token } = response.data
    setToken(token)
    setUser(user)
    sessionStorage.setItem('token', token)
  }

  const register = async (
    first_name: string, last_name: string,
    email: string, password: string, age: number
  ) => {
    const response = await api.post('/auth/register', {
      first_name, last_name, email, password, age
    })
    const { user, token } = response.data
    setToken(token)
    setUser(user)
    sessionStorage.setItem('token', token)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    sessionStorage.removeItem('token')
  }

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{
      user, token, login, register, logout, isAuthenticated
      }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
