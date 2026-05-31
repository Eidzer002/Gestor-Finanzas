import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export function useDebts() {
  const { user } = useAuth()
  const { debts, setDebts } = useData()

  const addDebt = useCallback(async (debtData) => {
    if (!user) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('debts').insert({ ...debtData, user_id: user.id }).select().single()
    if (error) throw error
    setDebts(prev => [...prev, data])
    return data
  }, [user, setDebts])

  const updateDebt = useCallback(async (id, debtData) => {
    if (!user) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('debts').update(debtData).eq('id', id).select().single()
    if (error) throw error
    setDebts(prev => prev.map(d => d.id === id ? data : d))
    return data
  }, [user, setDebts])

  const deleteDebt = useCallback(async (id) => {
    if (!user) throw new Error('No autenticado')
    const { error } = await supabase.from('debts').delete().eq('id', id)
    if (error) throw error
    setDebts(prev => prev.filter(d => d.id !== id))
  }, [user, setDebts])

  const registerPayment = useCallback(async (debtId, amount) => {
    if (!user) throw new Error('No autenticado')
    const debt = debts.find(d => d.id === debtId)
    if (!debt) throw new Error('Deuda no encontrada')

    const newPaid = debt.paid + amount
    const newStatus = newPaid >= debt.total ? 'paid'
      : newPaid > 0 ? 'partial' : 'pending'

    return updateDebt(debtId, { paid: newPaid, status: newStatus })
  }, [user, debts, updateDebt])

  const settleDebt = useCallback(async (debtId) => {
    const debt = debts.find(d => d.id === debtId)
    if (!debt) throw new Error('Deuda no encontrada')
    return updateDebt(debtId, { paid: debt.total, status: 'paid' })
  }, [debts, updateDebt])

  return { addDebt, updateDebt, deleteDebt, registerPayment, settleDebt }
}
