import { useMemo } from 'react'
import { useApp } from '../../../context/AppContext'
import { useData } from '../../../context/DataContext'
import { formatCurrency, convertToMain } from '../../../lib/utils'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
ChartJS.register(ArcElement, Tooltip)

const DAYS_ES    = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const WALLET_TYPE_LABELS = { cash:'Efectivo', card:'Tarjeta', ewallet:'E-Wallet', crypto:'Cripto', savings:'Ahorros' }
const WALLET_GRADIENTS = [
  'linear-gradient(135deg, #1A56DB 0%, #0A2FA8 100%)',
  'linear-gradient(135deg, #0E9F8E 0%, #065F55 100%)',
  'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
  'linear-gradient(135deg, #D97706 0%, #92400E 100%)',
  'linear-gradient(135deg, #E11D48 0%, #9F1239 100%)',
  'linear-gradient(135deg, #475569 0%, #1E293B 100%)',
]

export default function Dashboard() {
  const { openModal, navigate } = useApp()
  const { wallets, transactions, budgets, categories, exchangeRates, settings } = useData()
  const main = settings.main_currency

  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const today      = now.toISOString().split('T')[0]
  const yesterday  = (() => { const d = new Date(now); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0] })()

  const { monthIncome, monthExpense } = useMemo(() => {
    let inc = 0, exp = 0
    transactions.forEach(t => {
      const d = new Date(t.date + 'T00:00:00')
      if (d < monthStart || d > monthEnd) return
      const v = convertToMain(t.amount, t.currency, exchangeRates, main)
      if (t.type === 'income')  inc += v
      if (t.type === 'expense') exp += v
    })
    return { monthIncome: inc, monthExpense: exp }
  }, [transactions, exchangeRates, main])

  const totalBalance = useMemo(() =>
    wallets.reduce((s, w) => s + convertToMain(w.balance, w.currency, exchangeRates, main), 0),
    [wallets, exchangeRates, main])

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
      datasets: [{ data: sorted.map(([,v]) => +v.toFixed(2)),
        backgroundColor: ['#3D7FFF','#2DD67B','#F59E0B','#F25C5C','#8B5CF6','#06B6D4'],
        borderWidth: 0, hoverOffset: 4 }]
    }
  }, [transactions, categories, exchangeRates, main])

  const weekDays = useMemo(() => {
    const dow  = now.getDay()
    const diff = now.getDate() - dow + (dow === 0 ? -6 : 1)
    const mon  = new Date(now.getFullYear(), now.getMonth(), diff)
    return Array.from({ length: 7 }, (_, i) => {
      const d  = new Date(mon); d.setDate(mon.getDate() + i)
      const ds = d.toISOString().split('T')[0]
      const dayT = transactions.filter(t => t.date === ds)
      const hasI = dayT.some(t => t.type === 'income')
      const hasE = dayT.some(t => t.type === 'expense')
      const color = hasI && hasE ? '#3D7FFF' : hasI ? '#2DD67B' : hasE ? '#F25C5C' : 'rgba(255,255,255,0.1)'
      return { date: d, ds, color, isToday: ds === today, hasAny: hasI || hasE }
    })
  }, [transactions, today])

  const budgetAlerts = useMemo(() =>
    budgets.map(b => {
      const spent = transactions
        .filter(t => { const d=new Date(t.date+'T00:00:00'); return d>=monthStart && d<=monthEnd && t.type==='expense' && t.category_id===b.category_id })
        .reduce((s,t) => s + convertToMain(t.amount, t.currency, exchangeRates, main), 0)
      const limit = convertToMain(b.limit_amount, b.currency, exchangeRates, main)
      const pct   = limit > 0 ? (spent/limit)*100 : 0
      if (pct < 80) return null
      const cat = categories.find(c => c.id === b.category_id)
      return { label: cat ? `${cat.icon} ${cat.name}` : 'Categoría', spent, limit, pct }
    }).filter(Boolean),
    [budgets, transactions, categories, exchangeRates, main])

  const recent = useMemo(() =>
    [...transactions].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,5),
    [transactions])

  const dateLabel = (ds) => {
    if (ds === today)     return 'Hoy'
    if (ds === yesterday) return 'Ayer'
    return new Date(ds+'T00:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'short' })
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Wallets ── */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="section-title">Mis billeteras</span>
          <button onClick={() => openModal('wallet')}
            className="text-xs font-semibold text-accent hover:text-blue-300 transition-colors flex items-center gap-1">
            <span>+</span> Nueva
          </button>
        </div>

        {wallets.length === 0 ? (
          <button onClick={() => openModal('wallet')}
            className="w-full glass-card p-8 text-center border-dashed border-white/10 hover:border-accent/30 transition-colors">
            <div className="text-4xl mb-2">👝</div>
            <p className="text-sm text-[var(--text-secondary)]">Agrega tu primera billetera</p>
          </button>
        ) : (
          <div className="flex gap-3 overflow-x-auto wallet-scroll pb-1 -mx-4 px-4">
            {wallets.map((w, i) => {
              const converted   = convertToMain(w.balance, w.currency, exchangeRates, main)
              const gradient    = WALLET_GRADIENTS[i % WALLET_GRADIENTS.length]
              return (
                <div key={w.id} onClick={() => openModal('wallet', { editId: w.id })}
                  className="wallet-card wallet-hero min-w-[175px] flex-shrink-0 cursor-pointer"
                  style={{ background: gradient }}>
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <span className="text-2xl">{w.icon}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 font-medium">
                      {WALLET_TYPE_LABELS[w.type]}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mb-1 relative z-10 truncate">{w.name}</p>
                  <p className="text-xl font-bold num relative z-10">{formatCurrency(w.balance, w.currency)}</p>
                  {w.currency !== main && (
                    <p className="text-xs text-white/50 mt-0.5 num relative z-10">≈ {formatCurrency(converted, main)}</p>
                  )}
                </div>
              )
            })}

            {/* Total card */}
            <div className="wallet-card wallet-hero min-w-[175px] flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(61,127,255,0.3) 0%, rgba(26,86,219,0.2) 100%)', border: '1px solid rgba(61,127,255,0.3)' }}>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-lg">💼</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 font-medium text-blue-300">Total</span>
              </div>
              <p className="text-xs text-white/60 mb-1 relative z-10">Balance neto</p>
              <p className="text-xl font-bold text-blue-300 num relative z-10">{formatCurrency(totalBalance, main)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Métricas del mes ── */}
      <div>
        <span className="section-title block mb-3">Este mes</span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Ingresos',  val: monthIncome,             color:'text-income',  dot:'#2DD67B', icon:'↑' },
            { label:'Gastos',    val: monthExpense,            color:'text-expense', dot:'#F25C5C', icon:'↓' },
            { label:'Balance',   val: monthIncome-monthExpense,
              color: monthIncome-monthExpense >= 0 ? 'text-accent' : 'text-expense', dot:'#3D7FFF', icon:'=' },
          ].map(m => (
            <div key={m.label} className="metric-card">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: m.dot + '22', color: m.dot }}>{m.icon}</div>
                <span className="text-xs text-[var(--text-secondary)] font-medium">{m.label}</span>
              </div>
              <p className={`font-bold text-sm num leading-tight ${m.color}`}>
                {formatCurrency(Math.abs(m.val), main)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Semana ── */}
      <div className="glass-card p-4">
        <span className="section-title block mb-3">Esta semana</span>
        <div className="flex justify-between">
          {weekDays.map(({ date, ds, color, isToday, hasAny }) => (
            <div key={ds} className="flex flex-col items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{DAYS_ES[date.getDay()]}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold transition-all
                ${isToday ? 'text-white ring-2 ring-accent/50' : 'text-[var(--text-secondary)]'}`}
                style={{ background: isToday ? 'var(--bg-surface4)' : 'transparent' }}>
                {date.getDate()}
              </div>
              <div className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: color, boxShadow: hasAny ? `0 0 6px ${color}` : 'none' }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Gráfico de gastos ── */}
      {donutData.labels.length > 0 && (
        <div className="glass-card p-4">
          <span className="section-title block mb-4">Gastos por categoría</span>
          <div className="flex gap-4 items-center">
            <div className="w-28 h-28 flex-shrink-0">
              <Doughnut data={donutData} options={{
                plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => ` ${formatCurrency(ctx.raw, main)}` } } },
                cutout:'68%', maintainAspectRatio:true
              }} />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {donutData.labels.map((label, i) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: donutData.datasets[0].backgroundColor[i] }} />
                  <span className="truncate text-[var(--text-secondary)] flex-1">{label}</span>
                  <span className="font-semibold num flex-shrink-0">{formatCurrency(donutData.datasets[0].data[i], main)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Alertas de presupuesto ── */}
      {budgetAlerts.length > 0 && (
        <div className="glass-card p-4 border border-yellow-500/20">
          <span className="section-title block mb-3 text-yellow-400/80">⚠ Alertas de presupuesto</span>
          <div className="space-y-3">
            {budgetAlerts.map((a, i) => {
              const barColor = a.pct >= 100 ? '#F25C5C' : a.pct >= 90 ? '#F97316' : '#F59E0B'
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm">{a.label}</span>
                    <span className="text-xs font-bold num" style={{ color: barColor }}>{a.pct.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${Math.min(a.pct,100)}%`, background: barColor }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>
                    {formatCurrency(a.spent,main)} de {formatCurrency(a.limit,main)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Transacciones recientes ── */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="section-title">Recientes</span>
          <button onClick={() => navigate('transactions')}
            className="text-xs font-semibold text-accent hover:text-blue-300 transition-colors">
            Ver todas →
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">🧾</div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Sin transacciones aún</p>
            <button onClick={() => openModal('transaction')} className="btn-primary text-sm py-2.5 px-6">
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
                  className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group">
                  <div className={`tx-icon ${isI?'tx-icon-income':isE?'tx-icon-expense':'tx-icon-transfer'}`}>
                    {cat?.icon || '💰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description || cat?.name || 'Transacción'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)]">
                        {wallet?.name || '?'}
                      </span>
                      {t.notes && <span className="text-xs text-[var(--text-muted)] truncate">· {t.notes}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold num ${isI?'text-income':isE?'text-expense':'text-transfer'}`}>
                      {isI?'+':isE?'-':''}{formatCurrency(t.amount, t.currency)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{dateLabel(t.date)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Tasas de cambio ── */}
      {Object.keys(exchangeRates).length > 1 && (
        <div className="glass-card p-4">
          <span className="section-title block mb-3">Tasas de cambio</span>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(exchangeRates)
              .filter(([c]) => c !== main)
              .slice(0, 4)
              .map(([c, r]) => (
                <div key={c} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                  <span className="text-sm font-medium">1 {c}</span>
                  <span className="text-sm font-bold num text-accent">{r} {main}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="h-2 md:hidden" />
    </div>
  )
}
