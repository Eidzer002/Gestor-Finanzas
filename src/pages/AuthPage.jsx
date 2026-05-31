import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const Logo = () => (
  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/30">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  </div>
)

const ERROR_MESSAGES = {
  'Invalid login credentials':        'Email o contraseña incorrectos.',
  'Email not confirmed':              'Confirma tu email antes de entrar.',
  'User already registered':          'Ya existe una cuenta con ese email.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'Unable to validate email address': 'El formato del email no es válido.',
}

function friendlyError(msg) {
  for (const [key, val] of Object.entries(ERROR_MESSAGES)) {
    if (msg?.includes(key)) return val
  }
  return msg || 'Ocurrió un error. Intenta de nuevo.'
}

// ─── Vista: Login ─────────────────────────────────────────────────────────────
function LoginView({ onSwitch }) {
  const { signIn, resetPassword } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [resetSent, setResetSent] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return setError('Completa todos los campos.')
    setLoading(true)
    setError(null)
    try {
      await signIn({ email: email.trim(), password })
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!email) return setError('Escribe tu email primero.')
    setLoading(true)
    setError(null)
    try {
      await resetPassword(email.trim())
      setResetSent(true)
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  if (resetSent) {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-3">📧</div>
        <h3 className="text-lg font-semibold mb-2">Revisa tu correo</h3>
        <p className="text-slate-400 text-sm mb-6">
          Te enviamos un enlace para restablecer tu contraseña a <strong className="text-white">{email}</strong>
        </p>
        <button onClick={() => { setResetSent(false); setShowReset(false) }}
          className="text-blue-400 text-sm hover:underline">
          ← Volver al login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={showReset ? handleReset : handleLogin} className="space-y-4">
      <h2 className="text-xl font-bold text-center mb-1">
        {showReset ? 'Recuperar contraseña' : 'Bienvenido de vuelta'}
      </h2>
      <p className="text-slate-400 text-sm text-center mb-5">
        {showReset ? 'Te enviaremos un enlace a tu email' : 'Inicia sesión en tu cuenta'}
      </p>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Email</label>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="tucorreo@email.com"
          className="glass-input" autoComplete="email"
        />
      </div>

      {!showReset && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Contraseña</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="glass-input" autoComplete="current-password"
          />
        </div>
      )}

      <button type="submit" disabled={loading}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</>
          : showReset ? 'Enviar enlace' : 'Entrar'
        }
      </button>

      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={() => { setShowReset(!showReset); setError(null) }}
          className="text-slate-400 text-xs hover:text-blue-400 transition-colors">
          {showReset ? '← Volver al login' : '¿Olvidaste tu contraseña?'}
        </button>
        {!showReset && (
          <button type="button" onClick={onSwitch}
            className="text-blue-400 text-xs hover:underline">
            Crear cuenta
          </button>
        )}
      </div>
    </form>
  )
}

// ─── Vista: Registro ──────────────────────────────────────────────────────────
function RegisterView({ onSwitch }) {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!fullName || !email || !password || !confirm) return setError('Completa todos los campos.')
    if (password.length < 6)  return setError('La contraseña debe tener al menos 6 caracteres.')
    if (password !== confirm)  return setError('Las contraseñas no coinciden.')

    setLoading(true)
    setError(null)
    try {
      await signUp({ email: email.trim(), password, fullName: fullName.trim() })
      setSuccess(true)
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-semibold mb-2">¡Cuenta creada!</h3>
        <p className="text-slate-400 text-sm mb-6">
          Ya puedes entrar con tu email y contraseña.
        </p>
        <button onClick={onSwitch} className="btn-primary w-full py-3">
          Ir al login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <h2 className="text-xl font-bold text-center mb-1">Crear cuenta</h2>
      <p className="text-slate-400 text-sm text-center mb-5">Es gratis y solo toma un momento</p>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Nombre</label>
        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
          placeholder="Tu nombre" className="glass-input" autoComplete="name" />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="tucorreo@email.com" className="glass-input" autoComplete="email" />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Contraseña</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres" className="glass-input" autoComplete="new-password" />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Confirmar contraseña</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          placeholder="Repite la contraseña" className="glass-input" autoComplete="new-password" />
      </div>

      <button type="submit" disabled={loading}
        className="btn-success w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando cuenta...</>
          : 'Crear cuenta'
        }
      </button>

      <p className="text-center">
        <button type="button" onClick={onSwitch}
          className="text-slate-400 text-xs hover:text-blue-400 transition-colors">
          ¿Ya tienes cuenta? <span className="text-blue-400">Inicia sesión</span>
        </button>
      </p>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AuthPage() {
  const [view, setView] = useState('login')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-2xl font-bold text-white">Gestor Finanzas</h1>
          <p className="text-slate-400 text-sm mt-1">Tu dinero, bajo control</p>
        </div>

        <div className="glass-card p-6">
          {view === 'login'
            ? <LoginView    onSwitch={() => setView('register')} />
            : <RegisterView onSwitch={() => setView('login')}    />
          }
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Tus datos son privados — solo tú puedes verlos
        </p>
      </div>
    </div>
  )
}
