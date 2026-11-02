import Dexie, { type EntityTable } from "dexie"
import type { ChangeEvent, Establishment } from "@/lib/domain/types"
import type { DuplicateDecision } from "./quality/duplicates"

type MetaRow = { key: string; value: unknown }
type BackupRow = { id?: number; at: string; reason: string; recordCount: number; records: Establishment[]; meta: unknown }
type DuplicateReviewRow = { key: string; decision: DuplicateDecision; at: string }

/** IndexedDB store for the local prototype. Only the local repository touches this. */
export class RegistryDb extends Dexie {
  establishments!: EntityTable<Establishment, "id">
  history!: EntityTable<ChangeEvent, "id">
  meta!: EntityTable<MetaRow, "key">
  backups!: EntityTable<BackupRow, "id">
  duplicateReviews!: EntityTable<DuplicateReviewRow, "key">

  constructor() {
    super("nfvcb-ldd-registry")
    this.version(1).stores({
      establishments: "id, categoryId, sourceFingerprint, updatedAt",
      history: "id, recordId, at",
      meta: "key",
      backups: "++id, at",
      duplicateReviews: "key",
    })
  }
}

let instance: RegistryDb | null = null

export function getDb(): RegistryDb {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this browser. Local storage of registry data requires IndexedDB.")
  }
  instance ??= new RegistryDb()
  return instance
}
