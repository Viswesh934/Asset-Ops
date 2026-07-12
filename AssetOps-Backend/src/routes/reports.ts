import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { getReportsAnalytics, getExportReportData } from "../services/reportsService"

export default async function reportsRoutes(fastify: FastifyInstance) {
  fastify.get("/reports/analytics", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const data = await getReportsAnalytics(db)
      return data
    } catch (error: any) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })

  fastify.get("/reports/export", async (request, reply) => {
    try {
      const db = getDrizzleClient(fastify)
      const csv = await getExportReportData(db)
      reply
        .header("Content-Type", "text/csv")
        .header("Content-Disposition", 'attachment; filename="asset_report.csv"')
        .send(csv)
    } catch (error: any) {
      request.log.error(error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })
}
