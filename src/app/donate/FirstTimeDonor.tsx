'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Upload, X, Heart, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createCommitmentAndFirstPayment } from './actions'
import type { DonationPack } from '@/types'
import { formatMAD, PAYMENT_METHOD_LABELS } from '@/lib/utils'

type Step = 1 | 2 | 3

const PAYMENT_METHODS = Object.entries(PAYMENT_METHOD_LABELS)

export default function FirstTimeDonor({ packs }: { packs: DonationPack[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [step,        setStep]       = useState<Step>(1)
  const [packId,      setPackId]     = useState('')
  const [method,      setMethod]     = useState('')
  const [monthsCount, setMonths]     = useState(1)
  const [notes,       setNotes]      = useState('')
  const [proofFile,   setProofFile]  = useState<File | null>(null)
  const [proofPreview,setPreview]    = useState<string | null>(null)
  const [proofUrl,    setProofUrl]   = useState<string | null>(null)
  const [uploading,   setUploading]  = useState(false)
  const [error,       setError]      = useState('')
  const [success,     setSuccess]    = useState(false)

  const selectedPack = packs.find(p => p.id === packId)
  const totalAmount  = selectedPack ? Number(selectedPack.monthly_amount) * monthsCount : 0

  /* ── Upload proof ─────────────────────────────────────────────── */
  async function handleProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Fichier trop grand (max 5 Mo)'); return }

    setProofFile(file)
    setPreview(URL.createObjectURL(file))
    setError('')
    setUploading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const ext  = file.name.split('.').pop()
    // RLS policy requires path to start with the user's UUID
    const path = `${user?.id ?? 'anon'}/${Date.now()}.${ext}`
    const { data, error: upErr } = await supabase.storage
      .from('donation-proofs').upload(path, file, { cacheControl: '3600', upsert: false })

    if (upErr) { setError('Erreur upload : ' + upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('donation-proofs').getPublicUrl(data.path)
    setProofUrl(publicUrl)
    setUploading(false)
  }

  function removeProof() {
    setProofFile(null)
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setPreview(null)
    setProofUrl(null)
  }

  /* ── Submit ───────────────────────────────────────────────────── */
  function handleSubmit() {
    if (!packId)   { setError('Choisissez un pack.'); return }
    if (!method)   { setError('Choisissez un mode de paiement.'); return }
    if (!proofUrl) { setError('Veuillez joindre le reçu de paiement.'); return }
    setError('')

    startTransition(async () => {
      const res = await createCommitmentAndFirstPayment({
        packId, method, proofUrl, notes, monthsCount,
      })
      if (res.error) { setError(res.error); return }
      setSuccess(true)
    })
  }

  /* ── Succès ───────────────────────────────────────────────────── */
  if (success) return (
    <div className="flex items-center justify-center min-h-screen px-4 py-28">
      <div className="max-w-md w-full bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-10 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[var(--tx-1)] mb-2">Engagement enregistré !</h2>
        <p className="text-[var(--tx-3)] text-sm mb-1">
          Pack <span className="font-semibold text-accent">{selectedPack?.name}</span> activé.
        </p>
        <p className="text-[var(--tx-3)] text-sm mb-6">
          Votre paiement de <span className="font-bold text-accent">{formatMAD(totalAmount)}</span> est en attente de validation.
        </p>
        <button onClick={() => router.push('/dashboard')}
          className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-colors">
          Voir mon tableau de bord
        </button>
      </div>
    </div>
  )

  const stepTitles = ['Choisir un pack', 'Paiement initial']

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--tx-1)]">Mon engagement mensuel</h1>
        <p className="text-[var(--tx-3)] text-sm mt-2">
          Choisissez votre pack — vous pourrez payer chaque mois depuis votre espace.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-3 mb-8">
        {stepTitles.map((title, i) => {
          const n = (i + 1) as Step
          const active = step === n
          const done   = step > n
          return (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                done   ? 'bg-emerald-500 text-white' :
                active ? 'bg-accent text-white' :
                         'bg-[var(--bg-card)] border border-[var(--bd)] text-[var(--tx-4)]'
              }`}>
                {done ? '✓' : n}
              </div>
              <span className={`hidden sm:block text-xs ${active ? 'text-accent font-semibold' : done ? 'text-[var(--tx-3)]' : 'text-[var(--tx-5)]'}`}>
                {title}
              </span>
              {i < stepTitles.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${done ? 'bg-emerald-500/50' : 'bg-[var(--bd)]'}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        {/* ── Étape 1 : choix du pack ──────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-[var(--tx-1)] font-semibold mb-4">Choisissez votre pack mensuel</h2>
            <div className="space-y-3 mb-6">
              {packs.map(pack => (
                <label key={pack.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  packId === pack.id ? 'border-accent bg-accent/5' : 'border-[var(--bd)] hover:border-accent/30'
                }`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="pack" value={pack.id} checked={packId === pack.id}
                      onChange={() => setPackId(pack.id)} className="accent-accent" />
                    <div>
                      <div className="text-[var(--tx-1)] font-semibold text-sm">{pack.name}</div>
                      {pack.description && (
                        <div className="text-[var(--tx-4)] text-xs mt-0.5">{pack.description}</div>
                      )}
                      <div className="text-[var(--tx-4)] text-xs mt-0.5">
                        Engagement total : {formatMAD(pack.total_cost)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-accent font-bold">{formatMAD(pack.monthly_amount)}</div>
                    <div className="text-[var(--tx-5)] text-xs">/mois</div>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={() => { if (!packId) { setError('Choisissez un pack.'); return } setError(''); setStep(2) }}
              className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
            >
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Étape 2 : premier paiement ───────────────────────── */}
        {step === 2 && selectedPack && (
          <div>
            <h2 className="text-[var(--tx-1)] font-semibold mb-1">Premier paiement</h2>
            <p className="text-[var(--tx-4)] text-xs mb-5">
              Pack <span className="text-accent font-semibold">{selectedPack.name}</span> — {formatMAD(selectedPack.monthly_amount)}/mois
            </p>

            {/* Mois à payer */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                Nombre de mois à payer
                <span className="text-[var(--tx-5)] font-normal ml-2">(possibilité d'avance)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 6].map(n => (
                  <button key={n} type="button"
                    onClick={() => setMonths(n)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      monthsCount === n
                        ? 'bg-accent text-white border-accent'
                        : 'bg-[var(--bg-base)] border-[var(--bd)] text-[var(--tx-3)] hover:border-accent/40'
                    }`}
                  >
                    {n} mois
                  </button>
                ))}
              </div>
              <div className="mt-3 p-3 bg-accent/5 border border-accent/20 rounded-xl">
                <span className="text-[var(--tx-2)] text-sm">Montant total : </span>
                <span className="text-accent font-bold text-lg">{formatMAD(totalAmount)}</span>
              </div>
            </div>

            {/* Mode de paiement */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">Mode de paiement <span className="text-red-400">*</span></label>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(([val, label]) => (
                  <label key={val} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    method === val ? 'border-accent bg-accent/5' : 'border-[var(--bd)] hover:border-accent/30'
                  }`}>
                    <input type="radio" name="method" value={val} checked={method === val}
                      onChange={() => setMethod(val)} className="accent-accent" />
                    <span className="text-[var(--tx-1)] text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preuve de paiement (obligatoire) */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                Reçu de paiement <span className="text-red-400">*</span>
                <span className="text-[var(--tx-4)] font-normal ml-1">(photo / capture d&apos;écran)</span>
              </label>
              {proofPreview ? (
                <div className="relative">
                  <img src={proofPreview} alt="Reçu" className="w-full max-h-48 object-contain rounded-xl border border-accent/40 bg-[var(--bg-base)]" />
                  <button type="button" onClick={removeProof}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  {!uploading && proofUrl && (
                    <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {proofFile?.name}
                    </p>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-[var(--bd)] rounded-xl cursor-pointer hover:border-accent/50 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Upload className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-center">
                    <p className="text-[var(--tx-2)] text-sm font-medium">Joindre le reçu</p>
                    <p className="text-[var(--tx-4)] text-xs mt-0.5">JPG, PNG, HEIC, PDF — max 5 Mo</p>
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                    onChange={handleProof} className="sr-only" />
                </label>
              )}
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                Note <span className="text-[var(--tx-4)] font-normal">(optionnel)</span>
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Référence de virement, commentaire..."
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-colors text-sm resize-none" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-[var(--bd)] text-[var(--tx-3)] text-sm hover:border-accent transition-colors">
                Retour
              </button>
              <button onClick={handleSubmit} disabled={pending || uploading}
                className="flex-1 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {(pending || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                <Heart className="w-4 h-4 fill-current" />
                {uploading ? 'Envoi du reçu…' : pending ? 'Enregistrement…' : 'Confirmer mon engagement'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
