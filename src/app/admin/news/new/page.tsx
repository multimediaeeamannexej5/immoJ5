import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import NewsEditor from '../NewsEditor'

export const metadata = { title: 'Nouvel article — Admin' }

export default function NewArticlePage() {
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
        <h1 className="text-2xl font-bold text-white">Nouvel article</h1>
        <p className="text-gray-400 text-sm mt-1">Rédigez et publiez une actualité</p>
      </div>
      <NewsEditor />
    </div>
  )
}
