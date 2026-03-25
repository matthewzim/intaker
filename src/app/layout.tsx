import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Caseflow – Smart Legal Intake',
  description: 'AI-powered legal intake and client workspace for law firms',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  )
}
