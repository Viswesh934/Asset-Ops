import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import {
  bookResource,
  listBookableResources,
  listCategories,
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
  // Book Resource (All authenticated roles)
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

  // Get Bookable Resources
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

  // Get Asset Categories
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
