'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { formatMAD, STATUS_LABELS, STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import DonationModal from './DonationModal'
import type { DonationRow } from './DonationModal'

export type { DonationRow }

type Props = {
  donations:   DonationRow[]
  canValidate: boolean
  monthLabel:  string
}

const TABS = [
  { key: 'all',       label: 'Tous' },
  { key: 'pending',   label: 'En attente' },
  { key: 'validated', label: 'Validés' },
  { key: 'overdue',   label: 'En retard' },
  { key: 'rejected',  label: 'Rejetés' },
] as const

type TabKey = typeof TABS[number]['key']

export default function DonationsClient({ donations, canValidate, monthLabel }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>(canValidate ? 'pending' : 'all')
  const [selected,  setSelected]  = useState<DonationRow | null>(null)

  const pendingCount = donations.filter(d => d.status === 'pending').length

  const filtered = activeTab === 'all'
    ? donations
    : donations.filter(d => d.status === activeTab)

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {canValidate ? 'Validation des dons' : 'Dons du mois'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {monthLabel} — {donations.length} don{donations.length > 1 ? 's' : ''}
          {pendingCount > 0 && (
            <> · <span className="text-yellow-400 font-medium">{pendingCount} en attente</span></>
          )}
        </p>
      </div>

      {/* ── Status tabs ────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map(tab => {
          const count = tab.key === 'all'
            ? donations.length
            : donations.filter(d => d.status === tab.key).length
          if (count === 0 && tab.key !== 'all') return null
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

      {/* ── List ───────────────────────────────────────────── */}
      <div className="bg-[#14151E] border border-[#252637] rounded-2xl overflow-hidden">
        {!filtered.length ? (
          <div className="py-16 text-center">
            <CreditCard className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Aucun don dans cette catégorie.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#252637]">
            {filtered.map(d => {
              const donorName = d.profiles?.is_public
                ? (d.profiles.full_name ?? 'Anonyme')
                : '🔒 Privé'
              const initial = d.profiles?.is_public && d.profiles.full_name
                ? d.profiles.full_name[0].toUpperCase()
                : '?'

              return (
                <div key={d.id}
                  onClick={() => setSelected(d)}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#1E1F2E] transition-colors cursor-pointer group">

                  {/* Left: avatar + donor info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent text-xs font-bold">{initial}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium">{donorName}</div>
                      <div className="text-gray-500 text-xs mt-0.5 flex items-center gap-2">
                        <span>{PAYMENT_METHOD_LABELS[d.payment_method] ?? d.payment_method}</span>
                        {d.donation_packs?.name && (
                          <>
                            <span className="text-gray-700">·</span>
                            <span className="truncate">{d.donation_packs.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: status + amount + arrow */}
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[d.status] ?? ''}`}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                    <div className="text-right">
                      <div className="text-accent font-bold text-sm">{formatMAD(d.amount)}</div>
                      <div className="text-gray-600 text-xs">
                        {new Date(d.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <span className="text-gray-600 group-hover:text-accent transition-colors">›</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────── */}
      {selected && (
        <DonationModal
          donation={selected}
          canValidate={canValidate}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
