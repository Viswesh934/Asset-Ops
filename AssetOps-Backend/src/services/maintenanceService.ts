import { eq, and, sql } from "drizzle-orm"
import { DrizzleDb } from "../db/connection"
import {
  asset,
  maintenanceRequest,
  employee,
  notification,
  activityLog,
} from "../db/schema"

/**
 * List all maintenance requests.
 * Admins and Asset Managers see all. Employees see their own.
 */
export async function listMaintenanceRequests(userId: string, roles: string[], db: DrizzleDb) {
  const isAdminOrManager = roles.includes("Admin") || roles.includes("Asset Manager")

  const query = db
    .select({
      id: maintenanceRequest.id,
      assetId: maintenanceRequest.assetId,
      assetName: asset.name,
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber,
      location: asset.location,
      raisedByUserId: maintenanceRequest.raisedByUserId,
      raisedByName: employee.name,
      issueDescription: maintenanceRequest.issueDescription,
      priority: maintenanceRequest.priority,
      photoUrl: maintenanceRequest.photoUrl,
      status: maintenanceRequest.status,
      approvedByUserId: maintenanceRequest.approvedByUserId,
      approvedAt: maintenanceRequest.approvedAt,
      rejectionReason: maintenanceRequest.rejectionReason,
      technicianName: maintenanceRequest.technicianName,
      technicianAssignedAt: maintenanceRequest.technicianAssignedAt,
      resolvedAt: maintenanceRequest.resolvedAt,
      resolutionNotes: maintenanceRequest.resolutionNotes,
      createdAt: maintenanceRequest.createdAt,
    })
    .from(maintenanceRequest)
    .innerJoin(asset, eq(maintenanceRequest.assetId, asset.id))
    .leftJoin(employee, eq(maintenanceRequest.raisedByUserId, employee.userId))

  if (!isAdminOrManager) {
    return await query
      .where(eq(maintenanceRequest.raisedByUserId, userId))
      .orderBy(sql`${maintenanceRequest.createdAt} DESC`)
  } else {
    return await query.orderBy(sql`${maintenanceRequest.createdAt} DESC`)
  }
}

/**
 * Raise a new maintenance request
 */
export async function createMaintenanceRequest(
  data: {
    assetId: string
    issueDescription: string
    priority: "Low" | "Medium" | "High" | "Critical"
    photoUrl?: string | null
  },
  userId: string,
  db: DrizzleDb
) {
  const assets = await db.select().from(asset).where(eq(asset.id, data.assetId)).limit(1)
  if (assets.length === 0) {
    throw new Error("Asset not found")
  }

  const [newRequest] = await db
    .insert(maintenanceRequest)
    .values({
      assetId: data.assetId,
      raisedByUserId: userId,
      issueDescription: data.issueDescription,
      priority: data.priority,
      photoUrl: data.photoUrl || null,
      status: "Pending",
      createdBy: userId,
      updatedBy: userId,
    })
    .returning()

  await db.insert(activityLog).values({
    actorUserId: userId,
    action: "RAISED_MAINTENANCE",
    entityType: "maintenance_request",
    entityId: newRequest.id,
    details: JSON.stringify({ assetId: data.assetId, priority: data.priority }),
    createdBy: userId,
  })

  return newRequest
}

/**
 * Approve a maintenance request (Asset Manager / Admin only)
 */
export async function approveMaintenanceRequest(id: string, userId: string, db: DrizzleDb) {
  return await db.transaction(async (tx) => {
    const requests = await tx.select().from(maintenanceRequest).where(eq(maintenanceRequest.id, id)).limit(1)
    if (requests.length === 0) {
      throw new Error("Maintenance request not found")
    }

    const requestObj = requests[0]
    if (requestObj.status !== "Pending") {
      throw new Error(`Cannot approve request in ${requestObj.status} status`)
    }

    // 1. Update request status to Approved
    await tx
      .update(maintenanceRequest)
      .set({
        status: "Approved",
        approvedByUserId: userId,
        approvedAt: sql`now()`,
        updatedBy: userId,
        updatedAt: sql`now()`,
      })
      .where(eq(maintenanceRequest.id, id))

    // 2. Update asset status to "Under Maintenance"
    await tx
      .update(asset)
      .set({
        status: "Under Maintenance",
        updatedBy: userId,
        updatedAt: sql`now()`,
      })
      .where(eq(asset.id, requestObj.assetId))

    // 3. Send Notification to the user who raised it
    const targetAsset = await tx.select().from(asset).where(eq(asset.id, requestObj.assetId)).limit(1)
    const assetName = targetAsset[0]?.name || "Asset"

    await tx.insert(notification).values({
      userId: requestObj.raisedByUserId,
      type: "Maintenance Approved",
      message: `Maintenance ticket for ${assetName} has been approved.`,
      relatedEntityType: "maintenance_request",
      relatedEntityId: id,
      createdBy: userId,
    })

    // 4. Activity Log
    await tx.insert(activityLog).values({
      actorUserId: userId,
      action: "APPROVED_MAINTENANCE",
      entityType: "maintenance_request",
      entityId: id,
      details: JSON.stringify({ assetId: requestObj.assetId }),
      createdBy: userId,
    })

    return { success: true }
  })
}

/**
 * Reject a maintenance request (Asset Manager / Admin only)
 */
