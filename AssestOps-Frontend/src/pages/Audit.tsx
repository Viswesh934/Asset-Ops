import { useEffect, useState, useCallback } from "react"
import {
  ClipboardCheck,
  Plus,
  Search,
  Calendar,
  MapPin,
  AlertTriangle,
  FolderDot,
  Check,
  X,
  Lock,
} from "lucide-react"
import { useAudits } from "../hooks/useAudits"
import { api } from "../utils/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"

export default function Audit() {
  const {
    loading,
    error,
    cycles,
    items,
    fetchCycles,
    launchCycle,
    fetchCycleItems,
    verifyItem,
    closeCycle,
  } = useAudits()

  const [activeCycleId, setActiveCycleId] = useState<string | null>(null)
  const [isLaunchOpen, setIsLaunchOpen] = useState(false)
  const [isFlagOpen, setIsFlagOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [flagResult, setFlagResult] = useState<"Missing" | "Damaged">("Missing")
  const [flagNotes, setFlagNotes] = useState("")

  // Form states for launching cycle
  const [name, setName] = useState("")
  const [scopeDepartmentId, setScopeDepartmentId] = useState("")
  const [scopeLocation, setScopeLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([])

  // Options loaded from backend
  const [users, setUsers] = useState<{ id: string; username: string }[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])

  // Search & filter for audit items in workspace
  const [itemSearch, setItemSearch] = useState("")
  const [itemFilter, setItemFilter] = useState("All")

  useEffect(() => {
    fetchCycles()
  }, [fetchCycles])

  const loadLaunchOptions = useCallback(async () => {
    try {
      const usersData = await api.get<[]>("/users")
      const deptsData = await api.get<[]>("/departments")
      setUsers(usersData)
      setDepartments(deptsData)
    } catch (err) {
      console.error("Failed to load options:", err)
    }
  }, [])

  const handleOpenLaunch = async () => {
    await loadLaunchOptions()
    setIsLaunchOpen(true)
  }

  const handleLaunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !startDate || !endDate || selectedAuditors.length === 0) return

    const success = await launchCycle({
      name,
      scopeDepartmentId: scopeDepartmentId || undefined,
      scopeLocation: scopeLocation || undefined,
      startDate,
      endDate,
      auditorIds: selectedAuditors,
    })

    if (success) {
      setName("")
      setScopeDepartmentId("")
      setScopeLocation("")
      setStartDate("")
      setEndDate("")
      setSelectedAuditors([])
      setIsLaunchOpen(false)
      fetchCycles()
    }
  }

  const handleSelectCycle = async (id: string) => {
    setActiveCycleId(id)
    await fetchCycleItems(id)
  }

  const handleVerifySuccess = async (itemId: string) => {
    await verifyItem(itemId, { result: "Verified", notes: "Asset verified successfully" })
  }

  const handleOpenFlag = (itemId: string) => {
    setSelectedItemId(itemId)
    setFlagResult("Missing")
    setFlagNotes("")
    setIsFlagOpen(true)
  }

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemId) return

    const success = await verifyItem(selectedItemId, {
      result: flagResult,
      notes: flagNotes,
    })

    if (success) {
      setIsFlagOpen(false)
      setSelectedItemId(null)
    }
  }

  const handleCloseCycle = async (id: string) => {
    if (confirm("Are you sure you want to CLOSE this audit cycle? This will lock all items and sync discrepancies to the asset registry.")) {
      const success = await closeCycle(id)
      if (success) {
        setActiveCycleId(null)
      }
    }
  }

  const activeCycle = cycles.find((c) => c.id === activeCycleId)

  // Calculations for active cycle stats
  const totalItems = items.length
  const verifiedItems = items.filter((i) => i.result === "Verified").length
  const missingItems = items.filter((i) => i.result === "Missing").length
  const damagedItems = items.filter((i) => i.result === "Damaged").length
  const pendingItems = items.filter((i) => i.result === "Pending").length

  const completionPercent = totalItems ? Math.round((verifiedItems / totalItems) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Workspace Back Button & Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Physical Inventory Audits</h1>
          <p className="text-sm text-slate-400 mt-1">
            {activeCycleId ? `Workspace / ${activeCycle?.name}` : "Create and execute structured asset verification cycles."}
          </p>
        </div>
        {!activeCycleId ? (
          <button
            onClick={handleOpenLaunch}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-950/20 transition-all duration-200"
          >
            <Plus size={16} /> Launch Audit Cycle
          </button>
        ) : (
          <button
            onClick={() => setActiveCycleId(null)}
            className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-xl text-sm font-semibold transition-all duration-200"
          >
            Back to Dashboard
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* ── SCREEN A: AUDIT LISTINGS VIEW ── */}
      {!activeCycleId ? (
        <div className="grid grid-cols-1 gap-6">
          {loading && cycles.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading audit cycles...
            </div>
          ) : cycles.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/[0.08] rounded-2xl text-slate-500">
              <ClipboardCheck size={32} className="mx-auto mb-3 text-slate-600" />
              No audit cycles launched yet. Click the button above to launch one.
            </div>
          ) : (
            cycles.map((cyc) => (
              <div
                key={cyc.id}
                onClick={() => handleSelectCycle(cyc.id)}
                className="bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-6 shadow-xl cursor-pointer transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Badge
                      className={`${cyc.status === "Closed"
                          ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                    >
                      {cyc.status}
                    </Badge>
                    <h3 className="text-lg font-bold text-white">{cyc.name}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} /> {new Date(cyc.startDate).toLocaleDateString()} - {new Date(cyc.endDate).toLocaleDateString()}
                    </span>
                    {cyc.scopeLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {cyc.scopeLocation}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {cyc.status === "Closed" ? (
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status</p>
                      <p className="text-sm text-slate-300 font-medium mt-1 flex items-center gap-1.5 justify-end">
                        <Lock size={13} /> Reconciled & Closed
                      </p>
                    </div>
                  ) : (
                    <div className="text-right min-w-[120px]">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Progress</p>
                      <p className="text-sm font-bold text-orange-400 mt-1">Active Verification</p>
                    </div>
                  )}
                  <button className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl text-xs font-bold transition-all duration-200">
                    {cyc.status === "Closed" ? "View Summary" : "Enter Workspace"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── SCREEN B: ACTIVE RUNNER WORKSPACE ── */
        <div className="space-y-6 animate-fadeIn">
          {/* Progress Strip & Details */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Audit Overview</p>
              <h2 className="text-xl font-bold text-white">{activeCycle?.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> {new Date(activeCycle!.startDate).toLocaleDateString()} - {new Date(activeCycle!.endDate).toLocaleDateString()}
                </span>
                {activeCycle?.scopeLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {activeCycle.scopeLocation}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Reconciliation Progress</span>
                  <span>{completionPercent}% Verified</span>
                </div>
                <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-2 lg:col-span-2 gap-3">
              <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-center">
                <p className="text-xs text-slate-500 uppercase font-semibold">Verified</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">{verifiedItems} / {totalItems}</p>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-center">
                <p className="text-xs text-slate-500 uppercase font-semibold">Pending</p>
                <p className="text-lg font-bold text-amber-400 mt-1">{pendingItems}</p>
              </div>
              <div className="p-3 bg-rose-500/[0.03] border border-rose-500/[0.06] rounded-xl text-center">
                <p className="text-xs text-rose-400 uppercase font-semibold flex items-center justify-center gap-1">
                  <AlertTriangle size={12} /> Discrepancies
                </p>
                <p className="text-lg font-bold text-rose-400 mt-1">{missingItems + damagedItems}</p>
              </div>
              {activeCycle?.status !== "Closed" && (
                <button
                  onClick={() => handleCloseCycle(activeCycle!.id)}
                  className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-orange-950/20"
                >
                  <Lock size={12} /> Reconcile & Close Cycle
                </button>
              )}
            </div>
          </div>

          {/* Search, Filter & Auditor Checklist Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl">
              <div className="flex flex-1 items-center gap-3 bg-white/[0.03] border border-white/[0.08] px-3.5 py-2 rounded-xl max-w-sm">
                <Search size={17} className="text-slate-400" />
                <input
                  type="text"
                  className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-500"
                  placeholder="Search assets in scope..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                />
              </div>

              <div className="flex bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
                {["All", "Pending", "Verified", "Missing", "Damaged"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setItemFilter(filter)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${itemFilter === filter ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.01] border border-white/[0.05] rounded-2xl overflow-hidden shadow-2xl">
              {loading && items.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  Loading scoped assets...
                </div>
              ) : items.length === 0 ? (
                <div className="py-20 text-center text-slate-500">
                  No assets in this audit scope.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-slate-400 font-semibold h-11">Asset Tag</TableHead>
                      <TableHead className="text-slate-400 font-semibold h-11">Asset Name</TableHead>
                      <TableHead className="text-slate-400 font-semibold h-11">Location</TableHead>
                      <TableHead className="text-slate-400 font-semibold h-11">Status</TableHead>
                      {activeCycle?.status !== "Closed" && (
                        <TableHead className="text-slate-400 font-semibold h-11 text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items
                      .filter((item) => {
                        const matchesSearch =
                          item.assetName.toLowerCase().includes(itemSearch.toLowerCase()) ||
                          item.assetTag.toLowerCase().includes(itemSearch.toLowerCase())
                        const matchesFilter =
                          itemFilter === "All" || item.result === itemFilter
                        return matchesSearch && matchesFilter
                      })
                      .map((item) => (
                        <TableRow key={item.id} className="border-white/[0.04] hover:bg-white/[0.01]">
                          <TableCell className="font-mono font-bold text-orange-500">{item.assetTag}</TableCell>
                          <TableCell className="font-medium text-white">{item.assetName}</TableCell>
                          <TableCell className="text-slate-400">{item.location || "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              className={`${item.result === "Verified"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : item.result === "Missing"
                                    ? "bg-rose-500/10 text-rose-400"
                                    : item.result === "Damaged"
                                      ? "bg-red-500/10 text-red-400"
                                      : "bg-slate-500/10 text-slate-400"
                                }`}
                            >
                              {item.result}
                            </Badge>
                          </TableCell>
                          {activeCycle?.status !== "Closed" && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleVerifySuccess(item.id)}
                                  className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg transition-colors duration-150"
                                  title="Verify Asset"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleOpenFlag(item.id)}
                                  className="p-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-colors duration-150"
                                  title="Flag Discrepancy"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: LAUNCH CYCLE DIALOG ── */}
      {isLaunchOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div className="bg-[#0b0c16] border border-white/[0.08] rounded-2xl shadow-2xl p-7 w-full max-w-[480px]">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "14px" }}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderDot className="text-orange-500" size={19} /> Launch Audit Cycle
              </h2>
              <button onClick={() => setIsLaunchOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLaunchSubmit} className="space-y-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Audit Cycle Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 IT Hardware Audit"
                  className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Scope Department</label>
                  <select
                    className="px-3 py-2.5 bg-[#0b0c16] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full"
                    value={scopeDepartmentId}
                    onChange={(e) => setScopeDepartmentId(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Scope Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore"
                    className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full"
                    value={scopeLocation}
                    onChange={(e) => setScopeLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold">End Date *</label>
                  <input
                    type="date"
                    required
                    className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Auditors multi-select list */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Assign Auditors *</label>
                <div className="max-h-[100px] overflow-y-auto bg-white/[0.02] border border-white/[0.08] rounded-lg p-2 space-y-1.5">
                  {users.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAuditors.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAuditors([...selectedAuditors, u.id])
                          } else {
                            setSelectedAuditors(selectedAuditors.filter((id) => id !== u.id))
                          }
                        }}
                        style={{ accentColor: "#f97316" }}
                      />
                      {u.username}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsLaunchOpen(false)}
                  className="px-4 py-2 border border-white/[0.08] hover:bg-white/[0.04] text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg text-sm font-semibold shadow-md"
                >
                  Launch Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: FLAG DISCREPANCY POPUP ── */}
      {isFlagOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div className="bg-[#0b0c16] border border-white/[0.08] rounded-2xl shadow-2xl p-7 w-full max-w-[420px]">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "14px" }}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-rose-500" size={19} /> Flag Discrepancy
              </h2>
              <button onClick={() => setIsFlagOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFlagSubmit} className="space-y-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold font-medium">Reconciliation Result</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="flagResult"
                      checked={flagResult === "Missing"}
                      onChange={() => setFlagResult("Missing")}
                      style={{ accentColor: "#f97316" }}
                    />
                    Missing
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="flagResult"
                      checked={flagResult === "Damaged"}
                      onChange={() => setFlagResult("Damaged")}
                      style={{ accentColor: "#f97316" }}
                    />
                    Damaged
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold font-medium">Auditor Check-in Notes *</label>
                <textarea
                  required
                  placeholder="Describe location checks, damage specifics, or status report details..."
                  className="px-3 py-2 bg-white/[0.02] border border-white/[0.08] rounded-lg text-sm text-white outline-none w-full h-[100px] resize-none"
                  value={flagNotes}
                  onChange={(e) => setFlagNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsFlagOpen(false)}
                  className="px-4 py-2 border border-white/[0.08] hover:bg-white/[0.04] text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold"
                >
                  Flag Discrepancy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
