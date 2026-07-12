import { Building, Users } from 'lucide-react'

export default function OrgSetup() {
  return (
    <>
      <h1 className="page-title">Organization Setup</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="activity-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '16px' }}>
            <Building size={18} style={{ color: 'var(--accent-color)' }} />
            Office Locations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              <strong>Bangalore Tech Park (HQ)</strong>
              <span className="badge badge-info">Main Office</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              <strong>London - City Office</strong>
              <span className="badge badge-info">Regional</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              <strong>New York Office</strong>
              <span className="badge badge-info">Regional</span>
            </div>
          </div>
        </div>

        <div className="activity-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '16px' }}>
            <Users size={18} style={{ color: 'var(--accent-color)' }} />
            Active Departments
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderLeft: '3px solid var(--accent-color)', background: 'rgba(255,255,255,0.01)' }}>
              <span>Information Technology (IT)</span>
              <span style={{ color: 'var(--text-muted)' }}>145 Assets</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderLeft: '3px solid var(--primary-blue)', background: 'rgba(255,255,255,0.01)' }}>
              <span>Product Engineering</span>
              <span style={{ color: 'var(--text-muted)' }}>320 Assets</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderLeft: '3px solid var(--green)', background: 'rgba(255,255,255,0.01)' }}>
              <span>Human Resources (HR)</span>
              <span style={{ color: 'var(--text-muted)' }}>24 Assets</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
