import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../../db/connection"
import { employee, department, userRoleMap } from "../../db/schema"
import { eq, sql } from "drizzle-orm"

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

  fastify.put(
    "/employees/:userId/role",
    { preHandler: [fastify.requireRoles(["Admin"])] },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const { userId } = request.params as { userId: string }
        const { role } = request.body as { role: string }

        if (!role || !["Admin", "Asset Manager", "Department Head", "Technician", "Employee"].includes(role)) {
          return reply.code(400).send({ error: "Invalid role value." })
        }

        // Admins cannot change roles of Admins, nor assign Admin role to others
        const currentRoles = await db
          .select()
          .from(userRoleMap)
          .where(eq(userRoleMap.userId, userId))

        const isAdmin = currentRoles.some(r => r.role === "Admin" && r.isActive)
        if (isAdmin) {
          return reply.code(403).send({ error: "Cannot change the role of an Admin." })
        }

        if (role === "Admin") {
          return reply.code(403).send({ error: "Cannot assign the Admin role." })
        }

        if (currentRoles.length > 0) {
          await db
            .update(userRoleMap)
            .set({ role: role as any, updatedAt: sql`now()` })
            .where(eq(userRoleMap.userId, userId))
        } else {
          await db
            .insert(userRoleMap)
            .values({
              userId,
              role: role as any,
              isActive: true,
            })
        }

        return { message: "Role updated successfully" }
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: "Failed to update employee role" })
      }
    }
  )
}
