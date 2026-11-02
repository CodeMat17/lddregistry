"use client"

import * as React from "react"
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"

const MAX_LABEL = 22

/** Single-line axis label (Recharts would otherwise wrap long names onto two cramped lines). */
function AxisLabel({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const v = payload?.value ?? ""
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} className="fill-muted-foreground">
      <title>{v}</title>
      {v.length > MAX_LABEL ? `${v.slice(0, MAX_LABEL - 1)}…` : v}
    </text>
  )
}

export type BarDatum = { label: string; value: number; muted?: boolean }

/**
 * Horizontal ranked bars: readable on phones (labels never rotate). Bars are
 * buttons when `onSelect` is given so a tap opens the filtered register.
 */
export function RankedBarChart({
  data,
  valueLabel,
  color = "var(--chart-1)",
  onSelect,
  initialRows = 8,
  ariaLabel,
}: {
  data: BarDatum[]
  valueLabel: string
  color?: string
  onSelect?: (label: string) => void
  initialRows?: number
  ariaLabel: string
}) {
  const [showAll, setShowAll] = React.useState(false)
  const rows = showAll ? data : data.slice(0, initialRows)
  const config = { value: { label: valueLabel, color } } satisfies ChartConfig
  const longest = Math.max(...rows.map((r) => Math.min(r.label.length, MAX_LABEL)), 4)
  const labelWidth = Math.max(64, longest * 6.4 + 8)

  if (!data.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No usable data for this chart.</p>
  }

  return (
    <div>
      <ChartContainer config={config} className="aspect-auto w-full" style={{ height: rows.length * 34 + 8 }} role="img" aria-label={ariaLabel}>
        <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 44, top: 0, bottom: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="label"
            width={labelWidth}
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={<AxisLabel />}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
          <Bar
            dataKey="value"
            radius={4}
            fill="var(--color-value)"
            onClick={onSelect ? (d) => onSelect((d as unknown as BarDatum).label) : undefined}
            className={onSelect ? "cursor-pointer" : undefined}
            isAnimationActive={false}
          >
            {rows.map((r) => (
              <Cell key={r.label} fill={r.muted ? "var(--chart-4)" : "var(--color-value)"} />
            ))}
            <LabelList dataKey="value" position="right" className="fill-foreground tabular" fontSize={12} formatter={(v: unknown) => formatNumber(Number(v))} />
          </Bar>
        </BarChart>
      </ChartContainer>
      {/* Accessible equivalent and keyboard/tap targets for each bar. */}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {onSelect && (
        <div className="sr-only">
          {rows.map((d) => (
            <button key={d.label} type="button" onClick={() => onSelect(d.label)}>
              Open records for {d.label}
            </button>
          ))}
        </div>
      )}
      {data.length > initialRows && (
        <Button variant="ghost" size="sm" className="mt-1 h-9 w-full text-muted-foreground" onClick={() => setShowAll((s) => !s)}>
          {showAll ? "Show fewer" : `View all ${data.length}`}
        </Button>
      )}
    </div>
  )
}
