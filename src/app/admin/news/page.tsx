import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Plus, Pencil, Eye, EyeOff, Newspaper, CalendarDays } from 'lucide-react'
import { togglePublish } from './actions'
import ShareLinkButton from './ShareLinkButton'
import NewsDeleteBtn from './NewsDeleteBtn'

export const revalidate = 0

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/* ── Toggle + Delete buttons (need server actions) ────────────────── */
function ToggleBtn({ id, published }: { id: string; published: boolean }) {
  return (
    <form action={async () => {
      'use server'
      await togglePublish(id, !published)
    }}>
      <button
        type="submit"
        title={published ? 'Dépublier' : 'Publier'}
        className={`p-2 rounded-lg border text-xs transition-colors ${
          published
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-gray-700/20 border-gray-600/20 text-gray-500 hover:text-white hover:border-gray-500'
        }`}
      >
        {published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </form>
  )
}


export default async function AdminNewsPage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('news_posts')
    .select('id, slug, title, excerpt, cover_image_url, is_published, published_at, created_at')
    .order('created_at', { ascending: false })

  const posts = articles ?? []

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Actualités</h1>
          <p className="text-gray-400 text-sm mt-1">{posts.length} article{posts.length !== 1 ? 's' : ''} au total</p>
        </div>
        <Link
          href="/admin/news/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </Link>
      </div>

      {/* Empty */}
      {posts.length === 0 && (
        <div className="bg-[#14151E] border border-[#252637] rounded-2xl p-12 text-center">
          <Newspaper className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Aucun article pour l&apos;instant.</p>
          <Link href="/admin/news/new" className="text-accent text-sm hover:underline mt-2 inline-block">
            Créer le premier article →
          </Link>
        </div>
      )}

      {/* List */}
      {posts.length > 0 && (
        <div className="space-y-3">
          {posts.map(post => (
            <div
              key={post.id}
              className="bg-[#14151E] border border-[#252637] rounded-xl p-4 flex gap-4 items-start hover:border-[#3a3b52] transition-colors"
            >
              {/* Thumb */}
              <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-[#0A0B10] flex-shrink-0">
                {post.cover_image_url ? (
                  <Image
                    src={post.cover_image_url}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Newspaper className="w-6 h-6 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    post.is_published
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-gray-700/20 border-gray-600/20 text-gray-500'
                  }`}>
                    {post.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                  <span className="text-gray-600 text-xs flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {formatDate(post.published_at ?? post.created_at)}
                  </span>
                </div>
                <h3 className="text-white font-semibold text-sm leading-snug truncate">{post.title}</h3>
                {post.excerpt && (
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{post.excerpt}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Copy link (tous les articles avec slug) */}
                <ShareLinkButton slug={post.slug} />
                {/* Preview (publiés uniquement) */}
                {post.is_published && (
                  <Link
                    href={`/news/${post.slug}`}
                    target="_blank"
                    className="p-2 rounded-lg border border-[#252637] text-gray-400 hover:text-white hover:border-[#3a3b52] transition-colors"
                    title="Voir sur le site"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                )}
                {/* Edit */}
                <Link
                  href={`/admin/news/${post.id}/edit`}
                  className="p-2 rounded-lg border border-[#252637] text-gray-400 hover:text-white hover:border-[#3a3b52] transition-colors"
                  title="Modifier"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                {/* Toggle publish */}
                <ToggleBtn id={post.id} published={post.is_published} />
                {/* Delete */}
                <NewsDeleteBtn id={post.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
