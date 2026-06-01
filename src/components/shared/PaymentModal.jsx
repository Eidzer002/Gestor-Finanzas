import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useData } from '../../context/DataContext'
import { useDebts } from '../../hooks/useDebts'
import { formatCurrency } from '../../lib/utils'

export default function PaymentModal() {
  const { modals, closeModal, showToast } = useApp()
  const { debts } = useData()
  const { registerPayment } = useDebts()
  const { open, debtId } = modals.payment

  const [amount,  setAmount]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  const debt = debtId ? debts.find(d => d.id === debtId) : null
  const remaining = debt ? debt.total - debt.paid : 0

  useEffect(() => { if (open) { setAmount(''); setError(null) } }, [open])

  const handleSave = async (e) => {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0)      return setError('Ingresa un monto válido.')
    if (val > remaining)       return setError(`El monto supera lo pendiente (${remaining.toFixed(2)} ${debt?.currency}).`)
    setError(null); setSaving(true)
    try {
      await registerPayment(debtId, val)
      showToast('Pago registrado', 'success')
      closeModal('payment')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open || !debt) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="modal-overlay absolute inset-0" onClick={() => closeModal('payment')} />
      <div className="relative w-full max-w-sm modal-content rounded-2xl p-5 mx-4 animate-slide-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{debt.type === 'iowe' ? 'Registrar pago' : 'Registrar cobro'}</h2>
          <button onClick={() => closeModal('payment')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✕</button>
        </div>

        <div className="glass-card p-3 mb-4 space-y-1">
          <p className="text-sm text-slate-400">Deuda con <span className="text-white font-medium">{debt.person}</span></p>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total:</span>
            <span>{formatCurrency(debt.total, debt.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Pagado:</span>
            <span className="text-green-400">{formatCurrency(debt.paid, debt.currency)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-slate-400">Pendiente:</span>
            <span className="text-orange-400">{formatCurrency(remaining, debt.currency)}</span>
          </div>
        </div>

        {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm mb-3">{error}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Monto a {debt.type === 'iowe' ? 'pagar' : 'cobrar'} ({debt.currency})</label>
            <div className="flex gap-2">
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" step="0.01" min="0.01" className="glass-input flex-1" autoFocus />
              <button type="button" onClick={() => setAmount(String(remaining))}
                className="btn-neutral px-3 py-2 text-xs rounded-lg whitespace-nowrap">Todo</button>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => closeModal('payment')} className="flex-1 btn-neutral py-3">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-[2] btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Guardando...</> : '✓ Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
