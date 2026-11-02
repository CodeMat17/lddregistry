import type { ChangeEvent, DatasetMeta, Establishment, EstablishmentInput, RegistrySettings } from "@/lib/domain/types"
import type { DuplicateDecision } from "@/lib/data/quality/duplicates"

export type CreateEstablishmentInput = EstablishmentInput & Required<Pick<EstablishmentInput, "name" | "categoryId">>
export type UpdateEstablishmentInput = EstablishmentInput

export type DatasetBackup = {
  id: number
  at: string
  reason: string
  recordCount: number
}

export type BackupFile = {
  format: "ldd-registry-backup"
  schemaVersion: number
  exportedAt: string
  meta: DatasetMeta | null
  records: Establishment[]
  history: ChangeEvent[]
  duplicateReviews: { key: string; decision: DuplicateDecision; at: string }[]
}

export interface EstablishmentRepository {
  getAll(): Promise<Establishment[]>
  getById(id: string): Promise<Establishment | null>
  getByCategory(categoryId: string): Promise<Establishment[]>
  search(query: string): Promise<Establishment[]>
  create(input: CreateEstablishmentInput): Promise<Establishment>
  update(id: string, input: UpdateEstablishmentInput): Promise<Establishment>
  delete(id: string): Promise<void>
  replaceAll(records: Establishment[], reason: string): Promise<void>
}

/**
 * Everything the UI needs from the data layer. A future Convex adapter
 * implements this same interface (see docs/CONVEX_MIGRATION_PLAN.md).
 */
export interface RegistryRepository extends EstablishmentRepository {
  /** Seed on first launch; never overwrites existing local data. */
  initialise(): Promise<DatasetMeta>
  getMeta(): Promise<DatasetMeta | null>
  appendRecords(records: Establishment[], file: string): Promise<{ added: number; skipped: number }>
  recordImport(file: string, mode: "replace" | "append", added: number): Promise<void>
  resetToSeed(): Promise<DatasetMeta>

  getHistory(recordId?: string): Promise<ChangeEvent[]>

  getSettings(): Promise<RegistrySettings>
  saveSettings(settings: RegistrySettings): Promise<void>

  getDuplicateReviews(): Promise<Record<string, DuplicateDecision>>
  setDuplicateReview(key: string, decision: DuplicateDecision | null): Promise<void>

  listBackups(): Promise<DatasetBackup[]>
  createBackup(reason: string): Promise<void>
  restoreBackup(id: number): Promise<void>

  exportBackup(): Promise<BackupFile>
  restoreFromFile(file: BackupFile): Promise<void>
}
