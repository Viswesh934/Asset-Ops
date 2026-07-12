import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { eq, sql } from "drizzle-orm"
import { activityLog, userMaster, employee } from "../db/schema"

export default async function activityLogRoutes(fastify: FastifyInstance) {
  // List all activity logs
  fastify.get("/activity-logs", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)

      const logs = await db
        .select({
          id: activityLog.id,
          actorUserId: activityLog.actorUserId,
          action: activityLog.action,
          entityType: activityLog.entityType,
          entityId: activityLog.entityId,
          details: activityLog.details,
          createdAt: activityLog.createdAt,
          username: userMaster.username,
          actorName: employee.name,
        })
        .from(activityLog)
        .leftJoin(userMaster, eq(activityLog.actorUserId, userMaster.id))
        .leftJoin(employee, eq(userMaster.id, employee.userId))
        .orderBy(sql`${activityLog.createdAt} DESC`)
        .limit(200)

      return logs
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })
}
