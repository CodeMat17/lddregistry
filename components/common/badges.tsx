import { AlertTriangle, CircleCheck, CircleX, Clock, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { DataQualityFlag } from "@/lib/domain/types"
import { FLAG_META } from "@/lib/data/quality/flags"
import { CALCULATED_STATUS_LABEL, type CalculatedLicenceStatus } from "@/lib/data/analytics/licence"
import { groupKey } from "@/lib/domain/geography"
import { cn } from "@/lib/utils"

const tone = {
  success: "bg-success/12 text-success dark:bg-success/15",
  warning: "bg-warning/12 text-warning dark:bg-warning/15",
  danger: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  info: "bg-info/10 text-info dark:bg-info/15",
  neutral: "bg-muted text-muted-foreground",
}

/** Licence status exactly as recorded in the source (case-normalised for colour only). */
export function RecordedStatusBadge({ status, className }: { status?: string; className?: string }) {
  if (!status) {
    return (
      <Badge variant="secondary" className={cn(tone.neutral, className)}>
        Status not recorded
      </Badge>
    )
  }
  const k = groupKey(status)
  const t = k === "valid" ? tone.success : k === "expired" ? tone.danger : k === "pending" ? tone.warning : tone.neutral
  const Icon = k === "valid" ? CircleCheck : k === "expired" ? CircleX : k === "pending" ? Clock : HelpCircle
  return (
    <Badge className={cn(t, className)} title="Licence status as recorded in the source">
      <Icon aria-hidden />
      {status}
    </Badge>
  )
}

export function CalculatedStatusBadge({ status, className }: { status?: CalculatedLicenceStatus; className?: string }) {
  if (!status) return null
  const t = status === "expired" ? tone.danger : status === "expiring" ? tone.warning : tone.success
  return (
    <Badge className={cn(t, "font-normal", className)} title="Calculated as one year from the date of issue; not an official status">
      {CALCULATED_STATUS_LABEL[status]}
    </Badge>
  )
}

export function DataQualityBadge({ flags, className }: { flags: DataQualityFlag[]; className?: string }) {
  const warnings = flags.filter((f) => FLAG_META[f].severity !== "info")
  if (!warnings.length) return null
  return (
    <Badge className={cn(tone.warning, className)} title={warnings.map((f) => FLAG_META[f].label).join(", ")}>
      <AlertTriangle aria-hidden />
      {warnings.length} {warnings.length === 1 ? "issue" : "issues"}
    </Badge>
  )
}

export function FlagBadge({ flag }: { flag: DataQualityFlag }) {
  const m = FLAG_META[flag]
  const t = m.severity === "error" ? tone.danger : m.severity === "warning" ? tone.warning : tone.info
  return <Badge className={cn(t, "font-normal")}>{m.label}</Badge>
}

export { tone as badgeTone }
