'use client'

import { useState } from 'react'
import { CreditCard, Download } from 'lucide-react'
import { formatMAD, STATUS_LABELS, STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import DonationModal from './DonationModal'
import type { DonationRow } from './DonationModal'

export type { DonationRow }

type Props = {
  donations:   DonationRow[]
  canValidate: boolean
  monthLabel:  string
}

const STATUS_TABS = [
  { key: 'all',       label: 'Tous' },
  { key: 'pending',   label: 'En attente' },
  { key: 'validated', label: 'Validés' },
  { key: 'overdue',   label: 'En retard' },
  { key: 'rejected',  label: 'Rejetés' },
] as const

const AFFILIATION_TABS = [
  { key: 'all',      label: 'Toutes' },
  { key: 'centrale', label: 'Centrale' },
  { key: 'j5',       label: 'Annexe J5' },
  { key: 'diaspora', label: 'Diaspora' },
  { key: 'none',     label: 'Non renseignée' },
] as const

type StatusTabKey = typeof STATUS_TABS[number]['key']
type AffTabKey    = typeof AFFILIATION_TABS[number]['key']

type DonationRowWithAff = DonationRow & {
  profiles?: { full_name: string | null; is_public: boolean; affiliation?: string | null } | null
}

/* ── CSV export ─────────────────────────────────────────────────────────── */
function exportCSV(rows: DonationRowWithAff[]) {
  const header = ['Date','Donateur','Affiliation','Pack','Montant','Statut','Mode paiement']
  const lines  = rows.map(d => [
    new Date(d.created_at).toLocaleDateString('fr-FR'),
    d.profiles?.is_public ? (d.profiles.full_name ?? 'Anonyme') : 'Privé',
    d.profiles?.affiliation ?? '',
    d.donation_packs?.name ?? '',
    Number(d.amount).toFixed(2),
    STATUS_LABELS[d.status] ?? d.status,
    PAYMENT_METHOD_LABELS[d.payment_method] ?? d.payment_method,
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))

  const csv  = [header.join(','), ...lines].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `dons_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DonationsClient({ donations, canValidate, monthLabel }: Props) {
  const [statusTab, setStatusTab] = useState<StatusTabKey>(canValidate ? 'pending' : 'all')
  const [affTab,    setAffTab]    = useState<AffTabKey>('all')
  const [selected,  setSelected]  = useState<DonationRow | null>(null)

  const pendingCount = donations.filter(d => d.status === 'pending').length

  const filtered = (donations as DonationRowWithAff[]).filter(d => {
    const statusMatch = statusTab === 'all' || d.status === statusTab
    const affMatch    = affTab === 'all'
      ? true
      : affTab === 'none'
      ? !d.profiles?.affiliation
      : d.profiles?.affiliation === affTab
    return statusMatch && affMatch
  })

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {canValidate ? 'Validation des dons' : 'Liste des dons'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {canValidate ? `${monthLabel} — ` : ''}{donations.length} don{donations.length > 1 ? 's' : ''}
            {pendingCount > 0 && (
              <> · <span className="text-yellow-400 font-medium">{pendingCount} en attente</span></>
            )}
          </p>
        </div>
        {/* Export CSV */}
        <button
          onClick={() => exportCSV(filtered)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14151E] border border-[#252637] text-gray-300 text-sm hover:border-accent/40 hover:text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Télécharger CSV
        </button>
      </div>

      {/* ── Affiliation tabs ────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-3">
        {AFFILIATION_TABS.map(tab => {
          const count = tab.key === 'all'
            ? donations.length
            : tab.key === 'none'
            ? (donations as DonationRowWithAff[]).filter(d => !d.profiles?.affiliation).length
            : (donations as DonationRowWithAff[]).filter(d => d.profiles?.affiliation === tab.key).length
          return (
            <button key={tab.key} onClick={() => setAffTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                affTab === tab.key
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'bg-[#14151E] text-gray-500 border-[#252637] hover:text-gray-300 hover:border-accent/20'
              }`}>
              {tab.label}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── Status tabs ────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_TABS.map(tab => {
          const base = affTab === 'all'
            ? donations
            : affTab === 'none'
            ? (donations as DonationRowWithAff[]).filter(d => !d.profiles?.affiliation)
            : (donations as DonationRowWithAff[]).filter(d => d.profiles?.affiliation === affTab)
          const count = tab.key === 'all'
            ? base.length
            : base.filter(d => d.status === tab.key).length
          if (count === 0 && tab.key !== 'all') return null
          return (
            <button key={tab.key} onClick={() => setStatusTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                statusTab === tab.key
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

                  {/* Left */}
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

                  {/* Right */}
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
