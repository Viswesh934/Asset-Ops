import { X, Calendar, User, Clock, CheckCircle, AlertTriangle, Bell, Play } from 'lucide-react'
import type { Booking } from '../../types'
import { useBookingStore } from '../../store/bookingStore'

interface BookingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking
  setBookings?: React.Dispatch<React.SetStateAction<Booking[]>>
  onOpenReschedule: () => void
  onAddNotification: (type: 'alert' | 'info' | 'success' | 'warning', title: string, message: string) => void
}

export default function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  setBookings,
  onOpenReschedule,
  onAddNotification
}: BookingDetailsModalProps) {
  if (!isOpen) return null

  // Cancel Booking handler
  const handleCancelBooking = async () => {
    await useBookingStore.getState().cancelBooking(booking.id)
    if (setBookings) {
      setBookings(prev => prev.map(b => 
        b.id === booking.id ? { ...b, status: 'Cancelled' } : b
      ))
    }
    onAddNotification('alert', 'Booking Cancelled', `Your reservation ${booking.id} for ${booking.resource} has been cancelled.`)
    onClose()
  }

  // Complete Booking handler (sets status to Completed)
  const handleCompleteBooking = async () => {
    await useBookingStore.getState().completeBooking(booking.id)
    if (setBookings) {
      setBookings(prev => prev.map(b => 
        b.id === booking.id ? { ...b, status: 'Completed' } : b
      ))
    }
    onAddNotification('success', 'Booking Completed', `Reservation ${booking.id} has been marked Completed.`)
    onClose()
  }

  // Ongoing status toggler (sets status to Ongoing)
  const handleStartBooking = async () => {
    await useBookingStore.getState().startBooking(booking.id)
    if (setBookings) {
      setBookings(prev => prev.map(b => 
        b.id === booking.id ? { ...b, status: 'Ongoing' } : b
      ))
    }
    onAddNotification('info', 'Booking In Progress', `Reservation ${booking.id} is now Ongoing.`)
    onClose()
  }

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
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>Reservation Details</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
              Manage status, cancel, or reschedule your resource booking.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Reminder alert box */}
        {booking.status === 'Upcoming' && (
          <div style={{
            background: 'rgba(29, 110, 228, 0.08)',
            border: '1px dashed rgba(29, 110, 228, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '12px',
            color: '#93c5fd'
          }}>
            <Bell size={16} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', color: '#fff' }}>Upcoming Booking</strong>
              Start the session when you begin using the resource.
            </div>
          </div>
        )}

        {/* Details list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={16} style={{ color: 'var(--text-muted)' }} />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Reserved By</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{booking.user}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Resource</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{booking.resource}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Date & Timeslot</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                {booking.date} at {booking.timeSlot}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={16} style={{ color: 'var(--text-muted)' }} />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Status</span>
              <span className={`badge ${
                booking.status === 'Completed' ? 'badge-success' :
                booking.status === 'Ongoing' ? 'badge-success' :
                booking.status === 'Upcoming' ? 'badge-info' : 'badge-danger'
              }`}
                style={{
                  marginTop: '4px',
                  backgroundColor: 
                    booking.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' :
                    booking.status === 'Ongoing' ? 'rgba(16, 185, 129, 0.1)' :
                    booking.status === 'Upcoming' ? 'rgba(29, 110, 228, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color:
                    booking.status === 'Completed' ? '#34d399' :
                    booking.status === 'Ongoing' ? '#34d399' :
                    booking.status === 'Upcoming' ? '#60a5fa' : '#fca5a5',
                  border:
                    booking.status === 'Completed' ? '1px solid rgba(16, 185, 129, 0.2)' :
                    booking.status === 'Ongoing' ? '1px solid rgba(16, 185, 129, 0.2)' :
                    booking.status === 'Upcoming' ? '1px solid rgba(29, 110, 228, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                {booking.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          
          {/* Quick status transitions */}
          {booking.status === 'Upcoming' && (
            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', backgroundColor: 'var(--green)' }}
              onClick={handleStartBooking}
            >
              <Play size={14} /> Start Session (Ongoing)
            </button>
          )}

          {booking.status === 'Ongoing' && (
            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', backgroundColor: 'var(--green)' }}
              onClick={handleCompleteBooking}
            >
              <CheckCircle size={14} /> Mark Completed
            </button>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              disabled={booking.status === 'Cancelled' || booking.status === 'Completed'}
              style={{ 
                opacity: (booking.status === 'Cancelled' || booking.status === 'Completed') ? 0.4 : 1,
                cursor: (booking.status === 'Cancelled' || booking.status === 'Completed') ? 'not-allowed' : 'pointer'
              }}
              onClick={onOpenReschedule}
            >
              Reschedule
            </button>
            <button
              className="btn btn-secondary"
              disabled={booking.status === 'Cancelled' || booking.status === 'Completed'}
              style={{
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                opacity: (booking.status === 'Cancelled' || booking.status === 'Completed') ? 0.4 : 1,
                cursor: (booking.status === 'Cancelled' || booking.status === 'Completed') ? 'not-allowed' : 'pointer'
              }}
              onClick={handleCancelBooking}
            >
              Cancel Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
