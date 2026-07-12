import { Calendar } from 'lucide-react'
import { useAppContext } from '../contexts/AppContext'

export default function ResourceBooking() {
  const { bookings, setShowBookModal } = useAppContext()

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Resource Scheduler</h1>
        <button className="btn btn-primary" onClick={() => setShowBookModal(true)}>
          <Calendar size={16} /> Book Resource
        </button>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Resource Name</th>
              <th>Reserved By</th>
              <th>Date</th>
              <th>Time Slot</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id}>
                <td style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent-color)' }}>{booking.id}</td>
                <td style={{ fontWeight: 500 }}>{booking.resource}</td>
                <td>{booking.user}</td>
                <td>{booking.date}</td>
                <td>{booking.timeSlot}</td>
                <td>
                  <span className={`badge ${booking.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
