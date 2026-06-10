'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: {
  fullName:    string
  phone:       string
  city:        string
  country:     string
  affiliation: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name:   data.fullName.trim()    || null,
      phone:       data.phone.trim()       || null,
      city:        data.city.trim()        || null,
      country:     data.country.trim()     || 'MA',
      affiliation: data.affiliation        || null,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
  return { success: true }
}

export async function updatePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}
