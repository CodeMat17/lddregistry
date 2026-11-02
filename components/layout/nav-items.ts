import { House, type LucideIcon, Plus, Settings } from "lucide-react"

export type NavItem = { href: string; label: string; icon: LucideIcon; match: (path: string) => boolean }

const starts = (...prefixes: string[]) => (path: string) => prefixes.some((p) => path === p || path.startsWith(`${p}/`))

export const PRIMARY_NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: House,
    match: (p) => p === "/" || starts("/categories")(p) || (starts("/records")(p) && !starts("/records/new")(p)),
  },
  { href: "/records/new", label: "Add record", icon: Plus, match: starts("/records/new") },
]

export const SECONDARY_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings, match: starts("/settings") },
]

export const MOBILE_NAV: NavItem[] = [...PRIMARY_NAV, ...SECONDARY_NAV]
