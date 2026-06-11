'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Upload, X, Eye, EyeOff, Save, Loader2, Image as ImageIcon,
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Minus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createArticle, updateArticle } from './actions'
import type { NewsPost } from '@/types'

type Props = {
  article?: NewsPost
}

/* ── Toolbar helper: insert/wrap text at cursor ─────────────────────────── */
function insertAtCursor(
  textarea: HTMLTextAreaElement,
  before: string,
  after = '',
  placeholder = 'texte',
): string {
  const start = textarea.selectionStart
  const end   = textarea.selectionEnd
  const sel   = textarea.value.slice(start, end) || placeholder
  return (
    textarea.value.slice(0, start) +
    before + sel + after +
    textarea.value.slice(end)
  )
}

function insertLine(textarea: HTMLTextAreaElement, prefix: string): string {
  const start  = textarea.selectionStart
  const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1
  return (
    textarea.value.slice(0, lineStart) +
    prefix +
    textarea.value.slice(lineStart)
  )
}

export default function NewsEditor({ article }: Props) {
  const router    = useRouter()
  const [pending, startTransition] = useTransition()
  const fileRef   = useRef<HTMLInputElement>(null)
  const textRef   = useRef<HTMLTextAreaElement>(null)

  const [title,       setTitle]     = useState(article?.title ?? '')
  const [excerpt,     setExcerpt]   = useState(article?.excerpt ?? '')
  const [content,     setContent]   = useState(article?.content ?? '')
  const [published,   setPublished] = useState(article?.is_published ?? false)
  const [coverUrl,    setCoverUrl]  = useState(article?.cover_image_url ?? '')
  const [uploading,   setUploading] = useState(false)
  const [error,       setError]     = useState<string | null>(null)
  const [success,     setSuccess]   = useState(false)

  /* ── Toolbar actions ──────────────────────────────────────────────────── */
  function applyFormat(fn: (ta: HTMLTextAreaElement) => string) {
    const ta = textRef.current
    if (!ta) return
    const newVal = fn(ta)
    setContent(newVal)
    ta.focus()
  }

  const toolbar = [
    { icon: Bold,         title: 'Gras',        action: (ta: HTMLTextAreaElement) => insertAtCursor(ta, '**', '**') },
    { icon: Italic,       title: 'Italique',     action: (ta: HTMLTextAreaElement) => insertAtCursor(ta, '*', '*') },
    { icon: Heading2,     title: 'Titre H2',     action: (ta: HTMLTextAreaElement) => insertLine(ta, '## ') },
    { icon: Heading3,     title: 'Titre H3',     action: (ta: HTMLTextAreaElement) => insertLine(ta, '### ') },
    { icon: List,         title: 'Liste à puces',action: (ta: HTMLTextAreaElement) => insertLine(ta, '- ') },
    { icon: ListOrdered,  title: 'Liste numérotée', action: (ta: HTMLTextAreaElement) => insertLine(ta, '1. ') },
    { icon: Minus,        title: 'Séparateur',   action: (ta: HTMLTextAreaElement) => insertAtCursor(ta, '\n---\n', '', '') },
  ]

  /* ── Image upload ─────────────────────────────────────────────────────── */
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)

    const supabase = createClient()
    const ext  = file.name.split('.').pop()
    const path = `covers/${Date.now()}.${ext}`

    const { data, error: upErr } = await supabase.storage
      .from('news-covers')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (upErr) {
      setError(`Upload échoué : ${upErr.message}`)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('news-covers').getPublicUrl(data.path)
    setCoverUrl(publicUrl)
    setUploading(false)
  }

  /* ── Submit ───────────────────────────────────────────────────────────── */
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

      if (res.error) { setError(res.error); return }
      setSuccess(true)
      setTimeout(() => router.push('/admin/news'), 800)
    })
  }

  /* ── UI ───────────────────────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Titre <span className="text-accent">*</span>
        </label>
        <input
          type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Titre de l'article…"
          className="w-full px-4 py-3 bg-[#14151E] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/60 transition-colors text-base"
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Résumé <span className="text-accent">*</span>
          <span className="text-gray-500 font-normal ml-2">(affiché sur la carte)</span>
        </label>
        <textarea
          value={excerpt} onChange={e => setExcerpt(e.target.value)}
          placeholder="Courte description (2-3 phrases)…"
          rows={3}
          className="w-full px-4 py-3 bg-[#14151E] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/60 transition-colors resize-none text-sm"
        />
      </div>

      {/* Cover image */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Photo de couverture</label>
        {coverUrl && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-[#0A0B10] border border-[#252637]">
            <Image src={coverUrl} alt="Couverture" fill className="object-cover" />
            <button type="button" onClick={() => setCoverUrl('')}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500/80 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
        <div className="flex gap-3 flex-wrap">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#14151E] border border-[#252637] rounded-xl text-gray-300 text-sm hover:border-accent/40 transition-colors disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Envoi…' : 'Téléverser une image'}
          </button>
          <div className="flex-1 min-w-[200px] relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="url" value={coverUrl} onChange={e => setCoverUrl(e.target.value)}
              placeholder="…ou coller une URL d'image"
              className="w-full pl-9 pr-4 py-2.5 bg-[#14151E] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/60 transition-colors text-sm"
            />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Content with toolbar */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Contenu <span className="text-accent">*</span>
        </label>

        {/* Markdown toolbar */}
        <div className="flex flex-wrap gap-1 mb-2 p-2 bg-[#0A0B10] border border-[#252637] rounded-t-xl border-b-0">
          {toolbar.map(({ icon: Icon, title: tip, action }) => (
            <button key={tip} type="button" title={tip}
              onMouseDown={e => { e.preventDefault(); applyFormat(action) }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#252637] transition-colors">
              <Icon className="w-4 h-4" />
            </button>
          ))}
          <div className="ml-2 flex items-center gap-1.5 text-gray-600 text-xs border-l border-[#252637] pl-3">
            <span>**gras**</span>
            <span>·</span>
            <span>*italique*</span>
            <span>·</span>
            <span>## Titre</span>
          </div>
        </div>
        <textarea
          ref={textRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Rédigez le contenu ici…&#10;&#10;Utilisez **gras**, *italique*, ## Titre, - liste"
          rows={16}
          className="w-full px-4 py-3 bg-[#14151E] border border-[#252637] rounded-b-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/60 transition-colors resize-y text-sm font-mono leading-relaxed"
        />
        <p className="text-gray-600 text-xs mt-1.5">
          Double saut de ligne = nouveau paragraphe · Markdown supporté sur le site public
        </p>
      </div>

      {/* Publish toggle */}
      <div className="flex items-center justify-between bg-[#14151E] border border-[#252637] rounded-xl px-5 py-4">
        <div>
          <p className="text-white text-sm font-medium">Publier l&apos;article</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {published ? 'Visible par tous les visiteurs' : 'Brouillon — non visible sur le site'}
          </p>
        </div>
        <button type="button" onClick={() => setPublished(p => !p)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            published
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-gray-700/30 border-gray-600/30 text-gray-400'
          }`}>
          {published ? <><Eye className="w-4 h-4" /> Publié</> : <><EyeOff className="w-4 h-4" /> Brouillon</>}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}
      {success && (
        <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          Article enregistré avec succès !
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending || uploading || success}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60">
          {pending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
            : <><Save className="w-4 h-4" /> {article ? 'Mettre à jour' : "Créer l'article"}</>
          }
        </button>
        <button type="button" onClick={() => router.push('/admin/news')}
          className="px-6 py-3 rounded-xl bg-[#14151E] border border-[#252637] text-gray-400 hover:text-white text-sm font-medium transition-colors">
          Annuler
        </button>
      </div>
    </form>
  )
}
