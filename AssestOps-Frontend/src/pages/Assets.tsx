import { useEffect, useState, useRef } from "react"
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  User,
  Clock,
  Wrench,
  AlertCircle,
  Package,
  Upload,
  File,
  Paperclip,
} from "lucide-react"
import { useAssets } from "../hooks/useAssets"
import RegisterAssetModal from "../components/modals/RegisterAssetModal"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { uploadAssetFile } from "../utils/upload"

export default function Assets() {
  const {
    loading,
    error,
    assets,
    categories,
    selectedAssetDetail,
    fetchAssets,
    fetchCategories,
    fetchAssetDetails,
    registerAsset,
  } = useAssets()

  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTab, setDetailTab] = useState<"allocations" | "maintenance" | "attachments">("allocations")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAssets()
    fetchCategories()
  }, [fetchAssets, fetchCategories])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    fetchAssets({ search: val, category: selectedCategory, status: selectedStatus })
  }

  const handleCategoryFilter = (cat: string) => {
    setSelectedCategory(cat)
    fetchAssets({ search, category: cat, status: selectedStatus })
  }

  const handleStatusFilter = (stat: string) => {
    setSelectedStatus(stat)
    fetchAssets({ search, category: selectedCategory, status: stat })
  }

  const handleOpenDetail = async (id: string) => {
    await fetchAssetDetails(id)
    setDetailOpen(true)
    setDetailTab("allocations")
  }

  const handleRegisterSubmit = async (assetData: any) => {
    const success = await registerAsset(assetData)
    if (success) {
      fetchAssets({ search, category: selectedCategory, status: selectedStatus })
    }
    return success
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedAssetDetail) return
    setUploading(true)
    try {
      await uploadAssetFile(selectedAssetDetail.id, file)
      await fetchAssetDetails(selectedAssetDetail.id)
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Calculate statistics for visual cards
  const totalCount = assets.length
  const availableCount = assets.filter((a) => a.status === "Available").length
  const allocatedCount = assets.filter((a) => a.status === "Allocated").length
  const maintenanceCount = assets.filter((a) => a.status === "Under Maintenance").length

  return (
    <div className="space-y-6">
      {/* Page Title & Register CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Assets Directory</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and track your company inventory and allocations.</p>
        </div>
        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-950/20 transition-all duration-200"
        >
          <Plus size={16} /> Register Asset
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="relative overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500">
            <Package size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Assets</p>
          <h3 className="text-2xl font-bold text-white mt-2">{totalCount}</h3>
          <div className="w-full bg-blue-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Available Assets */}
        <div className="relative overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
            <Activity size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available</p>
          <h3 className="text-2xl font-bold text-white mt-2">{availableCount}</h3>
          <div className="w-full bg-emerald-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (availableCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Allocated Assets */}
        <div className="relative overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-orange-500">
            <User size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Allocated</p>
          <h3 className="text-2xl font-bold text-white mt-2">{allocatedCount}</h3>
          <div className="w-full bg-orange-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (allocatedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Maintenance Assets */}
        <div className="relative overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500">
            <Wrench size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Maintenance</p>
          <h3 className="text-2xl font-bold text-white mt-2">{maintenanceCount}</h3>
          <div className="w-full bg-rose-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (maintenanceCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl">
        <div className="flex flex-1 items-center gap-3 bg-white/[0.03] border border-white/[0.08] px-3.5 py-2 rounded-xl max-w-md">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-500"
            placeholder="Search by tag, name or serial..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter buttons */}
          <div className="flex bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
            {["All", "Electronics", "Furniture", "Vehicles"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${selectedCategory === cat ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status select filter */}
          <select
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-semibold text-slate-300 outline-none cursor-pointer"
            value={selectedStatus}
            onChange={(e) => handleStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Lost">Lost</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Asset Table Listing */}
      <div className="bg-white/[0.01] border border-white/[0.05] rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
        {loading && assets.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Loading asset directory...
          </div>
        ) : assets.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <AlertCircle size={28} className="mx-auto mb-3 text-slate-600" />
            No assets found matching your criteria.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-slate-400 font-semibold h-12">Asset Tag</TableHead>
                <TableHead className="text-slate-400 font-semibold h-12">Name</TableHead>
                <TableHead className="text-slate-400 font-semibold h-12">Category</TableHead>
                <TableHead className="text-slate-400 font-semibold h-12">Status</TableHead>
                <TableHead className="text-slate-400 font-semibold h-12">Location</TableHead>
                <TableHead className="text-slate-400 font-semibold h-12 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((ast) => (
                <TableRow key={ast.id} className="border-white/[0.04] hover:bg-white/[0.01]">
                  <TableCell className="font-mono font-bold text-orange-500 py-3.5">{ast.assetTag}</TableCell>
                  <TableCell className="font-medium text-white py-3.5">{ast.name}</TableCell>
                  <TableCell className="py-3.5">
                    <Badge variant="secondary" className="bg-white/[0.05] border-white/[0.05] text-slate-300">
                      {ast.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Badge
                      className={`${ast.status === "Available"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : ast.status === "Allocated"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : ast.status === "Under Maintenance"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}
                    >
                      {ast.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 py-3.5">{ast.location || "N/A"}</TableCell>
                  <TableCell className="text-right py-3.5">
                    <button
                      onClick={() => handleOpenDetail(ast.id)}
                      className="px-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-lg text-xs font-semibold transition-all duration-200"
                    >
                      View Details
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Slide-out Asset Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-[480px] bg-[#07080f] border-l border-white/[0.08] text-slate-200 p-6 overflow-y-auto">
          {selectedAssetDetail && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-orange-500 font-bold">{selectedAssetDetail.assetTag}</span>
                  <Badge
                    className={`${selectedAssetDetail.status === "Available"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : selectedAssetDetail.status === "Allocated"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                  >
                    {selectedAssetDetail.status}
                  </Badge>
                </div>
                <SheetTitle className="text-2xl font-bold text-white">{selectedAssetDetail.name}</SheetTitle>
              </SheetHeader>

              {/* Asset Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-sm">
                <div>
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="font-semibold text-slate-200 mt-1">{selectedAssetDetail.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Condition</p>
                  <p className="font-semibold text-slate-200 mt-1">{selectedAssetDetail.condition}</p>
                </div>
                <div className="col-span-2 border-t border-white/[0.04] pt-3">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin size={12} /> Location
                  </p>
                  <p className="font-semibold text-slate-200 mt-1">{selectedAssetDetail.location || "Unspecified"}</p>
                </div>
                <div className="border-t border-white/[0.04] pt-3">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar size={12} /> Acquired Date
                  </p>
                  <p className="font-semibold text-slate-200 mt-1">
                    {selectedAssetDetail.acquisitionDate
                      ? new Date(selectedAssetDetail.acquisitionDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="border-t border-white/[0.04] pt-3">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <DollarSign size={12} /> Value
                  </p>
                  <p className="font-semibold text-slate-200 mt-1">
                    {selectedAssetDetail.acquisitionCost ? `$${selectedAssetDetail.acquisitionCost}` : "N/A"}
                  </p>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex bg-white/[0.04] border border-white/[0.08] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDetailTab("allocations")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${detailTab === "allocations" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  <User size={13} /> Allocation History
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab("maintenance")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${detailTab === "maintenance" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  <Wrench size={13} /> Maintenance
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab("attachments")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${detailTab === "attachments" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  <Paperclip size={13} /> Attachments
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-4 min-h-[160px]">
                {detailTab === "allocations" && (
                  <div className="space-y-3">
                    {selectedAssetDetail.history?.length === 0 || !selectedAssetDetail.history ? (
                      <p className="text-center text-sm text-slate-500 py-8">No allocation records for this asset.</p>
                    ) : (
                      selectedAssetDetail.history.map((alloc: any) => (
                        <div key={alloc.id} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {alloc.targetType === "Employee" ? "Employee Allocation" : "Department Allocation"}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <Clock size={11} /> {new Date(alloc.allocatedDate).toLocaleDateString()}
                              {alloc.actualReturnDate && ` - ${new Date(alloc.actualReturnDate).toLocaleDateString()}`}
                            </p>
                          </div>
                          <Badge
                            className={`${alloc.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-500/10 text-slate-400"
                              }`}
                          >
                            {alloc.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === "maintenance" && (
                  <div className="space-y-3">
                    {(!selectedAssetDetail.maintenanceHistory || selectedAssetDetail.maintenanceHistory.length === 0) ? (
                      <p className="text-center text-sm text-slate-500 py-8">No maintenance tickets logged.</p>
                    ) : (
                      selectedAssetDetail.maintenanceHistory.map((ticket) => (
                        <div key={ticket.id} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">{ticket.issueDescription}</span>
                            <Badge
                              className={`${ticket.status === "Resolved"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-orange-500/10 text-orange-400"
                                }`}
                            >
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Priority: {ticket.priority}</p>
                          {ticket.resolutionNotes && (
                            <p className="text-xs text-slate-400 mt-2 bg-black/20 p-2 rounded-lg border border-white/[0.04]">
                              Resolution: {ticket.resolutionNotes}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === "attachments" && (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-3 border-2 border-dashed border-white/[0.1] rounded-xl text-sm text-slate-400 hover:border-orange-500/40 hover:text-orange-400 transition-all flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Upload Photo or Document
                        </>
                      )}
                    </button>
                    {(!selectedAssetDetail.attachments || selectedAssetDetail.attachments.length === 0) ? (
                      <p className="text-center text-sm text-slate-500 py-4">No files uploaded yet.</p>
                    ) : (
                      selectedAssetDetail.attachments.map((att) => (
                        <div key={att.id} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <File size={16} className="text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-white">{att.fileName || "Unnamed file"}</p>
                              <p className="text-xs text-slate-500">{att.fileType || "Unknown type"}</p>
                            </div>
                          </div>
                          {att.signedUrl && (
                            <a
                              href={att.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-lg text-xs font-semibold transition-all"
                            >
                              View
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Register Asset Dialog */}
      <RegisterAssetModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        categories={categories}
        onRegister={handleRegisterSubmit}
        loading={loading}
        error={error}
      />
    </div>
  )
}
