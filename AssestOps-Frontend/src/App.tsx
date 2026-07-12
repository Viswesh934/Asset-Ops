import { useState } from 'react'
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
import type { Asset, Booking, MaintenanceTicket, TransferRequest, SystemNotification } from './types'
import { routes } from "./routes"

import Login from "./pages/Login"

function App() {
  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem("userEmail"))

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userEmail")
    setToken(null)
    setUserEmail(null)
  }

  // Navigation State
  const [currentPath, setCurrentPath] = useState<string>("/dashboard")
  const activeRoute = routes.find(r => r.path === currentPath) || routes[0]

  // Interactive Data States
  const [assets, setAssets] = useState<Asset[]>([
    { id: 'AF-0114', name: 'Laptop MacBook Pro 16"', category: 'Hardware', status: 'Allocated', assignedTo: 'Priya Shah', serialNo: 'C02DX123MD6R' },
    { id: 'AF-0062', name: 'Epson Projector X41', category: 'Hardware', status: 'Available', assignedTo: '', serialNo: 'EP-987216-A' },
    { id: 'AF-0250', name: 'Adobe Creative Cloud Suite', category: 'Software', status: 'Allocated', assignedTo: 'John Doe', serialNo: 'LIC-AD-CS99' },
    { id: 'AF-0312', name: 'Dell UltraSharp 27" 4K Monitor', category: 'Hardware', status: 'Allocated', assignedTo: 'Sarah Connor', serialNo: 'CN-012X45-9' },
    { id: 'AF-0089', name: 'Ergonomic Office Chair', category: 'Furniture', status: 'In Repair', assignedTo: '', serialNo: 'FUR-CH-0089' },
    { id: 'AF-0402', name: 'Slack Enterprise Plan License', category: 'Software', status: 'Available', assignedTo: '', serialNo: 'LIC-SL-ENT0' },
    { id: 'AF-0199', name: 'Jabra Evolve 75 Headset', category: 'Hardware', status: 'Available', assignedTo: '', serialNo: 'JB-772186-K' },
    { id: 'AF-0220', name: 'iPad Pro 12.9"', category: 'Hardware', status: 'Allocated', assignedTo: 'Mark Zuckerberg', serialNo: 'IPAD-PRO-981' }
  ])

  const [bookings, setBookings] = useState<Booking[]>([
    { id: 'BK-101', resource: 'Meeting Room B2', user: 'Priya Shah', date: '2026-07-12', timeSlot: '2:00 PM - 3:00 PM', status: 'Confirmed' },
    { id: 'BK-102', resource: 'Conference Room 4A', user: 'HR Recruitment Team', date: '2026-07-12', timeSlot: '4:00 PM - 5:30 PM', status: 'Confirmed' },
    { id: 'BK-103', resource: 'Training Room C', user: 'Operations Dept', date: '2026-07-13', timeSlot: '9:00 AM - 1:00 PM', status: 'Pending Approval' },
    { id: 'BK-104', resource: 'Epson Projector X41 (AF-0062)', user: 'R&D Team Lead', date: '2026-07-13', timeSlot: '2:00 PM - 6:00 PM', status: 'Confirmed' }
  ])

  const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>([
    { id: 'MNT-402', assetName: 'Epson Projector X41 (AF-0062)', issue: 'Bulb burnt out - replace bulb', date: '2026-07-09', priority: 'High', status: 'Resolved' },
    { id: 'MNT-405', assetName: 'Ergonomic Office Chair (AF-0089)', issue: 'Armrest locking mechanism broken', date: '2026-07-11', priority: 'Medium', status: 'In Progress' },
    { id: 'MNT-408', assetName: 'Lenovo ThinkPad X1 (AF-0051)', issue: 'Keyboard keys sticky and unresponsive', date: '2026-07-12', priority: 'Low', status: 'Open' }
  ])

  const [transfers, setTransfers] = useState<TransferRequest[]>([
    { id: 'REQ-772', assetName: 'Laptop MacBook Pro 16" (AF-0114)', fromUser: 'IT Dept Warehouse', toUser: 'Priya Shah', date: '2026-07-10', status: 'Approved' },
    { id: 'REQ-778', assetName: 'Dell UltraSharp 27" Monitor (AF-0312)', fromUser: 'IT Dept Warehouse', toUser: 'Sarah Connor', date: '2026-07-11', status: 'Approved' },
    { id: 'REQ-783', assetName: 'iPad Pro 12.9" (AF-0220)', fromUser: 'Mark Zuckerberg', toUser: 'David Lightman', date: '2026-07-12', status: 'Pending Approval' },
    { id: 'REQ-784', assetName: 'Jabra Evolve 75 Headset (AF-0199)', fromUser: 'IT Dept Warehouse', toUser: 'Kelly Booth', date: '2026-07-12', status: 'Pending Transfer' }
  ])

  const [notifications, setNotifications] = useState<SystemNotification[]>([
    { id: 'NTF-01', type: 'alert', title: 'Overdue Asset Warning', message: 'Laptop MacBook Pro 16" (AF-0114) is overdue for return by 3 days.', time: '2 hours ago', read: false },
    { id: 'NTF-02', type: 'warning', title: 'Approval Requested', message: 'David L. requested transfer of iPad Pro 12.9" from Mark Z.', time: '5 hours ago', read: false },
    { id: 'NTF-03', type: 'success', title: 'Maintenance Ticket Resolved', message: 'Projector AF-0062 maintenance ticket has been marked RESOLVED.', time: '1 day ago', read: true },
    { id: 'NTF-04', type: 'info', title: 'Audit Cycle Reminder', message: 'Q3 Physical Inventory Audit for Operations begins in 2 days.', time: '2 days ago', read: true }
  ])

  // Modals Visibility
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)

  // Calculated Stats
  const totalAssetsCount = assets.length
  const availableCount = assets.filter(a => a.status === 'Available').length
  const allocatedCount = assets.filter(a => a.status === 'Allocated').length
  const inRepairCount = assets.filter(a => a.status === 'In Repair').length
  const activeBookingsCount = bookings.filter(b => b.status === 'Confirmed').length
  const pendingTransfersCount = transfers.filter(t => t.status.startsWith('Pending')).length
  const upcomingReturnsCount = 12 // Simulated metric matching wireframe

  // Callback handlers
  const handleRegisterAsset = (assetData: {
    name: string
    category: 'Hardware' | 'Software' | 'Facilities' | 'Furniture'
    serialNo: string
    assignedTo: string
  }) => {
    const idNum = assets.length + 100
    const assetId = `AF-0${idNum}`
    const status: 'Allocated' | 'Available' = assetData.assignedTo ? 'Allocated' : 'Available'
    
    const created: Asset = {
      id: assetId,
      name: assetData.name,
      category: assetData.category,
      status: status,
      assignedTo: assetData.assignedTo,
      serialNo: assetData.serialNo
    }

    setAssets([created, ...assets])
    setShowRegisterModal(false)

    addNotification('success', 'Asset Registered', `New asset ${created.name} (${created.id}) successfully added.`)
  }

  const handleBookResource = (bookingData: {
    resource: string
    user: string
    date: string
    timeSlot: string
  }) => {
    const created: Booking = {
      id: `BK-${bookings.length + 101}`,
      resource: bookingData.resource,
      user: bookingData.user,
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      status: 'Confirmed'
    }

    setBookings([created, ...bookings])
    setShowBookModal(false)

    addNotification('success', 'Resource Booked', `${created.resource} has been booked by ${created.user}.`)
  }

  const handleCreateRequest = (requestData: {
    assetName: string
    fromUser: string
    toUser: string
  }) => {
    const created: TransferRequest = {
      id: `REQ-${transfers.length + 773}`,
      assetName: requestData.assetName,
      fromUser: requestData.fromUser,
      toUser: requestData.toUser,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending Approval'
    }

    setTransfers([created, ...transfers])
    setShowRequestModal(false)

    addNotification('info', 'Transfer Requested', `Transfer request for ${created.assetName} submitted to approval.`)
  }

  const addNotification = (type: 'alert' | 'info' | 'success' | 'warning', title: string, message: string) => {
    const created: SystemNotification = {
      id: `NTF-${notifications.length + 1}`,
      type,
      title,
      message,
      time: 'Just now',
      read: false
    }
    setNotifications([created, ...notifications])
  }

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const resolveMaintenance = (id: string) => {
    setMaintenance(maintenance.map(m => m.id === id ? { ...m, status: 'Resolved' } : m))
    const mkt = maintenance.find(m => m.id === id)
    if (mkt) {
      addNotification('success', 'Maintenance Resolved', `Maintenance ticket for ${mkt.assetName} resolved successfully.`)
    }
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length

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
    <div className="app-container">
      {/* 1. SIDEBAR NAVIGATION */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={setCurrentPath}
        unreadCount={unreadNotificationsCount}
      />

      {/* 2. MAIN CONTENT VIEWPORT */}
      <main className="main-content">
        {/* TOP BAR / HEADER */}
        <Header 
          activeTab={activeRoute.title} 
          userEmail={userEmail}
          onLogout={handleLogout}
        />

        {/* PAGE CONTENT SWITCH */}
        <div className="page-container">
          {currentPath === '/dashboard' && (
            <Dashboard
              availableCount={availableCount}
              allocatedCount={allocatedCount}
              activeBookingsCount={activeBookingsCount}
              pendingTransfersCount={pendingTransfersCount}
              upcomingReturnsCount={upcomingReturnsCount}
              totalAssetsCount={totalAssetsCount}
              inRepairCount={inRepairCount}
              onTabChange={(tabTitle) => {
                const target = routes.find(r => r.title === tabTitle)
                if (target) setCurrentPath(target.path)
              }}
              onOpenRegister={() => setShowRegisterModal(true)}
              onOpenBook={() => setShowBookModal(true)}
              onOpenRequest={() => setShowRequestModal(true)}
            />
          )}

          {currentPath === '/org-setup' && <OrgSetup />}

          {currentPath === '/assets' && (
            <Assets
              assets={assets}
              onOpenRegister={() => setShowRegisterModal(true)}
            />
          )}

          {currentPath === '/allocation-transfer' && (
            <AllocationTransfer
              transfers={transfers}
              onOpenRequest={() => setShowRequestModal(true)}
            />
          )}

          {currentPath === '/resource-booking' && (
            <ResourceBooking
              bookings={bookings}
              onOpenBook={() => setShowBookModal(true)}
            />
          )}

          {currentPath === '/maintenance' && (
            <Maintenance
              maintenance={maintenance}
              onResolve={resolveMaintenance}
            />
          )}

          {currentPath === '/audit' && <Audit />}

          {currentPath === '/reports' && <Reports />}

          {currentPath === '/notifications' && (
            <Notifications
              notifications={notifications}
              onMarkAllAsRead={markAllNotificationsRead}
            />
          )}
        </div>
      </main>

      {/* 3. MODALS SYSTEM */}
      <RegisterAssetModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegister={handleRegisterAsset}
      />

      <BookResourceModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        onBook={handleBookResource}
      />

      <TransferRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        assets={assets}
        onRequestTransfer={handleCreateRequest}
      />
    </div>
  )
}

export default App
