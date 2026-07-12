import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { 
  listBookings, 
  bookResource, 
  rescheduleBooking, 
  cancelBooking, 
  updateBookingStatus 
} from "../services/assetService"

export default async function bookingRoutes(fastify: FastifyInstance) {
  // Protect all booking endpoints
  fastify.addHook("preHandler", fastify.authenticate)

  // 1. List resource bookings
  fastify.get("/ubookings", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const { resourceId, date } = request.query as { resourceId?: string; date?: string }
      const bookings = await listBookings({ assetId: resourceId, date }, db)
      return bookings
    } catch (error: any) {
      request.log.error(error)
      return reply.code(500).send({ error: error.message || "Failed to list bookings" })
    }
  })

  // 2. Book resource
  fastify.post(
    "/ubookings",
    {
      schema: {
        body: {
          type: "object",
          required: ["assetId", "startTime", "endTime"],
          properties: {
            assetId: { type: "string" },
            startTime: { type: "string" },
            endTime: { type: "string" },
            bookedForDepartmentId: { type: "string", nullable: true },
            employeeId: { type: "string", nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const userId = request.user.userId
        const body = request.body as any

        const result = await bookResource(body, userId, db)
        return reply.code(201).send(result)
      } catch (error: any) {
        request.log.error(error)
        if (error.message.includes("Overlap validation failed")) {
          return reply.code(409).send({ error: error.message })
        }
        return reply.code(400).send({ error: error.message || "Failed to book resource" })
      }
    }
  )

  // 3. Reschedule booking
  fastify.patch(
    "/ubookings/:id/reschedule",
    {
      schema: {
        body: {
          type: "object",
          required: ["startTime", "endTime"],
          properties: {
            startTime: { type: "string" },
            endTime: { type: "string" },
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

        const result = await rescheduleBooking(id, body, userId, db)
        return result
      } catch (error: any) {
        request.log.error(error)
        if (error.message.includes("Overlap validation failed")) {
          return reply.code(409).send({ error: error.message })
        }
        return reply.code(400).send({ error: error.message || "Failed to reschedule booking" })
      }
    }
  )

  // 4. Cancel booking
  fastify.post(
    "/ubookings/:id/cancel",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            cancelledReason: { type: "string", nullable: true },
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

        const result = await cancelBooking(id, body.cancelledReason, userId, db)
        return result
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: error.message || "Failed to cancel booking" })
      }
    }
  )

  // 5. Start session (Ongoing)
  fastify.post("/ubookings/:id/start", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const userId = request.user.userId
      const { id } = request.params as { id: string }

      const result = await updateBookingStatus(id, "Ongoing", userId, db)
      return result
    } catch (error: any) {
      request.log.error(error)
      return reply.code(400).send({ error: error.message || "Failed to start session" })
    }
  })

  // 6. Complete session (Completed)
  fastify.post("/ubookings/:id/complete", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const userId = request.user.userId
      const { id } = request.params as { id: string }

      const result = await updateBookingStatus(id, "Completed", userId, db)
      return result
    } catch (error: any) {
      request.log.error(error)
      return reply.code(400).send({ error: error.message || "Failed to complete session" })
    }
  })
}
