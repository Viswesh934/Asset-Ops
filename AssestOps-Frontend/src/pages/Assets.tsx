import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import type { Asset } from '../types'

interface AssetsProps {
  assets: Asset[]
  onOpenRegister: () => void
}

export default function Assets({ assets, onOpenRegister }: AssetsProps) {
  const [assetSearchQuery, setAssetSearchQuery] = useState('')
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('All')

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Assets Registry</h1>
        <button className="btn btn-primary" onClick={onOpenRegister}>
          <Plus size={16} /> Register Asset
        </button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-box">
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, ID or serial..."
            value={assetSearchQuery}
            onChange={(e) => setAssetSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Hardware', 'Software', 'Furniture'].map(cat => (
            <button
              key={cat}
              className="btn btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                backgroundColor: assetCategoryFilter === cat ? 'var(--accent-bg)' : 'transparent',
                borderColor: assetCategoryFilter === cat ? 'var(--accent-color)' : 'var(--border-color)',
                color: assetCategoryFilter === cat ? 'var(--accent-color)' : 'var(--text-secondary)'
              }}
              onClick={() => setAssetCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ASSETS DATA TABLE */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Serial Number</th>
            </tr>
          </thead>
          <tbody>
            {assets
              .filter(a => {
                const matchesSearch = a.name.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                                      a.id.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                                      a.serialNo.toLowerCase().includes(assetSearchQuery.toLowerCase())
                const matchesCat = assetCategoryFilter === 'All' || a.category === assetCategoryFilter
                return matchesSearch && matchesCat
              })
              .map(asset => (
                <tr key={asset.id}>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent-color)' }}>{asset.id}</td>
                  <td style={{ fontWeight: 500 }}>{asset.name}</td>
                  <td>
                    <span className="badge badge-info">{asset.category}</span>
                  </td>
                  <td>
                    <span className={`badge ${
                      asset.status === 'Available' ? 'badge-success' :
                      asset.status === 'Allocated' ? 'badge-info' :
                      asset.status === 'In Repair' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{asset.assignedTo || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>}</td>
                  <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-secondary)' }}>{asset.serialNo}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
