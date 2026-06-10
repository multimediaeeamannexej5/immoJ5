'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={`w-9 h-9 rounded-xl border border-[var(--bd)] bg-[var(--bg-card)] text-[var(--tx-4)] hover:text-accent hover:border-accent/40 transition-all flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {theme === 'dark'
        ? <Sun  className="w-4 h-4" />
        : <Moon className="w-4 h-4" />}
    </button>
  )
}
