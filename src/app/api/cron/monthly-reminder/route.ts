import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMonthlyReminderEmail } from '@/lib/email'

/**
 * GET /api/cron/monthly-reminder
 * Protégé par Authorization: Bearer <CRON_SECRET>
 * Envoie un rappel aux donateurs avec engagement actif qui n'ont pas
 * encore payé le mois courant.
 */
export async function GET(req: NextRequest) {
  const auth   = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase       = createAdminClient()
  const currentMonthYear = new Date().toISOString().slice(0, 7)   // "2025-06"

  // Tous les engagements actifs avec profil
  const { data: commitments, error } = await supabase
    .from('donor_commitments')
    .select('user_id, donation_packs(name, monthly_amount), profiles(full_name)')
    .eq('status', 'active')

  if (error) {
    console.error('Cron monthly-reminder:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Donations du mois courant (pending ou validées)
  const { data: paidThisMonth } = await supabase
    .from('donations')
    .select('user_id')
    .eq('type', 'monthly')
    .eq('month_year', currentMonthYear)
    .in('status', ['pending', 'validated'])

  const paidUserIds = new Set((paidThisMonth ?? []).map(d => d.user_id))

  let sent = 0
  let errors = 0

  for (const c of (commitments ?? [])) {
    if (paidUserIds.has(c.user_id)) continue   // déjà payé ce mois

    const { data: userData } = await supabase.auth.admin.getUserById(c.user_id)
    if (!userData?.user?.email) continue

    const profile  = (c as any).profiles  as { full_name: string | null } | null
    const pack     = (c as any).donation_packs as { name: string; monthly_amount: number } | null

    try {
      await sendMonthlyReminderEmail({
        toEmail:            userData.user.email,
        donorName:          profile?.full_name ?? 'Donateur',
        hasPendingDonation: false,
      })
      sent++
    } catch (e) {
      console.error(`Rappel échoué pour ${userData.user.email}:`, e)
      errors++
    }
  }

  return NextResponse.json({
    ok:     true,
    month:  new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    total_commitments: (commitments ?? []).length,
    already_paid:      paidUserIds.size,
    sent,
    errors,
  })
}
