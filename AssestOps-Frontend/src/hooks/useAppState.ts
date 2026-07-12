import { useState, useEffect, useCallback } from 'react'
import type { Booking, MaintenanceTicket, SystemNotification } from '../types'
import { useBookingStore } from '../store/bookingStore'

function getBookingStartEndDates(dateStr: string, timeSlotStr: string) {
  try {
    const [startStr] = timeSlotStr.split("-").map(s => s.trim())
    const [time, modifier] = startStr.split(" ")
    let [hoursStr, minutesStr] = time.split(":")
    let hours = parseInt(hoursStr, 10)
    let minutes = parseInt(minutesStr, 10) || 0
    if (modifier === "PM" && hours < 12) {
      hours += 12
    }
    if (modifier === "AM" && hours === 12) {
      hours = 0
    }
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day, hours, minutes)
  } catch (e) {
    return null
  }
}

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

  // Refetch key — increment to tell pages to re-fetch their data
  const [refetchKey, setRefetchKey] = useState(0)
  const triggerRefetch = useCallback(() => setRefetchKey(k => k + 1), [])

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

  // Dynamic Reminder Notification check from Zustand store
  const storeBookings = useBookingStore(state => state.bookings)

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      storeBookings.forEach((booking) => {
        if (booking.status !== 'Upcoming') return

        const startObj = getBookingStartEndDates(booking.date, booking.timeSlot)
        if (!startObj) return

        const diffMs = startObj.getTime() - now.getTime()
        const fifteenMinutesMs = 15 * 60 * 1000

        // If the booking starts in 15 minutes or less, and hasn't started yet
        if (diffMs > 0 && diffMs <= fifteenMinutesMs) {
          // Check if we already have a notification for this booking ID
          const exists = notifications.some(
            n => n.title === 'Booking Reminder' && n.message.includes(booking.id)
          )
          if (!exists) {
            addNotification(
              'warning',
              'Booking Reminder',
              `Your reservation ${booking.id} for ${booking.resource} starts in less than 15 minutes (${booking.timeSlot})!`
            )
          }
        }
      })
    }

    checkReminders()
    const timer = setInterval(checkReminders, 15000)
    return () => clearInterval(timer)
  }, [storeBookings, notifications, addNotification])

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
    refetchKey,
    triggerRefetch,
    bookings,
    setBookings,
    addNotification,
    maintenance,
    notifications,
    showRegisterModal,
    setShowRegisterModal,
    showBookModal,
    setShowBookModal,
    showRequestModal,
    setShowRequestModal,
    handleBookResource,
    markAllNotificationsRead,
    resolveMaintenance,
    unreadNotificationsCount,
  }
}
