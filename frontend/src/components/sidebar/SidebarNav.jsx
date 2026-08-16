// layout/Sidebar.jsx
import { useState } from 'react'
import { useIsMobile } from './sidebar.styles'
import { SidebarDesktop } from './SidebarDesktop'
import { SidebarMobile } from './SidebarMobile'
import { AuthModal } from '../layout/AuthModal'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const isMobile = useIsMobile()
  const [showModal, setShowModal] = useState(false)

  const props = { user, logout, onOpenModal: () => setShowModal(true) }

  return (
    <>
      {isMobile ? <SidebarMobile {...props} /> : <SidebarDesktop {...props} />}
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  )
}