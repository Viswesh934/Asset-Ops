import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, User, Building, Calendar, RefreshCw, Clock, AlertTriangle, Wrench } from 'lucide-react'
import { api } from '../utils/api'
import { useAppContext } from '../contexts/AppContext'

interface KPICards {
  assetsAvailable: number
  assetsAllocated: number
  maintenanceToday: number
  activeBookings: number
  pendingTransfers: number
  upcomingReturns: number
  overdueReturns: number
  totalAssets: number
  inRepair: number
}

interface ReturnDetail {
  allocationId: string
  assetId: string
  assetName: string
  assetTag: string
  serialNumber: string | null
  targetType: "Employee" | "Department"
  assignedToName: string
  expectedReturnDate: string
  daysOverdue?: number
}

interface ActivityItem {
  id: string
  type: 'allocation' | 'booking' | 'maintenance'
  title: string
  description: string
  timestamp: string
}

interface DashboardData {
  role: string
  departmentName?: string | null
  kpis: KPICards
  overdueReturnsList: ReturnDetail[]
  upcomingReturnsList: ReturnDetail[]
  recentActivities: ActivityItem[]
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { setShowRegisterModal, setShowBookModal, setShowRequestModal, refetchKey } = useAppContext()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<DashboardData>("/dashboard")
      setData(res)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [refetchKey])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '4px' }} className="animate-pulse">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ height: '32px', width: '220px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '6px' }}></div>
          <div style={{ height: '18px', width: '260px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '6px' }}></div>
        </div>
        <div className="stats-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="stat-card" style={{ minHeight: '120px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ height: '16px', width: '90px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}></div>
                <div style={{ height: '24px', width: '24px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '50%' }}></div>
              </div>
              <div style={{ height: '32px', width: '60px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginTop: '12px' }}></div>
              <div style={{ height: '12px', width: '125px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginTop: '8px' }}></div>
            </div>
          ))}
        </div>
        <div style={{ height: '44px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}></div>
        <div style={{ height: '48px', width: '200px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px' }}></div>
        <div style={{ height: '220px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px' }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '20px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={32} style={{ color: 'var(--red)' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>Dashboard Connection Failed</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '380px', textAlign: 'center', lineHeight: '1.5' }}>
          {error}
        </p>
        <button className="btn btn-primary" onClick={fetchDashboardData} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', cursor: 'pointer' }}>
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    )
  }

  const kpis = data?.kpis || {
    assetsAvailable: 0,
    assetsAllocated: 0,
    maintenanceToday: 0,
    activeBookings: 0,
    pendingTransfers: 0,
    upcomingReturns: 0,
    overdueReturns: 0,
    totalAssets: 0,
    inRepair: 0,
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '2px' }}>Today's Overview</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Role: <strong style={{ color: 'var(--accent-color)' }}>{data?.role}</strong>
            {data?.departmentName && (
              <>
                {" "}• Department: <strong style={{ color: 'var(--accent-color)' }}>{data.departmentName}</strong>
              </>
            )}
          </div>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>Total Assets: <strong style={{ color: 'var(--text-primary)' }}>{kpis.totalAssets}</strong></span>
          <span>In Repair: <strong style={{ color: 'var(--text-primary)' }}>{kpis.inRepair}</strong></span>
          <button 
            onClick={fetchDashboardData}
            className="btn btn-secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 12px', 
              fontSize: '12px', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* OVERVIEW STAT CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Available</span>
            <div className="stat-icon-wrapper"><Package size={16} /></div>
          </div>
          <div className="stat-value">{kpis.assetsAvailable}</div>
          <div style={{ fontSize: '11px', color: 'var(--green)' }}>Ready for deployment</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Allocated</span>
            <div className="stat-icon-wrapper"><User size={16} /></div>
          </div>
          <div className="stat-value">{kpis.assetsAllocated}</div>
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
          <div className="stat-value">{kpis.activeBookings}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Facilities & accessories</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Pending Transfers</span>
            <div className="stat-icon-wrapper"><RefreshCw size={16} /></div>
          </div>
          <div className="stat-value">{kpis.pendingTransfers}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Awaiting verification</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Upcoming Returns</span>
            <div className="stat-icon-wrapper"><Clock size={16} /></div>
          </div>
          <div className="stat-value">{kpis.upcomingReturns}</div>
          <div style={{ fontSize: '11px', color: 'var(--red)' }}>Due within next 7 days</div>
        </div>
      </div>

      {/* DYNAMIC ALERT BANNER */}
      {kpis.overdueReturns > 0 && (
        <div className="alert-bar" onClick={() => navigate('/notifications')} style={{ cursor: 'pointer', marginTop: '16px' }}>
          <AlertTriangle size={18} />
          <span style={{ flex: 1 }}>{kpis.overdueReturns} asset{kpis.overdueReturns > 1 ? 's' : ''} overdue for return - flagged for urgent follow-up</span>
          <Clock size={16} style={{ transform: 'rotate(90deg)' }} />
        </div>
      )}

      {/* QUICK ACTION BUTTONS */}
      <div className="actions-container" style={{ marginTop: '16px' }}>
        <button className="btn btn-primary" onClick={() => setShowRegisterModal(true)}>
          <Package size={16} />
          + register asset
        </button>
        <button className="btn btn-secondary" onClick={() => setShowBookModal(true)}>
          <Calendar size={16} />
          Book resource
        </button>
        <button className="btn btn-secondary" onClick={() => setShowRequestModal(true)}>
          <RefreshCw size={16} />
          Raise requests
        </button>
      </div>

      {/* DYNAMIC RETURNS TRACKING LISTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginTop: '20px' }}>
        
        {/* Overdue Returns List */}
        <div className="activity-card" style={{ gap: '16px' }}>
          <h2 className="activity-title" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--red)' }} />
            Overdue Returns ({data?.overdueReturnsList.length || 0})
          </h2>
          {data?.overdueReturnsList && data.overdueReturnsList.length > 0 ? (
            <div className="data-table-wrapper" style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Assigned To</th>
                    <th>Expected Return</th>
                    <th>Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.overdueReturnsList.map((ret) => (
                    <tr key={ret.allocationId}>
                      <td style={{ fontWeight: 600 }}>
                        {ret.assetName}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>Tag: {ret.assetTag}</div>
                      </td>
                      <td>{ret.assignedToName}</td>
                      <td style={{ color: 'var(--red)', fontWeight: 500 }}>
                        {new Date(ret.expectedReturnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                      <td>
                        <span className="badge badge-danger" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          {ret.daysOverdue}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '28px 0', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Package size={20} style={{ color: 'var(--text-muted)' }} />
              No overdue returns at this time.
            </div>
          )}
        </div>

        {/* Upcoming Returns List */}
        <div className="activity-card" style={{ gap: '16px' }}>
          <h2 className="activity-title" style={{ borderBottomColor: 'rgba(29, 110, 228, 0.2)' }}>
            <Clock size={18} style={{ color: 'var(--primary-blue)' }} />
            Upcoming Returns ({data?.upcomingReturnsList.length || 0})
          </h2>
          {data?.upcomingReturnsList && data.upcomingReturnsList.length > 0 ? (
            <div className="data-table-wrapper" style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Assigned To</th>
                    <th>Expected Return</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcomingReturnsList.map((ret) => (
                    <tr key={ret.allocationId}>
                      <td style={{ fontWeight: 600 }}>
                        {ret.assetName}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>Tag: {ret.assetTag}</div>
                      </td>
                      <td>{ret.assignedToName}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {new Date(ret.expectedReturnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '28px 0', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Package size={20} style={{ color: 'var(--text-muted)' }} />
              No upcoming returns scheduled.
            </div>
          )}
        </div>
      </div>

      {/* RECENT ACTIVITY TIMELINE */}
      <div className="activity-card" style={{ marginTop: '20px' }}>
        <h2 className="activity-title">
          <Clock size={18} style={{ color: 'var(--accent-color)' }} />
          Recent Activity
        </h2>
        
        <div className="activity-timeline">
          {data?.recentActivities && data.recentActivities.length > 0 ? (
            data.recentActivities.map((act) => {
              const Icon = act.type === 'allocation' ? User : act.type === 'booking' ? Calendar : Wrench
              return (
                <div key={act.id} className="activity-item">
                  <div className="activity-icon-wrapper"><Icon size={16} /></div>
                  <div className="activity-details">
                    <span className="activity-text">
                      <strong style={{ color: '#fff' }}>{act.title}</strong> - {act.description}
                    </span>
                    <span className="activity-time">{formatRelativeTime(act.timestamp)}</span>
                  </div>
                </div>
              )
            })
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '28px 0', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Clock size={20} style={{ color: 'var(--text-muted)' }} />
              No recent activity recorded.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
