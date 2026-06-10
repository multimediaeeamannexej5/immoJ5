'use client'

import { X, Phone, MapPin, Building2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { formatMAD, PAYMENT_METHOD_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'
import type { UserRow } from '@/app/admin/users/UsersClient'

const COUNTRY_LABELS: Record<string, string> = {
  MA: 'Maroc', FR: 'France', BE: 'Belgique', NL: 'Pays-Bas',
  DE: 'Allemagne', ES: 'Espagne', IT: 'Italie', GB: 'Royaume-Uni',
  CA: 'Canada', US: 'États-Unis', SA: 'Arabie Saoudite',
  AE: 'Émirats Arabes Unis', QA: 'Qatar', SN: 'Sénégal', CI: "Côte d'Ivoire",
}

const AFFILIATION_LABELS: Record<string, string> = {
  centrale: 'Église Centrale',
  j5:       'Annexe J5',
  diaspora: 'Diaspora',
}

type Props = {
  donor:   UserRow
  onClose: () => void
}

export default function DonorDetailModal({ donor, onClose }: Props) {
  const country  = donor.country ? (COUNTRY_LABELS[donor.country] ?? donor.country) : null
  const location = [donor.city, country].filter(Boolean).join(', ')

  const sorted = [...donor.donationsList].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#14151E] border border-[#252637] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="sticky top-0 bg-[#14151E] border-b border-[#252637] px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <span className="text-accent font-bold text-sm">
                {(donor.full_name ?? '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-white font-bold">{donor.full_name ?? 'Anonyme'}</h2>
              <p className="text-gray-500 text-xs">
                Inscrit le {new Date(donor.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* ── Info chips ──────────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            {donor.phone && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0B10] border border-[#252637] rounded-lg text-gray-300 text-xs">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                {donor.phone}
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0B10] border border-[#252637] rounded-lg text-gray-300 text-xs">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                {location}
              </div>
            )}
            {donor.affiliation && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0B10] border border-[#252637] rounded-lg text-gray-300 text-xs">
                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                {AFFILIATION_LABELS[donor.affiliation] ?? donor.affiliation}
              </div>
            )}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${
              donor.is_public
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-gray-500 border-gray-600/30 bg-gray-600/10'
            }`}>
              {donor.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {donor.is_public ? 'Public' : 'Anonyme'}
            </div>
          </div>

          {/* ── Stats ───────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0A0B10] border border-[#252637] rounded-xl p-3 text-center">
              <div className="text-accent font-bold text-sm">{formatMAD(donor.totalValidated)}</div>
              <div className="text-gray-500 text-xs mt-0.5">Total validé</div>
            </div>
            <div className="bg-[#0A0B10] border border-[#252637] rounded-xl p-3 text-center">
              <div className="text-yellow-400 font-bold">{donor.pendingCount}</div>
              <div className="text-gray-500 text-xs mt-0.5">En attente</div>
            </div>
            <div className="bg-[#0A0B10] border border-[#252637] rounded-xl p-3 text-center">
              <div className="text-red-400 font-bold">{donor.rejectedCount}</div>
              <div className="text-gray-500 text-xs mt-0.5">Rejetés</div>
            </div>
          </div>

          {/* ── Pack progression ─────────────────────────────── */}
          {donor.packName && (
            <div className="bg-[#0A0B10] border border-[#252637] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">{donor.packName}</span>
                <span className="text-accent font-bold text-sm">{donor.progressPct ?? 0}%</span>
              </div>
              {donor.packTotal && (
                <>
                  <div className="h-1.5 bg-[#252637] rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${donor.progressPct ?? 0}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatMAD(donor.totalValidated)} versés</span>
                    <span>sur {formatMAD(donor.packTotal)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Donation history ─────────────────────────────── */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">
              Historique des dons
              <span className="ml-2 text-gray-600 font-normal text-xs">({sorted.length})</span>
            </h3>

            {sorted.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">Aucun don enregistré.</p>
            ) : (
              <div className="space-y-2">
                {sorted.map(d => (
                  <div key={d.id}
                    className="flex items-center justify-between p-3 bg-[#0A0B10] border border-[#252637] rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs border flex-shrink-0 ${STATUS_COLORS[d.status] ?? ''}`}>
                        {STATUS_LABELS[d.status] ?? d.status}
                      </span>
                      <span className="text-gray-500 text-xs truncate">
                        {PAYMENT_METHOD_LABELS[d.payment_method] ?? d.payment_method}
                      </span>
                      {d.proof_url && (
                        <a href={d.proof_url} target="_blank" rel="noopener noreferrer"
                          title="Voir la preuve"
                          className="text-accent hover:text-accent/70 flex-shrink-0">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-accent font-semibold text-sm">{formatMAD(d.amount)}</div>
                      <div className="text-gray-600 text-xs">
                        {new Date(d.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
