import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { eq, sql } from "drizzle-orm"
import { notification } from "../db/schema"

export default async function notificationRoutes(fastify: FastifyInstance) {
  // List notifications for current user
  fastify.get("/notifications", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const userId = request.user.userId

      const items = await db
        .select()
        .from(notification)
        .where(eq(notification.userId, userId))
        .orderBy(sql`${notification.createdAt} DESC`)
        .limit(50)

      return items
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })

  // Mark a single notification as read
  fastify.patch(
    "/notifications/:id/read",
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const { id } = request.params as { id: string }
        const userId = request.user.userId

        const existing = await db
          .select()
          .from(notification)
          .where(eq(notification.id, id))
          .limit(1)

        if (!existing.length || existing[0].userId !== userId) {
          return reply.code(404).send({ error: "Notification not found" })
        }

        const [updated] = await db
          .update(notification)
          .set({ isRead: true })
          .where(eq(notification.id, id))
          .returning()

        return updated
      } catch (error) {
        request.log.error(error)
        return reply.code(500).send({ error: "Internal server error" })
      }
    }
  )

  // Mark all notifications as read for current user
  fastify.patch("/notifications/read-all", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const userId = request.user.userId

      await db
        .update(notification)
        .set({ isRead: true })
        .where(eq(notification.userId, userId))

      return { success: true }
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })
}
