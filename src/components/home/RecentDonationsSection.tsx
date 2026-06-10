import { Clock, CheckCircle2 } from 'lucide-react'
import type { Donation } from '@/types'
import { formatMAD, timeAgo } from '@/lib/utils'

type Props = { donations: Donation[] }

export default function RecentDonationsSection({ donations }: Props) {
  if (donations.length === 0) return null

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-accent text-sm font-semibold uppercase tracking-widest">Activité</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--tx-1)] mt-2">Dons Récents</h2>
          <p className="text-[var(--tx-3)] mt-3">Notre communauté en action, en temps réel.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--bd)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[var(--tx-1)] text-sm font-medium">Dons validés récemment</span>
          </div>

          <ul className="divide-y divide-[var(--bd)]">
            {donations.map(donation => {
              const isPublic = donation.profiles?.is_public ?? true
              const name = isPublic
                ? (donation.profiles?.full_name ?? 'Donateur anonyme')
                : 'Donateur anonyme'
              const initials = name !== 'Donateur anonyme'
                ? name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                : '?'

              return (
                <li key={donation.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent text-xs font-bold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--tx-1)] text-sm font-medium truncate">{name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    </div>
                    {donation.donation_packs?.name && (
                      <div className="text-[var(--tx-4)] text-xs truncate">{donation.donation_packs.name}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-accent font-bold text-sm">{formatMAD(donation.amount)}</div>
                    <div className="text-[var(--tx-4)] text-xs flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {timeAgo(donation.validated_at ?? donation.created_at)}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
