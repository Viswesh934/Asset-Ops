import { Calendar } from 'lucide-react'
import type { Booking } from '../types'

interface ResourceBookingProps {
  bookings: Booking[]
  onOpenBook: () => void
}

export default function ResourceBooking({ bookings, onOpenBook }: ResourceBookingProps) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Resource Scheduler</h1>
        <button className="btn btn-primary" onClick={onOpenBook}>
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
            {bookings.map(book => (
              <tr key={book.id}>
                <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{book.id}</td>
                <td style={{ fontWeight: 600 }}>{book.resource}</td>
                <td>{book.user}</td>
                <td>{book.date}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{book.timeSlot}</td>
                <td>
                  <span className={`badge ${book.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                    {book.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
