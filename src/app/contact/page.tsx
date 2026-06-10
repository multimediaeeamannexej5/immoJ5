import Image from 'next/image'
import Link from 'next/link'
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Contact — EEAM Annexe J5',
  description: 'Contactez l\'Église Évangélique au Maroc — Annexe J5. Retrouvez nos contacts à Rabat et pour la diaspora.',
}

const CONTACTS = [
  {
    image:    '/images/paroisse1.png',
    name:     'Boris ABALO',
    category: 'Église Centrale',
    phone:    '+212 691-052394',
  },
  {
    image:    '/images/paroisse2.png',
    name:     'Michelle LAKPA',
    category: 'Église Centrale',
    phone:    '+212 634-904551',
  },
  {
    image:    '/images/J5.png',
    name:     'Edgar LADISLAS',
    category: 'Annexe J5',
    phone:    '+212 695-723410',
  },
  {
    image:    '/images/Diaspora.png',
    name:     'Vanne NKOY',
    category: 'Contact Diaspora',
    phone:    '+212 673-623053',
  },
]

const MAPS_EMBED = 'https://maps.google.com/maps?q=44+avenue+allal+ben+abdellah+Rabat+Maroc&output=embed&hl=fr'
const MAPS_LINK  = 'https://maps.google.com/?q=44+avenue+allal+ben+abdellah+Rabat+Maroc'

export default function ContactPage() {
  return (
    <main className="bg-[var(--bg-base)] min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">

        {/* ── En-tête ───────────────────────────────────────────── */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-medium mb-4">
            <Mail className="w-3.5 h-3.5" />
            Contact
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--tx-1)] mb-3">
            Nous contacter
          </h1>
          <p className="text-[var(--tx-3)] text-base sm:text-lg max-w-2xl">
            Pour toute question sur le projet de construction ou pour rejoindre la communauté,
            n&apos;hésitez pas à nous écrire ou appeler.
          </p>
        </div>

        {/* ── Infos église + Carte ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">

          {/* Infos */}
          <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-7 flex flex-col gap-6">
            {/* Logo + nom */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-sm overflow-hidden flex-shrink-0">
                <Image src="/images/logo_eeam.jpg" alt="EEAM" width={44} height={44}
                  className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-[var(--tx-1)] font-bold text-base leading-tight">EEAM Annexe J5</p>
                <p className="text-[var(--tx-4)] text-xs">Église Évangélique au Maroc</p>
              </div>
            </div>

            {/* Adresse */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[var(--tx-1)] text-sm font-medium">Adresse</p>
                <p className="text-[var(--tx-3)] text-sm mt-0.5 leading-relaxed">
                  44 avenue Allal Ben Abdellah Hassan<br />
                  Rabat, Maroc
                </p>
                <Link href={MAPS_LINK} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent text-xs font-medium mt-2 hover:underline">
                  Voir sur Google Maps <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[var(--tx-1)] text-sm font-medium">E-mail</p>
                <a href="mailto:multimedia.eeam.annexej5@gmail.com"
                  className="text-[var(--tx-3)] text-sm mt-0.5 hover:text-accent transition-colors break-all">
                  multimedia.eeam.annexej5@gmail.com
                </a>
              </div>
            </div>

            {/* Téléphone église */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Phone className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[var(--tx-1)] text-sm font-medium">Téléphone</p>
                <a href="tel:+212656045138"
                  className="text-[var(--tx-3)] text-sm mt-0.5 hover:text-accent transition-colors">
                  +212 656-045138
                </a>
              </div>
            </div>

            {/* Fr. Albert */}
            <div className="pt-4 border-t border-[var(--bd)]">
              <p className="text-[var(--tx-4)] text-xs uppercase tracking-widest mb-2">Responsable administratif</p>
              <p className="text-[var(--tx-1)] text-sm font-semibold">Fr. Albert</p>
              <p className="text-[var(--tx-4)] text-xs mt-0.5">Assistant de paroisse</p>
            </div>
          </div>

          {/* Carte Google Maps */}
          <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl overflow-hidden min-h-[320px]">
            <iframe
              src={MAPS_EMBED}
              width="100%"
              height="100%"
              style={{ minHeight: '320px', border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="EEAM Annexe J5 — Rabat"
            />
          </div>
        </div>

        {/* ── Contacts par zone ────────────────────────────────── */}
        <div>
          <h2 className="text-[var(--tx-1)] font-bold text-xl mb-2">Nos contacts</h2>
          <p className="text-[var(--tx-3)] text-sm mb-8">
            Retrouvez la personne à contacter selon votre localisation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CONTACTS.map(c => (
              <div key={c.name}
                className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl overflow-hidden hover:border-accent/30 transition-colors group">

                {/* Badge catégorie */}
                <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest ${
                  c.category === 'Contact Diaspora'
                    ? 'bg-blue-500/10 text-blue-400 border-b border-blue-500/20'
                    : c.category === 'Annexe J5'
                    ? 'bg-accent/10 text-accent border-b border-accent/20'
                    : 'bg-[var(--bg-base)] text-[var(--tx-4)] border-b border-[var(--bd)]'
                }`}>
                  {c.category}
                </div>

                {/* Image (contient déjà le nom + téléphone) */}
                <div className="p-4">
                  <Image
                    src={c.image}
                    alt={c.name}
                    width={400}
                    height={200}
                    className="w-full h-auto rounded-xl"
                  />
                </div>

                {/* Lien d'appel */}
                <div className="px-4 pb-4">
                  <a href={`tel:${c.phone.replace(/[\s-]/g, '')}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-colors group-hover:border-accent/40">
                    <Phone className="w-4 h-4" />
                    Appeler
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </main>
  )
}
