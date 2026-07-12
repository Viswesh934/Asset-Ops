import { useState, useEffect } from 'react'
import {
  Wrench,
  Download,
  AlertTriangle,
  Clock,
  ShieldAlert,
  TrendingUp,
  Package,
} from 'lucide-react'
import { api } from '../utils/api'

interface DepartmentUtilization {
  departmentId: string
  departmentName: string
  allocatedCount: number
  totalCount: number
  utilizationRate: number
}

interface MaintenanceFrequency {
  byCategory: {
    categoryName: string
    count: number
  }[]
  byMonth: {
    month: string
    count: number
  }[]
}

interface MostUsedAsset {
  assetId: string
  assetName: string
  assetTag: string
  bookingsCount: number
  allocationsCount: number
  totalCount: number
}

interface IdleAsset {
  assetId: string
  assetName: string
  assetTag: string
  idleDays: number
}

interface DueForMaintenance {
  assetId: string
  assetName: string
  assetTag: string
  status: string
  daysUntilDue: number
}

interface NearingRetirement {
  assetId: string
  assetName: string
  assetTag: string
  ageYears: number
  expectedLifespan: number
}

interface BookingHeatmapCell {
  dayOfWeek: number
  hour: number
  count: number
}

interface ReportsAnalyticsData {
  departmentUtilization: DepartmentUtilization[]
  maintenanceFrequency: MaintenanceFrequency
  mostUsedAssets: MostUsedAsset[]
  idleAssets: IdleAsset[]
  dueForMaintenance: DueForMaintenance[]
  nearingRetirement: NearingRetirement[]
  bookingHeatmap: BookingHeatmapCell[]
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => {
  const ampm = i >= 12 ? 'PM' : 'AM'
  const hour = i % 12 === 0 ? 12 : i % 12
  return `${hour} ${ampm}`
})

