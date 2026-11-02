import type { ChangeEvent, DatasetMeta, Establishment, RegistrySettings } from "@/lib/domain/types"
import { getDb } from "@/lib/data/db"
import { applyInput, newEventId, newLocalRecord } from "@/lib/data/records"
import { SCHEMA_VERSION } from "@/lib/data/schema"
import { searchRecords } from "@/lib/data/search"
import type { DuplicateDecision } from "@/lib/data/quality/duplicates"
import type {
  BackupFile,
  CreateEstablishmentInput,
  DatasetBackup,
  RegistryRepository,
  UpdateEstablishmentInput,
} from "./types"

const DEFAULT_SETTINGS: RegistrySettings = { useOldScreenFallback: false }
const MAX_BACKUPS = 5

async function loadSeed(): Promise<{ records: Establishment[]; meta: DatasetMeta }> {
  const [records, meta] = await Promise.all([
    import("@/data/seed/establishments.json").then((m) => m.default as unknown as Establishment[]),
    import("@/data/seed/meta.json").then((m) => m.default as DatasetMeta),
  ])
  return { records, meta }
}

/** IndexedDB-backed repository for the local-first prototype. */
export class LocalEstablishmentRepository implements RegistryRepository {
  private get db() {
    return getDb()
  }

  private now() {
    return new Date().toISOString()
  }

  private async log(event: Omit<ChangeEvent, "id" | "at">) {
    await this.db.history.add({ ...event, id: newEventId(), at: this.now() })
  }

  private async setMeta(meta: DatasetMeta) {
    await this.db.meta.put({ key: "dataset", value: meta })
  }

  async getMeta(): Promise<DatasetMeta | null> {
    const row = await this.db.meta.get("dataset")
    return (row?.value as DatasetMeta | undefined) ?? null
  }

  async initialise(): Promise<DatasetMeta> {
    const existing = await this.getMeta()
    if (existing) {
      if (existing.schemaVersion < SCHEMA_VERSION) {
        // No migrations are needed yet; future schema changes transform stored records here.
        const migrated = { ...existing, schemaVersion: SCHEMA_VERSION }
        await this.setMeta(migrated)
        return migrated
      }
      return existing
    }
    return this.seed()
  }

  private async seed(): Promise<DatasetMeta> {
    const { records, meta } = await loadSeed()
    const loaded: DatasetMeta = { ...meta, loadedAt: this.now(), recordCount: records.length }
    await this.db.transaction("rw", this.db.establishments, this.db.meta, async () => {
      await this.db.establishments.clear()
      await this.db.establishments.bulkPut(records)
      await this.setMeta(loaded)
    })
    return loaded
  }

  async getAll() {
    return this.db.establishments.toArray()
  }

  async getById(id: string) {
    return (await this.db.establishments.get(id)) ?? null
  }

  async getByCategory(categoryId: string) {
    return this.db.establishments.where("categoryId").equals(categoryId).toArray()
  }

  async search(query: string) {
    return searchRecords(await this.getAll(), query)
  }

  async create(input: CreateEstablishmentInput) {
    const record = newLocalRecord(input, this.now())
    await this.db.establishments.add(record)
    await this.log({ recordId: record.id, kind: "create", changes: [], summary: "Record created locally" })
    await this.touchCount()
    return record
  }

  async update(id: string, input: UpdateEstablishmentInput) {
    const current = await this.getById(id)
    if (!current) throw new Error("Record not found")
    const { record, changes } = applyInput(current, input, this.now())
    if (changes.length) {
      await this.db.establishments.put(record)
      await this.log({ recordId: id, kind: "update", changes })
    }
    return record
  }

  async delete(id: string) {
    const current = await this.getById(id)
    if (!current) return
    await this.db.establishments.delete(id)
    await this.log({ recordId: id, kind: "delete", changes: [], summary: `Deleted "${current.name}" (${current.sourceSheet} row ${current.sourceRow})` })
    await this.touchCount()
  }

  private async touchCount() {
    const meta = await this.getMeta()
    if (meta) await this.setMeta({ ...meta, recordCount: await this.db.establishments.count() })
  }

  async replaceAll(records: Establishment[], reason: string) {
    await this.createBackup(`Before: ${reason}`)
    await this.db.transaction("rw", this.db.establishments, async () => {
      await this.db.establishments.clear()
      await this.db.establishments.bulkPut(records)
    })
    await this.log({ recordId: "*", kind: "import", changes: [], summary: `${reason} (${records.length} records)` })
    await this.touchCount()
  }

