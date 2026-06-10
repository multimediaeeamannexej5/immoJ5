'use client'

import { useState } from 'react'
import { Link2, Check, MessageCircle } from 'lucide-react'

type Props = {
  url:     string
  title:   string
  excerpt: string
}

export default function ShareButtons({ url, title, excerpt }: Props) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const whatsappText = encodeURIComponent(`${title}\n\n${excerpt.slice(0, 120)}…\n\n${url}`)
  const whatsappUrl  = `https://wa.me/?text=${whatsappText}`

  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--tx-4)] text-xs mr-1">Partager :</span>

      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-medium hover:bg-[#25D366]/20 transition-colors"
        aria-label="Partager sur WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        WhatsApp
      </a>

      {/* Copy link */}
      <button
        onClick={copyLink}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
          copied
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-[var(--bg-card)] border-[var(--bd)] text-[var(--tx-3)] hover:border-[var(--logo-blue)] hover:text-[var(--logo-blue)]'
        }`}
        aria-label="Copier le lien"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? 'Copié !' : 'Copier le lien'}
      </button>
    </div>
  )
}
