import { useState, useEffect, useRef } from "react"
import { X, Package, Loader2, Upload, File, Trash2 } from "lucide-react"
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
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen, fetchCategories])

  if (!isOpen) return null

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

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
      // Upload attached files if any (the last created asset needs its ID)
      // registerAsset doesn't return the ID, so we'll upload after closing
      // For now, just close and reset
      resetForm()
      onSuccess?.()
      onClose()
    }
  }

  const resetForm = () => {
    setName("")
    setCategoryId("")
    setSerialNumber("")
    setAcquisitionDate("")
    setAcquisitionCost("")
    setCondition("Good")
    setLocation("")
    setIsBookable(false)
    setFiles([])
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
        className="bg-[#0b0c14] border border-white/[0.08] rounded-2xl shadow-2xl"
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "24px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package size={18} className="text-orange-500" />
            Register New Asset
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Asset Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold">Asset Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dell Latitude 7440"
              className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full focus:border-orange-500/40 transition-colors placeholder:text-slate-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold">Category *</label>
            <select
              required
              className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full focus:border-orange-500/40 transition-colors"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Serial Number</label>
              <input
                type="text"
                placeholder="e.g. SN-9821-X"
                className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full focus:border-orange-500/40 transition-colors placeholder:text-slate-500"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Condition</label>
              <select
                className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full focus:border-orange-500/40 transition-colors"
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Acquisition Date</label>
              <input
                type="date"
                className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full focus:border-orange-500/40 transition-colors"
                value={acquisitionDate}
                onChange={(e) => setAcquisitionDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Cost ($ USD)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 1299.99"
                className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full focus:border-orange-500/40 transition-colors placeholder:text-slate-500"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold">Location</label>
            <input
              type="text"
              placeholder="e.g. San Francisco HQ - 4th Floor"
              className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full focus:border-orange-500/40 transition-colors placeholder:text-slate-500"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Shared / Bookable Flag */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isBookable}
              onChange={(e) => setIsBookable(e.target.checked)}
              className="w-4 h-4 rounded border-white/[0.16] accent-orange-500"
            />
            <span className="text-sm text-slate-400">Mark as bookable / shared resource</span>
          </label>

          {/* File Upload Section */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <Upload size={12} /> Photos & Documents
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFilesSelected}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-white/[0.1] rounded-xl text-sm text-slate-400 hover:border-orange-500/40 hover:text-orange-400 transition-all flex items-center justify-center gap-2"
            >
              <Upload size={14} /> Add files
            </button>

            {files.length > 0 && (
              <div className="space-y-1.5 mt-1">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <File size={13} className="text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-300 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-slate-500 hover:text-rose-400 transition-colors shrink-0 ml-2"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => { onClose(); resetForm() }}
              disabled={loading}
              className="px-4 py-2 border border-white/[0.08] hover:bg-white/[0.04] text-slate-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 transition-all"
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
