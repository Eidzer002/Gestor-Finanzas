import { useApp } from '../context/AppContext'
import { useData } from '../context/DataContext'
import { useTransactions } from '../hooks/useTransactions'
import { useEffect } from 'react'
import Header from '../components/layout/Header'
import BottomNav from '../components/layout/BottomNav'
import Sidebar from '../components/layout/Sidebar'
import LoadingScreen from '../components/shared/LoadingScreen'
import ToastContainer from '../components/shared/ToastContainer'
import ConfirmModal from '../components/shared/ConfirmModal'
import TransactionModal from '../components/shared/TransactionModal'
import BudgetModal from '../components/shared/BudgetModal'
import DebtModal from '../components/shared/DebtModal'
import PaymentModal from '../components/shared/PaymentModal'
import WalletModal from '../components/shared/WalletModal'
import Dashboard     from '../components/sections/Dashboard'
import Transactions  from '../components/sections/Transactions'
import Budgets       from '../components/sections/Budgets'
import Debts         from '../components/sections/Debts'
import Reports       from '../components/sections/Reports'
import Settings      from '../components/sections/Settings'

const SECTIONS = { dashboard:Dashboard, transactions:Transactions, budgets:Budgets, debts:Debts, reports:Reports, settings:Settings }

export default function MainApp() {
  const { currentSection } = useApp()
  const { loading } = useData()
  const { checkRecurring } = useTransactions()

  // Verificar transacciones recurrentes al iniciar
  useEffect(() => { checkRecurring() }, [])

  if (loading) return <LoadingScreen />

  const ActiveSection = SECTIONS[currentSection] || Dashboard

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="p-4 md:p-6">
          <ActiveSection />
        </main>
      </div>
      <BottomNav />
      {/* Modales globales */}
      <TransactionModal />
      <BudgetModal />
      <DebtModal />
      <PaymentModal />
      <WalletModal />
      <ConfirmModal />
      <ToastContainer />
    </div>
  )
}
