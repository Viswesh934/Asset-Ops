import { eq, and, ne, or, ilike, sql } from "drizzle-orm"
import { SupabaseClient } from "@supabase/supabase-js"
import { DrizzleDb } from "../db/connection"
import { extractStoragePath } from "./attachmentService"
import {
  asset,
  resourceBooking,
  notification,
  assetCategory,
  assetAllocation,
  assetAttachment,
  maintenanceRequest,
  employee,
  department,
  activityLog,
  userMaster
} from "../db/schema"

/**
 * Book a shared resource with overlap validation
 */
export async function bookResource(
  data: {
    assetId: string
    startTime: string
    endTime: string
    bookedForDepartmentId?: string | null
    employeeId?: string | null
  },
  userId: string,
  db: DrizzleDb
) {
  return await db.transaction(async (tx) => {
    const assetArr = await tx
      .select()
      .from(asset)
      .where(eq(asset.id, data.assetId))
      .limit(1)

    if (assetArr.length === 0) {
      throw new Error("Asset not found")
    }

    const selectedAsset = assetArr[0]
    if (!selectedAsset.isBookable) {
      throw new Error("Asset is not marked as a bookable/shared resource")
    }

    const start = new Date(data.startTime)
    const end = new Date(data.endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end time")
    }

    if (start >= end) {
      throw new Error("Start time must be before end time")
    }

    if (start.getTime() < Date.now() - 60000) {
      throw new Error("Cannot book slots in the past")
    }

    const existingBookings = await tx
      .select()
      .from(resourceBooking)
      .where(
        and(
          eq(resourceBooking.assetId, data.assetId),
          ne(resourceBooking.status, "Cancelled")
        )
      )

    const hasOverlap = existingBookings.some((booking) => {
      const bStart = new Date(booking.startTime)
      const bEnd = new Date(booking.endTime)
      return start < bEnd && end > bStart
    })

    if (hasOverlap) {
      throw new Error("Overlap validation failed: This resource is already booked during the requested timeslot")
    }

    const now = new Date()
    let status: "Upcoming" | "Ongoing" = "Upcoming"
    if (start <= now && end >= now) {
      status = "Ongoing"
    }

    // Resolve target userId if employeeId is specified
    let targetUserId = userId
    if (data.employeeId) {
      const empArr = await tx
        .select({ userId: employee.userId })
        .from(employee)
        .where(eq(employee.id, data.employeeId))
        .limit(1)
      if (empArr.length > 0) {
        targetUserId = empArr[0].userId
      }
    }

    const [newBooking] = await tx
      .insert(resourceBooking)
      .values({
        assetId: data.assetId,
        bookedByUserId: targetUserId,
        bookedForDepartmentId: data.bookedForDepartmentId || null,
        startTime: data.startTime,
        endTime: data.endTime,
        status,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()

    const friendlyStart = start.toLocaleString()
    const friendlyEnd = end.toLocaleString()
    await tx.insert(notification).values({
      userId: targetUserId,
      type: "Booking Confirmed",
      message: `Booking confirmed for ${selectedAsset.name} from ${friendlyStart} to ${friendlyEnd}.`,
      relatedEntityType: "resource_booking",
      relatedEntityId: newBooking.id,
      createdBy: userId,
    })

    return newBooking
  })
}

/**
 * List all bookable resources
 */
export async function listBookableResources(db: DrizzleDb) {
  return await db
    .select({
      id: asset.id,
      name: asset.name,
      assetTag: asset.assetTag,
      location: asset.location,
      status: asset.status,
    })
    .from(asset)
    .where(and(eq(asset.isBookable, true), ne(asset.status, "Retired"), ne(asset.status, "Disposed")))
}

/**
 * List all asset categories
 */
export async function listCategories(db: DrizzleDb) {
  return await db
    .select()
    .from(assetCategory)
    .where(eq(assetCategory.status, "Active"))
}

/**
 * List all assets with search/filters and enrichment of active allocations
 */
export async function listAssets(
  filters: {
    search?: string
    category?: string
    status?: string
    location?: string
  },
  db: DrizzleDb
) {
  const query = db
    .select({
      id: asset.id,
      assetTag: asset.assetTag,
      name: asset.name,
      categoryId: asset.categoryId,
      categoryName: assetCategory.name,
      serialNumber: asset.serialNumber,
      qrCode: asset.qrCode,
      acquisitionDate: asset.acquisitionDate,
      acquisitionCost: asset.acquisitionCost,
      condition: asset.condition,
      location: asset.location,
      departmentId: asset.departmentId,
      isBookable: asset.isBookable,
      status: asset.status,
    })
    .from(asset)
    .innerJoin(assetCategory, eq(asset.categoryId, assetCategory.id))

  const conditions = []

  if (filters.search) {
    conditions.push(
      or(
        ilike(asset.name, `%${filters.search}%`),
        ilike(asset.assetTag, `%${filters.search}%`),
        ilike(asset.serialNumber, `%${filters.search}%`)
      )
    )
  }

  if (filters.category && filters.category !== "All") {
    conditions.push(eq(assetCategory.name, filters.category))
  }

  if (filters.status && filters.status !== "All") {
    conditions.push(eq(asset.status, filters.status as any))
  }

  if (filters.location) {
    conditions.push(ilike(asset.location, `%${filters.location}%`))
  }

  const finalQuery = conditions.length > 0 ? query.where(and(...conditions)) : query
  const results = await finalQuery.orderBy(asset.assetTag)

  const enrichedResults = []
  for (const item of results) {
    let assignedTo = ""
    if (item.status === "Allocated") {
      const activeAlloc = await db
        .select({
          targetType: assetAllocation.targetType,
          employeeName: employee.name,
          departmentName: department.name,
        })
        .from(assetAllocation)
        .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
        .leftJoin(department, eq(assetAllocation.departmentId, department.id))
        .where(and(eq(assetAllocation.assetId, item.id), eq(assetAllocation.status, "Active")))
        .limit(1)

      if (activeAlloc[0]) {
        assignedTo = activeAlloc[0].targetType === "Employee"
          ? (activeAlloc[0].employeeName || "Employee")
          : (activeAlloc[0].departmentName || "Department")
      }
    }
    enrichedResults.push({
      ...item,
      serialNo: item.serialNumber || "",
      assignedTo: assignedTo,
      category: item.categoryName,
    })
  }

  return enrichedResults
}

/**
 * Get individual asset details with history and attachments
 */
export async function getAssetDetail(
  assetId: string,
  db: DrizzleDb,
  supabase?: SupabaseClient
) {
  const arr = await db
    .select({
      id: asset.id,
      assetTag: asset.assetTag,
      name: asset.name,
      categoryId: asset.categoryId,
      categoryName: assetCategory.name,
      serialNumber: asset.serialNumber,
      qrCode: asset.qrCode,
      acquisitionDate: asset.acquisitionDate,
      acquisitionCost: asset.acquisitionCost,
      condition: asset.condition,
      location: asset.location,
      departmentId: asset.departmentId,
      isBookable: asset.isBookable,
      status: asset.status,
    })
    .from(asset)
    .innerJoin(assetCategory, eq(asset.categoryId, assetCategory.id))
    .where(eq(asset.id, assetId))
    .limit(1)

  if (arr.length === 0) {
    throw new Error("Asset not found")
  }

  const item = arr[0]

  const activeAlloc = await db
    .select({
      id: assetAllocation.id,
      targetType: assetAllocation.targetType,
      employeeName: employee.name,
      departmentName: department.name,
      allocatedDate: assetAllocation.allocatedDate,
      expectedReturnDate: assetAllocation.expectedReturnDate,
    })
    .from(assetAllocation)
    .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
    .leftJoin(department, eq(assetAllocation.departmentId, department.id))
    .where(and(eq(assetAllocation.assetId, assetId), eq(assetAllocation.status, "Active")))
    .limit(1)

  const history = await db
    .select({
      id: assetAllocation.id,
      targetType: assetAllocation.targetType,
      employeeName: employee.name,
      departmentName: department.name,
      allocatedDate: assetAllocation.allocatedDate,
      actualReturnDate: assetAllocation.actualReturnDate,
      status: assetAllocation.status,
    })
    .from(assetAllocation)
    .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
    .leftJoin(department, eq(assetAllocation.departmentId, department.id))
    .where(eq(assetAllocation.assetId, assetId))
    .orderBy(sql`${assetAllocation.allocatedDate} DESC`)

  // Fetch attachments with signed download URLs
  const attachmentRows = await db
    .select()
    .from(assetAttachment)
    .where(eq(assetAttachment.assetId, assetId))
    .orderBy(sql`${assetAttachment.createdAt} DESC`)

  const attachments = await Promise.all(
    attachmentRows.map(async (row) => {
      let signedUrl: string | null = null
      if (supabase) {
        const storagePath = extractStoragePath(row.fileUrl)
        if (storagePath) {
          const { data, error } = await supabase.storage
            .from("Asset-Ops")
            .createSignedUrl(storagePath, 3600)
          if (!error) {
            signedUrl = data.signedUrl
          }
        }
      }
      return { ...row, signedUrl }
    })
  )

  // Fetch maintenance history
  const maintenanceHistory = await db
    .select({
      id: maintenanceRequest.id,
      issueDescription: maintenanceRequest.issueDescription,
      priority: maintenanceRequest.priority,
      status: maintenanceRequest.status,
      resolutionNotes: maintenanceRequest.resolutionNotes,
      raisedByUserName: userMaster.username,
      createdAt: maintenanceRequest.createdAt,
    })
    .from(maintenanceRequest)
    .leftJoin(userMaster, eq(maintenanceRequest.raisedByUserId, userMaster.id))
    .where(eq(maintenanceRequest.assetId, assetId))
    .orderBy(sql`${maintenanceRequest.createdAt} DESC`)

  return {
    ...item,
    serialNo: item.serialNumber || "",
    category: item.categoryName,
    activeAllocation: activeAlloc[0] || null,
    history,
    attachments,
    maintenanceHistory,
  }
}

/**
 * Register a new asset in the system
 */
export async function registerAsset(
  data: {
    name: string
    categoryId: string
    serialNumber?: string
    acquisitionDate?: string
    acquisitionCost?: number
    condition?: "New" | "Good" | "Fair" | "Poor" | "Damaged"
    location?: string
    departmentId?: string
    isBookable?: boolean
  },
  userId: string,
  db: DrizzleDb
) {
  const countRes = await db.select({ count: sql<number>`count(*)::int` }).from(asset)
  const nextNum = (countRes[0]?.count || 0) + 1
  const tag = `AF-${String(nextNum).padStart(4, "0")}`

  const [newAsset] = await db
    .insert(asset)
    .values({
      name: data.name,
      assetTag: tag,
      categoryId: data.categoryId,
      serialNumber: data.serialNumber || null,
      acquisitionDate: data.acquisitionDate || null,
      acquisitionCost: data.acquisitionCost ? String(data.acquisitionCost) : null,
      condition: data.condition || "Good",
      location: data.location || null,
      departmentId: data.departmentId || null,
      isBookable: data.isBookable || false,
      status: "Available",
      createdBy: userId,
      updatedBy: userId,
    })
    .returning()

  await db.insert(activityLog).values({
    actorUserId: userId,
    action: "REGISTER_ASSET",
    entityType: "asset",
    entityId: newAsset.id,
    details: JSON.stringify({ name: newAsset.name, assetTag: newAsset.assetTag }),
    createdBy: userId,
  })

  return newAsset
}

/**
 * List all resource bookings with optional filters
 */
export async function listBookings(
  filters: { assetId?: string; date?: string },
  db: DrizzleDb
) {
  const query = db
    .select({
      id: resourceBooking.id,
      assetId: resourceBooking.assetId,
      resource: asset.name,
      user: employee.name,
      date: sql`to_char(${resourceBooking.startTime} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')`,
      startStr: sql`to_char(${resourceBooking.startTime} AT TIME ZONE 'Asia/Kolkata', 'HH12:MI AM')`,
      endStr: sql`to_char(${resourceBooking.endTime} AT TIME ZONE 'Asia/Kolkata', 'HH12:MI AM')`,
      status: resourceBooking.status,
      cancelledReason: resourceBooking.cancelledReason,
    })
    .from(resourceBooking)
    .innerJoin(asset, eq(resourceBooking.assetId, asset.id))
    .leftJoin(employee, eq(resourceBooking.bookedByUserId, employee.userId))

  const conditions = []
  if (filters.assetId) {
    conditions.push(eq(resourceBooking.assetId, filters.assetId))
  }
  if (filters.date) {
    conditions.push(sql`date(${resourceBooking.startTime} AT TIME ZONE 'Asia/Kolkata') = ${filters.date}`)
  }

  const results = conditions.length > 0 ? await query.where(and(...conditions)) : await query

  return results.map(r => {
    return {
      id: r.id,
      resource: r.resource,
      user: r.user || "System User",
      date: r.date as string,
      timeSlot: `${r.startStr} - ${r.endStr}`,
      status: r.status
    }
  })
}

/**
 * Reschedule booking with overlap check
 */
export async function rescheduleBooking(
  bookingId: string,
  data: { startTime: string; endTime: string },
  userId: string,
  db: DrizzleDb
) {
  return await db.transaction(async (tx) => {
    const bookingArr = await tx
      .select()
      .from(resourceBooking)
      .where(eq(resourceBooking.id, bookingId))
      .limit(1)

    if (bookingArr.length === 0) {
      throw new Error("Booking not found")
    }

    const booking = bookingArr[0]
    const start = new Date(data.startTime)
    const end = new Date(data.endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end time")
    }
    if (start >= end) {
      throw new Error("Start time must be before end time")
    }

    if (start.getTime() < Date.now() - 60000) {
      throw new Error("Cannot book slots in the past")
    }

    // Check overlap excluding self
    const existing = await tx
      .select()
      .from(resourceBooking)
      .where(
        and(
          eq(resourceBooking.assetId, booking.assetId),
          ne(resourceBooking.status, "Cancelled"),
          ne(resourceBooking.id, bookingId)
        )
      )

    const hasOverlap = existing.some((b) => {
      const bStart = new Date(b.startTime)
      const bEnd = new Date(b.endTime)
      return start < bEnd && end > bStart
    })

    if (hasOverlap) {
      throw new Error("Overlap validation failed: This resource is already booked during the requested timeslot")
    }

    const now = new Date()
    let status: "Upcoming" | "Ongoing" = "Upcoming"
    if (start <= now && end >= now) {
      status = "Ongoing"
    }

    const [updated] = await tx
      .update(resourceBooking)
      .set({
        startTime: data.startTime,
        endTime: data.endTime,
        status,
        updatedBy: userId,
        updatedAt: sql`now()`,
      })
      .where(eq(resourceBooking.id, bookingId))
      .returning()

    return updated
  })
}

/**
 * Cancel a booking slot
 */
export async function cancelBooking(
  bookingId: string,
  cancelledReason: string | undefined,
  userId: string,
  db: DrizzleDb
) {
  const [updated] = await db
    .update(resourceBooking)
    .set({
      status: "Cancelled",
      cancelledReason: cancelledReason || null,
      updatedBy: userId,
      updatedAt: sql`now()`,
    })
    .where(eq(resourceBooking.id, bookingId))
    .returning()

  if (!updated) {
    throw new Error("Booking not found")
  }
  return updated
}

/**
 * Update Booking status (Ongoing, Completed, etc.)
 */
export async function updateBookingStatus(
  bookingId: string,
  status: "Upcoming" | "Ongoing" | "Completed",
  userId: string,
  db: DrizzleDb
) {
  const [updated] = await db
    .update(resourceBooking)
    .set({
      status,
      updatedBy: userId,
      updatedAt: sql`now()`,
    })
    .where(eq(resourceBooking.id, bookingId))
    .returning()

  if (!updated) {
    throw new Error("Booking not found")
  }
  return updated
}


