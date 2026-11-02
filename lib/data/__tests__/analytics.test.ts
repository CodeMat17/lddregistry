import { describe, expect, it } from "vitest"
import { computeAnalytics, calculatedLicenceStatus, expiryFromIssue, licenceExpiry, selectScreenCount } from "../analytics"
import { normaliseWorkbook } from "../import/normalise"
import { csvField, toCsv } from "../export/csv"
import { findPossibleDuplicates } from "../quality/duplicates"
import { applyInput } from "../records"

const HEADER = ["S/N", "Cinema_Name", "State", "Region", "LGA", "Precise_Address", "Category", "Chain", "No of Screens OLD", "Screen Details OLD", "No of Screens NEW", "Screens Details NEW", "Total_Seats", "Contact_Person", "Phone", "Email", "OLD/NEW", "License_Status", "Date_of_Issue", "Date_of_Expiration"]
const GENERIC = ["S/N", "Cinema_Name", "State", "Region", "LGA", "Precise_Address", "Category", "Chain", "No_of_Screens", "Screen_Details", "Total_Seats", "Contact_Person", "Phone", "Email", "OLD/NEW", "License_Status", "Date_of_Issue", "Date_of_Expiration"]

function fixture() {
  return normaliseWorkbook(
    [
      {
        name: "EXHIBITORS PREMISES",
        rows: [
          ["EXHIBITION PREMISES"],
          HEADER,
          [1, "Alpha Cinema", "Lagos", "South West", "Ikeja", "1 Road", "Exhibition Premises", 1, 4, "4small", 5, "5small", "50,50,50,50,50", "A", "08011111111", null, "RENEWAL", "Valid", 45658, "31/12/2026"],
          [2, "Beta Cinema", "Jos", "North Central", null, null, "Exhibiton Premises", 2, 3, null, null, null, 104106, null, null, null, null, "Expired", 44035, 44399],
          [3, "Gamma", "Fct", "North Central", "Abuja", null, "Exhibition Premises", 3, "2medium", null, "2medium", null, null, null, "08011111111", null, null, "Valid", null, "24/09/202"],
          [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        ],
      },
      {
        name: "DRIVE IN CINEMA",
        rows: [
          [null, "DRIVE - IN CINEMA"],
          GENERIC,
          [1, "Drive One", "Lagos", "South West", null, null, "DRIVE-IN-CINEMA", 1, null, "Drive-in-Cinema", null, null, "08022222222", null, null, "Expired", 44805, 45169],
        ],
      },
    ],
    { sourceFile: "test.xlsx", now: "2026-01-01T00:00:00.000Z", origin: "seed" },
  )
}

describe("normaliseWorkbook", () => {
  const { records, report } = fixture()
  it("detects header rows, preserves sheet/row and skips only blank rows", () => {
    expect(records).toHaveLength(4)
    expect(report.sheets[0]).toMatchObject({ headerRow: 2, recordCount: 3, blankRowsSkipped: 1 })
    expect(records[0]).toMatchObject({ sourceSheet: "EXHIBITORS PREMISES", sourceRow: 3, phone: "08011111111" })
    expect(records[0].sourceData["Cinema_Name"]).toBe("Alpha Cinema")
  })
  it("flags without correcting", () => {
    const beta = records[1]
    expect(beta.state).toBe("Jos")
    expect(beta.dataQualityFlags).toEqual(expect.arrayContaining(["unrecognised-state", "suspicious-seats", "category-variant"]))
    const gamma = records[2]
    expect(gamma.dataQualityFlags).toEqual(expect.arrayContaining(["invalid-screens", "unparseable-expiry-date", "missing-screens"]))
    expect(gamma.expiryDate).toEqual({ iso: undefined, raw: "24/09/202" })
  })
})

describe("screen totals", () => {
  const { records } = fixture()
  it("uses NEW, never OLD + NEW", () => {
    const a = computeAnalytics(records, { useOldScreenFallback: false }, "2026-06-01")
    expect(a.screens.total).toBe(5)
    expect(a.screens.fromNew).toBe(1)
  })
  it("uses OLD only when the fallback is enabled", () => {
    expect(selectScreenCount(records[1], { useOldScreenFallback: false }).value).toBeUndefined()
    expect(selectScreenCount(records[1], { useOldScreenFallback: true })).toEqual({ value: 3, source: "old" })
    const a = computeAnalytics(records, { useOldScreenFallback: true }, "2026-06-01")
    expect(a.screens.total).toBe(8)
  })
  it("sums only reliable seats and discloses exclusions", () => {
    const a = computeAnalytics(records, { useOldScreenFallback: false }, "2026-06-01")
    expect(a.seats.total).toBe(250)
    expect(a.seats.contributing).toBe(1)
    expect(a.seats.suspicious).toBe(1)
  })
  it("counts recognised states only", () => {
    const a = computeAnalytics(records, { useOldScreenFallback: false }, "2026-06-01")
    expect(a.statesRecognised).toBe(2)
    expect(a.unrecognisedStateValues).toBe(1)
  })
})

describe("licence status", () => {
  const { records } = fixture()
  it("expires the day before the issue anniversary", () => {
    expect(expiryFromIssue("2025-03-10")).toBe("2026-03-09")
    expect(expiryFromIssue("2025-01-01")).toBe("2025-12-31")
    expect(expiryFromIssue("2024-02-29")).toBe("2025-02-28")
  })
  it("calculates from the issue date, ignoring the recorded expiry", () => {
    // Alpha: issued 2025-01-01, so expires 2025-12-31 (recorded expiry 31/12/2026 is not used).
    expect(licenceExpiry(records[0])).toBe("2025-12-31")
    expect(calculatedLicenceStatus(records[0], "2025-06-01")).toBe("valid")
    expect(calculatedLicenceStatus(records[0], "2025-11-15")).toBe("expiring")
    expect(calculatedLicenceStatus(records[0], "2026-06-01")).toBe("expired")
    expect(calculatedLicenceStatus(records[1], "2026-06-01")).toBe("expired")
  })
  it("leaves expiry blank when the issue date is unusable, even if an expiry was recorded", () => {
    expect(licenceExpiry({ ...records[1], issueDate: { raw: "12/12/202" } })).toBeUndefined()
    expect(calculatedLicenceStatus({ ...records[1], issueDate: undefined }, "2026-06-01")).toBeUndefined()
    expect(licenceExpiry(records[2])).toBeUndefined()
    expect(calculatedLicenceStatus(records[2], "2026-06-01")).toBeUndefined()
  })
})

describe("duplicates", () => {
  it("suggests matches on phone without merging", () => {
    const { records } = fixture()
    const groups = findPossibleDuplicates(records)
    expect(groups).toHaveLength(1)
    expect(groups[0].reasons).toEqual(["Same phone"])
    expect(records).toHaveLength(4)
  })
})

describe("local edits", () => {
  it("records changes and leaves source data untouched", () => {
    const { records } = fixture()
    const { record, changes } = applyInput(records[1], { state: "Plateau", seatsRaw: "104,106" }, "2026-02-01T00:00:00.000Z")
    expect(record.state).toBe("Plateau")
    expect(record.seats).toMatchObject({ total: 210, status: "list" })
    expect(record.sourceData["State"]).toBe("Jos")
    expect(record.dataQualityFlags).not.toContain("unrecognised-state")
    expect(changes.map((c) => c.field)).toEqual(["state", "seats"])
  })
})

describe("csv", () => {
  it("escapes commas, quotes and line breaks and adds a BOM", () => {
    expect(csvField('a,"b"')).toBe('"a,""b"""')
    expect(csvField("line\nbreak")).toBe('"line\nbreak"')
    expect(csvField("08012345678")).toBe("08012345678")
    expect(toCsv([["x", "y"]]).startsWith("﻿x,y")).toBe(true)
  })
})
