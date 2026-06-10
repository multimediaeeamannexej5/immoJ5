'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié', supabase: null, user: null }
  const { data } = await supabase.from('admin_users').select('id').eq('id', user.id).single()
  if (!data) return { error: 'Accès refusé', supabase: null, user: null }
  return { error: null, supabase, user }
}

export async function approvePackChange(commitmentId: string) {
  const { error: authErr, supabase, user } = await assertAdmin()
  if (authErr || !supabase || !user) return { error: authErr }

  // Récupérer l'engagement
  const { data: c } = await supabase
    .from('donor_commitments')
    .select('requested_pack_id')
    .eq('id', commitmentId)
    .single()

  if (!c?.requested_pack_id) return { error: 'Aucune demande de changement trouvée' }

  const { error } = await supabase
    .from('donor_commitments')
    .update({
      pack_id:           c.requested_pack_id,
      status:            'active',
      requested_pack_id: null,
      change_note:       null,
      approved_by:       user.id,
      approved_at:       new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    })
    .eq('id', commitmentId)

  if (error) return { error: error.message }
  revalidatePath('/admin/commitments')
  return { success: true }
}

export async function rejectPackChange(commitmentId: string) {
  const { error: authErr, supabase } = await assertAdmin()
  if (authErr || !supabase) return { error: authErr }

  const { error } = await supabase
    .from('donor_commitments')
    .update({
      status:              'active',
      requested_pack_id:   null,
      change_note:         null,
      change_requested_at: null,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', commitmentId)

  if (error) return { error: error.message }
  revalidatePath('/admin/commitments')
  return { success: true }
}
