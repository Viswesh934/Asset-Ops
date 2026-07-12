import { eq, and, sql } from "drizzle-orm"
import { DrizzleDb } from "../db/connection"
import {
  asset,
  assetAllocation,
  employee,
  department,
  transferRequest,
  userMaster,
  notification,
  activityLog,
} from "../db/schema"

/**
 * List all allocations with details on asset name, tags, and holder
 */
export async function listAllocations(db: DrizzleDb) {
  return await db
    .select({
      id: assetAllocation.id,
      assetId: assetAllocation.assetId,
      assetName: asset.name,
      assetTag: asset.assetTag,
      targetType: assetAllocation.targetType,
      employeeId: assetAllocation.employeeId,
      employeeName: employee.name,
      departmentId: assetAllocation.departmentId,
      departmentName: department.name,
      allocatedDate: assetAllocation.allocatedDate,
      expectedReturnDate: assetAllocation.expectedReturnDate,
      actualReturnDate: assetAllocation.actualReturnDate,
      returnConditionNotes: assetAllocation.returnConditionNotes,
      status: assetAllocation.status,
    })
    .from(assetAllocation)
    .innerJoin(asset, eq(assetAllocation.assetId, asset.id))
    .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
    .leftJoin(department, eq(assetAllocation.departmentId, department.id))
    .orderBy(sql`${assetAllocation.status} ASC`, sql`${assetAllocation.allocatedDate} DESC`)
}

/**
 * Allocate an available asset to an employee or a department
 */
