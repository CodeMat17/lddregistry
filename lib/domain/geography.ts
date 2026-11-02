/**
 * Reference list of Nigeria's 36 states + FCT. Used only to *recognise* state
 * values for reporting; it is never used to infer or rewrite a source value.
 */
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
] as const

export const GEOPOLITICAL_ZONES = [
  "North Central",
  "North East",
  "North West",
  "South East",
  "South South",
  "South West",
] as const

export const NOT_SPECIFIED = "Not specified"

const stateKeys = new Map(NIGERIAN_STATES.map((s) => [groupKey(s), s]))
const zoneKeys = new Map(GEOPOLITICAL_ZONES.map((z) => [groupKey(z), z]))

/** Lower-case, collapse whitespace and treat hyphens as spaces. */
export function groupKey(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ")
}

/**
 * Conservative grouping label for a state value: fixes casing, whitespace,
 * hyphenation and a trailing " State" suffix only. City names (e.g. "Jos")
 * are kept as written — they are flagged, not converted.
 */
export function stateGroupLabel(raw: string | undefined): string {
  if (!raw || !raw.trim()) return NOT_SPECIFIED
  let key = groupKey(raw)
  if (key.endsWith(" state")) key = key.slice(0, -" state".length)
  const known = stateKeys.get(key)
  if (known) return known
  return titleCase(key)
}

export function isRecognisedState(raw: string | undefined): boolean {
  if (!raw) return false
  return (NIGERIAN_STATES as readonly string[]).includes(stateGroupLabel(raw))
}

export function zoneGroupLabel(raw: string | undefined): string {
  if (!raw || !raw.trim()) return NOT_SPECIFIED
  const key = groupKey(raw)
  return zoneKeys.get(key) ?? titleCase(key)
}

export function titleCase(value: string): string {
  return value.replace(/\b([a-z])([a-z']*)/g, (_, a: string, b: string) => a.toUpperCase() + b)
}
