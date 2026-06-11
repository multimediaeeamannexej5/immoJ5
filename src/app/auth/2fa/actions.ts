'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { send2FACodeEmail } from '@/lib/email'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ─── Masquer un email (ex: j***e@gmail.com) ───────────────────────────────────
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (local.length <= 2) return `***@${domain}`
  return `${local[0]}${'*'.repeat(Math.max(local.length - 2, 1))}${local.slice(-1)}@${domain}`
}

// ─── Initier la 2FA : générer + envoyer le code ───────────────────────────────
export async function initiate2FA(): Promise<{
  success:      boolean
  maskedEmail?: string
  error?:       string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return { success: false, error: 'Non authentifié' }

    const adminClient = createAdminClient()
    const code      = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Supprimer les anciens codes de cet utilisateur
    await adminClient.from('two_factor_codes').delete().eq('user_id', user.id)

    // Insérer le nouveau code
    const { error: insertErr } = await adminClient.from('two_factor_codes').insert({
      user_id:    user.id,
      code,
      expires_at: expiresAt,
    })
    if (insertErr) throw insertErr

    // Récupérer le nom complet (profil donateur ou admin)
    let fullName = 'Utilisateur'
    const { data: profile } = await supabase
      .from('profiles').select('full_name').eq('id', user.id).single()
    if (profile?.full_name) {
      fullName = profile.full_name
    } else {
      const { data: adminUser } = await adminClient
        .from('admin_users').select('full_name').eq('id', user.id).single()
      if (adminUser?.full_name) fullName = adminUser.full_name
    }

    // Envoyer le code par email
    try {
      await send2FACodeEmail({ toEmail: user.email, fullName, code })
    } catch (emailErr) {
      if (process.env.NODE_ENV === 'development') {
        // En dev, affiche le code dans la console si le SMTP est inaccessible
        console.warn(`[2FA DEV] Code pour ${user.email} : \x1b[1;33m${code}\x1b[0m`)
      } else {
        throw emailErr
      }
    }

    return { success: true, maskedEmail: maskEmail(user.email) }
  } catch (err) {
    console.error('[initiate2FA]', err)
    return { success: false, error: "Erreur lors de l'envoi du code de vérification." }
  }
}

// ─── Vérifier le code saisi par l'utilisateur ─────────────────────────────────
export async function verify2FACode(code: string): Promise<{
  success:     boolean
  redirectTo?: string
  error?:      string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié' }

    const adminClient = createAdminClient()
    const now = new Date().toISOString()

    // Chercher un code valide (non utilisé, non expiré)
    const { data: record } = await adminClient
      .from('two_factor_codes')
      .select('id')
      .eq('user_id', user.id)
      .eq('code',    code.trim())
      .eq('used',    false)
      .gte('expires_at', now)
      .single()

    if (!record) return { success: false, error: 'Code incorrect ou expiré.' }

    // Marquer le code comme utilisé
    await adminClient
      .from('two_factor_codes')
      .update({ used: true })
      .eq('id', record.id)

    // Poser le cookie tfa_v=1
    const cookieStore = await cookies()
    cookieStore.set('tfa_v', '1', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   24 * 60 * 60, // 24 h
      path:     '/',
    })

    // Déterminer la destination (admin ou dashboard)
    const { data: adminData } = await supabase
      .from('admin_users').select('role').eq('id', user.id).single()
    const redirectTo = adminData ? '/admin' : '/dashboard'

    return { success: true, redirectTo }
  } catch (err) {
    console.error('[verify2FACode]', err)
    return { success: false, error: 'Erreur de vérification.' }
  }
}

// ─── Renvoyer un nouveau code ─────────────────────────────────────────────────
export async function resend2FACode(): Promise<{
  success:      boolean
  maskedEmail?: string
  error?:       string
}> {
  return initiate2FA()
}
