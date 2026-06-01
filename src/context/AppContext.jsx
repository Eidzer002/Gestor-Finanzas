import { createContext, useContext, useReducer, useCallback } from 'react'

const AppContext = createContext(null)

const initialModals = {
  transaction: { open: false, editId: null },
  budget:      { open: false, editId: null },
  debt:        { open: false, editId: null, debtType: 'iowe' },
  payment:     { open: false, debtId: null },
  wallet:      { open: false, editId: null },
  delete:      { open: false, message: '', callback: null },
}

const initialState = { currentSection: 'dashboard', toasts: [], modals: initialModals }

function reducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, currentSection: action.section }
    case 'OPEN_MODAL':
      return { ...state, modals: { ...state.modals, [action.modal]: { ...state.modals[action.modal], open: true, ...action.payload } } }
    case 'CLOSE_MODAL':
      return { ...state, modals: { ...state.modals, [action.modal]: { ...initialModals[action.modal] } } }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const navigate = useCallback((section) => {
    dispatch({ type: 'NAVIGATE', section }); window.scrollTo(0, 0)
  }, [])

  const openModal = useCallback((modal, payload = {}) => {
    dispatch({ type: 'OPEN_MODAL', modal, payload })
  }, [])

  const closeModal = useCallback((modal) => {
    dispatch({ type: 'CLOSE_MODAL', modal })
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    dispatch({ type: 'ADD_TOAST', toast: { id, message, type } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 3500)
  }, [])

  const showDeleteModal = useCallback((message, callback) => {
    dispatch({ type: 'OPEN_MODAL', modal: 'delete', payload: { message, callback } })
  }, [])

  return (
    <AppContext.Provider value={{ ...state, navigate, openModal, closeModal, showToast, showDeleteModal }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}
