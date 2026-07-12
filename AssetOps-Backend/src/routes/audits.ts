import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { eq, and, or, sql } from "drizzle-orm"
import {
  auditCycle,
  auditCycleAuditor,
  auditItem,
  discrepancyReport,
  asset,
  employee,
  activityLog,
} from "../db/schema"

const createAuditCycleSchema = {
  type: "object",
  required: ["name", "startDate", "endDate", "auditorIds"],
  properties: {
    name: { type: "string" },
    scopeDepartmentId: { type: "string", nullable: true },
    scopeLocation: { type: "string", nullable: true },
    startDate: { type: "string" },
    endDate: { type: "string" },
    auditorIds: {
      type: "array",
      items: { type: "string" },
    },
  },
  additionalProperties: false,
}

const updateAuditItemSchema = {
  type: "object",
  required: ["result"],
  properties: {
    result: { type: "string", enum: ["Verified", "Missing", "Damaged"] },
    notes: { type: "string", nullable: true },
  },
  additionalProperties: false,
}

export default async function auditRoutes(fastify: FastifyInstance) {
  // List Audit Cycles
  fastify.get("/audits", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const cycles = await db.select().from(auditCycle).orderBy(sql`created_at desc`)
      return cycles
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })

  // Launch new Audit Cycle
  fastify.post(
    "/audits",
    {
      schema: {
        body: createAuditCycleSchema,
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const body = request.body as any

        return await db.transaction(async (tx) => {
          // 1. Create Audit Cycle
          const [cycle] = await tx
            .insert(auditCycle)
            .values({
              name: body.name,
              scopeDepartmentId: body.scopeDepartmentId || null,
              scopeLocation: body.scopeLocation || null,
              startDate: body.startDate,
              endDate: body.endDate,
              status: "In Progress",
            })
            .returning()

          // 2. Assign Auditors
          for (const auditorId of body.auditorIds) {
            await tx.insert(auditCycleAuditor).values({
              auditCycleId: cycle.id,
              auditorUserId: auditorId,
            })
          }

          // 3. Find matching assets in scope
          const conditions = []
          if (body.scopeDepartmentId) {
            conditions.push(eq(asset.departmentId, body.scopeDepartmentId))
          }
          if (body.scopeLocation) {
            conditions.push(eq(asset.location, body.scopeLocation))
          }

          // Filter out retired or disposed assets from audit scope
          const activeAssetQuery = tx.select().from(asset)
          const scopedAssets = conditions.length > 0
            ? await activeAssetQuery.where(and(...conditions))
            : await activeAssetQuery

          // 4. Create Audit Items
          for (const ast of scopedAssets) {
            if (ast.status !== "Retired" && ast.status !== "Disposed") {
              await tx.insert(auditItem).values({
                auditCycleId: cycle.id,
                assetId: ast.id,
                result: "Pending",
              })
            }
          }

          // Log this action
          await tx.insert(activityLog).values({
            actorUserId: request.user.userId,
            action: "LAUNCHED_AUDIT_CYCLE",
            entityType: "audit_cycle",
            entityId: cycle.id,
            details: `Launched audit cycle "${cycle.name}"`,
          })

          return reply.code(201).send(cycle)
        })
      } catch (error) {
        request.log.error(error)
        return reply.code(500).send({ error: "Internal server error" })
      }
    }
  )

  // Get Scoped Audit Items for a Cycle
  fastify.get("/audits/:id/items", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const { id } = request.params as { id: string }

      const items = await db
        .select({
          id: auditItem.id,
          auditCycleId: auditItem.auditCycleId,
          assetId: auditItem.assetId,
          result: auditItem.result,
          verifiedAt: auditItem.verifiedAt,
          notes: auditItem.notes,
          assetName: asset.name,
          assetTag: asset.assetTag,
          serialNumber: asset.serialNumber,
          location: asset.location,
        })
        .from(auditItem)
        .innerJoin(asset, eq(auditItem.assetId, asset.id))
        .where(eq(auditItem.auditCycleId, id))

      return items
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })

  // Update Audit Item Verification Status
  fastify.patch(
    "/audits/items/:itemId",
    {
      schema: {
        body: updateAuditItemSchema,
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const { itemId } = request.params as { itemId: string }
        const { result, notes } = request.body as any
        const userId = request.user.userId

        return await db.transaction(async (tx) => {
          // Check if parent cycle is closed
          const itemArr = await tx
            .select()
            .from(auditItem)
            .where(eq(auditItem.id, itemId))
            .limit(1)

          if (!itemArr.length) {
            return reply.code(404).send({ error: "Audit item not found" })
          }

          const item = itemArr[0]

          const cycleArr = await tx
            .select()
            .from(auditCycle)
            .where(eq(auditCycle.id, item.auditCycleId))
            .limit(1)

          if (cycleArr[0]?.status === "Closed") {
            return reply.code(400).send({ error: "Cannot verify items in a closed audit cycle" })
          }

          // Update item status
          const [updatedItem] = await tx
            .update(auditItem)
            .set({
              result,
              notes: notes || null,
              verifiedByUserId: userId || null,
              verifiedAt: new Date().toISOString(),
            })
            .where(eq(auditItem.id, itemId))
            .returning()

          // If Missing or Damaged, trigger discrepancy report
          if (result === "Missing" || result === "Damaged") {
            // Check if report already exists
            const existingReport = await tx
              .select()
              .from(discrepancyReport)
              .where(eq(discrepancyReport.auditItemId, itemId))
              .limit(1)

            if (!existingReport.length) {
              await tx.insert(discrepancyReport).values({
                auditItemId: itemId,
                description: `Asset flagged as ${result} during audit cycle. Auditor notes: ${notes || "None"}`,
                resolved: false,
              })
            }
          } else {
            // If Verified, resolve any existing discrepancy report
            await tx
              .delete(discrepancyReport)
              .where(eq(discrepancyReport.auditItemId, itemId))
          }

          // Log this action
          await tx.insert(activityLog).values({
            actorUserId: userId,
            action: "VERIFIED_AUDIT_ITEM",
            entityType: "audit_item",
            entityId: updatedItem.id,
            details: `Verified audit item as "${result}". Notes: ${notes || "None"}`,
          })

          return updatedItem
        })
      } catch (error) {
        request.log.error(error)
        return reply.code(500).send({ error: "Internal server error" })
      }
    }
  )

  // Close Audit Cycle
  fastify.post("/audits/:id/close", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const { id } = request.params as { id: string }
      const userId = request.user.userId

      return await db.transaction(async (tx) => {
        const cycleArr = await tx
          .select()
          .from(auditCycle)
          .where(eq(auditCycle.id, id))
          .limit(1)

        if (!cycleArr.length) {
          return reply.code(404).send({ error: "Audit cycle not found" })
        }

        if (cycleArr[0].status === "Closed") {
          return reply.code(400).send({ error: "Audit cycle is already closed" })
        }

        // Close cycle
        const [closedCycle] = await tx
          .update(auditCycle)
          .set({
            status: "Closed",
            closedAt: new Date().toISOString(),
            closedByUserId: userId || null,
          })
          .where(eq(auditCycle.id, id))
          .returning()

        // Sync missing/damaged statuses to assets
        const items = await tx
          .select()
          .from(auditItem)
          .where(eq(auditItem.auditCycleId, id))

        for (const item of items) {
          if (item.result === "Missing") {
            await tx
              .update(asset)
              .set({ status: "Lost" })
              .where(eq(asset.id, item.assetId))
          } else if (item.result === "Damaged") {
            await tx
              .update(asset)
              .set({ condition: "Damaged" })
              .where(eq(asset.id, item.assetId))
          }
        }

        // Log this action
        await tx.insert(activityLog).values({
          actorUserId: userId,
          action: "CLOSED_AUDIT_CYCLE",
          entityType: "audit_cycle",
          entityId: closedCycle.id,
          details: `Closed audit cycle "${closedCycle.name}"`,
        })

        return closedCycle
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })
}
