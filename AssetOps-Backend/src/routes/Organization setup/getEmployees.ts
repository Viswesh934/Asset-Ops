import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../../db/connection"
import { employee, department, userRoleMap } from "../../db/schema"
import { eq } from "drizzle-orm"

export default async function getEmployeesRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/employees",
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        
        const results = await db
          .select({
            id: employee.id,
            userId: employee.userId,
            name: employee.name,
            email: employee.email,
            status: employee.status,
            departmentId: employee.departmentId,
            departmentName: department.name,
            role: userRoleMap.role
          })
          .from(employee)
          .leftJoin(department, eq(employee.departmentId, department.id))
          .leftJoin(userRoleMap, eq(employee.userId, userRoleMap.userId))
          
        return results
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: "Failed to fetch employees" })
      }
    }
  )
}
