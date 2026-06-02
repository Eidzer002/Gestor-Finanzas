import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const ERROR_MESSAGES = {
  'Invalid login credentials':       'Email o contraseña incorrectos.',
  'User already registered':         'Ya existe una cuenta con ese email.',
  'Password should be at least 6':   'La contraseña debe tener al menos 6 caracteres.',
  'Unable to validate email address':'El formato del email no es válido.',
}
const friendlyError = (msg) => {
  for (const [k,v] of Object.entries(ERROR_MESSAGES)) if (msg?.includes(k)) return v
  return msg || 'Ocurrió un error. Intenta de nuevo.'
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1.5 block" style={{ color:'var(--text-secondary)' }}>
        {label}
      </label>
      <input {...props} className="glass-input" />
    </div>
  )
}

function LoginView({ onSwitch }) {
  const { signIn, resetPassword } = useAuth()
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [showReset,  setShowReset]  = useState(false)
  const [resetSent,  setResetSent]  = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return setError('Completa todos los campos.')
    setLoading(true); setError(null)
    try { await signIn({ email: email.trim(), password }) }
    catch (err) { setError(friendlyError(err.message)) }
    finally { setLoading(false) }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!email) return setError('Escribe tu email primero.')
    setLoading(true); setError(null)
    try { await resetPassword(email.trim()); setResetSent(true) }
    catch (err) { setError(friendlyError(err.message)) }
    finally { setLoading(false) }
  }

  if (resetSent) return (
    <div className="text-center py-6">
      <div className="text-5xl mb-4">📬</div>
      <h3 className="font-bold text-lg mb-2">Revisa tu correo</h3>
      <p className="text-sm mb-6" style={{ color:'var(--text-secondary)' }}>
        Enviamos un enlace a <strong className="text-white">{email}</strong>
      </p>
      <button onClick={() => { setResetSent(false); setShowReset(false) }}
        className="text-accent text-sm hover:underline">← Volver al login</button>
    </div>
  )

  return (
    <form onSubmit={showReset ? handleReset : handleLogin} className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">{showReset ? 'Recuperar contraseña' : 'Bienvenido'}</h2>
        <p className="text-sm" style={{ color:'var(--text-secondary)' }}>
          {showReset ? 'Te enviaremos un enlace a tu email' : 'Inicia sesión en tu cuenta'}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm text-center"
          style={{ background:'rgba(242,92,92,0.12)', border:'1px solid rgba(242,92,92,0.3)', color:'#FDA4A4' }}>
          {error}
        </div>
      )}

      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="tucorreo@email.com" autoComplete="email" />

      {!showReset && (
        <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••" autoComplete="current-password" />
      )}

      <button type="submit" disabled={loading}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Procesando...</>
          : showReset ? 'Enviar enlace' : 'Entrar'}
      </button>

      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={() => { setShowReset(s => !s); setError(null) }}
          className="text-xs transition-colors" style={{ color:'var(--text-secondary)' }}
          onMouseEnter={e => e.target.style.color='var(--accent-blue)'}
          onMouseLeave={e => e.target.style.color='var(--text-secondary)'}>
          {showReset ? '← Volver' : '¿Olvidaste tu contraseña?'}
        </button>
        {!showReset && (
          <button type="button" onClick={onSwitch} className="text-xs text-accent font-semibold hover:underline">
            Crear cuenta
          </button>
        )}
      </div>
    </form>
  )
}

function RegisterView({ onSwitch }) {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!fullName || !email || !password || !confirm) return setError('Completa todos los campos.')
    if (password.length < 6)  return setError('Mínimo 6 caracteres en la contraseña.')
    if (password !== confirm)  return setError('Las contraseñas no coinciden.')
    setLoading(true); setError(null)
    try { await signUp({ email: email.trim(), password, fullName: fullName.trim() }); setSuccess(true) }
    catch (err) { setError(friendlyError(err.message)) }
    finally { setLoading(false) }
  }

  if (success) return (
    <div className="text-center py-6">
      <div className="text-5xl mb-4">🎉</div>
      <h3 className="font-bold text-lg mb-2">¡Cuenta creada!</h3>
      <p className="text-sm mb-6" style={{ color:'var(--text-secondary)' }}>
        Ya puedes entrar con tu email y contraseña.
      </p>
      <button onClick={onSwitch} className="btn-primary w-full py-3">Ir al login</button>
    </div>
  )

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Crear cuenta</h2>
        <p className="text-sm" style={{ color:'var(--text-secondary)' }}>Gratis, solo toma un momento</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm text-center"
          style={{ background:'rgba(242,92,92,0.12)', border:'1px solid rgba(242,92,92,0.3)', color:'#FDA4A4' }}>
          {error}
        </div>
      )}

      <Input label="Nombre"    type="text"     value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Tu nombre completo" autoComplete="name" />
      <Input label="Email"     type="email"    value={email}    onChange={e=>setEmail(e.target.value)}    placeholder="tucorreo@email.com"  autoComplete="email" />
      <Input label="Contraseña"        type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
      <Input label="Confirmar contraseña" type="password" value={confirm}  onChange={e=>setConfirm(e.target.value)}  placeholder="Repite la contraseña"  autoComplete="new-password" />

      <button type="submit" disabled={loading}
        className="btn-success w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creando...</>
          : 'Crear cuenta'}
      </button>

      <p className="text-center text-xs" style={{ color:'var(--text-secondary)' }}>
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={onSwitch} className="text-accent font-semibold hover:underline">
          Inicia sesión
        </button>
      </p>
    </form>
  )
}

export default function AuthPage() {
  const [view, setView] = useState('login')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background:'linear-gradient(135deg, #3D7FFF, #1A56DB)', boxShadow:'0 8px 32px rgba(61,127,255,0.4)' }}>
            💰
          </div>
          <h1 className="text-2xl font-bold">Gestor Finanzas</h1>
          <p className="text-sm mt-1" style={{ color:'var(--text-secondary)' }}>Tu dinero, bajo control</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6">
          {view === 'login'
            ? <LoginView    onSwitch={() => setView('register')} />
            : <RegisterView onSwitch={() => setView('login')}    />
          }
        </div>

        <p className="text-center text-xs mt-5" style={{ color:'var(--text-muted)' }}>
          Tus datos son privados — solo tú puedes verlos 🔒
        </p>
      </div>
    </div>
  )
}
