import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../../db/connection"
import { assetCategory } from "../../db/schema"

export default async function getCategoriesRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/categories",
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        
        const results = await db
          .select({
            id: assetCategory.id,
            name: assetCategory.name,
            description: assetCategory.description,
            customFields: assetCategory.customFields,
            status: assetCategory.status
          })
          .from(assetCategory)
          
        return results
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: "Failed to fetch asset categories" })
      }
    }
  )
}
