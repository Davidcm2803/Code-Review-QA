import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './components/sidebar/Sidebar'
import Dashboard from './pages/Dashboard'
import ScanRepository from './pages/ScanRepository'
import UploadCode from './pages/UploadCode'
import Reports from './pages/Reports'
import ScanDetails from './pages/ScanDetails'
import Chat from './pages/Chat'
import Settings from './pages/Settings'

function AppShell() {
  useEffect(() => {
    const yaVisto = localStorage.getItem('demo_notice_shown')
    if (!yaVisto) {
      alert(
        'Este es un demo hecho por mi David Castillo.\n\n' +
        'El backend se activa manualmente pa que no me hackeen xd. ' +
        'Si ves errores de conexión, es normal — contáctame para activarlo.'
      )
      localStorage.setItem('demo_notice_shown', 'true')
    }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 1400,
          padding: '0 clamp(0.75rem, 4vw, 1.5rem)',
          paddingBottom: 'calc(84px + env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
        }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/"                         element={<Dashboard />} />
          <Route path="/scan"                      element={<ScanRepository />} />
          <Route path="/scan/:scanId/results"      element={<ScanDetails />} />
          <Route path="/upload"                    element={<UploadCode />} />
          <Route path="/reports"                   element={<Reports />} />
          <Route path="/chat"                      element={<Chat />} />
          <Route path="/settings"                  element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}