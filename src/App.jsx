import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { DataProvider } from './context/DataContext'
import AppRouter from './pages/AppRouter'

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <DataProvider>
          <AppRouter />
        </DataProvider>
      </AppProvider>
    </AuthProvider>
  )
}
