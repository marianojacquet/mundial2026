import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mundial 2026 - Fixture & Predicciones',
  description: 'Completá tu fixture del Mundial 2026, predecí los resultados y ganá premios',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head />
      <body>{children}</body>
    </html>
  )
}
