import { CheckCircle, Clock } from 'lucide-react'

export default function Audit() {
  return (
    <>
      <h1 className="page-title">Physical Inventory Audits</h1>

      <div className="activity-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} style={{ color: 'var(--green)' }} />
            <strong style={{ fontSize: '16px', color: 'white' }}>Q2 Department Audits (Reconciled)</strong>
          </div>
          <span className="badge badge-success">Completed</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          All company devices logged across Bangalore and SF office spaces have been verified. Total 420 items verified. 3 discrepancies resolved.
        </p>
      </div>

      <div className="activity-card" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--amber)' }} />
            <strong style={{ fontSize: '16px', color: 'white' }}>Q3 Operations Audit (Active)</strong>
          </div>
          <span className="badge badge-warning">47% Complete</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', margin: '12px 0' }}>
          <div style={{ width: '47%', height: '100%', background: 'var(--accent-color)' }} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          In progress: Verifying active software licenses and office monitors in London and Edinburgh hubs.
        </p>
      </div>
    </>
  )
}
