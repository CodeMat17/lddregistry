"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Bookmark, Columns3, LayoutGrid, Plus, Rows3, Search, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRegistry } from "@/components/providers/registry-provider"
import { useDebouncedValue, useLocalPreference } from "@/hooks/use-local-preference"
import { EmptyState } from "@/components/common/states"
import { FilterDrawer } from "@/components/filters/filter-drawer"
import { ShareExportMenu } from "@/components/export/share-export-menu"
import { CATEGORIES, categoryLabel } from "@/lib/domain/categories"
import type { CategoryId } from "@/lib/domain/types"
import { computeAnalytics } from "@/lib/data/analytics"
import {
  activeFilterChips,
  applyFilters,
  describeFilters,
  EMPTY_FILTERS,
  filtersFromParams,
  filtersToParams,
  SORT_LABELS,
  type RegistryFilters,
  type SortKey,
} from "@/lib/data/filters"
import { buildRegisterReport } from "@/lib/data/reports"
import { formatNumber, formatTimestamp } from "@/lib/format"
import { RecordCard } from "./record-card"
import { DEFAULT_COLUMNS, RecordsTable, TABLE_COLUMNS, type ColumnId } from "./records-table"

const PAGE_SIZE = 24

type Preset = { name: string; params: string }

const BUILT_IN_PRESETS: Preset[] = [
  { name: "Lagos records", params: "state=Lagos" },
  { name: "Records with screens", params: "screens=has&sort=screens&dir=desc" },
  { name: "Missing contact details", params: "contact=missing" },
  { name: "Expiring within 90 days", params: "calc=expiring&sort=expiry" },
]

