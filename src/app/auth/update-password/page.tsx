'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function UpdatePasswordPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    // Supabase injecte la session depuis le lien magique
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setHasSession(true)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/auth/login'), 3000)
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-[var(--tx-1)] mb-2">Mot de passe mis à jour !</h2>
        <p className="text-[var(--tx-3)] text-sm mb-6">
          Vous allez être redirigé vers la connexion…
        </p>
        <Link href="/auth/login" className="text-accent text-sm hover:underline">
          Connexion maintenant →
        </Link>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--bg-card)] border border-[var(--bd)] flex items-center justify-center mx-auto mb-5">
          <KeyRound className="w-7 h-7 text-[var(--tx-4)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--tx-1)] mb-2">Lien de réinitialisation</h2>
        <p className="text-[var(--tx-3)] text-sm mb-6">
          Cliquez sur le lien reçu dans votre email pour accéder à cette page.
        </p>
        <Link href="/auth/login" className="text-accent text-sm hover:underline">
          ← Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
        <KeyRound className="w-6 h-6 text-accent" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--tx-1)] mb-1">Nouveau mot de passe</h1>
      <p className="text-[var(--tx-3)] text-sm mb-8">Choisissez un mot de passe sécurisé.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">Nouveau mot de passe</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'} required minLength={8}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 caractères"
              className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm pr-12"
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tx-4)] hover:text-[var(--tx-2)]">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">Confirmer</label>
          <input
            type="password" required minLength={8}
            value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm"
          />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-all flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {loading ? 'Mise à jour…' : 'Mettre à jour'}
        </button>
      </form>
    </div>
  )
}
