import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import {
  listMaintenanceRequests,
  listTechnicians,
  createMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignTechnician,
  startMaintenanceWork,
  resolveMaintenanceRequest,
} from "../services/maintenanceService"

export default async function maintenanceRoutes(fastify: FastifyInstance) {
  // Protect all endpoints
  fastify.addHook("preHandler", fastify.authenticate)

  // 1. GET /maintenance-requests
  fastify.get("/maintenance-requests", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const userId = request.user.userId
      const roles = request.user.roles || []
      const requests = await listMaintenanceRequests(userId, roles, db)
      return requests
    } catch (error: any) {
      request.log.error(error)
      return reply.code(500).send({ error: error.message || "Failed to list maintenance requests" })
    }
  })

  // 2. GET /maintenance-requests/technicians
  fastify.get(
    "/maintenance-requests/technicians",
    { preHandler: [fastify.requireRoles(["Admin", "Asset Manager"])] },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const technicians = await listTechnicians(db)
        return technicians
      } catch (error: any) {
        request.log.error(error)
        return reply.code(500).send({ error: error.message || "Failed to list technicians" })
      }
    }
  )

  // 2. POST /maintenance-requests
  fastify.post(
    "/maintenance-requests",
    {
      schema: {
        body: {
          type: "object",
          required: ["assetId", "issueDescription", "priority"],
          properties: {
            assetId: { type: "string" },
            issueDescription: { type: "string" },
            priority: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
            photoUrl: { type: "string", nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const body = request.body as any
        const result = await createMaintenanceRequest(body, userId, db)
        return reply.code(201).send(result)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: error.message || "Failed to create maintenance request" })
      }
    }
  )

  // 3. POST /maintenance-requests/:id/approve
  fastify.post(
    "/maintenance-requests/:id/approve",
    {
      preHandler: [fastify.requireRoles(["Admin", "Asset Manager"])],
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const { id } = request.params as { id: string }
        const result = await approveMaintenanceRequest(id, userId, db)
        return result
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: error.message || "Failed to approve maintenance request" })
      }
    }
  )

  // 4. POST /maintenance-requests/:id/reject
  fastify.post(
    "/maintenance-requests/:id/reject",
    {
      preHandler: [fastify.requireRoles(["Admin", "Asset Manager"])],
      schema: {
        body: {
          type: "object",
          required: ["rejectionReason"],
          properties: {
            rejectionReason: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const { id } = request.params as { id: string }
        const { rejectionReason } = request.body as { rejectionReason: string }
        const result = await rejectMaintenanceRequest(id, rejectionReason, userId, db)
        return result
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: error.message || "Failed to reject maintenance request" })
      }
    }
  )

  // 5. POST /maintenance-requests/:id/assign
  fastify.post(
    "/maintenance-requests/:id/assign",
    {
      preHandler: [fastify.requireRoles(["Admin", "Asset Manager"])],
      schema: {
        body: {
          type: "object",
          required: ["technicianUserId"],
          properties: {
            technicianUserId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const { id } = request.params as { id: string }
        const { technicianUserId } = request.body as { technicianUserId: string }
        const result = await assignTechnician(id, technicianUserId, userId, db)
        return result
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: error.message || "Failed to assign technician" })
      }
    }
  )

  // 6. POST /maintenance-requests/:id/start-work
  fastify.post(
    "/maintenance-requests/:id/start-work",
    {
      preHandler: [fastify.requireRoles(["Admin", "Asset Manager"])],
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const { id } = request.params as { id: string }
        const result = await startMaintenanceWork(id, userId, db)
        return result
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: error.message || "Failed to start maintenance work" })
      }
    }
  )

  // 7. POST /maintenance-requests/:id/resolve
  fastify.post(
    "/maintenance-requests/:id/resolve",
    {
      preHandler: [fastify.requireRoles(["Admin", "Asset Manager"])],
      schema: {
        body: {
          type: "object",
          required: ["resolutionNotes"],
          properties: {
            resolutionNotes: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const { id } = request.params as { id: string }
        const { resolutionNotes } = request.body as { resolutionNotes: string }
        const result = await resolveMaintenanceRequest(id, resolutionNotes, userId, db)
        return result
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: error.message || "Failed to resolve maintenance request" })
      }
    }
  )
}
