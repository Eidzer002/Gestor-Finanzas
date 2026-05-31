import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export function useWallets() {
  const { user } = useAuth()
  const { wallets, setWallets } = useData()

  const addWallet = useCallback(async (walletData) => {
    if (!user) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('wallets').insert({ ...walletData, user_id: user.id }).select().single()
    if (error) throw error
    setWallets(prev => [...prev, data])
    return data
  }, [user, setWallets])

  const updateWallet = useCallback(async (id, walletData) => {
    if (!user) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('wallets').update(walletData).eq('id', id).select().single()
    if (error) throw error
    setWallets(prev => prev.map(w => w.id === id ? data : w))
    return data
  }, [user, setWallets])

  const deleteWallet = useCallback(async (id) => {
    if (!user) throw new Error('No autenticado')
    const { error } = await supabase.from('wallets').delete().eq('id', id)
    if (error) throw error
    setWallets(prev => prev.filter(w => w.id !== id))
  }, [user, setWallets])

  return { addWallet, updateWallet, deleteWallet }
}
