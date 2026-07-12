import { useState, useEffect, useCallback } from 'react'
import type { Booking, MaintenanceTicket, SystemNotification } from '../types'
import { useAssets } from './useAssets'
import { useAllocationTransfer } from './useAllocationTransfer'

export function useAppState() {
  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem("userEmail"))

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("userEmail")
    setToken(null)
    setUserEmail(null)
  }, [])

  // Navigation State
  const [currentPath, setCurrentPath] = useState<string>("/dashboard")

  // Hook-based data states
  const { assets, fetchAssets, registerAsset } = useAssets()
  const {
    allocations,
    transfers,
    employees,
    departments,
    fetchAllocations,
    fetchTransfers,
    fetchEmployees,
    fetchDepartments,
    createAllocation,
    processReturn,
    createTransferRequest,
    approveTransfer,
    rejectTransfer,
  } = useAllocationTransfer()

  // Fetch initial backend data when authenticated
  useEffect(() => {
    if (token) {
      fetchAssets()
      fetchAllocations()
      fetchTransfers()
      fetchEmployees()
      fetchDepartments()
    }
  }, [token, fetchAssets, fetchAllocations, fetchTransfers, fetchEmployees, fetchDepartments])

  // Modals Visibility
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)

  // Booking and Maintenance are kept as standard mock states (unless integrated in other tasks)
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

  const [notifications, setNotifications] = useState<SystemNotification[]>([
    { id: 'NTF-01', type: 'alert', title: 'Overdue Asset Warning', message: 'Laptop MacBook Pro 16" (AF-0114) is overdue for return by 3 days.', time: '2 hours ago', read: false },
    { id: 'NTF-02', type: 'warning', title: 'Approval Requested', message: 'David L. requested transfer of iPad Pro 12.9" from Mark Z.', time: '5 hours ago', read: false },
    { id: 'NTF-03', type: 'success', title: 'Maintenance Ticket Resolved', message: 'Projector AF-0062 maintenance ticket has been marked RESOLVED.', time: '1 day ago', read: true },
    { id: 'NTF-04', type: 'info', title: 'Audit Cycle Reminder', message: 'Q3 Physical Inventory Audit for Operations begins in 2 days.', time: '2 days ago', read: true }
  ])

  const addNotification = useCallback((type: 'alert' | 'info' | 'success' | 'warning', title: string, message: string) => {
    setNotifications((prev) => {
      const created: SystemNotification = {
        id: `NTF-${prev.length + 1}`,
        type,
        title,
        message,
        time: 'Just now',
        read: false
      }
      return [created, ...prev]
    })
  }, [])

  // Callback handlers calling Backend
  const handleRegisterAsset = useCallback(async (assetData: {
    name: string
    categoryId: string
    serialNumber?: string
    acquisitionDate?: string
    acquisitionCost?: number
    condition?: string
    location?: string
    departmentId?: string
    isBookable?: boolean
  }) => {
    const success = await registerAsset(assetData)
    if (success) {
      fetchAssets()
      setShowRegisterModal(false)
      addNotification('success', 'Asset Registered', `New asset ${assetData.name} successfully registered.`)
    }
  }, [registerAsset, fetchAssets, addNotification])

  const handleBookResource = useCallback((bookingData: {
    resource: string
    user: string
    date: string
    timeSlot: string
  }) => {
    setBookings((prev) => {
      const created: Booking = {
        id: `BK-${prev.length + 101}`,
        resource: bookingData.resource,
        user: bookingData.user,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        status: 'Confirmed'
      }
      addNotification('success', 'Resource Booked', `${created.resource} has been booked by ${created.user}.`)
      return [created, ...prev]
    })
    setShowBookModal(false)
  }, [addNotification])

  const handleAllocateAsset = useCallback(async (allocData: {
    assetId: string
    targetType: "Employee" | "Department"
    employeeId?: string | null
    departmentId?: string | null
    expectedReturnDate?: string | null
  }) => {
    try {
      await createAllocation(allocData)
      await fetchAssets()
      setShowRequestModal(false)
      addNotification('success', 'Asset Allocated', 'Asset allocation completed successfully.')
    } catch (err: any) {
      alert(err.message || 'Failed to allocate asset')
    }
  }, [createAllocation, fetchAssets, addNotification])

  const handleRequestTransfer = useCallback(async (transferData: {
    assetId: string
    requestedToEmployeeId?: string | null
    requestedToDepartmentId?: string | null
  }) => {
    try {
      await createTransferRequest(transferData)
      await fetchAssets()
      setShowRequestModal(false)
      addNotification('info', 'Transfer Requested', 'Transfer request submitted for approvals.')
    } catch (err: any) {
      alert(err.message || 'Failed to request transfer')
    }
  }, [createTransferRequest, fetchAssets, addNotification])

  const handleReturnAsset = useCallback(async (allocationId: string, returnNotes: { returnConditionNotes?: string; condition?: string }) => {
    try {
      await processReturn(allocationId, returnNotes)
      await fetchAssets()
      addNotification('success', 'Asset Returned', 'Asset returned and marked as Available.')
    } catch (err: any) {
      alert(err.message || 'Failed to process asset return')
    }
  }, [processReturn, fetchAssets, addNotification])

  const handleApproveTransfer = useCallback(async (transferId: string) => {
    const success = await approveTransfer(transferId)
    if (success) {
      await fetchAssets()
      addNotification('success', 'Transfer Approved', 'Transfer completed and custody updated.')
    }
  }, [approveTransfer, fetchAssets, addNotification])

  const handleRejectTransfer = useCallback(async (transferId: string) => {
    const success = await rejectTransfer(transferId)
    if (success) {
      addNotification('warning', 'Transfer Rejected', 'Transfer request rejected.')
    }
  }, [rejectTransfer, addNotification])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })))
  }, [])

  const resolveMaintenance = useCallback((id: string) => {
    setMaintenance((prev) => prev.map(m => m.id === id ? { ...m, status: 'Resolved' } : m))
    setMaintenance((prev) => {
      const mkt = prev.find(m => m.id === id)
      if (mkt) {
        addNotification('success', 'Maintenance Resolved', `Maintenance ticket for ${mkt.assetName} resolved successfully.`)
      }
      return prev
    })
  }, [addNotification])

  const unreadNotificationsCount = notifications.filter(n => !n.read).length

  return {
    token,
    setToken,
    userEmail,
    setUserEmail,
    handleLogout,
    currentPath,
    setCurrentPath,
    assets,
    allocations,
    transfers,
    employees,
    departments,
    bookings,
    maintenance,
    notifications,
    showRegisterModal,
    setShowRegisterModal,
    showBookModal,
    setShowBookModal,
    showRequestModal,
    setShowRequestModal,
    handleRegisterAsset,
    handleBookResource,
    handleAllocateAsset,
    handleRequestTransfer,
    handleReturnAsset,
    handleApproveTransfer,
    handleRejectTransfer,
    markAllNotificationsRead,
    resolveMaintenance,
    unreadNotificationsCount,
  }
}
