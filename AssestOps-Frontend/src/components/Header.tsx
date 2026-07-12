import { ChevronRight } from 'lucide-react'

interface HeaderProps {
  activeTab: string
}

export default function Header({ activeTab }: HeaderProps) {
  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Asset Management</span>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontWeight: 600 }}>{activeTab}</span>
      </div>
      
      <div className="header-actions">
        <div className="user-badge">
          <div className="user-avatar">PS</div>
          <span style={{ fontSize: '13px' }}>Priya Shah</span>
        </div>
      </div>
    </header>
  )
}
