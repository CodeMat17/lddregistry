import type { CategoryDefinition, CategoryId } from "./types"

/** The 10 licensing registers, one per worksheet of the source workbook. */
export const CATEGORIES: CategoryDefinition[] = [
  {
    id: "exhibitors-premises",
    label: "Exhibitors Premises",
    shortLabel: "Exhibition Premises",
    sourceSheet: "EXHIBITORS PREMISES",
    description: "Licensed cinema and exhibition premises, with screen and seating records.",
    icon: "building",
    screensRelevant: true,
  },
  {
    id: "national-distributors",
    label: "National Distributors",
    shortLabel: "National Dist.",
    sourceSheet: "NATIONAL DISTRIBUTORS",
    description: "Operators licensed to distribute films nationwide.",
    icon: "truck",
    screensRelevant: false,
  },
  {
    id: "regional-exhibitors",
    label: "Regional Exhibitors",
    shortLabel: "Regional Exh.",
    sourceSheet: "REGIONAL EXHIBITORS",
    description: "Exhibitors licensed to operate within a region.",
    icon: "map-pin",
    screensRelevant: true,
  },
  {
    id: "community-exhibitors",
    label: "Community Exhibitors",
    shortLabel: "Community Exh.",
    sourceSheet: "COMMUNITY EXHIBITORS",
    description: "Community-level exhibition licences.",
    icon: "users",
    screensRelevant: true,
  },
  {
    id: "viewing-centres",
    label: "Viewing Centres",
    shortLabel: "Viewing Centres",
    sourceSheet: "VIEWING CENTRE",
    description: "Licensed public viewing centres.",
    icon: "tv",
    screensRelevant: true,
  },
  {
    id: "online-distributors",
    label: "Online Distributors",
    shortLabel: "Online Dist.",
    sourceSheet: "ONLINE DISTRIBUTORS",
    description: "Operators licensed to distribute films online.",
    icon: "globe",
    screensRelevant: false,
  },
  {
    id: "national-exhibitors",
    label: "National Exhibitors",
    shortLabel: "National Exh.",
    sourceSheet: "NATIONAL EXHIBITORS",
    description: "Exhibitors licensed to operate nationwide.",
    icon: "landmark",
    screensRelevant: true,
  },
  {
    id: "regional-distributors",
    label: "Regional Distributors",
    shortLabel: "Regional Dist.",
    sourceSheet: "REGIONAL DISTRIBUTORS",
    description: "Operators licensed to distribute films within a region.",
    icon: "route",
    screensRelevant: false,
  },
  {
    id: "drive-in-cinemas",
    label: "Drive-in Cinemas",
    shortLabel: "Drive-in",
    sourceSheet: "DRIVE IN CINEMA",
    description: "Drive-in and outdoor cinema licences.",
    icon: "car",
    screensRelevant: true,
  },
  {
    id: "sub-urban",
    label: "Sub-urban",
    shortLabel: "Sub-urban",
    sourceSheet: "SUB URBAN",
    description: "Sub-urban exhibition licences.",
    icon: "trees",
    screensRelevant: true,
  },
]

const byId = new Map(CATEGORIES.map((c) => [c.id, c]))
const bySheet = new Map(CATEGORIES.map((c) => [normaliseSheetName(c.sourceSheet), c]))

function normaliseSheetName(name: string) {
  return name.trim().toUpperCase().replace(/[\s_-]+/g, " ")
}

export function getCategory(id: string): CategoryDefinition | undefined {
  return byId.get(id as CategoryId)
}

export function categoryLabel(id: string): string {
  return byId.get(id as CategoryId)?.label ?? id
}

export function categoryForSheet(sheetName: string): CategoryDefinition | undefined {
  return bySheet.get(normaliseSheetName(sheetName))
}

export function isCategoryId(id: string): id is CategoryId {
  return byId.has(id as CategoryId)
}
