import { describe, expect, it } from "vitest"
import * as XLSX from "xlsx"
import { buildWorkbook } from "../export/xlsx"
import { recordsToCsv } from "../export/csv"
import { normaliseWorkbook } from "../import/normalise"
import { readCsv } from "../import/workbook"

const settings = { useOldScreenFallback: false }
const ctx = { title: "Test", filters: "State: Lagos", generatedAt: "1 Nov 2026", asOf: "1 Nov 2026" }

function sample() {
  return normaliseWorkbook(
    [
      {
        name: "NATIONAL DISTRIBUTORS",
        rows: [
          ["S/N", "Cinema_Name", "State", "Region", "Phone", "Email", "Total_Seats", "No_of_Screens"],
          [1, 'Alpha, "Quoted" Ltd', "Lagos", "South West", "08012345678", "a@b.ng", null, null],
        ],
      },
    ],
    { sourceFile: "t.xlsx", now: "2026-01-01T00:00:00.000Z", origin: "seed" },
  ).records
}

describe("exports", () => {
  it("writes phone numbers as text cells in the workbook", () => {
    const wb = buildWorkbook(sample(), settings, ctx)
    expect(wb.SheetNames).toEqual(["Summary", "Records"])
    const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets.Records, { header: 1, raw: true })
    const phoneCol = rows[0].indexOf("Phone")
    expect(rows[1][phoneCol]).toBe("08012345678")
  })

  it("round-trips through CSV export and re-import", () => {
    const csv = recordsToCsv(sample(), settings, ctx)
    expect(csv).toContain("Filters: State: Lagos")
    const { records, report } = normaliseWorkbook(readCsv(csv, "NATIONAL DISTRIBUTORS"), {
      sourceFile: "t.csv",
      now: "2026-01-02T00:00:00.000Z",
      origin: "import",
      categoryOverride: "national-distributors",
    })
    expect(report.sheets[0].headerRow).toBe(7)
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ name: 'Alpha, "Quoted" Ltd', phone: "08012345678", state: "Lagos", geopoliticalZone: "South West" })
  })
})
