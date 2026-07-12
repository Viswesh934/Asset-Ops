import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import {
  bookResource,
  listBookableResources,
  listCategories,
  listAssets,
  getAssetDetail,
  registerAsset,
} from "../services/assetService"

const bookResourceSchema = {
  type: "object",
  required: ["assetId", "startTime", "endTime"],
  properties: {
    assetId: { type: "string" },
    startTime: { type: "string" },
    endTime: { type: "string" },
    bookedForDepartmentId: { type: "string", nullable: true },
  },
  additionalProperties: false,
}

export default async function assetRoutes(fastify: FastifyInstance) {
  // 1. Get all assets (with optional filters)
  fastify.get(
    "/assets",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const query = request.query as any
        const assets = await listAssets(query, db)
        return assets
      } catch (error: any) {
        request.log.error(error)
        return reply.code(500).send({ error: error.message || "Failed to list assets" })
      }
    }
  )

  // 2. Get individual asset detail
  fastify.get(
    "/assets/:id",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const { id } = request.params as { id: string }
        const details = await getAssetDetail(id, db)
        return details
      } catch (error: any) {
        request.log.error(error)
        return reply.code(404).send({ error: error.message || "Asset not found" })
      }
    }
  )

  // 3. Register asset
  fastify.post(
    "/assets",
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: "object",
          required: ["name", "categoryId"],
          properties: {
            name: { type: "string" },
            categoryId: { type: "string" },
            serialNumber: { type: "string", nullable: true },
            acquisitionDate: { type: "string", nullable: true },
            acquisitionCost: { type: "number", nullable: true },
            condition: { type: "string", nullable: true },
            location: { type: "string", nullable: true },
            departmentId: { type: "string", nullable: true },
            isBookable: { type: "boolean", nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const body = request.body as any

        const result = await registerAsset(body, userId, db)
        return reply.code(201).send(result)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: error.message || "Failed to register asset" })
      }
    }
  )

  // 4. Book Resource (All authenticated roles)
  fastify.post(
    "/bookings",
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: bookResourceSchema,
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const body = request.body as any

        const booking = await bookResource(body, userId, db)
        return reply.code(201).send(booking)
      } catch (error: any) {
        request.log.error(error)
        if (error.message.includes("Overlap validation failed")) {
          return reply.code(409).send({ error: error.message })
        }
        return reply.code(400).send({ error: error.message || "Bad request" })
      }
    }
  )

  // 5. Get Bookable Resources
  fastify.get(
    "/assets/bookable",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const resources = await listBookableResources(db)
        return resources
      } catch (error: any) {
        request.log.error(error)
        return reply.code(500).send({ error: "Internal server error" })
      }
    }
  )

  // 6. Get Asset Categories (Plural endpoints mapped)
  fastify.get(
    "/assets/categories",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const categories = await listCategories(db)
        return categories
      } catch (error: any) {
        request.log.error(error)
        return reply.code(500).send({ error: "Internal server error" })
      }
    }
  )

  // Keep old singular endpoint /asset-categories for backward compatibility
  fastify.get(
    "/asset-categories",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const categories = await listCategories(db)
        return categories
      } catch (error: any) {
        request.log.error(error)
        return reply.code(500).send({ error: "Internal server error" })
      }
    }
  )
}
