'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Heart, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const redirectTo  = searchParams.get('redirectTo') ?? '/dashboard'
  const supabase    = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    // Admin ou donateur ?
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (adminData) {
      router.push('/admin')
    } else {
      // Respecter le redirectTo (ex: /donate?pack=xxx)
      router.push(redirectTo.startsWith('/') ? redirectTo : '/dashboard')
    }
    router.refresh()
  }

  return (
    <div>
      {/* Pack sélectionné en cours */}
      {redirectTo.includes('/donate') && (
        <div className="mb-6 p-3 rounded-xl bg-accent/10 border border-accent/25 flex items-center gap-3">
          <Heart className="w-4 h-4 text-accent fill-current flex-shrink-0" />
          <p className="text-accent text-sm">
            Connectez-vous pour finaliser votre don.
          </p>
        </div>
      )}

      <h1 className="text-2xl font-bold text-white mb-1">Bon retour 👋</h1>
      <p className="text-gray-400 text-sm mb-8">
        Pas encore de compte ?{' '}
        <Link
          href={`/auth/register${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
          className="text-accent hover:underline font-medium"
        >
          S&apos;inscrire
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Adresse email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.com"
            className="w-full px-4 py-3 bg-[#0A0B10] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">Mot de passe</label>
          </div>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#0A0B10] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/15 flex items-center justify-center gap-2"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <ArrowRight className="w-4 h-4" />
          }
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      {/* Séparateur */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[#252637]" />
        <span className="text-gray-600 text-xs">ou</span>
        <div className="flex-1 h-px bg-[#252637]" />
      </div>

      <Link
        href={`/auth/register${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#252637] text-gray-300 text-sm font-medium hover:border-accent/40 hover:text-white transition-all"
      >
        <Heart className="w-4 h-4 text-accent" />
        Créer un compte donateur
      </Link>
    </div>
  )
}
