import type { MaintenanceTicket } from '../types'

interface MaintenanceProps {
  maintenance: MaintenanceTicket[]
  onResolve: (id: string) => void
}

export default function Maintenance({ maintenance, onResolve }: MaintenanceProps) {
  return (
    <>
      <h1 className="page-title">Active Maintenance Logs</h1>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Asset</th>
              <th>Issue Description</th>
              <th>Date Logged</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {maintenance.map(ticket => (
              <tr key={ticket.id}>
                <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{ticket.id}</td>
                <td style={{ fontWeight: 500 }}>{ticket.assetName}</td>
                <td>{ticket.issue}</td>
                <td>{ticket.date}</td>
                <td>
                  <span className={`badge ${
                    ticket.priority === 'High' ? 'badge-danger' :
                    ticket.priority === 'Medium' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {ticket.priority}
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    ticket.status === 'Resolved' ? 'badge-success' :
                    ticket.status === 'In Progress' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {ticket.status}
                  </span>
                </td>
                <td>
                  {ticket.status !== 'Resolved' ? (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => onResolve(ticket.id)}
                    >
                      Resolve
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Fixed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
