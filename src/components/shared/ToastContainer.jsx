import { useApp } from '../../context/AppContext'

const STYLES = {
  success: { bg:'rgba(45,214,123,0.15)',  border:'rgba(45,214,123,0.3)',  color:'#2DD67B', icon:'✓' },
  error:   { bg:'rgba(242,92,92,0.15)',   border:'rgba(242,92,92,0.3)',   color:'#F25C5C', icon:'✕' },
  warning: { bg:'rgba(245,158,11,0.15)',  border:'rgba(245,158,11,0.3)',  color:'#F59E0B', icon:'⚠' },
  info:    { bg:'rgba(61,127,255,0.15)',  border:'rgba(61,127,255,0.3)',  color:'#3D7FFF', icon:'ℹ' },
}

export default function ToastContainer() {
  const { toasts } = useApp()
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const s = STYLES[t.type] || STYLES.info
        return (
          <div key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-toast-in min-w-[220px] max-w-[320px]"
            style={{ background: s.bg, border:`1px solid ${s.border}`, boxShadow:'0 8px 32px rgba(0,0,0,0.3)', backdropFilter:'blur(12px)' }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: s.border, color: s.color }}>{s.icon}</span>
            <span className="text-sm font-medium text-white">{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
