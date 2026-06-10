import { Target, Users, TrendingUp, Award } from 'lucide-react'
import type { ProjectProgress } from '@/types'
import { formatMAD, formatNumber, progressPercent } from '@/lib/utils'

type Props = { progress: ProjectProgress | null }

const MILESTONES = [
  { pct: 25,  label: '25%',  key: 'milestone_25_at'  as const },
  { pct: 50,  label: '50%',  key: 'milestone_50_at'  as const },
  { pct: 75,  label: '75%',  key: 'milestone_75_at'  as const },
  { pct: 100, label: '100%', key: 'milestone_100_at' as const },
]

export default function ProgressSection({ progress }: Props) {
  const pct       = progress ? progressPercent(progress.total_collected, progress.total_goal) : 0
  const collected = progress?.total_collected       ?? 0
  const goal      = progress?.total_goal            ?? 2405000
  const donors    = progress?.active_donors         ?? 0
  const totalDons = progress?.total_donations_count ?? 0
  const remaining = Math.max(0, goal - collected)

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#0A0B10] rounded-2xl px-8 py-10 text-center mb-10">
          <span className="text-accent text-sm font-semibold uppercase tracking-widest">Transparence</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">Progression du Projet</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            Chaque dirham est compté. Suivez l&apos;évolution de notre collecte en temps réel.
          </p>
        </div>

        {/* Big progress bar */}
        <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-8 mb-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-[var(--tx-1)]">{formatMAD(collected)}</div>
              <div className="text-[var(--tx-3)] text-sm mt-1">collectés sur {formatMAD(goal)}</div>
            </div>
            <div className="text-right">
              <div className="text-5xl sm:text-6xl font-bold text-accent">{pct}%</div>
              <div className="text-[var(--tx-3)] text-sm mt-1">de l&apos;objectif atteint</div>
            </div>
          </div>

          <div className="h-6 bg-[var(--bg-base)] rounded-full border border-[var(--bd)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light relative transition-all duration-1500"
              style={{ width: `${pct}%` }}
            >
              {pct > 5 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-bold">
                  {pct}%
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-3 text-sm">
            <span className="text-[var(--tx-4)]">0 MAD</span>
            <span className="text-accent font-medium">{formatMAD(remaining)} restants</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: TrendingUp, label: 'Collectés',        value: formatMAD(collected),   color: 'text-accent' },
            { icon: Users,      label: 'Donateurs actifs', value: formatNumber(donors),    color: 'text-emerald-400' },
            { icon: Award,      label: 'Dons validés',     value: formatNumber(totalDons), color: 'text-blue-400' },
            { icon: Target,     label: 'Restant',          value: formatMAD(remaining),    color: 'text-purple-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-xl p-5">
              <Icon className={`w-5 h-5 ${color} mb-3`} />
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-[var(--tx-4)] text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Milestones */}
        <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-6">
          <h3 className="text-[var(--tx-1)] font-semibold mb-5">Jalons</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MILESTONES.map(m => {
              const reached = progress?.[m.key] != null || pct >= m.pct
              return (
                <div
                  key={m.label}
                  className={`rounded-xl p-4 text-center border transition-all ${
                    reached
                      ? 'bg-accent/10 border-accent/40'
                      : 'bg-[var(--bg-base)] border-[var(--bd)]'
                  }`}
                >
                  <div className={`text-2xl font-bold ${reached ? 'text-accent' : 'text-[var(--tx-5)]'}`}>
                    {m.label}
                  </div>
                  <div className={`text-xs mt-1 ${reached ? 'text-accent/70' : 'text-[var(--tx-5)]'}`}>
                    {reached ? '✓ Atteint' : `${formatMAD(goal * m.pct / 100)}`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
