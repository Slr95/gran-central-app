import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Gran Central | Colchones, sommiers y almohadas',
    template: '%s | Gran Central',
  },
  description:
    'Colchones, sommiers y almohadas. Envíos a todo el país, cuotas y retiro en showroom.',
  // Sin esto, compartir un producto por WhatsApp no muestra foto ni precio,
  // que es de donde va a venir buena parte del tráfico.
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Gran Central',
    url: siteUrl,
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
