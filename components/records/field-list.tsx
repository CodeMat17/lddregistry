"use client"

import { Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { copyText } from "@/lib/data/export/download"
import { cn } from "@/lib/utils"

export type Field = {
  label: string
  value?: React.ReactNode
  /** Plain text for the copy action. */
  copy?: string
  hint?: React.ReactNode
  wide?: boolean
}

export function FieldList({ fields, className }: { fields: Field[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4 sm:grid-cols-2", className)}>
      {fields.map((f) => {
        const empty = f.value === undefined || f.value === null || f.value === ""
        return (
          <div key={f.label} className={cn("min-w-0", f.wide && "sm:col-span-2")}>
            <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
            <dd className="mt-0.5 flex items-start gap-1 text-sm wrap-break-word">
              <span className="min-w-0 flex-1">{empty ? <span className="text-muted-foreground/80 italic">Not provided in source</span> : f.value}</span>
              {!empty && f.copy && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="-my-1.5 size-8 shrink-0 text-muted-foreground"
                  aria-label={`Copy ${f.label.toLowerCase()}`}
                  onClick={async () => {
                    try {
                      await copyText(f.copy!)
                      toast.success(`${f.label} copied.`)
                    } catch {
                      toast.error("Could not copy to the clipboard.")
                    }
                  }}
                >
                  <Copy className="size-3.5" />
                </Button>
              )}
            </dd>
            {f.hint && <p className="mt-0.5 text-xs text-muted-foreground">{f.hint}</p>}
          </div>
        )
      })}
    </dl>
  )
}

export function RecordProfileSection({
  title,
  description,
  children,
  action,
  id,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
  id?: string
}) {
  return (
    <Card className="shadow-card" id={id}>
      <CardHeader className="flex items-start justify-between gap-2">
        <div>
          <CardTitle>
            <h2 className="font-semibold">{title}</h2>
          </CardTitle>
          {description && <CardDescription className="mt-1 text-xs">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
