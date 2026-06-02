import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

const SECTION_TITLES = {
  dashboard:'Dashboard', transactions:'Transacciones',
  budgets:'Presupuestos', debts:'Deudas',
  reports:'Reportes', settings:'Ajustes',
}

export default function Header() {
  const { currentSection, openModal } = useApp()
  const { user } = useAuth()
  const today = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })
  const name  = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3"
      style={{ background:'rgba(5,13,46,0.85)', backdropFilter:'blur(20px) saturate(1.8)',
               borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3">
        {/* Logo móvil */}
        <div className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-base"
          style={{ background:'linear-gradient(135deg, #3D7FFF, #1A56DB)' }}>
          💰
        </div>
        <div>
          <h1 className="text-base font-bold">{SECTION_TITLES[currentSection]}</h1>
          <p className="text-xs capitalize hidden md:block" style={{ color:'var(--text-muted)' }}>{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Avatar desktop */}
        {initials && (
          <div className="hidden md:flex w-8 h-8 rounded-xl items-center justify-center text-xs font-bold"
            style={{ background:'rgba(61,127,255,0.15)', color:'#93C5FD', border:'1px solid rgba(61,127,255,0.2)' }}>
            {initials}
          </div>
        )}
        {/* FAB nueva transacción */}
        <button onClick={() => openModal('transaction')} title="Nueva transacción"
          className="fab w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
          style={{ background:'linear-gradient(135deg, #3D7FFF, #1A56DB)' }}>
          +
        </button>
      </div>
    </header>
  )
}
