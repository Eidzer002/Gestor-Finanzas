import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
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

      // ─── FIX #3: Verificar TODOS los errores individualmente ──────────────
      const firstError = we || te || be || de || ce || ere || (se && se.code !== 'PGRST116')
      // PGRST116 = row not found (profile no creado aún, no es error)
      if (firstError) throw firstError

      setWallets(w ?? [])
      setTransactions(t ?? [])
      setBudgets(b ?? [])
      setDebts(d ?? [])

      // ─── FIX #8: No pasar IDs hardcodeados a Supabase ─────────────────────
      if (!c || c.length === 0) {
        const defaults = DEFAULT_CATEGORIES.map(({ id: _id, ...rest }) => ({
          ...rest,
          user_id: user.id,
        }))
        const { data: inserted, error: insertErr } = await supabase
          .from('categories').insert(defaults).select()
        if (insertErr) throw insertErr
        setCategories(inserted ?? [])
      } else {
        setCategories(c)
      }

      if (er && er.length > 0) {
        const rates = {}
        er.forEach(r => { rates[r.currency] = r.rate })
        setExchangeRates({ ...DEFAULT_EXCHANGE_RATES, ...rates })
      }

      if (s) {
        setSettings(s)
      } else {
        // Perfil no existe (nuevo usuario) — crearlo
        const { data: newProfile, error: profileErr } = await supabase
          .from('profiles')
          .insert({ id: user.id, main_currency: 'CUP', pin_enabled: false })
          .select()
          .single()
        if (profileErr) throw profileErr
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
      setWallets([])
      setTransactions([])
      setBudgets([])
      setDebts([])
      setCategories([])
      setExchangeRates(DEFAULT_EXCHANGE_RATES)
      setSettings({ main_currency: 'CUP', pin_enabled: false, pin_hash: null })
      setLoading(false)
      setError(null)
    }
  }, [user, loadData])

  // ─── FIX #5: Memoizar el value para evitar re-renders en cascada ──────────
  const value = useMemo(() => ({
    wallets,       setWallets,
    transactions,  setTransactions,
    budgets,       setBudgets,
    debts,         setDebts,
    categories,    setCategories,
    exchangeRates, setExchangeRates,
    settings,      setSettings,
    loading,       error,           loadData,
  }), [
    wallets, transactions, budgets, debts,
    categories, exchangeRates, settings,
    loading, error, loadData,
  ])

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de <DataProvider>')
  return ctx
}
