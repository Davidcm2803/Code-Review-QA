
import { useState } from 'react'
import { ChevronLeft, ChevronRight, LogIn, LogOut, User } from 'lucide-react'
import { SidebarNavLinks } from './SidebarNav'
import { S } from './sidebar.styles'

export function SidebarDesktop({ user, logout, onOpenModal }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside style={S.aside(collapsed)}>
      <div style={S.header}>
        <LogoIcon />
        {!collapsed && <span style={S.brandText}>CodeGuard</span>}
      </div>

      <SidebarNavLinks collapsed={collapsed} />

      <AuthRow user={user} logout={logout} onOpenModal={onOpenModal} collapsed={collapsed} />

      <button style={S.toggle} onClick={() => setCollapsed(c => !c)}>
        {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
      </button>
    </aside>
  )
}