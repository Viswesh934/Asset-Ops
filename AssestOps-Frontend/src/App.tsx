import Sidebar from './components/Sidebar'
import Header from './components/Header'
import RegisterAssetModal from './components/modals/RegisterAssetModal'
import BookResourceModal from './components/modals/BookResourceModal'
import TransferRequestModal from './components/modals/TransferRequestModal'
import Dashboard from './pages/Dashboard'
import OrgSetup from './pages/OrgSetup'
import Assets from './pages/Assets'
import AllocationTransfer from './pages/AllocationTransfer'
import ResourceBooking from './pages/ResourceBooking'
import Maintenance from './pages/Maintenance'
import Audit from './pages/Audit'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import { routes } from "./routes"
import { useAppState } from './hooks/useAppState'

import Login from "./pages/Login"

function App() {
  const state = useAppState()
  const activeRoute = routes.find(r => r.path === state.currentPath) || routes[0]

  if (!state.token) {
    return (
      <Login 
        onLoginSuccess={(tok, email) => {
          state.setToken(tok)
          state.setUserEmail(email)
        }} 
      />
    )
  }

  return (
    <div className="app-container">
      {/* 1. SIDEBAR NAVIGATION */}
      <Sidebar
        currentPath={state.currentPath}
        onNavigate={state.setCurrentPath}
        unreadCount={state.unreadNotificationsCount}
      />

      {/* 2. MAIN CONTENT VIEWPORT */}
      <main className="main-content">
        {/* TOP BAR / HEADER */}
        <Header 
          activeTab={activeRoute.title} 
          userEmail={state.userEmail}
          onLogout={state.handleLogout}
        />

        {/* PAGE CONTENT SWITCH */}
        <div className="page-container">
          {state.currentPath === '/dashboard' && (
            <Dashboard
              onTabChange={(tabTitle) => {
                const target = routes.find(r => r.title === tabTitle)
                if (target) state.setCurrentPath(target.path)
              }}
              onOpenRegister={() => state.setShowRegisterModal(true)}
              onOpenBook={() => state.setShowBookModal(true)}
              onOpenRequest={() => state.setShowRequestModal(true)}
            />
          )}

          {state.currentPath === '/org-setup' && <OrgSetup />}

          {state.currentPath === '/assets' && (
            <Assets
              assets={state.assets as any}
              onOpenRegister={() => state.setShowRegisterModal(true)}
            />
          )}

          {state.currentPath === '/allocation-transfer' && (
            <AllocationTransfer
              transfers={state.transfers as any}
              allocations={state.allocations}
              onApproveTransfer={state.handleApproveTransfer}
              onRejectTransfer={state.handleRejectTransfer}
              onReturnAsset={state.handleReturnAsset}
              onOpenRequest={() => state.setShowRequestModal(true)}
            />
          )}

          {state.currentPath === '/resource-booking' && (
            <ResourceBooking
              bookings={state.bookings}
              onOpenBook={() => state.setShowBookModal(true)}
            />
          )}

          {state.currentPath === '/maintenance' && (
            <Maintenance
              maintenance={state.maintenance}
              onResolve={state.resolveMaintenance}
            />
          )}

          {state.currentPath === '/audit' && <Audit />}

          {state.currentPath === '/reports' && <Reports />}

          {state.currentPath === '/notifications' && (
            <Notifications
              notifications={state.notifications}
              onMarkAllAsRead={state.markAllNotificationsRead}
            />
          )}
        </div>
      </main>

      {/* 3. MODALS SYSTEM */}
      <RegisterAssetModal
        isOpen={state.showRegisterModal}
        onClose={() => state.setShowRegisterModal(false)}
        onRegister={state.handleRegisterAsset as any}
      />

      <BookResourceModal
        isOpen={state.showBookModal}
        onClose={() => state.setShowBookModal(false)}
        onBook={state.handleBookResource}
      />

      <TransferRequestModal
        isOpen={state.showRequestModal}
        onClose={() => state.setShowRequestModal(false)}
        assets={state.assets as any}
        employees={state.employees}
        departments={state.departments}
        onAllocate={state.handleAllocateAsset}
        onTransfer={state.handleRequestTransfer}
      />
    </div>
  )
}

export default App
