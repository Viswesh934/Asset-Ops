import { useState } from 'react'
import { X, Calendar } from 'lucide-react'

interface BookResourceModalProps {
  isOpen: boolean
  onClose: () => void
  onBook: (booking: {
    resource: string
    user: string
    date: string
    timeSlot: string
  }) => void
}

export default function BookResourceModal({ isOpen, onClose, onBook }: BookResourceModalProps) {
  const [resource, setResource] = useState('Meeting Room B2')
  const [user, setUser] = useState('')
  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !date || !timeSlot) return
    onBook({ resource, user, date, timeSlot })
    setUser('')
    setDate('')
    setTimeSlot('')
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
    }}>
      <div className="activity-card" style={{ width: '100%', maxWidth: '460px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--accent-color)' }} />
            Book Resource Scheduler
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Resource</label>
            <select
              style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={resource}
              onChange={(e) => setResource(e.target.value)}
            >
              <option value="Meeting Room B2">Meeting Room B2</option>
              <option value="Conference Room 4A">Conference Room 4A</option>
              <option value="Training Room C">Training Room C</option>
              <option value="Epson Projector X41 (AF-0062)">Epson Projector X41 (AF-0062)</option>
              <option value="Development Lab Sandbox">Development Lab Sandbox</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Booked By User / Team</label>
            <input
              type="text"
              required
              placeholder="e.g. Sales Engineering Team"
              style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Date</label>
            <input
              type="date"
              required
              style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Time Slot</label>
            <input
              type="text"
              required
              placeholder="e.g. 10:00 AM - 12:30 PM"
              style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Confirm Booking</button>
          </div>
        </form>
      </div>
    </div>
  )
}
