import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import NewsEditor from '../../NewsEditor'
import type { NewsPost } from '@/types'

export const metadata = { title: 'Modifier l\'article — Admin' }

type Props = { params: Promise<{ id: string }> }

export default async function EditArticlePage({ params }: Props) {
  const { id }   = await params
  const supabase  = await createClient()

  const { data } = await supabase
    .from('news_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/admin/news"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux actualités
        </Link>
        <h1 className="text-2xl font-bold text-white">Modifier l&apos;article</h1>
        <p className="text-gray-400 text-sm mt-1 truncate">{data.title}</p>
      </div>
      <NewsEditor article={data as NewsPost} />
    </div>
  )
}
