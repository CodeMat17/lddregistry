"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Info } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRegistry } from "@/components/providers/registry-provider"
import { RecordProfileSection } from "./field-list"
import { CATEGORIES } from "@/lib/domain/categories"
import { GEOPOLITICAL_ZONES, NIGERIAN_STATES } from "@/lib/domain/geography"
import type { CategoryId, Establishment, EstablishmentInput } from "@/lib/domain/types"
import { parseSeats } from "@/lib/data/import/parse"
import { expiryFromIssue } from "@/lib/data/analytics"
import { formatIsoDate } from "@/lib/format"

type FormState = Record<string, string>

function initialState(r?: Establishment, categoryId?: CategoryId): FormState {
  const s = (v: unknown) => (v === undefined || v === null ? "" : String(v))
  return {
    name: s(r?.name),
    categoryId: r?.categoryId ?? categoryId ?? "",
    state: s(r?.state),
    geopoliticalZone: s(r?.geopoliticalZone),
    lga: s(r?.lga),
    address: s(r?.address),
    contactPerson: s(r?.contactPerson),
    phone: s(r?.phone),
    email: s(r?.email),
    licenceNumber: s(r?.licenceNumber),
    recordedLicenceStatus: s(r?.recordedLicenceStatus),
    oldNewClassification: s(r?.oldNewClassification),
    screensNew: s(r?.screensNew),
    screensOld: s(r?.screensOld),
    screenDetailsNew: s(r?.screenDetailsNew),
    screenDetailsOld: s(r?.screenDetailsOld),
    screens: s(r?.screens),
    screenDetails: s(r?.screenDetails),
    seatsRaw: s(r?.seats.raw),
    issueDate: s(r?.issueDate?.iso),
    notes: s(r?.notes),
  }
}

const NUMERIC = new Set(["screensNew", "screensOld", "screens"])

