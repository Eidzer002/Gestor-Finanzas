import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { formatCurrency, convertToMain } from '../../lib/utils'

const NAV_ITEMS = [
  { id:'dashboard',    label:'Dashboard',     emoji:'🏠' },
  { id:'transactions', label:'Transacciones', emoji:'💸' },
  { id:'budgets',      label:'Presupuestos',  emoji:'🎯' },
  { id:'debts',        label:'Deudas',        emoji:'🤝' },
  { id:'reports',      label:'Reportes',      emoji:'📈' },
  { id:'settings',     label:'Ajustes',       emoji:'⚙️' },
]

export default function Sidebar() {
  const { currentSection, navigate } = useApp()
  const { user, signOut } = useAuth()
  const { wallets, exchangeRates, settings } = useData()

  const total = wallets.reduce((s, w) => s + convertToMain(w.balance, w.currency, exchangeRates, settings.main_currency), 0)
  const name  = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()

  return (
    <aside className="sidebar fixed top-0 left-0 h-full w-[280px] z-40 hidden md:flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #3D7FFF, #1A56DB)', boxShadow: '0 4px 14px rgba(61,127,255,0.4)' }}>
            💰
          </div>
          <div>
            <p className="font-bold text-[15px]">Gestor Finanzas</p>
            <p className="text-xs num" style={{ color:'var(--text-muted)' }}>
              {formatCurrency(total, settings.main_currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = currentSection === item.id
          return (
            <button key={item.id} onClick={() => navigate(item.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left group"
              style={{
                background: active ? 'rgba(61,127,255,0.12)' : 'transparent',
                color: active ? '#F0F4FF' : 'var(--text-secondary)',
              }}>
              <span className="text-base w-5 text-center">{item.emoji}</span>
              <span className={`font-medium text-sm ${active ? '' : 'group-hover:text-white'} transition-colors`}>
                {item.label}
              </span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-white/3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background:'linear-gradient(135deg, rgba(61,127,255,0.3), rgba(124,58,237,0.3))', color:'#A5B4FC' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-xs truncate" style={{ color:'var(--text-muted)' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ color:'var(--text-secondary)', background:'rgba(255,255,255,0.04)' }}
          onMouseEnter={e => e.target.style.color='#F25C5C'}
          onMouseLeave={e => e.target.style.color='var(--text-secondary)'}>
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
