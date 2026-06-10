import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { AxiosError } from 'axios'

interface ApiErrorDetail {
  msg: string
}

/**
 * Parse an Axios error into a human-readable string.
 *
 * FastAPI returns two different error shapes depending on the source:
 *
 *   - Business logic errors (401, 409, 500...):
 *       { "detail": "Email already registered" }        ← string
 *
 *   - Pydantic validation errors (422):
 *       { "detail": [{ "msg": "Value error, ...", "loc": [...] }] }  ← array
 *
 *   - No response at all: network error or backend not running.
 */
function parseApiError(err: AxiosError<{ detail?: string | ApiErrorDetail[] }>): string {
  if (!err.response) {
    return 'Unable to reach the server. Make sure the backend is running.'
  }

  const detail = err.response.data?.detail

  // Business logic error — detail is already a plain string
  if (typeof detail === 'string') {
    return detail
  }

  // Pydantic validation error — detail is an array of error objects.
  // We strip the "Value error, " prefix added by Pydantic v2.
  if (Array.isArray(detail)) {
    return detail
      .map((e) => e.msg.replace('Value error, ', ''))
      .join(' — ')
  }

  return 'An error has occurred.'
}

/**
 * AuthPage — Login and registration page.
 *
 * A single page handles both modes. The user switches between them
 * with the button at the bottom. `mode` controls which fields are
 * shown and which API call is made on submit.
 *
 * Flow:
 *   - Login: POST /auth/login via AuthContext.login() → redirect to /dashboard
 *   - Register: POST /auth/register → then auto-login → redirect to /dashboard
 */
function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const { login } = useAuth()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    try {
      if (mode === 'register') {
        await api.post('/auth/register', {
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password,
          age: age ? parseInt(age, 10) : null
        })
        await login(email, password)
      } else {
        await login(email, password)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(parseApiError(err as AxiosError<{ detail?: string | ApiErrorDetail[] }>))
    }
  }

  return (
    <div>
      <h1>{mode === 'login' ? 'Login' : 'Register'}</h1>

      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <>
            <input
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Age (optional)"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">
          {mode === 'login' ? 'Sign in' : 'Create Account'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login'
          ? "Don't have an account? Register first."
          : 'Already have an account?'}
      </button>
    </div>
  )
}

export default AuthPage
