import { useEffect, useState } from "react"
import {
  Wrench,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  Clock,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react"
import { useMaintenance } from "../hooks/useMaintenance"
import { useAppContext } from "../contexts/AppContext"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Card } from "../components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet"
import type { MaintenanceRequest } from "../types"

export default function Maintenance() {
  const {
    requests,
    loading,
    error,
    technicians,
    fetchRequests,
    fetchTechnicians,
    approveRequest,
    rejectRequest,
    assignTech,
    startWork,
    resolveRequest,
  } = useMaintenance()

  const { userRoles, setShowMaintenanceModal, refetchKey } = useAppContext()

  const isManager = userRoles.includes("Asset Manager") || userRoles.includes("Admin")

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [priorityFilter, setPriorityFilter] = useState("All")

  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Sub-dialog states for workflow actions
  const [actionType, setActionType] = useState<"approve" | "reject" | "assign" | "resolve" | null>(null)
  const [actionInput, setActionInput] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests, refetchKey])

  useEffect(() => {
    if (isManager) fetchTechnicians()
  }, [isManager, fetchTechnicians])

  const handleOpenDetail = (req: MaintenanceRequest) => {
    setSelectedRequest(req)
    setDetailOpen(true)
    setActionType(null)
    setActionInput("")
    setActionError(null)
  }


  // Handle workflow transitions
  const handleApprove = async () => {
    if (!selectedRequest) return
    setActionLoading(true)
    setActionError(null)
    const success = await approveRequest(selectedRequest.id)
    setActionLoading(false)
    if (success) {
      setDetailOpen(false)
      fetchRequests()
    } else {
      setActionError("Failed to approve request.")
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !actionInput.trim()) return
    setActionLoading(true)
    setActionError(null)
    const success = await rejectRequest(selectedRequest.id, actionInput)
    setActionLoading(false)
    if (success) {
      setDetailOpen(false)
      fetchRequests()
    } else {
      setActionError("Failed to reject request.")
    }
  }

  const handleAssignTech = async () => {
    if (!selectedRequest || !actionInput.trim()) return
    setActionLoading(true)
    setActionError(null)
    // actionInput holds the technicianUserId (from dropdown value)
    const success = await assignTech(selectedRequest.id, actionInput)
    setActionLoading(false)
    if (success) {
      setDetailOpen(false)
      fetchRequests()
    } else {
      setActionError("Failed to assign technician.")
    }
  }

  const handleStartWork = async () => {
    if (!selectedRequest) return
    setActionLoading(true)
    setActionError(null)
    const success = await startWork(selectedRequest.id)
    setActionLoading(false)
    if (success) {
      setDetailOpen(false)
      fetchRequests()
    } else {
      setActionError("Failed to start work.")
    }
  }

  const handleResolve = async () => {
    if (!selectedRequest || !actionInput.trim()) return
    setActionLoading(true)
    setActionError(null)
    const success = await resolveRequest(selectedRequest.id, actionInput)
    setActionLoading(false)
    if (success) {
      setDetailOpen(false)
      fetchRequests()
    } else {
      setActionError("Failed to resolve request.")
    }
  }

  // Computed statistics
  const totalCount = requests.length
  const pendingCount = requests.filter((r) => r.status === "Pending").length
  const inProgressCount = requests.filter((r) => r.status === "In Progress" || r.status === "Technician Assigned").length
  const resolvedCount = requests.filter((r) => r.status === "Resolved").length

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.assetName?.toLowerCase().includes(search.toLowerCase()) ||
      req.assetTag?.toLowerCase().includes(search.toLowerCase()) ||
      req.id.toLowerCase().includes(search.toLowerCase()) ||
      req.issueDescription.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "All" ? true : req.status === statusFilter
    const matchesPriority = priorityFilter === "All" ? true : req.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  // Priority badge styling mapping
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20">{priority}</Badge>
      case "High":
        return <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20">{priority}</Badge>
      case "Medium":
        return <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{priority}</Badge>
      default:
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">{priority}</Badge>
    }
  }

  // Status badge styling mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Resolved":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{status}</Badge>
      case "Rejected":
        return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20">{status}</Badge>
      case "Pending":
        return <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20">{status}</Badge>
      case "Approved":
      case "Technician Assigned":
      case "In Progress":
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">{status}</Badge>
      default:
        return <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Call to Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Maintenance Hub</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track and manage hardware repairs and software license reinstatements.
          </p>
        </div>
        <button
          onClick={() => setShowMaintenanceModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-950/20 transition-all duration-200"
        >
          <Plus size={16} /> Raise Request
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total requests */}
        <Card className="relative overflow-hidden bg-white/[0.02] border-white/[0.06] rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500">
            <Wrench size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Requests</p>
          <h3 className="text-2xl font-bold text-white mt-2">{totalCount}</h3>
          <div className="w-full bg-blue-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </Card>

        {/* Pending Approval */}
        <Card className="relative overflow-hidden bg-white/[0.02] border-white/[0.06] rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-orange-500">
            <Clock size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approval</p>
          <h3 className="text-2xl font-bold text-white mt-2">{pendingCount}</h3>
          <div className="w-full bg-orange-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (pendingCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* In Progress */}
        <Card className="relative overflow-hidden bg-white/[0.02] border-white/[0.06] rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-400">
            <Loader2 size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</p>
          <h3 className="text-2xl font-bold text-white mt-2">{inProgressCount}</h3>
          <div className="w-full bg-blue-400/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-blue-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (inProgressCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* Resolved */}
        <Card className="relative overflow-hidden bg-white/[0.02] border-white/[0.06] rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
            <CheckCircle2 size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved</p>
          <h3 className="text-2xl font-bold text-white mt-2">{resolvedCount}</h3>
          <div className="w-full bg-emerald-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (resolvedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl">
        {/* Search */}
        <div className="flex flex-1 items-center gap-3 bg-white/[0.03] border border-white/[0.08] px-3.5 py-2 rounded-xl max-w-md">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-500"
            placeholder="Search by ID, asset name, tag, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tab buttons */}
          <div className="flex bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
            {["All", "Pending", "Approved", "Technician Assigned", "In Progress", "Resolved", "Rejected"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  statusFilter === status
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {status === "Technician Assigned" ? "Assigned" : status}
              </button>
            ))}
          </div>

          {/* Priority dropdown */}
          <select
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-semibold text-slate-300 outline-none cursor-pointer"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Requests table */}
      <div className="data-table-wrapper border border-white/[0.06] rounded-2xl overflow-hidden bg-white/[0.01] shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-orange-500" size={32} />
            <p className="text-sm font-medium">Loading maintenance requests...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
            <AlertTriangle className="text-red-400" size={36} />
            <h4 className="text-white font-semibold text-base">Error Loading Data</h4>
            <p className="text-slate-400 text-sm max-w-sm">{error}</p>
            <button className="btn btn-secondary mt-2" onClick={fetchRequests}>
              Try Again
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
            <Wrench size={36} className="opacity-40" />
            <p className="text-sm font-medium">No maintenance logs found.</p>
          </div>
        ) : (
          <Table className="data-table">
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Issue Description</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead>Date Logged</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => (
                <TableRow
                  key={req.id}
                  onClick={() => handleOpenDetail(req)}
                  className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <TableCell style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>
                    {req.id.substring(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{req.assetName}</span>
                      <span className="text-xs text-slate-400">{req.assetTag}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{req.issueDescription}</TableCell>
                  <TableCell>{req.raisedByName || "Staff"}</TableCell>
                  <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleOpenDetail(req)} className="btn btn-secondary py-1 px-3 text-xs">
                      View details
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Details Sheet / Drawer */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="bg-[#0b0c14] border-l border-white/[0.08] text-white overflow-y-auto w-full sm:max-w-xl p-6">
          <SheetHeader className="border-b border-white/[0.08] pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  Ticket ID: {selectedRequest?.id}
                </span>
                <SheetTitle className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                  <Wrench size={18} className="text-orange-500" />
                  {selectedRequest?.assetName}
                </SheetTitle>
              </div>
            </div>
          </SheetHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Status Header Strip */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div>
                  <p className="text-xs text-slate-400">Current Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Priority</p>
                  <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Date Raised</p>
                  <p className="text-sm font-semibold text-white mt-1">
                    {new Date(selectedRequest.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Photo Display if exists */}
              {selectedRequest.photoUrl && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Attachment Photo
                  </p>
                  <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/40 aspect-video flex items-center justify-center">
                    <img
                      src={selectedRequest.photoUrl}
                      alt="Asset damage"
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        // fallback if image link fails to load
                        ;(e.target as HTMLElement).style.display = "none"
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Issue & Asset Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Issue Description
                  </p>
                  <p className="text-sm text-slate-200 bg-white/[0.02] border border-white/[0.06] p-3 rounded-lg leading-relaxed">
                    {selectedRequest.issueDescription}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset Tag</p>
                    <p className="text-sm font-semibold text-white mt-1">{selectedRequest.assetTag}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Serial Number</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {selectedRequest.serialNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset Location</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {selectedRequest.location || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Raised By</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {selectedRequest.raisedByName || "Staff"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection / Technician / Resolution workflow info */}
              {selectedRequest.status === "Rejected" && selectedRequest.rejectionReason && (
                <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl space-y-1">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Rejection Reason</p>
                  <p className="text-sm text-red-200">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {selectedRequest.technicianName && (
                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Assigned Technician</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{selectedRequest.technicianName}</p>
                    </div>
                    {selectedRequest.technicianAssignedAt && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Assigned Date</p>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {new Date(selectedRequest.technicianAssignedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.status === "Resolved" && selectedRequest.resolutionNotes && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Resolution Notes
                    </span>
                    {selectedRequest.resolvedAt && (
                      <span className="text-xs text-slate-400">
                        {new Date(selectedRequest.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-emerald-200 leading-relaxed">{selectedRequest.resolutionNotes}</p>
                </div>
              )}

              {/* Workflow Actions Section */}
              {isManager && (
                <div className="border-t border-white/[0.08] pt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert size={16} className="text-orange-500" />
                    Manager Workflow Operations
                  </h4>

                  {actionError && (
                    <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-200 text-xs rounded-lg">
                      {actionError}
                    </div>
                  )}

                  {/* Sub-form / action trigger fields */}
                  {actionType === "reject" && (
                    <div className="space-y-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                      <label className="text-xs text-slate-300 font-semibold block">Rejection Reason *</label>
                      <textarea
                        required
                        rows={3}
                        className="w-full p-2.5 bg-[#12141c] border border-white/[0.1] rounded-lg text-sm text-white outline-none"
                        placeholder="Enter the reason for rejecting this request..."
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <button className="btn btn-secondary py-1 px-3 text-xs" onClick={() => setActionType(null)}>
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary py-1 px-3 text-xs bg-red-600 hover:bg-red-500"
                          onClick={handleReject}
                          disabled={actionLoading || !actionInput.trim()}
                        >
                          {actionLoading && <Loader2 size={12} className="animate-spin mr-1" />}
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}

                  {actionType === "assign" && (
                    <div className="space-y-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                      <label className="text-xs text-slate-300 font-semibold block">Select Technician *</label>
                      {technicians.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">No technicians found. Please seed the database.</p>
                      ) : (
                        <select
                          className="w-full p-2.5 bg-[#12141c] border border-white/[0.1] rounded-lg text-sm text-white outline-none"
                          value={actionInput}
                          onChange={(e) => setActionInput(e.target.value)}
                        >
                          <option value="">-- Choose a technician --</option>
                          {technicians.map((t) => (
                            <option key={t.userId} value={t.userId}>
                              {t.name || t.username} ({t.email})
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button className="btn btn-secondary py-1 px-3 text-xs" onClick={() => setActionType(null)}>
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary py-1 px-3 text-xs"
                          onClick={handleAssignTech}
                          disabled={actionLoading || !actionInput.trim()}
                        >
                          {actionLoading && <Loader2 size={12} className="animate-spin mr-1" />}
                          Assign
                        </button>
                      </div>
                    </div>
                  )}

                  {actionType === "resolve" && (
                    <div className="space-y-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                      <label className="text-xs text-slate-300 font-semibold block">Resolution Notes *</label>
                      <textarea
                        required
                        rows={3}
                        className="w-full p-2.5 bg-[#12141c] border border-white/[0.1] rounded-lg text-sm text-white outline-none"
                        placeholder="Enter repair details, cost or actions taken..."
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <button className="btn btn-secondary py-1 px-3 text-xs" onClick={() => setActionType(null)}>
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary py-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-500"
                          onClick={handleResolve}
                          disabled={actionLoading || !actionInput.trim()}
                        >
                          {actionLoading && <Loader2 size={12} className="animate-spin mr-1" />}
                          Resolve Ticket
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons depending on state */}
                  {!actionType && (
                    <div className="flex flex-wrap gap-3">
                      {selectedRequest.status === "Pending" && (
                        <>
                          <button
                            className="flex-1 btn btn-primary flex items-center justify-center gap-1.5"
                            onClick={handleApprove}
                            disabled={actionLoading}
                          >
                            {actionLoading && <Loader2 size={14} className="animate-spin" />}
                            Approve
                          </button>
                          <button
                            className="flex-1 btn btn-secondary flex items-center justify-center gap-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/5"
                            onClick={() => {
                              setActionType("reject")
                              setActionInput("")
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {selectedRequest.status === "Approved" && (
                        <>
                          <button
                            className="flex-1 btn btn-primary"
                            onClick={() => {
                              setActionType("assign")
                              setActionInput("")
                            }}
                          >
                            Assign Technician
                          </button>
                          <button
                            className="flex-1 btn btn-secondary border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5"
                            onClick={() => {
                              setActionType("resolve")
                              setActionInput("")
                            }}
                          >
                            Resolve Direct
                          </button>
                        </>
                      )}

                      {selectedRequest.status === "Technician Assigned" && (
                        <>
                          <button
                            className="flex-1 btn btn-primary"
                            onClick={handleStartWork}
                            disabled={actionLoading}
                          >
                            {actionLoading && <Loader2 size={14} className="animate-spin" />}
                            Start Work
                          </button>
                          <button
                            className="flex-1 btn btn-secondary"
                            onClick={() => {
                              setActionType("assign")
                              setActionInput("")
                            }}
                          >
                            Change Technician
                          </button>
                          <button
                            className="flex-1 btn btn-secondary border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5"
                            onClick={() => {
                              setActionType("resolve")
                              setActionInput("")
                            }}
                          >
                            Resolve
                          </button>
                        </>
                      )}

                      {selectedRequest.status === "In Progress" && (
                        <button
                          className="w-full btn btn-primary bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-1.5"
                          onClick={() => {
                            setActionType("resolve")
                            setActionInput("")
                          }}
                        >
                          Resolve & Mark Available
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
