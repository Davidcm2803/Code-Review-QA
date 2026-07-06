import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import Sidebar from './components/sidebar/Sidebar'
import Dashboard from './pages/Dashboard'
import ScanRepository from './pages/ScanRepository'
import UploadCode from './pages/UploadCode'
import Reports from './pages/Reports'
import Chat from './pages/Chat'
import Settings from './pages/Settings'

function AppShell() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/scan"     element={<ScanRepository />} />
          <Route path="/upload"   element={<UploadCode />} />
          <Route path="/reports"  element={<Reports />} />
          <Route path="/chat"     element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}