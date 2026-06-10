'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** Crée l'engagement sans paiement initial (le don mensuel se fait depuis le dashboard) */
export async function createCommitment(packId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('donor_commitments')
    .insert({ user_id: user.id, pack_id: packId, status: 'active' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}
