import type { Metadata } from "next"
import { DataGate } from "@/components/common/states"
import { SettingsView } from "@/components/settings/settings-view"

export const metadata: Metadata = { title: "Settings & about" }

export default function SettingsPage() {
  return (
    <DataGate>
      <SettingsView />
    </DataGate>
  )
}
