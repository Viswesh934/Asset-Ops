import type { Booking } from '../../types'

interface TableTabProps {
  bookings: Booking[]
}

export default function TableTab({ bookings }: TableTabProps) {
  return (
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
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No resource bookings created yet.
              </td>
            </tr>
          ) : (
            bookings.map(book => (
              <tr key={book.id}>
                <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{book.id}</td>
                <td style={{ fontWeight: 600 }}>{book.resource}</td>
                <td>{book.user}</td>
                <td>{book.date}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{book.timeSlot}</td>
                <td>
                  <span className={`badge ${
                    book.status === 'Completed' ? 'badge-success' :
                    book.status === 'Ongoing' ? 'badge-info' :
                    book.status === 'Upcoming' ? 'badge-info' : 'badge-danger'
                  }`}
                    style={{
                      backgroundColor: 
                        book.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' :
                        book.status === 'Ongoing' ? 'rgba(16, 185, 129, 0.1)' :
                        book.status === 'Upcoming' ? 'rgba(29, 110, 228, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color:
                        book.status === 'Completed' ? '#34d399' :
                        book.status === 'Ongoing' ? '#34d399' :
                        book.status === 'Upcoming' ? '#60a5fa' : '#fca5a5',
                      border:
                        book.status === 'Completed' ? '1px solid rgba(16, 185, 129, 0.2)' :
                        book.status === 'Ongoing' ? '1px solid rgba(16, 185, 129, 0.2)' :
                        book.status === 'Upcoming' ? '1px solid rgba(29, 110, 228, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    {book.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
