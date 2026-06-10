import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FirstTimeDonor from './FirstTimeDonor'
import MonthlyPayment from './MonthlyPayment'

export default async function DonatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Packs actifs
  const { data: packs } = await supabase
    .from('donation_packs')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  // Engagement existant
  const { data: commitment } = await supabase
    .from('donor_commitments')
    .select('*, donation_packs!donor_commitments_pack_id_fkey(id, name, total_cost, monthly_amount, description)')
    .eq('user_id', user.id)
    .neq('status', 'inactive')
    .maybeSingle()

  // Total des dons validés (mensuels)
  const { data: validated } = await supabase
    .from('donations')
    .select('amount')
    .eq('user_id', user.id)
    .eq('type', 'monthly')
    .eq('status', 'validated')

  const totalValidated = (validated ?? []).reduce((sum, d) => sum + Number(d.amount), 0)

  // Payé ce mois ?
  const currentMonthYear = new Date().toISOString().slice(0, 7)
  const { data: thisMonth } = await supabase
    .from('donations')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'monthly')
    .eq('month_year', currentMonthYear)
    .in('status', ['pending', 'validated'])

  const paidThisMonth = (thisMonth ?? []).length > 0

  return (
    <main className="bg-[var(--bg-base)] min-h-screen">
      <Navbar />

      {commitment ? (
        <MonthlyPayment
          commitment={commitment as any}
          totalValidated={totalValidated}
          paidThisMonth={paidThisMonth}
          packs={packs ?? []}
        />
      ) : (
        <FirstTimeDonor packs={packs ?? []} />
      )}

      <Footer />
    </main>
  )
}
