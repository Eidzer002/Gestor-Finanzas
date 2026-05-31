import { useApp } from '../../context/AppContext'

export default function ConfirmModal() {
  const { modals, closeModal } = useApp()
  const { open, message, callback } = modals.delete
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="modal-overlay absolute inset-0" onClick={() => closeModal('delete')} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm modal-content rounded-2xl p-6 m-4 animate-slide-in">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p className="text-white font-medium mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={() => closeModal('delete')} className="flex-1 btn-neutral py-3">Cancelar</button>
            <button onClick={() => { callback?.(); closeModal('delete') }} className="flex-1 btn-danger py-3">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
