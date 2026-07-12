import { useState, useEffect } from 'react'
import { Calendar, Table, Plus } from 'lucide-react'
import type { Booking } from '../../types'
import { useBookingStore } from '../../store/bookingStore'
import CalendarTab from './CalendarTab'
import TableTab from './TableTab'
import BookModal from './BookModal'
import BookingDetailsModal from './BookingDetailsModal'
import RescheduleModal from './RescheduleModal'

interface ResourceBookingProps {
  bookings?: Booking[]
  setBookings?: React.Dispatch<React.SetStateAction<Booking[]>>
  onAddNotification: (type: 'alert' | 'info' | 'success' | 'warning', title: string, message: string) => void
}

export default function ResourceBooking({
  bookings: propBookings,
  setBookings,
  onAddNotification
}: ResourceBookingProps) {
  const { bookings: storeBookings, bookableResources, fetchBookings, fetchBookableResources } = useBookingStore()

  useEffect(() => {
    fetchBookings()
    fetchBookableResources()
  }, [fetchBookings, fetchBookableResources])

  const bookings = storeBookings

  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar')

  // Extract unique resources and dates from bookings/bookableResources
  const rawResources = bookableResources.length > 0
    ? bookableResources.map(r => r.name)
    : (Array.from(new Set(bookings.map(b => b.resource))).length > 0
        ? Array.from(new Set(bookings.map(b => b.resource)))
        : ['Meeting Room B2', 'Conference Room 4A', 'Training Room C', 'Epson Projector X41 (AF-0062)'])

  const resources = ['All Resources', ...rawResources]

  const dates = Array.from(new Set(bookings.map(b => b.date))).sort()

  const [selectedResource, setSelectedResource] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )

  // Synchronize selected resource when resources list updates from backend
  useEffect(() => {
    if (resources.length > 0 && (!selectedResource || !resources.includes(selectedResource))) {
      setSelectedResource(resources[0])
    }
  }, [resources, selectedResource])

  // Modals Visibility
  const [showBookModal, setShowBookModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Open booking details modal
  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowDetailsModal(true)
  }

  // Open reschedule modal
  const handleOpenReschedule = () => {
    setShowDetailsModal(false)
    setShowRescheduleModal(true)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
        <div>
          <h1 className="page-title">Resource Scheduler</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Schedule and manage bookings for workspaces and shared equipment with strict overlap checking.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* View Toggler */}
          <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'calendar' ? 'var(--accent-color)' : 'transparent',
                color: viewMode === 'calendar' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Calendar size={14} /> Calendar
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--accent-color)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Table size={14} /> Table View
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setShowBookModal(true)}>
            <Plus size={16} /> Book Resource
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarTab
          bookings={bookings}
          selectedResource={selectedResource}
          setSelectedResource={setSelectedResource}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          resources={resources}
          dates={dates}
          onSelectBooking={handleSelectBooking}
          onOpenBook={() => setShowBookModal(true)}
        />
      ) : (
        <TableTab bookings={bookings} />
      )}

      {/* --- Booking Modals --- */}
      {showBookModal && (
        <BookModal
          isOpen={showBookModal}
          onClose={() => setShowBookModal(false)}
          bookings={bookings}
          setBookings={setBookings}
          resources={resources}
          selectedResource={selectedResource}
          selectedDate={selectedDate}
          onAddNotification={onAddNotification}
        />
      )}

      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedBooking(null)
          }}
          booking={selectedBooking}
          setBookings={setBookings}
          onOpenReschedule={handleOpenReschedule}
          onAddNotification={onAddNotification}
        />
      )}

      {showRescheduleModal && selectedBooking && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false)
            setSelectedBooking(null)
          }}
          booking={selectedBooking}
          bookings={bookings}
          setBookings={setBookings}
          onAddNotification={onAddNotification}
        />
      )}
    </>
  )
}
