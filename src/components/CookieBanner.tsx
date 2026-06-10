'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X, Check } from 'lucide-react'

const STORAGE_KEY = 'cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show only if the user hasn't made a choice yet
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-xl
                 bg-[#14151E] border border-[#252637] rounded-2xl shadow-2xl
                 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
        <Cookie className="w-4 h-4 text-accent" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium leading-snug">
          Nous utilisons des cookies
        </p>
        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
          Ce site utilise des cookies essentiels pour votre session de connexion et le bon
          fonctionnement de la plateforme. Aucune donnée n&apos;est partagée avec des tiers.{' '}
          <Link href="/about" className="text-accent hover:underline">
            En savoir plus
          </Link>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
        <button
          onClick={decline}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5
                     px-4 py-2 rounded-xl text-sm font-medium border
                     bg-transparent border-[#252637] text-gray-400
                     hover:border-gray-500 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Refuser
        </button>
        <button
          onClick={accept}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5
                     px-4 py-2 rounded-xl text-sm font-medium border
                     bg-accent/15 border-accent/30 text-accent
                     hover:bg-accent/25 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Accepter
        </button>
      </div>
    </div>
  )
}
