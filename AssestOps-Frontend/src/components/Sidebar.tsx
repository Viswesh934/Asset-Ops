import { NavLink, useLocation } from "react-router-dom"
import { routes } from "../routes"

interface SidebarProps {
  unreadCount: number
}

export default function Sidebar({ unreadCount }: SidebarProps) {
  const location = useLocation()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="header-title-container">
          <div className="header-logo-icon">A</div>
          <span className="header-title" style={{ fontWeight: 800, fontSize: "22px" }}>AssetFlow</span>
        </div>
      </div>
      
      <nav className="sidebar-menu">
        {routes.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          const isNotification = item.path === "/notifications"
          const count = isNotification ? unreadCount : 0

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              <Icon />
              <span style={{ flex: 1 }}>{item.title}</span>
              {count > 0 ? (
                <span className="badge badge-danger" style={{ borderRadius: "10px", padding: "2px 6px" }}>
                  {count}
                </span>
              ) : null}
            </NavLink>
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
