import { createClient } from '@/lib/supabase/server'
import { formatMAD, progressPercent } from '@/lib/utils'
import ProgressEditor from '@/app/admin/progress/ProgressEditor'

export const revalidate = 30

export default async function TreasurerProgressPage() {
  const supabase = await createClient()
  const { data: progress } = await supabase
    .from('project_progress').select('*').limit(1).single()

  const pct       = progress ? progressPercent(progress.total_collected, progress.total_goal) : 0
  const collected = progress?.total_collected ?? 0
  const goal      = progress?.total_goal ?? 2405000

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Mise à jour de la progression</h1>
        <p className="text-gray-400 text-sm mt-1">Ajustez le montant collecté après confirmation d&apos;un paiement hors plateforme.</p>
      </div>

      {/* Current state */}
      <div className="bg-[#14151E] border border-[#252637] rounded-2xl p-6 mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <div className="text-3xl font-bold text-white">{formatMAD(collected)}</div>
            <div className="text-gray-400 text-sm mt-1">collectés sur {formatMAD(goal)}</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-accent">{pct}%</div>
            <div className="text-gray-400 text-sm mt-1">de l&apos;objectif</div>
          </div>
        </div>
        <div className="h-3 bg-[#0A0B10] rounded-full border border-[#252637] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Editor */}
      <div className="bg-[#14151E] border border-[#252637] rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-5">Ajustement manuel</h2>
        <ProgressEditor />
      </div>
    </div>
  )
}
