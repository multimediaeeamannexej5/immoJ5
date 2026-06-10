'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, User, Phone, MapPin, Globe, Lock, Eye, EyeOff, Building2 } from 'lucide-react'
import { updateProfile, updatePassword } from './actions'
import type { Profile } from '@/types'

const COUNTRIES = [
  { code: 'MA', label: 'Maroc' },
  { code: 'FR', label: 'France' },
  { code: 'BE', label: 'Belgique' },
  { code: 'NL', label: 'Pays-Bas' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'ES', label: 'Espagne' },
  { code: 'IT', label: 'Italie' },
  { code: 'GB', label: 'Royaume-Uni' },
  { code: 'CA', label: 'Canada' },
  { code: 'US', label: 'États-Unis' },
  { code: 'SA', label: 'Arabie Saoudite' },
  { code: 'AE', label: 'Émirats Arabes Unis' },
  { code: 'QA', label: 'Qatar' },
  { code: 'SN', label: 'Sénégal' },
  { code: 'CI', label: "Côte d'Ivoire" },
  { code: 'OTHER', label: 'Autre' },
]

type Props = {
  profile: Profile | null
  email:   string
}

export default function ProfileForm({ profile, email }: Props) {
  const router   = useRouter()
  const [pending, startTransition] = useTransition()

  /* ── Infos profil ─────────────────────────────────────────────── */
  const [fullName,    setFullName]    = useState(profile?.full_name    ?? '')
  const [phone,       setPhone]       = useState(profile?.phone        ?? '')
  const [city,        setCity]        = useState(profile?.city         ?? '')
  const [country,     setCountry]     = useState(profile?.country      ?? 'MA')
  const [affiliation, setAffiliation] = useState(profile?.affiliation  ?? '')
  const [infoMsg,     setInfoMsg]     = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  /* ── Mot de passe ─────────────────────────────────────────────── */
  const [newPwd,    setNewPwd]    = useState('')
  const [confirmPwd,setConfirm]  = useState('')
  const [showPwd,   setShowPwd]  = useState(false)
  const [pwdMsg,    setPwdMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwdPending, startPwd]   = useTransition()

  function handleProfileSave() {
    setInfoMsg(null)
    startTransition(async () => {
      const res = await updateProfile({ fullName, phone, city, country, affiliation })
      if (res?.error) {
        setInfoMsg({ type: 'error', text: res.error })
      } else {
        setInfoMsg({ type: 'success', text: 'Profil mis à jour avec succès.' })
        router.refresh()
      }
    })
  }

  function handlePasswordChange() {
    setPwdMsg(null)
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (newPwd.length < 8) {
      setPwdMsg({ type: 'error', text: 'Le mot de passe doit faire au moins 8 caractères.' })
      return
    }
    startPwd(async () => {
      const res = await updatePassword(newPwd)
      if (res?.error) {
        setPwdMsg({ type: 'error', text: res.error })
      } else {
        setPwdMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' })
        setNewPwd('')
        setConfirm('')
      }
    })
  }

  return (
    <div className="space-y-8">

      {/* ── Informations personnelles ──────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-6">
        <h2 className="text-[var(--tx-1)] font-semibold mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-accent" />
          Informations personnelles
        </h2>

        {infoMsg && (
          <div className={`mb-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${
            infoMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {infoMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {infoMsg.text}
          </div>
        )}

        {/* Email (lecture seule) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--tx-2)] mb-1.5">
            Adresse e-mail
          </label>
          <input type="email" value={email} disabled
            className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-4)] text-sm cursor-not-allowed opacity-60" />
          <p className="text-[var(--tx-5)] text-xs mt-1">L&apos;e-mail ne peut pas être modifié.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Nom complet */}
          <div>
            <label className="block text-sm font-medium text-[var(--tx-2)] mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1 text-[var(--tx-4)]" />
              Nom complet
            </label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Prénom Nom"
              className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-colors text-sm" />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-[var(--tx-2)] mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1 text-[var(--tx-4)]" />
              Téléphone
            </label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+212 6 00 00 00 00"
              className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-colors text-sm" />
          </div>

          {/* Ville */}
          <div>
            <label className="block text-sm font-medium text-[var(--tx-2)] mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1 text-[var(--tx-4)]" />
              Ville
            </label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              placeholder="Casablanca, Paris…"
              className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-colors text-sm" />
          </div>

          {/* Pays */}
          <div>
            <label className="block text-sm font-medium text-[var(--tx-2)] mb-1.5">
              <Globe className="w-3.5 h-3.5 inline mr-1 text-[var(--tx-4)]" />
              Pays
            </label>
            <select value={country} onChange={e => setCountry(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] focus:outline-none focus:border-accent transition-colors text-sm">
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Affiliation */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[var(--tx-2)] mb-1.5">
              <Building2 className="w-3.5 h-3.5 inline mr-1 text-[var(--tx-4)]" />
              Affiliation
            </label>
            <select value={affiliation} onChange={e => setAffiliation(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] focus:outline-none focus:border-accent transition-colors text-sm">
              <option value="">Non renseignée</option>
              <option value="centrale">Église Centrale</option>
              <option value="j5">Annexe J5</option>
              <option value="diaspora">Diaspora</option>
            </select>
          </div>
        </div>

        <button onClick={handleProfileSave} disabled={pending}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-colors flex items-center gap-2">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>

      {/* ── Changer le mot de passe ────────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-6">
        <h2 className="text-[var(--tx-1)] font-semibold mb-5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-accent" />
          Changer le mot de passe
        </h2>

        {pwdMsg && (
          <div className={`mb-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${
            pwdMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {pwdMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {pwdMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--tx-2)] mb-1.5">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="Minimum 8 caractères"
                className="w-full px-4 py-3 pr-10 bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-colors text-sm"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tx-4)] hover:text-[var(--tx-2)] transition-colors">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tx-2)] mb-1.5">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirmPwd}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Répétez le mot de passe"
                className={`w-full px-4 py-3 pr-10 bg-[var(--bg-base)] border rounded-xl text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-accent transition-colors text-sm ${
                  confirmPwd && confirmPwd !== newPwd
                    ? 'border-red-500/50'
                    : 'border-[var(--bd)]'
                }`}
              />
              {confirmPwd && confirmPwd === newPwd && newPwd.length >= 8 && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              )}
            </div>
          </div>
        </div>

        <button onClick={handlePasswordChange} disabled={pwdPending || !newPwd}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--bd)] text-[var(--tx-1)] text-sm font-medium hover:border-accent transition-colors disabled:opacity-60 flex items-center gap-2">
          {pwdPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {pwdPending ? 'Modification…' : 'Changer le mot de passe'}
        </button>
      </div>
    </div>
  )
}
