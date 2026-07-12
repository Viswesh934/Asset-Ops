import { FastifyInstance } from "fastify"
import { sql } from "drizzle-orm"
import { getDrizzleClient } from "../db/connection"

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      
      // Test database connectivity
      await db.execute(sql`SELECT 1`)
      
      return {
        status: "UP",
        database: "CONNECTED",
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      request.log.error(error, "Health check failed")
      return reply.code(503).send({
        status: "DOWN",
        database: "DISCONNECTED",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  })
}
