import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Santisoft AI',
  description: 'Panel de control de redes sociales',
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
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
