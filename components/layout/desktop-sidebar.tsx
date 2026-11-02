"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Brand } from "./brand"
import { SECONDARY_NAV, PRIMARY_NAV, type NavItem } from "./nav-items"

function NavGroup({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/60">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={item.match(pathname)}
                tooltip={item.label}
                render={<Link href={item.href} />}
                className="h-10 data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-[1.15rem] data-active:[&_svg]:text-sidebar-primary"
              >
                <item.icon aria-hidden />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <>
      <NavGroup label="Registry" items={PRIMARY_NAV} pathname={pathname} />
      <NavGroup label="App" items={SECONDARY_NAV} pathname={pathname} />
    </>
  )
}

function ActiveSidebarNav() {
  return <SidebarNav pathname={usePathname()} />
}

export function DesktopSidebar() {
  return (
    <Sidebar collapsible="icon" aria-label="Main navigation">
      <SidebarHeader className="px-3 py-4 group-data-[collapsible=icon]:px-1.5">
        <Link href="/" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring" aria-label="LDD Registry home">
          <Brand className="group-data-[collapsible=icon]:[&>span:last-child]:hidden" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* The current path is URL data, so it streams in behind Suspense. */}
        <Suspense fallback={<SidebarNav pathname="" />}>
          <ActiveSidebarNav />
        </Suspense>
      </SidebarContent>
      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden">
        <p className="rounded-lg border border-sidebar-border px-3 py-2 text-xs leading-relaxed text-sidebar-foreground/70">
          National Film and Video Censors Board — Licensing and Documentation Department
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
