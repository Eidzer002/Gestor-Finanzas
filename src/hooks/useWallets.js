import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export function useWallets() {
  const { user } = useAuth()
  const { wallets, setWallets, transactions } = useData()

  const addWallet = useCallback(async (walletData) => {
    if (!user) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('wallets')
      .insert({ ...walletData, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setWallets(prev => [...prev, data])
    return data
  }, [user, setWallets])

  const updateWallet = useCallback(async (id, walletData) => {
    if (!user) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('wallets')
      .update(walletData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setWallets(prev => prev.map(w => w.id === id ? data : w))
    return data
  }, [user, setWallets])

  // ─── FIX #9: Verificar transacciones asociadas antes de eliminar ──────────
  const deleteWallet = useCallback(async (id) => {
    if (!user) throw new Error('No autenticado')

    const txCount = transactions.filter(
      t => t.wallet_id === id || t.wallet_dest_id === id
    ).length

    if (txCount > 0) {
      throw new Error(
        `Esta billetera tiene ${txCount} transacción${txCount > 1 ? 'es' : ''} asociada${txCount > 1 ? 's' : ''}. Elimínalas primero antes de borrar la billetera.`
      )
    }

    const { error } = await supabase.from('wallets').delete().eq('id', id)
    if (error) throw error
    setWallets(prev => prev.filter(w => w.id !== id))
  }, [user, transactions, setWallets])

  return { addWallet, updateWallet, deleteWallet }
}