function FormField({
  id,
  label,
  hint,
  error,
  children,
  wide,
}: {
  id: string
  label: string
  hint?: React.ReactNode
  error?: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className={wide ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

export function RecordForm({ record, defaultCategory }: { record?: Establishment; defaultCategory?: CategoryId }) {
  const router = useRouter()
  const { create, update } = useRegistry()
  const [state, setState] = React.useState(() => initialState(record, defaultCategory))
  const [dirty, setDirty] = React.useState<Set<string>>(new Set())
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const isEdit = !!record
  const categoryId = (state.categoryId || undefined) as CategoryId | undefined
  const oldNew = record ? record.screensNew !== undefined || record.screensOld !== undefined : categoryId === "exhibitors-premises"

  const set = (key: string) => (value: string) => {
    setState((s) => ({ ...s, [key]: value }))
    setDirty((d) => new Set(d).add(key))
    if (errors[key]) setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)))
  }
  const bind = (key: string) => ({
    id: key,
    name: key,
    value: state[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key)(e.target.value),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
    className: "h-11",
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!state.name.trim()) e.name = "A name is required."
    if (!isEdit && !state.categoryId) e.categoryId = "Choose a register."
    for (const k of NUMERIC) {
      const v = state[k].trim()
      if (v && !/^\d+$/.test(v)) e[k] = "Enter a whole number, or leave blank."
    }
    if (state.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) e.email = "This doesn't look like an email address."
    if (!isEdit && !state.issueDate) e.issueDate = "Enter the date the licence was issued."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const toInput = (): EstablishmentInput => {
    const keys = isEdit ? [...dirty] : Object.keys(state).filter((k) => state[k] !== "")
    const input: Record<string, unknown> = {}
    for (const k of keys) {
      if (k === "categoryId") continue
      input[k] = NUMERIC.has(k) ? (state[k].trim() === "" ? null : Number(state[k])) : state[k]
    }
    return input as EstablishmentInput
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error("Please fix the highlighted fields.")
      return
    }
    setSaving(true)
    try {
      if (record) {
        if (dirty.size === 0) {
          router.push(`/records/${record.id}`)
          return
        }
        await update(record.id, toInput())
        toast.success("Changes saved in this browser.")
        router.push(`/records/${record.id}`)
      } else {
        const created = await create({ ...toInput(), name: state.name, categoryId: state.categoryId as CategoryId })
        toast.success("Record created in this browser.")
        router.push(`/records/${created.id}`)
      }
    } catch (err) {
      toast.error((err as Error).message)
      setSaving(false)
    }
  }

  const seatPreview = state.seatsRaw.trim() ? parseSeats(state.seatsRaw) : null
  const expiryPreview = /^\d{4}-\d{2}-\d{2}$/.test(state.issueDate) ? formatIsoDate(expiryFromIssue(state.issueDate)) : ""
  const rawDateHint = (d?: { iso?: string; raw?: string }) =>
    d && !d.iso && d.raw ? `Source value “${d.raw}” could not be read. Enter a corrected date to replace it; the original stays in source data.` : undefined

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {isEdit && (
        <div className="flex gap-2 rounded-xl border border-info/30 bg-info/5 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
          <p>
            Edits are saved only in this browser and recorded in the record’s history. The original workbook values are kept unchanged in
            “Source data”.
          </p>
        </div>
      )}

      <RecordProfileSection title="Establishment">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="name" label="Name *" error={errors.name} wide>
            <Input {...bind("name")} autoComplete="organization" required />
          </FormField>
          {!isEdit && (
            <FormField id="categoryId" label="Register *" error={errors.categoryId} wide>
              <Select value={state.categoryId || null} onValueChange={(v) => set("categoryId")(String(v ?? ""))} items={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}>
                <SelectTrigger id="categoryId" className="h-11! w-full" aria-invalid={errors.categoryId ? true : undefined}>
                  <SelectValue placeholder="Choose a register" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="min-h-9">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </div>
      </RecordProfileSection>

      <RecordProfileSection title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="state" label="State" hint="Choose from the list or type the value as recorded.">
            <Input {...bind("state")} list="state-options" autoComplete="off" />
            <datalist id="state-options">
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FormField>
          <FormField id="geopoliticalZone" label="Geopolitical zone">
            <Input {...bind("geopoliticalZone")} list="zone-options" autoComplete="off" />
            <datalist id="zone-options">
              {GEOPOLITICAL_ZONES.map((z) => (
                <option key={z} value={z} />
              ))}
            </datalist>
          </FormField>
          <FormField id="lga" label="LGA">
            <Input {...bind("lga")} />
          </FormField>
          <FormField id="address" label="Full address" wide>
            <Textarea {...bind("address")} className="min-h-20" rows={2} />
          </FormField>
        </div>
      </RecordProfileSection>

      <RecordProfileSection title="Contacts">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="contactPerson" label="Contact person">
            <Input {...bind("contactPerson")} autoComplete="name" />
          </FormField>
          <FormField id="phone" label="Phone" hint="Stored as text — leading zeroes are kept.">
            <Input {...bind("phone")} type="tel" inputMode="tel" autoComplete="tel" />
          </FormField>
          <FormField id="email" label="Email" error={errors.email} wide>
            <Input {...bind("email")} type="email" inputMode="email" autoComplete="email" />
          </FormField>
        </div>
      </RecordProfileSection>

      <RecordProfileSection title="Licensing">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="recordedLicenceStatus" label="Licence status (recorded)" hint="e.g. Valid, Expired, Pending">
            <Input {...bind("recordedLicenceStatus")} list="status-options" autoComplete="off" />
            <datalist id="status-options">
              {["Valid", "Expired", "Pending"].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FormField>
          <FormField id="oldNewClassification" label="OLD/NEW classification" hint="e.g. New, Renewal">
            <Input {...bind("oldNewClassification")} list="oldnew-options" autoComplete="off" />
            <datalist id="oldnew-options">
              {["New", "Renewal"].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FormField>
          <FormField id="issueDate" label={isEdit ? "Date of issue" : "Date of issue *"} error={errors.issueDate} hint={rawDateHint(record?.issueDate)}>
            <Input {...bind("issueDate")} type="date" required={!isEdit} />
          </FormField>
          <FormField id="expiryDate" label="Date of expiration" hint="Calculated as one year from the date of issue.">
            <Input id="expiryDate" value={expiryPreview} placeholder="Enter a date of issue" readOnly tabIndex={-1} className="h-11 bg-muted/50" />
          </FormField>
          <FormField id="licenceNumber" label="Licence number">
            <Input {...bind("licenceNumber")} />
          </FormField>
        </div>
      </RecordProfileSection>

      <RecordProfileSection title="Screens & capacity" description="Use whole numbers for screen counts. OLD and NEW are kept separately and never added together.">
        <div className="grid gap-4 sm:grid-cols-2">
          {oldNew ? (
            <>
              <FormField id="screensNew" label="No. of screens (NEW)" error={errors.screensNew} hint={record?.screensNew === null && record.screensNewRaw ? `Source value: “${record.screensNewRaw}”` : undefined}>
                <Input {...bind("screensNew")} inputMode="numeric" />
              </FormField>
              <FormField id="screenDetailsNew" label="Screen details (NEW)">
                <Input {...bind("screenDetailsNew")} />
              </FormField>
              <FormField id="screensOld" label="No. of screens (OLD)" error={errors.screensOld} hint={record?.screensOld === null && record.screensOldRaw ? `Source value: “${record.screensOldRaw}”` : undefined}>
                <Input {...bind("screensOld")} inputMode="numeric" />
              </FormField>
              <FormField id="screenDetailsOld" label="Screen details (OLD)">
                <Input {...bind("screenDetailsOld")} />
              </FormField>
            </>
          ) : (
            <>
              <FormField id="screens" label="No. of screens" error={errors.screens} hint={record?.screens === null && record.screensRaw ? `Source value: “${record.screensRaw}”` : undefined}>
                <Input {...bind("screens")} inputMode="numeric" />
              </FormField>
              <FormField id="screenDetails" label="Screen details">
                <Input {...bind("screenDetails")} />
              </FormField>
            </>
          )}
          <FormField
            id="seatsRaw"
            label="Total seats"
            wide
            hint={
              seatPreview
                ? seatPreview.total !== undefined
                  ? `Will count as ${seatPreview.total} seats${seatPreview.parts ? ` (${seatPreview.parts.length} halls)` : ""}.`
                  : "This value will be kept but excluded from totals — use a number or a comma-separated list such as 120,80,64."
                : "A number, or a comma-separated list of hall capacities such as 120,80,64."
            }
          >
            <Input {...bind("seatsRaw")} inputMode="text" />
          </FormField>
        </div>
      </RecordProfileSection>

      <RecordProfileSection title="Notes">
        <FormField id="notes" label="Notes" wide>
          <Textarea {...bind("notes")} className="min-h-24" />
        </FormField>
      </RecordProfileSection>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 flex gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button type="button" variant="outline" className="h-11 flex-1 md:flex-none" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" className="h-11 flex-2 md:flex-none md:px-6" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create record"}
        </Button>
      </div>
    </form>
  )
}
