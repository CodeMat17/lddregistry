"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MOBILE_NAV } from "./nav-items"

export function MobileBottomNav() {
  return (
    <Suspense fallback={<BottomNav pathname="" />}>
      <ActiveBottomNav />
    </Suspense>
  )
}

function ActiveBottomNav() {
  return <BottomNav pathname={usePathname()} />
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Main navigation"
      data-print-hide
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-8px_oklch(0.25_0.04_260/0.15)] backdrop-blur supports-[backdrop-filter]:bg-card/90 md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {MOBILE_NAV.map((item) => {
          const active = item.match(pathname)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-muted-foreground transition-colors duration-150 outline-none focus-visible:bg-accent",
                  active && "text-primary",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-colors duration-200",
                    active && "bg-primary/10",
                  )}
                >
                  <item.icon className="size-5" aria-hidden strokeWidth={active ? 2.25 : 1.75} />
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