export async function allocateAsset(
  data: {
    assetId: string
    targetType: "Employee" | "Department"
    employeeId?: string | null
    departmentId?: string | null
    expectedReturnDate?: string | null
  },
  userId: string,
  db: DrizzleDb
) {
  return await db.transaction(async (tx) => {
    // 1. Fetch asset details
    const assets = await tx.select().from(asset).where(eq(asset.id, data.assetId)).limit(1)
    if (assets.length === 0) {
      throw new Error("Asset not found")
    }
    const targetAsset = assets[0]

    // 2. Conflict Rule Check
    if (targetAsset.status !== "Available") {
      // Find who currently holds it
      const activeAllocations = await tx
        .select({
          id: assetAllocation.id,
          employeeName: employee.name,
          departmentName: department.name,
        })
        .from(assetAllocation)
        .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
        .leftJoin(department, eq(assetAllocation.departmentId, department.id))
        .where(and(eq(assetAllocation.assetId, data.assetId), eq(assetAllocation.status, "Active")))
        .limit(1)

      const holderName = activeAllocations[0]
        ? (activeAllocations[0].employeeName || activeAllocations[0].departmentName || "another team")
        : "another user"

      throw new Error(`Asset is already allocated: currently held by ${holderName}`)
    }

    // 3. Create allocation entry
    const [newAlloc] = await tx
      .insert(assetAllocation)
      .values({
        assetId: data.assetId,
        targetType: data.targetType,
        employeeId: data.employeeId || null,
        departmentId: data.departmentId || null,
        allocatedDate: new Date().toISOString().split("T")[0],
        expectedReturnDate: data.expectedReturnDate || null,
        status: "Active",
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()

    // 4. Update asset status to Allocated
    await tx
      .update(asset)
      .set({
        status: "Allocated",
        updatedBy: userId,
        updatedAt: sql`now()`,
      })
      .where(eq(asset.id, data.assetId))

    // 5. Send Notification
    let recipientUserId = null
    if (data.targetType === "Employee" && data.employeeId) {
      const emps = await tx.select({ userId: employee.userId }).from(employee).where(eq(employee.id, data.employeeId)).limit(1)
      if (emps.length > 0) recipientUserId = emps[0].userId
    }

    if (recipientUserId) {
      await tx.insert(notification).values({
        userId: recipientUserId,
        type: "Asset Assigned",
        message: `Asset ${targetAsset.name} (${targetAsset.assetTag}) has been allocated to you. Expected return: ${data.expectedReturnDate || "N/A"}`,
        relatedEntityType: "asset_allocation",
        relatedEntityId: newAlloc.id,
        createdBy: userId,
      })
    }

    // 6. Write Activity Log
    await tx.insert(activityLog).values({
      actorUserId: userId,
      action: "ALLOCATE_ASSET",
      entityType: "asset_allocation",
      entityId: newAlloc.id,
      details: JSON.stringify({ assetId: data.assetId, targetType: data.targetType }),
      createdBy: userId,
    })

    return newAlloc
  })
}

/**
 * Return an allocated asset, record condition notes, and reset asset status to Available
 */
export async function returnAsset(
  allocationId: string,
  data: { returnConditionNotes?: string; condition?: string },
  userId: string,
  db: DrizzleDb
) {
  return await db.transaction(async (tx) => {
    // 1. Fetch active allocation
    const allocs = await tx.select().from(assetAllocation).where(eq(assetAllocation.id, allocationId)).limit(1)
    if (allocs.length === 0) {
      throw new Error("Allocation record not found")
    }
    const alloc = allocs[0]
    if (alloc.status === "Returned") {
      throw new Error("Asset has already been returned")
    }

    // 2. Mark allocation Returned
    await tx
      .update(assetAllocation)
      .set({
        status: "Returned",
        actualReturnDate: new Date().toISOString().split("T")[0],
        returnConditionNotes: data.returnConditionNotes || null,
        updatedBy: userId,
        updatedAt: sql`now()`,
      })
      .where(eq(assetAllocation.id, allocationId))

    // 3. Reset asset to Available
    const assetUpdate: any = {
      status: "Available",
      updatedBy: userId,
      updatedAt: sql`now()`,
    }
    if (data.condition) {
      assetUpdate.condition = data.condition
    }

    await tx.update(asset).set(assetUpdate).where(eq(asset.id, alloc.assetId))

    const targetAsset = await tx.select().from(asset).where(eq(asset.id, alloc.assetId)).limit(1).then(r => r[0])

    // 4. Send Return Notification to employee
    if (alloc.employeeId) {
      const emps = await tx.select().from(employee).where(eq(employee.id, alloc.employeeId)).limit(1)
      if (emps.length > 0 && emps[0].userId) {
        await tx.insert(notification).values({
          userId: emps[0].userId,
          type: "Overdue Return Alert",
          message: `Asset return processing completed for ${targetAsset?.name || "assigned asset"}. Notes: ${data.returnConditionNotes || "Good condition check-in"}`,
          relatedEntityType: "asset_allocation",
          relatedEntityId: allocationId,
          createdBy: userId,
        })
      }
    }

    // 5. Activity Log
    await tx.insert(activityLog).values({
      actorUserId: userId,
      action: "RETURN_ASSET",
      entityType: "asset_allocation",
      entityId: allocationId,
      details: JSON.stringify({ returnConditionNotes: data.returnConditionNotes, condition: data.condition }),
      createdBy: userId,
    })

    return { success: true }
  })
}

/**
 * List all transfer requests
 */
export async function listTransfers(db: DrizzleDb) {
  const reqs = await db
    .select({
      id: transferRequest.id,
      assetId: transferRequest.assetId,
      assetName: asset.name,
      assetTag: asset.assetTag,
      currentAllocationId: transferRequest.currentAllocationId,
      requestedByUserId: transferRequest.requestedByUserId,
      requestedByUserName: userMaster.username,
      requestedToEmployeeId: transferRequest.requestedToEmployeeId,
      requestedToEmployeeName: employee.name,
      requestedToDepartmentId: transferRequest.requestedToDepartmentId,
      requestedToDepartmentName: department.name,
      status: transferRequest.status,
      createdAt: transferRequest.createdAt,
    })
    .from(transferRequest)
    .innerJoin(asset, eq(transferRequest.assetId, asset.id))
    .innerJoin(userMaster, eq(transferRequest.requestedByUserId, userMaster.id))
    .leftJoin(employee, eq(transferRequest.requestedToEmployeeId, employee.id))
    .leftJoin(department, eq(transferRequest.requestedToDepartmentId, department.id))
    .orderBy(sql`${transferRequest.status} = 'Requested' DESC`, sql`${transferRequest.createdAt} DESC`)

  const enrichedReqs = []
  for (const r of reqs) {
    let currentHolderName = "IT Warehouse"
    if (r.currentAllocationId) {
      const currentAlloc = await db
        .select({
          targetType: assetAllocation.targetType,
          employeeName: employee.name,
          departmentName: department.name,
        })
        .from(assetAllocation)
        .leftJoin(employee, eq(assetAllocation.employeeId, employee.id))
        .leftJoin(department, eq(assetAllocation.departmentId, department.id))
        .where(eq(assetAllocation.id, r.currentAllocationId))
        .limit(1)

      if (currentAlloc[0]) {
        currentHolderName = currentAlloc[0].targetType === "Employee"
          ? (currentAlloc[0].employeeName || "Employee")
          : (currentAlloc[0].departmentName || "Department")
      }
    }
    enrichedReqs.push({
      ...r,
      fromUser: currentHolderName,
      toUser: r.requestedToEmployeeName || r.requestedToDepartmentName || "Unknown",
    })
  }

  return enrichedReqs
}

/**
 * Request a transfer for an allocated asset
 */
export async function requestTransfer(
  data: {
    assetId: string
    requestedToEmployeeId?: string | null
    requestedToDepartmentId?: string | null
  },
  userId: string,
  db: DrizzleDb
) {
  return await db.transaction(async (tx) => {
    // Verify asset is currently allocated and retrieve its current active allocation
    const activeAllocations = await tx
      .select()
      .from(assetAllocation)
      .where(and(eq(assetAllocation.assetId, data.assetId), eq(assetAllocation.status, "Active")))
      .limit(1)

    if (activeAllocations.length === 0) {
      throw new Error("Asset does not have an active allocation and cannot be transferred.")
    }

    const [newReq] = await tx
      .insert(transferRequest)
      .values({
        assetId: data.assetId,
        currentAllocationId: activeAllocations[0].id,
        requestedByUserId: userId,
        requestedToEmployeeId: data.requestedToEmployeeId || null,
        requestedToDepartmentId: data.requestedToDepartmentId || null,
        status: "Requested",
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()

    // Activity Log
    await tx.insert(activityLog).values({
      actorUserId: userId,
      action: "REQUEST_TRANSFER",
      entityType: "transfer_request",
      entityId: newReq.id,
      details: JSON.stringify({ assetId: data.assetId }),
      createdBy: userId,
    })

    return newReq
  })
}

/**
 * Approve a transfer request (atomic return + new allocation)
 */
export async function approveTransfer(transferId: string, userId: string, db: DrizzleDb) {
  return await db.transaction(async (tx) => {
    const reqs = await tx.select().from(transferRequest).where(eq(transferRequest.id, transferId)).limit(1)
    if (reqs.length === 0) {
      throw new Error("Transfer request not found")
    }
    const req = reqs[0]
    if (req.status !== "Requested") {
      throw new Error("Transfer request is not in Requested status")
    }

    // 1. Terminate current allocation
    if (req.currentAllocationId) {
      await tx
        .update(assetAllocation)
        .set({
          status: "Returned",
          actualReturnDate: new Date().toISOString().split("T")[0],
          returnConditionNotes: "Transferred to new holder",
          updatedBy: userId,
          updatedAt: sql`now()`,
        })
        .where(eq(assetAllocation.id, req.currentAllocationId))
    }

    // 2. Create new allocation
    const targetType = req.requestedToEmployeeId ? "Employee" : "Department"
    const [newAlloc] = await tx
      .insert(assetAllocation)
      .values({
        assetId: req.assetId,
        targetType,
        employeeId: req.requestedToEmployeeId,
        departmentId: req.requestedToDepartmentId,
        allocatedDate: new Date().toISOString().split("T")[0],
        status: "Active",
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()

    // 3. Update transfer request status
    await tx
      .update(transferRequest)
      .set({
        status: "Re-allocated",
        approvedByUserId: userId,
        approvedAt: sql`now()`,
        resultingAllocationId: newAlloc.id,
        updatedBy: userId,
        updatedAt: sql`now()`,
      })
      .where(eq(transferRequest.id, transferId))

    // 4. Update asset status (ensure it is Allocated)
    await tx
      .update(asset)
      .set({
        status: "Allocated",
        updatedBy: userId,
        updatedAt: sql`now()`,
      })
      .where(eq(asset.id, req.assetId))

    // 5. Notify new holder
    if (req.requestedToEmployeeId) {
      const emps = await tx.select().from(employee).where(eq(employee.id, req.requestedToEmployeeId)).limit(1)
      if (emps.length > 0 && emps[0].userId) {
        await tx.insert(notification).values({
          userId: emps[0].userId,
          type: "Transfer Approved",
          message: `Your asset transfer request was approved. The asset is now allocated to you.`,
          relatedEntityType: "transfer_request",
          relatedEntityId: transferId,
          createdBy: userId,
        })
      }
    }

    // 6. Activity Log
    await tx.insert(activityLog).values({
      actorUserId: userId,
      action: "APPROVE_TRANSFER",
      entityType: "transfer_request",
      entityId: transferId,
      createdBy: userId,
    })

    return { success: true }
  })
}

/**
 * Reject a transfer request
 */
export async function rejectTransfer(transferId: string, userId: string, db: DrizzleDb) {
  return await db.transaction(async (tx) => {
    const reqs = await tx.select().from(transferRequest).where(eq(transferRequest.id, transferId)).limit(1)
    if (reqs.length === 0) {
      throw new Error("Transfer request not found")
    }
    const req = reqs[0]
    if (req.status !== "Requested") {
      throw new Error("Transfer request is not in Requested status")
    }

    // Update status to Rejected
    await tx
      .update(transferRequest)
      .set({
        status: "Rejected",
        updatedBy: userId,
        updatedAt: sql`now()`,
      })
      .where(eq(transferRequest.id, transferId))

    // Notify requester
    await tx.insert(notification).values({
      userId: req.requestedByUserId,
      type: "Booking Cancelled",
      message: `Your asset transfer request has been rejected.`,
      relatedEntityType: "transfer_request",
      relatedEntityId: transferId,
      createdBy: userId,
    })

    // Activity Log
    await tx.insert(activityLog).values({
      actorUserId: userId,
      action: "REJECT_TRANSFER",
      entityType: "transfer_request",
      entityId: transferId,
      createdBy: userId,
    })

    return { success: true }
  })
}
