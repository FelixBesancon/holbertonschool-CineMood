/**
 * AuthContext — Authentication context (backend-connected).
 *
 * Manages JWT-based auth state:
 *   - login(email, password): calls POST /auth/login, stores user+token in sessionStorage.
 *   - register(...): calls POST /auth/register, stores user+token in sessionStorage.
 *   - logout(): clears token and user from sessionStorage and resets state.
 *   - updateProfile(data): PATCH /users/me — partially updates profile fields.
 *   - updatePlatforms(ids): PUT /users/me/platforms — replaces the user's platform list.
 *   - isAuthenticated: derived from whether a token is present.
 *
 * The Axios interceptor in src/services/api.ts reads the token from
 * sessionStorage on every request, so new tabs inherit the session.
 * A 401 response in the interceptor clears the token and redirects to /.
 */
import { createContext, useContext, useState, ReactNode } from 'react'
import api from '../services/api'
import type { User, Platform } from '@/types/api'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (
    first_name: string, last_name: string,
    email: string, password: string, age?: number
  ) => Promise<void>
  logout: () => void
  updateProfile: (data: {
    first_name?: string
    last_name?: string
    username?: string
    age?: number | null
  }) => Promise<void>
  updatePlatforms: (platformIds: number[]) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('user')
    return stored ? (JSON.parse(stored) as User) : null
  })
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'))

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { user, token } = response.data
    setToken(token)
    setUser(user)
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
  }

  const register = async (
    first_name: string, last_name: string,
    email: string, password: string, age?: number
  ) => {
    const response = await api.post('/auth/register', {
      first_name, last_name, email, password, age
    })
    const { user, token } = response.data
    setToken(token)
    setUser(user)
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }

  const updateProfile = async (data: {
    first_name?: string
    last_name?: string
    username?: string
    age?: number | null
  }) => {
    const response = await api.patch('/users/me', data)
    const updatedUser: User = response.data
    setUser(updatedUser)
    sessionStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const updatePlatforms = async (platformIds: number[]) => {
    const response = await api.put('/users/me/platforms', { platform_ids: platformIds })
    const updatedPlatforms: Platform[] = response.data
    if (user) {
      const updatedUser = { ...user, platforms: updatedPlatforms }
      setUser(updatedUser)
      sessionStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{
      user, token, login, register, logout, updateProfile, updatePlatforms, isAuthenticated
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
