import { Package, User, Building, Calendar, RefreshCw, Clock, AlertTriangle, Wrench } from 'lucide-react'

interface DashboardProps {
  availableCount: number
  allocatedCount: number
  activeBookingsCount: number
  pendingTransfersCount: number
  upcomingReturnsCount: number
  totalAssetsCount: number
  inRepairCount: number
  onTabChange: (tab: string) => void
  onOpenRegister: () => void
  onOpenBook: () => void
  onOpenRequest: () => void
}

export default function Dashboard({
  availableCount,
  allocatedCount,
  activeBookingsCount,
  pendingTransfersCount,
  upcomingReturnsCount,
  totalAssetsCount,
  inRepairCount,
  onTabChange,
  onOpenRegister,
  onOpenBook,
  onOpenRequest
}: DashboardProps) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Today's Overview</h1>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
          <span>Total Assets: <strong style={{ color: 'var(--text-primary)' }}>{totalAssetsCount}</strong></span>
          <span>In Repair: <strong style={{ color: 'var(--text-primary)' }}>{inRepairCount}</strong></span>
          <span>Current Cycle: <strong style={{ color: 'var(--text-primary)' }}>Q3 FY26</strong></span>
        </div>
      </div>

      {/* OVERVIEW STAT CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Available</span>
            <div className="stat-icon-wrapper"><Package size={16} /></div>
          </div>
          <div className="stat-value">{availableCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--green)' }}>Ready for deployment</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Allocated</span>
            <div className="stat-icon-wrapper"><User size={16} /></div>
          </div>
          <div className="stat-value">{allocatedCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active in departments</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Available (Reserve)</span>
            <div className="stat-icon-wrapper"><Building size={16} /></div>
          </div>
          <div className="stat-value">4</div>
          <div style={{ fontSize: '11px', color: 'var(--amber)' }}>Minimum buffer stock</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Bookings</span>
            <div className="stat-icon-wrapper"><Calendar size={16} /></div>
          </div>
          <div className="stat-value">{activeBookingsCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Facilities & accessories</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Pending Transfers</span>
            <div className="stat-icon-wrapper"><RefreshCw size={16} /></div>
          </div>
          <div className="stat-value">{pendingTransfersCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Awaiting verification</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Upcoming Returns</span>
            <div className="stat-icon-wrapper"><Clock size={16} /></div>
          </div>
          <div className="stat-value">{upcomingReturnsCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--red)' }}>Due within next 7 days</div>
        </div>
      </div>

      {/* DYNAMIC ALERT BANNER */}
      <div className="alert-bar" onClick={() => onTabChange('Notifications')} style={{ cursor: 'pointer' }}>
        <AlertTriangle size={18} />
        <span style={{ flex: 1 }}>3 assets overdue for return - flagged for urgent follow-up</span>
        <Clock size={16} style={{ transform: 'rotate(90deg)' }} />
      </div>

      {/* QUICK ACTION BUTTONS */}
      <div className="actions-container">
        <button className="btn btn-primary" onClick={onOpenRegister}>
          <Package size={16} />
          + register asset
        </button>
        <button className="btn btn-secondary" onClick={onOpenBook}>
          <Calendar size={16} />
          Book resource
        </button>
        <button className="btn btn-secondary" onClick={onOpenRequest}>
          <RefreshCw size={16} />
          Raise requests
        </button>
      </div>

      {/* RECENT ACTIVITY TIMELINE */}
      <div className="activity-card">
        <h2 className="activity-title">
          <Clock size={18} style={{ color: 'var(--accent-color)' }} />
          Recent Activity
        </h2>
        
        <div className="activity-timeline">
          <div className="activity-item">
            <div className="activity-icon-wrapper"><User size={16} /></div>
            <div className="activity-details">
              <span className="activity-text">
                Laptop <strong style={{ color: '#fff' }}>AF-0114</strong> - allocated to <strong>Priya Shah</strong> - IT Department
              </span>
              <span className="activity-time">Allocated 2 hours ago</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon-wrapper"><Calendar size={16} /></div>
            <div className="activity-details">
              <span className="activity-text">
                Room <strong style={{ color: '#fff' }}>B2</strong> - booking confirmed - <strong>2:00 to 3:00 PM</strong>
              </span>
              <span className="activity-time">Booked 4 hours ago</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon-wrapper"><Wrench size={16} /></div>
            <div className="activity-details">
              <span className="activity-text">
                Projector <strong style={{ color: '#fff' }}>AF-0062</strong> - maintenance resolved (Bulb replaced)
              </span>
              <span className="activity-time">Completed yesterday</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
