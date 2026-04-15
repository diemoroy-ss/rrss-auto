import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Santisoft Automatización RRSS',
  description: 'Panel de control de redes sociales',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="font-AgBody">{children}</body>
    </html>
  )
}
