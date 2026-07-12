import type { SystemNotification } from '../types'

interface NotificationsProps {
  notifications: SystemNotification[]
  onMarkAllAsRead: () => void
}

export default function Notifications({ notifications, onMarkAllAsRead }: NotificationsProps) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Notifications Hub</h1>
        <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={onMarkAllAsRead}>
          Mark all as read
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.map(notif => (
          <div
            key={notif.id}
            className="activity-card"
            style={{
              padding: '16px 20px',
              opacity: notif.read ? 0.65 : 1,
              borderLeft: notif.read ? '1px solid var(--border-color)' : `3px solid ${
                notif.type === 'alert' ? 'var(--red)' :
                notif.type === 'warning' ? 'var(--amber)' :
                notif.type === 'success' ? 'var(--green)' : 'var(--primary-blue)'
              }`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: 'white' }}>{notif.title}</span>
                  {!notif.read && <span className="badge badge-danger" style={{ fontSize: '9px', padding: '1px 5px' }}>New</span>}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{notif.message}</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{notif.time}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
