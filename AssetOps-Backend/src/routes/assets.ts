import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { eq, and, like, or, sql } from "drizzle-orm"
import { asset, assetCategory, assetAttachment, assetAllocation, maintenanceRequest, activityLog } from "../db/schema"

const registerAssetSchema = {
  type: "object",
  required: ["name", "categoryId"],
  properties: {
    name: { type: "string" },
    categoryId: { type: "string" },
    serialNumber: { type: "string", nullable: true },
    acquisitionDate: { type: "string", nullable: true },
    acquisitionCost: { type: "number", nullable: true },
    condition: { type: "string", default: "Good" },
    location: { type: "string", nullable: true },
    departmentId: { type: "string", nullable: true },
    isBookable: { type: "boolean", default: false },
    attachments: {
      type: "array",
      items: { type: "string" },
      nullable: true,
    },
  },
  additionalProperties: false,
}

export default async function assetRoutes(fastify: FastifyInstance) {
  // Get Categories (for select dropdowns)
  fastify.get("/assets/categories", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const categories = await db.select().from(assetCategory)
      return categories
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })

  // List and Search Assets
  fastify.get("/assets", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const { search, category, status, location } = request.query as {
        search?: string
        category?: string
        status?: string
        location?: string
      }

      const conditions = []

      if (search) {
        conditions.push(
          or(
            like(sql`lower(${asset.name})`, `%${search.toLowerCase()}%`),
            like(sql`lower(${asset.assetTag})`, `%${search.toLowerCase()}%`),
            like(sql`lower(${asset.serialNumber})`, `%${search.toLowerCase()}%`)
          )
        )
      }

      if (category && category !== "All") {
        conditions.push(eq(assetCategory.name, category))
      }

      if (status && status !== "All") {
        conditions.push(eq(asset.status, status as any))
      }

      if (location) {
        conditions.push(like(sql`lower(${asset.location})`, `%${location.toLowerCase()}%`))
      }

      const query = db
        .select({
          id: asset.id,
          assetTag: asset.assetTag,
          name: asset.name,
          category: assetCategory.name,
          categoryId: asset.categoryId,
          serialNumber: asset.serialNumber,
          acquisitionDate: asset.acquisitionDate,
          acquisitionCost: asset.acquisitionCost,
          condition: asset.condition,
          location: asset.location,
          departmentId: asset.departmentId,
          isBookable: asset.isBookable,
          status: asset.status,
        })
        .from(asset)
        .leftJoin(assetCategory, eq(asset.categoryId, assetCategory.id))

      const results = conditions.length > 0 
        ? await query.where(and(...conditions))
        : await query

      return results
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })

  // Get Single Asset details with history
  fastify.get("/assets/:id", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const { id } = request.params as { id: string }

      const assetArr = await db
        .select({
          id: asset.id,
          assetTag: asset.assetTag,
          name: asset.name,
          category: assetCategory.name,
          categoryId: asset.categoryId,
          serialNumber: asset.serialNumber,
          acquisitionDate: asset.acquisitionDate,
          acquisitionCost: asset.acquisitionCost,
          condition: asset.condition,
          location: asset.location,
          departmentId: asset.departmentId,
          isBookable: asset.isBookable,
          status: asset.status,
        })
        .from(asset)
        .leftJoin(assetCategory, eq(asset.categoryId, assetCategory.id))
        .where(eq(asset.id, id))
        .limit(1)

      if (!assetArr.length) {
        return reply.code(404).send({ error: "Asset not found" })
      }

      const selectedAsset = assetArr[0]

      // Fetch attachments
      const attachments = await db
        .select()
        .from(assetAttachment)
        .where(eq(assetAttachment.assetId, id))

      // Fetch allocation history
      const allocations = await db
        .select()
        .from(assetAllocation)
        .where(eq(assetAllocation.assetId, id))
        .orderBy(sql`created_at desc`)

      // Fetch maintenance requests
      const maintenance = await db
        .select()
        .from(maintenanceRequest)
        .where(eq(maintenanceRequest.assetId, id))
        .orderBy(sql`created_at desc`)

      return {
        ...selectedAsset,
        attachments,
        allocations,
        maintenance,
      }
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })

  // Register Asset
  fastify.post(
    "/assets",
    {
      schema: {
        body: registerAssetSchema,
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const body = request.body as any

        // Auto-generate Asset Tag
        const existingTags = await db.select({ assetTag: asset.assetTag }).from(asset)
        let nextNum = 1
        existingTags.forEach(t => {
          const match = t.assetTag.match(/AF-(\d+)/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (num >= nextNum) {
              nextNum = num + 1
            }
          }
        })
        const assetTag = `AF-${String(nextNum).padStart(4, "0")}`

        const [newAsset] = await db
          .insert(asset)
          .values({
            assetTag,
            name: body.name,
            categoryId: body.categoryId,
            serialNumber: body.serialNumber || null,
            acquisitionDate: body.acquisitionDate || null,
            acquisitionCost: body.acquisitionCost ? String(body.acquisitionCost) : null,
            condition: body.condition,
            location: body.location || null,
            departmentId: body.departmentId || null,
            isBookable: body.isBookable || false,
            status: "Available",
          })
          .returning()

        // Handle attachments if any
        if (body.attachments && Array.isArray(body.attachments)) {
          for (const url of body.attachments) {
            await db.insert(assetAttachment).values({
              assetId: newAsset.id,
              fileUrl: url,
              fileType: "photo",
            })
          }
        }

        // Log this action
        await db.insert(activityLog).values({
          actorUserId: request.user.userId,
          action: "REGISTERED_ASSET",
          entityType: "asset",
          entityId: newAsset.id,
          details: `Registered asset ${newAsset.name} with tag ${newAsset.assetTag}`,
        })

        return reply.code(201).send(newAsset)
      } catch (error) {
        request.log.error(error)
        return reply.code(500).send({ error: "Internal server error" })
      }
    }
  )
}
