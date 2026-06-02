import { useApp } from '../../context/AppContext'

const NAV_ITEMS = [
  { id:'dashboard',    label:'Inicio',        emoji:'🏠' },
  { id:'transactions', label:'Movimientos',   emoji:'💸' },
  { id:'budgets',      label:'Presupuestos',  emoji:'🎯' },
  { id:'debts',        label:'Deudas',        emoji:'🤝' },
  { id:'reports',      label:'Reportes',      emoji:'📈' },
  { id:'settings',     label:'Ajustes',       emoji:'⚙️' },
]

export default function BottomNav() {
  const { currentSection, navigate } = useApp()
  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-30 flex md:hidden">
      {NAV_ITEMS.map(item => {
        const active = currentSection === item.id
        return (
          <button key={item.id} onClick={() => navigate(item.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all"
            style={{ color: active ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
            <span className="text-lg leading-none">{item.emoji}</span>
            <span className="text-[9px] font-semibold tracking-tight">{item.label}</span>
            {active && (
              <div className="absolute bottom-0 w-6 h-0.5 rounded-full bg-accent" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
