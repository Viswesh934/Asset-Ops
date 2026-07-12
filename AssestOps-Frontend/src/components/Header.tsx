import { ChevronRight, LogOut } from 'lucide-react'

interface HeaderProps {
  activeTab: string
  userEmail: string | null
  onLogout: () => void
}

export default function Header({ activeTab, userEmail, onLogout }: HeaderProps) {
  const displayName = userEmail ? userEmail.split("@")[0] : "User"
  const initials = displayName.substring(0, 2).toUpperCase()

  return (
    <header className="app-header">
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "var(--text-muted)" }}>Asset Management</span>
        <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
        <span style={{ fontWeight: 600 }}>{activeTab}</span>
      </div>
      
      <div className="header-actions">
        <div className="user-badge">
          <div className="user-avatar">{initials}</div>
          <span style={{ fontSize: "13px" }}>{displayName}</span>
        </div>
        <button 
          onClick={onLogout} 
          title="Log Out"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "4px",
            borderRadius: "4px",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)" }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}

