import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import type { Booking } from '../../types'
import { useBookingStore } from '../../store/bookingStore'

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking
  bookings: Booking[]
  setBookings?: React.Dispatch<React.SetStateAction<Booking[]>>
  onAddNotification: (type: 'alert' | 'info' | 'success' | 'warning', title: string, message: string) => void
}

function parseTimeSlot(slot: string) {
  try {
    const [startStr, endStr] = slot.split("-").map(s => s.trim())
    
    const parseTime = (timeStr: string) => {
      const [time, modifier] = timeStr.split(" ")
      let [hours, minutes] = time.split(":").map(Number)
      if (modifier === "PM" && hours < 12) {
        hours += 12
      }
      if (modifier === "AM" && hours === 12) {
        hours = 0
      }
      return hours + (minutes || 0) / 60
    }

    return {
      start: parseTime(startStr),
      end: parseTime(endStr)
    }
  } catch (e) {
    return { start: 9, end: 10 }
  }
}

// Convert "09:00" to "9:00 AM" format
function formatInputTimeToTimeSlot(timeStr: string) {
  const [hoursStr, minutesStr] = timeStr.split(":")
  let hours = parseInt(hoursStr, 10)
  const minutes = minutesStr
  const modifier = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  return `${displayHours}:${minutes} ${modifier}`
}

export default function RescheduleModal({
  isOpen,
  onClose,
  booking,
  bookings,
  setBookings,
  onAddNotification
}: RescheduleModalProps) {
  const [date, setDate] = useState(booking.date)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [overlapError, setOverlapError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOverlapError(null)

    // Convert input times to decimal
    const [startH, startM] = startTime.split(":").map(Number)
    const [endH, endM] = endTime.split(":").map(Number)
    const requestStart = startH + startM / 60
    const requestEnd = endH + endM / 60

    if (requestStart >= requestEnd) {
      setOverlapError("Start time must be before end time.")
      return
    }

    // Past timings validation
    const bookingStart = new Date(`${date}T${startTime}:00`)
    const now = new Date()
    if (bookingStart.getTime() < now.getTime() - 60000) {
      setOverlapError("Validation failed: Cannot book slots in the past.")
      return
    }

    // Overlap validation check on existing bookings, EXCLUDING the current booking being rescheduled
    const resourceBookings = bookings.filter(b => 
      b.resource === booking.resource && 
      b.date === date && 
      b.status !== 'Cancelled' &&
      b.id !== booking.id // Exclude self
    )

    const overlappingBooking = resourceBookings.find(b => {
      const times = parseTimeSlot(b.timeSlot)
      return requestStart < times.end && times.start < requestEnd
    })

    if (overlappingBooking) {
      setOverlapError(
        `Overlap validation failed: ${booking.resource} is already booked during this time (taken by ${overlappingBooking.user} for ${overlappingBooking.timeSlot}).`
      )
      return
    }

    const formattedSlot = `${formatInputTimeToTimeSlot(startTime)} - ${formatInputTimeToTimeSlot(endTime)}`

    setSubmitting(true)
    try {
      await useBookingStore.getState().rescheduleBooking(
        booking.id,
        `${date}T${startTime}:00.000+05:30`,
        `${date}T${endTime}:00.000+05:30`,
        formattedSlot
      )

      if (setBookings) {
        setBookings(prev => prev.map(b => 
          b.id === booking.id 
            ? { 
                ...b, 
                date, 
                timeSlot: formattedSlot,
                status: 'Upcoming' 
              }
            : b
        ))
      }

      onAddNotification('success', 'Booking Rescheduled', `Reservation ${booking.id} has been moved to ${date} at ${formattedSlot}.`)
      setSubmitting(false)
      onClose()
    } catch (err: any) {
      setOverlapError(err.message || 'Failed to reschedule booking')
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '440px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>Reschedule Reservation</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
              Select a new date and time slot for booking <strong>{booking.id}</strong>.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Resource Name Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Resource</label>
            <input
              type="text"
              disabled
              value={booking.resource}
              style={{
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '14px',
                cursor: 'not-allowed'
              }}
            />
          </div>

          {/* Select Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>New Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.2)',
                color: '#fff',
                colorScheme: 'dark',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* Time Picker Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  colorScheme: 'dark',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  colorScheme: 'dark',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Overlap Error Alert Block */}
          {overlapError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px dashed rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '12px',
              color: '#fca5a5',
              lineHeight: 1.4
            }}>
              <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
              <span>{overlapError}</span>
            </div>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
