/**
 * ProfilePage — User profile and preferences editor.
 *
 * Two sections:
 *   - My info: editable first name, last name, and age fields.
 *   - My streaming platforms: toggle grid for selecting active platforms.
 *     Selected platform IDs are tracked in local state (default: Netflix, Prime, Canal+).
 *     The list is seeded from PLATFORMS in mock-data.ts.
 *
 * "Save changes" and "Save preferences" buttons are currently no-ops.
 *
 * TODO: wire up to the backend when a PATCH /users/me endpoint is added.
 * Platform preferences will eventually be stored per-user and used by the
 * recommendation engine to filter results.
 */
import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PLATFORMS } from "@/lib/mock-data"

export function ProfilePage() {
  const { user } = useAuth()
  const [first, setFirst] = useState(user?.first_name ?? "")
  const [last, setLast] = useState(user?.last_name ?? "")
  const [age, setAge] = useState("")
  const [selected, setSelected] = useState<string[]>(["netflix", "prime", "canal"])

  const toggle = (platformId: string) =>
    setSelected((prev) => (prev.includes(platformId) ? prev.filter((existing) => existing !== platformId) : [...prev, platformId]))

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Profile</h1>
      <p className="mt-2 text-muted-foreground">Manage your details and streaming platforms.</p>

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
                <Input id="first" value={first} onChange={(e) => setFirst(e.target.value)} className="focus-visible:border-primary focus-visible:ring-primary/25" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="last">Last name</Label>
                <Input id="last" value={last} onChange={(e) => setLast(e.target.value)} className="focus-visible:border-primary focus-visible:ring-primary/25" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} className="focus-visible:border-primary focus-visible:ring-primary/25" />
              </div>
            </div>
            <Button className="mt-6">Save changes</Button>
          </CardContent>
        </Card>

        {/* Platforms */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">My streaming platforms</CardTitle>
            <CardDescription>We&apos;ll only recommend films you can actually watch.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PLATFORMS.map((p) => {
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
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{ backgroundColor: p.color }}
                      aria-hidden
                    >
                      {p.label[0]}
                    </span>
                    <span className="text-sm font-semibold">{p.label}</span>
                    {active && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <Button className="mt-6">Save preferences</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
