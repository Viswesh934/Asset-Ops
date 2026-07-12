import React, { useState, useEffect } from 'react'
import { X, RefreshCw, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react'
import { useAssets } from '../../hooks/useAssets'
import { useAllocationTransfer } from '../../hooks/useAllocationTransfer'

interface TransferRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function TransferRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: TransferRequestModalProps) {
  const { assets: assetList, fetchAssets } = useAssets()
  const {
    employees,
    departments,
    fetchEmployees,
    fetchDepartments,
    createAllocation,
    createTransferRequest,
  } = useAllocationTransfer()

  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [targetType, setTargetType] = useState<'Employee' | 'Department'>('Employee')
  const [targetEmployeeId, setTargetEmployeeId] = useState('')
  const [targetDepartmentId, setTargetDepartmentId] = useState('')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const assetItems = assetList.map(a => ({
    id: a.id,
    name: a.name,
    assetTag: a.assetTag,
    status: a.status,
    assignedTo: a.assignedTo,
  }))

  const selectedAsset = assetItems.find((a) => a.id === selectedAssetId) || assetItems[0]

  useEffect(() => {
    if (isOpen) {
      fetchAssets()
      fetchEmployees()
      fetchDepartments()
    }
  }, [isOpen, fetchAssets, fetchEmployees, fetchDepartments])

  useEffect(() => {
    if (assetItems.length > 0 && !selectedAssetId) {
      setSelectedAssetId(assetItems[0].id)
    }
  }, [assetItems, selectedAssetId])

  useEffect(() => {
    if (employees.length > 0 && !targetEmployeeId) {
      setTargetEmployeeId(employees[0].id)
    }
  }, [employees, targetEmployeeId])

  useEffect(() => {
    if (departments.length > 0 && !targetDepartmentId) {
      setTargetDepartmentId(departments[0].id)
    }
  }, [departments, targetDepartmentId])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssetId || submitting) return
    setSubmitting(true)
    try {
      if (selectedAsset.status === 'Available') {
        await createAllocation({
          assetId: selectedAssetId,
          targetType,
          employeeId: targetType === 'Employee' ? targetEmployeeId : null,
          departmentId: targetType === 'Department' ? targetDepartmentId : null,
          expectedReturnDate: expectedReturnDate || null,
        })
      } else if (selectedAsset.status === 'Allocated') {
        await createTransferRequest({
          assetId: selectedAssetId,
          requestedToEmployeeId: targetType === 'Employee' ? targetEmployeeId : null,
          requestedToDepartmentId: targetType === 'Department' ? targetDepartmentId : null,
        })
      }
      onSuccess?.()
      onClose()
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  const isActionable = selectedAsset && (selectedAsset.status === 'Available' || selectedAsset.status === 'Allocated')

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
    }}>
      <div className="activity-card" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} style={{ color: 'var(--accent-color)' }} />
            Allocate / Transfer Asset
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          {/* 1. SELECT ASSET */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Asset</label>
            <select
              style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
            >
              {assetItems.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.assetTag}) - [{a.status}]
                </option>
              ))}
            </select>
          </div>

          {/* 2. DYNAMIC STATE CARD */}
          {selectedAsset && (
            <div style={{
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '13px',
              backgroundColor: selectedAsset.status === 'Available' ? 'rgba(16, 185, 129, 0.1)' :
                selectedAsset.status === 'Allocated' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: selectedAsset.status === 'Available' ? 'rgba(16, 185, 129, 0.3)' :
                selectedAsset.status === 'Allocated' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              color: selectedAsset.status === 'Available' ? '#34d399' :
                selectedAsset.status === 'Allocated' ? '#fbbf24' : '#f87171',
            }}>
              {selectedAsset.status === 'Available' ? (
                <>
                  <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Direct Allocation Available!</strong>
                    <div style={{ marginTop: '2px', color: 'rgba(255,255,255,0.7)' }}>This asset is currently in the warehouse and can be allocated directly.</div>
                  </div>
                </>
              ) : selectedAsset.status === 'Allocated' ? (
                <>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Conflict Warning: Asset Already Held!</strong>
                    <div style={{ marginTop: '2px', color: 'rgba(255,255,255,0.7)' }}>
                      Currently held by <strong>{selectedAsset.assignedTo || 'another user'}</strong>.
                      Submitting will raise a <strong>Transfer Request</strong> to the new recipient.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <HelpCircle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Asset Status is {selectedAsset.status}</strong>
                    <div style={{ marginTop: '2px', color: 'rgba(255,255,255,0.7)' }}>This asset cannot be allocated or transferred in its current state.</div>
                  </div>
                </>
              )}
            </div>
          )}

          {isActionable && (
            <>
              {/* 3. ASSIGNMENT TARGET TYPE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Allocate / Transfer To</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'Employee'}
                      onChange={() => setTargetType('Employee')}
                    />
                    Employee Directory
                  </label>
                  <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'Department'}
                      onChange={() => setTargetType('Department')}
                    />
                    Department Setup
                  </label>
                </div>
              </div>

              {/* 4. CHOOSE RECIPIENT DROPDOWN */}
              {targetType === 'Employee' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Employee</label>
                  <select
                    style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.email}) {emp.departmentName ? `[${emp.departmentName}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Department</label>
                  <select
                    style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                    value={targetDepartmentId}
                    onChange={(e) => setTargetDepartmentId(e.target.value)}
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 5. EXPECTED RETURN DATE (ONLY FOR DIRECT ALLOCATIONS) */}
              {selectedAsset.status === 'Available' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Expected Return Date (Optional)</label>
                  <input
                    type="date"
                    style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {/* ACTIONS */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!isActionable || submitting}>
              {submitting ? 'Submitting...' : selectedAsset && selectedAsset.status === 'Available' ? 'Allocate Asset' : 'Submit Transfer Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
