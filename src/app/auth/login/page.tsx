'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Heart, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { initiate2FA } from '@/app/auth/2fa/actions'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? '/dashboard'
  const supabase     = createClient()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPwd,    setShowPwd]    = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  // Mot de passe oublié
  const [showReset,  setShowReset]  = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent,  setResetSent]  = useState(false)
  const [resetLoad,  setResetLoad]  = useState(false)
  const [resetError, setResetError] = useState('')

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

    // Initier la double authentification
    const tfaResult = await initiate2FA()
    if (!tfaResult.success) {
      setError(tfaResult.error ?? "Erreur lors de l'envoi du code de vérification.")
      setLoading(false)
      return
    }

    // Rediriger vers la page de vérification 2FA
    const params = new URLSearchParams()
    if (tfaResult.maskedEmail) params.set('email', tfaResult.maskedEmail)
    router.push(`/auth/2fa?${params.toString()}`)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setResetError('')
    setResetLoad(true)

    // Vérifier que ce n'est PAS un admin/trésorier
    const { data: isAdmin } = await supabase.rpc('email_is_admin', { p_email: resetEmail })
    if (isAdmin) {
      setResetError('La réinitialisation admin se fait via votre responsable.')
      setResetLoad(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      setResetError(error.message)
      setResetLoad(false)
      return
    }

    setResetSent(true)
    setResetLoad(false)
  }

  // ── Vue : Mot de passe oublié ────────────────────────────────────────────
  if (showReset) {
    if (resetSent) {
      return (
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-[var(--tx-1)] mb-2">Email envoyé !</h2>
          <p className="text-[var(--tx-3)] text-sm mb-2">
            Un lien de réinitialisation a été envoyé à{' '}
            <span className="text-[var(--tx-1)] font-medium">{resetEmail}</span>.
          </p>
          <p className="text-[var(--tx-4)] text-xs mb-6">
            Vérifiez vos spams si vous ne le recevez pas dans quelques minutes.
          </p>
          <button onClick={() => { setShowReset(false); setResetSent(false) }}
            className="text-accent text-sm hover:underline">
            ← Retour à la connexion
          </button>
        </div>
      )
    }

    return (
      <div>
        <button onClick={() => setShowReset(false)}
          className="text-[var(--tx-4)] hover:text-[var(--tx-2)] text-sm mb-6 flex items-center gap-1 transition-colors">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-[var(--tx-1)] mb-1">Mot de passe oublié</h1>
        <p className="text-[var(--tx-3)] text-sm mb-8">
          Entrez votre adresse email, nous vous enverrons un lien de réinitialisation.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          {resetError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{resetError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">Adresse email</label>
            <input
              type="email" required autoComplete="email"
              value={resetEmail} onChange={e => setResetEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm"
            />
          </div>
          <button type="submit" disabled={resetLoad}
            className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-all flex items-center justify-center gap-2">
            {resetLoad ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {resetLoad ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
      </div>
    )
  }

  // ── Vue : Connexion ──────────────────────────────────────────────────────
  return (
    <div>
      {redirectTo.includes('/donate') && (
        <div className="mb-6 p-3 rounded-xl bg-accent/10 border border-accent/25 flex items-center gap-3">
          <Heart className="w-4 h-4 text-accent fill-current flex-shrink-0" />
          <p className="text-accent text-sm">Connectez-vous pour finaliser votre don.</p>
        </div>
      )}

      <h1 className="text-2xl font-bold text-[var(--tx-1)] mb-1">Bon retour 👋</h1>
      <p className="text-[var(--tx-3)] text-sm mb-8">
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
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">Adresse email</label>
          <input
            type="email" required autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.com"
            className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-[var(--tx-2)]">Mot de passe</label>
            <button type="button" onClick={() => { setShowReset(true); setResetEmail(email) }}
              className="text-xs text-[var(--tx-4)] hover:text-accent transition-colors">
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'} required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm pr-12"
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tx-4)] hover:text-[var(--tx-2)] transition-colors">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-all shadow-lg shadow-accent/15 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[var(--bd)]" />
        <span className="text-[var(--tx-5)] text-xs">ou</span>
        <div className="flex-1 h-px bg-[var(--bd)]" />
      </div>

      <Link
        href={`/auth/register${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[var(--bd)] text-[var(--tx-2)] text-sm font-medium hover:border-accent/40 hover:text-[var(--tx-1)] transition-all"
      >
        <Heart className="w-4 h-4 text-accent" />
        Créer un compte donateur
      </Link>
    </div>
  )
}
