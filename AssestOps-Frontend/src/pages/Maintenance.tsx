import { useAppContext } from '../contexts/AppContext'

export default function Maintenance() {
  const { maintenance, resolveMaintenance } = useAppContext()

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
                  {ticket.status !== 'Resolved' && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => resolveMaintenance(ticket.id)}
                    >
                      Mark Resolved
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {maintenance.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  No maintenance tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
