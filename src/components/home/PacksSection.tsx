import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { DonationPack } from '@/types'
import { formatMAD, formatNumber } from '@/lib/utils'

type Props = { packs: DonationPack[] }

const PACK_ICONS: Record<string, string> = {
  'Pack achat 2 m²':    '🏗️',
  'Pack achat 1 m²':    '🏠',
  'Pack achat ½ m²':    '🪟',
  'Pack ciment':        '🧱',
  'Pack peinture':      '🎨',
  'Pack travaux':       '🔨',
  'Pack soutien divers':'🤝',
}

export default function PacksSection({ packs }: Props) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-accent text-sm font-semibold uppercase tracking-widest">Contribution</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--tx-1)] mt-2">Choisissez Votre Pack</h2>
          <p className="text-[var(--tx-3)] mt-3 max-w-xl mx-auto">
            Du plus modeste au plus généreux, chaque pack contribue directement à la construction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {packs.map((pack, idx) => {
            const isFeatured = idx === 0
            return (
              <div key={pack.id}
                className={`relative rounded-2xl p-6 border transition-all duration-200 group hover:-translate-y-1 ${
                  isFeatured
                    ? 'bg-gradient-to-br from-accent/15 to-accent/5 border-accent/40'
                    : 'bg-[var(--bg-card)] border-[var(--bd)] hover:border-accent/40'
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-white text-xs font-bold rounded-full">
                    Populaire
                  </div>
                )}

                <div className="text-3xl mb-4">{PACK_ICONS[pack.name] ?? '💛'}</div>
                <h3 className="text-[var(--tx-1)] font-bold text-lg mb-1">{pack.name}</h3>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-accent">{formatMAD(pack.monthly_amount)}</span>
                  <span className="text-[var(--tx-3)] text-sm">/mois</span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--tx-3)]">Coût total du pack</span>
                    <span className="text-[var(--tx-1)] font-medium">{formatMAD(pack.total_cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--tx-3)]">Donateurs attendus</span>
                    <span className="text-[var(--tx-1)] font-medium">{formatNumber(pack.expected_donors)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--tx-3)]">Objectif de collecte</span>
                    <span className="text-accent font-semibold">{formatMAD(pack.objective)}</span>
                  </div>
                </div>

                <Link
                  href={`/donate?pack=${pack.id}`}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isFeatured
                      ? 'bg-accent text-white hover:bg-accent-hover'
                      : 'bg-[var(--bg-base)] border border-[var(--bd)] text-[var(--tx-1)] hover:border-accent hover:text-accent group-hover:border-accent/60'
                  }`}
                >
                  Souscrire à ce pack
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Totals row */}
        <div className="mt-8 bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-[var(--tx-3)] text-sm mb-1">Total des packs</div>
              <div className="text-[var(--tx-1)] font-bold text-xl">{formatMAD(60400)}</div>
            </div>
            <div>
              <div className="text-[var(--tx-3)] text-sm mb-1">Mensualité totale</div>
              <div className="text-accent font-bold text-xl">{formatMAD(5034)}</div>
            </div>
            <div>
              <div className="text-[var(--tx-3)] text-sm mb-1">Donateurs attendus</div>
              <div className="text-[var(--tx-1)] font-bold text-xl">{formatNumber(400)}</div>
            </div>
            <div>
              <div className="text-[var(--tx-3)] text-sm mb-1">Objectif global</div>
              <div className="text-accent font-bold text-xl">{formatMAD(2405000)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
