'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle2, XCircle, AlertTriangle, Loader2, ExternalLink, FileText } from 'lucide-react'
import { formatMAD, PAYMENT_METHOD_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'
import { validateDonation, rejectDonation, markDonationOverdue } from '@/app/admin/actions'

export type DonationRow = {
  id:             string
  amount:         number
  type:           string
  payment_method: string
  status:         string
  proof_url:      string | null
  notes:          string | null
  admin_notes:    string | null
  created_at:     string
  profiles:       { full_name: string | null; is_public: boolean } | null
  donation_packs: { name: string } | null
}

type Props = {
  donation:    DonationRow
  canValidate: boolean
  onClose:     () => void
}

export default function DonationModal({ donation, canValidate, onClose }: Props) {
  const router = useRouter()
  const [note,    setNote]    = useState(donation.admin_notes ?? '')
  const [loading, setLoading] = useState<string | null>(null)
  const [done,    setDone]    = useState(false)

  // Rafraîchit la page si une action a été effectuée avant de fermer
  function handleClose() {
    if (done) router.refresh()
    onClose()
  }

  async function act(action: 'validate' | 'reject' | 'overdue') {
    setLoading(action)
    try {
      if (action === 'validate') await validateDonation(donation.id, note)
      if (action === 'reject')   await rejectDonation(donation.id, note)
      if (action === 'overdue')  await markDonationOverdue(donation.id)
      setDone(true)
    } catch (e) { console.error(e) }
    finally     { setLoading(null) }
  }

  const donorName = donation.profiles?.is_public
    ? (donation.profiles.full_name ?? 'Anonyme')
    : '🔒 Privé'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-[#14151E] border border-[#252637] rounded-2xl w-full max-w-md shadow-2xl">

        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#252637]">
          <div>
            <h2 className="text-white font-bold">Détails du don</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {new Date(donation.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* ── Status ────────────────────────────────────────── */}
          {done ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm text-center font-medium">
              ✓ Don mis à jour avec succès
            </div>
          ) : (
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[donation.status] ?? ''}`}>
              {STATUS_LABELS[donation.status] ?? donation.status}
            </span>
          )}

          {/* ── Details grid ──────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0A0B10] border border-[#252637] rounded-xl p-3">
              <div className="text-gray-500 text-xs mb-1">Donateur</div>
              <div className="text-white text-sm font-medium">{donorName}</div>
            </div>
            <div className="bg-[#0A0B10] border border-[#252637] rounded-xl p-3">
              <div className="text-gray-500 text-xs mb-1">Montant</div>
              <div className="text-accent text-sm font-bold">{formatMAD(donation.amount)}</div>
            </div>
            <div className="bg-[#0A0B10] border border-[#252637] rounded-xl p-3">
              <div className="text-gray-500 text-xs mb-1">Méthode</div>
              <div className="text-white text-sm">
                {PAYMENT_METHOD_LABELS[donation.payment_method] ?? donation.payment_method}
              </div>
            </div>
            <div className="bg-[#0A0B10] border border-[#252637] rounded-xl p-3">
              <div className="text-gray-500 text-xs mb-1">Pack</div>
              <div className="text-white text-sm">{donation.donation_packs?.name ?? '—'}</div>
            </div>
          </div>

          {/* ── Proof ─────────────────────────────────────────── */}
          {donation.proof_url && (
            <a href={donation.proof_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/25 text-accent text-sm hover:bg-accent/15 transition-colors">
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              Voir la preuve de paiement
            </a>
          )}

          {/* ── Donor note ────────────────────────────────────── */}
          {donation.notes && (
            <div className="flex items-start gap-2 p-3 bg-[#0A0B10] border border-[#252637] rounded-xl">
              <FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-400 text-sm">{donation.notes}</span>
            </div>
          )}

          {/* ── Admin actions ─────────────────────────────────── */}
          {canValidate && !done && donation.status !== 'validated' && (
            <>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Note interne (optionnel)..."
                rows={2}
                className="w-full text-sm px-3 py-2 bg-[#0A0B10] border border-[#252637] rounded-xl text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent resize-none"
              />
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => act('validate')} disabled={!!loading}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 disabled:opacity-50 transition-colors">
                  {loading === 'validate'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4" />}
                  Valider
                </button>
                <button onClick={() => act('overdue')} disabled={!!loading}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium hover:bg-orange-500/20 disabled:opacity-50 transition-colors">
                  {loading === 'overdue'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <AlertTriangle className="w-4 h-4" />}
                  Retard
                </button>
                <button onClick={() => act('reject')} disabled={!!loading}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                  {loading === 'reject'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <XCircle className="w-4 h-4" />}
                  Rejeter
                </button>
              </div>
            </>
          )}

          <button onClick={handleClose}
            className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
