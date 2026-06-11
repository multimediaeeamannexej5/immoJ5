import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatMAD, progressPercent } from '@/lib/utils'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: progress } = await supabase
    .from('project_progress')
    .select('total_collected, total_goal, active_donors')
    .limit(1)
    .single()

  const pct       = progress ? progressPercent(progress.total_collected, progress.total_goal) : 0
  const collected = progress?.total_collected ?? 0
  const goal      = progress?.total_goal      ?? 2405000
  const donors    = progress?.active_donors   ?? 0

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex">

      {/* ── Panneau gauche (desktop only, always dark) ─────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[#0A0B10]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_40%,rgba(26,122,138,0.10),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-lg overflow-hidden flex-shrink-0">
              <Image src="/images/logo_eeam.jpg" alt="EEAM" width={40} height={40} className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-white text-xl tracking-tight">
              EEAM <span className="text-accent">Annexe J5</span>
            </span>
          </Link>
        </div>

        {/* Citation */}
        <div className="relative z-10">
          <div className="text-accent/40 text-6xl font-serif leading-none mb-4">&ldquo;</div>
          <p className="text-white text-2xl font-semibold leading-snug mb-3">
            C&apos;est à nous de bâtir<br />la maison de Dieu
          </p>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Chaque dirham donné avec foi devient une brique dans l&apos;édifice de notre communauté.
          </p>
          <div className="mt-6 pl-4 border-l-2 border-accent/40">
            <p className="text-accent/80 text-sm italic">
              &ldquo;Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d&apos;eux.&rdquo;
            </p>
            <p className="text-gray-600 text-xs mt-1">Matthieu 18:20</p>
          </div>
        </div>

        {/* Progression */}
        <div className="relative z-10">
          <div className="bg-[#14151E]/80 border border-[#252637] rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex justify-between items-end mb-3">
              <div>
                <div className="text-white font-bold text-xl">{formatMAD(collected)}</div>
                <div className="text-gray-500 text-xs">collectés</div>
              </div>
              <div className="text-right">
                <div className="text-accent font-bold text-2xl">{pct}%</div>
                <div className="text-gray-500 text-xs">de l&apos;objectif</div>
              </div>
            </div>
            <div className="h-2 bg-[#0A0B10] rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{donors} donateurs actifs</span>
              <span>Objectif : {formatMAD(goal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panneau droit : formulaire ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[var(--bg-base)]">
        {/* Header mobile */}
        <div className="lg:hidden p-5 border-b border-[var(--bd)]">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 overflow-hidden flex-shrink-0">
              <Image src="/images/logo_eeam.jpg" alt="EEAM" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-[var(--tx-1)]">
              EEAM <span className="text-accent">Annexe J5</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        <div className="p-5 text-center">
          <p className="text-[var(--tx-5)] text-xs">
            © {new Date().getFullYear()} ChurchProject — Plateforme de dons communautaire
          </p>
        </div>
      </div>
    </div>
  )
}
