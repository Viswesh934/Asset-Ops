import { useOrgStore } from '../../store/orgStore'

export default function EmployeeTab() {
  const { employees } = useOrgStore()

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Department</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                No employees found.
              </td>
            </tr>
          ) : (
            employees.map(emp => (
              <tr key={emp.id}>
                <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{emp.name}</td>
                <td>{emp.department}</td>
                <td>{emp.role}</td>
                <td>
                  <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: '9999px', padding: '4px 14px' }}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
