import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminManager from './AdminManager'

export const revalidate = 0

export default async function AdminsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Vérifier super_admin
  const { data: self } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!self || self.role !== 'super_admin') redirect('/admin')

  const { data: admins } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Gestion des Admins</h1>
        <p className="text-gray-400 text-sm mt-1">Super Admin uniquement</p>
      </div>
      <AdminManager admins={admins ?? []} currentUserId={user.id} />
    </div>
  )
}
