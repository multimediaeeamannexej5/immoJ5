import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/home/HeroSection'
import ProgressSection from '@/components/home/ProgressSection'
import PacksSection from '@/components/home/PacksSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import RecentDonationsSection from '@/components/home/RecentDonationsSection'

export const revalidate = 60

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

  return (
    <main className="bg-[#0A0B10] min-h-screen">
      <Navbar />
      <HeroSection progress={progressRes.data} />
      <ProgressSection progress={progressRes.data} />
      <PacksSection packs={packsRes.data ?? []} />
      <RecentDonationsSection donations={donationsRes.data ?? []} />
      <TestimonialsSection testimonials={testimonialsRes.data ?? []} />
      <Footer />
    </main>
  )
}
