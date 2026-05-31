import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { convertBetween } from '../lib/utils'

export function useTransactions() {
  const { user } = useAuth()
  const { transactions, setTransactions, wallets, setWallets, exchangeRates } = useData()

  // Aplicar efecto en billetera al registrar transacción
  const applyEffect = useCallback((transaction, walletsSnapshot) => {
    return walletsSnapshot.map(w => {
      if (w.id === transaction.wallet_id) {
        const delta = transaction.type === 'income' ? transaction.amount
          : transaction.type === 'expense' ? -transaction.amount
          : -transaction.amount // transfer: resta origen
        return { ...w, balance: w.balance + delta }
      }
      if (transaction.type === 'transfer' && w.id === transaction.wallet_dest_id) {
        const converted = convertBetween(
          transaction.amount,
          walletsSnapshot.find(x => x.id === transaction.wallet_id)?.currency,
          w.currency,
          exchangeRates
        )
        return { ...w, balance: w.balance + converted }
      }
      return w
    })
  }, [exchangeRates])

  const revertEffect = useCallback((transaction, walletsSnapshot) => {
    return walletsSnapshot.map(w => {
      if (w.id === transaction.wallet_id) {
        const delta = transaction.type === 'income' ? -transaction.amount
          : transaction.type === 'expense' ? transaction.amount
          : transaction.amount // transfer: devuelve al origen
        return { ...w, balance: w.balance + delta }
      }
      if (transaction.type === 'transfer' && w.id === transaction.wallet_dest_id) {
        const converted = convertBetween(
          transaction.amount,
          walletsSnapshot.find(x => x.id === transaction.wallet_id)?.currency,
          w.currency,
          exchangeRates
        )
        return { ...w, balance: w.balance - converted }
      }
      return w
    })
  }, [exchangeRates])

  const addTransaction = useCallback(async (transactionData) => {
    if (!user) throw new Error('No autenticado')

    const newTransaction = { ...transactionData, user_id: user.id }
    const { data, error } = await supabase
      .from('transactions')
      .insert(newTransaction)
      .select()
      .single()
    if (error) throw error

    // Actualizar saldo de billetera(s) en Supabase
    const updatedWallets = applyEffect(data, wallets)
    for (const w of updatedWallets) {
      const original = wallets.find(x => x.id === w.id)
      if (original && original.balance !== w.balance) {
        await supabase.from('wallets').update({ balance: w.balance }).eq('id', w.id)
      }
    }

    setTransactions(prev => [data, ...prev])
    setWallets(updatedWallets)
    return data
  }, [user, wallets, applyEffect, setTransactions, setWallets])

  const updateTransaction = useCallback(async (id, transactionData) => {
    if (!user) throw new Error('No autenticado')

    const old = transactions.find(t => t.id === id)
    if (!old) throw new Error('Transacción no encontrada')

    // Revertir efecto anterior, aplicar nuevo
    const reverted = revertEffect(old, wallets)
    const { data, error } = await supabase
      .from('transactions')
      .update(transactionData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    const updatedWallets = applyEffect(data, reverted)
    for (const w of updatedWallets) {
      const original = wallets.find(x => x.id === w.id)
      if (original && original.balance !== w.balance) {
        await supabase.from('wallets').update({ balance: w.balance }).eq('id', w.id)
      }
    }

    setTransactions(prev => prev.map(t => t.id === id ? data : t))
    setWallets(updatedWallets)
    return data
  }, [user, transactions, wallets, applyEffect, revertEffect, setTransactions, setWallets])

  const deleteTransaction = useCallback(async (id) => {
    if (!user) throw new Error('No autenticado')

    const transaction = transactions.find(t => t.id === id)
    if (!transaction) throw new Error('Transacción no encontrada')

    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error

    const updatedWallets = revertEffect(transaction, wallets)
    for (const w of updatedWallets) {
      const original = wallets.find(x => x.id === w.id)
      if (original && original.balance !== w.balance) {
        await supabase.from('wallets').update({ balance: w.balance }).eq('id', w.id)
      }
    }

    setTransactions(prev => prev.filter(t => t.id !== id))
    setWallets(updatedWallets)
  }, [user, transactions, wallets, revertEffect, setTransactions, setWallets])

  // Generar transacciones recurrentes pendientes
  const checkRecurring = useCallback(async () => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const recurring = transactions.filter(t => t.recurring && t.next_date && t.next_date <= today)

    for (const t of recurring) {
      let nextDate = t.next_date
      // Generar todas las ocurrencias hasta hoy (no solo una)
      while (nextDate <= today) {
        const newT = {
          user_id: user.id,
          type: t.type,
          wallet_id: t.wallet_id,
          wallet_dest_id: t.wallet_dest_id,
          amount: t.amount,
          currency: t.currency,
          category_id: t.category_id,
          description: t.description,
          date: nextDate,
          recurring: true,
          frequency: t.frequency,
          notes: t.notes,
          tags: t.tags,
        }

        // Calcular próxima fecha
        const d = new Date(nextDate + 'T00:00:00')
        if (t.frequency === 'weekly') d.setDate(d.getDate() + 7)
        else if (t.frequency === 'biweekly') d.setDate(d.getDate() + 14)
        else d.setMonth(d.getMonth() + 1) // monthly por defecto

        const newNextDate = d.toISOString().split('T')[0]
        newT.next_date = newNextDate

        await supabase.from('transactions').insert(newT)
        nextDate = newNextDate
      }

      // Actualizar next_date en la transacción original
      await supabase.from('transactions').update({ next_date: nextDate }).eq('id', t.id)
    }
  }, [user, transactions])

  return { addTransaction, updateTransaction, deleteTransaction, checkRecurring }
}