export function RegisterView({ categoryId, autoFocusSearch = false }: { categoryId?: CategoryId; autoFocusSearch?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { records: all, settings, asOf } = useRegistry()
  const filters = React.useMemo(() => filtersFromParams(new URLSearchParams(searchParams.toString())), [searchParams])

  const [viewMode, setViewMode] = useLocalPreference<"cards" | "table">("ldd:view-mode", "cards")
  const [columns, setColumns] = useLocalPreference<ColumnId[]>("ldd:table-columns", DEFAULT_COLUMNS)
  const [grouped, setGrouped] = useLocalPreference<boolean>("ldd:group-results", false)
  const [presets, setPresets] = useLocalPreference<Preset[]>("ldd:filter-presets", [])
  const [presetDialog, setPresetDialog] = React.useState(false)
  const [presetName, setPresetName] = React.useState("")

  const setFilters = React.useCallback(
    (next: RegistryFilters) => {
      const qs = filtersToParams(next).toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname],
  )

  // Debounced search text synced to the URL.
  const [text, setText] = React.useState(filters.q)
  const lastSynced = React.useRef(filters.q)
  const debounced = useDebouncedValue(text, 220)
  React.useEffect(() => {
    if (filters.q !== lastSynced.current) {
      lastSynced.current = filters.q
      setText(filters.q)
    }
  }, [filters.q])
  React.useEffect(() => {
    if (debounced.trim() !== filters.q.trim()) {
      lastSynced.current = debounced.trim()
      setFilters({ ...filters, q: debounced })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const scope = React.useMemo(() => (categoryId ? all.filter((r) => r.categoryId === categoryId) : all), [all, categoryId])
  const results = React.useMemo(() => applyFilters(scope, filters, settings, asOf), [scope, filters, settings, asOf])
  const summary = React.useMemo(() => computeAnalytics(results, settings, asOf), [results, settings, asOf])
  const chips = activeFilterChips(filters, categoryId)
  const hasCriteria = chips.length > 0 || filters.q.trim() !== ""

  const [limit, setLimit] = React.useState(PAGE_SIZE)
  const resetKey = searchParams.toString()
  const [prevKey, setPrevKey] = React.useState(resetKey)
  if (prevKey !== resetKey) {
    setPrevKey(resetKey)
    setLimit(PAGE_SIZE)
  }
  const shown = results.slice(0, limit)

  const title = categoryId ? `${categoryLabel(categoryId)} register` : filters.q.trim() ? `Search results for “${filters.q.trim()}”` : "All records"
  const filterText = describeFilters(filters, categoryId)
  const report = () => buildRegisterReport(title, results, summary, { generatedAt: formatTimestamp(new Date().toISOString()), filters: filterText, asOf, settings })

  const onSort = (key: SortKey) => setFilters({ ...filters, sort: key, dir: filters.sort === key && filters.dir === "asc" ? "desc" : "asc" })
  const sortKeys = (Object.keys(SORT_LABELS) as SortKey[]).filter((k) => !(categoryId && k === "category"))

  const groups = React.useMemo(() => {
    if (categoryId || !grouped) return null
    return CATEGORIES.map((c) => ({ c, items: shown.filter((r) => r.categoryId === c.id) })).filter((g) => g.items.length)
  }, [categoryId, grouped, shown])

  return (
    <div className="space-y-4">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
        <InputGroup className="h-11 bg-card lg:max-w-md">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={categoryId ? `Search ${categoryLabel(categoryId)}…` : "Name, contact, state, LGA, phone, email…"}
            aria-label={categoryId ? `Search within ${categoryLabel(categoryId)}` : "Search all records"}
            autoFocus={autoFocusSearch}
            enterKeyHint="search"
          />
          {text && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-sm" aria-label="Clear search" onClick={() => setText("")}>
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        <div className="flex flex-wrap items-center gap-2" data-print-hide>
          <FilterDrawer records={scope} filters={filters} onApply={setFilters} fixedCategory={categoryId} />
          <Select value={filters.sort} onValueChange={(v) => setFilters({ ...filters, sort: v as SortKey })} items={sortKeys.map((k) => ({ value: k, label: SORT_LABELS[k] }))}>
            <SelectTrigger className="h-10! min-w-36 bg-card" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortKeys.map((k) => (
                <SelectItem key={k} value={k} className="min-h-9">
                  Sort: {SORT_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="size-10 bg-card"
            onClick={() => setFilters({ ...filters, dir: filters.dir === "asc" ? "desc" : "asc" })}
            aria-label={filters.dir === "asc" ? "Sorted ascending — switch to descending" : "Sorted descending — switch to ascending"}
          >
            {filters.dir === "asc" ? <ArrowUpNarrowWide /> : <ArrowDownWideNarrow />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="h-10 gap-2 bg-card" />}>
              <Bookmark className="size-4" aria-hidden />
              Presets
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Quick filters</DropdownMenuLabel>
                {BUILT_IN_PRESETS.map((p) => (
                  <DropdownMenuItem key={p.name} className="min-h-10" onClick={() => setFilters({ ...filtersFromParams(new URLSearchParams(p.params)), q: filters.q })}>
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              {presets.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Saved on this device</DropdownMenuLabel>
                    {presets.map((p) => (
                      <DropdownMenuItem key={p.name} className="min-h-10 justify-between" onClick={() => setFilters(filtersFromParams(new URLSearchParams(p.params)))}>
                        <span className="truncate">{p.name}</span>
                        <span
                          role="button"
                          tabIndex={-1}
                          aria-label={`Delete preset ${p.name}`}
                          className="grid size-7 place-items-center rounded hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPresets((list) => list.filter((x) => x.name !== p.name))
                            toast.success(`Preset “${p.name}” deleted.`)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-10" disabled={!hasCriteria} onClick={() => setPresetDialog(true)}>
                <Plus aria-hidden />
                Save current filters…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ToggleGroup
            value={[viewMode]}
            onValueChange={(v: string[]) => v[0] && setViewMode(v[0] as "cards" | "table")}
            variant="outline"
            spacing={0}
            className="hidden md:flex"
            aria-label="View"
          >
            <ToggleGroupItem value="cards" aria-label="Card view" className="size-10 bg-card">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view" className="size-10 bg-card">
              <Rows3 />
            </ToggleGroupItem>
          </ToggleGroup>
          {viewMode === "table" && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="hidden h-10 gap-2 bg-card md:inline-flex" />}>
                <Columns3 className="size-4" aria-hidden />
                Columns
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                  {TABLE_COLUMNS.filter((c) => !(categoryId && c.id === "category")).map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.id}
                      checked={columns.includes(c.id)}
                      onCheckedChange={(on) => setColumns((cols) => (on ? [...cols, c.id] : cols.filter((x) => x !== c.id)))}
                    >
                      {c.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ShareExportMenu title={title} records={results} filters={filterText} report={report} className="h-10 gap-2 bg-card sm:ml-auto" />
        </div>
      </form>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((c) => (
            <Badge key={c.key} variant="secondary" className="h-8 gap-1 rounded-full pr-1 pl-3 text-xs font-normal">
              {c.label}
              <button
                type="button"
                onClick={() => setFilters(c.remove(filters))}
                className="grid size-6 place-items-center rounded-full hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={`Remove filter ${c.label}`}
              >
                <X className="size-3.5" />
              </button>
            </Badge>
          ))}
          <Button variant="link" size="sm" className="h-8 px-1" onClick={() => setFilters({ ...EMPTY_FILTERS, q: filters.q, sort: filters.sort, dir: filters.dir })}>
            Reset filters
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-muted-foreground" aria-live="polite">
        <p>
          <span className="font-medium text-foreground tabular">{formatNumber(results.length)}</span> of {formatNumber(scope.length)} records
          {summary.screens.contributing > 0 && (
            <>
              {" "}
              · <span className="tabular">{formatNumber(summary.screens.total)}</span> recorded screens
            </>
          )}
          {summary.seats.contributing > 0 && (
            <>
              {" "}
              · <span className="tabular">{formatNumber(summary.seats.total)}</span> recorded seats
            </>
          )}
        </p>
        {!categoryId && (
          <Label className="flex min-h-10 cursor-pointer items-center gap-2 font-normal">
            <Switch checked={grouped} onCheckedChange={setGrouped} />
            Group by category
          </Label>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching records"
          description={hasCriteria ? "Try a different spelling, fewer words or remove some filters." : "This register has no records yet."}
          action={
            hasCriteria ? (
              <Button variant="outline" className="h-10" onClick={() => setFilters({ ...EMPTY_FILTERS })}>
                Clear search and filters
              </Button>
            ) : categoryId ? (
              <Button className="h-10" render={<Link href={`/records/new?category=${categoryId}`} />} nativeButton={false}>
                Add a record
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {viewMode === "table" && (
            <div className="hidden md:block">
              <RecordsTable
                records={shown}
                columns={columns.filter((c) => !(categoryId && c === "category"))}
                sort={filters.sort}
                dir={filters.dir}
                onSort={onSort}
                query={filters.q}
              />
            </div>
          )}
          <div className={viewMode === "table" ? "md:hidden" : undefined}>
            {groups ? (
              <div className="space-y-6">
                {groups.map((g) => (
                  <section key={g.c.id} aria-labelledby={`grp-${g.c.id}`}>
                    <h2 id={`grp-${g.c.id}`} className="mb-2 flex items-center justify-between text-sm font-semibold">
                      {g.c.label}
                      <span className="font-normal text-muted-foreground tabular">{g.items.length}</span>
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {g.items.map((r) => (
                        <RecordCard key={r.id} record={r} query={filters.q} showCategory={false} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((r) => (
                  <RecordCard key={r.id} record={r} query={filters.q} showCategory={!categoryId} />
                ))}
              </div>
            )}
          </div>
          {results.length > shown.length && (
            <div className="flex flex-col items-center gap-1 pt-2">
              <Button variant="outline" className="h-11 w-full max-w-xs bg-card" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                Show more
              </Button>
              <p className="text-xs text-muted-foreground">
                Showing {formatNumber(shown.length)} of {formatNumber(results.length)}
              </p>
            </div>
          )}
        </>
      )}

      <Dialog open={presetDialog} onOpenChange={setPresetDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save filter preset</DialogTitle>
            <DialogDescription>Saved in this browser only. Current filters: {filterText}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const name = presetName.trim()
              if (!name) return
              const params = filtersToParams(filters).toString()
              setPresets((list) => [...list.filter((p) => p.name !== name), { name, params }])
              setPresetDialog(false)
              setPresetName("")
              toast.success(`Preset “${name}” saved.`)
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="preset-name">Preset name</Label>
              <Input id="preset-name" className="h-10" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="e.g. Ogun cinemas with screens" autoFocus />
            </div>
            <DialogFooter>
              <Button type="submit" className="h-10" disabled={!presetName.trim()}>
                Save preset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
