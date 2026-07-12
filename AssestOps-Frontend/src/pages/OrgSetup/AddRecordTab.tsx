import { useState } from 'react'
import { useOrgStore } from '../../store/orgStore'

interface AddRecordTabProps {
  onSuccess: (tab: string) => void
}

export default function AddRecordTab({ onSuccess }: AddRecordTabProps) {
  const {
    departments,
    employees,
    loading,
    addDepartment,
    addCategory,
    addEmployee,
  } = useOrgStore()

  const [addType, setAddType] = useState<'Department' | 'Category' | 'Employee'>('Department')

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', headUserId: '', parentDepartmentId: '' })
  const [catForm, setCatForm] = useState({
    name: '',
    type: 'Hardware' as 'Hardware' | 'Software' | 'Facilities' | 'Furniture',
    description: '',
    warrantyPeriod: '',
    licenseType: '',
  })
  const [empForm, setEmpForm] = useState({ name: '', email: '', departmentId: '' })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (addType === 'Department') {
        if (!deptForm.name) return
        await addDepartment(
          deptForm.name,
          deptForm.headUserId || null,
          deptForm.parentDepartmentId || null
        )
        setDeptForm({ name: '', headUserId: '', parentDepartmentId: '' })
        onSuccess('Departments')
      } else if (addType === 'Category') {
        if (!catForm.name) return
        const customFieldsObj: Record<string, any> = { type: catForm.type }
        if (catForm.type === 'Hardware') {
          if (catForm.warrantyPeriod) customFieldsObj.warrantyPeriod = catForm.warrantyPeriod
        } else if (catForm.type === 'Software') {
          if (catForm.licenseType) customFieldsObj.licenseType = catForm.licenseType
        }
        await addCategory(catForm.name, catForm.type, catForm.description, JSON.stringify(customFieldsObj))
        setCatForm({ name: '', type: 'Hardware', description: '', warrantyPeriod: '', licenseType: '' })
        onSuccess('Categories')
      } else if (addType === 'Employee') {
        if (!empForm.name || !empForm.email) return
        await addEmployee(empForm.name, empForm.email, empForm.departmentId || null)
        setEmpForm({ name: '', email: '', departmentId: '' })
        onSuccess('Employee')
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed')
    }
  }

  return (
    <div className="activity-card" style={{ maxWidth: '600px' }}>
      <h3 style={{ color: '#fff', fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        Add New Record
      </h3>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['Department', 'Category', 'Employee'].map(type => (
          <button
            key={type}
            type="button"
            className="btn btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              backgroundColor: addType === type ? 'var(--accent-bg)' : 'transparent',
              borderColor: addType === type ? 'var(--accent-color)' : 'var(--border-color)',
              color: addType === type ? 'var(--accent-color)' : 'var(--text-secondary)',
            }}
            onClick={() => setAddType(type as any)}
          >
            {type}
          </button>
        ))}
      </div>

      <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {addType === 'Department' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Department Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Field ops (west)"
                style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Department Head</label>
              <select
                style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                value={deptForm.headUserId}
                onChange={(e) => setDeptForm({ ...deptForm, headUserId: e.target.value })}
              >
                <option value="">Select Head (Optional)</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.userId || ''}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Parent Department (Optional)</label>
              <select
                style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                value={deptForm.parentDepartmentId}
                onChange={(e) => setDeptForm({ ...deptForm, parentDepartmentId: e.target.value })}
              >
                <option value="">Select Parent Department (Optional)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {addType === 'Category' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Server Hardware"
                style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Type</label>
              <select
                style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                value={catForm.type}
                onChange={(e) => setCatForm({ ...catForm, type: e.target.value as any })}
              >
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Facilities">Facilities</option>
                <option value="Furniture">Furniture</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Description</label>
              <input
                type="text"
                placeholder="e.g. Enterprise servers and rack equipment"
                style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              />
            </div>

            {catForm.type === 'Hardware' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Warranty Period (months) - Optional
                </label>
                <input
                  type="text"
                  placeholder="e.g. 24"
                  style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                  value={catForm.warrantyPeriod}
                  onChange={(e) => setCatForm({ ...catForm, warrantyPeriod: e.target.value })}
                />
              </div>
            )}

            {catForm.type === 'Software' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  License Type - Optional
                </label>
                <input
                  type="text"
                  placeholder="e.g. SaaS Subscription / Perpetual"
                  style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                  value={catForm.licenseType}
                  onChange={(e) => setCatForm({ ...catForm, licenseType: e.target.value })}
                />
              </div>
            )}
          </>
        )}

        {addType === 'Employee' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Employee Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                value={empForm.name}
                onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Employee Email</label>
              <input
                type="email"
                required
                placeholder="e.g. john.doe@example.com"
                style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                value={empForm.email}
                onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Department</label>
              <select
                style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                value={empForm.departmentId}
                onChange={(e) => setEmpForm({ ...empForm, departmentId: e.target.value })}
              >
                <option value="">Select Department (Optional)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', marginTop: '12px' }} disabled={loading}>
          Add {addType}
        </button>
      </form>
    </div>
  )
}
