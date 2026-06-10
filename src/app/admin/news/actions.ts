'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/* ── Slug generator ───────────────────────────────────────────────── */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // remove combining diacritics (é→e, ç→c…)
    .replace(/[^a-z0-9\s-]/g, '')      // keep alphanum, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')              // spaces → hyphens
    .replace(/-+/g, '-')               // collapse hyphens
    .slice(0, 80)
}

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' as const, supabase: null, user: null }
  const { data: admin } = await supabase.from('admin_users').select('id').eq('id', user.id).single()
  if (!admin) return { error: 'Accès refusé' as const, supabase: null, user: null }
  return { error: null, supabase, user }
}

/* ── Create ───────────────────────────────────────────────────────── */
export async function createArticle(formData: FormData) {
  const { error: authErr, supabase, user } = await assertAdmin()
  if (authErr || !supabase || !user) return { error: authErr ?? 'Erreur' }

  const title       = (formData.get('title') as string).trim()
  const excerpt     = (formData.get('excerpt') as string).trim()
  const content     = (formData.get('content') as string).trim()
  const is_published = formData.get('is_published') === 'true'
  const cover_image_url = (formData.get('cover_image_url') as string | null) || null

  // Build unique slug
  let slug = slugify(title)
  const { data: dup } = await supabase
    .from('news_posts').select('id').eq('slug', slug).maybeSingle()
  if (dup) slug = `${slug}-${Date.now()}`

  const { data, error } = await supabase.from('news_posts').insert({
    title,
    slug,
    excerpt,
    content,
    cover_image_url,
    is_published,
    author_id:    user.id,
    published_at: is_published ? new Date().toISOString() : null,
  }).select('id, slug').single()

  if (error) return { error: error.message }

  revalidatePath('/news')
  revalidatePath('/admin/news')
  return { success: true, id: data.id, slug: data.slug }
}

/* ── Update ───────────────────────────────────────────────────────── */
export async function updateArticle(id: string, formData: FormData) {
  const { error: authErr, supabase } = await assertAdmin()
  if (authErr || !supabase) return { error: authErr ?? 'Erreur' }

  const title       = (formData.get('title') as string).trim()
  const excerpt     = (formData.get('excerpt') as string).trim()
  const content     = (formData.get('content') as string).trim()
  const is_published = formData.get('is_published') === 'true'
  const cover_image_url = (formData.get('cover_image_url') as string | null) || null

  // Keep published_at if already set
  const { data: current } = await supabase
    .from('news_posts').select('published_at, slug').eq('id', id).single()

  const { error } = await supabase.from('news_posts').update({
    title,
    excerpt,
    content,
    cover_image_url,
    is_published,
    published_at: is_published
      ? (current?.published_at ?? new Date().toISOString())
      : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/news')
  revalidatePath(`/news/${current?.slug}`)
  revalidatePath('/admin/news')
  return { success: true }
}

/* ── Toggle publish ───────────────────────────────────────────────── */
export async function togglePublish(id: string, nowPublished: boolean) {
  const { error: authErr, supabase } = await assertAdmin()
  if (authErr || !supabase) return { error: authErr ?? 'Erreur' }

  const { data: article } = await supabase
    .from('news_posts').select('slug').eq('id', id).single()

  const { error } = await supabase.from('news_posts').update({
    is_published: nowPublished,
    published_at: nowPublished ? new Date().toISOString() : null,
    updated_at:   new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/news')
  revalidatePath(`/news/${article?.slug}`)
  revalidatePath('/admin/news')
  return { success: true }
}

/* ── Delete ───────────────────────────────────────────────────────── */
export async function deleteArticle(id: string) {
  const { error: authErr, supabase } = await assertAdmin()
  if (authErr || !supabase) return { error: authErr ?? 'Erreur' }

  const { data: article } = await supabase
    .from('news_posts').select('slug, cover_image_url').eq('id', id).single()

  // Delete cover from storage if present
  if (article?.cover_image_url) {
    const url  = article.cover_image_url
    const path = url.split('/news-covers/').at(-1)
    if (path) await supabase.storage.from('news-covers').remove([path])
  }

  const { error } = await supabase.from('news_posts').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/news')
  revalidatePath(`/news/${article?.slug}`)
  revalidatePath('/admin/news')
  return { success: true }
}
