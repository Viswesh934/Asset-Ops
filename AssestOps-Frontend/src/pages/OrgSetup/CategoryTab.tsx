import { useOrgStore } from '../../store/orgStore'

export default function CategoryTab() {
  const { categories } = useOrgStore()

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Category Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                No categories found.
              </td>
            </tr>
          ) : (
            categories.map(cat => (
              <tr key={cat.id}>
                <td style={{ fontWeight: 600 }}>{cat.name}</td>
                <td><span className="badge badge-info">{cat.type}</span></td>
                <td style={{ color: 'var(--text-secondary)' }}>{cat.description}</td>
                <td>
                  <span className={`badge ${cat.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: '9999px', padding: '4px 14px' }}>
                    {cat.status}
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
