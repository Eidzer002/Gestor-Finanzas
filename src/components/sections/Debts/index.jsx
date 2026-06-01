import { useState, useMemo } from 'react'
import { useApp } from '../../../context/AppContext'
import { useData } from '../../../context/DataContext'
import { useDebts } from '../../../hooks/useDebts'
import { formatCurrency } from '../../../lib/utils'

const STATUS_LABELS = { pending:'Pendiente', partial:'Parcial', paid:'Pagado' }
const STATUS_COLORS = { pending:'text-orange-400 bg-orange-500/20', partial:'text-blue-400 bg-blue-500/20', paid:'text-green-400 bg-green-500/20' }
const DEBT_TYPE_ICONS = { cash:'💵', goods:'📦', service:'🔧', other:'📋' }

export default function Debts() {
  const { openModal, showDeleteModal, showToast } = useApp()
  const { debts } = useData()
  const { deleteDebt, settleDebt } = useDebts()
  const [tab,    setTab]    = useState('iowe')
  const [search, setSearch] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return debts.filter(d => {
      if (d.type !== tab) return false
      if (q && !d.person.toLowerCase().includes(q) && !(d.notes||'').toLowerCase().includes(q)) return false
      return true
    }).sort((a,b) => {
      if (a.status==='paid' && b.status!=='paid') return 1
      if (b.status==='paid' && a.status!=='paid') return -1
      return 0
    })
  }, [debts, tab, search])

  const { totalPending, totalActive } = useMemo(() => {
    const active  = debts.filter(d => d.type===tab && d.status!=='paid')
    const pending = active.reduce((s,d) => s + (d.total - d.paid), 0)
    return { totalPending: pending, totalActive: active.length }
  }, [debts, tab])

  const isOverdue = (d) => d.due_date && d.due_date < today && d.status !== 'paid'

  const handleDelete = (id) => {
    showDeleteModal('¿Eliminar esta deuda?', async () => {
      try { await deleteDebt(id); showToast('Deuda eliminada', 'success') }
      catch(e) { showToast(e.message, 'error') }
    })
  }

  const handleSettle = async (id) => {
    try { await settleDebt(id); showToast('Deuda saldada ✅', 'success') }
    catch(e) { showToast(e.message, 'error') }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-2">
        {[['iowe','Yo debo','bg-red-500/20 text-red-400 border-red-500/30'],
          ['owed','Me deben','bg-green-500/20 text-green-400 border-green-500/30']].map(([v,l,ac]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 py-3 rounded-xl font-medium border transition-all ${tab===v ? ac : 'bg-white/5 text-slate-400 border-white/10'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Resumen */}
      {totalActive > 0 && (
        <div className="glass-card p-4 flex gap-4">
          <div className="flex-1 text-center">
            <p className="text-xs text-slate-400">Deudas activas</p>
            <p className="text-xl font-bold">{totalActive}</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex-1 text-center">
            <p className="text-xs text-slate-400">{tab==='iowe'?'Total que debo':'Total que me deben'}</p>
            <p className={`text-xl font-bold ${tab==='iowe'?'text-red-400':'text-green-400'}`}>
              {formatCurrency(totalPending,'CUP')}
            </p>
          </div>
        </div>
      )}

      {/* Búsqueda + botón nuevo */}
      <div className="flex gap-2">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar persona..." className="glass-input flex-1 text-sm py-2" />
        <button onClick={() => openModal('debt', { debtType: tab })} className="btn-primary px-4 py-2 rounded-xl text-sm whitespace-nowrap">+ Nueva</button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-3">{tab==='iowe'?'😅':'🤝'}</div>
          <p>{tab==='iowe'?'No tienes deudas pendientes':'Nadie te debe dinero'}</p>
          <button onClick={() => openModal('debt',{debtType:tab})} className="mt-4 btn-primary px-5 py-2 rounded-xl text-sm">
            {tab==='iowe'?'Registrar deuda':'Registrar préstamo'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const pct = d.total > 0 ? (d.paid/d.total)*100 : 0
            const rem = d.total - d.paid
            const overdue = isOverdue(d)
            return (
              <div key={d.id} className={`glass-card p-4 ${overdue?'border-orange-500/40':''}`}>
                {overdue && <p className="text-xs text-orange-400 mb-2">⚠️ Vencida el {d.due_date}</p>}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tab==='iowe'?'bg-red-500/20':'bg-green-500/20'}`}>
                      {DEBT_TYPE_ICONS[d.debt_type] || '💵'}
                    </div>
                    <div>
                      <p className="font-semibold">{d.person}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal('debt',{editId:d.id})} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm">✏️</button>
                    <button onClick={() => handleDelete(d.id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400 flex items-center justify-center text-sm">🗑</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div><p className="text-slate-400">Total</p><p className="font-medium">{formatCurrency(d.total, d.currency)}</p></div>
                  <div><p className="text-slate-400">{tab==='iowe'?'Pagado':'Cobrado'}</p><p className="font-medium text-green-400">{formatCurrency(d.paid, d.currency)}</p></div>
                  <div><p className="text-slate-400">Pendiente</p><p className={`font-medium ${tab==='iowe'?'text-red-400':'text-orange-400'}`}>{formatCurrency(rem, d.currency)}</p></div>
                </div>

                <div className="progress-bar h-2 mb-3">
                  <div className="progress-fill h-full rounded-full bg-blue-500" style={{ width:`${Math.min(pct,100)}%` }} />
                </div>

                {d.due_date && d.status!=='paid' && (
                  <p className="text-xs text-slate-400 mb-3">📅 Vence: {new Date(d.due_date+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</p>
                )}

                {d.notes && <div className="p-2 bg-white/5 rounded-lg mb-3"><p className="text-xs text-slate-400">📝 {d.notes}</p></div>}

                {d.status !== 'paid' && (
                  <div className="flex gap-2">
                    <button onClick={() => openModal('payment',{debtId:d.id})}
                      className="flex-1 btn-primary py-2 rounded-lg text-sm">
                      {tab==='iowe'?'Registrar pago':'Registrar cobro'}
                    </button>
                    <button onClick={() => handleSettle(d.id)} className="btn-success py-2 px-4 rounded-lg text-sm">Saldar</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
