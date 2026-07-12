import React, { useState } from 'react'
import { X, RefreshCw } from 'lucide-react'

interface ReturnAssetModalProps {
  isOpen: boolean
  onClose: () => void
  allocationId: string
  assetName: string
  onReturn: (
    allocationId: string,
    notes: { returnConditionNotes?: string; condition?: string }
  ) => void
}

export default function ReturnAssetModal({
  isOpen,
  onClose,
  allocationId,
  assetName,
  onReturn,
}: ReturnAssetModalProps) {
  const [returnConditionNotes, setReturnConditionNotes] = useState('')
  const [condition, setCondition] = useState('Good')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onReturn(allocationId, { returnConditionNotes, condition })
    setReturnConditionNotes('')
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
    }}>
      <div className="activity-card" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} style={{ color: 'var(--accent-color)' }} />
            Check-in Return Asset
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Asset Name</p>
            <p style={{ fontWeight: 600, color: 'white', marginTop: '2px' }}>{assetName}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Current Condition</label>
            <select
              style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Return Condition Check-in Notes</label>
            <textarea
              required
              rows={3}
              placeholder="Describe the physical condition of the asset (e.g. Scratches on lid, keys working, bulb intact...)"
              style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none', resize: 'vertical' }}
              value={returnConditionNotes}
              onChange={(e) => setReturnConditionNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Process Return</button>
          </div>
        </form>
      </div>
    </div>
  )
}
