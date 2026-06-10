'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaymentConfirmationEmail } from '@/lib/email'

// ─── Guard : vérifie que l'utilisateur est admin ou trésorier ─────────────
async function requireAdmin(requiredRole?: 'super_admin') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: admin } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!admin) throw new Error('Accès refusé')
  if (requiredRole && admin.role !== requiredRole) throw new Error('Réservé au Super Admin')

  return { user, admin, supabase }
}

// ─── Valider un don ──────────────────────────────────────────────────────────
export async function validateDonation(donationId: string, adminNotes?: string) {
  const { user, supabase } = await requireAdmin()

  // Récupérer les infos du don + donateur avant mise à jour
  const { data: donation } = await supabase
    .from('donations')
    .select('amount, user_id, profiles(full_name, email:id)')
    .eq('id', donationId)
    .single()

  const { error } = await supabase.from('donations').update({
    status:       'validated',
    validated_by: user.id,
    validated_at: new Date().toISOString(),
    admin_notes:  adminNotes ?? null,
    updated_at:   new Date().toISOString(),
  }).eq('id', donationId)

  if (error) throw error

  // Envoyer l'email de confirmation (non bloquant)
  if (donation?.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', donation.user_id)
      .single()
    // Récupérer l'email via la table auth (service role requis)
    try {
      const adminClient = createAdminClient()
      const { data: userData } = await adminClient.auth.admin.getUserById(donation.user_id)
      if (userData?.user?.email) {
        sendPaymentConfirmationEmail({
          toEmail:    userData.user.email,
          donorName:  profile?.full_name ?? 'Donateur',
          amount:     Number(donation.amount),
          donationId,
        }).catch(console.error) // fire and forget
      }
    } catch { /* email non critique */ }
  }

  revalidatePath('/admin/donations')
  revalidatePath('/admin/users')
  revalidatePath('/treasurer')
  revalidatePath('/treasurer/donors')
  revalidatePath('/')
}

// ─── Rejeter un don ──────────────────────────────────────────────────────────
export async function rejectDonation(donationId: string, adminNotes: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('donations').update({
    status:      'rejected',
    admin_notes: adminNotes,
    updated_at:  new Date().toISOString(),
  }).eq('id', donationId)

  if (error) throw error
  revalidatePath('/admin/donations')
  revalidatePath('/admin/users')
  revalidatePath('/treasurer')
  revalidatePath('/treasurer/donors')
  revalidatePath('/')
}

// ─── Marquer un don comme "en retard" ────────────────────────────────────────
export async function markDonationOverdue(donationId: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('donations').update({
    status:     'overdue',
    updated_at: new Date().toISOString(),
  }).eq('id', donationId)

  if (error) throw error
  revalidatePath('/admin/donations')
  revalidatePath('/admin/users')
  revalidatePath('/treasurer')
  revalidatePath('/treasurer/donors')
}

// ─── Créer un compte admin (super admin uniquement) ──────────────────────────
export async function createAdminAccount(data: {
  email:    string
  fullName: string
  role:     'finance_manager' | 'communication_manager' | 'treasurer'
  password: string
}) {
  await requireAdmin('super_admin')
  const adminClient = createAdminClient()

  // Vérifier que l'email n'appartient pas déjà à un donateur
  const { data: isDonor } = await (await createClient())
    .rpc('email_is_donor', { p_email: data.email })
  if (isDonor) throw new Error('Cet email appartient déjà à un compte donateur.')

  // Créer l'utilisateur Supabase Auth
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email:         data.email,
    password:      data.password,
    email_confirm: true,
    user_metadata: { full_name: data.fullName },
  })
  if (createError || !newUser.user) throw createError ?? new Error('Échec création utilisateur')

  // Insérer dans admin_users
  const { error: adminError } = await adminClient
    .from('admin_users')
    .insert({ id: newUser.user.id, role: data.role, full_name: data.fullName })

  if (adminError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    throw adminError
  }

  revalidatePath('/admin/admins')
}

// ─── Modifier le rôle d'un admin ─────────────────────────────────────────────
export async function updateAdminRole(
  adminId: string,
  role: 'finance_manager' | 'communication_manager' | 'treasurer'
) {
  const { supabase } = await requireAdmin('super_admin')
  const { error } = await supabase.from('admin_users').update({ role }).eq('id', adminId)
  if (error) throw error
  revalidatePath('/admin/admins')
}

// ─── Réinitialiser mot de passe admin ────────────────────────────────────────
export async function resetAdminPassword(adminId: string, newPassword: string) {
  await requireAdmin('super_admin')
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(adminId, { password: newPassword })
  if (error) throw error
}

// ─── Supprimer un compte admin ────────────────────────────────────────────────
export async function deleteAdminAccount(adminId: string) {
  const { user } = await requireAdmin('super_admin')
  if (adminId === user.id) throw new Error('Impossible de supprimer votre propre compte.')

  const adminClient = createAdminClient()
  await adminClient.from('admin_users').delete().eq('id', adminId)
  const { error } = await adminClient.auth.admin.deleteUser(adminId)
  if (error) throw error

  revalidatePath('/admin/admins')
}

// ─── Mise à jour manuelle de la progression ───────────────────────────────────
export async function manualProgressUpdate(amount: number, note: string) {
  const { user, supabase } = await requireAdmin()

  const { data: progress, error: fetchErr } = await supabase
    .from('project_progress').select('id, total_collected').limit(1).single()
  if (fetchErr || !progress) throw new Error('Ligne project_progress introuvable')

  const newTotal = Math.max(0, Number(progress.total_collected) + amount)

  const { error } = await supabase.from('project_progress').update({
    total_collected: newTotal,
    updated_at:      new Date().toISOString(),
    updated_by:      user.id,
  }).eq('id', progress.id)
  if (error) throw error

  // Log
  await supabase.from('manual_progress_logs').insert({
    admin_id: user.id,
    amount,
    note: note || null,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/progress')
  revalidatePath('/treasurer')
  revalidatePath('/treasurer/progress')
  revalidatePath('/')
}
