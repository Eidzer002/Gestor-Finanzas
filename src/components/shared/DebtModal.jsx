import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useData } from '../../context/DataContext'
import { useDebts } from '../../hooks/useDebts'

const CURRENCIES = ['CUP','USD','EUR','GBP','USDT','MXN','CAD','BRL','JPY']

export default function DebtModal() {
  const { modals, closeModal, showToast } = useApp()
  const { settings, debts } = useData()
  const { addDebt, updateDebt } = useDebts()
  const { open, editId } = modals.debt

  const [type,      setType]     = useState('iowe')
  const [person,    setPerson]   = useState('')
  const [total,     setTotal]    = useState('')
  const [paid,      setPaid]     = useState('0')
  const [currency,  setCurrency] = useState(settings.main_currency)
  const [dueDate,   setDueDate]  = useState('')
  const [debtType,  setDebtType] = useState('cash')
  const [notes,     setNotes]    = useState('')
  const [saving,    setSaving]   = useState(false)
  const [error,     setError]    = useState(null)

  useEffect(() => {
    if (!open) return
    if (editId) {
      const d = debts.find(x => x.id === editId)
      if (d) {
        setType(d.type); setPerson(d.person); setTotal(String(d.total))
        setPaid(String(d.paid)); setCurrency(d.currency)
        setDueDate(d.due_date || ''); setDebtType(d.debt_type); setNotes(d.notes || '')
        return
      }
    }
    setType(modals.debt.debtType || 'iowe'); setPerson(''); setTotal('')
    setPaid('0'); setCurrency(settings.main_currency); setDueDate('')
    setDebtType('cash'); setNotes(''); setError(null)
  }, [open, editId])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!person.trim())                        return setError('Indica el nombre de la persona.')
    if (!total || parseFloat(total) <= 0)      return setError('Ingresa el monto total.')
    if (parseFloat(paid) > parseFloat(total))  return setError('El monto pagado no puede superar el total.')
    setError(null); setSaving(true)
    try {
      const t = parseFloat(total), p = parseFloat(paid) || 0
      const status = p >= t ? 'paid' : p > 0 ? 'partial' : 'pending'
      const data = { type, person: person.trim(), total: t, paid: p, currency, due_date: dueDate || null, debt_type: debtType, notes: notes.trim() || null, status }
      if (editId) await updateDebt(editId, data)
      else        await addDebt(data)
      showToast(editId ? 'Deuda actualizada' : 'Deuda guardada', 'success')
      closeModal('debt')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
      <div className="modal-overlay absolute inset-0" onClick={() => closeModal('debt')} />
      <div className="relative w-full max-w-md modal-content md:rounded-2xl rounded-t-3xl overflow-y-auto max-h-[95vh] animate-slide-in">
        <div className="sticky top-0 bg-[#1e293b] flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold">{editId ? 'Editar deuda' : type === 'iowe' ? 'Nueva deuda' : 'Nuevo préstamo'}</h2>
          <button onClick={() => closeModal('debt')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✕</button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

          {!editId && (
            <div className="flex gap-2">
              {[['iowe','Yo debo','bg-red-500/20 text-red-400 border-red-500/30'],
                ['owed','Me deben','bg-green-500/20 text-green-400 border-green-500/30']].map(([v,l,ac]) => (
                <button key={v} type="button" onClick={() => setType(v)}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm border transition-all ${type===v ? ac : 'bg-white/5 text-slate-400 border-white/10'}`}>
                  {l}
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 mb-1 block">{type === 'iowe' ? 'Acreedor (a quién le debes)' : 'Deudor (quién te debe)'}</label>
            <input type="text" value={person} onChange={e => setPerson(e.target.value)} placeholder="Nombre de la persona" className="glass-input" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Monto total</label>
            <div className="flex gap-2">
              <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="0.00" step="0.01" min="0.01" className="glass-input flex-1" />
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="glass-input w-24">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Ya {type === 'iowe' ? 'pagado' : 'cobrado'} (opcional)</label>
            <input type="number" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0.00" step="0.01" min="0" className="glass-input" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tipo</label>
            <select value={debtType} onChange={e => setDebtType(e.target.value)} className="glass-input">
              <option value="cash">💵 Dinero</option>
              <option value="goods">📦 Bienes</option>
              <option value="service">🔧 Servicio</option>
              <option value="other">📋 Otro</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Fecha de vencimiento (opcional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="glass-input" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notas (opcional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalles adicionales..." rows={2} className="glass-input resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => closeModal('debt')} className="flex-1 btn-neutral py-3">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-[2] btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Guardando...</> : (editId ? '✓ Actualizar' : '✓ Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
