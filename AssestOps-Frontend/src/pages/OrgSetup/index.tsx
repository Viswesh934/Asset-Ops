import { useState, useEffect } from 'react'
import { useOrgStore } from '../../store/orgStore'
import DepartmentTab from './DepartmentTab'
import CategoryTab from './CategoryTab'
import EmployeeTab from './EmployeeTab'
import AddRecordTab from './AddRecordTab'

export default function OrgSetup() {
  const [activeSubTab, setActiveSubTab] = useState<string>('Departments')
  const { loading, error, initialize } = useOrgStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <>
      <h1 className="page-title" style={{ marginBottom: '20px' }}>Organization Setup</h1>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgb(239, 68, 68)', borderRadius: '6px', color: '#fca5a5', marginBottom: '20px', fontSize: '14px' }}>
          Error: {error}
        </div>
      )}
      
      {loading && (
        <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgb(59, 130, 246)', borderRadius: '6px', color: '#93c5fd', marginBottom: '20px', fontSize: '14px' }}>
          Processing and loading latest org state...
        </div>
      )}

      {/* CAPSULE SUB-TABS */}
      <div className="subtabs-container">
        {['Departments', 'Categories', 'Employee', '+ Add'].map(tab => (
          <button
            key={tab}
            className={`subtab-item ${activeSubTab === tab ? 'active' : ''}`}
            onClick={() => setActiveSubTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      {activeSubTab === 'Departments' && <DepartmentTab />}
      {activeSubTab === 'Categories' && <CategoryTab />}
      {activeSubTab === 'Employee' && <EmployeeTab />}
      {activeSubTab === '+ Add' && <AddRecordTab onSuccess={setActiveSubTab} />}

      {/* VIEW SEPARATOR LINE & FOOTER NOTE */}
      <hr className="divider-line" />
      
      <div className="footer-note">
        Editing a department here also drives the picklist in Screen 4 & 5
      </div>
    </>
  )
}
