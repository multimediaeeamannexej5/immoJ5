import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 heure

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eeam-annexej5.ma'

  // Pages statiques publiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:              base,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         1.0,
    },
    {
      url:              `${base}/about`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    {
      url:              `${base}/contact`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.7,
    },
    {
      url:              `${base}/news`,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         0.9,
    },
  ]

  // Articles d'actualités publiés
  let newsPages: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    const { data: articles } = await supabase
      .from('news_posts')
      .select('slug, updated_at, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    newsPages = (articles ?? []).map(article => ({
      url:             `${base}/news/${article.slug}`,
      lastModified:    new Date(article.updated_at ?? article.published_at ?? new Date()),
      changeFrequency: 'monthly' as const,
      priority:        0.7,
    }))
  } catch {
    // Non bloquant
  }

  return [...staticPages, ...newsPages]
}
