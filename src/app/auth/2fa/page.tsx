'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react'
import { verify2FACode, resend2FACode } from './actions'

export default function TwoFactorPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const maskedEmail  = searchParams.get('email') ?? ''

  const inputRef = useRef<HTMLInputElement>(null)

  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState('')
  const [resent,  setResent]  = useState(false)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) { setError('Entrez les 6 chiffres du code.'); return }
    setError('')
    setLoading(true)
    try {
      const result = await verify2FACode(code)
      if (!result.success) {
        setError(result.error ?? 'Code incorrect.')
        setCode('')
        inputRef.current?.focus()
      } else {
        router.push(result.redirectTo ?? '/dashboard')
        router.refresh()
      }
    } catch {
      setError('Erreur de vérification. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setSending(true)
    setError('')
    setResent(false)
    try {
      const result = await resend2FACode()
      if (result.success) {
        setResent(true)
        setCode('')
        inputRef.current?.focus()
        setTimeout(() => setResent(false), 6000)
      } else {
        setError(result.error ?? "Erreur lors de l'envoi.")
      }
    } catch {
      setError("Erreur lors de l'envoi.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      {/* Icon + title */}
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--tx-1)] mb-1">
          Vérification en 2 étapes
        </h1>
        <p className="text-[var(--tx-3)] text-sm leading-relaxed">
          Un code à 6 chiffres a été envoyé à<br />
          <span className="text-[var(--tx-1)] font-medium">
            {maskedEmail || 'votre adresse email'}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        {resent && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm text-center">
            ✓ Nouveau code envoyé.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
            Code de vérification
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="• • • • • •"
            className="w-full px-4 py-4 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-center text-3xl font-mono tracking-[0.6em]"
          />
          <p className="text-[var(--tx-5)] text-xs mt-1.5 text-center">
            Valable 10 minutes · Vérifiez vos spams
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-all shadow-lg shadow-accent/15 flex items-center justify-center gap-2"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <ArrowRight className="w-4 h-4" />
          }
          {loading ? 'Vérification…' : 'Confirmer'}
        </button>
      </form>

      {/* Resend */}
      <div className="mt-5 text-center">
        <button
          onClick={handleResend}
          disabled={sending}
          className="inline-flex items-center gap-2 text-sm text-[var(--tx-4)] hover:text-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
          {sending ? 'Envoi en cours…' : 'Renvoyer le code'}
        </button>
      </div>
    </div>
  )
}
