import { useState } from 'react'
import { useOrgStore } from '../../store/orgStore'
import { X, User, Edit2, Loader2, Award } from 'lucide-react'

export default function DepartmentTab() {
  const { departments, employees, token, fetchAll } = useOrgStore()
  const [selectedDept, setSelectedDept] = useState<typeof departments[0] | null>(null)
  const [name, setName] = useState('')
  const [headUserId, setHeadUserId] = useState('')
  const [parentDepartmentId, setParentDepartmentId] = useState('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEditClick = (dept: typeof departments[0]) => {
    setSelectedDept(dept)
    setName(dept.name)
    setHeadUserId(dept.headUserId || '')
    setParentDepartmentId(dept.parentDepartmentId || '')
    setStatus(dept.status)
    setError(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDept) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/departments/${selectedDept.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            headUserId: headUserId || null,
            parentDepartmentId: parentDepartmentId || null,
            status,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update department')
      }

      await fetchAll()
      setSelectedDept(null)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  // Filter out the current department from the parent list to avoid self-reference hierarchy
  const availableParentDepts = departments.filter(d => d.id !== selectedDept?.id)

  return (
    <div className="data-table-wrapper" style={{ position: 'relative' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Head</th>
            <th>Parent Dept</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {departments.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                No departments found.
              </td>
            </tr>
          ) : (
            departments.map(dept => (
              <tr
                key={dept.id}
                onClick={() => handleEditClick(dept)}
                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                className="hover:bg-white/[0.02]"
              >
                <td style={{ fontWeight: 600 }}>{dept.name}</td>
                <td style={{ textTransform: 'capitalize' }}>{dept.head}</td>
                <td>{dept.parentDept}</td>
                <td>
                  <span className={`badge ${dept.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: '9999px', padding: '4px 14px' }}>
                    {dept.status}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Edit2 size={12} /> Edit
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Edit Department Modal */}
      {selectedDept && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setSelectedDept(null)}
        >
          <form
            onSubmit={handleSave}
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: '#0c0d16',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedDept(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '4px' }}>
              <Award size={18} className="text-orange-500" />
              Edit Department
            </h3>

            {error && (
              <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#fca5a5', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Department Name</label>
              <input
                type="text"
                required
                style={{
                  padding: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '14px',
                }}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Department Head</label>
              <select
                style={{
                  padding: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '14px',
                }}
                value={headUserId}
                onChange={e => setHeadUserId(e.target.value)}
              >
                <option value="" style={{ backgroundColor: '#0c0d16' }}>Select Head (Optional)</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.userId || ''} style={{ backgroundColor: '#0c0d16' }}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Parent Department (Optional)</label>
              <select
                style={{
                  padding: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '14px',
                }}
                value={parentDepartmentId}
                onChange={e => setParentDepartmentId(e.target.value)}
              >
                <option value="" style={{ backgroundColor: '#0c0d16' }}>Select Parent Department (Optional)</option>
                {availableParentDepts.map(d => (
                  <option key={d.id} value={d.id} style={{ backgroundColor: '#0c0d16' }}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</label>
              <select
                style={{
                  padding: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '14px',
                }}
                value={status}
                onChange={e => setStatus(e.target.value as any)}
              >
                <option value="Active" style={{ backgroundColor: '#0c0d16' }}>Active</option>
                <option value="Inactive" style={{ backgroundColor: '#0c0d16' }}>Inactive</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedDept(null)}
                disabled={saving}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
