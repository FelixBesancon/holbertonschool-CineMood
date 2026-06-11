/**
 * AuthPage — Public login / register page.
 *
 * A centered card with two tabs: "Log in" and "Register".
 * Both forms currently call the MOCK login() from auth-context.tsx,
 * which sets a hardcoded user and redirects to /dashboard.
 *
 * TODO: wire handleSubmit to the real auth flow once src/context/AuthContext.tsx
 * replaces the mock:
 *   - Login tab → await login(email, password)  (POST /auth/login)
 *   - Register tab → await register(firstName, email, password)  (POST /auth/register)
 * Surface validation errors (422) and network errors inline.
 */
import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { Logo } from "@/components/logo"
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
}: {
  id: string
  label: string
  type: string
  placeholder: string
  icon: typeof Mail
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
          className="h-11 pl-9 focus-visible:border-primary focus-visible:ring-primary/25"
        />
      </div>
    </div>
  )
}

export function AuthPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [tab, setTab] = useState("login")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    login()
    navigate("/dashboard")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-1/2 hero-gradient" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="text-2xl" />
          <p className="max-w-xs text-pretty text-sm text-muted-foreground">
            Your personal film diary. Track what you watch, find what to watch next.
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardContent className="p-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList variant="default" className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Log in</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="pt-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Field id="login-email" label="Email" type="email" placeholder="felix@cinemood.app" icon={Mail} />
                  <Field id="login-password" label="Password" type="password" placeholder="••••••••" icon={Lock} />
                  <Button type="submit" size="lg" className="mt-2 h-11 w-full gap-2 text-sm">
                    Log in
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="pt-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Field id="reg-name" label="First name" type="text" placeholder="Félix" icon={UserIcon} />
                  <Field id="reg-email" label="Email" type="email" placeholder="felix@cinemood.app" icon={Mail} />
                  <Field id="reg-password" label="Password" type="password" placeholder="••••••••" icon={Lock} />
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
