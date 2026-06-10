import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = { title: 'Admin — Church Project' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: admin } = await supabase
    .from('admin_users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!admin) redirect('/')

  return (
    <div className="min-h-screen bg-[#0A0B10]">
      <AdminSidebar
        role={admin.role}
        fullName={admin.full_name}
        email={user.email!}
      />
      {/* Main content — offset for sidebar */}
      <div className="lg:pl-60 pt-14 lg:pt-0">
        <main className="min-h-screen p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
