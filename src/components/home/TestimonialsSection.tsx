import { Quote } from 'lucide-react'
import type { Testimonial } from '@/types'

type Props = { testimonials: Testimonial[] }

export default function TestimonialsSection({ testimonials }: Props) {
  if (testimonials.length === 0) return null

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--bg-base)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-accent text-sm font-semibold uppercase tracking-widest">Témoignages</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--tx-1)] mt-2">Ce Qu&apos;ils Disent</h2>
          <p className="text-[var(--tx-3)] mt-3">Histoires de donateurs qui ont rejoint notre communauté.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map(t => {
            const initials = t.author_name
              .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

            return (
              <div key={t.id}
                className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-2xl p-6 hover:border-accent/30 transition-colors">
                <Quote className="w-6 h-6 text-accent/40 mb-4" />
                <p className="text-[var(--tx-2)] text-sm leading-relaxed mb-6 italic">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.author_name}
                      className="w-9 h-9 rounded-full object-cover border border-accent/30" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                      <span className="text-accent text-xs font-bold">{initials}</span>
                    </div>
                  )}
                  <div>
                    <div className="text-[var(--tx-1)] text-sm font-medium">{t.author_name}</div>
                    <div className="text-[var(--tx-4)] text-xs">Donateur</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
