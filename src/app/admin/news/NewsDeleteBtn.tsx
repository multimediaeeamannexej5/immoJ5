'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { deleteArticle } from './actions'

export default function NewsDeleteBtn({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Supprimer cet article définitivement ?')) return
    setLoading(true)
    await deleteArticle(id)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Supprimer"
      className="p-2 rounded-lg border border-red-500/20 text-red-500/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </button>
  )
}