export default function Reports() {
  const [data, setData] = useState<ReportsAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'maintenance' | 'retirement'>('maintenance')
  const [exporting, setExporting] = useState(false)

  // Hover states for chart tooltips
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [hoveredHeatmap, setHoveredHeatmap] = useState<{ day: number; hour: number; count: number } | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get<ReportsAnalyticsData>('/reports/analytics')
      setData(res)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      setError(err.message || 'Failed to load report analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExport = async () => {
    try {
      setExporting(true)
      const csvContent = await api.get<string>('/reports/export')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `asset_report_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      console.error('Export error:', err)
      alert('Failed to export CSV report: ' + (err.message || err))
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500"></div>
        <p className="text-sm text-slate-400">Loading operational analytics...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-rose-500" />
        <h3 className="mb-1 text-lg font-medium text-white">Analytics Unreachable</h3>
        <p className="mb-4 text-sm text-slate-400">{error || 'Unable to retrieve data'}</p>
        <button
          onClick={fetchData}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Calculate high-level KPIs
  const totalAssetsCount = data.departmentUtilization.reduce((sum, d) => sum + d.totalCount, 0)
  const totalAllocatedCount = data.departmentUtilization.reduce((sum, d) => sum + d.allocatedCount, 0)
  const avgUtilizationRate = totalAssetsCount > 0 ? Math.round((totalAllocatedCount / totalAssetsCount) * 100) : 0
  
  const totalMaintenanceCases = data.maintenanceFrequency.byMonth.reduce((sum, m) => sum + m.count, 0)
  
  // Peak hour calculation for heatmap
  const maxHeatmapCell = data.bookingHeatmap.reduce(
    (max, cell) => (cell.count > max.count ? cell : max),
    { dayOfWeek: 0, hour: 0, count: 0 }
  )

  // Maintenance over time line chart coordinates
  const lineChartWidth = 380
  const lineChartHeight = 150
  const paddingX = 40
  const paddingY = 20
  const monthData = data.maintenanceFrequency.byMonth
  const maxMonthCount = Math.max(...monthData.map(m => m.count), 5)
  const plotWidth = lineChartWidth - paddingX * 2
  const plotHeight = lineChartHeight - paddingY * 2

  const points = monthData.map((m, i) => {
    const x = paddingX + (i * plotWidth) / (monthData.length - 1)
    const y = lineChartHeight - paddingY - (m.count / maxMonthCount) * plotHeight
    return { x, y, month: m.month, count: m.count }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Max value for department utilization bars
  const maxUtilRate = Math.max(...data.departmentUtilization.map(d => d.utilizationRate), 100)

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reports & Analytics</h1>
          <p className="text-sm text-slate-400">
            Real-time operational insight into asset metrics, maintenance trends, and resource usage.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all hover:bg-cyan-500 hover:shadow-cyan-500/20 disabled:pointer-events-none disabled:opacity-50"
        >
          {exporting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <Download size={16} />
          )}
          Export report
        </button>
      </div>

      {/* KPI Cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Asset Utilization</span>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{avgUtilizationRate}%</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {totalAllocatedCount} of {totalAssetsCount} active assets allocated
          </p>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recent Service Cases</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Wrench size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{totalMaintenanceCases}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Total requests raised in last 6 months</p>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Idle Assets (60d+)</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {data.idleAssets.filter(a => a.idleDays >= 60).length}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {data.idleAssets.length} total available assets cataloged
          </p>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Peak Usage Hour</span>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {maxHeatmapCell.count > 0 ? HOURS_OF_DAY[maxHeatmapCell.hour] : 'N/A'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {maxHeatmapCell.count > 0
              ? `${DAYS_OF_WEEK[maxHeatmapCell.dayOfWeek]}s (${maxHeatmapCell.count} bookings)`
              : 'No active resource bookings'}
          </p>
        </div>
      </div>

      {/* Main Charts Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Utilization by Department */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Utilization by Department</h3>
            <span className="text-xs text-slate-400">Active allocations %</span>
          </div>

          <div className="relative flex min-h-[220px] flex-col justify-end space-y-4">
            {/* Bars Rendering */}
            <div className="flex h-40 items-end justify-around gap-2 px-2">
              {data.departmentUtilization.map((dept, index) => {
                const heightPercent = Math.max((dept.utilizationRate / maxUtilRate) * 100, 8)
                const isHovered = hoveredBar === index

                return (
                  <div
                    key={dept.departmentId}
                    className="group relative flex flex-1 flex-col items-center"
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-16 z-10 w-40 rounded-lg bg-slate-950 p-2 text-center text-xs shadow-xl border border-slate-800">
                        <p className="font-semibold text-white truncate">{dept.departmentName}</p>
                        <p className="text-slate-400 mt-0.5">
                          {dept.allocatedCount} / {dept.totalCount} assets
                        </p>
                        <p className="text-cyan-400 font-bold mt-0.5">{dept.utilizationRate}% Utilized</p>
                      </div>
                    )}

                    {/* Bar Pillar */}
                    <div className="relative w-full max-w-[28px] h-40 flex items-end rounded-t-md bg-slate-800/40 overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-500 ease-out group-hover:from-cyan-500 group-hover:to-cyan-300"
                      ></div>
                    </div>

                    {/* Short label */}
                    <span className="mt-2 max-w-[50px] truncate text-[10px] text-slate-500 group-hover:text-slate-300">
                      {dept.departmentName}
                    </span>
                  </div>
                )
              })}
            </div>
            {/* Base line */}
            <div className="h-[1px] w-full bg-slate-800"></div>
          </div>
        </div>

        {/* Maintenance Frequency Trend */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Maintenance Frequency</h3>
            <span className="text-xs text-slate-400">Total requests over time</span>
          </div>

          <div className="relative flex h-[220px] items-center justify-center">
            {/* SVG Line Chart */}
            <svg viewBox={`0 0 ${lineChartWidth} ${lineChartHeight}`} className="w-full h-full max-h-[180px]">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingY + ratio * plotHeight
                return (
                  <line
                    key={idx}
                    x1={paddingX}
                    y1={y}
                    x2={lineChartWidth - paddingX}
                    y2={y}
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="1"
                  />
                )
              })}

              {/* Connecting Area Gradient */}
              {points.length > 0 && (
                <path
                  d={`${linePath} L ${points[points.length - 1].x} ${lineChartHeight - paddingY} L ${points[0].x} ${
                    lineChartHeight - paddingY
                  } Z`}
                  fill="url(#maintGrad)"
                />
              )}

              {/* Gradient Definitions */}
              <defs>
                <linearGradient id="maintGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(239, 68, 68, 0.15)" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                </linearGradient>
              </defs>

              {/* Line path */}
              <path d={linePath} fill="none" stroke="rgb(239, 68, 68)" strokeWidth="2.5" strokeLinecap="round" />

              {/* Points */}
              {points.map((p, idx) => {
                const isHovered = hoveredPoint === idx
                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? '6' : '4'}
                      fill="rgb(239, 68, 68)"
                      stroke="rgba(239, 68, 68, 0.3)"
                      strokeWidth={isHovered ? '4' : '0'}
                      className="transition-all duration-150"
                    />
                  </g>
                )
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint !== null && points[hoveredPoint] && (
              <div className="absolute top-2 right-4 rounded-lg bg-slate-950 px-3 py-1.5 text-xs border border-slate-800 shadow-xl">
                <span className="font-semibold text-white">{points[hoveredPoint].month}: </span>
                <span className="text-red-400 font-bold">{points[hoveredPoint].count} repairs</span>
              </div>
            )}

            {/* X Axis Labels */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-10 text-[10px] text-slate-500">
              {monthData.map(m => (
                <span key={m.month}>{m.month}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Split lists: Most Used vs Idle Assets */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Most Used Assets */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Most used assets</h3>
            <span className="text-xs text-slate-400">Top bookings & allocations</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {data.mostUsedAssets.length > 0 ? (
              data.mostUsedAssets.map((asset) => (
                <div key={asset.assetId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="font-medium text-slate-200 truncate text-sm">{asset.assetName}</span>
                    <span className="text-xs text-slate-500 font-mono mt-0.5">{asset.assetTag}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-cyan-400/10 px-2 py-1 text-xs font-medium text-cyan-400">
                      {asset.totalCount} uses this month
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">No utilization records found</div>
            )}
          </div>
        </div>

        {/* Idle Assets */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Idle assets</h3>
            <span className="text-xs text-slate-400">Available assets by idle duration</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {data.idleAssets.length > 0 ? (
              data.idleAssets.map((asset) => {
                const isCritical = asset.idleDays >= 60
                const isWarning = asset.idleDays >= 30 && asset.idleDays < 60
                
                return (
                  <div key={asset.assetId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="font-medium text-slate-200 truncate text-sm">{asset.assetName}</span>
                      <span className="text-xs text-slate-500 font-mono mt-0.5">{asset.assetTag}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                          isCritical
                            ? 'bg-rose-500/10 text-rose-400'
                            : isWarning
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        unused {asset.idleDays}+ days
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">No available assets registered</div>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance vs Retirement Panels */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                activeTab === 'maintenance'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Due for maintenance
            </button>
            <button
              onClick={() => setActiveTab('retirement')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                activeTab === 'retirement'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nearing retirement
            </button>
          </div>
          <span className="text-xs text-slate-500">Scheduled checks & service parameters</span>
        </div>

        <div>
          {activeTab === 'maintenance' ? (
            <div className="space-y-4">
              {data.dueForMaintenance.length > 0 ? (
                data.dueForMaintenance.map((asset) => {
                  const isOverdue = asset.daysUntilDue <= 0
                  return (
                    <div
                      key={asset.assetId}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800/60 bg-slate-900/20 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 rounded-lg p-2 ${
                            isOverdue ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {isOverdue ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-200 text-sm">{asset.assetName}</h4>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                            <span className="font-mono">{asset.assetTag}</span>
                            <span>•</span>
                            <span>Condition: {asset.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span
                          className={`text-xs font-semibold ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`}
                        >
                          {isOverdue
                            ? `service overdue`
                            : `service due in ${asset.daysUntilDue} days`}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">All assets are up to date on service.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {data.nearingRetirement.length > 0 ? (
                data.nearingRetirement.map((asset) => {
                  const ratio = Math.min((asset.ageYears / asset.expectedLifespan) * 100, 100)
                  return (
                    <div
                      key={asset.assetId}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800/60 bg-slate-900/20 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 shrink-0">
                          <Clock size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-200 text-sm truncate">{asset.assetName}</h4>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                            <span className="font-mono">{asset.assetTag}</span>
                            <span>•</span>
                            <span>
                              {asset.ageYears} years old / {asset.expectedLifespan} year lifespan
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-3 h-1.5 w-full max-w-md rounded-full bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${ratio}%` }}
                              className={`h-full rounded-full ${
                                ratio >= 90 ? 'bg-rose-500' : ratio >= 75 ? 'bg-amber-500' : 'bg-indigo-500'
                              }`}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-400">
                          {ratio >= 100 ? 'Retired status due' : 'Nearing retirement'}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">No assets nearing retirement cycle.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Heatmap Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md">
        <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-semibold text-white">Resource Booking Heatmap</h3>
            <p className="text-xs text-slate-500 mt-1">Identifies peak booking density across the week</p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>Low</span>
            <div className="h-3 w-3 rounded bg-slate-800/40"></div>
            <div className="h-3 w-3 rounded bg-cyan-950/60"></div>
            <div className="h-3 w-3 rounded bg-cyan-700/80"></div>
            <div className="h-3 w-3 rounded bg-cyan-400"></div>
            <span>Peak</span>
          </div>
        </div>

        {/* Heatmap Grid Wrapper */}
        <div className="relative overflow-x-auto pb-4">
          <div className="min-w-[800px] space-y-1.5">
            {/* Hourly labels header */}
            <div className="flex items-center pl-16">
              {Array.from({ length: 24 }).map((_, h) => {
                const showLabel = h % 3 === 0
                return (
                  <div key={h} className="w-[3.84%] text-center text-[10px] text-slate-600 font-mono">
                    {showLabel ? (h === 0 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`) : ''}
                  </div>
                )
              })}
            </div>

            {/* Heatmap rows */}
            {DAYS_OF_WEEK.map((dayName, dayIndex) => {
              return (
                <div key={dayName} className="flex items-center">
                  {/* Day Label */}
                  <span className="w-16 text-xs text-slate-500 font-medium shrink-0">{dayName.slice(0, 3)}</span>

                  {/* Hourly cells */}
                  {Array.from({ length: 24 }).map((_, hourIndex) => {
                    const cell = data.bookingHeatmap.find(
                      c => c.dayOfWeek === dayIndex && c.hour === hourIndex
                    )
                    const count = cell ? cell.count : 0

                    // Color determination
                    let bgClass = 'bg-slate-800/20'
                    if (count === 1) bgClass = 'bg-cyan-950/60 text-cyan-200'
                    if (count === 2) bgClass = 'bg-cyan-700/80 text-cyan-100'
                    if (count >= 3) bgClass = 'bg-cyan-400 text-slate-950 font-bold'

                    const isHovered =
                      hoveredHeatmap?.day === dayIndex && hoveredHeatmap?.hour === hourIndex

                    return (
                      <div
                        key={hourIndex}
                        onMouseEnter={() => setHoveredHeatmap({ day: dayIndex, hour: hourIndex, count })}
                        onMouseLeave={() => setHoveredHeatmap(null)}
                        className={`w-[3.84%] aspect-square rounded-sm mx-[1px] flex items-center justify-center text-[8px] cursor-pointer transition-all duration-100 hover:scale-110 ${bgClass} ${
                          isHovered ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 z-10' : ''
                        }`}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Heatmap Tooltip Display */}
        <div className="h-6 mt-2 flex items-center justify-center text-xs text-slate-400">
          {hoveredHeatmap ? (
            <span className="animate-fade-in font-medium">
              {DAYS_OF_WEEK[hoveredHeatmap.day]}s at {HOURS_OF_DAY[hoveredHeatmap.hour]}:{' '}
              <strong className="text-cyan-400">{hoveredHeatmap.count} active bookings</strong>
            </span>
          ) : (
            <span className="text-slate-600">Hover over cells for detailed peak hourly usage metrics</span>
          )}
        </div>
      </div>
    </div>
  )
}
