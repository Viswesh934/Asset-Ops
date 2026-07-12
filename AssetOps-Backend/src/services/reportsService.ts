import { eq, and, or, inArray, gte, lt, sql, ne } from "drizzle-orm"
import { DrizzleDb } from "../db/connection"
import {
  asset,
  assetAllocation,
  resourceBooking,
  maintenanceRequest,
  assetCategory,
  department,
} from "../db/schema"

export interface ReportsAnalyticsData {
  departmentUtilization: {
    departmentId: string
    departmentName: string
    allocatedCount: number
    totalCount: number
    utilizationRate: number
  }[]
  maintenanceFrequency: {
    byCategory: {
      categoryName: string
      count: number
    }[]
    byMonth: {
      month: string
      count: number
    }[]
  }
  mostUsedAssets: {
    assetId: string
    assetName: string
    assetTag: string
    bookingsCount: number
    allocationsCount: number
    totalCount: number
  }[]
  idleAssets: {
    assetId: string
    assetName: string
    assetTag: string
    idleDays: number
  }[]
  dueForMaintenance: {
    assetId: string
    assetName: string
    assetTag: string
    status: string
    daysUntilDue: number
  }[]
  nearingRetirement: {
    assetId: string
    assetName: string
    assetTag: string
    ageYears: number
    expectedLifespan: number
  }[]
  bookingHeatmap: {
    dayOfWeek: number
    hour: number
    count: number
  }[]
}

/**
 * Fetch unified reports & analytics snapshot
 */
