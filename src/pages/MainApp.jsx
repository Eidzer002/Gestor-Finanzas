import { useApp } from '../context/AppContext'
import { useData } from '../context/DataContext'
import Header from '../components/layout/Header'
import BottomNav from '../components/layout/BottomNav'
import Sidebar from '../components/layout/Sidebar'
import ToastContainer from '../components/shared/ToastContainer'
import LoadingScreen from '../components/shared/LoadingScreen'

// Secciones
import Dashboard     from '../components/sections/Dashboard'
import Transactions  from '../components/sections/Transactions'
import Budgets       from '../components/sections/Budgets'
import Debts         from '../components/sections/Debts'
import Reports       from '../components/sections/Reports'
import Settings      from '../components/sections/Settings'

const SECTIONS = {
  dashboard:    Dashboard,
  transactions: Transactions,
  budgets:      Budgets,
  debts:        Debts,
  reports:      Reports,
  settings:     Settings,
}

export default function MainApp() {
  const { currentSection } = useApp()
  const { loading } = useData()

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
      <ToastContainer />
    </div>
  )
}
