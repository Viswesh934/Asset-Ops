import { useState } from 'react'
import { X, Package } from 'lucide-react'

interface RegisterAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onRegister: (asset: {
    name: string
    category: 'Hardware' | 'Software' | 'Facilities' | 'Furniture'
    serialNo: string
    assignedTo: string
  }) => void
}

export default function RegisterAssetModal({ isOpen, onClose, onRegister }: RegisterAssetModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'Hardware' | 'Software' | 'Facilities' | 'Furniture'>('Hardware')
  const [serialNo, setSerialNo] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !serialNo) return
    onRegister({ name, category, serialNo, assignedTo })
    setName('')
    setCategory('Hardware')
    setSerialNo('')
    setAssignedTo('')
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
            <Package size={18} style={{ color: 'var(--accent-color)' }} />
            Register New Asset
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Asset Name</label>
            <input
              type="text"
              required
              placeholder="e.g. MacBook Pro M3 14-inch"
              style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Category</label>
            <select
              style={{ padding: '10px', background: '#12141c', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
            >
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Facilities">Facilities</option>
              <option value="Furniture">Furniture</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Serial / License Key</label>
            <input
              type="text"
              required
              placeholder="e.g. C02GL999XD3"
              style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none', fontFamily: 'var(--mono)' }}
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Assign To User (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Priya Shah"
              style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', outline: 'none' }}
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register Asset</button>
          </div>
        </form>
      </div>
    </div>
  )
}
