import { useState, useEffect } from "react"
import { X, Package, Loader2 } from "lucide-react"
import { useAssets } from "../../hooks/useAssets"

interface RegisterAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function RegisterAssetModal({
  isOpen,
  onClose,
  onSuccess,
}: RegisterAssetModalProps) {
  const { categories, fetchCategories, registerAsset, loading, error } = useAssets()
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [acquisitionDate, setAcquisitionDate] = useState("")
  const [acquisitionCost, setAcquisitionCost] = useState("")
  const [condition, setCondition] = useState("Good")
  const [location, setLocation] = useState("")
  const [isBookable, setIsBookable] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen, fetchCategories])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !categoryId) return

    const success = await registerAsset({
      name,
      categoryId,
      serialNumber: serialNumber || undefined,
      acquisitionDate: acquisitionDate || undefined,
      acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : undefined,
      condition,
      location: location || undefined,
      isBookable,
    })

    if (success) {
      setName("")
      setCategoryId("")
      setSerialNumber("")
      setAcquisitionDate("")
      setAcquisitionCost("")
      setCondition("Good")
      setLocation("")
      setIsBookable(false)
      onSuccess?.()
      onClose()
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: "16px",
      }}
    >
      <div
        className="activity-card"
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "24px",
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          backgroundColor: "#0b0c14",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "12px",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ fontSize: "18px", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
            <Package size={18} style={{ color: "var(--accent-color)" }} />
            Register New Asset
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 12px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "6px",
              color: "#ef4444",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Asset Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Asset Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dell Latitude 7440"
              style={{
                padding: "9px 12px",
                background: "rgba(0,0,0,0.25)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                color: "white",
                outline: "none",
                fontSize: "14px",
              }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Category *</label>
            <select
              required
              style={{
                padding: "9px 12px",
                background: "#0f101a",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                color: "white",
                outline: "none",
                fontSize: "14px",
              }}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Serial Number */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Serial Number</label>
              <input
                type="text"
                placeholder="e.g. SN-9821-X"
                style={{
                  padding: "9px 12px",
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "white",
                  outline: "none",
                  fontSize: "14px",
                }}
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>

            {/* Condition */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Condition</label>
              <select
                style={{
                  padding: "9px 12px",
                  background: "#0f101a",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "white",
                  outline: "none",
                  fontSize: "14px",
                }}
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
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Acquisition Date */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Acquisition Date</label>
              <input
                type="date"
                style={{
                  padding: "9px 12px",
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "white",
                  outline: "none",
                  fontSize: "14px",
                }}
                value={acquisitionDate}
                onChange={(e) => setAcquisitionDate(e.target.value)}
              />
            </div>

            {/* Acquisition Cost */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Cost ($ USD)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 1299.99"
                style={{
                  padding: "9px 12px",
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "white",
                  outline: "none",
                  fontSize: "14px",
                }}
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Location</label>
            <input
              type="text"
              placeholder="e.g. San Francisco HQ - 4th Floor"
              style={{
                padding: "9px 12px",
                background: "rgba(0,0,0,0.25)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                color: "white",
                outline: "none",
                fontSize: "14px",
              }}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Shared / Bookable Flag */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <input
              type="checkbox"
              id="isBookable"
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
              checked={isBookable}
              onChange={(e) => setIsBookable(e.target.checked)}
            />
            <label htmlFor="isBookable" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
              Mark this asset as bookable / shared resource
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Registering..." : "Register Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
