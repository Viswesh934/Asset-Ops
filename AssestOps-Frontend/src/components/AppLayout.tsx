import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import RegisterAssetModal from './modals/RegisterAssetModal'
import BookResourceModal from './modals/BookResourceModal'
import TransferRequestModal from './modals/TransferRequestModal'
import { useAppContext } from '../contexts/AppContext'
import { routes } from '../routes'

export default function AppLayout() {
  const state = useAppContext()
  const location = useLocation()
  const activeRoute = routes.find(r => r.path === location.pathname) || routes[0]

  return (
    <div className="app-container">
      <Sidebar unreadCount={state.unreadNotificationsCount} />

      <main className="main-content">
        <Header
          activeTab={activeRoute.title}
          userEmail={state.userEmail}
          onLogout={state.handleLogout}
        />

        <div className="page-container">
          <Outlet />
        </div>
      </main>

      <RegisterAssetModal
        isOpen={state.showRegisterModal}
        onClose={() => state.setShowRegisterModal(false)}
        onSuccess={state.triggerRefetch}
      />

      <BookResourceModal
        isOpen={state.showBookModal}
        onClose={() => state.setShowBookModal(false)}
        onBook={state.handleBookResource}
      />

      <TransferRequestModal
        isOpen={state.showRequestModal}
        onClose={() => state.setShowRequestModal(false)}
        onSuccess={state.triggerRefetch}
      />
    </div>
  )
}
