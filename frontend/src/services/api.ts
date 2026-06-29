/**
 * api.ts — Axios instance pre-configured for the CinéMood backend.
 *
 * Base URL defaults to http://localhost:8000 (FastAPI dev server) and can be
 * overridden via the VITE_API_URL environment variable for staging/production.
 *
 * Request interceptor: reads the JWT from sessionStorage and injects it as
 *   Authorization: Bearer <token> on every outgoing request.
 *
 * Response interceptor: on a 401 Unauthorized response, removes the stale
 *   token from sessionStorage and hard-redirects to / so the user lands on
 *   the auth page. All other errors are re-thrown for the caller to handle.
 *
 * Usage: import api from '@/services/api' then api.get('/history'), etc.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

// Interceptor : inject JWT token in every request automatically
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor : handle global errors (401, 500, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default api
