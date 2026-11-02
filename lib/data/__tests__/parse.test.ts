import { describe, expect, it } from "vitest"
import { cleanPhone, parseDateCell, parseScreenCount, parseSeats } from "../import/parse"

describe("parseSeats", () => {
  it("accepts plain integers", () => {
    expect(parseSeats(50)).toMatchObject({ total: 50, status: "numeric" })
    expect(parseSeats("120")).toMatchObject({ total: 120, status: "numeric" })
  })
  it("sums clean comma-separated lists", () => {
    expect(parseSeats("60,95,93,100,78")).toMatchObject({ total: 426, parts: [60, 95, 93, 100, 78], status: "list" })
    expect(parseSeats("80, 49,6")).toMatchObject({ total: 135, status: "list" })
  })
  it("flags numbers whose commas were lost instead of summing them", () => {
    expect(parseSeats(104106).status).toBe("suspicious")
    expect(parseSeats(104106).total).toBeUndefined()
    expect(parseSeats(150150150).status).toBe("suspicious")
  })
  it("treats blanks as missing, not zero", () => {
    expect(parseSeats(null)).toEqual({ status: "missing" })
    expect(parseSeats("  ")).toEqual({ status: "missing" })
  })
  it("keeps malformed text raw", () => {
    expect(parseSeats("about 100")).toMatchObject({ raw: "about 100", status: "unparseable" })
  })
})

describe("parseScreenCount", () => {
  it("never interprets descriptive text as a count", () => {
    expect(parseScreenCount("Drive-in-Cinema").status).toBe("invalid")
    expect(parseScreenCount("2medium")).toMatchObject({ status: "invalid", raw: "2medium" })
  })
  it("flags implausibly large counts", () => {
    expect(parseScreenCount(158).status).toBe("suspicious")
  })
  it("accepts whole numbers", () => {
    expect(parseScreenCount(5)).toMatchObject({ value: 5, status: "valid" })
    expect(parseScreenCount(0)).toMatchObject({ value: 0, status: "valid" })
  })
})

describe("parseDateCell", () => {
  it("converts Excel serials without timezone shift", () => {
    expect(parseDateCell(44035)).toMatchObject({ iso: "2020-07-23", status: "valid" })
  })
  it("reads D/M/YYYY text", () => {
    expect(parseDateCell("15/8/2026")).toMatchObject({ iso: "2026-08-15", status: "valid" })
  })
  it("keeps malformed dates raw and unparsed", () => {
    for (const raw of ["24/09/202", "0411/2025", "1O/12/2025", "14/14/2025", "Valid"]) {
      const p = parseDateCell(raw)
      expect(p.iso).toBeUndefined()
      expect(p.raw).toBe(raw)
      expect(p.status).toBe("unparseable")
    }
  })
  it("rejects implausible serials", () => {
    expect(parseDateCell(199).status).toBe("implausible")
  })
})

describe("cleanPhone", () => {
  it("preserves leading zeroes", () => {
    expect(cleanPhone("08027614550")).toBe("08027614550")
  })
})
