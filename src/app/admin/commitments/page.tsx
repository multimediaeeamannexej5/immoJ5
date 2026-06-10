import { createClient } from '@/lib/supabase/server'
import { formatMAD } from '@/lib/utils'
import { CheckCircle2, XCircle, RefreshCw, Users } from 'lucide-react'
import { approvePackChange, rejectPackChange } from './actions'

export const revalidate = 0

function ApproveBtn({ id }: { id: string }) {
  return (
    <form action={async () => { 'use server'; await approvePackChange(id) }}>
      <button type="submit"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
        <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
      </button>
    </form>
  )
}

function RejectBtn({ id }: { id: string }) {
  return (
    <form action={async () => { 'use server'; await rejectPackChange(id) }}>
      <button type="submit"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
        <XCircle className="w-3.5 h-3.5" /> Refuser
      </button>
    </form>
  )
}

export default async function CommitmentsPage() {
  const supabase = await createClient()

  const { data: commitments } = await supabase
    .from('donor_commitments')
    .select(`
      id, status, change_note, change_requested_at, created_at,
      donation_packs!donor_commitments_pack_id_fkey(name, monthly_amount, total_cost),
      requested_pack:donation_packs!donor_commitments_requested_pack_id_fkey(name, monthly_amount),
      profiles(full_name)
    `)
    .order('change_requested_at', { ascending: false, nullsFirst: false })

  const all       = commitments ?? []
  const pending   = all.filter(c => c.status === 'change_requested')
  const active    = all.filter(c => c.status === 'active')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Engagements mensuels</h1>
          <p className="text-gray-400 text-sm mt-1">
            {all.length} engagement(s) — {pending.length} demande(s) de changement en attente
          </p>
        </div>
      </div>

      {/* ── Demandes de changement en attente ──────────────────── */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-yellow-400" />
            Demandes de changement ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map(c => {
              const pack     = c.donation_packs as any
              const newPack  = (c as any).requested_pack as any
              const profile  = (c as any).profiles as any
              return (
                <div key={c.id} className="bg-[#14151E] border border-yellow-500/20 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-white font-semibold text-sm">{profile?.full_name ?? 'Donateur anonyme'}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="text-gray-400">
                          {pack?.name} ({formatMAD(Number(pack?.monthly_amount))}/mois)
                        </span>
                        <span className="text-yellow-400">→</span>
                        <span className="text-white font-medium">
                          {newPack?.name} ({formatMAD(Number(newPack?.monthly_amount))}/mois)
                        </span>
                      </div>
                      {c.change_note && (
                        <p className="text-gray-500 text-xs mt-1 italic">&ldquo;{c.change_note}&rdquo;</p>
                      )}
                      {c.change_requested_at && (
                        <p className="text-gray-600 text-xs mt-1">
                          Demandé le {new Date(c.change_requested_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <ApproveBtn id={c.id} />
                      <RejectBtn  id={c.id} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tous les engagements actifs ─────────────────────────── */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          Engagements actifs ({active.length})
        </h2>
        {active.length === 0 ? (
          <div className="bg-[#14151E] border border-[#252637] rounded-xl p-10 text-center text-gray-500 text-sm">
            Aucun engagement actif pour l&apos;instant.
          </div>
        ) : (
          <div className="bg-[#14151E] border border-[#252637] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-[#252637]">
                  <th className="px-5 py-3 text-left">Donateur</th>
                  <th className="px-5 py-3 text-left">Pack actuel</th>
                  <th className="px-5 py-3 text-left">Mensualité</th>
                  <th className="px-5 py-3 text-left">Engagement total</th>
                  <th className="px-5 py-3 text-left">Depuis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252637]">
                {active.map(c => {
                  const pack    = c.donation_packs as any
                  const profile = (c as any).profiles as any
                  return (
                    <tr key={c.id} className="hover:bg-[#1E1F2E] transition-colors">
                      <td className="px-5 py-3 text-gray-200 text-sm">
                        {profile?.full_name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-300 text-sm">{pack?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-accent font-semibold text-sm">
                        {formatMAD(Number(pack?.monthly_amount ?? 0))}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-sm">
                        {formatMAD(Number(pack?.total_cost ?? 0))}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-sm">
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
