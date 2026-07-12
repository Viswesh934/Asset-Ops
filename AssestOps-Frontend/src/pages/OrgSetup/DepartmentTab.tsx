import { useOrgStore } from '../../store/orgStore'

export default function DepartmentTab() {
  const { departments } = useOrgStore()

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Head</th>
            <th>Parent Dept</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {departments.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                No departments found.
              </td>
            </tr>
          ) : (
            departments.map(dept => (
              <tr key={dept.id}>
                <td style={{ fontWeight: 600 }}>{dept.name}</td>
                <td style={{ textTransform: 'capitalize' }}>{dept.head}</td>
                <td>{dept.parentDept}</td>
                <td>
                  <span className={`badge ${dept.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: '9999px', padding: '4px 14px' }}>
                    {dept.status}
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
