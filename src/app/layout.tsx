import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'HireSphere AI — AI-Powered Recruitment & Employee Management System',
  description:
    'HireSphere AI is a full-stack recruitment and HR platform: explainable TF-IDF resume matching, applicant pipeline management, and a complete employee lifecycle — attendance, leave, performance — with full HR control.',
  keywords: [
    'HireSphere AI',
    'recruitment',
    'applicant tracking system',
    'TF-IDF resume matching',
    'HR management',
    'employee management',
    'Next.js',
    'TypeScript',
  ],
  authors: [{ name: 'HireSphere AI' }],
  icons: {
    icon: '/logo.svg',
  },
  openGraph: {
    title: 'HireSphere AI — AI-Powered Recruitment & Employee Management',
    description:
      'Explainable AI resume screening plus the full employee lifecycle — jobs, applications, interviews, attendance, leave and performance — in one platform.',
    siteName: 'HireSphere AI',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground min-h-screen flex flex-col font-sans"
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
