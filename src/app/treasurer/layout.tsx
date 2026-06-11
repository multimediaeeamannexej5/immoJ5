import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Trésorier — Church Project' }

export default async function TreasurerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: admin } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Le trésorier utilise désormais l'interface admin complète
  if (admin?.role === 'treasurer') redirect('/admin')

  redirect('/')
}
