import { useState } from 'react'
import { X, RefreshCw } from 'lucide-react'
import type { Asset } from '../../types'

interface TransferRequestModalProps {
  isOpen: boolean
  onClose: () => void
  assets: Asset[]
  onRequestTransfer: (req: {
    assetName: string
    fromUser: string
    toUser: string
  }) => void
}

export default function TransferRequestModal({ isOpen, onClose, assets, onRequestTransfer }: TransferRequestModalProps) {
  const [assetName, setAssetName] = useState(assets[0] ? `${assets[0].name} (${assets[0].id})` : '')
  const [fromUser, setFromUser] = useState('')
  const [toUser, setToUser] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromUser || !toUser) return
    const actualAsset = assetName || (assets[0] ? `${assets[0].name} (${assets[0].id})` : '')
    onRequestTransfer({ assetName: actualAsset, fromUser, toUser })
    setFromUser('')
    setToUser('')
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
    }}>
      <div className="activity-card" style={{ width: '100%', maxWidth: '460px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} style={{ color: 'var(--accent-color)' }} />
            Raise Asset Transfer Request
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Asset to Transfer</label>
            <select
              style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
            >
              {assets.map(a => (
                <option key={a.id} value={`${a.name} (${a.id})`}>{a.name} ({a.id}) - [{a.status}]</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Current Owner / Location</label>
            <input
              type="text"
              required
              placeholder="e.g. Mark Zuckerberg"
              style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={fromUser}
              onChange={(e) => setFromUser(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>New Destination Owner / Department</label>
            <input
              type="text"
              required
              placeholder="e.g. David Lightman"
              style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Transfer Request</button>
          </div>
        </form>
      </div>
    </div>
  )
}
