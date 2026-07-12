import { eq, and, or, inArray, gte, lt, sql } from "drizzle-orm"
import { DrizzleDb } from "../db/connection"
import {
  asset,
  assetAllocation,
  resourceBooking,
  maintenanceRequest,
  transferRequest,
  employee,
  department,
  auditCycle,
  auditItem,
} from "../db/schema"

export interface KPICards {
  assetsAvailable: number
  assetsAllocated: number
  maintenanceToday: number
  activeBookings: number
  pendingTransfers: number
  upcomingReturns: number
  overdueReturns: number
  totalAssets: number
  inRepair: number
}

export interface ReturnDetail {
  allocationId: string
  assetId: string
  assetName: string
  assetTag: string
  serialNumber: string | null
  targetType: "Employee" | "Department"
  assignedToName: string
  expectedReturnDate: string
  daysOverdue?: number
}

export interface ActivityItem {
  id: string
  type: 'allocation' | 'booking' | 'maintenance' | 'audit'
  title: string
  description: string
  timestamp: string
}

export interface DashboardData {
  role: string
  departmentName?: string | null
  kpis: KPICards
  overdueReturnsList: ReturnDetail[]
  upcomingReturnsList: ReturnDetail[]
  recentActivities: ActivityItem[]
}

/**
 * Organization-wide snapshot for Admins and Asset Managers
 */
