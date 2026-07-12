import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { listAllocations, allocateAsset, returnAsset } from "../services/allocationService"

export default async function allocationRoutes(fastify: FastifyInstance) {
  // Protect all allocation endpoints
  fastify.addHook("preHandler", fastify.authenticate)

  // 1. List all allocations
  fastify.get("/allocations", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const allocations = await listAllocations(db)
      return allocations
    } catch (error: any) {
      request.log.error(error)
      return reply.code(500).send({ error: error.message || "Failed to list allocations" })
    }
  })

  // 2. Allocate asset
  fastify.post(
    "/allocations",
    {
      schema: {
        body: {
          type: "object",
          required: ["assetId", "targetType"],
          properties: {
            assetId: { type: "string" },
            targetType: { type: "string", enum: ["Employee", "Department"] },
            employeeId: { type: "string", nullable: true },
            departmentId: { type: "string", nullable: true },
            expectedReturnDate: { type: "string", nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const body = request.body as any

        const result = await allocateAsset(body, userId, db)
        return reply.code(201).send(result)
      } catch (error: any) {
        request.log.error(error)
        if (error.message.includes("already allocated")) {
          return reply.code(409).send({ error: error.message })
        }
        return reply.code(400).send({ error: error.message || "Failed to allocate asset" })
      }
    }
  )

  // 3. Return asset
  fastify.post(
    "/allocations/:id/return",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            returnConditionNotes: { type: "string", nullable: true },
            condition: { type: "string", nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const { id } = request.params as { id: string }
        const body = request.body as any

        const result = await returnAsset(id, body, userId, db)
        return result
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: error.message || "Failed to process return" })
      }
    }
  )
}
