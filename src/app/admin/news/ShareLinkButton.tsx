'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

export default function ShareLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const url = `${window.location.origin}/news/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={copy}
      title="Copier le lien de l'article"
      className={`p-2 rounded-lg border transition-all ${
        copied
          ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
          : 'border-[#252637] text-gray-400 hover:text-white hover:border-[#3a3b52]'
      }`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
    </button>
  )
}
