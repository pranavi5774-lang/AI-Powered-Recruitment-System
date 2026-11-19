'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

const THEMES = ['dark', 'light', 'aurora', 'sunset', 'forest'] as const

/**
 * HireSphere AI theme provider.
 * Dark navy product theme is the default, with a few branded alternatives.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={[...THEMES]}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
