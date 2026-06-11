import Image from 'next/image'
import { Phone } from 'lucide-react'

const CONTACTS = [
  {
    name:     'Boris ABALO',
    category: 'Église Centrale',
    image:    '/images/paroisse1.png',
    phone:    '+212 691-052394',
    colorBg:  'bg-[var(--bg-base)]',
    colorTx:  'text-[var(--tx-4)]',
  },
  {
    name:     'Michelle LAKPA',
    category: 'Église Centrale',
    image:    '/images/paroisse2.png',
    phone:    '+212 634-904551',
    colorBg:  'bg-[var(--bg-base)]',
    colorTx:  'text-[var(--tx-4)]',
  },
  {
    name:     'Edgar LADISLAS',
    category: 'Annexe J5',
    image:    '/images/J5.png',
    phone:    '+212 695-723410',
    colorBg:  'bg-accent/10',
    colorTx:  'text-accent',
  },
  {
    name:     'Vanne NKOY',
    category: 'Diaspora',
    image:    '/images/Diaspora.png',
    phone:    '+212 673-623053',
    colorBg:  'bg-blue-500/10',
    colorTx:  'text-blue-400',
  },
] as const

export default function PaymentContacts() {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-[var(--tx-2)] mb-3">
        À qui envoyer le paiement
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CONTACTS.map(c => (
          <div
            key={c.name}
            className="bg-[var(--bg-base)] border border-[var(--bd)] rounded-xl overflow-hidden hover:border-accent/25 transition-colors"
          >
            {/* Badge zone */}
            <div className={`px-2 py-0.5 text-xs font-semibold text-center border-b border-[var(--bd)] ${c.colorBg} ${c.colorTx}`}>
              {c.category}
            </div>

            {/* Photo */}
            <div className="p-1.5">
              <Image
                src={c.image}
                alt={c.name}
                width={300}
                height={150}
                className="w-full h-auto rounded-lg"
              />
            </div>

            {/* Nom + appel */}
            <div className="px-2 pb-2 text-center">
              <p className="text-[var(--tx-1)] text-xs font-bold leading-tight mb-1.5">
                {c.name}
              </p>
              <a
                href={`tel:${c.phone.replace(/[\s-]/g, '')}`}
                className="inline-flex items-center justify-center gap-1 w-full py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
              >
                <Phone className="w-3 h-3" />
                Appeler
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
