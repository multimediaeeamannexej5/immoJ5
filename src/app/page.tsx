import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/home/HeroSection'
import ProgressSection from '@/components/home/ProgressSection'
import PacksSection from '@/components/home/PacksSection'
import QuickDonateSection from '@/components/home/QuickDonateSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import RecentDonationsSection from '@/components/home/RecentDonationsSection'

export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eeam-annexej5.ma'

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
  openGraph: {
    url:         SITE_URL,
    title:       'EEAM Annexe J5 — Projet Immobilier',
    description:
      "Contribuez à la construction du lieu de culte de l'EEAM Annexe J5 au Maroc. Rejoignez des centaines de donateurs unis dans un même projet de foi.",
    images: [
      { url: '/images/J5.png',        width: 1200, height: 630, alt: 'EEAM Annexe J5 — Projet Immobilier' },
      { url: '/images/paroisse1.png', width: 800,  height: 600, alt: 'EEAM Annexe J5 — Communauté' },
    ],
  },
}

export default async function HomePage() {
  const supabase = await createClient()

  const [progressRes, packsRes, testimonialsRes, donationsRes] = await Promise.all([
    supabase.from('project_progress').select('*').limit(1).single(),
    supabase.from('donation_packs').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('testimonials').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(6),
    supabase
      .from('donations')
      .select('*, profiles(full_name, avatar_url, is_public), donation_packs(name)')
      .eq('status', 'validated')
      .order('validated_at', { ascending: false })
      .limit(10),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'ReligiousOrganization',
    name:        'EEAM Annexe J5',
    alternateName: 'Église Évangélique au Maroc — Annexe J5',
    url:         SITE_URL,
    logo:        `${SITE_URL}/images/logo_eeam.jpg`,
    image:       `${SITE_URL}/images/J5.png`,
    description: "Communauté chrétienne engagée dans un projet immobilier historique : l'acquisition d'un lieu de culte permanent au Maroc.",
    address: {
      '@type':           'PostalAddress',
      addressCountry:    'MA',
      addressLocality:   'Rabat',
    },
    sameAs: [],
    foundingDate: undefined,
    numberOfEmployees: undefined,
    potentialAction: {
      '@type':  'DonateAction',
      target:   `${SITE_URL}/donate`,
      name:     'Faire un don au Projet Immobilier EEAM Annexe J5',
    },
  }

  return (
    <main className="bg-[#0A0B10] min-h-screen">
      {/* JSON-LD — données structurées pour Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <HeroSection progress={progressRes.data} />
      <ProgressSection progress={progressRes.data} />
      <PacksSection packs={packsRes.data ?? []} />
      <QuickDonateSection />
      <RecentDonationsSection donations={donationsRes.data ?? []} />
      <TestimonialsSection testimonials={testimonialsRes.data ?? []} />
      <Footer />
    </main>
  )
}
