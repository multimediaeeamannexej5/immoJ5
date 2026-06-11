'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import DonorExportButton from '@/components/admin/DonorExportButton'
import DonorDetailModal from '@/components/admin/DonorDetailModal'
import type { DonorExportRow } from '@/components/admin/DonorExportButton'

/* ── Types ───────────────────────────────────────────────────────── */
type Affiliation = 'centrale' | 'j5' | 'diaspora'

export type DonorDonation = {
  id:             string
  amount:         number
  status:         string
  payment_method: string
  created_at:     string
  notes:          string | null
  proof_url:      string | null
}

export type UserRow = {
  id:             string
  full_name:      string | null
  phone:          string | null
  city:           string | null
  country:        string | null
  affiliation:    Affiliation | null
  is_public:      boolean
  created_at:     string
  totalValidated: number
  validatedCount: number
  pendingCount:   number
  rejectedCount:  number
  packName:       string | null
  packTotal:      number | null
  progressPct:    number | null
  donationsList:  DonorDonation[]
  hasOverdue:     boolean
  paidThisMonth:  boolean
}

/* ── Constants ───────────────────────────────────────────────────── */
const AFFILIATION_LABELS: Record<Affiliation, string> = {
  centrale: 'Église Centrale',
  j5:       'Annexe J5',
  diaspora: 'Diaspora',
}

const AFFILIATION_COLORS: Record<Affiliation, string> = {
  centrale: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  j5:       'text-accent bg-accent/10 border-accent/30',
  diaspora: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
}

const TABS = [
  { key: 'all',      label: 'Tous' },
  { key: 'centrale', label: 'Église Centrale' },
  { key: 'j5',       label: 'Annexe J5' },
  { key: 'diaspora', label: 'Diaspora' },
  { key: 'none',     label: 'Non renseignée' },
] as const

type TabKey = typeof TABS[number]['key']

/* ── Component ───────────────────────────────────────────────────── */
export default function UsersClient({ rows }: { rows: UserRow[] }) {
  const [activeTab,    setActiveTab]    = useState<TabKey>('all')
  const [selected,     setSelected]     = useState<UserRow | null>(null)

  const filtered = activeTab === 'all'
    ? rows
    : activeTab === 'none'
    ? rows.filter(p => !p.affiliation)
    : rows.filter(p => p.affiliation === activeTab)

  const exportData: DonorExportRow[] = filtered.map(p => ({
    full_name:      p.full_name,
    phone:          p.phone,
    city:           p.city,
    country:        p.country,
    affiliation:    p.affiliation,
    created_at:     p.created_at,
    totalValidated: p.totalValidated,
    validatedCount: p.validatedCount,
    is_public:      p.is_public,
  }))

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Donateurs</h1>
          <p className="text-gray-400 text-sm mt-1">{rows.length} inscrit{rows.length > 1 ? 's' : ''}</p>
        </div>
        <DonorExportButton donors={exportData} />
      </div>

      {/* ── Affiliation tabs ──────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map(tab => {
          const count = tab.key === 'all'      ? rows.length
            : tab.key === 'none'   ? rows.filter(p => !p.affiliation).length
            : rows.filter(p => p.affiliation === tab.key).length
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                activeTab === tab.key
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'bg-[#14151E] text-gray-400 border-[#252637] hover:text-white hover:border-accent/20'
              }`}>
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── List ──────────────────────────────────────────── */}
      <div className="bg-[#14151E] border border-[#252637] rounded-2xl overflow-hidden">
        {!filtered.length ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Aucun donateur dans cette catégorie.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#252637]">
            {filtered.map(p => (
              <div key={p.id}
                onClick={() => setSelected(p)}
                className="flex items-center justify-between px-5 py-4 hover:bg-[#1E1F2E] transition-colors cursor-pointer group">

                {/* Left: avatar + name + phone */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent text-xs font-bold">
                      {(p.full_name ?? '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium">{p.full_name ?? '—'}</div>
                    {p.phone && (
                      <div className="text-gray-500 text-xs mt-0.5">{p.phone}</div>
                    )}
                  </div>
                </div>

                {/* Right: affiliation + status badges + arrow */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {p.affiliation ? (
                    <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${AFFILIATION_COLORS[p.affiliation]}`}>
                      {AFFILIATION_LABELS[p.affiliation]}
                    </span>
                  ) : (
                    <span className="hidden sm:inline text-gray-600 text-xs">—</span>
                  )}
                  {/* Indicateurs de paiement */}
                  {p.hasOverdue && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/15 border border-orange-500/30 text-orange-400 whitespace-nowrap">
                      Retard
                    </span>
                  )}
                  {p.paidThisMonth && !p.hasOverdue && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 whitespace-nowrap">
                      Payé ce mois
                    </span>
                  )}
                  {p.pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 whitespace-nowrap">
                      {p.pendingCount} en attente
                    </span>
                  )}
                  <span className="text-gray-600 group-hover:text-accent transition-colors">›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Donor detail modal ────────────────────────────── */}
      {selected && (
        <DonorDetailModal
          donor={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