export async function rejectMaintenanceRequest(
  id: string,
  rejectionReason: string,
  userId: string,
  db: DrizzleDb
) {
  return await db.transaction(async (tx) => {
    const requests = await tx.select().from(maintenanceRequest).where(eq(maintenanceRequest.id, id)).limit(1)
    if (requests.length === 0) {
      throw new Error("Maintenance request not found")
    }

    const requestObj = requests[0]
    if (requestObj.status !== "Pending") {
      throw new Error(`Cannot reject request in ${requestObj.status} status`)
    }

    // 1. Update request status to Rejected
    await tx
      .update(maintenanceRequest)
      .set({
        status: "Rejected",
        rejectionReason,
        updatedBy: userId,
        updatedAt: sql`now()`,
      })
      .where(eq(maintenanceRequest.id, id))

    // 2. Send Notification
    const targetAsset = await tx.select().from(asset).where(eq(asset.id, requestObj.assetId)).limit(1)
    const assetName = targetAsset[0]?.name || "Asset"

    await tx.insert(notification).values({
      userId: requestObj.raisedByUserId,
      type: "Maintenance Rejected",
      message: `Maintenance ticket for ${assetName} was rejected: ${rejectionReason}`,
      relatedEntityType: "maintenance_request",
      relatedEntityId: id,
      createdBy: userId,
    })

    // 3. Activity Log
    await tx.insert(activityLog).values({
      actorUserId: userId,
      action: "REJECTED_MAINTENANCE",
      entityType: "maintenance_request",
      entityId: id,
      details: JSON.stringify({ assetId: requestObj.assetId, reason: rejectionReason }),
      createdBy: userId,
    })

    return { success: true }
  })
}

/**
 * Assign technician to maintenance request
 */
export async function assignTechnician(
  id: string,
  technicianName: string,
  userId: string,
  db: DrizzleDb
) {
  const requests = await db.select().from(maintenanceRequest).where(eq(maintenanceRequest.id, id)).limit(1)
  if (requests.length === 0) {
    throw new Error("Maintenance request not found")
  }

  const requestObj = requests[0]
  if (requestObj.status !== "Approved" && requestObj.status !== "Technician Assigned") {
    throw new Error(`Cannot assign technician in ${requestObj.status} status`)
  }

  await db
    .update(maintenanceRequest)
    .set({
      status: "Technician Assigned",
      technicianName,
      technicianAssignedAt: sql`now()`,
      updatedBy: userId,
      updatedAt: sql`now()`,
    })
    .where(eq(maintenanceRequest.id, id))

  await db.insert(activityLog).values({
    actorUserId: userId,
    action: "ASSIGNED_TECHNICIAN",
    entityType: "maintenance_request",
    entityId: id,
    details: JSON.stringify({ technicianName }),
    createdBy: userId,
  })

  return { success: true }
}

/**
 * Start work on maintenance request
 */
export async function startMaintenanceWork(id: string, userId: string, db: DrizzleDb) {
  const requests = await db.select().from(maintenanceRequest).where(eq(maintenanceRequest.id, id)).limit(1)
  if (requests.length === 0) {
    throw new Error("Maintenance request not found")
  }

  const requestObj = requests[0]
  if (requestObj.status !== "Technician Assigned") {
    throw new Error(`Cannot start work in ${requestObj.status} status`)
  }

  await db
    .update(maintenanceRequest)
    .set({
      status: "In Progress",
      updatedBy: userId,
      updatedAt: sql`now()`,
    })
    .where(eq(maintenanceRequest.id, id))

  await db.insert(activityLog).values({
    actorUserId: userId,
    action: "STARTED_MAINTENANCE_WORK",
    entityType: "maintenance_request",
    entityId: id,
    createdBy: userId,
  })

  return { success: true }
}

/**
 * Resolve maintenance request (updates asset status back to Available)
 */
export async function resolveMaintenanceRequest(
  id: string,
  resolutionNotes: string,
  userId: string,
  db: DrizzleDb
) {
  return await db.transaction(async (tx) => {
    const requests = await tx.select().from(maintenanceRequest).where(eq(maintenanceRequest.id, id)).limit(1)
    if (requests.length === 0) {
      throw new Error("Maintenance request not found")
    }

    const requestObj = requests[0]
    // Allow resolving if Approved, Assigned, or In Progress
    const validStatuses = ["Approved", "Technician Assigned", "In Progress"]
    if (!validStatuses.includes(requestObj.status)) {
      throw new Error(`Cannot resolve request in ${requestObj.status} status`)
    }

    // 1. Update request status to Resolved
    await tx
      .update(maintenanceRequest)
      .set({
        status: "Resolved",
        resolutionNotes,
        resolvedAt: sql`now()`,
        updatedBy: userId,
        updatedAt: sql`now()`,
      })
      .where(eq(maintenanceRequest.id, id))

    // 2. Reset asset to Available
    await tx
      .update(asset)
      .set({
        status: "Available",
        updatedBy: userId,
        updatedAt: sql`now()`,
      })
      .where(eq(asset.id, requestObj.assetId))

    // 3. Send Notification to the user who raised it
    const targetAsset = await tx.select().from(asset).where(eq(asset.id, requestObj.assetId)).limit(1)
    const assetName = targetAsset[0]?.name || "Asset"

    await tx.insert(notification).values({
      userId: requestObj.raisedByUserId,
      type: "Maintenance Approved",
      message: `Maintenance ticket for ${assetName} has been RESOLVED. Notes: ${resolutionNotes}`,
      relatedEntityType: "maintenance_request",
      relatedEntityId: id,
      createdBy: userId,
    })

    // 4. Activity Log
    await tx.insert(activityLog).values({
      actorUserId: userId,
      action: "RESOLVED_MAINTENANCE",
      entityType: "maintenance_request",
      entityId: id,
      details: JSON.stringify({ assetId: requestObj.assetId, notes: resolutionNotes }),
      createdBy: userId,
    })

    return { success: true }
  })
}
