import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { DEFAULT_CATEGORIES, DEFAULT_EXCHANGE_RATES } from '../lib/utils'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()

  const [wallets,       setWallets]       = useState([])
  const [transactions,  setTransactions]  = useState([])
  const [budgets,       setBudgets]       = useState([])
  const [debts,         setDebts]         = useState([])
  const [categories,    setCategories]    = useState([])
  const [exchangeRates, setExchangeRates] = useState(DEFAULT_EXCHANGE_RATES)
  const [settings,      setSettings]      = useState({ main_currency: 'CUP', pin_enabled: false, pin_hash: null })
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  // ─── Cargar todos los datos del usuario ────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const [
        { data: w,  error: we  },
        { data: t,  error: te  },
        { data: b,  error: be  },
        { data: d,  error: de  },
        { data: c,  error: ce  },
        { data: er, error: ere },
        { data: s,  error: se  },
      ] = await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('debts').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('categories').select('*').eq('user_id', user.id).order('type').order('name'),
        supabase.from('exchange_rates').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])

      const firstError = we || te || be || de || ce || ere
      if (firstError) throw firstError

      setWallets(w ?? [])
      setTransactions(t ?? [])
      setBudgets(b ?? [])
      setDebts(d ?? [])

      // Si no tiene categorías, usar las por defecto
      if (!c || c.length === 0) {
        const defaults = DEFAULT_CATEGORIES.map(cat => ({ ...cat, user_id: user.id }))
        const { data: inserted } = await supabase.from('categories').insert(defaults).select()
        setCategories(inserted ?? defaults)
      } else {
        setCategories(c)
      }

      // Exchange rates
      if (er && er.length > 0) {
        const rates = {}
        er.forEach(r => { rates[r.currency] = r.rate })
        setExchangeRates({ ...DEFAULT_EXCHANGE_RATES, ...rates })
      }

      // Settings / profile
      if (s) {
        setSettings(s)
      } else if (!se) {
        // Crear perfil si no existe
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ id: user.id, main_currency: 'CUP', pin_enabled: false })
          .select()
          .single()
        if (newProfile) setSettings(newProfile)
      }

    } catch (err) {
      setError(err.message)
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) loadData()
    else {
      setWallets([]); setTransactions([]); setBudgets([])
      setDebts([]); setCategories([]); setLoading(false)
    }
  }, [user, loadData])

  return (
    <DataContext.Provider value={{
      wallets, setWallets,
      transactions, setTransactions,
      budgets, setBudgets,
      debts, setDebts,
      categories, setCategories,
      exchangeRates, setExchangeRates,
      settings, setSettings,
      loading, error, loadData,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de <DataProvider>')
  return ctx
}
