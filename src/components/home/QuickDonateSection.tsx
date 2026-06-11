'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Heart, ArrowRight, Phone, CreditCard, Info,
  UserPlus, X, Upload, CheckCircle2, Loader2,
} from 'lucide-react'
import { submitAnonymousDonation } from '@/app/donate/anonymousActions'
import { PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { convertHeicIfNeeded } from '@/lib/convertHeic'

/* ── Responsables par zone ─────────────────────────────────────────── */
const CONTACTS = [
  {
    name:     'Boris ABALO',
    category: 'Église Centrale',
    image:    '/images/paroisse1.png',
    phone:    '+212 691-052394',
    badgeBg:  'bg-[var(--bg-base)]',
    badgeTx:  'text-[var(--tx-4)]',
    cardColor:'text-[var(--tx-4)] bg-[var(--bg-base)]',
  },
  {
    name:     'Michelle LAKPA',
    category: 'Église Centrale',
    image:    '/images/paroisse2.png',
    phone:    '+212 634-904551',
    badgeBg:  'bg-[var(--bg-base)]',
    badgeTx:  'text-[var(--tx-4)]',
    cardColor:'text-[var(--tx-4)] bg-[var(--bg-base)]',
  },
  {
    name:     'Edgar LADISLAS',
    category: 'Annexe J5',
    image:    '/images/J5.png',
    phone:    '+212 695-723410',
    badgeBg:  'bg-accent/10',
    badgeTx:  'text-accent',
    cardColor:'text-accent bg-accent/10',
  },
  {
    name:     'Vanne NKOY',
    category: 'Diaspora',
    image:    '/images/Diaspora.png',
    phone:    '+212 673-623053',
    badgeBg:  'bg-blue-500/10',
    badgeTx:  'text-blue-400',
    cardColor:'text-blue-400 bg-blue-500/10',
  },
] as const

const PAYMENT_METHODS = Object.entries(PAYMENT_METHOD_LABELS)
const PRESETS = [200, 500, 1000, 2000, 5000]

/* ═══════════════════════════════════════════════════════════════════ */
export default function QuickDonateSection() {

  /* ── Étape 1 — montant ───────────────────────────────────────────── */
  const [selected, setSelected] = useState<number | null>(null)
  const [custom,   setCustom]   = useState('')
  const [step,     setStep]     = useState<'amount' | 'info'>('amount')

  /* ── Modal paiement sans compte ──────────────────────────────────── */
  const [showModal,    setShowModal]    = useState(false)
  const [modalStep,    setModalStep]    = useState<'form' | 'success'>('form')
  const [payMethod,    setPayMethod]    = useState('')
  const [firstName,    setFirstName]    = useState('')
  const [lastName,     setLastName]     = useState('')
  const [contact,      setContact]      = useState('')
  const [proofFile,    setProofFile]    = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [converting,   setConverting]   = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [modalError,   setModalError]   = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const finalAmount = selected !== null
    ? selected === -1 ? Number(custom) : selected
    : null

  /* ── Sélection montant ──────────────────────────────────────────── */
  function pickPreset(v: number) { setSelected(v); setCustom(''); setStep('amount') }
  function handleCustomFocus()   { setSelected(-1); setStep('amount') }
  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustom(e.target.value); setSelected(-1); setStep('amount')
  }
  function proceed() { if (finalAmount && finalAmount > 0) setStep('info') }
  const canProceed = finalAmount !== null && finalAmount > 0

  /* ── Ouvrir / fermer la modal ──────────────────────────────────── */
  function openModal() {
    setModalStep('form')
    setPayMethod('')
    setFirstName(''); setLastName(''); setContact('')
    setProofFile(null)
    if (proofPreview) { URL.revokeObjectURL(proofPreview); setProofPreview(null) }
    setModalError('')
    setShowModal(true)
  }
  function closeModal() {
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofPreview(null)
    setProofFile(null)
    setShowModal(false)
  }

  /* ── Gestion du reçu (conversion HEIC → JPEG auto si besoin) ──── */
  async function handleProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setModalError('Fichier trop grand (max 5 Mo)'); return }

    setConverting(true)
    const processed = await convertHeicIfNeeded(file)
    setConverting(false)

    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofFile(processed)
    setProofPreview(URL.createObjectURL(processed))
    setModalError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeProof() {
    setProofFile(null)
    if (proofPreview) { URL.revokeObjectURL(proofPreview); setProofPreview(null) }
  }

  /* ── Soumission ────────────────────────────────────────────────── */
  async function handleSubmit() {
    if (!payMethod) { setModalError('Choisissez un mode de paiement.'); return }
    if (!proofFile) { setModalError('Veuillez joindre le reçu de paiement.'); return }
    setModalError('')
    setSubmitting(true)

    const fd = new FormData()
    fd.append('amount',    String(finalAmount))
    fd.append('method',    payMethod)
    fd.append('proof',     proofFile)
    fd.append('firstName', firstName)
    fd.append('lastName',  lastName)
    fd.append('contact',   contact)

    const res = await submitAnonymousDonation(fd)
    setSubmitting(false)
    if (res.error) { setModalError(res.error); return }
    setModalStep('success')
  }

  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Section principale ────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--bg-card)] border-t border-b border-[var(--bd)]">
        <div className="max-w-3xl mx-auto">

          {/* En-tête */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-medium mb-4">
              <Heart className="w-3.5 h-3.5 fill-current" />
              Don rapide
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--tx-1)] mb-3">
              Contribuer sans créer de compte
            </h2>
            <p className="text-[var(--tx-3)] text-base max-w-xl mx-auto">
              Choisissez un montant et suivez les instructions de paiement.
              Aucune inscription requise.
            </p>
          </div>

          {/* Étape 1 : montant */}
          <div className="bg-[var(--bg-base)] border border-[var(--bd)] rounded-2xl p-6 mb-4">
            <p className="text-[var(--tx-2)] text-sm font-medium mb-4">Montant (MAD)</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
              {PRESETS.map(v => (
                <button key={v} onClick={() => pickPreset(v)}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    selected === v
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                      : 'bg-[var(--bg-card)] text-[var(--tx-2)] border-[var(--bd)] hover:border-accent/40 hover:text-accent'
                  }`}>
                  {v.toLocaleString('fr-FR')}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input type="number" min="1" step="1" value={custom}
                  onFocus={handleCustomFocus} onChange={handleCustomChange}
                  placeholder="Montant libre…"
                  className={`w-full px-4 py-3 bg-[var(--bg-base)] border rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none transition-all text-sm pr-14 ${
                    selected === -1 ? 'border-accent ring-1 ring-accent/20' : 'border-[var(--bd)]'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tx-4)] text-sm pointer-events-none">MAD</span>
              </div>
              <button onClick={proceed} disabled={!canProceed}
                className="px-5 py-3 rounded-xl bg-accent text-white font-bold text-sm disabled:opacity-40 hover:bg-accent-hover transition-colors flex items-center gap-2 whitespace-nowrap shadow-md shadow-accent/20">
                <ArrowRight className="w-4 h-4" />
                Comment payer
              </button>
            </div>
          </div>

          {/* Étape 2 : instructions + boutons */}
          {step === 'info' && finalAmount && finalAmount > 0 && (
            <div className="bg-[var(--bg-base)] border border-accent/40 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-[var(--tx-1)] font-bold text-base">
                    Don de <span className="text-accent">{finalAmount.toLocaleString('fr-FR')} MAD</span>
                  </h3>
                  <p className="text-[var(--tx-4)] text-xs mt-0.5">
                    Contactez le responsable de votre zone pour effectuer le paiement
                  </p>
                </div>
              </div>

              {/* Bannière info */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/5 border border-accent/15 mb-5">
                <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-[var(--tx-3)] text-xs leading-relaxed">
                  Contactez directement le responsable de votre zone ci-dessous.
                  Les références bancaires complètes pour les virements seront disponibles prochainement.
                </p>
              </div>

              {/* Grille responsables */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {CONTACTS.map(c => (
                  <div key={c.name}
                    className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-xl overflow-hidden hover:border-accent/30 transition-colors group">
                    <div className={`px-2 py-1 text-xs font-semibold text-center border-b border-[var(--bd)] ${c.cardColor}`}>
                      {c.category}
                    </div>
                    <div className="p-2.5">
                      <Image src={c.image} alt={c.name} width={300} height={150} className="w-full h-auto rounded-lg" />
                    </div>
                    <div className="px-2.5 pb-2.5 text-center">
                      <p className="text-[var(--tx-1)] text-xs font-bold leading-tight mb-1.5">{c.name}</p>
                      <a href={`tel:${c.phone.replace(/[\s-]/g, '')}`}
                        className="inline-flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-medium hover:bg-accent/20 transition-colors">
                        <Phone className="w-3 h-3" />Appeler
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Séparateur + deux CTA */}
              <div className="pt-4 border-t border-[var(--bd)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <p className="text-[var(--tx-4)] text-xs text-center sm:text-left">
                  Vous avez effectué le paiement ? Joignez votre reçu ici.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <button onClick={openModal}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors whitespace-nowrap shadow-md shadow-accent/20">
                    <CreditCard className="w-3.5 h-3.5" />
                    Passer au paiement sans compte
                  </button>
                  <Link href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--bd)] text-[var(--tx-2)] text-sm font-medium hover:border-accent/40 hover:text-accent transition-colors whitespace-nowrap">
                    <UserPlus className="w-3.5 h-3.5" />
                    Créer un compte gratuit
                  </Link>
                </div>
              </div>

            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Modal — Paiement sans compte                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Fond sombre cliquable pour fermer */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />

          {/* Carte modale */}
          <div className="relative w-full sm:max-w-xl bg-[var(--bg-card)] border border-[var(--bd)] rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--bd)] flex-shrink-0">
              <div>
                <h3 className="text-[var(--tx-1)] font-bold text-base leading-tight">
                  Paiement sans compte
                </h3>
                <p className="text-[var(--tx-4)] text-xs mt-0.5">
                  Don de{' '}
                  <span className="text-accent font-semibold">
                    {finalAmount?.toLocaleString('fr-FR')} MAD
                  </span>
                </p>
              </div>
              <button onClick={closeModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--tx-4)] hover:text-[var(--tx-1)] hover:bg-[var(--bg-base)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corps scrollable */}
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

              {modalStep === 'success' ? (

                /* ── Succès ──────────────────────────────────────────── */
                <div className="text-center py-10">
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-[var(--tx-1)] mb-2">Reçu envoyé !</h4>
                  <p className="text-[var(--tx-3)] text-sm max-w-xs mx-auto leading-relaxed">
                    Votre paiement de{' '}
                    <span className="font-bold text-accent">
                      {finalAmount?.toLocaleString('fr-FR')} MAD
                    </span>{' '}
                    est en cours de vérification. Merci pour votre générosité !
                  </p>
                  <button onClick={closeModal}
                    className="mt-6 px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors">
                    Fermer
                  </button>
                </div>

              ) : (

                /* ── Formulaire ──────────────────────────────────────── */
                <>
                  {/* Message d'erreur */}
                  {modalError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      {modalError}
                    </div>
                  )}

                  {/* À qui envoyer */}
                  <div>
                    <p className="text-sm font-medium text-[var(--tx-2)] mb-2">
                      À qui envoyer le paiement
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CONTACTS.map(c => (
                        <div key={c.name}
                          className="bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl overflow-hidden hover:border-accent/25 transition-colors">
                          <div className={`px-2 py-0.5 text-xs font-semibold text-center border-b border-[var(--bd)] ${c.badgeBg} ${c.badgeTx}`}>
                            {c.category}
                          </div>
                          <div className="p-1.5">
                            <Image src={c.image} alt={c.name} width={300} height={150}
                              className="w-full h-auto rounded-lg" />
                          </div>
                          <div className="px-2 pb-2 text-center">
                            <p className="text-[var(--tx-1)] text-xs font-bold leading-tight mb-1.5">{c.name}</p>
                            <a href={`tel:${c.phone.replace(/[\s-]/g, '')}`}
                              className="inline-flex items-center justify-center gap-1 w-full py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-medium hover:bg-accent/20 transition-colors">
                              <Phone className="w-3 h-3" />Appeler
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mode de paiement */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                      Mode de paiement <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map(([val, label]) => (
                        <label key={val} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          payMethod === val
                            ? 'border-accent bg-accent/5'
                            : 'border-[var(--bd)] hover:border-accent/30'
                        }`}>
                          <input type="radio" name="modal-method" value={val}
                            checked={payMethod === val} onChange={() => setPayMethod(val)}
                            className="accent-accent flex-shrink-0" />
                          <span className="text-[var(--tx-1)] text-sm leading-tight">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Reçu de paiement — obligatoire */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                      Reçu de paiement <span className="text-red-400">*</span>
                      <span className="text-[var(--tx-4)] font-normal ml-1">
                        (photo / capture d&apos;écran)
                      </span>
                    </label>

                    {proofPreview ? (
                      /* Aperçu — une fois l'image choisie, l'input disparaît
                         pour éviter toute re-sélection accidentelle          */
                      <div className="relative">
                        <img src={proofPreview} alt="Reçu"
                          className="w-full max-h-48 object-contain rounded-xl border border-accent/40 bg-[var(--bg-base)]" />
                        {/* Bouton X pour changer le fichier si nécessaire */}
                        <button type="button" onClick={removeProof}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {proofFile?.name}
                        </p>
                      </div>
                    ) : converting ? (
                      <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-accent/40 rounded-xl bg-accent/5">
                        <Loader2 className="w-8 h-8 text-accent animate-spin" />
                        <p className="text-accent text-sm font-medium">Conversion en cours…</p>
                      </div>
                    ) : (
                      /* Zone de dépôt — visible uniquement si pas encore d'image */
                      <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-[var(--bd)] rounded-xl cursor-pointer hover:border-accent/50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                          <Upload className="w-5 h-5 text-accent" />
                        </div>
                        <div className="text-center">
                          <p className="text-[var(--tx-2)] text-sm font-medium">Joindre le reçu</p>
                          <p className="text-[var(--tx-4)] text-xs mt-0.5">JPG, PNG, HEIC, PDF — max 5 Mo</p>
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

                  {/* Infos optionnelles */}
                  <div>
                    <p className="text-sm font-medium text-[var(--tx-2)] mb-2">
                      Vos informations{' '}
                      <span className="text-[var(--tx-4)] font-normal">(optionnel)</span>
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-[var(--tx-4)] mb-1">Prénom</label>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                          placeholder="Jean"
                          className="w-full px-3 py-2.5 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent text-sm transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--tx-4)] mb-1">Nom</label>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                          placeholder="Dupont"
                          className="w-full px-3 py-2.5 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent text-sm transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--tx-4)] mb-1">Email ou téléphone</label>
                      <input type="text" value={contact} onChange={e => setContact(e.target.value)}
                        placeholder="jean@exemple.com ou +212 6…"
                        className="w-full px-3 py-2.5 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent text-sm transition-colors" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer modal — boutons */}
            {modalStep === 'form' && (
              <div className="flex gap-3 px-5 py-4 border-t border-[var(--bd)] flex-shrink-0 bg-[var(--bg-card)]">
                <button onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--bd)] text-[var(--tx-3)] text-sm hover:border-accent/40 transition-colors">
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={submitting || converting}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Heart className="w-4 h-4 fill-current" />
                  {submitting ? 'Envoi en cours…' : 'Confirmer le paiement'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
