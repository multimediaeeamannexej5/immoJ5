import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec service_role — côté serveur uniquement.
 * Bypass toutes les RLS, ne jamais exposer côté client.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey || serviceRoleKey === 'REMPLACE_PAR_TA_SERVICE_ROLE_KEY') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
