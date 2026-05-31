import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

const SECTION_TITLES = {
  dashboard:    'Dashboard',
  transactions: 'Transacciones',
  budgets:      'Presupuestos',
  debts:        'Deudas',
  reports:      'Reportes',
  settings:     'Ajustes',
}

export default function Header() {
  const { currentSection, openModal } = useApp()
  const { user } = useAuth()

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const initials    = displayName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
  const today = new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  return (
    <header className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Logo solo en mobile */}
        <div className="md:hidden w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold">{SECTION_TITLES[currentSection]}</h1>
          <p className="text-xs text-slate-400 hidden md:block capitalize">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Avatar inicial — solo desktop */}
        {initials && (
          <div className="hidden md:flex w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/40 to-blue-700/40 border border-blue-500/30 items-center justify-center text-blue-300 font-bold text-xs">
            {initials}
          </div>
        )}
        {/* FAB nueva transacción */}
        <button
          onClick={() => openModal('transaction')}
          className="fab w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30"
          title="Nueva transacción"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </header>
  )
}
