import { createConvexRepository } from "./convex-establishment-repository"
import { LocalEstablishmentRepository } from "./local-establishment-repository"
import type { RegistryRepository } from "./types"

export type DataProvider = "local" | "convex"

/** The single place that chooses a data provider. Future: "convex". */
export const dataProvider: DataProvider = "local"

let repository: RegistryRepository | null = null

export function getRepository(): RegistryRepository {
  repository ??= dataProvider === "local" ? new LocalEstablishmentRepository() : createConvexRepository()
  return repository
}

export type * from "./types"
