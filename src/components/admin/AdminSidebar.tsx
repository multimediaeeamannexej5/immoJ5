'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, CreditCard, Users,
  ShieldCheck, TrendingUp, LogOut,
  Heart, Menu, X, Wallet, Newspaper, CalendarCheck,
} from 'lucide-react'
import type { AdminRole } from '@/types'

type Props = {
  role:     AdminRole
  fullName: string | null
  email:    string
  base?:    '/admin' | '/treasurer'  // which dashboard we're in
}

const ADMIN_NAV = [
  { href: '/admin',             icon: LayoutDashboard, label: 'Dashboard',   roles: ['super_admin','communication_manager','treasurer'] },
  { href: '/admin/donations',   icon: CreditCard,      label: 'Dons',        roles: ['super_admin','finance_manager','treasurer'] },
  { href: '/admin/users',       icon: Users,           label: 'Donateurs',   roles: ['super_admin','finance_manager','communication_manager','treasurer'] },
  { href: '/admin/admins',      icon: ShieldCheck,     label: 'Admins',      roles: ['super_admin'] },
  { href: '/admin/progress',    icon: TrendingUp,      label: 'Progression', roles: ['super_admin','finance_manager','treasurer'] },
  { href: '/admin/news',        icon: Newspaper,       label: 'Actualités',  roles: ['super_admin','communication_manager','treasurer'] },
  { href: '/admin/commitments', icon: CalendarCheck,   label: 'Engagements', roles: ['super_admin','treasurer'] },
] as const

const TREASURER_NAV = [
  { href: '/treasurer',          icon: Wallet,          label: 'Dons à valider' },
  { href: '/treasurer/donors',   icon: Users,           label: 'Donateurs'      },
  { href: '/treasurer/progress', icon: TrendingUp,      label: 'Progression'    },
] as const

const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin:           'Super Admin',
  finance_manager:       'Finance',
  communication_manager: 'Communication',
  treasurer:             'Trésorier',
}

const ROLE_COLOR: Record<AdminRole, string> = {
  super_admin:           'text-accent bg-accent/10 border-accent/30',
  finance_manager:       'text-blue-400 bg-blue-500/10 border-blue-500/30',
  communication_manager: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  treasurer:             'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
}

export default function AdminSidebar({ role, fullName, email, base = '/admin' }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const links = base === '/treasurer'
    ? TREASURER_NAV
    : (ADMIN_NAV.filter(n => (n.roles as readonly string[]).includes(role)) as typeof ADMIN_NAV[number][])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === base ? pathname === href : pathname.startsWith(href)

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#0A0B10] border-r border-[#252637]">
      {/* Logo */}
      <div className="p-5 border-b border-[#252637]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white fill-current" />
          </div>
          <span className="font-bold text-white text-sm">
            Church<span className="text-accent">Project</span>
          </span>
        </Link>
        <span className={`mt-2 inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${ROLE_COLOR[role]}`}>
          {ROLE_LABEL[role]}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {(links as readonly { href: string; icon: React.ElementType; label: string }[]).map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-accent/15 text-accent border border-accent/25'
                  : 'text-gray-400 hover:text-white hover:bg-[#14151E]'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-[#252637]">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
            <span className="text-accent text-xs font-bold">
              {(fullName ?? 'A')[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-medium truncate">{fullName ?? 'Admin'}</div>
            <div className="text-gray-500 text-xs truncate">{email}</div>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 text-sm transition-colors">
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 z-40 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 bg-[#0A0B10]/95 backdrop-blur-md border-b border-[#252637] flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
            <Heart className="w-3 h-3 text-white fill-current" />
          </div>
          <span className="font-bold text-white text-sm">Church<span className="text-accent">Project</span></span>
        </Link>
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 pt-14 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-60 h-full">
            <Sidebar />
          </div>
        </div>
      )}
    </>
  )
}
