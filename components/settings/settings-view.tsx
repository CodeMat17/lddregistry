"use client"

import { useTheme } from "next-themes"
import { Monitor, Moon, RotateCcw, Sun } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useRegistry } from "@/components/providers/registry-provider"
import { PageHeader } from "@/components/common/page-header"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { FieldList, RecordProfileSection } from "@/components/records/field-list"
import { formatNumber, formatTimestamp } from "@/lib/format"
import { dataProvider } from "@/lib/data/repositories"

export function SettingsView() {
  const { meta, records, settings, saveSettings, resetToSeed, analytics } = useRegistry()
  const { theme, setTheme } = useTheme()
  const edited = records.filter((r) => r.updatedAt !== r.createdAt || r.origin !== "seed").length

  return (
    <>
      <PageHeader crumbs={[{ label: "Home", href: "/" }, { label: "Settings & about" }]} title="Settings & about" />
      <div className="grid gap-4 lg:grid-cols-2">
        <RecordProfileSection title="Data source">
          <FieldList
            fields={[
              { label: "Status", value: dataProvider === "local" ? "Local prototype data — stored in this browser only" : dataProvider },
              { label: "Source workbook", value: meta?.sourceFile },
              { label: "Workbook date", value: formatTimestamp(meta?.generatedAt) },
              { label: "Loaded into this browser", value: formatTimestamp(meta?.loadedAt) },
              { label: "Records", value: formatNumber(records.length) },
              { label: "Locally added or edited", value: formatNumber(edited) },
              { label: "Schema version", value: meta?.schemaVersion },
              ...(meta?.lastImport ? [{ label: "Last import", value: `${meta.lastImport.file} (${meta.lastImport.mode}) · ${formatTimestamp(meta.lastImport.at)}` }] : []),
            ]}
          />
        </RecordProfileSection>

        <RecordProfileSection title="Preferences">
          <div className="space-y-5">
            <div className="space-y-2">
              <p id="theme-label" className="text-sm font-medium">
                Theme
              </p>
              <ToggleGroup
                aria-labelledby="theme-label"
                value={theme ? [theme] : []}
                onValueChange={(v: string[]) => v[0] && setTheme(v[0])}
                variant="outline"
                spacing={0}
              >
                <ToggleGroupItem value="light" className="h-10 gap-1.5 px-3">
                  <Sun className="size-4" aria-hidden />
                  Light
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" className="h-10 gap-1.5 px-3">
                  <Moon className="size-4" aria-hidden />
                  Dark
                </ToggleGroupItem>
                <ToggleGroupItem value="system" className="h-10 gap-1.5 px-3">
                  <Monitor className="size-4" aria-hidden />
                  System
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-start justify-between gap-4 border-t pt-4">
              <Label htmlFor="old-fallback" className="flex-col items-start gap-1 font-normal">
                <span className="font-medium">Use OLD screen counts when NEW is missing</span>
                <span className="text-xs text-muted-foreground">
                  Applies to Exhibitors Premises only. Off by default, so screen totals use NEW counts only. OLD and NEW are never added together.
                  Currently {formatNumber(analytics.screens.fromOld)} records use OLD.
                </span>
              </Label>
              <Switch
                id="old-fallback"
                checked={settings.useOldScreenFallback}
                onCheckedChange={async (on) => {
                  await saveSettings({ ...settings, useOldScreenFallback: on })
                  toast.success(on ? "OLD counts will be used where NEW is missing." : "Screen totals now use NEW counts only.")
                }}
              />
            </div>
          </div>
        </RecordProfileSection>

        <RecordProfileSection title="Reset local data" description="Discard all local edits, added records and imports and reload the original workbook data.">
          <ConfirmDialog
            trigger={
              <Button variant="destructive" className="h-10 gap-2">
                <RotateCcw className="size-4" aria-hidden />
                Reset to original seed data…
              </Button>
            }
            title="Reset to the original workbook data?"
            description={`All ${formatNumber(edited)} local additions and edits will be discarded and the ${meta?.sourceFile ?? "workbook"} data reloaded. A backup of the current data is saved in this browser first and can be restored from Import & export.`}
            confirmLabel="Reset data"
            onConfirm={async () => {
              await resetToSeed()
              toast.success("Original seed data restored.")
            }}
          />
        </RecordProfileSection>

        <RecordProfileSection title="Privacy & security">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Data stays in this browser (IndexedDB). It is not sent to any server, and no analytics or tracking scripts are used.</li>
            <li>Browser storage is not a secure central repository. Anyone using this browser profile can see the data.</li>
            <li>Clearing site data or switching device removes local changes — export a JSON backup first.</li>
            <li>There is no login in this prototype. Shared summaries contain figures only, and no public links are created.</li>
            <li>Before production use, the Board must approve hosting, data residency, user access, retention, backup and security arrangements.</li>
          </ul>
        </RecordProfileSection>

        <RecordProfileSection title="About the LDD Registry" description="Prototype · version 0.1">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              A central digital directory and management-information tool for the licensing and documentation records of the National Film and Video
              Censors Board’s Licensing and Documentation Department, built from the departmental workbook.
            </p>
            <p>
              The data is imported from the supplied workbook and has not been verified by NFVCB; it requires departmental validation. This prototype is
              not connected to any NFVCB system. Central storage, user accounts and permission-controlled sharing are coming in a later phase.
            </p>
          </div>
        </RecordProfileSection>
      </div>
    </>
  )
}
