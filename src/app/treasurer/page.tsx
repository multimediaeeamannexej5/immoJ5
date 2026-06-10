import { createClient } from '@/lib/supabase/server'
import DonationsClient from '@/components/admin/DonationsClient'
import type { DonationRow } from '@/components/admin/DonationsClient'

export const revalidate = 0

export default async function TreasurerPage() {
  const supabase = await createClient()

  /* ── Current month bounds ────────────────────────────────────── */
  const now          = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthLabel   = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .replace(/^./, c => c.toUpperCase())

  /* ── Query ───────────────────────────────────────────────────── */
  const { data: donations } = await supabase
    .from('donations')
    .select('id, amount, type, payment_method, status, proof_url, notes, admin_notes, created_at, profiles(full_name, is_public), donation_packs(name)')
    .gte('created_at', startOfMonth)
    .order('created_at', { ascending: false })

  return (
    <DonationsClient
      donations={(donations ?? []) as unknown as DonationRow[]}
      canValidate={true}
      monthLabel={monthLabel}
    />
  )
}
