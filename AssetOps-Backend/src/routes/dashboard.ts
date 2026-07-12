import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { getDashboardSnapshot } from "../services/dashboardService"

export default async function dashboardRoutes(fastify: FastifyInstance) {
  // Protect all dashboard routes
  fastify.addHook("preHandler", fastify.authenticate)

  fastify.get("/dashboard", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const userId = request.user.userId
      const roles = request.user.roles || []

      const data = await getDashboardSnapshot(userId, roles, db)
      return data
    } catch (error: any) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })
}
