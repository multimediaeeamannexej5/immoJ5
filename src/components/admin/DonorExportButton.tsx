'use client'

import { Download } from 'lucide-react'

export type DonorExportRow = {
  full_name:      string | null
  phone:          string | null
  city:           string | null
  country:        string | null
  affiliation?:   string | null
  created_at:     string
  totalValidated: number
  validatedCount: number
  is_public:      boolean
}

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

export default function DonorExportButton({ donors }: { donors: DonorExportRow[] }) {
  function download() {
    const header = [
      'Nom', 'Téléphone', 'Ville', 'Pays', 'Affiliation',
      'Inscrit le', 'Total validé (MAD)', 'Dons validés', 'Visibilité',
    ]
    const rows = donors.map(d => [
      d.full_name    ?? '',
      d.phone        ?? '',
      d.city         ?? '',
      d.country      ? (COUNTRY_LABELS[d.country]      ?? d.country)      : '',
      d.affiliation  ? (AFFILIATION_LABELS[d.affiliation] ?? d.affiliation) : '',
      new Date(d.created_at).toLocaleDateString('fr-FR'),
      String(d.totalValidated),
      String(d.validatedCount),
      d.is_public ? 'Public' : 'Anonyme',
    ])

    const csv = [header, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const bom  = '﻿'  // BOM UTF-8 pour Excel
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `donateurs_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={download}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14151E] border border-[#252637] text-gray-300 text-sm hover:text-white hover:border-accent/40 transition-colors">
      <Download className="w-4 h-4" />
      Télécharger CSV ({donors.length})
    </button>
  )
}
