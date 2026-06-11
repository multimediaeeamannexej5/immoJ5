import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import CookieBanner from '@/components/CookieBanner'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eeam-annexej5.ma'
const SITE_NAME = 'EEAM Annexe J5'
const DEFAULT_TITLE = 'EEAM Annexe J5 — Projet Immobilier'
const DEFAULT_DESC =
  "Rejoignez la communauté de l'Église Évangélique au Maroc — Annexe J5 et contribuez au projet de construction de notre lieu de culte. Plateforme de dons transparente et sécurisée."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:  DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },

  description: DEFAULT_DESC,

  keywords: [
    'EEAM', 'Annexe J5', 'Église Évangélique au Maroc', 'Rabat', 'Maroc',
    'projet immobilier', 'dons église', 'communauté chrétienne',
    'fundraising Maroc', 'lieu de culte', 'collecte de fonds', 'don en ligne',
  ],

  authors:   [{ name: SITE_NAME, url: SITE_URL }],
  creator:   SITE_NAME,
  publisher: SITE_NAME,

  // ── Indexation ─────────────────────────────────────────────────────────────
  robots: {
    index:     true,
    follow:    true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  // ── Open Graph ─────────────────────────────────────────────────────────────
  openGraph: {
    type:        'website',
    locale:      'fr_FR',
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       DEFAULT_TITLE,
    description: DEFAULT_DESC,
    images: [
      {
        url:    '/images/J5.png',
        width:  1200,
        height: 630,
        alt:    'EEAM Annexe J5 — Projet Immobilier',
      },
      {
        url:    '/images/logo_eeam.jpg',
        width:  400,
        height: 400,
        alt:    'Logo EEAM Annexe J5',
      },
    ],
  },

  // ── Twitter / X ────────────────────────────────────────────────────────────
  twitter: {
    card:        'summary_large_image',
    title:       DEFAULT_TITLE,
    description: DEFAULT_DESC,
    images:      ['/images/J5.png'],
  },

  // ── Icônes ─────────────────────────────────────────────────────────────────
  icons: {
    icon:       [{ url: '/icon.jpg', type: 'image/jpeg' }],
    apple:      [{ url: '/apple-icon.jpg', type: 'image/jpeg' }],
    shortcut:   '/icon.jpg',
  },

  // ── Vérification Search Console (à remplir si nécessaire) ─────────────────
  // verification: { google: 'VOTRE_CODE_GOOGLE_SEARCH_CONSOLE' },

  // ── Divers ─────────────────────────────────────────────────────────────────
  alternates: { canonical: SITE_URL },
  category: 'religion',
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
