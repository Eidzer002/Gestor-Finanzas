import { useState } from 'react'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import { useData } from '../../../context/DataContext'
import { useWallets } from '../../../hooks/useWallets'
import { supabase } from '../../../lib/supabase'
import { formatCurrency, convertToMain, DEFAULT_EXCHANGE_RATES } from '../../../lib/utils'

const CURRENCIES = ['CUP','USD','EUR','GBP','USDT','MXN','CAD','BRL','JPY']

export default function Settings() {
  const { openModal, showDeleteModal, showToast } = useApp()
  const { user, signOut } = useAuth()
  const { wallets, categories, exchangeRates, settings, setSettings, setExchangeRates, setCategories, loadData } = useData()
  const { deleteWallet } = useWallets()
  const [openSection, setOpenSection] = useState(null)
  const [newCatName,  setNewCatName]  = useState('')
  const [newCatIcon,  setNewCatIcon]  = useState('📦')
  const [newCatType,  setNewCatType]  = useState('expense')
  const [editRates,   setEditRates]   = useState({})
  const [editingRates,setEditingRates]= useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [resetInput,  setResetInput]  = useState('')

  const toggle = (s) => setOpenSection(o => o===s?null:s)

  const handleMainCurrency = async (currency) => {
    setSavingSettings(true)
    try {
      await supabase.from('profiles').update({ main_currency: currency }).eq('id', user.id)
      setSettings(s => ({ ...s, main_currency: currency }))
      showToast('Moneda principal actualizada', 'success')
    } catch(e) { showToast(e.message,'error') }
    finally { setSavingSettings(false) }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      const { data, error } = await supabase.from('categories')
        .insert({ user_id: user.id, name: newCatName.trim(), icon: newCatIcon, type: newCatType, is_default: false })
        .select().single()
      if (error) throw error
      setCategories(c => [...c, data])
      setNewCatName(''); showToast('Categoría añadida', 'success')
    } catch(e) { showToast(e.message,'error') }
  }

  const handleDeleteCategory = (id) => {
    showDeleteModal('¿Eliminar esta categoría?', async () => {
      try {
        await supabase.from('categories').delete().eq('id', id)
        setCategories(c => c.filter(x => x.id !== id))
        showToast('Categoría eliminada', 'success')
      } catch(e) { showToast(e.message,'error') }
    })
  }

  const startEditRates = () => { setEditRates({...exchangeRates}); setEditingRates(true) }
  const handleSaveRates = async () => {
    try {
      const upserts = Object.entries(editRates).map(([currency, rate]) => ({ user_id: user.id, currency, rate: parseFloat(rate)||1 }))
      const { error } = await supabase.from('exchange_rates').upsert(upserts, { onConflict:'user_id,currency' })
      if (error) throw error
      setExchangeRates(editRates); setEditingRates(false)
      showToast('Tasas actualizadas', 'success')
    } catch(e) { showToast(e.message,'error') }
  }

  const handleReset = async () => {
    if (resetInput !== 'CONFIRMAR') return
    try {
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', user.id),
        supabase.from('wallets').delete().eq('user_id', user.id),
        supabase.from('budgets').delete().eq('user_id', user.id),
        supabase.from('debts').delete().eq('user_id', user.id),
      ])
      await loadData(); setResetInput(''); toggle(null)
      showToast('Datos reiniciados', 'success')
    } catch(e) { showToast(e.message,'error') }
  }

  const Section = ({ id, icon, title, children }) => (
    <div className="glass-card overflow-hidden">
      <button onClick={() => toggle(id)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-medium">{title}</span>
        </div>
        <span className="text-slate-400">{openSection===id?'▲':'▼'}</span>
      </button>
      {openSection===id && <div className="border-t border-white/10 p-4">{children}</div>}
    </div>
  )

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Perfil */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/40 to-blue-700/40 border border-blue-500/30 flex items-center justify-center text-2xl font-bold text-blue-300">
          {displayName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-lg">{displayName}</p>
          <p className="text-sm text-slate-400 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Billeteras */}
      <Section id="wallets" icon="👝" title={`Billeteras (${wallets.length})`}>
        <div className="space-y-2 mb-3">
          {wallets.length === 0 && <p className="text-slate-500 text-sm text-center py-3">No hay billeteras</p>}
          {wallets.map(w => (
            <div key={w.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <span className="text-xl">{w.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{w.name}</p>
                <p className="text-xs text-slate-400">{formatCurrency(w.balance, w.currency)}</p>
              </div>
              <button onClick={() => openModal('wallet',{editId:w.id})} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm">✏️</button>
              <button onClick={() => showDeleteModal(`¿Eliminar "${w.name}"?`, async () => { try { await deleteWallet(w.id); showToast('Billetera eliminada','success') } catch(e){showToast(e.message,'error')} })}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400 flex items-center justify-center text-sm">🗑</button>
            </div>
          ))}
        </div>
        <button onClick={() => openModal('wallet')} className="w-full btn-primary py-2.5 rounded-xl text-sm">+ Nueva billetera</button>
      </Section>

      {/* Moneda principal */}
      <Section id="currency" icon="💱" title={`Moneda principal: ${settings.main_currency}`}>
        <div className="grid grid-cols-3 gap-2">
          {CURRENCIES.map(c => (
            <button key={c} onClick={() => handleMainCurrency(c)}
              className={`py-2 rounded-xl text-sm border transition-all ${settings.main_currency===c?'bg-blue-500/20 text-blue-400 border-blue-500/30':'bg-white/5 text-slate-400 border-white/10'}`}>
              {c}
            </button>
          ))}
        </div>
      </Section>

      {/* Tasas de cambio */}
      <Section id="rates" icon="📊" title="Tasas de cambio">
        <div className="space-y-2 mb-3">
          {CURRENCIES.filter(c=>c!==settings.main_currency).map(c => (
            <div key={c} className="flex items-center gap-3">
              <span className="text-sm w-12 text-slate-300 font-medium">1 {c}</span>
              <span className="text-slate-500">=</span>
              {editingRates ? (
                <input type="number" value={editRates[c]||''} onChange={e => setEditRates(r=>({...r,[c]:e.target.value}))}
                  className="glass-input flex-1 text-sm py-1.5" step="0.01" min="0" />
              ) : (
                <span className="flex-1 text-sm">{exchangeRates[c] || DEFAULT_EXCHANGE_RATES[c] || '—'} {settings.main_currency}</span>
              )}
            </div>
          ))}
        </div>
        {editingRates
          ? <div className="flex gap-2"><button onClick={() => setEditingRates(false)} className="flex-1 btn-neutral py-2 rounded-xl text-sm">Cancelar</button><button onClick={handleSaveRates} className="flex-[2] btn-primary py-2 rounded-xl text-sm">Guardar</button></div>
          : <button onClick={startEditRates} className="w-full btn-neutral py-2.5 rounded-xl text-sm">✏️ Editar tasas</button>
        }
      </Section>

      {/* Categorías */}
      <Section id="categories" icon="🏷️" title={`Categorías (${categories.length})`}>
        <div className="mb-3 space-y-1 max-h-48 overflow-y-auto">
          {categories.map(c => (
            <div key={c.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
              <span>{c.icon}</span>
              <span className="flex-1 text-sm truncate">{c.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${c.type==='income'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{c.type==='income'?'Ingreso':'Gasto'}</span>
              {!c.is_default && (
                <button onClick={() => handleDeleteCategory(c.id)} className="w-6 h-6 rounded bg-white/5 hover:bg-red-500/20 text-red-400 flex items-center justify-center text-xs">✕</button>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={handleAddCategory} className="space-y-2">
          <div className="flex gap-2">
            <input type="text" value={newCatIcon} onChange={e=>setNewCatIcon(e.target.value)} className="glass-input w-14 text-center text-xl" maxLength={2} />
            <input type="text" value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="Nombre categoría" className="glass-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            {[['expense','Gasto'],['income','Ingreso']].map(([v,l]) => (
              <button key={v} type="button" onClick={() => setNewCatType(v)}
                className={`flex-1 py-1.5 rounded-lg text-xs border ${newCatType===v?(v==='expense'?'bg-red-500/20 text-red-400 border-red-500/30':'bg-green-500/20 text-green-400 border-green-500/30'):'bg-white/5 text-slate-400 border-white/10'}`}>
                {l}
              </button>
            ))}
            <button type="submit" className="flex-1 btn-primary py-1.5 rounded-lg text-xs">+ Agregar</button>
          </div>
        </form>
      </Section>

      {/* Cerrar sesión */}
      <button onClick={signOut} className="w-full glass-card p-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
        <span className="text-xl">🚪</span>
        <span className="font-medium">Cerrar sesión</span>
      </button>

      {/* Zona peligrosa */}
      <Section id="danger" icon="⚠️" title="Zona peligrosa">
        <p className="text-slate-400 text-sm mb-3">Esto eliminará todas tus transacciones, billeteras, presupuestos y deudas. Las categorías se mantendrán.</p>
        <input type="text" value={resetInput} onChange={e=>setResetInput(e.target.value)}
          placeholder='Escribe "CONFIRMAR" para continuar' className="glass-input text-sm mb-3" />
        <button onClick={handleReset} disabled={resetInput!=='CONFIRMAR'}
          className="w-full btn-danger py-2.5 rounded-xl text-sm disabled:opacity-30">
          Reiniciar todos los datos
        </button>
      </Section>
    </div>
  )
}
