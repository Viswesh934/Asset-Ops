import { useEffect, useState, useCallback } from 'react'
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { api } from '../utils/api'

interface DbNotification {
  id: string
  userId: string
  type: string
  message: string
  isRead: boolean
  relatedEntityType: string | null
  relatedEntityId: string | null
  createdAt: string
}

const typeIcon = (type: string) => {
  if (type.includes('Discrepancy') || type.includes('Overdue')) return <AlertTriangle size={16} className="text-rose-400" />
  if (type.includes('Approved') || type.includes('Confirmed') || type.includes('Resolved')) return <CheckCircle size={16} className="text-emerald-400" />
  if (type.includes('Rejected') || type.includes('Cancelled')) return <AlertTriangle size={16} className="text-orange-400" />
  if (type.includes('Reminder')) return <Bell size={16} className="text-amber-400" />
  return <Info size={16} className="text-blue-400" />
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<DbNotification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<DbNotification[]>('/notifications')
      setNotifications(data)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Notifications</h1>
          <p className="text-sm text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-xl text-sm font-semibold transition-all"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center text-slate-500">
          <Bell size={28} className="mx-auto mb-3 text-slate-600" />
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => !notif.isRead && markRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                notif.isRead
                  ? 'bg-white/[0.01] border-white/[0.04] opacity-60'
                  : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]'
              }`}
              style={{
                borderLeftWidth: notif.isRead ? '1px' : '3px',
                borderLeftColor: notif.isRead ? undefined :
                  notif.type.includes('Discrepancy') || notif.type.includes('Overdue') ? '#f43f5e' :
                  notif.type.includes('Approved') || notif.type.includes('Confirmed') ? '#10b981' :
                  notif.type.includes('Rejected') || notif.type.includes('Cancelled') ? '#f97316' : '#3b82f6',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{typeIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{notif.type}</span>
                    {!notif.isRead && (
                      <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded-full">NEW</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{notif.message}</p>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
