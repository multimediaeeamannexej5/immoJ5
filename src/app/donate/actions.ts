'use server'

import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath }    from 'next/cache'

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

/* ── Upload reçu (service_role — contourne les RLS storage) ─────── */
async function uploadProof(file: File, prefix: string): Promise<string> {
  const adminClient = createAdminClient()
  const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${prefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { data, error } = await adminClient.storage
    .from('donation-proofs')
    .upload(path, buffer, {
      contentType:  file.type || 'image/jpeg',
      cacheControl: '3600',
      upsert:       false,
    })

  if (error) throw new Error(`Échec de l'envoi du reçu : ${error.message}`)

  const { data: { publicUrl } } = adminClient.storage
    .from('donation-proofs')
    .getPublicUrl(data.path)

  return publicUrl
}

/* ── 1. Créer l'engagement + premier paiement ─────────────────────── */
export async function createCommitmentAndFirstPayment(formData: FormData): Promise<{
  success?: boolean
  error?:   string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const packId      = (formData.get('packId')      as string) || ''
    const method      = (formData.get('method')      as string) || ''
    const notes       = (formData.get('notes')       as string) || ''
    const monthsCount = Number(formData.get('monthsCount') || 1)
    const proofFile   = formData.get('proof') as File | null

    if (!packId)                              return { error: 'Pack introuvable.' }
    if (!method)                              return { error: 'Mode de paiement requis.' }
    if (!proofFile || proofFile.size === 0)   return { error: 'Veuillez joindre le reçu de paiement.' }
    if (proofFile.size > 5 * 1024 * 1024)    return { error: 'Fichier trop grand (max 5 Mo).' }

    // Upload du reçu via service_role
    const proofUrl = await uploadProof(proofFile, `users/${user.id}`)

    // Récupérer le pack
    const { data: pack } = await supabase
      .from('donation_packs')
      .select('id, monthly_amount')
      .eq('id', packId)
      .single()
    if (!pack) return { error: 'Pack introuvable.' }

    // Insérer l'engagement
    const adminClient = createAdminClient()
    const { error: commitErr } = await adminClient
      .from('donor_commitments')
      .insert({ user_id: user.id, pack_id: packId, status: 'active' })
    if (commitErr) return { error: commitErr.message }

    // Libellé mois
    const monthLabels = Array.from({ length: monthsCount }, (_, i) => frenchMonth(i)).join(', ')
    const fullNotes   = monthsCount > 1
      ? `Avance ${monthsCount} mois (${monthLabels})${notes ? ' — ' + notes : ''}`
      : notes || null

    // Insérer le 1er paiement
    const { error: donErr } = await adminClient
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
  } catch (err) {
    console.error('[createCommitmentAndFirstPayment]', err)
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

/* ── 2. Paiement mensuel (engagement existant) ────────────────────── */
export async function submitMonthlyPayment(formData: FormData): Promise<{
  success?: boolean
  error?:   string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const commitmentPackId = (formData.get('commitmentPackId') as string) || ''
    const monthlyAmount    = Number(formData.get('monthlyAmount') || 0)
    const method           = (formData.get('method')            as string) || ''
    const notes            = (formData.get('notes')             as string) || ''
    const monthsCount      = Number(formData.get('monthsCount') || 1)
    const proofFile        = formData.get('proof') as File | null

    if (!method)                             return { error: 'Mode de paiement requis.' }
    if (!proofFile || proofFile.size === 0)  return { error: 'Veuillez joindre le reçu de paiement.' }
    if (proofFile.size > 5 * 1024 * 1024)   return { error: 'Fichier trop grand (max 5 Mo).' }

    // Upload du reçu via service_role
    const proofUrl = await uploadProof(proofFile, `users/${user.id}`)

    const monthLabels = Array.from({ length: monthsCount }, (_, i) => frenchMonth(i)).join(', ')
    const fullNotes   = monthsCount > 1
      ? `Avance ${monthsCount} mois (${monthLabels})${notes ? ' — ' + notes : ''}`
      : notes || null

    const adminClient = createAdminClient()
    const { error } = await adminClient
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
  } catch (err) {
    console.error('[submitMonthlyPayment]', err)
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
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