export async function getReportsAnalytics(db: DrizzleDb): Promise<ReportsAnalyticsData> {
  const now = new Date()

  // 1. Department Allocation & Utilization
  const departmentsList = await db.select().from(department)
  const departmentUtilization = []

  for (const dept of departmentsList) {
    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(asset)
      .where(
        and(
          eq(asset.departmentId, dept.id),
          ne(asset.status, "Retired"),
          ne(asset.status, "Disposed")
        )
      )

    const [allocatedRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(asset)
      .where(
        and(
          eq(asset.departmentId, dept.id),
          eq(asset.status, "Allocated")
        )
      )

    const totalCount = totalRes?.count || 0
    const allocatedCount = allocatedRes?.count || 0
    const utilizationRate = totalCount > 0 ? Math.round((allocatedCount / totalCount) * 100) : 0

    departmentUtilization.push({
      departmentId: dept.id,
      departmentName: dept.name,
      allocatedCount,
      totalCount,
      utilizationRate,
    })
  }

  // Include unassigned/general assets
  const [totalUnassigned] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)
    .where(
      and(
        sql`${asset.departmentId} IS NULL`,
        ne(asset.status, "Retired"),
        ne(asset.status, "Disposed")
      )
    )

  const [allocatedUnassigned] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)
    .where(
      and(
        sql`${asset.departmentId} IS NULL`,
        eq(asset.status, "Allocated")
      )
    )

  if ((totalUnassigned?.count || 0) > 0) {
    const totalCount = totalUnassigned?.count || 0
    const allocatedCount = allocatedUnassigned?.count || 0
    departmentUtilization.push({
      departmentId: "unassigned",
      departmentName: "General / Unassigned",
      allocatedCount,
      totalCount,
      utilizationRate: Math.round((allocatedCount / totalCount) * 100),
    })
  }

  // 2. Maintenance Frequency
  const byCategory = await db
    .select({
      categoryName: assetCategory.name,
      count: sql<number>`count(${maintenanceRequest.id})::int`,
    })
    .from(maintenanceRequest)
    .innerJoin(asset, eq(maintenanceRequest.assetId, asset.id))
    .innerJoin(assetCategory, eq(asset.categoryId, assetCategory.id))
    .groupBy(assetCategory.name)

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const rawMaint = await db
    .select({
      createdAt: maintenanceRequest.createdAt,
    })
    .from(maintenanceRequest)
    .where(gte(maintenanceRequest.createdAt, sixMonthsAgo.toISOString()))

  const monthMap: Record<string, number> = {}
  for (let i = 0; i < 6; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - 5 + i)
    const key = d.toLocaleString("default", { month: "short" })
    monthMap[key] = 0
  }

  for (const m of rawMaint) {
    const dateObj = new Date(m.createdAt)
    const key = dateObj.toLocaleString("default", { month: "short" })
    if (key in monthMap) {
      monthMap[key] += 1
    }
  }

  const byMonth = Object.entries(monthMap).map(([month, count]) => ({ month, count }))

  // 3. Most Used Assets
  const bookingCounts = await db
    .select({
      assetId: resourceBooking.assetId,
      count: sql<number>`count(*)::int`,
    })
    .from(resourceBooking)
    .where(ne(resourceBooking.status, "Cancelled"))
    .groupBy(resourceBooking.assetId)

  const allocationCounts = await db
    .select({
      assetId: assetAllocation.assetId,
      count: sql<number>`count(*)::int`,
    })
    .from(assetAllocation)
    .groupBy(assetAllocation.assetId)

  const allAssets = await db
    .select({
      id: asset.id,
      name: asset.name,
      assetTag: asset.assetTag,
    })
    .from(asset)
    .where(and(ne(asset.status, "Retired"), ne(asset.status, "Disposed")))

  const assetUsage = allAssets.map(ast => {
    const bookings = bookingCounts.find(b => b.assetId === ast.id)?.count || 0
    const allocations = allocationCounts.find(a => a.assetId === ast.id)?.count || 0
    return {
      assetId: ast.id,
      assetName: ast.name,
      assetTag: ast.assetTag,
      bookingsCount: bookings,
      allocationsCount: allocations,
      totalCount: bookings + allocations,
    }
  })

  const mostUsedAssets = assetUsage
    .filter(u => u.totalCount > 0)
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 5)

  // 4. Idle Assets (Available assets sorted by time since last activity)
  const availableAssets = await db
    .select({
      id: asset.id,
      name: asset.name,
      assetTag: asset.assetTag,
      acquisitionDate: asset.acquisitionDate,
      createdAt: asset.createdAt,
    })
    .from(asset)
    .where(eq(asset.status, "Available"))

  const idleAssetsList = []

  for (const ast of availableAssets) {
    const [lastAlloc] = await db
      .select({
        actualReturnDate: assetAllocation.actualReturnDate,
      })
      .from(assetAllocation)
      .where(and(eq(assetAllocation.assetId, ast.id), eq(assetAllocation.status, "Returned")))
      .orderBy(sql`actual_return_date desc`)
      .limit(1)

    const [lastBook] = await db
      .select({
        endTime: resourceBooking.endTime,
      })
      .from(resourceBooking)
      .where(and(eq(resourceBooking.assetId, ast.id), eq(resourceBooking.status, "Completed")))
      .orderBy(sql`end_time desc`)
      .limit(1)

    let latestActivity = new Date(ast.createdAt)
    if (ast.acquisitionDate) {
      const acqDate = new Date(ast.acquisitionDate)
      if (acqDate > latestActivity) latestActivity = acqDate
    }
    if (lastAlloc?.actualReturnDate) {
      const allocDate = new Date(lastAlloc.actualReturnDate)
      if (allocDate > latestActivity) latestActivity = allocDate
    }
    if (lastBook?.endTime) {
      const bookDate = new Date(lastBook.endTime)
      if (bookDate > latestActivity) latestActivity = bookDate
    }

    const diffTime = Math.abs(now.getTime() - latestActivity.getTime())
    const idleDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    idleAssetsList.push({
      assetId: ast.id,
      assetName: ast.name,
      assetTag: ast.assetTag,
      idleDays,
    })
  }

  const idleAssets = idleAssetsList.sort((a, b) => b.idleDays - a.idleDays).slice(0, 5)

  // 5. Due for Maintenance & Nearing Retirement
  const activeAssets = await db
    .select({
      id: asset.id,
      name: asset.name,
      assetTag: asset.assetTag,
      acquisitionDate: asset.acquisitionDate,
      createdAt: asset.createdAt,
      status: asset.status,
    })
    .from(asset)
    .where(and(ne(asset.status, "Retired"), ne(asset.status, "Disposed")))

  const dueForMaintenance = []
  const nearingRetirement = []

  for (const ast of activeAssets) {
    const [openReq] = await db
      .select()
      .from(maintenanceRequest)
      .where(
        and(
          eq(maintenanceRequest.assetId, ast.id),
          inArray(maintenanceRequest.status, ["Pending", "Approved", "Technician Assigned", "In Progress"])
        )
      )
      .limit(1)

    let daysUntilDue = 180
    const isCurrentlyInMaint = ast.status === "Under Maintenance" || !!openReq

    if (openReq) {
      daysUntilDue = -1
    } else {
      const [lastMaint] = await db
        .select({ resolvedAt: maintenanceRequest.resolvedAt })
        .from(maintenanceRequest)
        .where(and(eq(maintenanceRequest.assetId, ast.id), eq(maintenanceRequest.status, "Resolved")))
        .orderBy(sql`resolved_at desc`)
        .limit(1)

      let baseDate = new Date(ast.createdAt)
      if (ast.acquisitionDate) {
        const acqDate = new Date(ast.acquisitionDate)
        if (acqDate > baseDate) baseDate = acqDate
      }
      if (lastMaint?.resolvedAt) {
        const resolvedDate = new Date(lastMaint.resolvedAt)
        if (resolvedDate > baseDate) baseDate = resolvedDate
      }

      const diffTime = now.getTime() - baseDate.getTime()
      const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      daysUntilDue = 180 - daysSince
    }

    if (daysUntilDue <= 30 || isCurrentlyInMaint) {
      dueForMaintenance.push({
        assetId: ast.id,
        assetName: ast.name,
        assetTag: ast.assetTag,
        status: openReq ? "Pending Maintenance" : ast.status,
        daysUntilDue: isCurrentlyInMaint && daysUntilDue > 0 ? 0 : daysUntilDue,
      })
    }

    // Nearing Retirement
    const [cat] = await db
      .select({ name: assetCategory.name })
      .from(assetCategory)
      .innerJoin(asset, eq(asset.categoryId, assetCategory.id))
      .where(eq(asset.id, ast.id))
      .limit(1)

    const catName = cat?.name?.toLowerCase() || ""
    let lifespanYears = 5
    if (catName.includes("laptop") || catName.includes("electron") || catName.includes("hardw")) {
      lifespanYears = 4
    } else if (catName.includes("furnit") || catName.includes("chair")) {
      lifespanYears = 8
    } else if (catName.includes("vehic") || catName.includes("car") || catName.includes("truck") || catName.includes("van") || catName.includes("fork")) {
      lifespanYears = 10
    }

    const acqDate = ast.acquisitionDate ? new Date(ast.acquisitionDate) : new Date(ast.createdAt)
    const ageYears = (now.getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    if (ageYears >= (lifespanYears - 1.0)) {
      nearingRetirement.push({
        assetId: ast.id,
        assetName: ast.name,
        assetTag: ast.assetTag,
        ageYears: Math.round(ageYears * 10) / 10,
        expectedLifespan: lifespanYears,
      })
    }
  }

  // Sort and limit
  const sortedDueForMaint = dueForMaintenance.sort((a, b) => a.daysUntilDue - b.daysUntilDue).slice(0, 5)
  const sortedNearingRetirement = nearingRetirement
    .sort((a, b) => (b.ageYears / b.expectedLifespan) - (a.ageYears / a.expectedLifespan))
    .slice(0, 5)

  // 6. Booking Heatmap
  const activeBookings = await db
    .select({
      startTime: resourceBooking.startTime,
    })
    .from(resourceBooking)
    .where(ne(resourceBooking.status, "Cancelled"))

  const heatmapGrid: Record<string, number> = {}
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      heatmapGrid[`${d}-${h}`] = 0
    }
  }

  for (const b of activeBookings) {
    const startDate = new Date(b.startTime)
    const d = startDate.getDay() // 0-6
    const h = startDate.getHours() // 0-23
    const key = `${d}-${h}`
    if (key in heatmapGrid) {
      heatmapGrid[key] += 1
    }
  }

  const bookingHeatmap = Object.entries(heatmapGrid).map(([key, count]) => {
    const [dayOfWeek, hour] = key.split("-").map(Number)
    return { dayOfWeek, hour, count }
  })

  return {
    departmentUtilization,
    maintenanceFrequency: {
      byCategory,
      byMonth,
    },
    mostUsedAssets,
    idleAssets,
    dueForMaintenance: sortedDueForMaint,
    nearingRetirement: sortedNearingRetirement,
    bookingHeatmap,
  }
}

