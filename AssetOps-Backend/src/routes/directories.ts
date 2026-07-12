import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { employee, department } from "../db/schema"
import { eq } from "drizzle-orm"

export default async function directoryRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate)

  // 1. Get employees list
  fastify.get("/get-employees", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const list = await db
        .select({
          id: employee.id,
          name: employee.name,
          email: employee.email,
          departmentId: employee.departmentId,
          departmentName: department.name,
        })
        .from(employee)
        .leftJoin(department, eq(employee.departmentId, department.id))
        .where(eq(employee.status, "Active"))
      return list
    } catch (error: any) {
      request.log.error(error)
      return reply.code(500).send({ error: error.message || "Failed to list employees" })
    }
  })

  // 2. Get departments list
  fastify.get("/get-departments", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const list = await db
        .select({
          id: department.id,
          name: department.name,
          status: department.status,
        })
        .from(department)
        .where(eq(department.status, "Active"))
      return list
    } catch (error: any) {
      request.log.error(error)
      return reply.code(500).send({ error: error.message || "Failed to list departments" })
    }
  })
}
