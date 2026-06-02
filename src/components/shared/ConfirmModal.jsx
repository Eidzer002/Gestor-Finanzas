import { useApp } from '../../context/AppContext'

export default function ConfirmModal() {
  const { modals, closeModal } = useApp()
  const { open, message, callback } = modals.delete
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-overlay absolute inset-0" onClick={() => closeModal('delete')} />
      <div className="relative w-full max-w-sm modal-content rounded-2xl p-6 animate-slide-in">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background:'rgba(242,92,92,0.15)' }}>
            🗑️
          </div>
          <p className="font-semibold mb-1">¿Eliminar?</p>
          <p className="text-sm mb-6" style={{ color:'var(--text-secondary)' }}>{message}</p>
          <div className="flex gap-3">
            <button onClick={() => closeModal('delete')} className="flex-1 btn-neutral py-2.5 text-sm">
              Cancelar
            </button>
            <button onClick={() => { callback?.(); closeModal('delete') }}
              className="flex-1 btn-danger py-2.5 text-sm">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
