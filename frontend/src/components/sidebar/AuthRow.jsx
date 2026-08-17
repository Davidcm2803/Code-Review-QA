import { LogIn, LogOut, User } from 'lucide-react'
import { resolveAvatarUrl } from '../../lib/avatar'
import { S } from './sidebar.styles'

export function AuthRow({ user, logout, onOpenModal, collapsed = false, mobile = false, onAction }) {
  if (!user) {
    return (
      <button
        style={{ ...S.loginBtn(false, collapsed), ...(mobile ? { width: '100%' } : {}) }}
        onClick={() => { onOpenModal(); onAction?.() }}
      >
        <LogIn size={17} style={{ flexShrink: 0 }} />
        {(!collapsed || mobile) && <span>Iniciar sesión</span>}
      </button>
    )
  }

  return (
    <div style={mobile
      ? { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }
      : S.authRow(collapsed)
    }>
      {user.photo
        ? <img src={resolveAvatarUrl(user.photo)} alt={user.name} style={S.avatar} />
        : <div style={S.avatarFallback}><User size={13} color="#22c55e" /></div>
      }
      {(!collapsed || mobile) && (
        <>
          <span style={mobile ? { ...S.username, fontSize: 13 } : S.username}>{user.name}</span>
          <button
            style={S.logoutBtn(false)}
            title="Cerrar sesión"
            onClick={() => { logout(); onAction?.() }}
          >
            <LogOut size={mobile ? 16 : 14} />
          </button>
        </>
      )}
    </div>
  )
}