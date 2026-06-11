'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { initiate2FA } from '@/app/auth/2fa/actions'

export default function SuperAdminLoginPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) {
      setError('Identifiants incorrects.')
      setLoading(false)
      return
    }

    // Vérifier que c'est bien un super_admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (!adminData || adminData.role !== 'super_admin') {
      await supabase.auth.signOut()
      setError('Accès réservé au Super Admin.')
      setLoading(false)
      return
    }

    // Initier la double authentification
    const tfaResult = await initiate2FA()
    if (!tfaResult.success) {
      setError(tfaResult.error ?? "Erreur lors de l'envoi du code de vérification.")
      setLoading(false)
      return
    }

    const params = new URLSearchParams()
    if (tfaResult.maskedEmail) params.set('email', tfaResult.maskedEmail)
    router.push(`/auth/2fa?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-[#0A0B10] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(26,122,138,0.06),transparent)]" />

      <div className="relative w-full max-w-sm">
        <form onSubmit={handleSubmit}
          className="bg-[#14151E] border border-[#252637] rounded-2xl p-8">

          {/* Logo discret */}
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-accent text-lg">✦</span>
          </div>

          <h1 className="text-xl font-bold text-white text-center mb-6">Connexion</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 bg-[#0A0B10] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors text-sm"
            />
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full px-4 py-3 bg-[#0A0B10] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors text-sm pr-12"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Accéder
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
