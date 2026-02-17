import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support Staff Dashboard',
  description: 'Dashboard for managing support staff activity and statistics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
