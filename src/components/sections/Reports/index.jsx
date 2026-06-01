import { useState, useMemo, useEffect, useCallback } from 'react'
import { useData } from '../../../context/DataContext'
import { formatCurrency, convertToMain } from '../../../lib/utils'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend)

const PERIODS = [
  { val:'week',      label:'Esta semana' },
  { val:'month',     label:'Este mes' },
  { val:'lastMonth', label:'Mes anterior' },
  { val:'3months',   label:'3 meses' },
  { val:'6months',   label:'6 meses' },
  { val:'year',      label:'Este año' },
  { val:'custom',    label:'Personalizado' },
]
const CHARTS = [
  { val:'incomeExpense', label:'Ing. vs Gastos' },
  { val:'category',      label:'Por categoría' },
  { val:'balance',       label:'Balance' },
  { val:'wallet',        label:'Por billetera' },
]

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color:'#94a3b8', font:{ size:11 } } } },
  scales: { x:{ ticks:{ color:'#64748b' }, grid:{ color:'rgba(255,255,255,0.05)' } }, y:{ ticks:{ color:'#64748b' }, grid:{ color:'rgba(255,255,255,0.05)' } } }
}

export default function Reports() {
  const { transactions, wallets, categories, exchangeRates, settings } = useData()
  const main = settings.main_currency

  const [period,    setPeriod]    = useState('month')
  const [chart,     setChart]     = useState('incomeExpense')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [page,      setPage]      = useState(1)
  // FIX #7: calcular 'now' fuera de useMemo para que no se vuelva stale
  const [nowStamp,  setNowStamp]  = useState(() => new Date())
  // Refrescar 'now' cuando el componente se muestra
  useEffect(() => { setNowStamp(new Date()) }, [period])
  const PER_PAGE = 10

  const { start, end } = useMemo(() => {
    const now = nowStamp
    switch(period) {
      case 'week': {
        const dow  = now.getDay(), diff = now.getDate() - dow + (dow===0?-6:1)
        const s    = new Date(now.getFullYear(), now.getMonth(), diff)
        s.setHours(0,0,0,0)
        return { start: s, end: new Date() }
      }
      case 'month':     return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth()+1, 0) }
      case 'lastMonth': return { start: new Date(now.getFullYear(), now.getMonth()-1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0) }
      case '3months':   return { start: new Date(now.getFullYear(), now.getMonth()-2, 1), end: new Date(now.getFullYear(), now.getMonth()+1, 0) }
      case '6months':   return { start: new Date(now.getFullYear(), now.getMonth()-5, 1), end: new Date(now.getFullYear(), now.getMonth()+1, 0) }
      case 'year':      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) }
      case 'custom':    return { start: startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1), end: endDate ? new Date(endDate) : new Date() }
      default:          return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth()+1, 0) }
    }
  }, [period, startDate, endDate, nowStamp])

  const filtered = useMemo(() =>
    transactions.filter(t => { const d = new Date(t.date+'T00:00:00'); return d >= start && d <= end })
    .sort((a,b) => new Date(b.date)-new Date(a.date)),
    [transactions, start, end])

  const { totalIncome, totalExpense } = useMemo(() => {
    let i=0, e=0
    filtered.forEach(t => {
      const v = convertToMain(t.amount, t.currency, exchangeRates, main)
      if (t.type==='income') i+=v; else if (t.type==='expense') e+=v
    })
    return { totalIncome:i, totalExpense:e }
  }, [filtered, exchangeRates, main])

  const chartData = useMemo(() => {
    if (chart === 'incomeExpense') {
      const byMonth = {}
      filtered.forEach(t => {
        const m = t.date.slice(0,7)
        if (!byMonth[m]) byMonth[m]={income:0,expense:0}
        const v = convertToMain(t.amount, t.currency, exchangeRates, main)
        if (t.type==='income') byMonth[m].income+=v; else if (t.type==='expense') byMonth[m].expense+=v
      })
      const labels = Object.keys(byMonth).sort().map(m => { const [y,mo]=m.split('-'); return `${mo}/${y}` })
      const vals   = Object.values(byMonth).sort()
      return { type:'bar', data:{ labels, datasets:[
        { label:'Ingresos', data:Object.keys(byMonth).sort().map(m=>+byMonth[m].income.toFixed(2)), backgroundColor:'rgba(34,197,94,0.7)' },
        { label:'Gastos',   data:Object.keys(byMonth).sort().map(m=>+byMonth[m].expense.toFixed(2)), backgroundColor:'rgba(239,68,68,0.7)' }
      ]}}
    }
    if (chart === 'category') {
      const byC = {}
      filtered.filter(t=>t.type==='expense').forEach(t => {
        const cat = categories.find(c=>c.id===t.category_id)
        const key = cat ? `${cat.icon} ${cat.name}` : 'Otros'
        byC[key] = (byC[key]||0) + convertToMain(t.amount, t.currency, exchangeRates, main)
      })
      const sorted = Object.entries(byC).sort((a,b)=>b[1]-a[1]).slice(0,8)
      return { type:'doughnut', data:{ labels:sorted.map(([k])=>k), datasets:[{ data:sorted.map(([,v])=>+v.toFixed(2)),
        backgroundColor:['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'], borderWidth:0 }]}}
    }
    if (chart === 'balance') {
      const byDay = {}
      filtered.forEach(t => {
        if (!byDay[t.date]) byDay[t.date]=0
        const v = convertToMain(t.amount, t.currency, exchangeRates, main)
        if (t.type==='income') byDay[t.date]+=v; else if (t.type==='expense') byDay[t.date]-=v
      })
      const labels = Object.keys(byDay).sort()
      let acc=0; const data=labels.map(d=>{ acc+=byDay[d]; return +acc.toFixed(2) })
      return { type:'line', data:{ labels, datasets:[{ label:'Balance acumulado', data, borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.1)', fill:true, tension:0.3 }]}}
    }
    if (chart === 'wallet') {
      const byW = {}
      wallets.forEach(w => { byW[`${w.icon} ${w.name}`] = convertToMain(w.balance, w.currency, exchangeRates, main) })
      const entries = Object.entries(byW).filter(([,v])=>v>0)
      return { type:'doughnut', data:{ labels:entries.map(([k])=>k), datasets:[{ data:entries.map(([,v])=>+v.toFixed(2)),
        backgroundColor:['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4'], borderWidth:0 }]}}
    }
    return null
  }, [chart, filtered, categories, wallets, exchangeRates, main])

  const catTable = useMemo(() => {
    const byC = {}
    filtered.filter(t=>t.type==='expense').forEach(t => {
      const cat = categories.find(c=>c.id===t.category_id)
      const key = t.category_id || 'otros'
      if (!byC[key]) byC[key] = { cat, total:0, count:0 }
      byC[key].total += convertToMain(t.amount, t.currency, exchangeRates, main)
      byC[key].count++
    })
    return Object.values(byC).sort((a,b)=>b.total-a.total)
  }, [filtered, categories, exchangeRates, main])

  const paginated = useMemo(() => {
    const start = (page-1)*PER_PAGE, end = start+PER_PAGE
    return { data: filtered.slice(start, end), total: filtered.length, pages: Math.ceil(filtered.length/PER_PAGE) }
  }, [filtered, page])

  const ChartComponent = chartData?.type === 'bar' ? Bar : chartData?.type === 'line' ? Line : Doughnut
  const chartOpts = chartData?.type === 'doughnut'
    ? { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ color:'#94a3b8', font:{size:10}, boxWidth:12 } } } }
    : CHART_OPTS

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Selector de período */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {PERIODS.map(p => (
          <button key={p.val} onClick={() => { setPeriod(p.val); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0 ${period===p.val?'bg-blue-500/20 text-blue-400 border-blue-500/30':'bg-white/5 text-slate-400 border-white/10'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-slate-400 mb-1 block">Desde</label><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="glass-input text-sm" /></div>
          <div><label className="text-xs text-slate-400 mb-1 block">Hasta</label><input type="date" value={endDate}   onChange={e=>setEndDate(e.target.value)}   className="glass-input text-sm" /></div>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { l:'Ingresos',   v:totalIncome,                   c:'text-green-400' },
          { l:'Gastos',     v:totalExpense,                  c:'text-red-400'   },
          { l:'Balance',    v:totalIncome-totalExpense,      c:totalIncome-totalExpense>=0?'text-blue-400':'text-orange-400' },
          { l:'Movimientos',v:filtered.length,               c:'text-white', fmt:(v)=>v },
        ].map(m => (
          <div key={m.l} className="glass-card p-3 text-center">
            <p className="text-xs text-slate-400">{m.l}</p>
            <p className={`font-bold ${m.c}`}>{m.fmt ? m.fmt(m.v) : formatCurrency(m.v, main)}</p>
          </div>
        ))}
      </div>

      {/* Selector de gráfica */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CHARTS.map(c => (
          <button key={c.val} onClick={() => setChart(c.val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0 ${chart===c.val?'bg-blue-500/20 text-blue-400 border-blue-500/30':'bg-white/5 text-slate-400 border-white/10'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Gráfica */}
      {chartData && (
        <div className="glass-card p-4">
          <div style={{ height: 240 }}>
            <ChartComponent data={chartData.data} options={chartOpts} />
          </div>
        </div>
      )}

      {/* Tabla de categorías */}
      {catTable.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Gastos por categoría</h3>
          <div className="space-y-2">
            {catTable.map((row, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{row.cat?.icon || '🏷️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{row.cat?.name || 'Sin categoría'}</p>
                  <p className="text-xs text-slate-400">{row.count} transacciones</p>
                </div>
                <p className="font-medium text-sm text-red-400">{formatCurrency(row.total, main)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de transacciones paginada */}
      {filtered.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Transacciones ({filtered.length})</h3>
          <div className="space-y-2">
            {paginated.data.map(t => {
              const cat = categories.find(c=>c.id===t.category_id)
              const w   = wallets.find(w=>w.id===t.wallet_id)
              const isI = t.type==='income', isE = t.type==='expense'
              return (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-lg">{cat?.icon||'💰'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{t.description||cat?.name||'Transacción'}</p>
                    <p className="text-xs text-slate-400">{t.date} • {w?.name||'?'}</p>
                  </div>
                  <p className={`text-sm font-bold flex-shrink-0 ${isI?'text-income':isE?'text-expense':'text-transfer'}`}>
                    {isI?'+':isE?'-':''}{formatCurrency(t.amount, t.currency)}
                  </p>
                </div>
              )
            })}
          </div>
          {paginated.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-neutral px-3 py-1.5 text-sm rounded-lg disabled:opacity-30">◀</button>
              <span className="text-sm text-slate-400">{page} / {paginated.pages}</span>
              <button onClick={() => setPage(p=>Math.min(paginated.pages,p+1))} disabled={page===paginated.pages} className="btn-neutral px-3 py-1.5 text-sm rounded-lg disabled:opacity-30">▶</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
