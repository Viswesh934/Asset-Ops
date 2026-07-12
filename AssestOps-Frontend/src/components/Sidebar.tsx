import {
  LayoutDashboard,
  Settings,
  Package,
  RefreshCw,
  Calendar,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  unreadCount: number
}

export default function Sidebar({ activeTab, setActiveTab, unreadCount }: SidebarProps) {
  const sidebarItems = [
    { title: 'Dashboard', icon: LayoutDashboard },
    { title: 'Organization setup', icon: Settings },
    { title: 'Assets', icon: Package },
    { title: 'Allocation & Transfer', icon: RefreshCw },
    { title: 'Resource Booking', icon: Calendar },
    { title: 'Maintenance', icon: Wrench },
    { title: 'Audit', icon: ClipboardCheck },
    { title: 'Reports', icon: BarChart3 },
    { title: 'Notifications', icon: Bell, count: unreadCount }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="header-title-container">
          <div className="header-logo-icon">A</div>
          <span className="header-title" style={{ fontWeight: 800, fontSize: '22px' }}>AssetFlow</span>
        </div>
      </div>
      
      <nav className="sidebar-menu">
        {sidebarItems.map(item => {
          const Icon = item.icon
          const isActive = activeTab === item.title
          return (
            <div
              key={item.title}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.title)}
            >
              <Icon />
              <span style={{ flex: 1 }}>{item.title}</span>
              {item.count ? (
                <span className="badge badge-danger" style={{ borderRadius: '10px', padding: '2px 6px' }}>
                  {item.count}
                </span>
              ) : null}
            </div>
          )
        })}
      </nav>
      
      <div className="sidebar-footer">
        <span>AssetFlow</span>
        <span>v1.2.0</span>
      </div>
    </aside>
  )
}
