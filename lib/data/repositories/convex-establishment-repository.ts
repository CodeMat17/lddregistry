/**
 * Placeholder for the future Convex adapter. NOT ACTIVE.
 *
 * It will implement `RegistryRepository` with Convex queries/mutations so the
 * UI does not change. See docs/CONVEX_MIGRATION_PLAN.md for the method map,
 * ID strategy, seeding, auth and file-storage plan. Do not import Convex
 * types into lib/domain.
 */
import type { RegistryRepository } from "./types"

export function createConvexRepository(): RegistryRepository {
  throw new Error("The Convex data provider is planned for a later phase and is not available in this prototype.")
}
