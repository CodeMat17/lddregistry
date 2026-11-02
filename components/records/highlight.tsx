import { highlightSegments } from "@/lib/data/search"

export function Highlight({ text, query }: { text: string | undefined; query?: string }) {
  if (!text) return null
  if (!query?.trim()) return <>{text}</>
  return (
    <>
      {highlightSegments(text, query).map((s, i) =>
        s.match ? (
          <mark key={i} className="rounded-sm bg-warning/25 px-0.5 text-inherit dark:bg-warning/30">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  )
}
