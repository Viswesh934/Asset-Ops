import { RefreshCw, ArrowRight } from 'lucide-react'
import type { TransferRequest } from '../types'

interface AllocationTransferProps {
  transfers: TransferRequest[]
  onOpenRequest: () => void
}

export default function AllocationTransfer({ transfers, onOpenRequest }: AllocationTransferProps) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Allocation & Transfer Requests</h1>
        <button className="btn btn-primary" onClick={onOpenRequest}>
          <RefreshCw size={16} /> Initiate Transfer
        </button>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Asset Name</th>
              <th>From Owner / Location</th>
              <th>To Owner / Destination</th>
              <th>Request Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map(req => (
              <tr key={req.id}>
                <td style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--primary-blue)' }}>{req.id}</td>
                <td style={{ fontWeight: 500 }}>{req.assetName}</td>
                <td>{req.fromUser}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                    <span>{req.toUser}</span>
                  </div>
                </td>
                <td>{req.date}</td>
                <td>
                  <span className={`badge ${
                    req.status === 'Approved' ? 'badge-success' :
                    req.status === 'Pending Approval' ? 'badge-warning' :
                    req.status === 'Pending Transfer' ? 'badge-info' : 'badge-danger'
                  }`}>
                    {req.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
