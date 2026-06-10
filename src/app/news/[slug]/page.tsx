import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, ArrowLeft, Newspaper } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ShareButtons from '@/components/news/ShareButtons'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

/* ── Generate OG / Twitter meta ───────────────────────────────────── */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase  = await createClient()
  const { data }  = await supabase
    .from('news_posts')
    .select('title, excerpt, cover_image_url, published_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!data) return { title: 'Article introuvable' }

  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const pageUrl   = `${siteUrl}/news/${slug}`
  const desc      = data.excerpt ?? ''
  const imgUrl    = data.cover_image_url ?? `${siteUrl}/images/logo_eeam.jpg`

  return {
    title:       `${data.title} — EEAM Annexe J5`,
    description: desc,
    openGraph: {
      type:        'article',
      url:         pageUrl,
      title:       data.title,
      description: desc,
      images: [{ url: imgUrl, width: 1200, height: 630, alt: data.title }],
      publishedTime: data.published_at ?? undefined,
      siteName: 'EEAM Annexe J5',
    },
    twitter: {
      card:        'summary_large_image',
      title:       data.title,
      description: desc,
      images:      [imgUrl],
    },
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

/* ── Render content: newlines → paragraphs ────────────────────────── */
function renderContent(content: string) {
  const paragraphs = content.split(/\n{2,}/)
  return paragraphs.map((para, i) => (
    <p key={i} className="text-[var(--tx-2)] leading-relaxed text-base sm:text-lg mb-5 last:mb-0">
      {para.split('\n').map((line, j) => (
        <span key={j}>
          {line}
          {j < para.split('\n').length - 1 && <br />}
        </span>
      ))}
    </p>
  ))
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: article } = await supabase
    .from('news_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!article) notFound()

  // Related articles (3 latest, excluding current)
  const { data: related } = await supabase
    .from('news_posts')
    .select('id, slug, title, excerpt, cover_image_url, published_at')
    .eq('is_published', true)
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(3)

  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const articleUrl = `${siteUrl}/news/${slug}`
  const date       = article.published_at ?? article.created_at

  return (
    <main className="bg-[var(--bg-base)] min-h-screen">
      <Navbar />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">

        {/* ── Back link ──────────────────────────────────────────── */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-[var(--tx-4)] hover:text-accent text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux actualités
        </Link>

        {/* ── Meta ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-[var(--tx-4)] text-sm mb-4">
          <CalendarDays className="w-4 h-4" />
          <time dateTime={date}>{formatDate(date)}</time>
        </div>

        {/* ── Title ──────────────────────────────────────────────── */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--tx-1)] leading-tight mb-6">
          {article.title}
        </h1>

        {/* ── Excerpt ────────────────────────────────────────────── */}
        {article.excerpt && (
          <p className="text-[var(--tx-3)] text-lg sm:text-xl leading-relaxed border-l-4 border-accent pl-4 mb-8">
            {article.excerpt}
          </p>
        )}

        {/* ── Share ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10 pb-8 border-b border-[var(--bd)]">
          <ShareButtons
            url={articleUrl}
            title={article.title}
            excerpt={article.excerpt ?? ''}
          />
        </div>

        {/* ── Cover image ────────────────────────────────────────── */}
        {article.cover_image_url && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-10 bg-[var(--bg-hover)]">
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────── */}
        <div className="prose-custom">
          {renderContent(article.content)}
        </div>

        {/* ── Share (bottom) ─────────────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-[var(--bd)] flex items-center gap-3">
          <ShareButtons
            url={articleUrl}
            title={article.title}
            excerpt={article.excerpt ?? ''}
          />
        </div>
      </article>

      {/* ── Related articles ───────────────────────────────────────── */}
      {related && related.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <h2 className="text-xl font-bold text-[var(--tx-1)] mb-6">
            Autres actualités
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map(r => (
              <Link
                key={r.id}
                href={`/news/${r.slug}`}
                className="group bg-[var(--bg-card)] border border-[var(--bd)] rounded-xl overflow-hidden hover:border-accent/40 transition-all"
              >
                <div className="relative aspect-video bg-[var(--bg-hover)]">
                  {r.cover_image_url ? (
                    <Image
                      src={r.cover_image_url}
                      alt={r.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Newspaper className="w-8 h-8 text-[var(--tx-5)]" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[var(--tx-4)] text-xs mb-1">
                    {formatDate(r.published_at ?? '')}
                  </p>
                  <h3 className="text-[var(--tx-1)] text-sm font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                    {r.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  )
}