/**
 * Generate CSV Report data of all assets
 */
export async function getExportReportData(db: DrizzleDb): Promise<string> {
  const now = new Date()
  const allReportAssets = await db
    .select({
      assetTag: asset.assetTag,
      name: asset.name,
      categoryName: assetCategory.name,
      status: asset.status,
      condition: asset.condition,
      location: asset.location,
      departmentName: department.name,
      acquisitionDate: asset.acquisitionDate,
      acquisitionCost: asset.acquisitionCost,
      createdAt: asset.createdAt,
      id: asset.id,
    })
    .from(asset)
    .innerJoin(assetCategory, eq(asset.categoryId, assetCategory.id))
    .leftJoin(department, eq(asset.departmentId, department.id))
    .orderBy(asset.assetTag)

  const csvRows = []
  
  csvRows.push([
    "Asset Tag",
    "Name",
    "Category",
    "Status",
    "Condition",
    "Location",
    "Owner Department",
    "Total Allocations",
    "Total Bookings",
    "Last Maintenance Date",
    "Acquisition Date",
    "Acquisition Cost ($)",
    "Age (Years)",
  ].map(h => `"${h}"`).join(","))

  for (const ast of allReportAssets) {
    const [allocCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assetAllocation)
      .where(eq(assetAllocation.assetId, ast.id))

    const [bookCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(resourceBooking)
      .where(eq(resourceBooking.assetId, ast.id))

    const [lastMaint] = await db
      .select({ resolvedAt: maintenanceRequest.resolvedAt })
      .from(maintenanceRequest)
      .where(and(eq(maintenanceRequest.assetId, ast.id), eq(maintenanceRequest.status, "Resolved")))
      .orderBy(sql`resolved_at desc`)
      .limit(1)

    const ageDate = ast.acquisitionDate ? new Date(ast.acquisitionDate) : new Date(ast.createdAt)
    const ageYears = Math.round(((now.getTime() - ageDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10

    const row = [
      ast.assetTag || "",
      ast.name || "",
      ast.categoryName || "",
      ast.status || "",
      ast.condition || "",
      ast.location || "",
      ast.departmentName || "General / Unassigned",
      allocCount?.count || 0,
      bookCount?.count || 0,
      lastMaint?.resolvedAt ? new Date(lastMaint.resolvedAt).toISOString().split("T")[0] : "N/A",
      ast.acquisitionDate ? ast.acquisitionDate : new Date(ast.createdAt).toISOString().split("T")[0],
      ast.acquisitionCost || "0.00",
      ageYears,
    ]

    const escapedRow = row.map(val => {
      const stringified = String(val).replace(/"/g, '""')
      return `"${stringified}"`
    }).join(",")

    csvRows.push(escapedRow)
  }

  return csvRows.join("\n")
}
