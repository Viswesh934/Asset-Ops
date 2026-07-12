import { useState } from 'react'
import { RefreshCw, ArrowRight, Check, X, ShieldAlert, Award } from 'lucide-react'
import type { Allocation, TransferRequest } from '../hooks/useAllocationTransfer'
import ReturnAssetModal from '../components/modals/ReturnAssetModal'

interface AllocationTransferProps {
  transfers: TransferRequest[]
  allocations: Allocation[]
  onApproveTransfer: (id: string) => Promise<void>
  onRejectTransfer: (id: string) => Promise<void>
  onReturnAsset: (id: string, notes: { returnConditionNotes?: string; condition?: string }) => Promise<void>
  onOpenRequest: () => void
}

export default function AllocationTransfer({
  transfers,
  allocations,
  onApproveTransfer,
  onRejectTransfer,
  onReturnAsset,
  onOpenRequest
}: AllocationTransferProps) {
  const [activeTab, setActiveTab] = useState<'allocations' | 'transfers'>('allocations')
  const [selectedAllocForReturn, setSelectedAllocForReturn] = useState<Allocation | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const handleReturnSubmit = async (allocationId: string, notes: { returnConditionNotes?: string; condition?: string }) => {
    setActionLoadingId(allocationId)
    try {
      await onReturnAsset(allocationId, notes)
    } finally {
      setActionLoadingId(null)
      setSelectedAllocForReturn(null)
    }
  }

  const handleApprove = async (transferId: string) => {
    setActionLoadingId(transferId)
    try {
      await onApproveTransfer(transferId)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (transferId: string) => {
    setActionLoadingId(transferId)
    try {
      await onRejectTransfer(transferId)
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>Asset Custody & Lifecycle</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Allocate assets directly or manage transfer requests across members.</p>
        </div>
        <button className="btn btn-primary" onClick={onOpenRequest} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Allocate / Transfer Asset
        </button>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', gap: '16px' }}>
        <button
          style={{
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'allocations' ? '2px solid var(--accent-color)' : 'none',
            color: activeTab === 'allocations' ? 'var(--accent-color)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onClick={() => setActiveTab('allocations')}
        >
          Active Allocations ({allocations.filter(a => a.status !== 'Returned').length})
        </button>
        <button
          style={{
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'transfers' ? '2px solid var(--accent-color)' : 'none',
            color: activeTab === 'transfers' ? 'var(--accent-color)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onClick={() => setActiveTab('transfers')}
        >
          Transfer Requests ({transfers.filter(t => t.status === 'Requested').length} Pending)
        </button>
      </div>

      {activeTab === 'allocations' ? (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Asset Name</th>
                <th>Assigned To</th>
                <th>Target Type</th>
                <th>Allocated Date</th>
                <th>Expected Return Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map(alloc => {
                // Determine if overdue
                const isOverdue = alloc.status === 'Active' && alloc.expectedReturnDate && new Date(alloc.expectedReturnDate) < new Date()
                const displayStatus = isOverdue ? 'Overdue' : alloc.status

                return (
                  <tr key={alloc.id}>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent-color)' }}>{alloc.assetTag}</td>
                    <td style={{ fontWeight: 500 }}>{alloc.assetName}</td>
                    <td>{alloc.employeeName || alloc.departmentName || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Shared</span>}</td>
                    <td>
                      <span className="badge badge-info">{alloc.targetType}</span>
                    </td>
                    <td>{alloc.allocatedDate}</td>
                    <td>{alloc.expectedReturnDate || <span style={{ color: 'var(--text-muted)' }}>Indefinite</span>}</td>
                    <td>
                      <span className={`badge ${
                        displayStatus === 'Returned' ? 'badge-success' :
                        displayStatus === 'Overdue' ? 'badge-danger' : 'badge-info'
                      }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {displayStatus === 'Overdue' && <ShieldAlert size={12} />}
                        {displayStatus}
                      </span>
                    </td>
                    <td>
                      {alloc.status === 'Active' ? (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => setSelectedAllocForReturn(alloc)}
                          disabled={actionLoadingId === alloc.id}
                        >
                          {actionLoadingId === alloc.id ? 'Processing...' : 'Return Asset'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                          Checked In
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {allocations.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No active allocations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Asset Name</th>
                <th>From Custody</th>
                <th>To Destination</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(req => (
                <tr key={req.id}>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--primary-blue)' }}>
                    {req.id.substring(0, 8)}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    <div>{req.assetName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{req.assetTag}</div>
                  </td>
                  <td>{req.fromUser}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 500 }}>{req.toUser}</span>
                    </div>
                  </td>
                  <td>{new Date(req.createdAt).toISOString().split('T')[0]}</td>
                  <td>
                    <span className={`badge ${
                      req.status === 'Approved' || req.status === 'Re-allocated' ? 'badge-success' :
                      req.status === 'Requested' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    {req.status === 'Requested' ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-primary"
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--badge-success-bg, #052e16)',
                            borderColor: 'var(--badge-success-border, #16a34a)',
                            color: 'var(--badge-success-text, #4ade80)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px'
                          }}
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleApprove(req.id)}
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--badge-danger-bg, #450a0a)',
                            borderColor: 'var(--badge-danger-border, #dc2626)',
                            color: 'var(--badge-danger-text, #fca5a5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px'
                          }}
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleReject(req.id)}
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={12} /> Complete
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No transfer requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedAllocForReturn && (
        <ReturnAssetModal
          isOpen={true}
          onClose={() => setSelectedAllocForReturn(null)}
          allocationId={selectedAllocForReturn.id}
          assetName={`${selectedAllocForReturn.assetName} (${selectedAllocForReturn.assetTag})`}
          onReturn={handleReturnSubmit}
        />
      )}
    </>
  )
}
