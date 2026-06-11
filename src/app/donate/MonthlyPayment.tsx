'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Loader2, Upload, X, ArrowRight,
  RefreshCw, AlertCircle, TrendingUp,
} from 'lucide-react'
import { submitMonthlyPayment, requestPackChange } from './actions'
import type { DonorCommitment, DonationPack } from '@/types'
import { formatMAD, PAYMENT_METHOD_LABELS, progressPercent } from '@/lib/utils'
import PaymentContacts from '@/components/donate/PaymentContacts'
import { convertHeicIfNeeded } from '@/lib/convertHeic'

const PAYMENT_METHODS = Object.entries(PAYMENT_METHOD_LABELS)

type Props = {
  commitment:     DonorCommitment
  totalValidated: number
  paidThisMonth:  boolean
  packs:          DonationPack[]
}

export default function MonthlyPayment({
  commitment, totalValidated, paidThisMonth, packs,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const pack        = commitment.donation_packs!
  const totalCost   = Number(pack.total_cost)
  const monthly     = Number(pack.monthly_amount)
  const pct         = progressPercent(totalValidated, totalCost)
  const remaining   = Math.max(0, totalCost - totalValidated)
  const monthLabel  = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  /* ── Vue affichée : payment | change_request ─────────────────── */
  const [view,        setView]       = useState<'payment' | 'change'>('payment')

  /* ── Paiement ────────────────────────────────────────────────── */
  const [method,       setMethod]      = useState('')
  const [monthsCount,  setMonths]      = useState(1)
  const [notes,        setNotes]       = useState('')
  const [proofFile,    setProofFile]   = useState<File | null>(null)
  const [proofPreview, setProofPreview]= useState<string | null>(null)
  const [converting,   setConverting]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error,        setError]       = useState('')
  const [success,      setSuccess]     = useState(false)

  /* ── Demande de changement de pack ───────────────────────────── */
  const [newPackId,   setNewPackId]  = useState('')
  const [changeNote,  setChangeNote] = useState('')
  const [changeSent,  setChangeSent] = useState(false)

  const totalAmount = monthly * monthsCount

  /* ── Sélection du fichier (conversion HEIC → JPEG auto si besoin) */
  async function handleProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Fichier trop grand (max 5 Mo)'); return }

    setConverting(true)
    const processed = await convertHeicIfNeeded(file)
    setConverting(false)

    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofFile(processed)
    setProofPreview(URL.createObjectURL(processed))
    setError('')

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeProof() {
    setProofFile(null)
    if (proofPreview) { URL.revokeObjectURL(proofPreview); setProofPreview(null) }
  }

  /* ── Soumettre paiement ──────────────────────────────────────── */
  function handleSubmit() {
    if (!method)    { setError('Choisissez un mode de paiement.'); return }
    if (!proofFile) { setError('Veuillez joindre le reçu de paiement.'); return }
    setError('')

    const fd = new FormData()
    fd.append('commitmentPackId', pack.id)
    fd.append('monthlyAmount',    String(monthly))
    fd.append('method',           method)
    fd.append('notes',            notes)
    fd.append('monthsCount',      String(monthsCount))
    fd.append('proof',            proofFile)

    startTransition(async () => {
      const res = await submitMonthlyPayment(fd)
      if (res.error) { setError(res.error); return }
      setSuccess(true)
    })
  }

  /* ── Soumettre demande changement ────────────────────────────── */
  function handleChangeRequest() {
    if (!newPackId) { setError('Choisissez un nouveau pack.'); return }
    setError('')
    startTransition(async () => {
      const res = await requestPackChange({ newPackId, note: changeNote })
      if (res.error) { setError(res.error); return }
      setChangeSent(true)
    })
  }

  /* ── Succès paiement ─────────────────────────────────────────── */
  if (success) return (
    <div className="flex items-center justify-center min-h-screen px-4 py-28">
      <div className="max-w-md w-full bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-10 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[var(--tx-1)] mb-2">Paiement soumis !</h2>
        <p className="text-[var(--tx-3)] text-sm mb-1">
          <span className="font-bold text-accent">{formatMAD(totalAmount)}</span> en attente de validation.
        </p>
        <p className="text-[var(--tx-4)] text-xs mb-8">
          Le trésorier ou un admin va confirmer votre paiement.
        </p>
        <button onClick={() => router.push('/dashboard')}
          className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-colors">
          Retour à mon espace
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20">
      <h1 className="text-3xl font-bold text-[var(--tx-1)] mb-2">Mon paiement mensuel</h1>
      <p className="text-[var(--tx-3)] text-sm mb-8">Pack actif : <span className="text-accent font-semibold">{pack.name}</span></p>

      {/* ── Barre de progression ─────────────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-6 mb-6">
        <div className="flex items-end justify-between gap-4 mb-3">
          <div>
            <div className="text-[var(--tx-4)] text-xs uppercase tracking-widest mb-1">
              <TrendingUp className="w-3.5 h-3.5 inline mr-1" />Progression de mon engagement
            </div>
            <div className="text-2xl font-bold text-[var(--tx-1)]">{formatMAD(totalValidated)}</div>
            <div className="text-[var(--tx-4)] text-xs">versés sur {formatMAD(totalCost)}</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-accent">{pct}%</div>
            <div className="text-[var(--tx-4)] text-xs">{formatMAD(monthly)}/mois</div>
          </div>
        </div>
        <div className="h-4 bg-[var(--bg-base)] rounded-full border border-[var(--bd)] overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--tx-4)]">
          <span>0 MAD</span>
          <span className="text-accent">{formatMAD(remaining)} restants</span>
          <span>{formatMAD(totalCost)}</span>
        </div>

        {/* Statut du mois courant */}
        <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
          paidThisMonth
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
        }`}>
          {paidThisMonth
            ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Paiement de {monthLabel} enregistré ✓</>
            : <><AlertCircle  className="w-4 h-4 flex-shrink-0" /> Paiement de {monthLabel} en attente</>
          }
        </div>

        {/* Demande de changement en cours */}
        {commitment.status === 'change_requested' && (
          <div className="mt-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            Demande de changement de pack en attente d&apos;approbation
          </div>
        )}
      </div>

      {/* ── Onglets ───────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'payment', label: 'Payer ce mois' },
          { key: 'change',  label: 'Changer de pack' },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setView(tab.key as typeof view); setError('') }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              view === tab.key
                ? 'bg-accent/15 border-accent/30 text-accent'
                : 'bg-[var(--bg-card)] border-[var(--bd)] text-[var(--tx-3)] hover:text-[var(--tx-1)]'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        {/* ── Vue : paiement mensuel ───────────────────────────── */}
        {view === 'payment' && (
          <div>
            <h2 className="text-[var(--tx-1)] font-semibold mb-4">Paiement — {monthLabel}</h2>

            {/* Nombre de mois */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                Nombre de mois à régler
                <span className="text-[var(--tx-5)] font-normal ml-2">(avance possible)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 6].map(n => (
                  <button key={n} type="button" onClick={() => setMonths(n)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      monthsCount === n
                        ? 'bg-accent text-white border-accent'
                        : 'bg-[var(--bg-base)] border-[var(--bd)] text-[var(--tx-3)] hover:border-accent/40'
                    }`}>
                    {n} mois
                  </button>
                ))}
              </div>
              <div className="mt-3 p-3 bg-accent/5 border border-accent/20 rounded-xl flex items-center justify-between">
                <span className="text-[var(--tx-2)] text-sm">{formatMAD(monthly)} × {monthsCount} mois</span>
                <span className="text-accent font-bold text-lg">{formatMAD(totalAmount)}</span>
              </div>
            </div>

            {/* Mode de paiement */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                Mode de paiement <span className="text-red-400">*</span>
              </label>
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

            {/* Reçu (obligatoire) */}
            {/* Responsables — à qui envoyer le paiement */}
            <PaymentContacts />

            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                Reçu de paiement <span className="text-red-400">*</span>
              </label>
              {proofPreview ? (
                /* Aperçu — l'input disparaît une fois le fichier choisi */
                <div className="relative">
                  <img src={proofPreview} alt="Reçu"
                    className="w-full max-h-48 object-contain rounded-xl border border-accent/40 bg-[var(--bg-base)]" />
                  <button type="button" onClick={removeProof}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {proofFile?.name}
                  </p>
                </div>
              ) : converting ? (
                <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-accent/40 rounded-xl bg-accent/5">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <p className="text-accent text-sm font-medium">Conversion en cours…</p>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-[var(--bd)] rounded-xl cursor-pointer hover:border-accent/50 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Upload className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-center">
                    <p className="text-[var(--tx-2)] text-sm font-medium">Joindre le reçu</p>
                    <p className="text-[var(--tx-4)] text-xs">JPG, PNG, HEIC, PDF — max 5 Mo</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                    onChange={handleProof}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                Note <span className="text-[var(--tx-4)] font-normal">(optionnel)</span>
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Référence de virement..."
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-colors text-sm resize-none" />
            </div>

            <button onClick={handleSubmit} disabled={pending || converting}
              className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? 'Envoi en cours…' : (
                <><ArrowRight className="w-4 h-4" /> Soumettre le paiement de {formatMAD(totalAmount)}</>
              )}
            </button>
          </div>
        )}

        {/* ── Vue : changement de pack ─────────────────────────── */}
        {view === 'change' && (
          <div>
            {changeSent ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-[var(--tx-1)] font-bold mb-2">Demande envoyée</h3>
                <p className="text-[var(--tx-3)] text-sm">
                  Votre demande de changement de pack sera traitée par l&apos;équipe.
                </p>
              </div>
            ) : commitment.status === 'change_requested' ? (
              <div className="text-center py-8">
                <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-[var(--tx-1)] font-bold mb-2">Demande en cours</h3>
                <p className="text-[var(--tx-3)] text-sm">
                  Votre demande de changement est en attente d&apos;approbation.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-[var(--tx-1)] font-semibold mb-1">Demander un changement de pack</h2>
                <p className="text-[var(--tx-4)] text-xs mb-5">
                  Votre demande sera soumise au trésorier ou à l&apos;admin pour approbation.
                  Vous continuerez à payer votre pack actuel entre-temps.
                </p>

                <div className="space-y-3 mb-5">
                  {packs.filter(p => p.id !== pack.id).map(p => (
                    <label key={p.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      newPackId === p.id ? 'border-accent bg-accent/5' : 'border-[var(--bd)] hover:border-accent/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="newpack" value={p.id} checked={newPackId === p.id}
                          onChange={() => setNewPackId(p.id)} className="accent-accent" />
                        <div>
                          <div className="text-[var(--tx-1)] font-semibold text-sm">{p.name}</div>
                          <div className="text-[var(--tx-4)] text-xs">{formatMAD(p.total_cost)} total</div>
                        </div>
                      </div>
                      <div className="text-right text-accent font-bold text-sm">{formatMAD(p.monthly_amount)}/mois</div>
                    </label>
                  ))}
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                    Motif <span className="text-[var(--tx-4)] font-normal">(optionnel)</span>
                  </label>
                  <textarea value={changeNote} onChange={e => setChangeNote(e.target.value)} rows={2}
                    placeholder="Raison du changement..."
                    className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-colors text-sm resize-none" />
                </div>

                <button onClick={handleChangeRequest} disabled={pending}
                  className="w-full py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--bd)] text-[var(--tx-1)] text-sm font-medium hover:border-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Envoyer la demande
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
