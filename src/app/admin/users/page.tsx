import { createClient } from '@/lib/supabase/server'
import UsersClient from './UsersClient'
import type { UserRow } from './UsersClient'

export const revalidate = 0

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Exclure les comptes admin de la liste des donateurs
  const { data: adminUsers } = await supabase
    .from('admin_users')
    .select('id')
  const adminIds = (adminUsers ?? []).map((a: { id: string }) => a.id)

  let profilesQuery = supabase
    .from('profiles')
    .select(`
      *,
      donations(id, amount, status, payment_method, created_at, notes, proof_url),
      donor_commitments(
        status,
        donation_packs!donor_commitments_pack_id_fkey(name, total_cost, monthly_amount)
      )
    `)
    .order('created_at', { ascending: false })

  if (adminIds.length > 0) {
    profilesQuery = profilesQuery.not('id', 'in', `(${adminIds.join(',')})`)
  }

  const { data: profiles } = await profilesQuery

  // Début du mois courant pour savoir si le donateur a payé ce mois-ci
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const rows: UserRow[] = (profiles ?? []).map(p => {
    const rawDons = p.donations
    const allDons: Array<{ id: string; status: string; amount: number; payment_method: string; created_at: string; notes: string | null; proof_url: string | null }> =
      Array.isArray(rawDons) ? rawDons : rawDons != null ? [rawDons] : []

    const validated      = allDons.filter(d => d.status === 'validated')
    const pending        = allDons.filter(d => d.status === 'pending')
    const rejected       = allDons.filter(d => d.status === 'rejected')
    const totalValidated = validated.reduce((s, d) => s + Number(d.amount), 0)

    // Indicateurs de paiement pour Finance Manager
    const hasOverdue    = allDons.some(d => d.status === 'overdue')
    const paidThisMonth = allDons.some(
      d => d.status === 'validated' && d.created_at >= currentMonthStart
    )

    // Normalise donor_commitments: PostgREST peut retourner un objet ou un tableau
    const raw = p.donor_commitments
    const commitments: Array<{ status: string; donation_packs?: { name: string; total_cost: number; monthly_amount: number } | null }> =
      Array.isArray(raw) ? raw : raw != null ? [raw] : []

    const activeCommitment = commitments.find((c) => c.status !== 'inactive') ?? null
    const pack      = activeCommitment?.donation_packs ?? null
    const packName  = pack?.name       ?? null
    const packTotal = pack?.total_cost ?? null
    const progressPct = packTotal
      ? Math.min(100, Math.round(totalValidated / packTotal * 100))
      : null

    return {
      id:             p.id,
      full_name:      p.full_name,
      phone:          p.phone,
      city:           p.city,
      country:        p.country,
      affiliation:    p.affiliation,
      is_public:      p.is_public,
      created_at:     p.created_at,
      totalValidated,
      validatedCount: validated.length,
      pendingCount:   pending.length,
      rejectedCount:  rejected.length,
      packName,
      packTotal,
      progressPct,
      donationsList:  allDons,
      hasOverdue,
      paidThisMonth,
    }
  })

  return <UsersClient rows={rows} />
}