async function getAdminSnapshot(db: DrizzleDb): Promise<DashboardData> {
  const todayDateStr = new Date().toISOString().split("T")[0]
  const nowStr = new Date().toISOString()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  // A. KPI counts
  const [availCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)
    .where(eq(asset.status, "Available"))

  const [allocCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)
    .where(eq(asset.status, "Allocated"))

  const [maintCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(maintenanceRequest)
    .where(
      or(
        inArray(maintenanceRequest.status, ["Approved", "Technician Assigned", "In Progress"]),
        and(
          gte(maintenanceRequest.resolvedAt, todayStart.toISOString()),
          lt(maintenanceRequest.resolvedAt, todayEnd.toISOString())
        ),
        and(
          gte(maintenanceRequest.createdAt, todayStart.toISOString()),
          lt(maintenanceRequest.createdAt, todayEnd.toISOString())
        )
      )
    )

  const [bookingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resourceBooking)
    .where(
      or(
        eq(resourceBooking.status, "Ongoing"),
        and(
          eq(resourceBooking.status, "Upcoming"),
          lt(resourceBooking.startTime, nowStr),
          gte(resourceBooking.endTime, nowStr)
        )
      )
    )

  const [transferCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transferRequest)
    .where(eq(transferRequest.status, "Requested"))

  const [upcomingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assetAllocation)
    .where(
      and(
        eq(assetAllocation.status, "Active"),
        gte(assetAllocation.expectedReturnDate, todayDateStr)
      )
    )

  const [overdueCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assetAllocation)
    .where(
      and(
        eq(assetAllocation.status, "Active"),
        lt(assetAllocation.expectedReturnDate, todayDateStr)
      )
    )

  const [inRepairCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)
    .where(eq(asset.status, "Under Maintenance"))

  const [totalCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)

  // B. Overdue Returns List
  const overdueList = await db
    .select({
      id: assetAllocation.id,
      assetId: assetAllocation.assetId,
      assetName: asset.name,
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber,
      targetType: assetAllocation.targetType,
      employeeName: employee.name,
      departmentName: department.name,
      expectedReturnDate: assetAllocation.expectedReturnDate,
    })
    .from(assetAllocation)
    .innerJoin(asset, eq(assetAllocation.assetId, asset.id))
    .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
    .leftJoin(department, eq(assetAllocation.departmentId, department.id))
    .where(
      and(
        eq(assetAllocation.status, "Active"),
        lt(assetAllocation.expectedReturnDate, todayDateStr)
      )
    )
    .orderBy(assetAllocation.expectedReturnDate)

  const overdueReturnsList: ReturnDetail[] = overdueList.map(item => {
    const expDate = new Date(item.expectedReturnDate!)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = Math.abs(today.getTime() - expDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return {
      allocationId: item.id,
      assetId: item.assetId,
      assetName: item.assetName,
      assetTag: item.assetTag,
      serialNumber: item.serialNumber,
      targetType: item.targetType,
      assignedToName: item.targetType === "Employee" ? (item.employeeName || "Unknown Employee") : (item.departmentName || "Unknown Department"),
      expectedReturnDate: item.expectedReturnDate!,
      daysOverdue: diffDays,
    }
  })

  // C. Upcoming Returns List
  const upcomingList = await db
    .select({
      id: assetAllocation.id,
      assetId: assetAllocation.assetId,
      assetName: asset.name,
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber,
      targetType: assetAllocation.targetType,
      employeeName: employee.name,
      departmentName: department.name,
      expectedReturnDate: assetAllocation.expectedReturnDate,
    })
    .from(assetAllocation)
    .innerJoin(asset, eq(assetAllocation.assetId, asset.id))
    .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
    .leftJoin(department, eq(assetAllocation.departmentId, department.id))
    .where(
      and(
        eq(assetAllocation.status, "Active"),
        gte(assetAllocation.expectedReturnDate, todayDateStr)
      )
    )
    .orderBy(assetAllocation.expectedReturnDate)
    .limit(10)

  const upcomingReturnsList: ReturnDetail[] = upcomingList.map(item => ({
    allocationId: item.id,
    assetId: item.assetId,
    assetName: item.assetName,
    assetTag: item.assetTag,
    serialNumber: item.serialNumber,
    targetType: item.targetType,
    assignedToName: item.targetType === "Employee" ? (item.employeeName || "Unknown Employee") : (item.departmentName || "Unknown Department"),
    expectedReturnDate: item.expectedReturnDate!,
  }))

  const recentActivities = await getRecentActivities(db)

  return {
    role: "Admin/Asset Manager",
    kpis: {
      assetsAvailable: availCount?.count || 0,
      assetsAllocated: allocCount?.count || 0,
      maintenanceToday: maintCount?.count || 0,
      activeBookings: bookingCount?.count || 0,
      pendingTransfers: transferCount?.count || 0,
      upcomingReturns: upcomingCount?.count || 0,
      overdueReturns: overdueCount?.count || 0,
      totalAssets: totalCount?.count || 0,
      inRepair: inRepairCount?.count || 0,
    },
    overdueReturnsList,
    upcomingReturnsList,
    recentActivities,
  }
}

/**
 * Snapshot scoped to the Department Head's department
 */
async function getDepartmentHeadSnapshot(deptId: string, deptName: string | null, db: DrizzleDb): Promise<DashboardData> {
  const todayDateStr = new Date().toISOString().split("T")[0]
  const nowStr = new Date().toISOString()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const employeesInDept = await db
    .select({ id: employee.id, userId: employee.userId })
    .from(employee)
    .where(eq(employee.departmentId, deptId))
  
  const empIds = employeesInDept.map(e => e.id)
  const userIds = employeesInDept.map(e => e.userId)

  let resolvedDeptName = deptName
  if (!resolvedDeptName) {
    const deptRec = await db.select().from(department).where(eq(department.id, deptId)).limit(1)
    resolvedDeptName = deptRec[0]?.name || "Department"
  }

  const [availCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)
    .where(and(eq(asset.status, "Available"), eq(asset.departmentId, deptId)))

  const [allocCount] = await db
    .select({ count: sql<number>`count(distinct ${asset.id})::int` })
    .from(asset)
    .innerJoin(assetAllocation, eq(assetAllocation.assetId, asset.id))
    .where(
      and(
        eq(asset.status, "Allocated"),
        eq(assetAllocation.status, "Active"),
        or(
          eq(assetAllocation.departmentId, deptId),
          empIds.length > 0 ? inArray(assetAllocation.employeeId, empIds) : sql`false`
        )
      )
    )

  const [maintCount] = await db
    .select({ count: sql<number>`count(distinct ${maintenanceRequest.id})::int` })
    .from(maintenanceRequest)
    .innerJoin(asset, eq(maintenanceRequest.assetId, asset.id))
    .where(
      and(
        or(
          inArray(maintenanceRequest.status, ["Approved", "Technician Assigned", "In Progress"]),
          and(
            gte(maintenanceRequest.resolvedAt, todayStart.toISOString()),
            lt(maintenanceRequest.resolvedAt, todayEnd.toISOString())
          ),
          and(
            gte(maintenanceRequest.createdAt, todayStart.toISOString()),
            lt(maintenanceRequest.createdAt, todayEnd.toISOString())
          )
        ),
        or(
          eq(asset.departmentId, deptId),
          userIds.length > 0 ? inArray(maintenanceRequest.raisedByUserId, userIds) : sql`false`
        )
      )
    )

  const [bookingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resourceBooking)
    .where(
      and(
        or(
          eq(resourceBooking.status, "Ongoing"),
          and(
            eq(resourceBooking.status, "Upcoming"),
            lt(resourceBooking.startTime, nowStr),
            gte(resourceBooking.endTime, nowStr)
          )
        ),
        or(
          eq(resourceBooking.bookedForDepartmentId, deptId),
          userIds.length > 0 ? inArray(resourceBooking.bookedByUserId, userIds) : sql`false`
        )
      )
    )

  const [transferCount] = await db
    .select({ count: sql<number>`count(distinct ${transferRequest.id})::int` })
    .from(transferRequest)
    .innerJoin(asset, eq(transferRequest.assetId, asset.id))
    .where(
      and(
        eq(transferRequest.status, "Requested"),
        or(
          eq(asset.departmentId, deptId),
          userIds.length > 0 ? inArray(transferRequest.requestedByUserId, userIds) : sql`false`,
          eq(transferRequest.requestedToDepartmentId, deptId),
          empIds.length > 0 ? inArray(transferRequest.requestedToEmployeeId, empIds) : sql`false`
        )
      )
    )

  const [repairCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)
    .where(and(eq(asset.status, "Under Maintenance"), eq(asset.departmentId, deptId)))

  const [totalCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)
    .where(eq(asset.departmentId, deptId))

  const overdueList = await db
    .select({
      id: assetAllocation.id,
      assetId: assetAllocation.assetId,
      assetName: asset.name,
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber,
      targetType: assetAllocation.targetType,
      employeeName: employee.name,
      departmentName: department.name,
      expectedReturnDate: assetAllocation.expectedReturnDate,
    })
    .from(assetAllocation)
    .innerJoin(asset, eq(assetAllocation.assetId, asset.id))
    .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
    .leftJoin(department, eq(assetAllocation.departmentId, department.id))
    .where(
      and(
        eq(assetAllocation.status, "Active"),
        lt(assetAllocation.expectedReturnDate, todayDateStr),
        or(
          eq(assetAllocation.departmentId, deptId),
          empIds.length > 0 ? inArray(assetAllocation.employeeId, empIds) : sql`false`
        )
      )
    )
    .orderBy(assetAllocation.expectedReturnDate)

  const overdueReturnsList: ReturnDetail[] = overdueList.map(item => {
    const expDate = new Date(item.expectedReturnDate!)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = Math.abs(today.getTime() - expDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return {
      allocationId: item.id,
      assetId: item.assetId,
      assetName: item.assetName,
      assetTag: item.assetTag,
      serialNumber: item.serialNumber,
      targetType: item.targetType,
      assignedToName: item.targetType === "Employee" ? (item.employeeName || "Unknown Employee") : (item.departmentName || "Unknown Department"),
      expectedReturnDate: item.expectedReturnDate!,
      daysOverdue: diffDays,
    }
  })

  const upcomingList = await db
    .select({
      id: assetAllocation.id,
      assetId: assetAllocation.assetId,
      assetName: asset.name,
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber,
      targetType: assetAllocation.targetType,
      employeeName: employee.name,
      departmentName: department.name,
      expectedReturnDate: assetAllocation.expectedReturnDate,
    })
    .from(assetAllocation)
    .innerJoin(asset, eq(assetAllocation.assetId, asset.id))
    .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
    .leftJoin(department, eq(assetAllocation.departmentId, department.id))
    .where(
      and(
        eq(assetAllocation.status, "Active"),
        gte(assetAllocation.expectedReturnDate, todayDateStr),
        or(
          eq(assetAllocation.departmentId, deptId),
          empIds.length > 0 ? inArray(assetAllocation.employeeId, empIds) : sql`false`
        )
      )
    )
    .orderBy(assetAllocation.expectedReturnDate)
    .limit(10)

  const upcomingReturnsList: ReturnDetail[] = upcomingList.map(item => ({
    allocationId: item.id,
    assetId: item.assetId,
    assetName: item.assetName,
    assetTag: item.assetTag,
    serialNumber: item.serialNumber,
    targetType: item.targetType,
    assignedToName: item.targetType === "Employee" ? (item.employeeName || "Unknown Employee") : (item.departmentName || "Unknown Department"),
    expectedReturnDate: item.expectedReturnDate!,
  }))

  const recentActivities = await getDeptHeadRecentActivities(deptId, db)

  return {
    role: "Department Head",
    departmentName: resolvedDeptName,
    kpis: {
      assetsAvailable: availCount?.count || 0,
      assetsAllocated: allocCount?.count || 0,
      maintenanceToday: maintCount?.count || 0,
      activeBookings: bookingCount?.count || 0,
      pendingTransfers: transferCount?.count || 0,
      upcomingReturns: upcomingReturnsList.length,
      overdueReturns: overdueReturnsList.length,
      totalAssets: totalCount?.count || 0,
      inRepair: repairCount?.count || 0,
    },
    overdueReturnsList,
    upcomingReturnsList,
    recentActivities,
  }
}

/**
 * Personalized snapshot for an Employee
 */
async function getEmployeeSnapshot(userId: string, emp: any, db: DrizzleDb): Promise<DashboardData> {
  const todayDateStr = new Date().toISOString().split("T")[0]
  const nowStr = new Date().toISOString()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const employeeId = emp?.id || "00000000-0000-0000-0000-000000000000"

  const [availCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)
    .where(eq(asset.status, "Available"))

  const [allocCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assetAllocation)
    .where(
      and(
        eq(assetAllocation.employeeId, employeeId),
        eq(assetAllocation.status, "Active")
      )
    )

  const [maintCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(maintenanceRequest)
    .where(
      and(
        eq(maintenanceRequest.raisedByUserId, userId),
        or(
          inArray(maintenanceRequest.status, ["Pending", "Approved", "Technician Assigned", "In Progress"]),
          and(
            gte(maintenanceRequest.resolvedAt, todayStart.toISOString()),
            lt(maintenanceRequest.resolvedAt, todayEnd.toISOString())
          ),
          and(
            gte(maintenanceRequest.createdAt, todayStart.toISOString()),
            lt(maintenanceRequest.createdAt, todayEnd.toISOString())
          )
        )
      )
    )

  const [bookingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resourceBooking)
    .where(
      and(
        eq(resourceBooking.bookedByUserId, userId),
        or(
          eq(resourceBooking.status, "Ongoing"),
          and(
            eq(resourceBooking.status, "Upcoming"),
            lt(resourceBooking.startTime, nowStr),
            gte(resourceBooking.endTime, nowStr)
          )
        )
      )
    )

  const [transferCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transferRequest)
    .where(
      and(
        eq(transferRequest.requestedByUserId, userId),
        eq(transferRequest.status, "Requested")
      )
    )

  const [repairCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)
    .where(eq(asset.status, "Under Maintenance"))

  const [totalCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(asset)

  const overdueList = await db
    .select({
      id: assetAllocation.id,
      assetId: assetAllocation.assetId,
      assetName: asset.name,
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber,
      targetType: assetAllocation.targetType,
      expectedReturnDate: assetAllocation.expectedReturnDate,
    })
    .from(assetAllocation)
    .innerJoin(asset, eq(assetAllocation.assetId, asset.id))
    .where(
      and(
        eq(assetAllocation.employeeId, employeeId),
        eq(assetAllocation.status, "Active"),
        lt(assetAllocation.expectedReturnDate, todayDateStr)
      )
    )
    .orderBy(assetAllocation.expectedReturnDate)

  const overdueReturnsList: ReturnDetail[] = overdueList.map(item => {
    const expDate = new Date(item.expectedReturnDate!)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = Math.abs(today.getTime() - expDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return {
      allocationId: item.id,
      assetId: item.assetId,
      assetName: item.assetName,
      assetTag: item.assetTag,
      serialNumber: item.serialNumber,
      targetType: item.targetType,
      assignedToName: emp?.name || "Self",
      expectedReturnDate: item.expectedReturnDate!,
      daysOverdue: diffDays,
    }
  })

  const upcomingList = await db
    .select({
      id: assetAllocation.id,
      assetId: assetAllocation.assetId,
      assetName: asset.name,
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber,
      targetType: assetAllocation.targetType,
      expectedReturnDate: assetAllocation.expectedReturnDate,
    })
    .from(assetAllocation)
    .innerJoin(asset, eq(assetAllocation.assetId, asset.id))
    .where(
      and(
        eq(assetAllocation.employeeId, employeeId),
        eq(assetAllocation.status, "Active"),
        gte(assetAllocation.expectedReturnDate, todayDateStr)
      )
    )
    .orderBy(assetAllocation.expectedReturnDate)
    .limit(10)

  const upcomingReturnsList: ReturnDetail[] = upcomingList.map(item => ({
    allocationId: item.id,
    assetId: item.assetId,
    assetName: item.assetName,
    assetTag: item.assetTag,
    serialNumber: item.serialNumber,
    targetType: item.targetType,
    assignedToName: emp?.name || "Self",
    expectedReturnDate: item.expectedReturnDate!,
  }))

  const recentActivities = await getEmployeeRecentActivities(userId, employeeId, db)

  return {
    role: "Employee",
    kpis: {
      assetsAvailable: availCount?.count || 0,
      assetsAllocated: allocCount?.count || 0,
      maintenanceToday: maintCount?.count || 0,
      activeBookings: bookingCount?.count || 0,
      pendingTransfers: transferCount?.count || 0,
      upcomingReturns: upcomingReturnsList.length,
      overdueReturns: overdueReturnsList.length,
      totalAssets: totalCount?.count || 0,
      inRepair: repairCount?.count || 0,
    },
    overdueReturnsList,
    upcomingReturnsList,
    recentActivities,
  }
}

/**
 * Get operational snapshot for a user based on their roles and department
 */
export async function getDashboardSnapshot(userId: string, roles: string[], db: DrizzleDb): Promise<DashboardData> {
  const isAdminOrManager = roles.includes("Admin") || roles.includes("Asset Manager")
  const isDeptHead = roles.includes("Department Head")
  
  const empArr = await db
    .select()
    .from(employee)
    .where(eq(employee.userId, userId))
    .limit(1)
  
  const userEmployee = empArr[0] || null

  if (isAdminOrManager) {
    return getAdminSnapshot(db)
  }

  if (isDeptHead) {
    const deptArr = await db
      .select()
      .from(department)
      .where(and(eq(department.headUserId, userId), eq(department.status, "Active")))
      .limit(1)
    
    const dept = deptArr[0] || null
    const deptId = dept ? dept.id : (userEmployee?.departmentId || null)
    const deptName = dept ? dept.name : null

    if (deptId) {
      return getDepartmentHeadSnapshot(deptId, deptName, db)
    }
  }

  return getEmployeeSnapshot(userId, userEmployee, db)
}

async function getRecentActivities(db: DrizzleDb): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = []

  // 1. Get allocations
  const allocs = await db
    .select({
      id: assetAllocation.id,
      assetName: asset.name,
      assetTag: asset.assetTag,
      targetType: assetAllocation.targetType,
      employeeName: employee.name,
      departmentName: department.name,
      createdAt: assetAllocation.createdAt,
    })
    .from(assetAllocation)
    .innerJoin(asset, eq(assetAllocation.assetId, asset.id))
    .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
    .leftJoin(department, eq(assetAllocation.departmentId, department.id))
    .orderBy(sql`${assetAllocation.createdAt} DESC`)
    .limit(5)

  for (const item of allocs) {
    const target = item.targetType === "Employee" 
      ? (item.employeeName || "Unknown Employee") 
      : (item.departmentName || "Unknown Department")
    activities.push({
      id: item.id,
      type: 'allocation',
      title: `${item.assetName} (${item.assetTag})`,
      description: `allocated to ${target}`,
      timestamp: item.createdAt,
    })
  }

  // 2. Get bookings
  const bookings = await db
    .select({
      id: resourceBooking.id,
      assetName: asset.name,
      assetTag: asset.assetTag,
      startTime: resourceBooking.startTime,
      endTime: resourceBooking.endTime,
      createdAt: resourceBooking.createdAt,
    })
    .from(resourceBooking)
    .innerJoin(asset, eq(resourceBooking.assetId, asset.id))
    .orderBy(sql`${resourceBooking.createdAt} DESC`)
    .limit(5)

  for (const item of bookings) {
    const startStr = new Date(item.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    const endStr = new Date(item.endTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    activities.push({
      id: item.id,
      type: 'booking',
      title: `${item.assetName} (${item.assetTag})`,
      description: `booking confirmed - ${startStr} to ${endStr}`,
      timestamp: item.createdAt,
    })
  }

  // 3. Get maintenance
  const maintRequests = await db
    .select({
      id: maintenanceRequest.id,
      assetName: asset.name,
      assetTag: asset.assetTag,
      issue: maintenanceRequest.issueDescription,
      status: maintenanceRequest.status,
      createdAt: maintenanceRequest.createdAt,
    })
    .from(maintenanceRequest)
    .innerJoin(asset, eq(maintenanceRequest.assetId, asset.id))
    .orderBy(sql`${maintenanceRequest.createdAt} DESC`)
    .limit(5)

  for (const item of maintRequests) {
    activities.push({
      id: item.id,
      type: 'maintenance',
      title: `${item.assetName} (${item.assetTag})`,
      description: `maintenance ticket ${item.status.toLowerCase()} (${item.issue})`,
      timestamp: item.createdAt,
    })
  }

  // 4. Get audit cycles
  const cycles = await db
    .select({
      id: auditCycle.id,
      name: auditCycle.name,
      status: auditCycle.status,
      createdAt: auditCycle.createdAt,
    })
    .from(auditCycle)
    .orderBy(sql`${auditCycle.createdAt} DESC`)
    .limit(3)

  for (const cycle of cycles) {
    activities.push({
      id: cycle.id,
      type: 'audit',
      title: cycle.name,
      description: `audit cycle ${cycle.status.toLowerCase()}`,
      timestamp: cycle.createdAt,
    })
  }

  // 5. Get flagged audit items
  const flagged = await db
    .select({
      id: auditItem.id,
      result: auditItem.result,
      assetName: asset.name,
      assetTag: asset.assetTag,
      createdAt: auditItem.createdAt,
    })
    .from(auditItem)
    .innerJoin(asset, eq(auditItem.assetId, asset.id))
    .where(or(eq(auditItem.result, "Missing"), eq(auditItem.result, "Damaged")))
    .orderBy(sql`${auditItem.createdAt} DESC`)
    .limit(3)

  for (const item of flagged) {
    activities.push({
      id: item.id,
      type: 'audit',
      title: `${item.assetName} (${item.assetTag})`,
      description: `flagged as ${item.result.toLowerCase()} during audit`,
      timestamp: item.createdAt,
    })
  }

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
}

async function getDeptHeadRecentActivities(deptId: string, db: DrizzleDb): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = []

  const allocs = await db
    .select({
      id: assetAllocation.id,
      assetName: asset.name,
      assetTag: asset.assetTag,
      targetType: assetAllocation.targetType,
      employeeName: employee.name,
      departmentName: department.name,
      createdAt: assetAllocation.createdAt,
    })
    .from(assetAllocation)
    .innerJoin(asset, eq(assetAllocation.assetId, asset.id))
    .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
    .leftJoin(department, eq(assetAllocation.departmentId, department.id))
    .where(eq(asset.departmentId, deptId))
    .orderBy(sql`${assetAllocation.createdAt} DESC`)
    .limit(5)

  for (const item of allocs) {
    const target = item.targetType === "Employee" 
      ? (item.employeeName || "Unknown Employee") 
      : (item.departmentName || "Unknown Department")
    activities.push({
      id: item.id,
      type: 'allocation',
      title: `${item.assetName} (${item.assetTag})`,
      description: `allocated to ${target}`,
      timestamp: item.createdAt,
    })
  }

  const bookings = await db
    .select({
      id: resourceBooking.id,
      assetName: asset.name,
      assetTag: asset.assetTag,
      startTime: resourceBooking.startTime,
      endTime: resourceBooking.endTime,
      createdAt: resourceBooking.createdAt,
    })
    .from(resourceBooking)
    .innerJoin(asset, eq(resourceBooking.assetId, asset.id))
    .where(eq(resourceBooking.bookedForDepartmentId, deptId))
    .orderBy(sql`${resourceBooking.createdAt} DESC`)
    .limit(5)

  for (const item of bookings) {
    const startStr = new Date(item.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    const endStr = new Date(item.endTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    activities.push({
      id: item.id,
      type: 'booking',
      title: `${item.assetName} (${item.assetTag})`,
      description: `booking confirmed - ${startStr} to ${endStr}`,
      timestamp: item.createdAt,
    })
  }

  const maintRequests = await db
    .select({
      id: maintenanceRequest.id,
      assetName: asset.name,
      assetTag: asset.assetTag,
      issue: maintenanceRequest.issueDescription,
      status: maintenanceRequest.status,
      createdAt: maintenanceRequest.createdAt,
    })
    .from(maintenanceRequest)
    .innerJoin(asset, eq(maintenanceRequest.assetId, asset.id))
    .where(eq(asset.departmentId, deptId))
    .orderBy(sql`${maintenanceRequest.createdAt} DESC`)
    .limit(5)

  for (const item of maintRequests) {
    activities.push({
      id: item.id,
      type: 'maintenance',
      title: `${item.assetName} (${item.assetTag})`,
      description: `maintenance ticket ${item.status.toLowerCase()} (${item.issue})`,
      timestamp: item.createdAt,
    })
  }

  // Audit cycles (org-wide, limited)
  const cycles = await db
    .select({
      id: auditCycle.id,
      name: auditCycle.name,
      status: auditCycle.status,
      createdAt: auditCycle.createdAt,
    })
    .from(auditCycle)
    .orderBy(sql`${auditCycle.createdAt} DESC`)
    .limit(3)

  for (const cycle of cycles) {
    activities.push({
      id: cycle.id,
      type: 'audit',
      title: cycle.name,
      description: `audit cycle ${cycle.status.toLowerCase()}`,
      timestamp: cycle.createdAt,
    })
  }

  // Flagged items in this department
  const flagged = await db
    .select({
      id: auditItem.id,
      result: auditItem.result,
      assetName: asset.name,
      assetTag: asset.assetTag,
      createdAt: auditItem.createdAt,
    })
    .from(auditItem)
    .innerJoin(asset, eq(auditItem.assetId, asset.id))
    .where(
      and(
        or(eq(auditItem.result, "Missing"), eq(auditItem.result, "Damaged")),
        eq(asset.departmentId, deptId)
      )
    )
    .orderBy(sql`${auditItem.createdAt} DESC`)
    .limit(3)

  for (const item of flagged) {
    activities.push({
      id: item.id,
      type: 'audit',
      title: `${item.assetName} (${item.assetTag})`,
      description: `flagged as ${item.result.toLowerCase()} during audit`,
      timestamp: item.createdAt,
    })
  }

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
}

async function getEmployeeRecentActivities(userId: string, employeeId: string, db: DrizzleDb): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = []

  const allocs = await db
    .select({
      id: assetAllocation.id,
      assetName: asset.name,
      assetTag: asset.assetTag,
      createdAt: assetAllocation.createdAt,
    })
    .from(assetAllocation)
    .innerJoin(asset, eq(assetAllocation.assetId, asset.id))
    .where(eq(assetAllocation.employeeId, employeeId))
    .orderBy(sql`${assetAllocation.createdAt} DESC`)
    .limit(5)

  for (const item of allocs) {
    activities.push({
      id: item.id,
      type: 'allocation',
      title: `${item.assetName} (${item.assetTag})`,
      description: `allocated to you`,
      timestamp: item.createdAt,
    })
  }

  const bookings = await db
    .select({
      id: resourceBooking.id,
      assetName: asset.name,
      assetTag: asset.assetTag,
      startTime: resourceBooking.startTime,
      endTime: resourceBooking.endTime,
      createdAt: resourceBooking.createdAt,
    })
    .from(resourceBooking)
    .innerJoin(asset, eq(resourceBooking.assetId, asset.id))
    .where(eq(resourceBooking.bookedByUserId, userId))
    .orderBy(sql`${resourceBooking.createdAt} DESC`)
    .limit(5)

  for (const item of bookings) {
    const startStr = new Date(item.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    const endStr = new Date(item.endTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    activities.push({
      id: item.id,
      type: 'booking',
      title: `${item.assetName} (${item.assetTag})`,
      description: `booking confirmed - ${startStr} to ${endStr}`,
      timestamp: item.createdAt,
    })
  }

  const maintRequests = await db
    .select({
      id: maintenanceRequest.id,
      assetName: asset.name,
      assetTag: asset.assetTag,
      issue: maintenanceRequest.issueDescription,
      status: maintenanceRequest.status,
      createdAt: maintenanceRequest.createdAt,
    })
    .from(maintenanceRequest)
    .innerJoin(asset, eq(maintenanceRequest.assetId, asset.id))
    .where(eq(maintenanceRequest.raisedByUserId, userId))
    .orderBy(sql`${maintenanceRequest.createdAt} DESC`)
    .limit(5)

  for (const item of maintRequests) {
    activities.push({
      id: item.id,
      type: 'maintenance',
      title: `${item.assetName} (${item.assetTag})`,
      description: `maintenance ticket ${item.status.toLowerCase()} (${item.issue})`,
      timestamp: item.createdAt,
    })
  }

  // Audit cycles
  const cycles = await db
    .select({
      id: auditCycle.id,
      name: auditCycle.name,
      status: auditCycle.status,
      createdAt: auditCycle.createdAt,
    })
    .from(auditCycle)
    .orderBy(sql`${auditCycle.createdAt} DESC`)
    .limit(3)

  for (const cycle of cycles) {
    activities.push({
      id: cycle.id,
      type: 'audit',
      title: cycle.name,
      description: `audit cycle ${cycle.status.toLowerCase()}`,
      timestamp: cycle.createdAt,
    })
  }

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
}
