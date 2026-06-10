'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Heart, CheckCircle2, ArrowRight } from 'lucide-react'
import { registerMember } from './actions'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? '/dashboard'

  const [form,    setForm]    = useState({ fullName: '', email: '', phone: '', password: '', affiliation: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await registerMember({
      email:       form.email,
      password:    form.password,
      fullName:    form.fullName,
      phone:       form.phone,
      affiliation: form.affiliation,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  /* ── Écran de succès ── */
  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-[var(--tx-1)] mb-2">Compte créé !</h2>
        <p className="text-[var(--tx-3)] text-sm mb-1">
          Bienvenue <span className="text-[var(--tx-1)] font-medium">{form.fullName}</span> !
        </p>
        <p className="text-[var(--tx-4)] text-xs mb-2">
          Un email de bienvenue a été envoyé à{' '}
          <span className="text-[var(--tx-2)]">{form.email}</span>.
        </p>
        <p className="text-[var(--tx-4)] text-xs mb-8">
          Votre compte est prêt — vous pouvez vous connecter immédiatement.
        </p>

        {redirectTo.includes('/donate') && (
          <div className="mb-6 p-3 rounded-xl bg-accent/10 border border-accent/25 text-accent text-xs">
            Votre pack est sauvegardé — vous serez redirigé vers le don après connexion.
          </div>
        )}

        <Link
          href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          Se connecter maintenant
        </Link>
      </div>
    )
  }

  /* ── Formulaire ── */
  return (
    <div>
      {redirectTo.includes('/donate') && (
        <div className="mb-6 p-3 rounded-xl bg-accent/10 border border-accent/25 flex items-center gap-3">
          <Heart className="w-4 h-4 text-accent fill-current flex-shrink-0" />
          <p className="text-accent text-sm">Créez un compte pour finaliser votre don.</p>
        </div>
      )}

      <h1 className="text-2xl font-bold text-[var(--tx-1)] mb-1">Rejoindre la communauté</h1>
      <p className="text-[var(--tx-3)] text-sm mb-8">
        Déjà un compte ?{' '}
        <Link
          href={`/auth/login${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
          className="text-accent hover:underline font-medium"
        >
          Se connecter
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{error}</div>
        )}

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
            Nom complet <span className="text-red-400">*</span>
          </label>
          <input name="fullName" type="text" required autoComplete="name"
            value={form.fullName} onChange={handleChange} placeholder="Mohamed El Fassi"
            className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-all text-sm"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
            Email <span className="text-red-400">*</span>
          </label>
          <input name="email" type="email" required autoComplete="email"
            value={form.email} onChange={handleChange} placeholder="votre@email.com"
            className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-all text-sm"
          />
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
            Téléphone <span className="text-red-400">*</span>
          </label>
          <input name="phone" type="tel" required autoComplete="tel"
            value={form.phone} onChange={handleChange} placeholder="+212 6XX XXX XXX"
            className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-all text-sm"
          />
        </div>

        {/* Affiliation */}
        <div>
          <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
            Affiliation <span className="text-red-400">*</span>
          </label>
          <select name="affiliation" required
            value={form.affiliation} onChange={handleChange}
            className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] focus:outline-none focus:border-accent transition-all text-sm">
            <option value="" disabled>Choisir votre affiliation…</option>
            <option value="centrale">Église Centrale</option>
            <option value="j5">Annexe J5</option>
            <option value="diaspora">Diaspora</option>
          </select>
        </div>

        {/* Mot de passe */}
        <div>
          <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
            Mot de passe <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input name="password" type={showPwd ? 'text' : 'password'} required minLength={8}
              autoComplete="new-password" value={form.password} onChange={handleChange}
              placeholder="Minimum 8 caractères"
              className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-all text-sm pr-12"
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tx-4)] hover:text-[var(--tx-2)] transition-colors">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.password.length > 0 && (
            <div className="mt-2 flex gap-1">
              {[4, 6, 8, 10].map(len => (
                <div key={len} className={`h-1 flex-1 rounded-full transition-colors ${
                  form.password.length >= len
                    ? form.password.length >= 10 ? 'bg-emerald-500'
                      : form.password.length >= 8 ? 'bg-accent'
                      : 'bg-orange-500'
                    : 'bg-[var(--bd)]'
                }`} />
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-all shadow-lg shadow-accent/15 flex items-center justify-center gap-2 mt-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 fill-current" />}
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>

        <p className="text-[var(--tx-5)] text-xs text-center pt-1">
          En vous inscrivant, vous acceptez notre politique de confidentialité.
        </p>
      </form>
    </div>
  )
}
