import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useAppContext } from './contexts/AppContext'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import OrgSetup from './pages/OrgSetup'
import Assets from './pages/Assets'
import AllocationTransfer from './pages/AllocationTransfer'
import ResourceBooking from './pages/ResourceBooking'
import Maintenance from './pages/Maintenance'
import Audit from './pages/Audit'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import Login from './pages/Login'

function AuthGate() {
  const { token, setToken, setUserEmail } = useAppContext()

  if (!token) {
    return (
      <Login
        onLoginSuccess={(tok, email) => {
          setToken(tok)
          setUserEmail(email)
        }}
      />
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/org-setup" element={<OrgSetup />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/allocation-transfer" element={<AllocationTransfer />} />
        <Route path="/resource-booking" element={<ResourceBooking />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  )
}

export default App
