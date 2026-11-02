"use client"

import { Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * Methodology note. Uses a popover (tap or click) rather than a hover-only
 * tooltip so it works on touch screens.
 */
export function InfoTip({ children, label = "How this is calculated", className }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          "inline-grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          className,
        )}
      >
        <Info className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="w-72 text-xs leading-relaxed text-pretty">{children}</PopoverContent>
    </Popover>
  )
}
