import { slugify } from "@/lib/format"
import { todayIso } from "@/lib/data/analytics/licence"

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadText(text: string, filename: string, type: string) {
  downloadBlob(new Blob([text], { type }), filename)
}

export function exportFilename(title: string, ext: string) {
  return `ldd-registry-${slugify(title)}-${todayIso()}.${ext}`
}

/** Prints an HTML document in a hidden iframe so the user can save it as PDF. */
export function printHtml(html: string) {
  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument
  if (!doc) {
    iframe.remove()
    throw new Error("Could not prepare the print view.")
  }
  doc.open()
  doc.write(html)
  doc.close()
  const win = iframe.contentWindow!
  const cleanup = () => setTimeout(() => iframe.remove(), 500)
  win.addEventListener("afterprint", cleanup)
  setTimeout(() => {
    win.focus()
    win.print()
    setTimeout(cleanup, 60_000)
  }, 250)
}

export type ShareResult = "shared" | "copied" | "cancelled"

/** Native share sheet when available; otherwise copy text to the clipboard. */
export async function shareOrCopy(title: string, text: string): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text })
      return "shared"
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled"
    }
  }
  await copyText(text)
  return "copied"
}

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement("textarea")
  ta.value = text
  ta.style.position = "fixed"
  ta.style.opacity = "0"
  document.body.appendChild(ta)
  ta.select()
  document.execCommand("copy")
  ta.remove()
}
