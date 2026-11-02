"use client"

import { Database, WifiOff } from "lucide-react"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useOnline } from "@/hooks/use-local-preference"
import { useRegistry } from "@/components/providers/registry-provider"
import { formatNumber, formatTimestamp } from "@/lib/format"

export function PrototypeDataBanner() {
  const { meta } = useRegistry()
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full border-warning/40 bg-warning/10 px-2.5 text-xs font-medium text-warning hover:bg-warning/15 hover:text-warning dark:border-warning/30"
          />
        }
      >
        <Database className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">Prototype · Local data</span>
        <span className="sm:hidden">Prototype</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Prototype · Local data</PopoverTitle>
          <PopoverDescription>
            This is a demonstration prototype. It is not connected to NFVCB systems. Data comes from the supplied
            workbook and any changes are stored only in this browser on this device — they are not shared or
            centrally backed up.
          </PopoverDescription>
        </PopoverHeader>
        {meta && (
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Source</dt>
            <dd className="truncate">{meta.sourceFile}</dd>
            <dt className="text-muted-foreground">Records</dt>
            <dd className="tabular">{formatNumber(meta.recordCount)}</dd>
            <dt className="text-muted-foreground">Loaded here</dt>
            <dd>{formatTimestamp(meta.loadedAt)}</dd>
          </dl>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function OfflineIndicator() {
  const online = useOnline()
  if (online) return null
  return (
    <span
      role="status"
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-2.5 text-xs font-medium text-muted-foreground"
    >
      <WifiOff className="size-3.5" aria-hidden />
      Offline
    </span>
  )
}
