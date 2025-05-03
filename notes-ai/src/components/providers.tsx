"use client"

import * as React from "react"
import { ThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        forcedTheme="dark"
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
} 