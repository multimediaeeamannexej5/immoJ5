'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, Loader2, FileText, Link2 } from 'lucide-react'
import { validateDonation, rejectDonation, markDonationOverdue } from '../actions'

type Props = {
  donationId:    string
  currentStatus: string
  adminNotes:    string
  notes:         string
  proofUrl:      string
  readOnly?:     boolean
}

export default function DonationActions({ donationId, currentStatus, adminNotes, notes, proofUrl, readOnly }: Props) {
  const [open,    setOpen]    = useState(false)
  const [note,    setNote]    = useState(adminNotes)
  const [loading, setLoading] = useState<string | null>(null)
  const [done,    setDone]    = useState(false)

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

  // Finance Manager: view-only, no action buttons
  if (readOnly) {
    return (
      <div className="flex items-center gap-2">
        {(notes || proofUrl) && (
          <div className="flex items-center gap-1.5">
            {notes && (
              <span title={notes} className="text-gray-500 text-xs truncate max-w-[80px]">{notes}</span>
            )}
            {proofUrl && (
              <a href={proofUrl} target="_blank" rel="noopener noreferrer"
                className="text-accent text-xs hover:underline flex items-center gap-0.5">
                <Link2 className="w-3 h-3" /> Preuve
              </a>
            )}
          </div>
        )}
        {!notes && !proofUrl && <span className="text-gray-600 text-xs">—</span>}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0A0B10] border border-[#252637] text-gray-300 text-xs hover:border-accent/40 transition-colors"
      >
        Actions <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-64 bg-[#14151E] border border-[#252637] rounded-xl shadow-xl p-3">
          {/* Infos */}
          {(notes || proofUrl) && (
            <div className="mb-3 p-2 bg-[#0A0B10] rounded-lg border border-[#252637] space-y-1">
              {notes && (
                <div className="flex items-start gap-1.5 text-xs text-gray-400">
                  <FileText className="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-500" />
                  <span className="truncate">{notes}</span>
                </div>
              )}
              {proofUrl && (
                <a href={proofUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-accent hover:underline">
                  <Link2 className="w-3 h-3" />
                  Voir la preuve
                </a>
              )}
            </div>
          )}

          {/* Note admin */}
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note interne (optionnel)..."
            rows={2}
            className="w-full text-xs px-2 py-1.5 bg-[#0A0B10] border border-[#252637] rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent resize-none mb-3"
          />

          {/* Actions */}
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={() => act('validate')} disabled={!!loading}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs transition-colors disabled:opacity-50">
              {loading === 'validate'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCircle2 className="w-3.5 h-3.5" />
              }
              Valider
            </button>
            <button onClick={() => act('overdue')} disabled={!!loading}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs transition-colors disabled:opacity-50">
              {loading === 'overdue'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <AlertTriangle className="w-3.5 h-3.5" />
              }
              Retard
            </button>
            <button onClick={() => act('reject')} disabled={!!loading}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs transition-colors disabled:opacity-50">
              {loading === 'reject'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <XCircle className="w-3.5 h-3.5" />
              }
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
