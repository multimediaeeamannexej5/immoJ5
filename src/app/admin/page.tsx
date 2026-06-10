import { createClient } from '@/lib/supabase/server'
import { formatMAD, formatNumber, progressPercent, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'
import { TrendingUp, Users, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export const revalidate = 30

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [progressRes, statsRes, recentRes] = await Promise.all([
    supabase.from('project_progress').select('*').limit(1).single(),
    supabase.from('donations').select('status, amount'),
    supabase
      .from('donations')
      .select('*, profiles(full_name), donation_packs(name)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const progress  = progressRes.data
  const donations = statsRes.data ?? []
  const recent    = recentRes.data ?? []

  const pct       = progress ? progressPercent(progress.total_collected, progress.total_goal) : 0
  const pending   = donations.filter(d => d.status === 'pending').length
  const validated = donations.filter(d => d.status === 'validated').length
  const rejected  = donations.filter(d => d.status === 'rejected').length
  const overdue   = donations.filter(d => d.status === 'overdue').length

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Vue d&apos;ensemble du projet Church</p>
      </div>

      {/* Progress card */}
      <div className="bg-[#14151E] border border-[#252637] rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <div className="text-3xl font-bold text-white">
              {formatMAD(progress?.total_collected ?? 0)}
            </div>
            <div className="text-gray-400 text-sm">collectés sur {formatMAD(progress?.total_goal ?? 2405000)}</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-accent">{pct}%</div>
            <div className="text-gray-400 text-sm">{formatNumber(progress?.active_donors ?? 0)} donateurs actifs</div>
          </div>
        </div>
        <div className="h-4 bg-[#0A0B10] rounded-full border border-[#252637] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Clock,        label: 'En attente',  value: pending,   color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { icon: CheckCircle2, label: 'Validés',     value: validated, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { icon: XCircle,      label: 'Rejetés',     value: rejected,  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
          { icon: AlertTriangle,label: 'En retard',   value: overdue,   color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl p-5 border ${bg}`}>
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-gray-500 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent donations */}
      <div className="bg-[#14151E] border border-[#252637] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#252637] flex items-center justify-between">
          <h2 className="text-white font-semibold">Dons récents</h2>
          <a href="/admin/donations" className="text-accent text-sm hover:underline">Voir tout →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-[#252637]">
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Donateur</th>
                <th className="px-5 py-3 text-left">Pack</th>
                <th className="px-5 py-3 text-left">Montant</th>
                <th className="px-5 py-3 text-left">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252637]">
              {recent.map(d => (
                <tr key={d.id} className="hover:bg-[#1E1F2E] transition-colors">
                  <td className="px-5 py-3 text-gray-400 text-sm whitespace-nowrap">
                    {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-3 text-gray-300 text-sm truncate max-w-[140px]">
                    {d.profiles?.full_name ?? 'Anonyme'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-sm truncate max-w-[120px]">
                    {d.donation_packs?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-accent font-semibold text-sm whitespace-nowrap">
                    {formatMAD(d.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[d.status]}`}>
                      {STATUS_LABELS[d.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
