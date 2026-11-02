import type { Establishment, RegistrySettings, ScreenSource } from "@/lib/domain/types"

export type ScreenSelection = { value?: number; source: ScreenSource }

/** Records from sheets with separate OLD/NEW screen columns. */
export function hasOldNewScreens(r: Establishment): boolean {
  return r.screensNew !== undefined || r.screensOld !== undefined
}

/**
 * Pick exactly one screen count per record — never OLD + NEW.
 *  1. NEW when present and valid.
 *  2. OLD only when the user has enabled the OLD fallback.
 *  3. The generic No_of_Screens column for other registers.
 */
export function selectScreenCount(r: Establishment, settings: RegistrySettings): ScreenSelection {
  if (hasOldNewScreens(r)) {
    if (typeof r.screensNew === "number") return { value: r.screensNew, source: "new" }
    if (settings.useOldScreenFallback && typeof r.screensOld === "number") return { value: r.screensOld, source: "old" }
    return { source: "none" }
  }
  if (typeof r.screens === "number") return { value: r.screens, source: "generic" }
  return { source: "none" }
}

export const SCREEN_SOURCE_LABEL: Record<ScreenSource, string> = {
  new: "NEW count",
  old: "OLD count (fallback)",
  generic: "No_of_Screens",
  none: "Not available",
}

export const SCREEN_METHODOLOGY =
  "Calculated from available screen-count fields. Records with missing or ambiguous values are excluded. This is not a verified operational-screen count."

export const SEAT_METHODOLOGY =
  "Recorded seating capacity: sums only values that are a whole number or a clean comma-separated list of numbers. Missing, malformed and suspicious values (for example lists whose commas were lost) are excluded and counted separately."
