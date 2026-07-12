import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../../db/connection"
import { department, userMaster } from "../../db/schema"
import { eq } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"

export default async function getDepartmentsRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/departments",
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        
        // Alias the department table to perform self-join for hierarchy
        const parentDepartment = alias(department, "parent_department")
        
        const results = await db
          .select({
            id: department.id,
            name: department.name,
            status: department.status,
            headUserId: department.headUserId,
            headName: userMaster.username,
            parentDepartmentId: department.parentDepartmentId,
            parentDepartmentName: parentDepartment.name
          })
          .from(department)
          .leftJoin(userMaster, eq(department.headUserId, userMaster.id))
          .leftJoin(parentDepartment, eq(department.parentDepartmentId, parentDepartment.id))
          
        return results
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: "Failed to fetch departments" })
      }
    }
  )
}
