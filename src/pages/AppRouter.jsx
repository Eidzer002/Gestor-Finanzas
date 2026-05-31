import { useAuth } from '../context/AuthContext'
import AuthPage from './AuthPage'
import MainApp from './MainApp'
import LoadingScreen from '../components/shared/LoadingScreen'

export default function AppRouter() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user)   return <AuthPage />
  return <MainApp />
}
