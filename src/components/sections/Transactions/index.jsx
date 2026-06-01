import { useState, useMemo } from 'react'
import { useApp } from '../../../context/AppContext'
import { useData } from '../../../context/DataContext'
import { useTransactions } from '../../../hooks/useTransactions'
import { formatCurrency, convertToMain } from '../../../lib/utils'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Transactions() {
  const { openModal, showDeleteModal, showToast } = useApp()
  const { transactions, wallets, categories, exchangeRates, settings } = useData()
  const { deleteTransaction } = useTransactions()
  const main = settings.main_currency

  const [filterMonth,    setFilterMonth]    = useState(new Date())
  const [typeFilter,     setTypeFilter]     = useState('all')
  const [walletFilter,   setWalletFilter]   = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search,         setSearch]         = useState('')

  const changeMonth = (delta) => {
    setFilterMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() + delta); return d })
  }

  const today     = new Date().toISOString().split('T')[0]
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0] })()

  const filtered = useMemo(() => {
    const yr = filterMonth.getFullYear(), mo = filterMonth.getMonth()
    const start = new Date(yr, mo, 1), end = new Date(yr, mo+1, 0)
    const q = search.toLowerCase()
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      if (d < start || d > end) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (walletFilter   && t.wallet_id   !== walletFilter)   return false
      if (categoryFilter && t.category_id !== categoryFilter) return false
      if (q) {
        const text = `${t.description||''} ${t.notes||''} ${(t.tags||[]).join(' ')}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    }).sort((a,b) => new Date(b.date) - new Date(a.date))
  }, [transactions, filterMonth, typeFilter, walletFilter, categoryFilter, search])

  const { totalIncome, totalExpense } = useMemo(() => {
    let income = 0, expense = 0
    filtered.forEach(t => {
      const v = convertToMain(t.amount, t.currency, exchangeRates, main)
      if (t.type === 'income')  income  += v
      if (t.type === 'expense') expense += v
    })
    return { totalIncome: income, totalExpense: expense }
  }, [filtered, exchangeRates, main])

  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(t => { if (!g[t.date]) g[t.date]=[]; g[t.date].push(t) })
    return Object.entries(g).sort((a,b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const handleDelete = (id) => {
    showDeleteModal('¿Eliminar esta transacción? Esta acción no se puede deshacer.', async () => {
      try { await deleteTransaction(id); showToast('Transacción eliminada', 'success') }
      catch(e) { showToast(e.message, 'error') }
    })
  }

  const dateLabel = (ds) => {
    if (ds === today) return 'Hoy'
    if (ds === yesterday) return 'Ayer'
    return new Date(ds+'T00:00:00').toLocaleDateString('es-ES',{ weekday:'long', day:'numeric', month:'long' })
  }

  const TypeBtn = ({ val, label }) => (
    <button onClick={() => setTypeFilter(val)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${typeFilter===val ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
      {label}
    </button>
  )

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Navegación de mes */}
      <div className="glass-card p-3 flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">◀</button>
        <span className="font-semibold">{MONTHS_ES[filterMonth.getMonth()]} {filterMonth.getFullYear()}</span>
        <button onClick={() => changeMonth(1)} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">▶</button>
      </div>

      {/* Totales del período */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-slate-400 mb-0.5">Ingresos</p>
          <p className="font-bold text-green-400 text-sm">{formatCurrency(totalIncome, main)}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-slate-400 mb-0.5">Gastos</p>
          <p className="font-bold text-red-400 text-sm">{formatCurrency(totalExpense, main)}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-slate-400 mb-0.5">Balance</p>
          <p className={`font-bold text-sm ${totalIncome-totalExpense>=0?'text-blue-400':'text-orange-400'}`}>{formatCurrency(totalIncome-totalExpense, main)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <TypeBtn val="all"      label="Todos" />
          <TypeBtn val="income"   label="Ingresos" />
          <TypeBtn val="expense"  label="Gastos" />
          <TypeBtn val="transfer" label="Transferencias" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={walletFilter} onChange={e => setWalletFilter(e.target.value)} className="glass-input text-sm py-2">
            <option value="">Todas las billeteras</option>
            {wallets.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="glass-input text-sm py-2">
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar por descripción, notas o etiquetas..." className="glass-input text-sm" />
      </div>

      {/* Lista agrupada por día */}
      {grouped.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-3">🧾</div>
          <p>No hay transacciones para este período</p>
          <button onClick={() => openModal('transaction')} className="mt-4 btn-primary px-5 py-2 rounded-xl text-sm">
            Agregar transacción
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([date, txns]) => {
            let dayI = 0, dayE = 0
            txns.forEach(t => {
              const v = convertToMain(t.amount, t.currency, exchangeRates, main)
              if (t.type==='income') dayI+=v; else if (t.type==='expense') dayE+=v
            })
            const dayNet = dayI - dayE
            return (
              <div key={date} className="glass-card p-4">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                  <span className="font-medium text-slate-300 capitalize text-sm">{dateLabel(date)}</span>
                  <span className={`text-sm ${dayNet>=0?'text-green-400':'text-red-400'}`}>{dayNet>=0?'+':''}{formatCurrency(Math.abs(dayNet), main)}</span>
                </div>
                <div className="space-y-2">
                  {txns.map(t => {
                    const cat    = categories.find(c => c.id === t.category_id)
                    const wallet = wallets.find(w => w.id === t.wallet_id)
                    const isI = t.type==='income', isE = t.type==='expense'
                    return (
                      <div key={t.id} className="flex items-center gap-3 group">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${isI?'bg-green-500/20':isE?'bg-red-500/20':'bg-blue-500/20'}`}>
                          {cat?.icon || '💰'}
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openModal('transaction',{editId:t.id})}>
                          <p className="text-sm font-medium truncate">{t.description || cat?.name || 'Transacción'}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="px-1.5 py-0.5 rounded bg-white/10">{wallet?.name||'?'}</span>
                            {t.notes && <span className="truncate text-slate-500">📝 {t.notes}</span>}
                            {t.tags?.length > 0 && <span className="truncate">{t.tags.join(', ')}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${isI?'text-income':isE?'text-expense':'text-transfer'}`}>
                            {isI?'+':isE?'-':''}{formatCurrency(t.amount, t.currency)}
                          </p>
                        </div>
                        <button onClick={() => handleDelete(t.id)}
                          className="w-7 h-7 rounded-lg bg-red-500/0 group-hover:bg-red-500/20 text-red-400/0 group-hover:text-red-400 flex items-center justify-center transition-all text-xs flex-shrink-0">
                          🗑
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
