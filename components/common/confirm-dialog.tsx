"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/** Confirmation for destructive operations. `onConfirm` may be async; the dialog waits for it. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = true,
  onConfirm,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactElement
  title: string
  description: React.ReactNode
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const isOpen = open ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  return (
    <AlertDialog open={isOpen} onOpenChange={(o) => !busy && setOpen(o)}>
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription render={<div />}>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-10" disabled={busy}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-10"
            variant={destructive ? "destructive" : "default"}
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onConfirm()
                setOpen(false)
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
