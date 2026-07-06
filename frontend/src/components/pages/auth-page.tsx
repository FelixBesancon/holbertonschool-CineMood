/**
 * AuthPage - Public login / register page.
 *
 * A centered card with two tabs: "Log in" and "Register".
 * Login tab calls POST /auth/login, register tab calls POST /auth/register.
 * Validation errors (422) and network errors are surfaced inline.
 */
import { useState, SyntheticEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, User as UserIcon, ArrowRight, Calendar } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import logoVertical from "@/assets/logos/logo-color-2.svg"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

function Field({
  id,
  label,
  type,
  placeholder,
  icon: Icon,
  value,
  onChange
}: {
  id: string
  label: string
  type: string
  placeholder: string
  icon: typeof Mail
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="h-11 pl-9 focus-visible:border-primary focus-visible:ring-primary/25"
        />
      </div>
    </div>
  )
}

export function AuthPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [tab, setTab] = useState("login")
  const handleTabChange = (value: string) => { setTab(value); setError("") }
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [age, setAge] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate("/dashboard")
    } catch (err) {
      setError("Invalid email or password")
    }
  }

  const handleRegister = async (e: SyntheticEvent) => {
    e.preventDefault()
    try {
      await register(firstName, lastName, email, password, age ? parseInt(age, 10) : undefined)
      navigate("/profile", { state: { onboarding: true } })
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (Array.isArray(detail) && detail.length > 0) {
        setError((detail as Array<{ msg: string }>).map(d => d.msg).join(' '))
      } else {
        setError("Registration failed")
      }
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-6 sm:py-10">
      <div className="absolute inset-x-0 top-0 h-1/2 hero-gradient" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-4 flex flex-col items-center gap-3 text-center sm:mb-8">
          <img src={logoVertical} alt="CinéMood" className="h-20 w-auto sm:h-36" />
          <p className="max-w-xs text-pretty text-sm text-muted-foreground">
            Your personal film diary. Track what you watch, find what to watch next.
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardContent className="p-6">
            <Tabs value={tab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Log in</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="pt-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Field
                    id="login-email"
                    label="Email"
                    type="email"
                    placeholder="example@cinemood.com"
                    icon={Mail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Field
                    id="login-password"
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    icon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button type="submit" size="lg" className="mt-2 h-11 w-full gap-2 text-sm">
                    Log in
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="pt-6">
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <Field
                    id="reg-firstName"
                    label="First Name"
                    type="text"
                    placeholder="First Name"
                    icon={UserIcon}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Field
                    id="reg-lastName"
                    label="Last Name"
                    type="text"
                    placeholder="Last Name"
                    icon={UserIcon}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <Field
                    id="reg-email"
                    label="Email"
                    type="email"
                    placeholder="example@cinemood.com"
                    icon={Mail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Field
                    id="reg-password"
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    icon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Field
                    id="reg-age"
                    label="Age"
                    type="text"
                    placeholder="Age (optionnal)"
                    icon={Calendar}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button type="submit" size="lg" className="mt-2 h-11 w-full gap-2 text-sm">
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to CinéMood&apos;s Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  )
}
