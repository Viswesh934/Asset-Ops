import { create } from 'zustand'
import type { Booking } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface BookableResource {
  id: string
  name: string
  assetTag: string
  location: string | null
  status: string
}

interface BookingState {
  bookings: Booking[]
  bookableResources: BookableResource[]
  loading: boolean
  error: string | null

  fetchBookings: (resourceId?: string, date?: string) => Promise<void>
  fetchBookableResources: () => Promise<void>
  bookResource: (data: {
    assetId?: string
    resource: string
    user: string
    date: string
    startTime: string
    endTime: string
    timeSlot: string
    employeeId?: string
  }) => Promise<Booking>
  rescheduleBooking: (bookingId: string, startTime: string, endTime: string, timeSlot: string) => Promise<Booking>
  cancelBooking: (bookingId: string, reason?: string) => Promise<void>
  startBooking: (bookingId: string) => Promise<void>
  completeBooking: (bookingId: string) => Promise<void>
}

const INITIAL_BOOKINGS: Booking[] = []

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: INITIAL_BOOKINGS,
  bookableResources: [],
  loading: false,
  error: null,

  fetchBookableResources: async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/assets/bookable`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        set({ bookableResources: data || [] })
      }
    } catch (err: any) {
      console.error("Failed to fetch bookable resources:", err)
    }
  },

  fetchBookings: async (resourceId, date) => {
    set({ loading: true, error: null })
    const token = localStorage.getItem('token')
    if (!token) {
      set({ loading: false })
      return
    }

    try {
      const params = new URLSearchParams()
      if (resourceId) params.append('resourceId', resourceId)
      if (date) params.append('date', date)

      const res = await fetch(`${API_BASE_URL}/ubookings?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data: Booking[] = await res.json()
        set({ bookings: data || [], loading: false })
        return
      }
      set({ loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  bookResource: async (data) => {
    set({ loading: true, error: null })
    const token = localStorage.getItem('token')

    // Local overlap validation before API or local state update
    const prevBookings = get().bookings
    const startObj = new Date(`${data.date}T${data.startTime}`)
    const endObj = new Date(`${data.date}T${data.endTime}`)

    if (startObj >= endObj) {
      const err = "Start time must be before end time."
      set({ loading: false, error: err })
      throw new Error(err)
    }

    let bookingId = `BK-${get().bookings.length + 105}`
    let bookingStatus: Booking['status'] = 'Upcoming'

    if (token && data.assetId) {
      try {
        const res = await fetch(`${API_BASE_URL}/ubookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            assetId: data.assetId,
            startTime: `${data.date}T${data.startTime}:00.000+05:30`,
            endTime: `${data.date}T${data.endTime}:00.000+05:30`,
            employeeId: data.employeeId
          })
        })

        if (!res.ok) {
          const resData = await res.json().catch(() => ({}))
          const errMsg = resData.error || 'Failed to book resource'
          set({ loading: false, error: errMsg })
          throw new Error(errMsg)
        }

        const backendBooking = await res.json()
        if (backendBooking && backendBooking.id) {
          bookingId = backendBooking.id
          bookingStatus = backendBooking.status || 'Upcoming'
        }
      } catch (e: any) {
        set({ loading: false, error: e.message })
        throw e
      }
    }

    const newBooking: Booking = {
      id: bookingId,
      resource: data.resource,
      user: data.user,
      date: data.date,
      timeSlot: data.timeSlot,
      status: bookingStatus
    }

    set((state) => ({
      bookings: [newBooking, ...state.bookings],
      loading: false
    }))

    return newBooking
  },

  rescheduleBooking: async (bookingId, startTime, endTime, timeSlot) => {
    set({ loading: true, error: null })
    const token = localStorage.getItem('token')

    if (token && !bookingId.startsWith('BK-')) {
      try {
        const res = await fetch(`${API_BASE_URL}/ubookings/${bookingId}/reschedule`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            startTime,
            endTime
          })
        })

        if (!res.ok) {
          const resData = await res.json().catch(() => ({}))
          const errMsg = resData.error || 'Failed to reschedule booking'
          set({ loading: false, error: errMsg })
          throw new Error(errMsg)
        }
      } catch (e: any) {
        set({ loading: false, error: e.message })
        throw e
      }
    }

    let updatedBooking: Booking | null = null
    set((state) => ({
      bookings: state.bookings.map((b) => {
        if (b.id === bookingId) {
          updatedBooking = { ...b, timeSlot, status: 'Upcoming' }
          return updatedBooking
        }
        return b
      }),
      loading: false
    }))

    if (!updatedBooking) {
      throw new Error("Booking not found")
    }

    return updatedBooking
  },

  cancelBooking: async (bookingId, reason) => {
    const token = localStorage.getItem('token')
    if (token && !bookingId.startsWith('BK-')) {
      const res = await fetch(`${API_BASE_URL}/ubookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cancelledReason: reason })
      })
      if (!res.ok) {
        const resData = await res.json().catch(() => ({}))
        const errMsg = resData.error || 'Failed to cancel booking'
        set({ error: errMsg })
        throw new Error(errMsg)
      }
    }

    set((state) => ({
      bookings: state.bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'Cancelled' as const } : b
      )
    }))
  },

  startBooking: async (bookingId) => {
    const token = localStorage.getItem('token')
    if (token && !bookingId.startsWith('BK-')) {
      const res = await fetch(`${API_BASE_URL}/ubookings/${bookingId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const resData = await res.json().catch(() => ({}))
        const errMsg = resData.error || 'Failed to start session'
        set({ error: errMsg })
        throw new Error(errMsg)
      }
    }

    set((state) => ({
      bookings: state.bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'Ongoing' as const } : b
      )
    }))
  },

  completeBooking: async (bookingId) => {
    const token = localStorage.getItem('token')
    if (token && !bookingId.startsWith('BK-')) {
      const res = await fetch(`${API_BASE_URL}/ubookings/${bookingId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const resData = await res.json().catch(() => ({}))
        const errMsg = resData.error || 'Failed to complete session'
        set({ error: errMsg })
        throw new Error(errMsg)
      }
    }

    set((state) => ({
      bookings: state.bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'Completed' as const } : b
      )
    }))
  }
}))
