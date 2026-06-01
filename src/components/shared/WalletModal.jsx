import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useData } from '../../context/DataContext'
import { useWallets } from '../../hooks/useWallets'

const CURRENCIES = ['CUP','USD','EUR','GBP','USDT','MXN','CAD','BRL','JPY']
const WALLET_TYPES = [
  { value:'cash',    label:'Efectivo', icon:'💵' },
  { value:'card',    label:'Tarjeta',  icon:'💳' },
  { value:'ewallet', label:'E-Wallet', icon:'📱' },
  { value:'crypto',  label:'Cripto',   icon:'₿'  },
  { value:'savings', label:'Ahorros',  icon:'🏦' },
]
const ICONS  = ['💵','💳','📱','₿','🏦','👝','💰','🏧','💎','🪙','🌍','⭐']
const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#64748b']

export default function WalletModal() {
  const { modals, closeModal, showToast } = useApp()
  const { wallets, settings } = useData()
  const { addWallet, updateWallet } = useWallets()
  const { open, editId } = modals.wallet

  const [name,     setName]     = useState('')
  const [type,     setType]     = useState('cash')
  const [icon,     setIcon]     = useState('💵')
  const [color,    setColor]    = useState('#3b82f6')
  const [currency, setCurrency] = useState(settings.main_currency)
  const [balance,  setBalance]  = useState('0')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!open) return
    if (editId) {
      const w = wallets.find(x => x.id === editId)
      if (w) { setName(w.name); setType(w.type); setIcon(w.icon); setColor(w.color); setCurrency(w.currency); setBalance(String(w.balance)); return }
    }
    setName(''); setType('cash'); setIcon('💵'); setColor('#3b82f6')
    setCurrency(settings.main_currency); setBalance('0'); setError(null)
  }, [open, editId])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Ingresa un nombre para la billetera.')
    setError(null); setSaving(true)
    try {
      const data = { name: name.trim(), type, icon, color, currency, balance: parseFloat(balance) || 0 }
      if (editId) await updateWallet(editId, data)
      else        await addWallet(data)
      showToast(editId ? 'Billetera actualizada' : 'Billetera creada', 'success')
      closeModal('wallet')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
      <div className="modal-overlay absolute inset-0" onClick={() => closeModal('wallet')} />
      <div className="relative w-full max-w-md modal-content md:rounded-2xl rounded-t-3xl overflow-y-auto max-h-[95vh] animate-slide-in">
        <div className="sticky top-0 bg-[#1e293b] flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold">{editId ? 'Editar billetera' : 'Nueva billetera'}</h2>
          <button onClick={() => closeModal('wallet')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✕</button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Efectivo casa" className="glass-input" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {WALLET_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  className={`py-2 rounded-xl text-sm border transition-all flex flex-col items-center gap-1 ${type===t.value ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                  <span className="text-xl">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Icono</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(i => (
                <button key={i} type="button" onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-xl text-xl transition-all ${icon===i ? 'bg-blue-500/30 ring-2 ring-blue-500' : 'bg-white/5'}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color===c ? 'ring-2 ring-white scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Balance inicial</label>
              <input type="number" value={balance} onChange={e => setBalance(e.target.value)} step="0.01" className="glass-input" />
            </div>
            <div className="w-28">
              <label className="text-xs text-slate-400 mb-1 block">Moneda</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="glass-input">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="glass-card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: color + '33', border: `1px solid ${color}55` }}>{icon}</div>
            <div>
              <p className="font-medium">{name || 'Mi billetera'}</p>
              <p className="text-xs text-slate-400">{parseFloat(balance||0).toFixed(2)} {currency}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => closeModal('wallet')} className="flex-1 btn-neutral py-3">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-[2] btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Guardando...</> : (editId ? '✓ Actualizar' : '✓ Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
