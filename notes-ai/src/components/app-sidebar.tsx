"use client"

import * as React from "react"
import { Home, Upload, FileText, MessageSquare, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="group-data-[state=collapsed]:hidden">
        <h1 className="text-2xl font-bold px-4">
          Notes<span className="text-primary">AI</span>
        </h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard')}>
              <Link href="/dashboard" className="flex items-center">
                <Home className="mr-2 h-5 w-5" />
                <span className="group-data-[state=collapsed]:hidden">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/upload')}>
              <Link href="/dashboard/upload" className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                <span className="group-data-[state=collapsed]:hidden">Upload Notes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/documents')}>
              <Link href="/dashboard/documents" className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                <span className="group-data-[state=collapsed]:hidden">My Documents</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/chat')}>
              <Link href="/dashboard/chat" className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                <span className="group-data-[state=collapsed]:hidden">Universal Chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <div className="mt-auto p-4">
        <SidebarMenuButton
          className="w-full flex items-center justify-center"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="group-data-[state=collapsed]:hidden">Sign Out</span>
        </SidebarMenuButton>
      </div>
    </Sidebar>
  )
}
