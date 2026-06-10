import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DonorHub from './DonorHub'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, donationsRes, commitmentRes, packsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone, city, country, avatar_url, is_public, created_at, updated_at')
      .eq('id', user.id)
      .single(),

    supabase
      .from('donations')
      .select('*, donation_packs(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('donor_commitments')
      .select('*, donation_packs!donor_commitments_pack_id_fkey(id, name, total_cost, monthly_amount, description)')
      .eq('user_id', user.id)
      .neq('status', 'inactive')
      .maybeSingle(),

    supabase
      .from('donation_packs')
      .select('id, name, description, total_cost, monthly_amount')
      .eq('is_active', true)
      .order('monthly_amount', { ascending: true }),
  ])

  return (
    <main className="bg-[var(--bg-base)] min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <DonorHub
          profile={profileRes.data as any}
          email={user.email ?? ''}
          donations={(donationsRes.data ?? []) as any}
          commitment={commitmentRes.data as any}
          packs={(packsRes.data ?? []) as any}
        />
      </div>

      <Footer />
    </main>
  )
}
