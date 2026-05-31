import { useApp } from '../../context/AppContext'

const STYLES = { success:'bg-green-500', error:'bg-red-500', warning:'bg-orange-500', info:'bg-blue-500' }
const ICONS  = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' }

export default function ToastContainer() {
  const { toasts } = useApp()
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`${STYLES[t.type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[240px] animate-toast-in`}>
          <span className="font-bold">{ICONS[t.type]}</span>
          <span className="text-sm font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
