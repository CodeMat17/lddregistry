/**
 * Domain model for the LDD Registry. These types are provider-agnostic: no
 * IndexedDB, Dexie or Convex types may leak into them.
 */

export type CategoryId =
  | "exhibitors-premises"
  | "national-distributors"
  | "regional-exhibitors"
  | "community-exhibitors"
  | "viewing-centres"
  | "online-distributors"
  | "national-exhibitors"
  | "regional-distributors"
  | "drive-in-cinemas"
  | "sub-urban"

export type CategoryIconName =
  | "building"
  | "truck"
  | "map-pin"
  | "users"
  | "tv"
  | "globe"
  | "landmark"
  | "route"
  | "car"
  | "trees"

export type CategoryDefinition = {
  id: CategoryId
  label: string
  shortLabel: string
  sourceSheet: string
  description: string
  icon: CategoryIconName
  /** Whether screen/seat data is meaningful for this register. */
  screensRelevant: boolean
}

/** A date-only value parsed from the source; never a JS Date to avoid TZ shifts. */
export type ParsedDate = {
  /** ISO yyyy-mm-dd, present only when the source value parsed reliably. */
  iso?: string
  /** The original source value as text, for auditability. */
  raw?: string
}

export type SeatParse = {
  raw?: string
  /** Sum of a reliable numeric interpretation; undefined when unreliable. */
  total?: number
  /** Individual capacities when the source was a clean comma-separated list. */
  parts?: number[]
  status: "missing" | "numeric" | "list" | "suspicious" | "unparseable"
}

export type ScreenSource = "new" | "old" | "generic" | "none"

export type Establishment = {
  id: string
  sourceSheet: string
  sourceRow: number
  sourceSerialNumber?: string | number
  /** Stable fingerprint of sheet + serial + original name, used for import de-duplication. */
  sourceFingerprint: string

  name: string
  categoryId: CategoryId
  /** Original category text from the row (may contain spelling variations). */
  categoryRaw?: string

  state?: string
  geopoliticalZone?: string
  lga?: string
  address?: string

  chainNumber?: string | number
  contactPerson?: string
  phone?: string
  email?: string

  licenceNumber?: string
  recordedLicenceStatus?: string
  issueDate?: ParsedDate
  expiryDate?: ParsedDate
  oldNewClassification?: string

  screensOld?: number | null
  screensOldRaw?: string
  screenDetailsOld?: string
  screensNew?: number | null
  screensNewRaw?: string
  screenDetailsNew?: string

  /** Generic No_of_Screens column (all sheets except Exhibitors Premises). */
  screens?: number | null
  screensRaw?: string
  screenDetails?: string

  seats: SeatParse

  lastInspectionDate?: ParsedDate
  notes?: string

  dataQualityFlags: DataQualityFlag[]
  /** Every original header → value pair from the source row, untouched. */
  sourceData: Record<string, string | number | boolean | null>

  /** "seed" for workbook rows, "import" for user imports, "local" for records created in-app. */
  origin: "seed" | "import" | "local"
  createdAt: string
  updatedAt: string
}

export type DataQualityFlag =
  | "missing-name"
  | "missing-state"
  | "missing-zone"
  | "missing-lga"
  | "missing-address"
  | "missing-contact"
  | "missing-screens"
  | "invalid-screens"
  | "suspicious-screens"
  | "missing-seats"
  | "suspicious-seats"
  | "unparseable-seats"
  | "seat-screen-mismatch"
  | "unparseable-issue-date"
  | "unparseable-expiry-date"
  | "implausible-date"
  | "missing-licence-status"
  | "old-new-conflict"
  | "unrecognised-state"
  | "category-variant"
  | "numeric-screen-details"

/** Editable canonical fields. Source data and provenance can never be edited. */
export type EditableField =
  | "name"
  | "state"
  | "geopoliticalZone"
  | "lga"
  | "address"
  | "contactPerson"
  | "phone"
  | "email"
  | "licenceNumber"
  | "recordedLicenceStatus"
  | "oldNewClassification"
  | "screensOld"
  | "screensNew"
  | "screens"
  | "screenDetails"
  | "screenDetailsOld"
  | "screenDetailsNew"
  | "seatsRaw"
  | "issueDate"
  | "expiryDate"
  | "notes"

export type EstablishmentInput = Partial<{
  name: string
  categoryId: CategoryId
  state: string
  geopoliticalZone: string
  lga: string
  address: string
  contactPerson: string
  phone: string
  email: string
  licenceNumber: string
  recordedLicenceStatus: string
  oldNewClassification: string
  screensOld: number | null
  screensNew: number | null
  screens: number | null
  screenDetails: string
  screenDetailsOld: string
  screenDetailsNew: string
  seatsRaw: string
  /** ISO yyyy-mm-dd */
  issueDate: string
  /** ISO yyyy-mm-dd */
  expiryDate: string
  notes: string
}>

export type ChangeEvent = {
  id: string
  recordId: string
  at: string
  kind: "create" | "update" | "delete" | "import" | "reset"
  changes: { field: string; from: unknown; to: unknown }[]
  summary?: string
}

export type DatasetMeta = {
  schemaVersion: number
  datasetVersion: string
  sourceFile: string
  generatedAt: string
  /** When this dataset was loaded into the current browser. */
  loadedAt?: string
  recordCount: number
  lastImport?: { at: string; file: string; mode: "replace" | "append"; added: number }
}

export type RegistrySettings = {
  /** Use OLD screen counts when NEW is missing (Exhibitors Premises only). Off by default. */
  useOldScreenFallback: boolean
}
