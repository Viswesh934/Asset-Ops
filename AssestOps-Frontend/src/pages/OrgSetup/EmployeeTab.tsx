import { useState } from 'react'
import { useOrgStore } from '../../store/orgStore'
import { X, Shield, User, Loader2, Edit2 } from 'lucide-react'

export default function EmployeeTab() {
  const { employees, token, fetchAll } = useOrgStore()
  const [selectedEmp, setSelectedEmp] = useState<typeof employees[0] | null>(null)
  const [newRole, setNewRole] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRowClick = (emp: typeof employees[0]) => {
    if (emp.role === 'Admin') return
    setSelectedEmp(emp)
    setNewRole(emp.role || 'Employee')
    setError(null)
  }

  const handleSaveRole = async () => {
    if (!selectedEmp) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/employees/${selectedEmp.userId}/role`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update role')
      }

      await fetchAll()
      setSelectedEmp(null)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="data-table-wrapper" style={{ position: 'relative' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Department</th>
            <th>Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                No employees found.
              </td>
            </tr>
          ) : (
            employees.map(emp => {
              const isEditable = emp.role !== 'Admin'
              return (
                <tr
                  key={emp.id}
                  onClick={() => isEditable && handleRowClick(emp)}
                  style={{
                    cursor: isEditable ? 'pointer' : 'default',
                    transition: 'background-color 0.2s',
                  }}
                  className={isEditable ? 'hover:bg-white/[0.02]' : ''}
                >
                  <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} className="text-slate-400" />
                      {emp.name}
                    </div>
                  </td>
                  <td>{emp.department}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: emp.role === 'Admin' ? '#f59e0b' : '#38bdf8',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    >
                      {emp.role === 'Admin' && <Shield size={12} />}
                      {emp.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: '9999px', padding: '4px 14px' }}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    {isEditable ? (
                      <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Edit2 size={12} /> Assign Role
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        System Admin
                      </span>
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {/* Role Assignment Modal */}
      {selectedEmp && (
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
          onClick={() => setSelectedEmp(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              backgroundColor: '#0c0d16',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedEmp(null)}
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

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} className="text-orange-500" />
              Assign Role
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Modify role for <strong style={{ color: 'white', textTransform: 'capitalize' }}>{selectedEmp.name}</strong> ({selectedEmp.email})
            </p>

            {error && (
              <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                style={{
                  padding: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '14px',
                }}
              >
                {['Employee', 'Asset Manager', 'Department Head', 'Technician'].map(role => (
                  <option key={role} value={role} style={{ backgroundColor: '#0c0d16', color: 'white' }}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedEmp(null)}
                disabled={saving}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveRole}
                disabled={saving}
                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
