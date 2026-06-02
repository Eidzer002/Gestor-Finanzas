import { useMemo } from 'react'
import { useApp } from '../../../context/AppContext'
import { useData } from '../../../context/DataContext'
import { useBudgets } from '../../../hooks/useBudgets'
import { formatCurrency, convertToMain } from '../../../lib/utils'

export default function Budgets() {
  const { openModal, showDeleteModal, showToast } = useApp()
  const { budgets, transactions, categories, exchangeRates, settings } = useData()
  const { deleteBudget } = useBudgets()
  const main = settings.main_currency

  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const budgetsWithStats = useMemo(() => {
    return budgets.map(b => {
      const spent = transactions
        .filter(t => { const d = new Date(t.date+'T00:00:00'); return d>=monthStart && d<=monthEnd && t.type==='expense' && t.category_id===b.category_id })
        .reduce((s,t) => s + convertToMain(t.amount, t.currency, exchangeRates, main), 0)
      const limit = convertToMain(b.limit_amount, b.currency, exchangeRates, main)
      const pct   = limit > 0 ? (spent/limit)*100 : 0
      const cat   = categories.find(c => c.id === b.category_id)
      return { ...b, spent, limit, pct, cat }
    })
  }, [budgets, transactions, exchangeRates, main])

  const { totalBudgeted, totalSpent } = useMemo(() => ({
    totalBudgeted: budgetsWithStats.reduce((s,b) => s+b.limit, 0),
    totalSpent:    budgetsWithStats.reduce((s,b) => s+b.spent, 0),
  }), [budgetsWithStats])

  const globalPct = totalBudgeted > 0 ? (totalSpent/totalBudgeted)*100 : 0

  const barColor = (pct) => pct>=100?'bg-red-500': pct>=80?'bg-orange-500': pct>=60?'bg-yellow-500':'bg-green-500'
  const pctColor = (pct) => pct>=100?'text-expense': pct>=80?'text-orange-400':'text-income'

  const handleDelete = (id) => {
    showDeleteModal('¿Eliminar este presupuesto?', async () => {
      try { await deleteBudget(id); showToast('Presupuesto eliminado', 'success') }
      catch(e) { showToast(e.message, 'error') }
    })
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Resumen global */}
      {budgets.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Resumen del mes</h3>
          <div className="grid grid-cols-3 gap-3 mb-3 text-center">
            <div>
              <p className="text-xs text-slate-400">Presupuestado</p>
              <p className="font-bold text-blue-400 text-sm">{formatCurrency(totalBudgeted, main)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Gastado</p>
              <p className="font-bold text-red-400 text-sm">{formatCurrency(totalSpent, main)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Ejecución</p>
              <p className={`font-bold text-sm num ${pctColor(globalPct)}`}>{globalPct.toFixed(0)}%</p>
            </div>
          </div>
          <div className="progress-bar h-2.5">
            <div className={`progress-fill h-full rounded-full ${barColor(globalPct)}`} style={{ width:`${Math.min(globalPct,100)}%` }} />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-slate-300">Mis presupuestos</h2>
        <button onClick={() => openModal('budget')} className="btn-primary px-4 py-2 rounded-xl text-sm">+ Nuevo</button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-3">🎯</div>
          <p className="mb-1">No hay presupuestos configurados</p>
          <p className="text-sm text-slate-600 mb-4">Crea un presupuesto para controlar tus gastos</p>
          <button onClick={() => openModal('budget')} className="btn-primary px-5 py-2 rounded-xl text-sm">Crear presupuesto</button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetsWithStats.map(b => (
            <div key={b.id} className="glass-card p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{b.cat?.icon || '🏷️'}</span>
                  <div>
                    <p className="font-medium">{b.cat?.name || 'Categoría'}</p>
                    <p className="text-xs text-slate-400">{b.recurring ? '🔁 Mensual' : 'Este mes'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal('budget',{editId:b.id})} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm">✏️</button>
                  <button onClick={() => handleDelete(b.id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400 flex items-center justify-center text-sm">🗑</button>
                </div>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">{formatCurrency(b.spent,main)} de {formatCurrency(b.limit,main)}</span>
                <span className={`font-medium ${pctColor(b.pct)}`}>{b.pct.toFixed(0)}%</span>
              </div>
              <div className="progress-bar h-2 mb-2">
                <div className={`progress-fill h-full rounded-full ${barColor(b.pct)}`} style={{ width:`${Math.min(b.pct,100)}%` }} />
              </div>
              <p className={`text-xs ${b.limit-b.spent<0?'text-red-400':'text-slate-400'}`}>
                {b.limit-b.spent<0 ? `⚠️ Excedido ${formatCurrency(Math.abs(b.limit-b.spent),main)}` : `Disponible: ${formatCurrency(b.limit-b.spent,main)}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
