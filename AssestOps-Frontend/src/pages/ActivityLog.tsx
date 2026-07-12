import { useEffect, useState, useCallback } from "react"
import {
  Activity,
  Search,
  User,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Wrench,
  RefreshCw,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { api } from "../utils/api"
import type { ActivityLogItem } from "../types/index"
import { Badge } from "../components/ui/badge"

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedEntity, setSelectedEntity] = useState("All")
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const [now] = useState(() => Date.now())

  const fetchLogs = useCallback(async () => {
    try {
      const data = await api.get<ActivityLogItem[]>("/activity-logs")
      setLogs(data)
    } catch (err) {
      console.error("Failed to fetch activity logs:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const timeAgo = (dateStr: string) => {
    const diff = now - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  // Get action details parsing helper
  const renderDetails = (detailsStr: string | null | undefined) => {
    if (!detailsStr) return <span className="text-slate-500 font-normal">No additional details</span>
    try {
      const parsed = JSON.parse(detailsStr)
      if (typeof parsed === "object" && parsed !== null) {
        return (
          <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-black/40 border border-white/5 rounded-xl text-xs font-mono">
            {Object.entries(parsed).map(([key, val]) => (
              <div key={key} className="flex flex-col">
                <span className="text-slate-500 text-[10px] uppercase tracking-wider">{key}</span>
                <span className="text-slate-300 mt-0.5">{String(val)}</span>
              </div>
            ))}
          </div>
        )
      }
    } catch {
      // Not JSON, return as plain string
    }
    return <span className="text-slate-300">{detailsStr}</span>
  }

  // Helper to format action names into friendly titles
  const getActionLabel = (action: string) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Action Categorization and Styling helpers
  const getActionStyles = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes("APPROVED") || act.includes("VERIFIED") || act.includes("RESOLVED")) {
      return {
        icon: CheckCircle2,
        colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        barColor: "#10b981",
      }
    }
    if (act.includes("REJECTED") || act.includes("CANCELLED")) {
      return {
        icon: XCircle,
        colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        barColor: "#f43f5e",
      }
    }
    if (act.includes("REGISTERED") || act.includes("LAUNCHED") || act.includes("CREATE")) {
      return {
        icon: PlusCircle,
        colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        barColor: "#3b82f6",
      }
    }
    if (act.includes("ALLOCAT") || act.includes("TRANSFER") || act.includes("RETURN")) {
      return {
        icon: RefreshCw,
        colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        barColor: "#f59e0b",
      }
    }
    if (act.includes("MAINTENANCE") || act.includes("TECHNICIAN")) {
      return {
        icon: Wrench,
        colorClass: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        barColor: "#a855f7",
      }
    }
    return {
      icon: Info,
      colorClass: "text-slate-400 bg-slate-500/10 border-slate-500/20",
      barColor: "#64748b",
    }
  }

  // Filter logs based on search query and entity selection
  const filteredLogs = logs.filter((log) => {
    const actorName = log.actorName || log.username || "System"
    const searchString = `${actorName} ${log.action} ${log.entityType} ${log.details || ""}`.toLowerCase()
    const matchesSearch = searchString.includes(search.toLowerCase())
    const matchesEntity = selectedEntity === "All" || log.entityType === selectedEntity
    return matchesSearch && matchesEntity
  })

  // Calculate quick stats
  const totalCount = logs.length
  const assetActionsCount = logs.filter((l) => l.entityType === "asset").length
  const allocationActionsCount = logs.filter((l) => l.entityType === "asset_allocation" || l.entityType === "transfer_request").length
  const maintenanceActionsCount = logs.filter((l) => l.entityType === "maintenance_request").length

  return (
    <div className="space-y-6">
      {/* Title & Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">System Activity Log</h1>
        <p className="text-sm text-slate-400 mt-1">
          A full audit trail of administrator, manager, and employee actions.
        </p>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="relative overflow-hidden bg-white/2 border border-white/6 rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500">
            <Activity size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Operations</p>
          <h3 className="text-2xl font-bold text-white mt-2">{totalCount}</h3>
          <div className="w-full bg-blue-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Asset Logs */}
        <div className="relative overflow-hidden bg-white/2 border border-white/6 rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
            <PlusCircle size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset Changes</p>
          <h3 className="text-2xl font-bold text-white mt-2">{assetActionsCount}</h3>
          <div className="w-full bg-emerald-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (assetActionsCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Allocation Logs */}
        <div className="relative overflow-hidden bg-white/2 border border-white/6 rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500">
            <RefreshCw size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Allocations & Transfers</p>
          <h3 className="text-2xl font-bold text-white mt-2">{allocationActionsCount}</h3>
          <div className="w-full bg-amber-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (allocationActionsCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Maintenance Logs */}
        <div className="relative overflow-hidden bg-white/2 border border-white/6 rounded-2xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-purple-500">
            <Wrench size={60} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Maintenance Updates</p>
          <h3 className="text-2xl font-bold text-white mt-2">{maintenanceActionsCount}</h3>
          <div className="w-full bg-purple-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (maintenanceActionsCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/1 border border-white/5 rounded-2xl">
        <div className="flex flex-1 items-center gap-3 bg-white/3 border border-white/8 px-3.5 py-2 rounded-xl max-w-md">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-500"
            placeholder="Search by actor, action or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Entity Type:</label>
          <select
            className="px-3 py-2 bg-white/3 border border-white/8 rounded-xl text-xs font-semibold text-slate-300 outline-none cursor-pointer"
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
          >
            <option value="All">All Entities</option>
            <option value="asset">Asset</option>
            <option value="asset_allocation">Asset Allocation</option>
            <option value="transfer_request">Transfer Request</option>
            <option value="maintenance_request">Maintenance Request</option>
            <option value="resource_booking">Resource Booking</option>
            <option value="audit_cycle">Audit Cycle</option>
            <option value="audit_item">Audit Item</option>
          </select>
        </div>
      </div>

      {/* Logs Timeline */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 bg-white/1 border border-white/5 rounded-2xl">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          Loading audit trails...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-white/1 border border-white/5 rounded-2xl">
          <Activity size={28} className="mx-auto mb-3 text-slate-600" />
          No activities found matching your criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const styles = getActionStyles(log.action)
            const ActionIcon = styles.icon
            const isExpanded = expandedLogId === log.id
            const actorName = log.actorName || log.username || "System"

            return (
              <div
                key={log.id}
                className="bg-white/1 hover:bg-white/2 border border-white/5 rounded-2xl p-4 transition-all duration-200"
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: styles.barColor,
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Status Indicator Circle */}
                  <div className={`p-2 rounded-xl border ${styles.colorClass} mt-0.5`}>
                    <ActionIcon size={16} />
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Who */}
                        <span className="text-sm font-bold text-white flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          {actorName}
                        </span>
                        {/* Action Badge */}
                        <Badge variant="secondary" className={`${styles.colorClass} text-[10px] font-semibold border`}>
                          {getActionLabel(log.action)}
                        </Badge>
                      </div>

                      {/* When */}
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                        <Clock size={11} />
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        <span className="text-[10px] text-slate-600">({timeAgo(log.createdAt)})</span>
                      </span>
                    </div>

                    {/* Action Description */}
                    <div className="text-sm text-slate-300 mt-2 font-medium">
                      {log.details && !log.details.startsWith("{") ? (
                        <span>{log.details}</span>
                      ) : (
                        <span>
                          Performed <strong className="text-slate-200">{getActionLabel(log.action)}</strong> on{" "}
                          <strong className="text-slate-200">{log.entityType}</strong> (ID: {log.entityId || "N/A"})
                        </span>
                      )}
                    </div>

                    {/* Expand Details Trigger */}
                    {log.details && (
                      <div className="mt-2.5">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="flex items-center gap-1 text-xs text-orange-500/80 hover:text-orange-400 font-semibold transition-all duration-150"
                        >
                          {isExpanded ? (
                            <>
                              Hide details <ChevronUp size={12} />
                            </>
                          ) : (
                            <>
                              View execution context <ChevronDown size={12} />
                            </>
                          )}
                        </button>

                        {/* Expandable JSON context */}
                        {isExpanded && <div className="mt-2">{renderDetails(log.details)}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
