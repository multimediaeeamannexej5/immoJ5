'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function submitAnonymousDonation(formData: FormData): Promise<{
  success?: boolean
  error?:   string
}> {
  try {
    const amount    = Number(formData.get('amount'))
    const method    = (formData.get('method')    as string) || ''
    const proof     = formData.get('proof')  as File | null
    const firstName = (formData.get('firstName') as string).trim() || null
    const lastName  = (formData.get('lastName')  as string).trim() || null
    const contact   = (formData.get('contact')   as string).trim() || null

    if (!amount || amount <= 0)         return { error: 'Montant invalide.' }
    if (!method)                        return { error: 'Mode de paiement requis.' }
    if (!proof || proof.size === 0)     return { error: 'Reçu de paiement requis.' }
    if (proof.size > 5 * 1024 * 1024)  return { error: 'Fichier trop grand (max 5 Mo).' }

    const adminClient = createAdminClient()

    // ── Upload du reçu (service_role bypasse les RLS storage) ──────────────
    const ext  = proof.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `anonymous/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const buffer = Buffer.from(await proof.arrayBuffer())

    const { data: uploadData, error: uploadErr } = await adminClient.storage
      .from('donation-proofs')
      .upload(path, buffer, {
        contentType:  proof.type || 'image/jpeg',
        cacheControl: '3600',
        upsert:       false,
      })

    if (uploadErr) return { error: `Échec de l'envoi du reçu : ${uploadErr.message}` }

    const { data: { publicUrl } } = adminClient.storage
      .from('donation-proofs')
      .getPublicUrl(uploadData.path)

    // ── Enregistrement en base ──────────────────────────────────────────────
    const { error: insertErr } = await adminClient
      .from('anonymous_donations')
      .insert({
        amount,
        payment_method:  method,
        proof_url:       publicUrl,
        donor_firstname: firstName,
        donor_name:      lastName,
        donor_contact:   contact,
      })

    if (insertErr) return { error: insertErr.message }

    return { success: true }
  } catch (err) {
    console.error('[submitAnonymousDonation]', err)
    return { error: 'Une erreur est survenue. Veuillez réessayer.' }
  }
}
