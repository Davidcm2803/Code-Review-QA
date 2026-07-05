const S = {
  aside: (collapsed) => ({
    display: 'flex', flexDirection: 'column', height: '100vh',
    width: collapsed ? 52 : 220, minWidth: collapsed ? 52 : 220,
    background: 'var(--bg)', borderRight: '1px solid #1e2420',
    transition: 'width 0.15s ease, min-width 0.15s ease',
    overflow: 'hidden', flexShrink: 0,
  }),
  header: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 14px', borderBottom: '1px solid #1e2420',
    overflow: 'hidden', whiteSpace: 'nowrap',
  },
  logo: {
    width: 30, height: 30, background: '#22c55e', borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  brandText: {
    fontSize: 14, fontWeight: 600, color: '#e2e8e4', letterSpacing: '-0.2px',
  },
  nav: {
    flex: 1, padding: '8px 8px', display: 'flex',
    flexDirection: 'column', gap: 2, overflowY: 'auto',
  },
  link: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
    borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none',
    whiteSpace: 'nowrap', overflow: 'hidden',
    background: active ? 'rgba(34,197,94,0.12)' : 'transparent',
    color: active ? '#22c55e' : '#5a6b60',
    transition: 'background 0.12s, color 0.12s',
  }),
  authRow: (collapsed) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: collapsed ? '10px 0' : '10px 10px',
    borderTop: '1px solid #1e2420',
    justifyContent: collapsed ? 'center' : 'flex-start',
    overflow: 'hidden',
  }),
  loginBtn: (hovered, collapsed) => ({
    display: 'flex', alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: 9, width: collapsed ? 'auto' : '100%',
    padding: '7px 10px', borderRadius: 8, border: 'none',
    background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
    color: hovered ? '#a0b0a6' : '#5a6b60',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    transition: 'background 0.12s, color 0.12s', whiteSpace: 'nowrap',
  }),
  avatar: {
    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
    objectFit: 'cover', border: '1px solid #1e2420',
  },
  avatarFallback: {
    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(34,197,94,0.15)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  username: {
    fontSize: 12, color: '#a0b0a6', flex: 1, minWidth: 0,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  logoutBtn: (hovered) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: 7, border: 'none',
    background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
    color: hovered ? '#a0b0a6' : '#5a6b60',
    cursor: 'pointer', flexShrink: 0, transition: 'background 0.12s, color 0.12s',
  }),
  toggle: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 12, border: 'none', borderTop: '1px solid #1e2420',
    background: 'transparent', color: '#5a6b60', cursor: 'pointer',
  },

  bottomNav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'stretch',
    background: 'var(--bg)', borderTop: '1px solid #1e2420',
    height: 60, paddingBottom: 'env(safe-area-inset-bottom)',
  },
  bottomNavItem: (active) => ({
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 3,
    textDecoration: 'none', border: 'none', background: 'transparent',
    color: active ? '#22c55e' : '#5a6b60',
    fontSize: 10, fontWeight: 500, cursor: 'pointer',
    transition: 'color 0.12s',
    paddingTop: 4,
  }),
  mobileContentSpacer: {
    height: 60,
  },

  drawerOverlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
  },
  drawer: {
    position: 'fixed', bottom: 60, left: 0, right: 0, zIndex: 201,
    background: 'var(--bg)', borderTop: '1px solid #1e2420',
    borderRadius: '16px 16px 0 0',
    padding: '12px 12px 8px',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  drawerHandle: {
    width: 36, height: 4, borderRadius: 2, background: '#1e2420',
    margin: '0 auto 12px',
  },
  drawerLink: (active) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 12px', borderRadius: 10,
    textDecoration: 'none', fontSize: 14, fontWeight: 500,
    background: active ? 'rgba(34,197,94,0.12)' : 'transparent',
    color: active ? '#22c55e' : '#a0b0a6',
  }),
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}