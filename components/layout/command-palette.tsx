"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FileText, Search } from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { useRegistry } from "@/components/providers/registry-provider"
import { CATEGORIES, categoryLabel } from "@/lib/domain/categories"
import { searchRecords } from "@/lib/data/search"
import { stateGroupLabel } from "@/lib/domain/geography"
import { CategoryIcon } from "@/components/categories/category-icon"
import { SECONDARY_NAV, PRIMARY_NAV } from "./nav-items"

const PaletteContext = React.createContext<{ open: () => void }>({ open: () => {} })

export function useCommandPalette() {
  return React.useContext(PaletteContext)
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const router = useRouter()
  const { records } = useRegistry()

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  const q = query.trim().toLowerCase()
  const pages = [...PRIMARY_NAV, ...SECONDARY_NAV].filter((n) => !q || n.label.toLowerCase().includes(q))
  const cats = CATEGORIES.filter((c) => !q || c.label.toLowerCase().includes(q))
  const matches = q ? searchRecords(records, q).slice(0, 8) : []

  const ctx = React.useMemo(() => ({ open: () => setOpen(true) }), [])

  return (
    <PaletteContext.Provider value={ctx}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} title="Search the registry" description="Jump to a page, register or record">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search records, registers and pages…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>No matches. Press Enter to search all records.</CommandEmpty>
            {matches.length > 0 && (
              <CommandGroup heading="Records">
                {matches.map((r) => (
                  <CommandItem key={r.id} value={r.id} onSelect={() => go(`/records/${r.id}`)}>
                    <FileText aria-hidden />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{r.name || "Unnamed record"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {categoryLabel(r.categoryId)} · {stateGroupLabel(r.state)}
                      </span>
                    </span>
                  </CommandItem>
                ))}
                <CommandItem value="__all" onSelect={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}>
                  <Search aria-hidden />
                  See all results for “{query.trim()}”
                </CommandItem>
              </CommandGroup>
            )}
            {cats.length > 0 && (
              <CommandGroup heading="Registers">
                {cats.map((c) => (
                  <CommandItem key={c.id} value={`cat-${c.id}`} onSelect={() => go(`/categories/${c.id}`)}>
                    <CategoryIcon name={c.icon} />
                    {c.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {pages.length > 0 && (
              <CommandGroup heading="Pages">
                {pages.map((p) => (
                  <CommandItem key={p.href} value={`page-${p.href}`} onSelect={() => go(p.href)}>
                    <p.icon aria-hidden />
                    {p.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </PaletteContext.Provider>
  )
}

export function CommandPaletteButton() {
  const { open } = useCommandPalette()
  return (
    <Button
      variant="outline"
      onClick={open}
      className="hidden h-9 w-64 justify-start gap-2 bg-card px-3 font-normal text-muted-foreground md:flex lg:w-80"
      aria-label="Search the registry (Ctrl+K)"
    >
      <Search className="size-4" aria-hidden />
      <span className="flex-1 text-left">Search the registry…</span>
      <CommandShortcut className="rounded border bg-muted px-1.5 py-0.5 text-[0.65rem] tracking-normal">Ctrl K</CommandShortcut>
    </Button>
  )
}
