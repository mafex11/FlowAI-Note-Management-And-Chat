"use client"

import * as React from "react"
import { Home, Upload, FileText, MessageSquare, LogOut, GitBranch, Search } from "lucide-react"
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
    <Sidebar collapsible="icon" className="bg-black border-r border-gray-800" {...props}>
      <SidebarHeader className="group-data-[state=collapsed]:hidden">
        <h1 className="text-2xl font-bold px-4 text-white">
          Notes<span className="text-blue-500">AI</span>
        </h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard')}>
              <Link href="/dashboard" className="flex items-center text-gray-300 hover:text-white">
                <Home className="mr-2 h-5 w-5" />
                <span className="group-data-[state=collapsed]:hidden">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/upload')}>
              <Link href="/dashboard/upload" className="flex items-center text-gray-300 hover:text-white">
                <Upload className="mr-2 h-5 w-5" />
                <span className="group-data-[state=collapsed]:hidden">Upload Notes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/documents')}>
              <Link href="/dashboard/documents" className="flex items-center text-gray-300 hover:text-white">
                <FileText className="mr-2 h-5 w-5" />
                <span className="group-data-[state=collapsed]:hidden">My Documents</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/flowchart')}>
              <Link href="/dashboard/flowchart" className="flex items-center text-gray-300 hover:text-white">
                <GitBranch className="mr-2 h-5 w-5" />
                <span className="group-data-[state=collapsed]:hidden">Topic Flowchart</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/chat')}>
              <Link href="/dashboard/chat" className="flex items-center text-gray-300 hover:text-white">
                <MessageSquare className="mr-2 h-5 w-5" />
                <span className="group-data-[state=collapsed]:hidden">Universal Chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/dashboard/research')}>
              <Link href="/dashboard/research" className="flex items-center text-gray-300 hover:text-white">
                <Search className="mr-2 h-5 w-5" />
                <span className="group-data-[state=collapsed]:hidden">Research Paper</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <div className="mt-auto p-4">
        <SidebarMenuButton
          className="w-full flex items-center justify-center text-gray-300 hover:text-white"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="group-data-[state=collapsed]:hidden">Sign Out</span>
        </SidebarMenuButton>
      </div>
    </Sidebar>
  )
}
