'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email'

export async function registerMember(data: {
  email:       string
  password:    string
  fullName:    string
  phone:       string
  affiliation: string
}) {
  const admin = createAdminClient()

  // Vérifier que l'email n'est pas réservé à un admin
  const { data: isAdmin } = await admin.rpc('email_is_admin', { p_email: data.email })
  if (isAdmin) return { error: 'Cet email est réservé à un compte administrateur.' }

  // Créer le compte avec email auto-confirmé
  // → plus de dépendance au service email interne de Supabase
  const { data: created, error } = await admin.auth.admin.createUser({
    email:         data.email,
    password:      data.password,
    email_confirm: true,
    user_metadata: {
      full_name:   data.fullName,
      phone:       data.phone        || null,
      affiliation: data.affiliation  || null,
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate')) {
      return { error: 'Un compte existe déjà avec cet email. Connectez-vous.' }
    }
    return { error: error.message }
  }

  // Email de bienvenue via Gmail (non bloquant — n'empêche pas la création du compte)
  try {
    await sendWelcomeEmail({ toEmail: data.email, fullName: data.fullName })
  } catch (e) {
    console.error('[register] welcome email failed:', e)
  }

  return { success: true, userId: created.user?.id }
}
