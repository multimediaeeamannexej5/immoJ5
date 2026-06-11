'use client'

import { useState } from 'react'
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown,
  Loader2, FileText, ExternalLink, ImageOff,
} from 'lucide-react'
import { validateDonation, rejectDonation, markDonationOverdue } from '../admin/actions'

type Props = {
  donationId:    string
  currentStatus: string
  adminNotes:    string
  notes:         string
  proofUrl:      string
}

/* Vérifie si l'URL pointe vers un fichier affichable dans le navigateur */
function isRenderableImage(url: string) {
  const lower = url.toLowerCase().split('?')[0]
  return /\.(jpe?g|png|webp|gif|svg)$/.test(lower)
}

export default function TreasurerDonationActions({
  donationId, currentStatus, adminNotes, notes, proofUrl,
}: Props) {
  const [open,      setOpen]      = useState(false)
  const [note,      setNote]      = useState(adminNotes)
  const [loading,   setLoading]   = useState<string | null>(null)
  const [done,      setDone]      = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  async function act(action: 'validate' | 'reject' | 'overdue') {
    setLoading(action)
    try {
      if (action === 'validate') await validateDonation(donationId, note)
      if (action === 'reject')   await rejectDonation(donationId, note)
      if (action === 'overdue')  await markDonationOverdue(donationId)
      setDone(true)
      setOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  if (done) return <span className="text-gray-500 text-xs italic">Mis à jour</span>
  if (currentStatus === 'validated') return <span className="text-emerald-400 text-xs">✓ Validé</span>

  /* proxyUrl masque l'URL Supabase — seul /api/proof?id=... est visible */
  const proxyUrl   = `/api/proof?id=${donationId}`
  const showInline = proofUrl && !imgFailed && isRenderableImage(proofUrl)

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0A0B10] border border-[#252637] text-gray-300 text-xs hover:border-accent/40 transition-colors">
        Actions <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-72 bg-[#14151E] border border-[#252637] rounded-xl shadow-xl p-3">

          {/* ── Reçu de paiement ────────────────────────────────── */}
          {proofUrl && (
            <div className="mb-3">
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                Reçu de paiement
              </p>

              {showInline ? (
                /* Aperçu inline via proxy — URL Supabase masquée */
                <div className="rounded-lg overflow-hidden border border-[#252637] bg-[#0A0B10] mb-1.5">
                  <img
                    src={proxyUrl}
                    alt="Reçu de paiement"
                    className="w-full max-h-48 object-contain"
                    onError={() => setImgFailed(true)}
                  />
                </div>
              ) : (
                /* Fallback : PDF ou image échouée */
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0A0B10] border border-[#252637] mb-1.5">
                  <ImageOff className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-400 text-xs">
                    {imgFailed
                      ? 'Format non prévisualisable (PDF)'
                      : 'Fichier non prévisualisable'}
                  </span>
                </div>
              )}

              {/* Lien ouvrir dans un onglet — via proxy */}
              <a href={proxyUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-accent hover:underline">
                <ExternalLink className="w-3.5 h-3.5" />
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          )}

          {/* ── Note donateur ────────────────────────────────────── */}
          {notes && (
            <div className="mb-3 p-2 bg-[#0A0B10] rounded-lg border border-[#252637]">
              <div className="flex items-start gap-1.5 text-xs text-gray-400">
                <FileText className="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-500" />
                <span className="break-all">{notes}</span>
              </div>
            </div>
          )}

          {/* ── Note trésorier ───────────────────────────────────── */}
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note interne (optionnel)..."
            rows={2}
            className="w-full text-xs px-2 py-1.5 bg-[#0A0B10] border border-[#252637] rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent resize-none mb-3"
          />

          {/* ── Boutons d'action ─────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={() => act('validate')} disabled={!!loading}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs transition-colors disabled:opacity-50">
              {loading === 'validate'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCircle2 className="w-3.5 h-3.5" />}
              Valider
            </button>
            <button onClick={() => act('overdue')} disabled={!!loading}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs transition-colors disabled:opacity-50">
              {loading === 'overdue'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <AlertTriangle className="w-3.5 h-3.5" />}
              Retard
            </button>
            <button onClick={() => act('reject')} disabled={!!loading}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs transition-colors disabled:opacity-50">
              {loading === 'reject'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <XCircle className="w-3.5 h-3.5" />}
              Rejeter
            </button>
          </div>

          <button onClick={() => setOpen(false)}
            className="w-full mt-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Fermer
          </button>
        </div>
      )}
    </div>
  )
}
