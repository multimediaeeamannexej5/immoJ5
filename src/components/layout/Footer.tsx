import Image from 'next/image'
import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-base)] border-t border-[var(--bd)] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-white p-0.5 shadow-sm overflow-hidden flex-shrink-0">
                <Image
                  src="/images/logo_eeam.jpg"
                  alt="EEAM"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-[var(--tx-1)] text-lg">
                EEAM<span className="text-accent"> Annexe J5</span>
              </span>
            </div>
            <p className="text-[var(--tx-3)] text-sm leading-relaxed">
              C&apos;est à nous de bâtir la maison de Dieu. Chaque contribution, grande ou petite, construit notre avenir commun.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[var(--tx-1)] font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2">
              {[
                { href: '/',       label: 'Accueil' },
                { href: '/donate', label: 'Faire un don' },
                { href: '/news',   label: 'Actualités' },
                { href: '/about',  label: 'À propos' },
                { href: '/contact',label: 'Contact' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[var(--tx-3)] hover:text-accent text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[var(--tx-1)] font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-[var(--tx-3)] text-sm">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                multimedia.eeam.annexej5@gmail.com
              </li>
              <li className="flex items-center gap-2 text-[var(--tx-3)] text-sm">
                <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                +212 656-045138
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--bd)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[var(--tx-4)] text-xs">
            © {new Date().getFullYear()} EEAM Annexe J5. Tous droits réservés.
          </p>
          <p className="text-[var(--tx-4)] text-xs">
            Plateforme de collecte communautaire
          </p>
        </div>
      </div>
    </footer>
  )
}
