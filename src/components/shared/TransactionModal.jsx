import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useTransactions } from '../../hooks/useTransactions'
import { getToday, getYesterday, convertBetween } from '../../lib/utils'
import { CalculatorUI } from './Calculator'

const CURRENCIES = ['CUP','USD','EUR','GBP','USDT','MXN','CAD','BRL','JPY']

export default function TransactionModal() {
  const { modals, closeModal, showToast } = useApp()
  const { user }  = useAuth()
  const { wallets, categories, settings, exchangeRates, transactions } = useData()
  const { addTransaction, updateTransaction } = useTransactions()
  const { open, editId } = modals.transaction

  const [type,        setType]        = useState('expense')
  const [walletId,    setWalletId]    = useState('')
  const [walletDestId,setWalletDestId]= useState('')
  const [amount,      setAmount]      = useState('')
  const [currency,    setCurrency]    = useState(settings.main_currency)
  const [categoryId,  setCategoryId]  = useState('')
  const [description, setDescription] = useState('')
  const [date,        setDate]        = useState(getToday())
  const [recurring,   setRecurring]   = useState(false)
  const [frequency,   setFrequency]   = useState('monthly')
  const [nextDate,    setNextDate]    = useState('')
  const [notes,       setNotes]       = useState('')
  const [tags,        setTags]        = useState('')
  const [showNotes,   setShowNotes]   = useState(false)
  const [showCalc,    setShowCalc]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState(null)

  // Rellenar al editar / resetear al abrir nuevo
  useEffect(() => {
    if (!open) return
    if (editId) {
      const t = transactions.find(tr => tr.id === editId)
      if (t) {
        setType(t.type); setWalletId(t.wallet_id); setWalletDestId(t.wallet_dest_id || '')
        setAmount(String(t.amount)); setCurrency(t.currency); setCategoryId(t.category_id || '')
        setDescription(t.description || ''); setDate(t.date); setRecurring(t.recurring || false)
        setFrequency(t.frequency || 'monthly'); setNextDate(t.next_date || '')
        setNotes(t.notes || ''); setTags((t.tags || []).join(', '))
        setShowNotes(!!(t.notes || t.tags?.length)); return
      }
    }
    setType('expense'); setWalletId(wallets[0]?.id || ''); setWalletDestId('')
    setAmount(''); setCurrency(settings.main_currency); setCategoryId('')
    setDescription(''); setDate(getToday()); setRecurring(false)
    setFrequency('monthly'); setNextDate(''); setNotes(''); setTags('')
    setShowNotes(false); setError(null)
  }, [open, editId])

  // Auto next_date al activar recurrencia
  useEffect(() => {
    if (recurring && date && !nextDate) {
      const d = new Date(date + 'T00:00:00')
      d.setMonth(d.getMonth() + 1)
      setNextDate(d.toISOString().split('T')[0])
    }
  }, [recurring])

  const filteredCats = categories.filter(c => c.type === (type === 'transfer' ? 'expense' : type))

  const convertedPreview = useCallback(() => {
    if (type !== 'transfer' || !walletId || !walletDestId || !amount) return null
    const src  = wallets.find(w => w.id === walletId)
    const dest = wallets.find(w => w.id === walletDestId)
    if (!src || !dest || src.currency === dest.currency) return null
    const converted = convertBetween(parseFloat(amount), src.currency, dest.currency, exchangeRates)
    return `≈ ${converted.toFixed(2)} ${dest.currency}`
  }, [type, walletId, walletDestId, amount, wallets, exchangeRates])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!walletId)                         return setError('Selecciona una billetera.')
    if (!amount || parseFloat(amount) <= 0) return setError('Ingresa un monto válido.')
    if (type === 'transfer' && !walletDestId) return setError('Selecciona la billetera destino.')
    if (type === 'transfer' && walletId === walletDestId) return setError('Las billeteras deben ser diferentes.')
    setError(null); setSaving(true)
    try {
      const data = {
        type, wallet_id: walletId,
        wallet_dest_id: type === 'transfer' ? walletDestId : null,
        amount: parseFloat(amount), currency,
        category_id: categoryId || null,
        description: description.trim(), date, recurring,
        frequency:  recurring ? frequency  : null,
        next_date:  recurring ? nextDate   : null,
        notes: notes.trim() || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      if (editId) await updateTransaction(editId, data)
      else        await addTransaction(data)
      showToast(editId ? 'Transacción actualizada' : 'Transacción guardada', 'success')
      closeModal('transaction')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const TypeBtn = ({ value, label, emoji, active }) => (
    <button type="button" onClick={() => { setType(value); setCategoryId('') }}
      className={`flex-1 py-3 rounded-xl font-medium text-sm flex flex-col items-center gap-1 border transition-all ${active}`}>
      <span>{emoji}</span>{label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
      <div className="modal-overlay absolute inset-0" onClick={() => !saving && closeModal('transaction')} />
      <div className="relative w-full max-w-md modal-content md:rounded-2xl rounded-t-3xl overflow-y-auto max-h-[95vh] animate-slide-in">

        {/* Header */}
        <div className="sticky top-0 bg-[#1e293b] flex items-center justify-between p-4 border-b border-white/10 z-10">
          <h2 className="text-lg font-bold">{editId ? 'Editar transacción' : 'Nueva transacción'}</h2>
          <button type="button" onClick={() => closeModal('transaction')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✕</button>
        </div>

        {/* Calculadora inline */}
        {showCalc && (
          <div className="border-b border-white/10">
            <CalculatorUI
              onResult={(val) => { setAmount(String(val)); setShowCalc(false) }}
              onClose={() => setShowCalc(false)}
            />
          </div>
        )}

        <form onSubmit={handleSave} className="p-4 space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

          {/* Tipo */}
          <div className="flex gap-2">
            <TypeBtn value="expense"  label="Gasto"    emoji="📤" active={type==='expense'  ? 'bg-red-500/20 text-red-400 border-red-500/30'   : 'bg-white/5 text-slate-400 border-white/10'} />
            <TypeBtn value="income"   label="Ingreso"  emoji="📥" active={type==='income'   ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 text-slate-400 border-white/10'} />
            <TypeBtn value="transfer" label="Transfer" emoji="🔄" active={type==='transfer' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'   : 'bg-white/5 text-slate-400 border-white/10'} />
          </div>

          {/* Monto */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Monto</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" step="0.01" min="0.01" className="glass-input pr-10" />
                <button type="button" onClick={() => setShowCalc(s => !s)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg transition-colors ${showCalc ? 'text-blue-400' : 'text-slate-400'}`}>
                  🧮
                </button>
              </div>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="glass-input w-24">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {convertedPreview() && <p className="text-xs text-blue-400 mt-1">{convertedPreview()}</p>}
          </div>

          {/* Billetera origen */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Billetera</label>
            <select value={walletId} onChange={e => setWalletId(e.target.value)} className="glass-input">
              <option value="">— Seleccionar —</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.icon} {w.name} ({w.balance.toFixed(2)} {w.currency})</option>
              ))}
            </select>
          </div>

          {/* Billetera destino */}
          {type === 'transfer' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Billetera destino</label>
              <select value={walletDestId} onChange={e => setWalletDestId(e.target.value)} className="glass-input">
                <option value="">— Seleccionar destino —</option>
                {wallets.filter(w => w.id !== walletId).map(w => (
                  <option key={w.id} value={w.id}>{w.icon} {w.name} ({w.currency})</option>
                ))}
              </select>
            </div>
          )}

          {/* Categoría */}
          {type !== 'transfer' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Categoría</label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {filteredCats.map(c => (
                  <button key={c.id} type="button" onClick={() => setCategoryId(c.id)}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                      categoryId === c.id
                        ? 'bg-blue-500/20 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    <span className="text-2xl">{c.icon}</span>
                    <span className="text-xs leading-tight text-center">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Descripción</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Opcional" className="glass-input" />
          </div>

          {/* Fecha */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Fecha</label>
            <div className="flex gap-2">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="glass-input flex-1" />
              <button type="button" onClick={() => setDate(getToday())}     className="btn-neutral px-3 py-2 text-xs rounded-xl">Hoy</button>
              <button type="button" onClick={() => setDate(getYesterday())} className="btn-neutral px-3 py-2 text-xs rounded-xl">Ayer</button>
            </div>
          </div>

          {/* Recurrente */}
          <div>
            <button type="button" onClick={() => setRecurring(r => !r)}
              className="w-full flex items-center justify-between p-3 glass-card rounded-xl">
              <span className="text-sm">🔁 Transacción recurrente</span>
              <div className={`toggle-switch ${recurring ? 'active' : ''}`} />
            </button>
            {recurring && (
              <div className="mt-2 space-y-2 pl-1">
                <select value={frequency} onChange={e => setFrequency(e.target.value)} className="glass-input text-sm">
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                </select>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Próxima fecha</label>
                  <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="glass-input" />
                </div>
              </div>
            )}
          </div>

          {/* Notas y etiquetas */}
          <div>
            <button type="button" onClick={() => setShowNotes(s => !s)}
              className="w-full flex items-center justify-between text-sm text-slate-400 py-1">
              <span>📝 Notas y etiquetas</span>
              <span className="text-xs">{showNotes ? '▲ Ocultar' : '▼ Mostrar'}</span>
            </button>
            {showNotes && (
              <div className="space-y-2 mt-2">
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Notas adicionales..." rows={2}
                  className="glass-input resize-none text-sm" />
                <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                  placeholder="Etiquetas: mercado, familia, urgente..." className="glass-input text-sm" />
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-2 pb-2">
            <button type="button" onClick={() => closeModal('transaction')} className="flex-1 btn-neutral py-3 rounded-xl">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-[2] btn-primary py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
                : editId ? '✓ Actualizar' : '✓ Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
