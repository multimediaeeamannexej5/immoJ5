'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Heart, CheckCircle2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? '/dashboard'
  const supabase     = createClient()

  const [form,     setForm]     = useState({ fullName: '', email: '', phone: '', password: '' })
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Vérifier que l'email n'est pas réservé à un admin
    const { data: isAdmin } = await supabase.rpc('email_is_admin', { p_email: form.email })
    if (isAdmin) {
      setError('Cet email est réservé à un compte administrateur.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone:     form.phone || null,
        },
        // Rediriger vers la page souhaitée après confirmation email
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email. Connectez-vous.'
        : error.message)
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
        <h2 className="text-xl font-bold text-white mb-2">Compte créé !</h2>
        <p className="text-gray-400 text-sm mb-2">
          Un email de vérification a été envoyé à <span className="text-white font-medium">{form.email}</span>.
        </p>
        <p className="text-gray-500 text-xs mb-8">
          Cliquez sur le lien dans l&apos;email pour activer votre compte, puis connectez-vous.
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
          Aller à la connexion
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
          <p className="text-accent text-sm">
            Créez un compte pour finaliser votre don.
          </p>
        </div>
      )}

      <h1 className="text-2xl font-bold text-white mb-1">Rejoindre la communauté</h1>
      <p className="text-gray-400 text-sm mb-8">
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
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom complet <span className="text-red-400">*</span>
          </label>
          <input
            name="fullName"
            type="text"
            required
            autoComplete="name"
            value={form.fullName}
            onChange={handleChange}
            placeholder="KALONJI Camille"
            className="w-full px-4 py-3 bg-[#0A0B10] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="votre@email.com"
            className="w-full px-4 py-3 bg-[#0A0B10] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Téléphone{' '}
            <span className="text-gray-500 font-normal text-xs">(optionnel)</span>
          </label>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+212 6XX XXX XXX"
            className="w-full px-4 py-3 bg-[#0A0B10] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mot de passe <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPwd ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 8 caractères"
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
          {/* Force du mot de passe */}
          {form.password.length > 0 && (
            <div className="mt-2 flex gap-1">
              {[4, 6, 8, 10].map(len => (
                <div
                  key={len}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    form.password.length >= len
                      ? form.password.length >= 10 ? 'bg-emerald-500'
                        : form.password.length >= 8 ? 'bg-accent'
                        : 'bg-orange-500'
                      : 'bg-[#252637]'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/15 flex items-center justify-center gap-2 mt-2"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Heart className="w-4 h-4 fill-current" />
          }
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>

        <p className="text-gray-600 text-xs text-center pt-1">
          En vous inscrivant, vous acceptez notre politique de confidentialité.
        </p>
      </form>
    </div>
  )
}
