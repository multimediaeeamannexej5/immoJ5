import Image from 'next/image'
import Link from 'next/link'
import { Newspaper, CalendarDays, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ShareButtons from '@/components/news/ShareButtons'
import type { NewsPost } from '@/types'

export const revalidate = 60

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Actualités',
  description:
    "Suivez les dernières nouvelles du Projet Immobilier de l'Église Évangélique au Maroc — Annexe J5 : avancement, événements et témoignages de la communauté.",
  openGraph: {
    title:       'Actualités | EEAM Annexe J5',
    description: "Avancement du projet, événements et nouvelles de la communauté EEAM Annexe J5.",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eeam-annexej5.ma'}/news`,
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function NewsPage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('news_posts')
    .select('id, slug, title, excerpt, cover_image_url, published_at, created_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const posts = (articles ?? []) as Pick<
    NewsPost,
    'id' | 'slug' | 'title' | 'excerpt' | 'cover_image_url' | 'published_at' | 'created_at'
  >[]

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return (
    <main className="bg-[var(--bg-base)] min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-medium mb-4">
            <Newspaper className="w-3.5 h-3.5" />
            Actualités
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--tx-1)] mb-3">
            Dernières nouvelles
          </h1>
          <p className="text-[var(--tx-3)] text-base sm:text-lg max-w-2xl">
            Restez informé de l&apos;avancement du projet, des événements de la communauté
            et des prochaines collectes.
          </p>
        </div>

        {/* ── Empty state ────────────────────────────────────────── */}
        {posts.length === 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5">
              <Newspaper className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-[var(--tx-1)] mb-2">
              Les actualités arrivent bientôt
            </h2>
            <p className="text-[var(--tx-3)] text-sm max-w-sm mx-auto leading-relaxed">
              Nous préparons les dernières nouvelles du projet. Revenez bientôt pour découvrir
              les avancées et les témoignages de notre communauté.
            </p>
          </div>
        )}

        {/* ── Articles grid ──────────────────────────────────────── */}
        {posts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => {
              const articleUrl = `${siteUrl}/news/${post.slug}`
              const date       = post.published_at ?? post.created_at
              const excerpt    = post.excerpt ?? ''

              return (
                <article
                  key={post.id}
                  className="group bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl overflow-hidden hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 flex flex-col"
                >
                  {/* Cover image */}
                  <Link href={`/news/${post.slug}`} className="block relative aspect-video overflow-hidden bg-[var(--bg-hover)]">
                    {post.cover_image_url ? (
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Newspaper className="w-12 h-12 text-[var(--tx-5)]" />
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-[var(--tx-4)] text-xs mb-3">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatDate(date)}
                    </div>

                    {/* Title */}
                    <Link href={`/news/${post.slug}`}>
                      <h2 className="text-[var(--tx-1)] font-bold text-lg leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>

                    {/* Excerpt */}
                    {excerpt && (
                      <p className="text-[var(--tx-3)] text-sm leading-relaxed line-clamp-3 flex-1 mb-4">
                        {excerpt}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--bd)] mt-auto gap-3 flex-wrap">
                      <Link
                        href={`/news/${post.slug}`}
                        className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold hover:gap-2.5 transition-all"
                      >
                        Lire l&apos;article
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <ShareButtons
                        url={articleUrl}
                        title={post.title}
                        excerpt={excerpt}
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
