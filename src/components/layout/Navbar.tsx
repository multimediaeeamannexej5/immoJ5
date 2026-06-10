'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [isOpen,   setIsOpen]   = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user,     setUser]     = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const navLinks = [
    { href: '/',        label: 'Accueil' },
    { href: '/news',    label: 'Actualités' },
    { href: '/about',   label: 'À propos' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled ? 'border-[var(--bd)] shadow-lg shadow-black/10' : 'border-[var(--bd)]/40'
      }`}
      style={{
        /* Fond solide via CSS var — fonctionne en mode clair ET sombre */
        backgroundColor: `rgba(var(--bg-base-rgb), ${scrolled ? 0.97 : 0.92})`,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo EEAM */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-lg bg-white p-0.5 shadow-sm overflow-hidden">
              <Image
                src="/images/logo_eeam.jpg"
                alt="EEAM"
                width={36}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-[var(--tx-1)] text-base tracking-tight leading-tight hidden sm:block">
              EEAM<span className="text-accent"> Annexe J5</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--tx-1)] hover:text-accent text-sm font-medium transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA + theme toggle */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--bd)] text-[var(--tx-1)] text-sm font-medium hover:border-accent transition-colors"
              >
                Mon espace
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-[var(--tx-1)] hover:text-accent text-sm font-medium transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="text-[var(--tx-1)] p-1"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div
          className="lg:hidden border-t border-[var(--bd)]"
          style={{ backgroundColor: `rgba(var(--bg-base-rgb), 0.97)`, backdropFilter: 'blur(14px)' }}
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 text-[var(--tx-1)] hover:text-accent text-sm font-medium rounded-lg hover:bg-[var(--bg-card)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[var(--bd)] flex flex-col gap-2">
              {user ? (
                <Link href="/dashboard" onClick={() => setIsOpen(false)}
                  className="px-3 py-2.5 text-center rounded-lg bg-[var(--bg-card)] border border-[var(--bd)] text-[var(--tx-1)] text-sm font-medium">
                  Mon espace
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}
                    className="px-3 py-2.5 text-center text-[var(--tx-1)] text-sm">
                    Connexion
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsOpen(false)}
                    className="px-3 py-2.5 text-center rounded-lg bg-accent text-white text-sm font-bold">
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
