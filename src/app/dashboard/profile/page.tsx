import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProfileForm from './ProfileForm'
import { ArrowLeft } from 'lucide-react'

export const revalidate = 0

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <main className="bg-[var(--bg-base)] min-h-screen">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* En-tête */}
        <div className="mb-8">
          <Link href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[var(--tx-4)] text-sm hover:text-[var(--tx-1)] transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-[var(--tx-1)]">Mon profil</h1>
          <p className="text-[var(--tx-3)] text-sm mt-1">
            Complétez vos informations pour que l&apos;équipe puisse vous identifier.
          </p>
        </div>

        <ProfileForm profile={profile as any} email={user.email ?? ''} />
      </div>

      <Footer />
    </main>
  )
}
