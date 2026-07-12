import { useState, useEffect } from "react"
import { X, Wrench, Loader2 } from "lucide-react"
import { useAssets } from "../../hooks/useAssets"
import { useMaintenance } from "../../hooks/useMaintenance"

interface RaiseMaintenanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function RaiseMaintenanceModal({
  isOpen,
  onClose,
  onSuccess,
}: RaiseMaintenanceModalProps) {
  const { assets, fetchAssets } = useAssets()
  const { raiseRequest, loading, error } = useMaintenance()

  const [assetId, setAssetId] = useState("")
  const [issueDescription, setIssueDescription] = useState("")
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium")
  const [photoUrl, setPhotoUrl] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchAssets()
    }
  }, [isOpen, fetchAssets])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assetId || !issueDescription) return

    const success = await raiseRequest({
      assetId,
      issueDescription,
      priority,
      photoUrl: photoUrl || null,
    })

    if (success) {
      setAssetId("")
      setIssueDescription("")
      setPriority("Medium")
      setPhotoUrl("")
      onSuccess?.()
      onClose()
    }
  }

  // Filter out retired/disposed assets to request maintenance only on active ones
  const activeAssets = assets.filter(
    (a) => a.status !== "Retired" && a.status !== "Disposed"
  )

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
          maxWidth: "480px",
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
          <h2
            style={{
              fontSize: "18px",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Wrench size={18} style={{ color: "var(--accent-color)" }} />
            Raise Maintenance Request
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Select Asset */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
              Select Asset *
            </label>
            <select
              required
              style={{
                padding: "10px",
                background: "#12141c",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                color: "white",
                outline: "none",
                fontSize: "13px",
              }}
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
            >
              <option value="">-- Choose Asset --</option>
              {activeAssets.map((ast) => (
                <option key={ast.id} value={ast.id}>
                  {ast.assetTag} - {ast.name} ({ast.status})
                </option>
              ))}
            </select>
          </div>

          {/* Issue Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
              Issue Description *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the issue in detail..."
              style={{
                padding: "10px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                color: "white",
                outline: "none",
                fontSize: "13px",
                resize: "none",
              }}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
            />
          </div>

          {/* Priority */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
              Priority *
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              {(["Low", "Medium", "High", "Critical"] as const).map((p) => (
                <label
                  key={p}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 12px",
                    background: priority === p ? "var(--accent-bg)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${priority === p ? "var(--accent-color)" : "var(--border-color)"}`,
                    borderRadius: "6px",
                    color: priority === p ? "white" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    textAlign: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={priority === p}
                    onChange={() => setPriority(p)}
                    style={{ display: "none" }}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          {/* Photo URL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
              Photo URL (Optional)
            </label>
            <input
              type="url"
              placeholder="e.g. https://images.unsplash.com/..."
              style={{
                padding: "10px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                color: "white",
                outline: "none",
                fontSize: "13px",
              }}
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "12px",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
              disabled={loading}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
