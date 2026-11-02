"use client"

import * as React from "react"
import type { DatasetMeta, Establishment, RegistrySettings } from "@/lib/domain/types"
import { computeAnalytics, todayIso, type Analytics } from "@/lib/data/analytics"
import { findPossibleDuplicates, type DuplicateDecision, type DuplicateGroup } from "@/lib/data/quality/duplicates"
import {
  getRepository,
  type BackupFile,
  type CreateEstablishmentInput,
  type RegistryRepository,
  type UpdateEstablishmentInput,
} from "@/lib/data/repositories"

type Status = "loading" | "ready" | "error"

type RegistryContextValue = {
  status: Status
  error?: string
  records: Establishment[]
  byId: Map<string, Establishment>
  meta: DatasetMeta | null
  settings: RegistrySettings
  /** Reporting date for calculated licence status (today, local time). */
  asOf: string
  analytics: Analytics
  duplicates: DuplicateGroup[]
  duplicateReviews: Record<string, DuplicateDecision>
  repository: RegistryRepository
  refresh: () => Promise<void>
  create: (input: CreateEstablishmentInput) => Promise<Establishment>
  update: (id: string, input: UpdateEstablishmentInput) => Promise<Establishment>
  remove: (id: string) => Promise<void>
  replaceAll: (records: Establishment[], reason: string) => Promise<void>
  appendRecords: (records: Establishment[], file: string) => Promise<{ added: number; skipped: number }>
  recordImport: (file: string, mode: "replace" | "append", added: number) => Promise<void>
  resetToSeed: () => Promise<void>
  restoreBackup: (id: number) => Promise<void>
  restoreFromFile: (file: BackupFile) => Promise<void>
  saveSettings: (settings: RegistrySettings) => Promise<void>
  setDuplicateReview: (key: string, decision: DuplicateDecision | null) => Promise<void>
}

const RegistryContext = React.createContext<RegistryContextValue | null>(null)

const DEFAULT_SETTINGS: RegistrySettings = { useOldScreenFallback: false }

export function RegistryProvider({ children }: { children: React.ReactNode }) {
  const repository = React.useMemo(() => getRepository(), [])
  const [status, setStatus] = React.useState<Status>("loading")
  const [error, setError] = React.useState<string>()
  const [records, setRecords] = React.useState<Establishment[]>([])
  const [meta, setMeta] = React.useState<DatasetMeta | null>(null)
  const [settings, setSettings] = React.useState<RegistrySettings>(DEFAULT_SETTINGS)
  const [duplicateReviews, setDuplicateReviews] = React.useState<Record<string, DuplicateDecision>>({})
  // Set after mount (never during prerender); pages only render once status is "ready".
  const [asOf, setAsOf] = React.useState("")

  const refresh = React.useCallback(async () => {
    const [all, m, s, reviews] = await Promise.all([
      repository.getAll(),
      repository.getMeta(),
      repository.getSettings(),
      repository.getDuplicateReviews(),
    ])
    setRecords(all)
    setMeta(m)
    setSettings(s)
    setDuplicateReviews(reviews)
  }, [repository])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await repository.initialise()
        if (!cancelled) await refresh()
        if (cancelled) return
        setAsOf(todayIso())
        setStatus("ready")
      } catch (e) {
        if (cancelled) return
        setError((e as Error).message)
        setStatus("error")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [repository, refresh])

  const analytics = React.useMemo(() => computeAnalytics(records, settings, asOf), [records, settings, asOf])
  const duplicates = React.useMemo(() => findPossibleDuplicates(records), [records])
  const byId = React.useMemo(() => new Map(records.map((r) => [r.id, r])), [records])

  const value = React.useMemo<RegistryContextValue>(() => {
    const after = <A extends unknown[], R>(fn: (...args: A) => Promise<R>) => async (...args: A) => {
      const result = await fn(...args)
      await refresh()
      return result
    }
    return {
      status,
      error,
      records,
      byId,
      meta,
      settings,
      asOf,
      analytics,
      duplicates,
      duplicateReviews,
      repository,
      refresh,
      create: after((input: CreateEstablishmentInput) => repository.create(input)),
      update: after((id: string, input: UpdateEstablishmentInput) => repository.update(id, input)),
      remove: after((id: string) => repository.delete(id)),
      replaceAll: after((rs: Establishment[], reason: string) => repository.replaceAll(rs, reason)),
      appendRecords: after((rs: Establishment[], file: string) => repository.appendRecords(rs, file)),
      recordImport: after((file: string, mode: "replace" | "append", added: number) => repository.recordImport(file, mode, added)),
      resetToSeed: after(async () => {
        await repository.resetToSeed()
      }),
      restoreBackup: after((id: number) => repository.restoreBackup(id)),
      restoreFromFile: after((file: BackupFile) => repository.restoreFromFile(file)),
      saveSettings: after((s: RegistrySettings) => repository.saveSettings(s)),
      setDuplicateReview: after((key: string, decision: DuplicateDecision | null) => repository.setDuplicateReview(key, decision)),
    }
  }, [status, error, records, byId, meta, settings, asOf, analytics, duplicates, duplicateReviews, repository, refresh])

  return <RegistryContext.Provider value={value}>{children}</RegistryContext.Provider>
}

export function useRegistry() {
  const ctx = React.useContext(RegistryContext)
  if (!ctx) throw new Error("useRegistry must be used within RegistryProvider")
  return ctx
}
