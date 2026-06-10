'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart, LogOut, CheckCircle2, AlertCircle, RefreshCw,
  Upload, X, Loader2, ArrowRight, Clock, Calendar, User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  formatMAD, progressPercent,
  PAYMENT_METHOD_LABELS, STATUS_LABELS, STATUS_COLORS,
} from '@/lib/utils'
import { createCommitment } from './actions'
import { submitMonthlyPayment, requestPackChange } from '@/app/donate/actions'
import type { DonorCommitment, DonationPack, Profile, Donation } from '@/types'

/* ── Types locaux ─────────────────────────────────────────────────── */
type PackData = Pick<DonationPack, 'id' | 'name' | 'total_cost' | 'monthly_amount' | 'description'>

type CommitmentFull = Omit<DonorCommitment, 'donation_packs'> & {
  donation_packs: PackData
}

type DonationRow = Donation & {
  donation_packs: Pick<DonationPack, 'name'> | null
}

type Props = {
  profile:    Profile | null
  email:      string
  donations:  DonationRow[]
  commitment: CommitmentFull | null
  packs:      PackData[]
}

const PAYMENT_METHODS = Object.entries(PAYMENT_METHOD_LABELS)

/* ════════════════════════════════════════════════════════════════════ */
export default function DonorHub({ profile, email, donations, commitment, packs }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const [pending, startTransition] = useTransition()

  /* ── Calculs ──────────────────────────────────────────────────── */
  const pack      = commitment?.donation_packs ?? null
  const totalCost = pack ? Number(pack.total_cost)    : 0
  const monthly   = pack ? Number(pack.monthly_amount) : 0

  const totalValidated = donations
    .filter(d => d.status === 'validated' && d.type === 'monthly')
    .reduce((sum, d) => sum + Number(d.amount), 0)

  const pct       = pack ? progressPercent(totalValidated, totalCost) : 0
  const remaining = Math.max(0, totalCost - totalValidated)

  const currentMonthYear = new Date().toISOString().slice(0, 7)
  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const paidThisMonth = donations.some(d =>
    d.type === 'monthly' &&
    (d.status === 'pending' || d.status === 'validated') &&
    d.month_year === currentMonthYear,
  )

  const pendingCount   = donations.filter(d => d.status === 'pending').length
  const validatedCount = donations.filter(d => d.status === 'validated').length

  /* ── UI state ─────────────────────────────────────────────────── */
  const [section, setSection] = useState<'payment' | 'change'>('payment')

  // Sélection de pack (sans engagement)
  const [selectedPackId, setSelectedPackId] = useState('')
  const [selectError,    setSelectError]    = useState('')

  // Mode de paiement : mensualités fixe ou montant libre
  const [paymentMode,  setPaymentMode]  = useState<'months' | 'custom'>('months')
  const [monthsCount,  setMonths]       = useState(1)
  const [customAmount, setCustomAmount] = useState('')

  // Autres champs formulaire
  const [method,      setMethod]     = useState('')
  const [notes,       setNotes]      = useState('')
  const [proofFile,   setProofFile]  = useState<File | null>(null)
  const [proofPreview,setPreview]    = useState<string | null>(null)
  const [proofUrl,    setProofUrl]   = useState<string | null>(null)
  const [uploading,   setUploading]  = useState(false)
  const [formError,   setFormError]  = useState('')
  const [paySuccess,  setPaySuccess] = useState(false)

  // Changement de pack
  const [newPackId,   setNewPackId]  = useState('')
  const [changeNote,  setChangeNote] = useState('')
  const [changeSent,  setChangeSent] = useState(false)
  const [changeError, setChangeError] = useState('')

  // Montant effectif selon le mode
  const fixedAmount  = monthly * monthsCount
  const parsedCustom = parseFloat(customAmount.replace(',', '.')) || 0
  const effectiveAmount = paymentMode === 'custom' ? parsedCustom : fixedAmount

  /* ── Actions ──────────────────────────────────────────────────── */
  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleCreateCommitment() {
    if (!selectedPackId) { setSelectError('Veuillez choisir un pack.'); return }
    setSelectError('')
    startTransition(async () => {
      const res = await createCommitment(selectedPackId)
      if (res?.error) { setSelectError(res.error); return }
      router.refresh()
    })
  }

  async function handleProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setFormError('Fichier trop grand (max 5 Mo)'); return }
    setProofFile(file)
    setPreview(URL.createObjectURL(file))
    setFormError('')
    setUploading(true)

    const sc = createClient()
    const ext  = file.name.split('.').pop()
    // RLS policy requires path to start with the user's UUID
    const path = `${profile?.id ?? 'anon'}/${Date.now()}.${ext}`
    const { data, error: upErr } = await sc.storage
      .from('donation-proofs').upload(path, file, { cacheControl: '3600', upsert: false })

    if (upErr) { setFormError('Erreur upload : ' + upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = sc.storage.from('donation-proofs').getPublicUrl(data.path)
    setProofUrl(publicUrl)
    setUploading(false)
  }

  function removeProof() {
    setProofFile(null)
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setPreview(null)
    setProofUrl(null)
  }

  function handlePay() {
    if (paymentMode === 'custom') {
      if (!parsedCustom || parsedCustom <= 0) {
        setFormError('Saisissez un montant valide.')
        return
      }
    }
    if (!method)   { setFormError('Choisissez un mode de paiement.'); return }
    if (!proofUrl) { setFormError('Veuillez joindre le reçu de paiement.'); return }
    setFormError('')

    startTransition(async () => {
      const isAcompte = paymentMode === 'custom' && parsedCustom < monthly
      const customNote = isAcompte
        ? `Acompte${notes ? ' — ' + notes : ''}`
        : notes

      const res = await submitMonthlyPayment({
        commitmentPackId: pack!.id,
        monthlyAmount:    paymentMode === 'custom' ? parsedCustom : monthly,
        method,
        proofUrl,
        notes:      paymentMode === 'custom' ? customNote : notes,
        monthsCount: paymentMode === 'custom' ? 1 : monthsCount,
      })
      if (res?.error) { setFormError(res.error); return }
      setPaySuccess(true)
    })
  }

  function handleChangeRequest() {
    if (!newPackId) { setChangeError('Choisissez un nouveau pack.'); return }
    setChangeError('')
    startTransition(async () => {
      const res = await requestPackChange({ newPackId, note: changeNote })
      if (res?.error) { setChangeError(res.error); return }
      setChangeSent(true)
    })
  }

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--tx-1)]">
            Bonjour, {profile?.full_name?.split(' ')[0] ?? 'Donateur'} 👋
          </h1>
          <p className="text-[var(--tx-3)] text-sm mt-1">{email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--bd)] text-[var(--tx-3)] text-sm hover:text-[var(--tx-1)] transition-colors">
            <User className="w-4 h-4" />
            Profil
          </Link>
          <button onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--bd)] text-[var(--tx-3)] text-sm hover:text-red-400 hover:border-red-500/30 transition-colors">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          PAS D'ENGAGEMENT — Sélection de pack
      ════════════════════════════════════════════════════════════ */}
      {!commitment ? (
        <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-accent fill-current opacity-60" />
            </div>
            <h2 className="text-[var(--tx-1)] font-bold text-xl mb-2">Choisissez votre engagement mensuel</h2>
            <p className="text-[var(--tx-4)] text-sm max-w-md mx-auto">
              Sélectionnez un pack et contribuez chaque mois au projet de construction de l&apos;église.
            </p>
          </div>

          {selectError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {selectError}
            </div>
          )}

          <div className="space-y-3 mb-6 max-w-2xl mx-auto">
            {packs.map(p => (
              <label key={p.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                selectedPackId === p.id ? 'border-accent bg-accent/5' : 'border-[var(--bd)] hover:border-accent/30'
              }`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="pack" value={p.id} checked={selectedPackId === p.id}
                    onChange={() => { setSelectedPackId(p.id); setSelectError('') }}
                    className="accent-accent" />
                  <div>
                    <div className="text-[var(--tx-1)] font-semibold text-sm">{p.name}</div>
                    {p.description && (
                      <div className="text-[var(--tx-4)] text-xs mt-0.5">{p.description}</div>
                    )}
                    <div className="text-[var(--tx-4)] text-xs mt-0.5">
                      Engagement total : <span className="text-[var(--tx-2)]">{formatMAD(Number(p.total_cost))}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-accent font-bold text-base">{formatMAD(Number(p.monthly_amount))}</div>
                  <div className="text-[var(--tx-5)] text-xs">/mois</div>
                </div>
              </label>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            <button onClick={handleCreateCommitment} disabled={pending}
              className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {pending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
                : <><Heart className="w-4 h-4 fill-current" /> Commencer mon engagement</>
              }
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════════════
              BARRE DE PROGRESSION (style page d'accueil)
          ════════════════════════════════════════════════════════ */}
          <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-8 mb-6">
            <div className="mb-6">
              <span className="text-accent text-xs font-semibold uppercase tracking-widest">Mon engagement mensuel</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--tx-1)] mt-1">{pack!.name}</h2>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-[var(--tx-1)]">
                  {formatMAD(totalValidated)}
                </div>
                <div className="text-[var(--tx-3)] text-sm mt-1">
                  versés sur {formatMAD(totalCost)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl sm:text-5xl font-bold text-accent">{pct}%</div>
                <div className="text-[var(--tx-3)] text-sm mt-1">de l&apos;objectif atteint</div>
              </div>
            </div>

            <div className="h-6 bg-[var(--bg-base)] rounded-full border border-[var(--bd)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light relative transition-all duration-1000"
                style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
              >
                {pct > 5 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-bold">
                    {pct}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-3 text-sm">
              <span className="text-[var(--tx-4)]">0 MAD</span>
              <span className="text-accent font-medium">{formatMAD(remaining)} restants</span>
              <span className="text-[var(--tx-4)]">{formatMAD(totalCost)}</span>
            </div>

            <div className={`mt-5 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
              paidThisMonth
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            }`}>
              {paidThisMonth
                ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Paiement de {monthLabel} enregistré ✓</>
                : <><AlertCircle  className="w-4 h-4 flex-shrink-0" /> Paiement de {monthLabel} à effectuer</>
              }
            </div>

            {commitment.status === 'change_requested' && (
              <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <RefreshCw className="w-4 h-4 flex-shrink-0" />
                Demande de changement de pack en attente d&apos;approbation
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════
              PACK + FORMULAIRE
          ════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* ── Carte pack ──────────────────────────────────────── */}
            <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-6 flex flex-col">
              <p className="text-[var(--tx-4)] text-xs uppercase tracking-widest mb-3">Pack actuel</p>
              <h3 className="text-[var(--tx-1)] font-bold text-lg mb-1">{pack!.name}</h3>
              {pack!.description && (
                <p className="text-[var(--tx-4)] text-xs mb-3 leading-relaxed">{pack!.description}</p>
              )}

              <div className="space-y-2.5 mb-5">
                {[
                  { label: 'Mensualité',       value: formatMAD(monthly),        color: 'text-accent font-bold' },
                  { label: 'Engagement total',  value: formatMAD(totalCost),      color: 'text-[var(--tx-1)] font-semibold' },
                  { label: 'Versé (validé)',    value: formatMAD(totalValidated), color: 'text-emerald-400 font-semibold' },
                  { label: 'Restant',           value: formatMAD(remaining),      color: 'text-[var(--tx-2)]' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-[var(--tx-3)]">{label}</span>
                    <span className={color}>{value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setSection('change'); setFormError(''); setChangeError('') }}
                disabled={commitment.status === 'change_requested'}
                className="w-full py-2.5 rounded-xl border border-[var(--bd)] text-[var(--tx-3)] text-sm hover:text-[var(--tx-1)] hover:border-accent/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4">
                <RefreshCw className="w-3.5 h-3.5" />
                {commitment.status === 'change_requested' ? 'Changement en attente…' : 'Changer de pack'}
              </button>

              <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-[var(--bd)]">
                <div className="bg-[var(--bg-base)] rounded-xl p-3">
                  <Clock className="w-4 h-4 text-yellow-400 mb-1.5" />
                  <div className="text-yellow-400 font-bold text-lg">{pendingCount}</div>
                  <div className="text-[var(--tx-5)] text-xs">En attente</div>
                </div>
                <div className="bg-[var(--bg-base)] rounded-xl p-3">
                  <Calendar className="w-4 h-4 text-emerald-400 mb-1.5" />
                  <div className="text-emerald-400 font-bold text-lg">{validatedCount}</div>
                  <div className="text-[var(--tx-5)] text-xs">Validés</div>
                </div>
              </div>
            </div>

            {/* ── Zone paiement / changement ───────────────────────── */}
            <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-6">

              {/* Onglets principaux */}
              <div className="flex gap-2 mb-5">
                {([
                  { key: 'payment', label: 'Payer ce mois' },
                  { key: 'change',  label: 'Changer de pack' },
                ] as const).map(tab => (
                  <button key={tab.key}
                    onClick={() => { setSection(tab.key); setFormError(''); setChangeError('') }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      section === tab.key
                        ? 'bg-accent/15 border-accent/30 text-accent'
                        : 'bg-[var(--bg-base)] border-[var(--bd)] text-[var(--tx-3)] hover:text-[var(--tx-1)]'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Vue : paiement ────────────────────────────────── */}
              {section === 'payment' && (
                paySuccess ? (
                  <div className="text-center py-10">
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-[var(--tx-1)] font-bold text-lg mb-2">Paiement soumis !</h3>
                    <p className="text-[var(--tx-3)] text-sm mb-1">
                      <span className="font-bold text-accent">{formatMAD(effectiveAmount)}</span> en attente de validation.
                    </p>
                    <p className="text-[var(--tx-4)] text-xs mb-6">
                      Le trésorier confirmera votre paiement sous peu.
                    </p>
                    <button
                      onClick={() => {
                        setPaySuccess(false); setMethod(''); setMonths(1)
                        setNotes(''); setCustomAmount(''); setPaymentMode('months')
                        removeProof()
                      }}
                      className="px-6 py-2.5 rounded-xl border border-[var(--bd)] text-[var(--tx-2)] text-sm hover:border-accent transition-colors">
                      Faire un autre paiement
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-[var(--tx-1)] font-semibold mb-4">Paiement — {monthLabel}</h3>

                    {formError && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {formError}
                      </div>
                    )}

                    {/* ── Toggle Mensualités / Montant libre ──── */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                        Type de paiement
                      </label>
                      <div className="flex gap-2">
                        <button type="button"
                          onClick={() => { setPaymentMode('months'); setCustomAmount('') }}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                            paymentMode === 'months'
                              ? 'bg-accent/15 border-accent/30 text-accent'
                              : 'bg-[var(--bg-base)] border-[var(--bd)] text-[var(--tx-3)] hover:text-[var(--tx-1)]'
                          }`}>
                          Mensualités
                        </button>
                        <button type="button"
                          onClick={() => { setPaymentMode('custom'); setMonths(1) }}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                            paymentMode === 'custom'
                              ? 'bg-accent/15 border-accent/30 text-accent'
                              : 'bg-[var(--bg-base)] border-[var(--bd)] text-[var(--tx-3)] hover:text-[var(--tx-1)]'
                          }`}>
                          Montant libre
                        </button>
                      </div>
                    </div>

                    {/* ── Mode mensualités ─────────────────────── */}
                    {paymentMode === 'months' && (
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
                          <span className="text-[var(--tx-2)] text-sm">
                            {formatMAD(monthly)} × {monthsCount} mois
                          </span>
                          <span className="text-accent font-bold text-lg">{formatMAD(fixedAmount)}</span>
                        </div>
                      </div>
                    )}

                    {/* ── Mode montant libre ───────────────────── */}
                    {paymentMode === 'custom' && (
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                          Montant à payer (MAD) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={customAmount}
                            onChange={e => setCustomAmount(e.target.value)}
                            placeholder={String(monthly)}
                            min="1"
                            step="1"
                            className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-colors text-sm pr-16"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--tx-4)] text-sm font-medium">MAD</span>
                        </div>
                        {parsedCustom > 0 && (
                          <div className={`mt-2 px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
                            parsedCustom < monthly
                              ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                              : parsedCustom > monthly
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              : 'bg-accent/5 border border-accent/20 text-accent'
                          }`}>
                            <span>
                              {parsedCustom < monthly
                                ? `Acompte (mensualité complète : ${formatMAD(monthly)})`
                                : parsedCustom > monthly
                                ? `Avance incluse (mensualité : ${formatMAD(monthly)})`
                                : 'Correspond à une mensualité exacte'}
                            </span>
                            <span className="font-bold text-sm">{formatMAD(parsedCustom)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode de paiement */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                        Mode de paiement <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

                    {/* Reçu */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                        Reçu de paiement <span className="text-red-400">*</span>
                        <span className="text-[var(--tx-4)] font-normal ml-1">(photo / capture)</span>
                      </label>
                      {proofPreview ? (
                        <div className="relative">
                          <img src={proofPreview} alt="Reçu"
                            className="w-full max-h-48 object-contain rounded-xl border border-accent/40 bg-[var(--bg-base)]" />
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

                    <button onClick={handlePay} disabled={pending || uploading}
                      className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                      {(pending || uploading)
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ArrowRight className="w-4 h-4" />
                      }
                      {uploading ? 'Envoi du reçu…' : pending ? 'Soumission…'
                        : effectiveAmount > 0
                          ? `Soumettre — ${formatMAD(effectiveAmount)}`
                          : 'Soumettre le paiement'
                      }
                    </button>
                  </div>
                )
              )}

              {/* ── Vue : changement de pack ──────────────────────── */}
              {section === 'change' && (
                <div>
                  {changeSent ? (
                    <div className="text-center py-10">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <h3 className="text-[var(--tx-1)] font-bold mb-2">Demande envoyée !</h3>
                      <p className="text-[var(--tx-3)] text-sm">
                        Votre demande sera traitée par l&apos;équipe dans les plus brefs délais.
                      </p>
                    </div>
                  ) : commitment.status === 'change_requested' ? (
                    <div className="text-center py-10">
                      <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                      <h3 className="text-[var(--tx-1)] font-bold mb-2">Demande en cours d&apos;examen</h3>
                      <p className="text-[var(--tx-3)] text-sm">
                        Votre demande de changement est en attente d&apos;approbation.
                      </p>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-[var(--tx-1)] font-semibold mb-1">
                        Demander un changement de pack
                      </h3>
                      <p className="text-[var(--tx-4)] text-xs mb-5">
                        Votre demande sera soumise à l&apos;admin. Vous continuez à payer votre pack actuel entre-temps.
                      </p>

                      {changeError && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                          {changeError}
                        </div>
                      )}

                      <div className="space-y-3 mb-5">
                        {packs.filter(p => p.id !== pack!.id).map(p => (
                          <label key={p.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                            newPackId === p.id ? 'border-accent bg-accent/5' : 'border-[var(--bd)] hover:border-accent/30'
                          }`}>
                            <div className="flex items-center gap-3">
                              <input type="radio" name="newpack" value={p.id} checked={newPackId === p.id}
                                onChange={() => setNewPackId(p.id)} className="accent-accent" />
                              <div>
                                <div className="text-[var(--tx-1)] font-semibold text-sm">{p.name}</div>
                                <div className="text-[var(--tx-4)] text-xs">{formatMAD(Number(p.total_cost))} engagement total</div>
                              </div>
                            </div>
                            <div className="text-accent font-bold text-sm">{formatMAD(Number(p.monthly_amount))}/mois</div>
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
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          HISTORIQUE DES PAIEMENTS
      ════════════════════════════════════════════════════════════ */}
      <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--bd)]">
          <h2 className="text-[var(--tx-1)] font-semibold">
            Historique des paiements
            <span className="ml-2 text-[var(--tx-4)] font-normal text-sm">({donations.length})</span>
          </h2>
        </div>

        {donations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Heart className="w-10 h-10 text-[var(--tx-6)] mx-auto mb-3" />
            <p className="text-[var(--tx-4)] text-sm">Aucun paiement pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-[var(--tx-4)] uppercase border-b border-[var(--bd)]">
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Pack</th>
                  <th className="px-5 py-3 text-left">Montant</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Méthode</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bd)]">
                {donations.map(d => (
                  <tr key={d.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-5 py-4 text-[var(--tx-3)] text-sm whitespace-nowrap">
                      {new Date(d.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4 text-[var(--tx-2)] text-sm">{d.donation_packs?.name ?? '—'}</td>
                    <td className="px-5 py-4 text-accent font-semibold text-sm whitespace-nowrap">
                      {formatMAD(Number(d.amount))}
                    </td>
                    <td className="px-5 py-4 text-[var(--tx-3)] text-sm hidden sm:table-cell">
                      {PAYMENT_METHOD_LABELS[d.payment_method] ?? d.payment_method}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[d.status]}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
