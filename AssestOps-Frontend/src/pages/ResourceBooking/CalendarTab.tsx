import { ChevronLeft, ChevronRight, AlertTriangle, Clock } from 'lucide-react'
import type { Booking } from '../../types'

interface CalendarTabProps {
  bookings: Booking[]
  selectedResource: string
  setSelectedResource: (val: string) => void
  selectedDate: string
  setSelectedDate: (val: string) => void
  resources: string[]
  dates: string[]
  onSelectBooking: (booking: Booking) => void
  onOpenBook: () => void
}

// Helper to parse timeSlot like "2:00 PM - 3:00 PM" into decimal hours
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

export default function CalendarTab({
  bookings,
  selectedResource,
  setSelectedResource,
  selectedDate,
  setSelectedDate,
  resources,
  dates,
  onSelectBooking,
  onOpenBook
}: CalendarTabProps) {
  const formatDisplayDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number)
      const d = new Date(year, month - 1, day)
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    } catch (e) {
      return dateStr
    }
  }

  // Navigate dates day-by-day
  const handlePrevDate = () => {
    try {
      const [year, month, day] = selectedDate.split('-').map(Number)
      const current = new Date(year, month - 1, day)
      current.setDate(current.getDate() - 1)
      const yyyy = current.getFullYear()
      const mm = String(current.getMonth() + 1).padStart(2, '0')
      const dd = String(current.getDate()).padStart(2, '0')
      setSelectedDate(`${yyyy}-${mm}-${dd}`)
    } catch (e) {
      console.error(e)
    }
  }

  const handleNextDate = () => {
    try {
      const [year, month, day] = selectedDate.split('-').map(Number)
      const current = new Date(year, month - 1, day)
      current.setDate(current.getDate() + 1)
      const yyyy = current.getFullYear()
      const mm = String(current.getMonth() + 1).padStart(2, '0')
      const dd = String(current.getDate()).padStart(2, '0')
      setSelectedDate(`${yyyy}-${mm}-${dd}`)
    } catch (e) {
      console.error(e)
    }
  }

  // Parse time boundaries and retrieve matched bookings
  const bookingsWithTimes = bookings.map(b => {
    const times = parseTimeSlot(b.timeSlot)
    return { ...b, ...times }
  })

  // Filter out Cancelled bookings for visual rendering in scheduler grid
  const activeBookings = bookingsWithTimes
    .filter(b => (selectedResource === 'All Resources' || b.resource === selectedResource) && b.date === selectedDate && b.status !== 'Cancelled')
    .sort((a, b) => a.start - b.start)

  // Timeline boundaries (8:00 AM to 6:00 PM)
  const startHour = 8
  const endHour = 18
  const timelineHours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const hourHeight = 80

  // Conflict overlap detection and column alignment algorithm
  const columns: any[][] = []
  activeBookings.forEach(booking => {
    let placed = false
    for (let i = 0; i < columns.length; i++) {
      const hasOverlap = columns[i].some(b => 
        booking.start < b.end && b.start < booking.end
      )
      if (!hasOverlap) {
        columns[i].push(booking)
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push([booking])
    }
  })

  // Detect conflict flag for each booking (must be same resource)
  const checkConflict = (booking: typeof activeBookings[0]) => {
    return activeBookings.some(other => 
      other.id !== booking.id && 
      other.resource === booking.resource &&
      booking.start < other.end && 
      other.start < booking.end
    )
  }

  const formatDecimalHour = (val: number) => {
    const h = Math.floor(val)
    const m = Math.round((val - h) * 60)
    const pm = h >= 12
    const displayH = h % 12 === 0 ? 12 : h % 12
    const displayM = m === 0 ? '00' : m
    return `${displayH}:${displayM} ${pm ? 'PM' : 'AM'}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Resource Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selected Resource</label>
          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              fontSize: '14px',
              fontWeight: 600,
              outline: 'none',
              minWidth: '240px'
            }}
          >
            {resources.map(res => (
              <option key={res} value={res} style={{ background: 'var(--bg-card)' }}>{res}</option>
            ))}
          </select>
        </div>

        {/* Date Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scheduler Date</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handlePrevDate}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} style={{ margin: 'auto' }} />
            </button>
            <div style={{ fontWeight: 600, fontSize: '15px', minWidth: '130px', textAlign: 'center', color: '#fff' }}>
              {formatDisplayDate(selectedDate)}
            </div>
            <button
              onClick={handleNextDate}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={16} style={{ margin: 'auto' }} />
            </button>
          </div>
        </div>

        {/* Go to Date selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Go to Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              colorScheme: 'dark',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              fontSize: '14px',
              fontWeight: 600,
              outline: 'none',
            }}
          />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(29, 110, 228, 0.2)', border: '1px solid rgba(29, 110, 228, 0.6)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Confirmed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.1)', border: '1.5px dashed rgba(239, 68, 68, 0.6)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Conflict</span>
          </div>
        </div>
      </div>

      {/* Grid Track */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', display: 'flex', width: '100%' }}>

          {/* Hour Labels */}
          <div style={{ width: '70px', flexShrink: 0 }}>
            {timelineHours.map(hour => (
              <div key={hour} style={{
                height: `${hourHeight}px`,
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--mono)',
                fontWeight: 500,
                textAlign: 'right',
                paddingRight: '16px',
                marginTop: '-6px'
              }}>
                {hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
              </div>
            ))}
          </div>

          {/* Plotted Column Track */}
          <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid var(--border-color)', minHeight: `${(timelineHours.length - 1) * hourHeight}px` }}>

            {/* Gridlines */}
            {timelineHours.slice(0, -1).map((_, idx) => (
              <div key={idx} style={{
                position: 'absolute',
                top: `${idx * hourHeight}px`,
                left: 0,
                right: 0,
                height: '1px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }} />
            ))}

            {/* Plotted Bookings */}
            {activeBookings.length === 0 ? (
              <div style={{
                position: 'absolute',
                top: '20%',
                left: 0,
                right: 0,
                textAlign: 'center',
                padding: '20px',
                color: 'var(--text-muted)'
              }}>
                <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontWeight: 500, fontSize: '14px' }}>No bookings scheduled for this resource today</p>
                <button className="btn btn-secondary" style={{ marginTop: '12px', padding: '6px 16px', fontSize: '12px' }} onClick={onOpenBook}>
                  Schedule Slot
                </button>
              </div>
            ) : (
              activeBookings.map(b => {
                const conflict = checkConflict(b)

                const topPos = (b.start - startHour) * hourHeight
                const heightPos = (b.end - b.start) * hourHeight

                let colIndex = 0
                let totalCols = 1
                for (let i = 0; i < columns.length; i++) {
                  if (columns[i].includes(b)) {
                    colIndex = i
                    totalCols = columns.length
                    break
                  }
                }

                const widthPercent = 100 / totalCols
                const leftPercent = colIndex * widthPercent

                const cardStyle: React.CSSProperties = conflict ? {
                  position: 'absolute',
                  top: `${topPos}px`,
                  height: `${heightPos - 4}px`,
                  left: `${leftPercent}%`,
                  width: `calc(${widthPercent}% - 4px)`,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1.5px dashed rgba(239, 68, 68, 0.5)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s',
                  zIndex: 5,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.1)'
                } : {
                  position: 'absolute',
                  top: `${topPos}px`,
                  height: `${heightPos - 4}px`,
                  left: `${leftPercent}%`,
                  width: `calc(${widthPercent}% - 4px)`,
                  background: b.status === 'Ongoing' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(29, 110, 228, 0.15)',
                  border: b.status === 'Ongoing' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(29, 110, 228, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s',
                  zIndex: 3,
                  cursor: 'pointer'
                }

                // Retrieve clean original booking item
                const origBooking = bookings.find(ob => ob.id === b.id)

                return (
                  <div
                    key={b.id}
                    style={cardStyle}
                    className={conflict ? "hover:scale-[1.01] hover:border-rose-500/80" : "hover:scale-[1.01] hover:border-blue-500/80"}
                    onClick={() => origBooking && onSelectBooking(origBooking)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '13px',
                          color: conflict ? '#fca5a5' : b.status === 'Ongoing' ? '#a7f3d0' : '#93c5fd',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {b.user}
                        </span>

                        {conflict ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171', fontSize: '9px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.2)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            <AlertTriangle size={10} /> Conflict
                          </span>
                        ) : (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: b.status === 'Ongoing' ? '#34d399' : '#60a5fa',
                            fontSize: '9px',
                            fontWeight: 700,
                            background: b.status === 'Ongoing' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(29, 110, 228, 0.2)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            {b.status}
                          </span>
                        )}
                      </div>

                      <p style={{
                        fontSize: '11px',
                        color: conflict ? '#fca5a5' : 'var(--text-secondary)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conflict ? `Slot is unavailable - overlap detected` : `Booking reference: ${b.id}`}
                      </p>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      color: conflict ? '#fca5a5' : 'var(--text-muted)',
                      fontFamily: 'var(--mono)',
                      marginTop: '6px'
                    }}>
                      <span style={{ fontSize: '10px' }}>Click to manage</span>
                      <span>{formatDecimalHour(b.start)} - {formatDecimalHour(b.end)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
