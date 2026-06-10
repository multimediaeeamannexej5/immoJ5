'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/* ── Utilitaire mois ──────────────────────────────────────────────── */
function monthYear(offsetMonths = 0): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offsetMonths)
  return d.toISOString().slice(0, 7)           // "2025-06"
}

function frenchMonth(offsetMonths = 0): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offsetMonths)
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

/* ── 1. Créer l'engagement + premier paiement ─────────────────────── */
export async function createCommitmentAndFirstPayment(data: {
  packId:      string
  method:      string
  proofUrl:    string | null
  notes:       string
  monthsCount: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { packId, method, proofUrl, notes, monthsCount } = data

  // Récupérer le pack
  const { data: pack } = await supabase
    .from('donation_packs')
    .select('id, monthly_amount')
    .eq('id', packId)
    .single()
  if (!pack) return { error: 'Pack introuvable' }

  // Insérer l'engagement
  const { error: commitErr } = await supabase
    .from('donor_commitments')
    .insert({ user_id: user.id, pack_id: packId, status: 'active' })
  if (commitErr) return { error: commitErr.message }

  // Libellé mois pour les avances
  const monthLabels = Array.from({ length: monthsCount }, (_, i) => frenchMonth(i)).join(', ')
  const fullNotes = monthsCount > 1
    ? `Avance ${monthsCount} mois (${monthLabels})${notes ? ' — ' + notes : ''}`
    : notes || null

  // Insérer le 1er paiement
  const { error: donErr } = await supabase
    .from('donations')
    .insert({
      user_id:        user.id,
      pack_id:        packId,
      amount:         Number(pack.monthly_amount) * monthsCount,
      type:           'monthly',
      payment_method: method,
      status:         'pending',
      proof_url:      proofUrl,
      notes:          fullNotes,
      month_year:     monthYear(),
    })
  if (donErr) return { error: donErr.message }

  revalidatePath('/donate')
  revalidatePath('/dashboard')
  return { success: true }
}

/* ── 2. Paiement mensuel (engagement existant) ────────────────────── */
export async function submitMonthlyPayment(data: {
  commitmentPackId: string
  monthlyAmount:    number
  method:           string
  proofUrl:         string | null
  notes:            string
  monthsCount:      number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { commitmentPackId, monthlyAmount, method, proofUrl, notes, monthsCount } = data

  const monthLabels = Array.from({ length: monthsCount }, (_, i) => frenchMonth(i)).join(', ')
  const fullNotes = monthsCount > 1
    ? `Avance ${monthsCount} mois (${monthLabels})${notes ? ' — ' + notes : ''}`
    : notes || null

  const { error } = await supabase
    .from('donations')
    .insert({
      user_id:        user.id,
      pack_id:        commitmentPackId,
      amount:         monthlyAmount * monthsCount,
      type:           'monthly',
      payment_method: method,
      status:         'pending',
      proof_url:      proofUrl,
      notes:          fullNotes,
      month_year:     monthYear(),
    })

  if (error) return { error: error.message }

  revalidatePath('/donate')
  revalidatePath('/dashboard')
  return { success: true }
}

/* ── 3. Demande de changement de pack ─────────────────────────────── */
export async function requestPackChange(data: {
  newPackId: string
  note:      string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('donor_commitments')
    .update({
      status:               'change_requested',
      requested_pack_id:    data.newPackId,
      change_note:          data.note || null,
      change_requested_at:  new Date().toISOString(),
      updated_at:           new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
