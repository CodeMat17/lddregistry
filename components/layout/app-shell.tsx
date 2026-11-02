"use client"

import * as React from "react"
import Link from "next/link"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Brand } from "./brand"
import { CommandPaletteButton, CommandPaletteProvider } from "./command-palette"
import { DesktopSidebar } from "./desktop-sidebar"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { OfflineIndicator, PrototypeDataBanner } from "./status-indicators"
import { ServiceWorkerRegistration } from "./service-worker"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <CommandPaletteProvider>
        <a
          href="#content"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <DesktopSidebar />
        <SidebarInset className="min-w-0">
          <header
            data-print-hide
            className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 md:px-4"
          >
            <SidebarTrigger className="hidden size-9 md:inline-flex" aria-label="Toggle sidebar" />
            <Separator orientation="vertical" className="mx-1 hidden h-5 md:block" />
            <Link href="/" className="rounded-lg text-primary md:hidden" aria-label="LDD Registry home">
              <Brand />
            </Link>
            <CommandPaletteButton />
            <div className="ml-auto flex items-center gap-1.5">
              <OfflineIndicator />
              <PrototypeDataBanner />
            </div>
          </header>
          <div id="content" tabIndex={-1} className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 pt-5 pb-28 outline-none md:px-6 md:pb-10 lg:px-8">
            {children}
          </div>
        </SidebarInset>
        <MobileBottomNav />
        <ServiceWorkerRegistration />
      </CommandPaletteProvider>
    </SidebarProvider>
  )
}