  async appendRecords(records: Establishment[], file: string) {
    const existing = new Set((await this.getAll()).map((r) => r.sourceFingerprint))
    const fresh = records.filter((r) => !existing.has(r.sourceFingerprint))
    const ids = new Set(await this.db.establishments.toCollection().primaryKeys())
    for (const r of fresh) while (ids.has(r.id)) r.id = `${r.id}a`
    await this.db.establishments.bulkPut(fresh)
    await this.log({ recordId: "*", kind: "import", changes: [], summary: `Appended ${fresh.length} records from ${file}` })
    await this.touchCount()
    return { added: fresh.length, skipped: records.length - fresh.length }
  }

  async recordImport(file: string, mode: "replace" | "append", added: number) {
    const meta = await this.getMeta()
    if (meta) await this.setMeta({ ...meta, lastImport: { at: this.now(), file, mode, added } })
  }

  async resetToSeed() {
    await this.createBackup("Before reset to original seed data")
    const meta = await this.seed()
    await this.log({ recordId: "*", kind: "reset", changes: [], summary: "Reset to original seed data" })
    return meta
  }

  async getHistory(recordId?: string) {
    const rows = recordId
      ? await this.db.history.where("recordId").equals(recordId).toArray()
      : await this.db.history.toArray()
    return rows.sort((a, b) => b.at.localeCompare(a.at))
  }

  async getSettings(): Promise<RegistrySettings> {
    const row = await this.db.meta.get("settings")
    return { ...DEFAULT_SETTINGS, ...(row?.value as Partial<RegistrySettings> | undefined) }
  }

  async saveSettings(settings: RegistrySettings) {
    await this.db.meta.put({ key: "settings", value: settings })
  }

  async getDuplicateReviews() {
    const rows = await this.db.duplicateReviews.toArray()
    return Object.fromEntries(rows.map((r) => [r.key, r.decision])) as Record<string, DuplicateDecision>
  }

  async setDuplicateReview(key: string, decision: DuplicateDecision | null) {
    if (decision === null) await this.db.duplicateReviews.delete(key)
    else await this.db.duplicateReviews.put({ key, decision, at: this.now() })
  }

  async listBackups(): Promise<DatasetBackup[]> {
    const rows = await this.db.backups.orderBy("at").reverse().toArray()
    return rows.map(({ id, at, reason, recordCount }) => ({ id: id!, at, reason, recordCount }))
  }

  async createBackup(reason: string) {
    const records = await this.getAll()
    await this.db.backups.add({ at: this.now(), reason, recordCount: records.length, records, meta: await this.getMeta() })
    const all = await this.db.backups.orderBy("at").toArray()
    const excess = all.slice(0, Math.max(0, all.length - MAX_BACKUPS))
    await this.db.backups.bulkDelete(excess.map((b) => b.id!))
  }

  async restoreBackup(id: number) {
    const backup = await this.db.backups.get(id)
    if (!backup) throw new Error("Backup not found")
    await this.replaceAll(backup.records, `Restored browser backup from ${backup.at}`)
  }

  async exportBackup(): Promise<BackupFile> {
    const reviews = await this.db.duplicateReviews.toArray()
    return {
      format: "ldd-registry-backup",
      schemaVersion: SCHEMA_VERSION,
      exportedAt: this.now(),
      meta: await this.getMeta(),
      records: await this.getAll(),
      history: await this.getHistory(),
      duplicateReviews: reviews,
    }
  }

  async restoreFromFile(file: BackupFile) {
    if (file.format !== "ldd-registry-backup" || !Array.isArray(file.records)) {
      throw new Error("This file is not an LDD Registry JSON backup.")
    }
    if (file.schemaVersion > SCHEMA_VERSION) {
      throw new Error("This backup was made by a newer version of the app and cannot be restored here.")
    }
    const invalid = file.records.find((r) => !r || typeof r.id !== "string" || typeof r.categoryId !== "string" || !Array.isArray(r.dataQualityFlags))
    if (invalid) throw new Error("The backup contains records in an unexpected format.")
    await this.replaceAll(file.records, `Restored JSON backup exported ${file.exportedAt}`)
    await this.db.transaction("rw", this.db.history, this.db.duplicateReviews, async () => {
      if (Array.isArray(file.history)) await this.db.history.bulkPut(file.history)
      if (Array.isArray(file.duplicateReviews)) await this.db.duplicateReviews.bulkPut(file.duplicateReviews)
    })
    if (file.meta) await this.setMeta({ ...file.meta, recordCount: file.records.length, loadedAt: this.now() })
  }
}
