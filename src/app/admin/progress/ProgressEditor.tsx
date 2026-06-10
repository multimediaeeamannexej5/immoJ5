'use client'

import { useState } from 'react'
import { Loader2, Plus, Minus } from 'lucide-react'
import { manualProgressUpdate } from '../actions'
import { useRouter } from 'next/navigation'

export default function ProgressEditor() {
  const router = useRouter()
  const [amount,  setAmount]  = useState('')
  const [note,    setNote]    = useState('')
  const [type,    setType]    = useState<'add' | 'sub'>('add')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const value = parseFloat(amount)
    if (!value || value <= 0) { setError('Entrez un montant valide.'); return }

    setLoading(true)
    try {
      await manualProgressUpdate(type === 'add' ? value : -value, note)
      setSuccess(true)
      setAmount('')
      setNote('')
      setTimeout(() => { setSuccess(false); router.refresh() }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur mise à jour')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          ✓ Progression mise à jour avec succès.
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add / Subtract toggle */}
      <div className="flex gap-2">
        <button type="button"
          onClick={() => setType('add')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            type === 'add'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-[#0A0B10] border-[#252637] text-gray-400 hover:border-emerald-500/20'
          }`}>
          <Plus className="w-4 h-4" /> Ajouter un montant
        </button>
        <button type="button"
          onClick={() => setType('sub')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            type === 'sub'
              ? 'bg-red-500/15 border-red-500/30 text-red-400'
              : 'bg-[#0A0B10] border-[#252637] text-gray-400 hover:border-red-500/20'
          }`}>
          <Minus className="w-4 h-4" /> Corriger à la baisse
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Montant (MAD) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Ex: 1500"
            className="w-full px-4 py-3 bg-[#0A0B10] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Note <span className="text-gray-500 font-normal">(recommandée)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ex: Paiement cash de M. Dupont"
            className="w-full px-4 py-3 bg-[#0A0B10] border border-[#252637] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !amount}
        className={`w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2 ${
          type === 'add'
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : 'bg-red-500/80 text-white hover:bg-red-500'
        }`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {type === 'add' ? `Ajouter ${amount ? amount + ' MAD' : ''}` : `Réduire de ${amount ? amount + ' MAD' : ''}`}
      </button>
    </form>
  )
}
