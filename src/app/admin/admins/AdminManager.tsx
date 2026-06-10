'use client'

import { useState } from 'react'
import { Plus, Trash2, Key, Loader2, ShieldCheck, X, Copy, Check, Eye, EyeOff, RefreshCw, Mail } from 'lucide-react'
import type { AdminUser } from '@/types'
import { createAdminAccount, deleteAdminAccount, resetAdminPassword, updateAdminRole } from '../actions'

/* ── Génération de mot de passe ──────────────────────────────────── */
function generatePassword(): string {
  // Lettres et chiffres sans ambiguïtés (O/0, I/l/1)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*'
  let pwd = ''
  for (let i = 0; i < 14; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

const ROLE_LABELS = {
  super_admin:           'Super Admin',
  finance_manager:       'Finance Manager',
  communication_manager: 'Communication Manager',
  treasurer:             'Trésorier',
}

const ROLE_COLORS = {
  super_admin:           'text-accent bg-accent/10 border-accent/30',
  finance_manager:       'text-blue-400 bg-blue-500/10 border-blue-500/30',
  communication_manager: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  treasurer:             'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
}

type Role = 'finance_manager' | 'communication_manager' | 'treasurer'
type Props = { admins: AdminUser[]; currentUserId: string }

/* ── Composant "Copier" ──────────────────────────────────────────── */
function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        copied
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          : 'bg-[#0A0B10] border-[#252637] text-gray-300 hover:border-accent/40 hover:text-white'
      }`}>
      {copied ? <><Check className="w-3.5 h-3.5" /> Copié !</> : <><Copy className="w-3.5 h-3.5" /> {label}</>}
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
export default function AdminManager({ admins: initialAdmins, currentUserId }: Props) {
  const [admins,     setAdmins]     = useState(initialAdmins)
  const [showCreate, setShowCreate] = useState(false)
  const [loading,    setLoading]    = useState<string | null>(null)
  const [error,      setError]      = useState('')

  /* Formulaire création */
  const [form, setForm] = useState({ email: '', fullName: '', role: 'treasurer' as Role })

  /* Succès création */
  const [createdInfo, setCreatedInfo] = useState<{ name: string; email: string; pwd: string } | null>(null)
  const [showPwd, setShowPwd] = useState(false)

  /* Reset mot de passe */
  const [resetTarget,    setResetTarget]    = useState<AdminUser | null>(null)
  const [generatedReset, setGeneratedReset] = useState('')
  const [manualReset,    setManualReset]    = useState('')
  const [showResetPwd,   setShowResetPwd]   = useState(false)
  const resetPassword = generatedReset || manualReset

  /* ── Création ─────────────────────────────────────────────────── */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading('create')

    const pwd = generatePassword()

    try {
      await createAdminAccount({ ...form, password: pwd })
      setCreatedInfo({ name: form.fullName, email: form.email, pwd })
      setShowCreate(false)
      setForm({ email: '', fullName: '', role: 'treasurer' })
      window.location.reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur création')
    } finally {
      setLoading(null)
    }
  }

  /* ── Suppression ──────────────────────────────────────────────── */
  async function handleDelete(adminId: string) {
    if (!confirm('Supprimer cet admin ? Cette action est irréversible.')) return
    setLoading(`del-${adminId}`)
    try {
      await deleteAdminAccount(adminId)
      setAdmins(prev => prev.filter(a => a.id !== adminId))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur suppression')
    } finally {
      setLoading(null)
    }
  }

  /* ── Changement de rôle ───────────────────────────────────────── */
  async function handleRoleChange(adminId: string, role: Role) {
    setLoading(`role-${adminId}`)
    try {
      await updateAdminRole(adminId, role)
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, role } : a))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur mise à jour rôle')
    } finally {
      setLoading(null)
    }
  }

  /* ── Reset mot de passe ───────────────────────────────────────── */
  function openReset(admin: AdminUser) {
    setResetTarget(admin)
    setGeneratedReset(generatePassword())   // pré-générer dès l'ouverture
    setManualReset('')
    setShowResetPwd(false)
  }

  async function handleResetPassword() {
    if (!resetTarget || !resetPassword) return
    setLoading(`pwd-${resetTarget.id}`)
    try {
      await resetAdminPassword(resetTarget.id, resetPassword)
      setResetTarget(null)
      setGeneratedReset('')
      setManualReset('')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur reset')
    } finally {
      setLoading(null)
    }
  }

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-gray-400 text-sm">{admins.length} compte(s)</span>
        <button
          onClick={() => { setShowCreate(!showCreate); setError('') }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-colors">
          <Plus className="w-4 h-4" />
          Créer un admin
        </button>
      </div>

      {/* ── Formulaire création ───────────────────────────────── */}
      {showCreate && (
        <div className="bg-[#14151E] border border-[#252637] rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Nouveau compte admin</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {error && (
              <div className="sm:col-span-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <input
              required value={form.fullName}
              onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
              placeholder="Nom complet *"
              className="px-3 py-2.5 bg-[#0A0B10] border border-[#252637] rounded-xl text-white text-sm focus:outline-none focus:border-accent"
            />
            <input
              type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="Email *"
              className="px-3 py-2.5 bg-[#0A0B10] border border-[#252637] rounded-xl text-white text-sm focus:outline-none focus:border-accent"
            />

            <select
              value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))}
              className="px-3 py-2.5 bg-[#0A0B10] border border-[#252637] rounded-xl text-white text-sm focus:outline-none focus:border-accent">
              <option value="treasurer">Trésorier</option>
              <option value="finance_manager">Finance Manager</option>
              <option value="communication_manager">Communication Manager</option>
            </select>

            {/* Info mot de passe auto */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-accent/5 border border-accent/20 rounded-xl">
              <Key className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-accent text-xs">Mot de passe généré automatiquement</span>
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#252637] text-gray-400 text-sm hover:border-accent transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={loading === 'create'}
                className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {loading === 'create' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Créer le compte
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Liste des admins ──────────────────────────────────── */}
      <div className="bg-[#14151E] border border-[#252637] rounded-2xl divide-y divide-[#252637]">
        {admins.map(admin => (
          <div key={admin.id} className="p-5 flex flex-wrap items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-accent" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-medium text-sm">{admin.full_name ?? '—'}</span>
                {admin.id === currentUserId && (
                  <span className="text-xs text-gray-500 italic">(vous)</span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs border ${ROLE_COLORS[admin.role]}`}>
                  {ROLE_LABELS[admin.role]}
                </span>
              </div>
              <div className="text-gray-500 text-xs mt-0.5">
                Créé le {new Date(admin.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>

            {admin.id !== currentUserId && admin.role !== 'super_admin' && (
              <div className="flex items-center gap-2">
                <select
                  value={admin.role}
                  onChange={e => handleRoleChange(admin.id, e.target.value as Role)}
                  disabled={loading === `role-${admin.id}`}
                  className="px-2 py-1.5 bg-[#0A0B10] border border-[#252637] rounded-lg text-gray-300 text-xs focus:outline-none focus:border-accent disabled:opacity-50">
                  <option value="treasurer">Trésorier</option>
                  <option value="finance_manager">Finance</option>
                  <option value="communication_manager">Communication</option>
                </select>

                <button onClick={() => openReset(admin)}
                  className="p-1.5 rounded-lg bg-[#0A0B10] border border-[#252637] text-yellow-400 hover:border-yellow-500/30 transition-colors"
                  title="Réinitialiser mot de passe">
                  <Key className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => handleDelete(admin.id)}
                  disabled={loading === `del-${admin.id}`}
                  className="p-1.5 rounded-lg bg-[#0A0B10] border border-[#252637] text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
                  title="Supprimer">
                  {loading === `del-${admin.id}`
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          MODAL — Succès création (affiche le mot de passe)
      ════════════════════════════════════════════════════════════ */}
      {createdInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md bg-[#14151E] border border-[#252637] rounded-2xl p-7">
            {/* En-tête */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Compte créé !</h3>
                <p className="text-gray-400 text-xs">{createdInfo.name}</p>
              </div>
            </div>

            {/* Identifiants */}
            <div className="space-y-3 mb-5">
              <div className="bg-[#0A0B10] border border-[#252637] rounded-xl p-4">
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Email</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white text-sm font-mono">{createdInfo.email}</span>
                  <CopyButton text={createdInfo.email} />
                </div>
              </div>

              <div className="bg-[#0A0B10] border border-accent/30 rounded-xl p-4">
                <p className="text-accent text-xs uppercase tracking-widest mb-1">Mot de passe généré</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white text-sm font-mono tracking-wider">
                    {showPwd ? createdInfo.pwd : '• '.repeat(7).trim()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowPwd(!showPwd)} type="button"
                      className="p-1.5 rounded-lg bg-[#252637] text-gray-400 hover:text-white transition-colors">
                      {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <CopyButton text={createdInfo.pwd} label="Copier le mot de passe" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 mb-5">
              ⚠ Communiquez ces identifiants à l&apos;intéressé(e). Il/Elle pourra changer le mot de passe depuis son profil.
            </p>

            {/* Envoyer par email */}
            <button
              type="button"
              onClick={() => {
                const site  = window.location.origin
                const subj  = encodeURIComponent('Vos identifiants — EEAM Annexe J5')
                const body  = encodeURIComponent(
                  `Bonjour ${createdInfo.name},\n\n` +
                  `Voici vos identifiants pour accéder au tableau de bord EEAM Annexe J5 :\n\n` +
                  `Email        : ${createdInfo.email}\n` +
                  `Mot de passe : ${createdInfo.pwd}\n\n` +
                  `Lien de connexion : ${site}/annexeJ5\n\n` +
                  `Nous vous conseillons de changer votre mot de passe dès votre première connexion (menu Profil).\n\n` +
                  `Cordialement,\nL'équipe EEAM Annexe J5`
                )
                window.location.href = `mailto:${createdInfo.email}?subject=${subj}&body=${body}`
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors mb-3"
            >
              <Mail className="w-4 h-4" />
              Envoyer les identifiants par email
            </button>

            <button onClick={() => { setCreatedInfo(null); setShowPwd(false) }}
              className="w-full py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL — Réinitialiser mot de passe
      ════════════════════════════════════════════════════════════ */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setResetTarget(null)} />
          <div className="relative w-full max-w-sm bg-[#14151E] border border-[#252637] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
              <Key className="w-4 h-4 text-accent" />
              Réinitialiser le mot de passe
            </h3>
            <p className="text-gray-500 text-xs mb-5">{resetTarget.full_name}</p>

            {/* Mot de passe généré */}
            <div className="bg-[#0A0B10] border border-accent/30 rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-accent text-xs uppercase tracking-widest">Mot de passe généré</p>
                <button onClick={() => { setGeneratedReset(generatePassword()); setManualReset('') }}
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#252637] text-gray-400 hover:text-white text-xs transition-colors">
                  <RefreshCw className="w-3 h-3" /> Regénérer
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white text-sm font-mono tracking-wider">
                  {showResetPwd ? generatedReset : '• '.repeat(7).trim()}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setShowResetPwd(!showResetPwd)} type="button"
                    className="p-1.5 rounded-lg bg-[#252637] text-gray-400 hover:text-white transition-colors">
                    {showResetPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <CopyButton text={generatedReset} />
                </div>
              </div>
            </div>

            {/* OU saisie manuelle */}
            <div className="mb-4">
              <p className="text-gray-500 text-xs mb-2">Ou saisir manuellement :</p>
              <input
                type="password"
                value={manualReset}
                onChange={e => { setManualReset(e.target.value); setGeneratedReset('') }}
                placeholder="Minimum 8 caractères"
                className="w-full px-3 py-2.5 bg-[#0A0B10] border border-[#252637] rounded-xl text-white text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-3 mb-3">
              <button onClick={() => setResetTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#252637] text-gray-400 text-sm hover:border-accent transition-colors">
                Annuler
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!resetPassword || resetPassword.length < 8 || !!loading}
                className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {loading?.startsWith('pwd') && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirmer
              </button>
            </div>

            {/* Envoyer le nouveau mot de passe par email */}
            {resetTarget && (
              <button
                type="button"
                onClick={() => {
                  const site = window.location.origin
                  const subj = encodeURIComponent('Réinitialisation de votre mot de passe — EEAM Annexe J5')
                  const body = encodeURIComponent(
                    `Bonjour ${resetTarget.full_name ?? ''},\n\n` +
                    `Votre mot de passe a été réinitialisé.\n\n` +
                    `Email        : ${resetTarget.full_name}\n` +
                    `Nouveau mot de passe : ${resetPassword}\n\n` +
                    `Lien de connexion : ${site}/annexeJ5\n\n` +
                    `Pensez à le changer depuis votre profil.\n\n` +
                    `Cordialement,\nL'équipe EEAM Annexe J5`
                  )
                  window.location.href = `mailto:?subject=${subj}&body=${body}`
                }}
                disabled={!resetPassword || resetPassword.length < 8}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/20 disabled:opacity-40 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Envoyer le nouveau mot de passe par email
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
