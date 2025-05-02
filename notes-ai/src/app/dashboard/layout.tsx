"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Upload, FileText, Home, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Debug session state
  useEffect(() => {
    console.log("Session status:", status);
    console.log("Session data:", session);
  }, [session, status]);

  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">
            Notes<span className="text-primary">AI</span>
          </h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/dashboard" 
                className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${
                  isActive('/dashboard') ? 'bg-gray-100 text-primary font-medium' : ''
                }`}
              >
                <Home className="mr-2 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/upload" 
                className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${
                  isActive('/dashboard/upload') ? 'bg-gray-100 text-primary font-medium' : ''
                }`}
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Notes
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/documents" 
                className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${
                  isActive('/dashboard/documents') ? 'bg-gray-100 text-primary font-medium' : ''
                }`}
              >
                <FileText className="mr-2 h-5 w-5" />
                My Documents
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/chat" 
                className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${
                  isActive('/dashboard/chat') ? 'bg-gray-100 text-primary font-medium' : ''
                }`}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Universal Chat
              </Link>
            </li>
          </ul>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center" 
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
} 