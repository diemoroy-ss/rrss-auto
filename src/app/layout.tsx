import type { Metadata } from 'next'
import { Fraunces, DM_Mono, Plus_Jakarta_Sans, Work_Sans, Space_Mono } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
  style: ['normal', 'italic'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500'],
})

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  weight: ['400', '500', '600', '700'],
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'SocialPilot by Santisoft — Redes Sociales en Piloto Automático',
  description: 'Automatización y generación estratégica de contenido para redes sociales (Meta, TikTok) y posicionamiento en motores de IA (GEO/SEO) por Santisoft.',
  metadataBase: new URL('https://socialpilot.cl'),
  icons: {
    icon: [
      { url: '/favicon.svg?v=7', type: 'image/svg+xml' },
      { url: '/icon-192.png?v=7', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png?v=7', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.svg?v=7',
    apple: '/apple-touch-icon.png?v=7',
  },
  manifest: '/site.webmanifest?v=7',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SocialPilot',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: 'SocialPilot by Santisoft — Redes Sociales en Piloto Automático',
    description: 'Generación automática de contenido persuasivo, calendarios estratégicos y posicionamiento GEO en IA.',
    url: 'https://socialpilot.cl',
    siteName: 'SocialPilot by Santisoft',
    images: [{ url: '/favicon.svg?v=4' }],
    locale: 'es_CL',
    type: 'website',
  },
}

import { ThemeProvider } from '../contexts/ThemeContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${dmMono.variable} ${plusJakartaSans.variable} ${workSans.variable} ${spaceMono.variable}`}>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

