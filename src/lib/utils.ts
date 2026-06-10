export function formatMAD(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function progressPercent(collected: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(100, Math.round((collected / goal) * 100))
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1)   return "à l'instant"
  if (minutes < 60)  return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)    return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30)     return `il y a ${days}j`
  const months = Math.floor(days / 30)
  return `il y a ${months} mois`
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Virement bancaire',
  cash_plus:     'Cash Plus',
  wafacash:      'Wafacash',
  western_union: 'Western Union',
  moneygram:     'MoneyGram',
  direct:        'Paiement direct à l\'église',
}

export const STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  validated: 'Validé',
  rejected:  'Rejeté',
  overdue:   'En retard',
}

export const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  validated: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected:  'bg-red-500/20 text-red-400 border-red-500/30',
  overdue:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
}
