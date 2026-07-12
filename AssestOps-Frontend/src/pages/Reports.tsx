import { Package, BarChart3 } from 'lucide-react'

export default function Reports() {
  return (
    <>
      <h1 className="page-title">Operational Reports</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <div className="activity-card">
          <h3 style={{ color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} style={{ color: 'var(--accent-color)' }} />
            Category Allocation Breakdown
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span>Laptops & Hardware</span>
                <strong>65%</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '65%', height: '100%', background: 'var(--accent-color)' }} />
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span>Software Licenses</span>
                <strong>25%</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', background: 'var(--primary-blue)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span>Office Furniture</span>
                <strong>10%</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '10%', height: '100%', background: 'var(--green)' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="activity-card">
          <h3 style={{ color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: 'var(--primary-blue)' }} />
            Depreciation Valuation
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Capital Assets Value:</span>
              <strong style={{ fontFamily: 'var(--mono)', color: 'white' }}>$124,500.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Accumulated Depreciation:</span>
              <strong style={{ fontFamily: 'var(--mono)', color: 'var(--red)' }}>-$48,900.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Net Book Value:</span>
              <strong style={{ fontFamily: 'var(--mono)', color: 'var(--green)', fontSize: '16px' }}>$75,600.00</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
