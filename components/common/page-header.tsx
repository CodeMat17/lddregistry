"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type Crumb = { label: string; href?: string }

export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  crumbs?: Crumb[]
  actions?: React.ReactNode
  eyebrow?: React.ReactNode
  className?: string
}) {
  const back = crumbs?.slice(0, -1).reverse().find((c) => c.href)
  return (
    <div className={cn("mb-5 flex flex-col gap-3 md:mb-6", className)}>
      {crumbs && crumbs.length > 1 && (
        <>
          <Breadcrumb className="hidden md:block" data-print-hide>
            <BreadcrumbList>
              {crumbs.map((c, i) => (
                <span key={`${c.label}-${i}`} className="contents">
                  <BreadcrumbItem>
                    {c.href && i < crumbs.length - 1 ? (
                      <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="max-w-[40ch] truncate">{c.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {i < crumbs.length - 1 && <BreadcrumbSeparator />}
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          {back?.href && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 h-9 w-fit gap-1 px-2 text-muted-foreground md:hidden"
              render={<Link href={back.href} />}
              nativeButton={false}
              data-print-hide
            >
              <ChevronLeft className="size-4" aria-hidden />
              {back.label}
            </Button>
          )}
        </>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
          <h1 className="text-display font-semibold tracking-tight text-balance wrap-break-word">{title}</h1>
          {description && <p className="mt-1.5 max-w-3xl text-sm text-pretty text-muted-foreground">{description}</p>}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2" data-print-hide>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
