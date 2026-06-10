import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'
import type { ProjectProgress } from '@/types'
import { formatMAD, formatNumber, progressPercent } from '@/lib/utils'

type Props = { progress: ProjectProgress | null }

export default function HeroSection({ progress }: Props) {
  const pct       = progress ? progressPercent(progress.total_collected, progress.total_goal) : 0
  const collected = progress?.total_collected ?? 0
  const goal      = progress?.total_goal      ?? 2405000
  const donors    = progress?.active_donors   ?? 0

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* ── Background slideshow ──────────────────────────────────────── */}
      <div className="absolute inset-0">
        <Image
          src="/images/1.jpg"
          alt=""
          fill
          priority
          className="object-cover hero-img-1"
          sizes="100vw"
        />
        <Image
          src="/images/2.jpg"
          alt=""
          fill
          className="object-cover hero-img-2"
          sizes="100vw"
        />
        <Image
          src="/images/4.jpg"
          alt=""
          fill
          className="object-cover hero-img-3"
          sizes="100vw"
        />
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
          Ensemble, Bâtissons{' '}
          <span className="relative">
            <span className="text-logo-blue">Notre Maison</span>
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--logo-blue)] to-transparent" />
          </span>
          {' '}de Dieu
        </h1>

        <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Chaque contribution, grande ou petite, rapproche notre communauté de son rêve.
          Rejoignez les{' '}
          <span className="text-white font-semibold">{formatNumber(donors)} donateurs</span>
          {' '}qui construisent l&apos;avenir.
        </p>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/70">Collecté</span>
            <span className="text-accent font-bold text-lg">{pct}%</span>
            <span className="text-white/70">Objectif</span>
          </div>
          <div className="h-4 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-1000 ease-out relative"
              style={{ width: `${pct}%` }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-white font-semibold">{formatMAD(collected)}</span>
            <span className="text-white/50">{formatMAD(goal)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {[
            { label: 'Collectés',        value: formatMAD(collected) },
            { label: 'Donateurs actifs', value: formatNumber(donors) },
            { label: 'Objectif total',   value: formatMAD(goal) },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-white/60 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/donate"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-accent text-white font-bold text-base hover:bg-accent-hover transition-all duration-200 shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:-translate-y-0.5">
            <Heart className="w-5 h-5 fill-current" />
            Faire un don maintenant
          </Link>
          <Link href="/about"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white font-medium text-base hover:bg-white/20 hover:border-accent hover:text-accent transition-all duration-200">
            En savoir plus
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50">
        <span className="text-xs">Défiler</span>
        <div className="w-5 h-8 border border-white/30 rounded-full flex justify-center pt-1">
          <div className="w-1 h-2 bg-accent rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}
