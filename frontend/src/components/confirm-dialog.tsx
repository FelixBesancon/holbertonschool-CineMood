/**
 * ConfirmDialog — Generic destructive-action confirmation modal.
 *
 * Wraps shadcn/ui Dialog with a title, description, and two buttons.
 * The confirm button is styled destructive by default.
 *
 * Props:
 *   - open / onOpenChange: controlled open state (lifted to caller)
 *   - title: dialog heading
 *   - description: body text (accepts ReactNode for bold/inline formatting)
 *   - confirmLabel / cancelLabel: button labels (defaults: "Remove" / "Cancel")
 *   - onConfirm: called when the confirm button is clicked; the dialog closes automatically
 */
import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-pretty">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
