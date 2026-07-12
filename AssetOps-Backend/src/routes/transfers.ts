import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { listTransfers, requestTransfer, approveTransfer, rejectTransfer } from "../services/allocationService"

export default async function transferRoutes(fastify: FastifyInstance) {
  // Protect all transfer endpoints
  fastify.addHook("preHandler", fastify.authenticate)

  // 1. List transfer requests
  fastify.get("/transfers", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const transfers = await listTransfers(db)
      return transfers
    } catch (error: any) {
      request.log.error(error)
      return reply.code(500).send({ error: error.message || "Failed to list transfer requests" })
    }
  })

  // 2. Initiate transfer request
  fastify.post(
    "/transfers",
    {
      schema: {
        body: {
          type: "object",
          required: ["assetId"],
          properties: {
            assetId: { type: "string" },
            requestedToEmployeeId: { type: "string", nullable: true },
            requestedToDepartmentId: { type: "string", nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const body = request.body as any

        const result = await requestTransfer(body, userId, db)
        return reply.code(201).send(result)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: error.message || "Failed to initiate transfer request" })
      }
    }
  )

  // 3. Approve transfer request
  fastify.post("/transfers/:id/approve", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const userId = request.user.userId
      const { id } = request.params as { id: string }

      const result = await approveTransfer(id, userId, db)
      return result
    } catch (error: any) {
      request.log.error(error)
      return reply.code(400).send({ error: error.message || "Failed to approve transfer request" })
    }
  })

  // 4. Reject transfer request
  fastify.post("/transfers/:id/reject", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const userId = request.user.userId
      const { id } = request.params as { id: string }

      const result = await rejectTransfer(id, userId, db)
      return result
    } catch (error: any) {
      request.log.error(error)
      return reply.code(400).send({ error: error.message || "Failed to reject transfer request" })
    }
  })
}
