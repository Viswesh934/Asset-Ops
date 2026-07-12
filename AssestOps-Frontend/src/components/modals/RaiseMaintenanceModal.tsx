import { useState, useEffect, useRef } from "react"
import { X, Wrench, Loader2, Upload, ImageIcon } from "lucide-react"
import { useAssets } from "../../hooks/useAssets"
import { useMaintenance } from "../../hooks/useMaintenance"
import { uploadMaintenancePhoto } from "../../utils/upload"

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
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchAssets()
    }
  }, [isOpen, fetchAssets])

  if (!isOpen) return null

  const handleFileChange = (file: File | null) => {
    if (!file) return
    // Validate it's an image
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (JPG, PNG, WEBP, etc.)")
      return
    }
    setUploadError(null)
    setPhotoFile(file)
    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0] ?? null
    handleFileChange(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assetId || !issueDescription) return

    setUploadError(null)
    let resolvedPhotoUrl: string | null = null

    // Upload photo first if a file was selected
    if (photoFile) {
      try {
        setUploadProgress(0)
        resolvedPhotoUrl = await uploadMaintenancePhoto(assetId, photoFile, setUploadProgress)
      } catch (err: any) {
        setUploadError(err?.message ?? "Failed to upload photo. Please try again.")
        setUploadProgress(0)
        return
      }
    }

    const success = await raiseRequest({
      assetId,
      issueDescription,
      priority,
      photoUrl: resolvedPhotoUrl,
    })

    if (success) {
      setAssetId("")
      setIssueDescription("")
      setPriority("Medium")
      setPhotoFile(null)
      setPhotoPreview(null)
      setUploadProgress(0)
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

          {/* Photo Upload */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
              Photo / Attachment (Optional)
            </label>

            {/* Drag-and-drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "20px 16px",
                border: `2px dashed ${isDragging ? "var(--accent-color)" : photoFile ? "rgba(34,197,94,0.4)" : "var(--border-color)"}`,
                borderRadius: "8px",
                background: isDragging
                  ? "rgba(var(--accent-rgb, 99,102,241),0.06)"
                  : photoFile
                  ? "rgba(34,197,94,0.04)"
                  : "rgba(0,0,0,0.15)",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                textAlign: "center",
              }}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    maxHeight: "120px",
                    maxWidth: "100%",
                    borderRadius: "6px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <>
                  <div style={{ color: isDragging ? "var(--accent-color)" : "var(--text-muted)" }}>
                    {isDragging ? <Upload size={28} /> : <ImageIcon size={28} />}
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    {isDragging
                      ? "Drop image here"
                      : "Click to browse or drag & drop an image"}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", opacity: 0.6, margin: 0 }}>
                    JPG, PNG, WEBP — max 10 MB
                  </p>
                </>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />

            {/* File name + remove */}
            {photoFile && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "6px",
              }}>
                <span style={{ fontSize: "12px", color: "#4ade80", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                  {photoFile.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPhotoFile(null)
                    setPhotoPreview(null)
                    setUploadProgress(0)
                    setUploadError(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px", flexShrink: 0 }}
                  title="Remove photo"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Upload progress bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ width: "100%" }}>
                <div style={{
                  height: "4px",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${uploadProgress}%`,
                    background: "var(--accent-color, #6366f1)",
                    borderRadius: "4px",
                    transition: "width 0.3s ease",
                  }} />
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <p style={{ fontSize: "12px", color: "#fca5a5", margin: 0 }}>{uploadError}</p>
            )}
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
