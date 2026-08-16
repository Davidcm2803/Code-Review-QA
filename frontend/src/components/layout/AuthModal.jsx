import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Shield, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import { loginWithGoogle, loginWithGitHub } from '../../lib/firebase'
import { authService } from '../../config/Api'
import { useAuth } from '../../context/AuthContext'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
)

const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: 16,
  },
  modal: {
    position: 'relative', width: '100%', maxWidth: 420,
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 16, overflow: 'hidden',
  },
  body:  { padding: 32 },
  closeBtn: {
    position: 'absolute', top: 16, right: 16, padding: 6,
    borderRadius: 8, cursor: 'pointer', background: 'transparent',
    color: 'var(--muted)', border: 'none', display: 'flex',
  },
  logoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 28 },
  logoIcon: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, borderRadius: 8,
    background: 'var(--primary)', color: 'var(--primary-fg)',
  },
  brandName: { fontSize: 17, fontWeight: 700, color: 'var(--fg)' },
  subtitle:  { fontSize: 13, color: 'var(--muted)' },
  providerBtn: (hovered) => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
    border: '1px solid var(--border)',
    background: hovered ? 'var(--secondary)' : 'transparent',
    color: 'var(--fg)', fontSize: 13, fontWeight: 500, transition: 'background 0.12s',
  }),
  dividerWrap: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  dividerText: { fontSize: 12, color: 'var(--muted)' },
  fieldWrap:   { position: 'relative' },
  fieldIcon: {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--muted)', pointerEvents: 'none',
  },
  input: {
    width: '100%', padding: '10px 14px 10px 38px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--fg)', fontSize: 13, outline: 'none', transition: 'border-color 0.12s',
  },
  error: {
    fontSize: 12, color: '#f87171',
    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 8, padding: '8px 12px',
  },
  submitBtn: (loading) => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '10px 16px', borderRadius: 8, marginTop: 4,
    background: 'var(--primary)', color: 'var(--primary-fg)',
    fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1, border: 'none', transition: 'opacity 0.12s',
  }),
  switchText: { textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 20 },
  switchBtn:  { background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' },
}

function Field({ icon: Icon, ...props }) {
  return (
    <div style={S.fieldWrap}>
      <Icon size={15} style={S.fieldIcon} />
      <input style={S.input} {...props}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e  => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

function ProviderBtn({ icon, label, onClick, loading }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button style={S.providerBtn(hovered)} onClick={onClick} disabled={loading}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {label}
    </button>
  )
}

export const AuthModal = ({ onClose }) => {
  const { login } = useAuth()
  const [mode, setMode]       = useState('login')
  const [form, setForm]       = useState({ username: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleProvider = async (provider) => {
    setError(''); setLoading(provider)
    try {
      const firebaseUser = provider === 'google'
        ? await loginWithGoogle()
        : await loginWithGitHub()
      const githubToken = provider === 'github'
        ? (firebaseUser.credential?.accessToken        
          ?? firebaseUser.accessToken                  
          ?? localStorage.getItem('github_token'))     
        : null

      const { token, user } = await authService.oauth(firebaseUser)
      localStorage.setItem('token', token)

      login({
        ...user,
        provider: firebaseUser.provider,
        ...(githubToken ? { githubToken } : {}),
      })
      onClose?.()
    } catch (err) {
      setError(err?.message ?? 'Error al iniciar sesión.')
    } finally { setLoading(null) }
  }

  const handleEmail = async () => {
    setError(''); setLoading('email')
    try {
      let token, user
      if (mode === 'register') {
        ({ token, user } = await authService.register({
          name:     form.username,
          email:    form.email,
          password: form.password,
        }))
      } else {
        ({ token, user } = await authService.login({
          email:    form.email,
          password: form.password,
        }))
      }
      localStorage.setItem('token', token)
      login(user)
      onClose?.()
    } catch (err) {
      setError(err?.message ?? 'Credenciales incorrectas.')
    } finally { setLoading(null) }
  }

  return createPortal(
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div style={S.modal}>
        <div style={S.body}>
          <button style={S.closeBtn} onClick={onClose}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--fg)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
            <X size={16} />
          </button>

          <div style={S.logoWrap}>
            <div style={S.logoIcon}><Shield size={18} /></div>
            <span style={S.brandName}>CodeGuard</span>
            <span style={S.subtitle}>
              {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta gratis'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ProviderBtn icon={<GoogleIcon />} label="Continuar con Google"
              onClick={() => handleProvider('google')} loading={loading === 'google'} />
            <ProviderBtn icon={<GitHubIcon />} label="Continuar con GitHub"
              onClick={() => handleProvider('github')} loading={loading === 'github'} />
          </div>

          <div style={S.dividerWrap}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>o continúa con</span>
            <div style={S.dividerLine} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mode === 'register' && (
              <Field icon={User} type="text" placeholder="Nombre de usuario"
                value={form.username} onChange={set('username')} />
            )}
            <Field icon={Mail} type="email" placeholder="Correo electrónico"
              value={form.email} onChange={set('email')} />
            <Field icon={Lock} type="password" placeholder="Contraseña"
              value={form.password} onChange={set('password')}
              onKeyDown={(e) => e.key === 'Enter' && handleEmail()} />

            {error && <p style={S.error}>{error}</p>}

            <button style={S.submitBtn(!!loading)} onClick={handleEmail} disabled={!!loading}>
              {loading === 'email'
                ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                : <>{mode === 'login' ? 'Iniciar sesión' : 'Registrarme'}<ArrowRight size={15} /></>
              }
            </button>
          </div>

          <p style={S.switchText}>
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button style={S.switchBtn}
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}>
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}