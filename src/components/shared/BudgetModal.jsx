import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useData } from '../../context/DataContext'
import { useBudgets } from '../../hooks/useBudgets'

const CURRENCIES = ['CUP','USD','EUR','GBP','USDT','MXN','CAD','BRL','JPY']
const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']

export default function BudgetModal() {
  const { modals, closeModal, showToast } = useApp()
  const { categories, settings, budgets } = useData()
  const { addBudget, updateBudget } = useBudgets()
  const { open, editId } = modals.budget

  const [categoryId, setCategoryId] = useState('')
  const [limitAmount, setLimit]     = useState('')
  const [currency, setCurrency]     = useState(settings.main_currency)
  const [color, setColor]           = useState('#3b82f6')
  const [recurring, setRecurring]   = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)

  const expenseCategories = categories.filter(c => c.type === 'expense')

  useEffect(() => {
    if (!open) return
    if (editId) {
      const b = budgets.find(x => x.id === editId)
      if (b) {
        setCategoryId(b.category_id || ''); setLimit(String(b.limit_amount))
        setCurrency(b.currency); setColor(b.color); setRecurring(b.recurring)
        return
      }
    }
    setCategoryId(expenseCategories[0]?.id || ''); setLimit(''); setCurrency(settings.main_currency)
    setColor('#3b82f6'); setRecurring(true); setError(null)
  }, [open, editId])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!categoryId)          return setError('Selecciona una categoría.')
    if (!limitAmount || parseFloat(limitAmount) <= 0) return setError('Ingresa un límite válido.')
    setError(null); setSaving(true)
    try {
      const data = { category_id: categoryId, limit_amount: parseFloat(limitAmount), currency, color, recurring }
      if (editId) await updateBudget(editId, data)
      else        await addBudget(data)
      showToast(editId ? 'Presupuesto actualizado' : 'Presupuesto guardado', 'success')
      closeModal('budget')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
      <div className="modal-overlay absolute inset-0" onClick={() => closeModal('budget')} />
      <div className="relative w-full max-w-md modal-content md:rounded-2xl rounded-t-3xl p-0 overflow-hidden animate-slide-in">
        <div className="sticky top-0 bg-[#1e293b] flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold">{editId ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h2>
          <button onClick={() => closeModal('budget')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✕</button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Categoría de gasto</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="glass-input">
              {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Límite mensual</label>
            <div className="flex gap-2">
              <input type="number" value={limitAmount} onChange={e => setLimit(e.target.value)}
                placeholder="0.00" step="0.01" min="0.01" className="glass-input flex-1" />
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="glass-input w-24">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <button type="button" onClick={() => setRecurring(r => !r)}
            className="w-full flex items-center justify-between p-3 glass-card rounded-xl">
            <span className="text-sm">🔁 Recurrente cada mes</span>
            <div className={`toggle-switch ${recurring ? 'active' : ''}`} />
          </button>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => closeModal('budget')} className="flex-1 btn-neutral py-3">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex-[2] btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</> : (editId ? '✓ Actualizar' : '✓ Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
