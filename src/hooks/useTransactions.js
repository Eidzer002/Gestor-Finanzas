import { useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { convertBetween } from '../lib/utils'

export function useTransactions() {
  const { user } = useAuth()
  const { transactions, setTransactions, wallets, setWallets, exchangeRates, loadData } = useData()

  // ─── FIX #1: Balance atómico via RPC ──────────────────────────────────────
  // Reemplaza el patrón read-check-write por UPDATE atómico en Postgres
  const applyBalanceRPC = useCallback(async (transaction) => {
    const { type, wallet_id, wallet_dest_id, amount, currency } = transaction

    if (type === 'transfer') {
      const src  = wallets.find(w => w.id === wallet_id)
      const dest = wallets.find(w => w.id === wallet_dest_id)
      const amountDest = src && dest
        ? convertBetween(amount, src.currency, dest.currency, exchangeRates)
        : amount

      const { error } = await supabase.rpc('transfer_wallet_balance', {
        p_wallet_src_id:  wallet_id,
        p_wallet_dest_id: wallet_dest_id,
        p_amount:         amount,
        p_amount_dest:    amountDest,
      })
      if (error) throw error

    } else {
      const delta = type === 'income' ? amount : -amount
      const { error } = await supabase.rpc('update_wallet_balance', {
        p_wallet_id: wallet_id,
        p_delta:     delta,
      })
      if (error) throw error
    }
  }, [wallets, exchangeRates])

  const revertBalanceRPC = useCallback(async (transaction) => {
    const { type, wallet_id, wallet_dest_id, amount, currency } = transaction
    const src  = wallets.find(w => w.id === wallet_id)
    const dest = wallet_dest_id ? wallets.find(w => w.id === wallet_dest_id) : null
    const amountDest = src && dest
      ? convertBetween(amount, src.currency, dest.currency, exchangeRates)
      : amount

    const { error } = await supabase.rpc('revert_wallet_balance', {
      p_wallet_id:      wallet_id,
      p_wallet_dest_id: wallet_dest_id ?? wallet_id,
      p_amount:         amount,
      p_amount_dest:    amountDest,
      p_type:           type,
    })
    if (error) throw error
  }, [wallets, exchangeRates])

  // ─── FIX #10: Functional updates — elimina 'wallets' de deps ──────────────
  const syncWalletsFromDB = useCallback(async () => {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')
    if (!error && data) setWallets(data)
  }, [user, setWallets])

  const addTransaction = useCallback(async (transactionData) => {
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transactionData, user_id: user.id })
      .select()
      .single()
    if (error) throw error

    // Balance atómico — no depende del estado local
    await applyBalanceRPC(data)
    // Sincronizar wallets desde la DB (valores ya actualizados atómicamente)
    await syncWalletsFromDB()

    setTransactions(prev => [data, ...prev])
    return data
  }, [user, applyBalanceRPC, syncWalletsFromDB, setTransactions])

  const updateTransaction = useCallback(async (id, transactionData) => {
    if (!user) throw new Error('No autenticado')

    const old = transactions.find(t => t.id === id)
    if (!old) throw new Error('Transacción no encontrada')

    // 1. Revertir efecto anterior atómicamente
    await revertBalanceRPC(old)

    // 2. Actualizar la transacción
    const { data, error } = await supabase
      .from('transactions')
      .update(transactionData)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      // Si falla la actualización, revertir el revert
      await applyBalanceRPC(old)
      throw error
    }

    // 3. Aplicar nuevo efecto atómicamente
    await applyBalanceRPC(data)
    await syncWalletsFromDB()

    setTransactions(prev => prev.map(t => t.id === id ? data : t))
    return data
  }, [user, transactions, applyBalanceRPC, revertBalanceRPC, syncWalletsFromDB, setTransactions])

  const deleteTransaction = useCallback(async (id) => {
    if (!user) throw new Error('No autenticado')

    const transaction = transactions.find(t => t.id === id)
    if (!transaction) throw new Error('Transacción no encontrada')

    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error

    await revertBalanceRPC(transaction)
    await syncWalletsFromDB()

    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [user, transactions, revertBalanceRPC, syncWalletsFromDB, setTransactions])

  // ─── FIX #6: Recargar datos tras generar recurrentes ──────────────────────
  const checkRecurring = useCallback(async () => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const pending = transactions.filter(t => t.recurring && t.next_date && t.next_date <= today)
    if (pending.length === 0) return

    for (const t of pending) {
      let nextDate = t.next_date
      while (nextDate <= today) {
        const newT = {
          user_id:         user.id,
          type:            t.type,
          wallet_id:       t.wallet_id,
          wallet_dest_id:  t.wallet_dest_id,
          amount:          t.amount,
          currency:        t.currency,
          category_id:     t.category_id,
          description:     t.description,
          date:            nextDate,
          recurring:       true,
          frequency:       t.frequency,
          notes:           t.notes,
          tags:            t.tags,
        }

        const d = new Date(nextDate + 'T00:00:00')
        if      (t.frequency === 'weekly')    d.setDate(d.getDate() + 7)
        else if (t.frequency === 'biweekly')  d.setDate(d.getDate() + 14)
        else                                   d.setMonth(d.getMonth() + 1)

        const newNextDate = d.toISOString().split('T')[0]
        newT.next_date = newNextDate

        const { data: inserted } = await supabase.from('transactions').insert(newT).select().single()
        if (inserted) await applyBalanceRPC(inserted)

        nextDate = newNextDate
      }
      await supabase.from('transactions').update({ next_date: nextDate }).eq('id', t.id)
    }

    // Recargar todo después de generar recurrentes
    await loadData()
  }, [user, transactions, applyBalanceRPC, loadData])

  return { addTransaction, updateTransaction, deleteTransaction, checkRecurring }
}
