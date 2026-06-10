import Link from 'next/link'
import { Heart, Target, Building2, CheckCircle2, CreditCard, Users, ArrowRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { formatMAD } from '@/lib/utils'

export const metadata = {
  title: 'À propos — Church Project',
  description: 'Découvrez le Projet Immobilier de l\'Église Évangélique au Maroc — Annexe J5.',
}

export default function AboutPage() {
  return (
    <main className="bg-[var(--bg-base)] min-h-screen">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(26,122,138,0.10),transparent)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-medium mb-6">
            <Heart className="w-3.5 h-3.5 fill-current" />
            EEAM — Annexe J5
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--tx-1)] leading-tight mb-6">
            À propos du{' '}
            <span className="text-accent">Projet Immobilier</span>
          </h1>
          <p className="text-[var(--tx-3)] text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            L&apos;Église Évangélique au Maroc — Annexe J5 s&apos;engage dans un projet historique :
            acquérir un lieu de culte permanent pour servir sa communauté aujourd&apos;hui et pour les générations à venir.
          </p>
        </div>
      </section>

      {/* ── Notre vision ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-8 sm:p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--tx-1)] mb-1">Notre Vision</h2>
                <div className="w-12 h-1 bg-accent rounded-full" />
              </div>
            </div>
            <div className="space-y-4 text-[var(--tx-2)] leading-relaxed text-base sm:text-lg">
              <p>
                L&apos;Église Évangélique au Maroc — Annexe J5 est une communauté de foi engagée à servir Dieu
                et à témoigner de l&apos;Évangile au cœur du Maroc. Depuis plusieurs années, nous nous réunissons
                avec ferveur, guidés par la Parole de Dieu et unis dans l&apos;amour fraternel.
              </p>
              <p>
                Cependant, nos locaux actuels ne correspondent plus à la croissance et aux besoins de notre
                congrégation. Il est temps de franchir une nouvelle étape : acquérir un espace qui sera
                véritablement le foyer de notre famille spirituelle.
              </p>
              <blockquote className="pl-4 border-l-4 border-accent my-6 italic text-[var(--tx-3)]">
                &ldquo;Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d&apos;eux.&rdquo;
                <span className="block mt-1 text-sm not-italic font-medium text-accent">— Matthieu 18:20</span>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pourquoi un nouveau temple ─────────────────────────────────── */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--tx-1)] mb-1">Pourquoi un nouveau temple&nbsp;?</h2>
              <div className="w-12 h-1 bg-emerald-500 rounded-full" />
            </div>
          </div>
          <p className="text-[var(--tx-2)] text-base sm:text-lg leading-relaxed mb-8">
            Notre assemblée grandit de mois en mois, et les espaces disponibles ne permettent plus
            d&apos;accueillir dignement l&apos;ensemble de nos fidèles, leurs familles et les visiteurs.
            Un nouveau lieu de culte nous permettra de :
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Accueillir plus de fidèles',
                desc:  'Offrir un espace chaleureux et digne à l\'ensemble de notre congrégation en pleine croissance.',
              },
              {
                title: 'Activités pour tous',
                desc:  'Organiser des programmes dédiés aux jeunes, aux enfants et aux familles tout au long de l\'année.',
              },
              {
                title: 'Témoignage renforcé',
                desc:  'Affirmer notre présence au sein de la communauté locale et rayonner l\'Évangile avec plus d\'impact.',
              },
              {
                title: 'Espace sacré permanent',
                desc:  'Disposer d\'un lieu dédié à la prière, l\'enseignement biblique et l\'adoration collective.',
              },
            ].map(item => (
              <div key={item.title} className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-xl p-5 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[var(--tx-1)] font-semibold text-sm mb-1">{item.title}</p>
                  <p className="text-[var(--tx-3)] text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Le Projet Immobilier ───────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/25 rounded-2xl p-8 sm:p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--tx-1)] mb-1">Le Projet Immobilier</h2>
                <div className="w-12 h-1 bg-accent rounded-full" />
              </div>
            </div>
            <p className="text-[var(--tx-2)] text-base sm:text-lg leading-relaxed mb-6">
              Nous avons identifié un bien immobilier stratégiquement situé, qui répondra aux besoins
              présents et futurs de notre église. Ce projet représente un investissement de foi et un
              engagement collectif envers l&apos;avenir de notre communauté.
            </p>
            <div className="bg-[var(--bg-base)] border border-accent/20 rounded-xl p-6 text-center">
              <p className="text-[var(--tx-4)] text-sm uppercase tracking-wider mb-1">Montant total nécessaire</p>
              <p className="text-4xl sm:text-5xl font-bold text-accent">{formatMAD(2405000)}</p>
              <p className="text-[var(--tx-4)] text-sm mt-2">
                Votre don, quel que soit son montant, contribue directement à cet objectif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Nos engagements ───────────────────────────────────────────── */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--tx-1)] mb-1">Nos Engagements envers vous</h2>
              <div className="w-12 h-1 bg-blue-500 rounded-full" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                num:  '01',
                title: 'Transparence totale',
                desc:  'Gestion rigoureuse et transparente des fonds collectés, avec accès complet à toutes les informations financières.',
              },
              {
                num:  '02',
                title: 'Rapports réguliers',
                desc:  'Communication régulière à toute la communauté sur l\'avancement du projet et l\'état des finances.',
              },
              {
                num:  '03',
                title: 'Gouvernance partagée',
                desc:  'Décisions prises collectivement avec la participation active des membres de l\'église.',
              },
              {
                num:  '04',
                title: 'Suivi rigoureux',
                desc:  'Contrôle strict de chaque étape du projet pour garantir que chaque dirham est utilisé à bon escient.',
              },
            ].map(item => (
              <div key={item.num} className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-xl p-5 flex gap-4">
                <span className="text-3xl font-black text-[var(--bd)] leading-none flex-shrink-0">{item.num}</span>
                <div>
                  <p className="text-[var(--tx-1)] font-semibold text-sm mb-1">{item.title}</p>
                  <p className="text-[var(--tx-3)] text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment contribuer ────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--tx-1)] mb-2">Comment contribuer&nbsp;?</h2>
          <div className="w-12 h-1 bg-accent rounded-full mb-8" />
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {[
              {
                step: 'Étape 1',
                title: 'Créer un compte',
                desc:  'Inscrivez-vous gratuitement sur notre plateforme en quelques secondes.',
              },
              {
                step: 'Étape 2',
                title: 'Choisir un pack',
                desc:  'Sélectionnez un montant ponctuel ou optez pour un engagement mensuel récurrent.',
              },
              {
                step: 'Étape 3',
                title: 'Effectuer le paiement',
                desc:  'Payez par virement, carte ou espèces et uploadez votre preuve de paiement.',
              },
              {
                step: 'Étape 4',
                title: 'Validation',
                desc:  'Notre équipe valide votre don sous 24h. Vous recevez une confirmation.',
              },
            ].map(item => (
              <div key={item.step} className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-xl p-5">
                <p className="text-accent text-xs font-bold uppercase tracking-wider mb-1">{item.step}</p>
                <p className="text-[var(--tx-1)] font-semibold mb-2">{item.title}</p>
                <p className="text-[var(--tx-3)] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/donate"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20">
              <Heart className="w-4 h-4 fill-current" />
              Faire un don maintenant
            </Link>
            <Link href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--bd)] text-[var(--tx-1)] font-medium hover:border-accent transition-colors">
              Créer un compte
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Ensemble construisons l'avenir ────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-8 sm:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--tx-1)] mb-4">
              Ensemble, construisons l&apos;avenir
            </h2>
            <p className="text-[var(--tx-2)] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-6">
              Ce projet n&apos;est pas seulement une question de briques et de béton — c&apos;est
              l&apos;expression tangible de notre foi collective. Ensemble, nous pouvons bâtir un lieu
              qui servira les générations présentes et futures, un espace où chaque âme sera accueillie
              avec amour.
            </p>
            <p className="text-accent font-semibold text-lg">
              Rejoignez-nous dans cette aventure de foi !
            </p>
          </div>
        </div>
      </section>

      {/* ── Vidéos ────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--tx-1)] mb-2 text-center">
            Nos Vidéos
          </h2>
          <p className="text-[var(--tx-3)] text-center mb-10">
            Découvrez notre communauté en images
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Video 1 */}
            <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl overflow-hidden">
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="Présentation de l'église — EEAM Annexe J5"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="p-4">
                <p className="text-[var(--tx-1)] font-semibold text-sm">Présentation de l&apos;église</p>
                <p className="text-[var(--tx-4)] text-xs mt-1">EEAM Annexe J5 — Notre communauté</p>
              </div>
            </div>

            {/* Video 2 */}
            <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl overflow-hidden">
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="Le projet immobilier — Vision et avancement"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="p-4">
                <p className="text-[var(--tx-1)] font-semibold text-sm">Le projet immobilier</p>
                <p className="text-[var(--tx-4)] text-xs mt-1">Vision, avancement et témoignages</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
