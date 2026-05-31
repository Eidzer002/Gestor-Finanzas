import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export function useBudgets() {
  const { user } = useAuth()
  const { budgets, setBudgets } = useData()

  const addBudget = useCallback(async (budgetData) => {
    if (!user) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('budgets').insert({ ...budgetData, user_id: user.id }).select().single()
    if (error) throw error
    setBudgets(prev => [...prev, data])
    return data
  }, [user, setBudgets])

  const updateBudget = useCallback(async (id, budgetData) => {
    if (!user) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('budgets').update(budgetData).eq('id', id).select().single()
    if (error) throw error
    setBudgets(prev => prev.map(b => b.id === id ? data : b))
    return data
  }, [user, setBudgets])

  const deleteBudget = useCallback(async (id) => {
    if (!user) throw new Error('No autenticado')
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) throw error
    setBudgets(prev => prev.filter(b => b.id !== id))
  }, [user, setBudgets])

  return { addBudget, updateBudget, deleteBudget }
}
