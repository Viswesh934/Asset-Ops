import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../../db/connection"
import { department, assetCategory, employee } from "../../db/schema"
import { extractUserContext } from "../../utils/authUtils"

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
        if (error.message && error.message.includes("unique")) {
          return reply.code(409).send({ error: "Record with this name or email already exists." })
        }
        
        return reply.code(500).send({ error: error.message || "Failed to create item" })
      }
    }
  )
}
