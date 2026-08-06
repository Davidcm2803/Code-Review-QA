// layout/SidebarMobile.jsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { NAV, SidebarNavLinks } from './SidebarNav'
import { S } from './sidebar.styles'

const VISIBLE = 4

export function SidebarMobile({ user, logout, onOpenModal }) {
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const visible = NAV.slice(0, VISIBLE)
  const overflow = NAV.slice(VISIBLE)

  return (
    <>
      <div style={S.mobileContentSpacer} />
      <nav style={S.bottomNav}>
        {visible.map(({ href, label, icon: Icon }) => (
          <Link key={href} to={href} style={S.bottomNavItem(pathname === href)}>
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
        <button style={S.bottomNavItem(overflow.some(n => n.href === pathname) || drawerOpen)}
          onClick={() => setDrawerOpen(v => !v)}>
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>

      {drawerOpen && (
        <>
          <div style={S.drawerOverlay} onClick={() => setDrawerOpen(false)} />
          <div style={S.drawer}>
            <div style={S.drawerHandle} />
            <SidebarNavLinks collapsed={false} onNavigate={() => setDrawerOpen(false)} />
            <AuthRow user={user} logout={logout} onOpenModal={onOpenModal}
              onAction={() => setDrawerOpen(false)} mobile />
          </div>
        </>
      )}
    </>
  )
}