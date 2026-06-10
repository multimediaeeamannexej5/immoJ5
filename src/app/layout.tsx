import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import CookieBanner from '@/components/CookieBanner'

export const metadata: Metadata = {
  title: 'Church Project — Ensemble, Bâtissons Notre Maison de Dieu',
  description: 'Rejoignez notre communauté et contribuez à la construction de notre église. Plateforme de dons transparente et sécurisée.',
  keywords: ['église', 'dons', 'communauté', 'Maroc', 'fundraising'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <ThemeProvider>
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
