'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, X, Eye, EyeOff, Save, Loader2, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createArticle, updateArticle } from './actions'
import type { NewsPost } from '@/types'

type Props = {
  article?: NewsPost   // undefined = création, défini = édition
}

export default function NewsEditor({ article }: Props) {
  const router    = useRouter()
  const [pending, startTransition] = useTransition()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [title,       setTitle]       = useState(article?.title ?? '')
  const [excerpt,     setExcerpt]     = useState(article?.excerpt ?? '')
  const [content,     setContent]     = useState(article?.content ?? '')
  const [published,   setPublished]   = useState(article?.is_published ?? false)
  const [coverUrl,    setCoverUrl]     = useState(article?.cover_image_url ?? '')
  const [uploading,   setUploading]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState(false)

  /* ── Image upload ─────────────────────────────────────────────── */
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)

    const supabase = createClient()
    const ext      = file.name.split('.').pop()
    const path     = `covers/${Date.now()}.${ext}`

    const { data, error: upErr } = await supabase.storage
      .from('news-covers')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (upErr) {
      setError(`Upload échoué : ${upErr.message}`)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('news-covers')
      .getPublicUrl(data.path)

    setCoverUrl(publicUrl)
    setUploading(false)
  }

  /* ── Submit ───────────────────────────────────────────────────── */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim())   { setError('Le titre est obligatoire.'); return }
    if (!excerpt.trim()) { setError('Le résumé est obligatoire.'); return }
    if (!content.trim()) { setError('Le contenu est obligatoire.'); return }

    const fd = new FormData()
    fd.append('title',           title)
    fd.append('excerpt',         excerpt)
    fd.append('content',         content)
    fd.append('is_published',    String(published))
    fd.append('cover_image_url', coverUrl)

    startTransition(async () => {
      const res = article
        ? await updateArticle(article.id, fd)
        : await createArticle(fd)

      if (res.error) {
        setError(res.error)
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/admin/news'), 800)
    })
  }

  /* ── UI ───────────────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Titre <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titre de l'article…"
          className="w-full px-4 py-3 bg-[#14151E] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/60 transition-colors text-base"
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Résumé <span className="text-accent">*</span>
          <span className="text-gray-500 font-normal ml-2">(affiché sur la carte et partagé)</span>
        </label>
        <textarea
          value={excerpt}
          onChange={e => setExcerpt(e.target.value)}
          placeholder="Courte description de l'article (2-3 phrases)…"
          rows={3}
          className="w-full px-4 py-3 bg-[#14151E] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/60 transition-colors resize-none text-sm"
        />
      </div>

      {/* Cover image */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Photo de couverture
        </label>

        {/* Preview */}
        {coverUrl && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-[#0A0B10] border border-[#252637]">
            <Image src={coverUrl} alt="Couverture" fill className="object-cover" />
            <button
              type="button"
              onClick={() => setCoverUrl('')}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500/80 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#14151E] border border-[#252637] rounded-xl text-gray-300 text-sm hover:border-accent/40 transition-colors disabled:opacity-50"
          >
            {uploading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Upload className="w-4 h-4" />
            }
            {uploading ? 'Envoi…' : 'Téléverser une image'}
          </button>

          {/* Or URL input */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="url"
                value={coverUrl}
                onChange={e => setCoverUrl(e.target.value)}
                placeholder="…ou coller une URL d'image"
                className="w-full pl-9 pr-4 py-2.5 bg-[#14151E] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/60 transition-colors text-sm"
              />
            </div>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Contenu <span className="text-accent">*</span>
          <span className="text-gray-500 font-normal ml-2">(double saut de ligne = nouveau paragraphe)</span>
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Rédigez l'article ici…"
          rows={14}
          className="w-full px-4 py-3 bg-[#14151E] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/60 transition-colors resize-y text-sm font-mono leading-relaxed"
        />
      </div>

      {/* Publish toggle */}
      <div className="flex items-center justify-between bg-[#14151E] border border-[#252637] rounded-xl px-5 py-4">
        <div>
          <p className="text-white text-sm font-medium">Publier l&apos;article</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {published
              ? 'Visible par tous les visiteurs'
              : 'Brouillon — non visible sur le site'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPublished(p => !p)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            published
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-gray-700/30 border-gray-600/30 text-gray-400'
          }`}
        >
          {published
            ? <><Eye className="w-4 h-4" /> Publié</>
            : <><EyeOff className="w-4 h-4" /> Brouillon</>
          }
        </button>
      </div>

      {/* Error / success */}
      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}
      {success && (
        <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          Article enregistré avec succès !
        </p>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending || uploading || success}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {pending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
            : <><Save className="w-4 h-4" /> {article ? 'Mettre à jour' : 'Créer l\'article'}</>
          }
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/news')}
          className="px-6 py-3 rounded-xl bg-[#14151E] border border-[#252637] text-gray-400 hover:text-white text-sm font-medium transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
