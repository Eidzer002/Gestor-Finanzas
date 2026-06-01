import { useMemo } from 'react'
import { useApp } from '../../../context/AppContext'
import { useData } from '../../../context/DataContext'
import { formatCurrency, convertToMain } from '../../../lib/utils'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend)

const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const WALLET_TYPE_LABELS = { cash:'Efectivo', card:'Tarjeta', ewallet:'E-Wallet', crypto:'Cripto', savings:'Ahorros' }

export default function Dashboard() {
  const { openModal, navigate } = useApp()
  const { wallets, transactions, budgets, categories, exchangeRates, settings } = useData()
  const main = settings.main_currency

  const now       = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const today      = now.toISOString().split('T')[0]
  const yesterday  = (() => { const d = new Date(now); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0] })()

  // Métricas del mes
  const { monthIncome, monthExpense } = useMemo(() => {
    let income = 0, expense = 0
    transactions.forEach(t => {
      const d = new Date(t.date + 'T00:00:00')
      if (d < monthStart || d > monthEnd) return
      const val = convertToMain(t.amount, t.currency, exchangeRates, main)
      if (t.type === 'income')  income  += val
      if (t.type === 'expense') expense += val
    })
    return { monthIncome: income, monthExpense: expense }
  }, [transactions, exchangeRates, main])

  const totalBalance = useMemo(() =>
    wallets.reduce((s, w) => s + convertToMain(w.balance, w.currency, exchangeRates, main), 0),
    [wallets, exchangeRates, main])

  const pendingDebts = useMemo(() => {
    // DataContext no tiene debts importado aquí directamente
    return 0 // se llenará via DataContext
  }, [])

  // Gráfico donut gastos por categoría
  const donutData = useMemo(() => {
    const catMap = {}
    transactions.forEach(t => {
      const d = new Date(t.date + 'T00:00:00')
      if (d < monthStart || d > monthEnd || t.type !== 'expense') return
      const cat = categories.find(c => c.id === t.category_id)
      const key = cat ? cat.name : 'Otros'
      catMap[key] = (catMap[key] || 0) + convertToMain(t.amount, t.currency, exchangeRates, main)
    })
    const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0,6)
    return {
      labels: sorted.map(([k]) => k),
      datasets: [{ data: sorted.map(([,v]) => parseFloat(v.toFixed(2))),
        backgroundColor: ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4'],
        borderWidth: 0 }]
    }
  }, [transactions, categories, exchangeRates, main])

  // Semana actual
  const weekDays = useMemo(() => {
    const dow = now.getDay()
    const diff = now.getDate() - dow + (dow === 0 ? -6 : 1)
    const monday = new Date(now.getFullYear(), now.getMonth(), diff)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i)
      const ds = d.toISOString().split('T')[0]
      const dayT = transactions.filter(t => t.date === ds)
      const hasI = dayT.some(t => t.type === 'income')
      const hasE = dayT.some(t => t.type === 'expense')
      const dot  = hasI && hasE ? 'bg-blue-500' : hasI ? 'bg-green-500' : hasE ? 'bg-red-500' : 'bg-slate-600'
      return { date: d, ds, dot, isToday: ds === today }
    })
  }, [transactions, today])

  // Alertas de presupuesto
  const budgetAlerts = useMemo(() => {
    return budgets.map(b => {
      const spent = transactions
        .filter(t => { const d = new Date(t.date+'T00:00:00'); return d>=monthStart && d<=monthEnd && t.type==='expense' && t.category_id===b.category_id })
        .reduce((s,t) => s + convertToMain(t.amount, t.currency, exchangeRates, main), 0)
      const limit = convertToMain(b.limit_amount, b.currency, exchangeRates, main)
      const pct = limit > 0 ? (spent/limit)*100 : 0
      if (pct < 80) return null
      const cat = categories.find(c => c.id === b.category_id)
      return { label: cat ? `${cat.icon} ${cat.name}` : 'Categoría', spent, limit, pct }
    }).filter(Boolean)
  }, [budgets, transactions, categories, exchangeRates, main])

  // Recientes
  const recent = useMemo(() =>
    [...transactions].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,5),
    [transactions])

  const dateLabel = (ds) => {
    if (ds === today) return 'Hoy'
    if (ds === yesterday) return 'Ayer'
    return new Date(ds+'T00:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'short' })
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Wallets scroll */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-slate-300">Mis billeteras</h2>
          <button onClick={() => openModal('wallet')} className="text-blue-400 text-sm">+ Nueva</button>
        </div>
        {wallets.length === 0 ? (
          <button onClick={() => openModal('wallet')}
            className="w-full glass-card p-6 text-center text-slate-500 border-dashed border-white/20">
            <div className="text-3xl mb-2">👝</div>
            <p className="text-sm">Agrega tu primera billetera</p>
          </button>
        ) : (
          <div className="flex gap-3 overflow-x-auto wallet-scroll pb-1 -mx-4 px-4">
            {wallets.map(w => {
              const converted = convertToMain(w.balance, w.currency, exchangeRates, main)
              return (
                <div key={w.id} onClick={() => openModal('wallet', { editId: w.id })}
                  className="wallet-card glass-card glass-card-hover p-4 min-w-[160px] flex-shrink-0 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{w.icon}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">{WALLET_TYPE_LABELS[w.type]}</span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{w.name}</p>
                  <p className="text-lg font-bold">{formatCurrency(w.balance, w.currency)}</p>
                  {w.currency !== main && <p className="text-xs text-slate-500">≈ {formatCurrency(converted, main)}</p>}
                </div>
              )
            })}
            {/* Total */}
            <div className="wallet-card glass-card p-4 min-w-[160px] flex-shrink-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">💼</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20">Total</span>
              </div>
              <p className="text-sm text-slate-400">Neto Total</p>
              <p className="text-lg font-bold text-blue-400">{formatCurrency(totalBalance, main)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Métricas del mes */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label:'Ingresos del mes', val: monthIncome,            color:'text-green-400', bg:'bg-green-500/10', icon:'📥' },
          { label:'Gastos del mes',   val: monthExpense,           color:'text-red-400',   bg:'bg-red-500/10',   icon:'📤' },
          { label:'Balance del mes',  val: monthIncome-monthExpense, color: monthIncome-monthExpense>=0?'text-blue-400':'text-orange-400', bg:'bg-blue-500/10', icon:'⚖️' },
        ].map(m => (
          <div key={m.label} className={`glass-card p-4 ${m.label.includes('Balance') ? 'col-span-2' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{m.icon}</span>
              <span className="text-xs text-slate-400">{m.label}</span>
            </div>
            <p className={`text-xl font-bold ${m.color}`}>{formatCurrency(m.val, main)}</p>
          </div>
        ))}
      </div>

      {/* Semana */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Esta semana</h3>
        <div className="flex justify-between">
          {weekDays.map(({ date, ds, dot, isToday }) => (
            <div key={ds} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-500">{DAYS_ES[date.getDay()]}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isToday ? 'bg-blue-500/30 border border-blue-500/50 font-bold' : 'bg-white/5'}`}>
                {date.getDate()}
              </div>
              <div className={`w-2 h-2 rounded-full ${dot}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de gastos */}
      {donutData.labels.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Gastos por categoría</h3>
          <div className="flex gap-4 items-center">
            <div className="w-32 h-32 flex-shrink-0">
              <Doughnut data={donutData} options={{ plugins:{ legend:{ display:false } }, cutout:'65%', maintainAspectRatio:true }} />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              {donutData.labels.map((l, i) => (
                <div key={l} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: donutData.datasets[0].backgroundColor[i] }} />
                  <span className="truncate text-slate-300">{l}</span>
                  <span className="ml-auto text-slate-400 flex-shrink-0">{formatCurrency(donutData.datasets[0].data[i], main)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alertas de presupuesto */}
      {budgetAlerts.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-orange-400 mb-3">⚠️ Alertas de presupuesto</h3>
          <div className="space-y-3">
            {budgetAlerts.map((a, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">{a.label}</span>
                  <span className={`text-sm font-medium ${a.pct>=100?'text-red-400':'text-orange-400'}`}>{a.pct.toFixed(0)}%</span>
                </div>
                <div className="progress-bar h-2">
                  <div className={`progress-fill h-full rounded-full ${a.pct>=100?'bg-red-500':a.pct>=90?'bg-orange-500':'bg-yellow-500'}`}
                    style={{ width: `${Math.min(a.pct,100)}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(a.spent,main)} de {formatCurrency(a.limit,main)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transacciones recientes */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-slate-300">Recientes</h3>
          <button onClick={() => navigate('transactions')} className="text-blue-400 text-xs">Ver todas →</button>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <div className="text-3xl mb-2">🧾</div>
            <p className="text-sm">Sin transacciones aún</p>
            <button onClick={() => openModal('transaction')} className="mt-3 btn-primary px-4 py-2 rounded-lg text-sm">
              Agregar transacción
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {recent.map(t => {
              const cat    = categories.find(c => c.id === t.category_id)
              const wallet = wallets.find(w => w.id === t.wallet_id)
              const isI = t.type === 'income', isE = t.type === 'expense'
              return (
                <div key={t.id} onClick={() => openModal('transaction', { editId: t.id })}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${isI?'bg-green-500/20':isE?'bg-red-500/20':'bg-blue-500/20'}`}>
                    {cat?.icon || '💰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description || cat?.name || 'Transacción'}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-white/10">{wallet?.name || '?'}</span>
                      {t.tags?.length > 0 && <span className="truncate">{t.tags.join(', ')}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${isI?'text-income':isE?'text-expense':'text-transfer'}`}>
                      {isI?'+':isE?'-':''}{formatCurrency(t.amount, t.currency)}
                    </p>
                    <p className="text-xs text-slate-500">{dateLabel(t.date)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tasas de cambio */}
      {Object.keys(settings).length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Tasas de cambio</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(exchangeRates).filter(([c]) => c !== main).slice(0,4).map(([c,r]) => (
              <div key={c} className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-400">1 {c}</p>
                <p className="font-bold text-sm">{r} {main}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAB móvil */}
      <div className="h-4 md:hidden" />
    </div>
  )
}
