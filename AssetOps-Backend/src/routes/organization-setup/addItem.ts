import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../../db/connection"
import { department, assetCategory, employee } from "../../db/schema"
import { extractUserContext } from "../../utils/authUtils"
import { eq, sql } from "drizzle-orm"

interface AddItemRequestBody {
  type: "category" | "department" | "employee"
  name: string
  
  // Department fields
  headUserId?: string
  parentDepartmentId?: string
  
  // Category fields
  description?: string
  customFields?: string
  
  // Employee fields
  email?: string
  departmentId?: string
  userId?: string
}

export default async function addItemRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/add-item",
    async (request, reply) => {
      try {
        const body = request.body as AddItemRequestBody
        const { type } = body
        
        if (!type || !["category", "department", "employee"].includes(type)) {
          return reply.code(400).send({ error: "Invalid type. Must be 'category', 'department', or 'employee'." })
        }
        
        const db = getDrizzleClient(fastify)
        const user = extractUserContext(request)
        const currentUserUuid = user.userId

        if (type === "department") {
          if (!body.name) {
            return reply.code(400).send({ error: "Department name is required." })
          }
          
          const [inserted] = await db
            .insert(department)
            .values({
              name: body.name,
              headUserId: body.headUserId || null,
              parentDepartmentId: body.parentDepartmentId || null,
              status: "Active",
              createdBy: currentUserUuid,
              updatedBy: currentUserUuid
            })
            .returning()
            
          return { message: "Department created successfully", data: inserted }
        }
        
        if (type === "category") {
          if (!body.name) {
            return reply.code(400).send({ error: "Category name is required." })
          }
          
          const [inserted] = await db
            .insert(assetCategory)
            .values({
              name: body.name,
              description: body.description || null,
              customFields: body.customFields || null,
              status: "Active",
              createdBy: currentUserUuid,
              updatedBy: currentUserUuid
            })
            .returning()
            
          return { message: "Asset category created successfully", data: inserted }
        }
        
        if (type === "employee") {
          if (!body.name || !body.email || !body.userId) {
            return reply.code(400).send({ error: "Employee name, email, and user_id are required." })
          }
          
          const [inserted] = await db
            .insert(employee)
            .values({
              name: body.name,
              email: body.email.toLowerCase(),
              userId: body.userId,
              departmentId: body.departmentId || null,
              status: "Active",
              createdBy: currentUserUuid,
              updatedBy: currentUserUuid
            })
            .returning()
            
          return { message: "Employee registered successfully", data: inserted }
        }
      } catch (error: any) {
        fastify.log.error(error)
        
        // Handle database unique constraints, e.g. name or email conflicts
        const dbCode = error?.code ?? error?.cause?.code
        if (dbCode === "23505" || (error.message && error.message.includes("unique"))) {
          return reply.code(409).send({ error: "Record with this name or email already exists." })
        }
        
        return reply.code(500).send({ error: "Failed to create item" })
      }
    }
  )

  fastify.put(
    "/departments/:id",
    { preHandler: [fastify.requireRoles(["Admin"])] },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const { id } = request.params as { id: string }
        const body = request.body as { name?: string; headUserId?: string; parentDepartmentId?: string; status?: "Active" | "Inactive" }

        const user = extractUserContext(request)
        const currentUserUuid = user.userId

        await db
          .update(department)
          .set({
            name: body.name,
            headUserId: body.headUserId || null,
            parentDepartmentId: body.parentDepartmentId || null,
            status: body.status,
            updatedBy: currentUserUuid,
            updatedAt: sql`now()`
          })
          .where(eq(department.id, id))

        return { message: "Department updated successfully" }
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: "Failed to update department" })
      }
    }
  )

  fastify.put(
    "/categories/:id",
    { preHandler: [fastify.requireRoles(["Admin"])] },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const { id } = request.params as { id: string }
        const body = request.body as { name?: string; description?: string; customFields?: string; status?: "Active" | "Inactive" }

        const user = extractUserContext(request)
        const currentUserUuid = user.userId

        await db
          .update(assetCategory)
          .set({
            name: body.name,
            description: body.description || null,
            customFields: body.customFields || null,
            status: body.status,
            updatedBy: currentUserUuid,
            updatedAt: sql`now()`
          })
          .where(eq(assetCategory.id, id))

        return { message: "Asset category updated successfully" }
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: "Failed to update category" })
      }
    }
  )

  fastify.put(
    "/employees/:id",
    { preHandler: [fastify.requireRoles(["Admin"])] },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const { id } = request.params as { id: string }
        const body = request.body as { name?: string; email?: string; departmentId?: string; status?: "Active" | "Inactive" }

        const user = extractUserContext(request)
        const currentUserUuid = user.userId

        await db
          .update(employee)
          .set({
            name: body.name,
            email: body.email ? body.email.toLowerCase() : undefined,
            departmentId: body.departmentId || null,
            status: body.status,
            updatedBy: currentUserUuid,
            updatedAt: sql`now()`
          })
          .where(eq(employee.id, id))

        return { message: "Employee updated successfully" }
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: "Failed to update employee" })
      }
    }
  )
}
