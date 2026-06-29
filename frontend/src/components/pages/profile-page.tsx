/**
 * ProfilePage - User profile and preferences editor.
 *
 * Two sections:
 *   - My info: editable first name, last name, and age fields (PATCH /users/me).
 *   - My streaming platforms: toggle grid built from GET /platforms catalogue.
 *     Selected platform IDs are saved via PUT /users/me/platforms.
 *
 * When reached after registration (location.state.onboarding === true), a
 * welcome banner is shown with a "Go to dashboard" shortcut.
 */
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import api from "@/services/api"
import type { Platform } from "@/types/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function ProfilePage() {
  const { user, updateProfile, updatePlatforms } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isOnboarding = (location.state as { onboarding?: boolean })?.onboarding === true

  const [first, setFirst] = useState(user?.first_name ?? "")
  const [last, setLast] = useState(user?.last_name ?? "")
  const [username, setUsername] = useState(user?.username ?? "")
  const [age, setAge] = useState(user?.age?.toString() ?? "")
  const [selected, setSelected] = useState<number[]>(
    () => user?.platforms?.map((p) => p.id) ?? []
  )

  const [catalogue, setCatalogue] = useState<Platform[]>([])
  const [catalogueLoading, setCatalogueLoading] = useState(true)

  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState("")

  const [platformsSaving, setPlatformsSaving] = useState(false)
  const [platformsSaved, setPlatformsSaved] = useState(false)
  const [platformsError, setPlatformsError] = useState("")

  useEffect(() => {
    api.get<Platform[]>('/platforms')
      .then((res) => setCatalogue(res.data))
      .catch(() => setCatalogue([]))
      .finally(() => setCatalogueLoading(false))
  }, [])

  const toggle = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    setProfileSaved(false)
    setProfileError("")
    try {
      await updateProfile({
        first_name: first,
        last_name: last,
        username,
        age: age ? parseInt(age, 10) : null,
      })
      setProfileSaved(true)
    } catch {
      setProfileError("Failed to save changes.")
    } finally {
      setProfileSaving(false)
    }
  }

  const handleSavePlatforms = async () => {
    setPlatformsSaving(true)
    setPlatformsSaved(false)
    setPlatformsError("")
    try {
      await updatePlatforms(selected)
      setPlatformsSaved(true)
    } catch {
      setPlatformsError("Failed to save preferences.")
    } finally {
      setPlatformsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Profile</h1>
      <p className="mt-2 text-muted-foreground">Manage your details and streaming platforms.</p>

      {isOnboarding && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-primary">
            Welcome to CinéMood! Choose your platforms below, then head to the dashboard.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => navigate("/dashboard")}
          >
            Go to dashboard
          </Button>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-6">
        {/* My info */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">My info</CardTitle>
            <CardDescription>Update your personal details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="first">First name</Label>
                <Input
                  id="first"
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                  className="focus-visible:border-primary focus-visible:ring-primary/25"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="last">Last name</Label>
                <Input
                  id="last"
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                  className="focus-visible:border-primary focus-visible:ring-primary/25"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus-visible:border-primary focus-visible:ring-primary/25"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="focus-visible:border-primary focus-visible:ring-primary/25"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Button onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? "Saving…" : "Save changes"}
              </Button>
              {profileSaved && (
                <span className="text-sm text-muted-foreground">Saved!</span>
              )}
              {profileError && (
                <span className="text-sm text-destructive">{profileError}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platforms */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">My streaming platforms</CardTitle>
            <CardDescription>We&apos;ll only recommend films you can actually watch.</CardDescription>
          </CardHeader>
          <CardContent>
            {catalogueLoading ? (
              <p className="text-sm text-muted-foreground">Loading platforms…</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {catalogue.map((p) => {
                  const active = selected.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(p.id)}
                      className={cn(
                        "relative flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm",
                        active ? "border-primary shadow-sm" : "border-border hover:border-primary/40",
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white p-1">
                        <img
                          src={p.logo_url}
                          alt={p.name}
                          className="h-full w-full object-contain"
                        />
                      </span>
                      <span className="text-sm font-semibold">{p.name}</span>
                      {active && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={handleSavePlatforms}
                disabled={platformsSaving || catalogueLoading}
              >
                {platformsSaving ? "Saving…" : "Save preferences"}
              </Button>
              {platformsSaved && (
                <span className="text-sm text-muted-foreground">Saved!</span>
              )}
              {platformsError && (
                <span className="text-sm text-destructive">{platformsError}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
