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

export interface DashboardData {
  role: string
  departmentName?: string | null
  kpis: KPICards
  overdueReturnsList: ReturnDetail[]
  upcomingReturnsList: ReturnDetail[]
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
