import { createClient } from '@/lib/supabase/server'
import { formatMAD, formatNumber, progressPercent } from '@/lib/utils'
import ProgressEditor from './ProgressEditor'
import { TrendingUp, Clock } from 'lucide-react'

export const revalidate = 0

export default async function AdminProgressPage() {
  const supabase = await createClient()

  // Vérifier le rôle pour affichage conditionnel
  const { data: { user } } = await supabase.auth.getUser()
  const { data: adminData } = await supabase
    .from('admin_users').select('role').eq('id', user?.id ?? '').single()
  const isReadOnly = adminData?.role === 'finance_manager'

  const [progressRes, logsRes] = await Promise.all([
    supabase.from('project_progress').select('*').limit(1).single(),
    isReadOnly ? Promise.resolve({ data: [] }) : supabase
      .from('manual_progress_logs')
      .select('*, admin_users(full_name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const progress = progressRes.data
  const logs     = logsRes.data ?? []
  const pct      = progress ? progressPercent(progress.total_collected, progress.total_goal) : 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Progression du Projet</h1>
        <p className="text-gray-400 text-sm mt-1">
          {isReadOnly ? 'Vue en lecture seule' : 'Mise à jour manuelle des montants collectés'}
        </p>
      </div>

      {/* Current progress */}
      <div className="bg-[#14151E] border border-[#252637] rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <div className="text-4xl font-bold text-white">{formatMAD(progress?.total_collected ?? 0)}</div>
            <div className="text-gray-400 text-sm mt-1">collectés sur {formatMAD(progress?.total_goal ?? 2405000)}</div>
          </div>
          <div className="text-5xl font-bold text-accent">{pct}%</div>
        </div>
        <div className="h-5 bg-[#0A0B10] rounded-full border border-[#252637] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-[#252637]">
          {[
            { label: 'Donateurs actifs',  value: formatNumber(progress?.active_donors ?? 0) },
            { label: 'Dons validés',      value: formatNumber(progress?.total_donations_count ?? 0) },
            { label: 'Restant',           value: formatMAD(Math.max(0, (progress?.total_goal ?? 2405000) - (progress?.total_collected ?? 0))) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-white font-bold text-lg">{value}</div>
              <div className="text-gray-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual update form — masqué pour finance_manager */}
      {!isReadOnly && (
        <div className="bg-[#14151E] border border-[#252637] rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Mise à jour manuelle
          </h2>
          <p className="text-gray-500 text-xs mb-5">
            Pour les paiements en espèces ou non enregistrés dans le système.
            Entrez un montant positif pour ajouter, négatif pour corriger.
          </p>
          <ProgressEditor />
        </div>
      )}

      {/* Logs — masqués pour finance_manager */}
      {!isReadOnly && logs.length > 0 && (
        <div className="bg-[#14151E] border border-[#252637] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#252637] flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h2 className="text-white font-semibold">Historique des mises à jour manuelles</h2>
          </div>
          <div className="divide-y divide-[#252637]">
            {logs.map((log: { id: string; amount: number; note: string | null; created_at: string; admin_users?: { full_name: string | null } }) => (
              <div key={log.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-gray-300 text-sm">
                    {log.note ?? <span className="text-gray-600 italic">Sans note</span>}
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    Par {log.admin_users?.full_name ?? 'Admin'} — {new Date(log.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
                <span className={`font-bold text-sm whitespace-nowrap ${log.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {log.amount >= 0 ? '+' : ''}{formatMAD(log.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
