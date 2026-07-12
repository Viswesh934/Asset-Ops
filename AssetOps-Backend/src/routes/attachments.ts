import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { uploadAndConfirm, listAttachments, deleteAttachment } from "../services/attachmentService"

export default async function attachmentRoutes(fastify: FastifyInstance) {
  // Upload file directly — frontend POSTs multipart form data
  fastify.post(
    "/assets/:assetId/attachments",
    async (request, reply) => {
      try {
        const parts = request.parts()
        const fields: Record<string, string> = {}
        let fileBuffer: Buffer | null = null
        let fileName = ""
        let fileType = ""

        for await (const part of parts) {
          if (part.type === "file") {
            fileName = part.filename
            fileType = part.mimetype
            const chunks: Buffer[] = []
            for await (const chunk of part.file) {
              chunks.push(chunk)
            }
            fileBuffer = Buffer.concat(chunks)
          } else {
            fields[part.fieldname] = part.value as string
          }
        }

        if (!fileBuffer) {
          return reply.code(400).send({ error: "No file uploaded" })
        }

        const { assetId } = request.params as { assetId: string }
        const userId = request.user.userId
        const db = getDrizzleClient(fastify)

        const record = await uploadAndConfirm(
          assetId,
          fileName,
          fileType,
          fileBuffer,
          userId,
          fastify.supabase,
          db
        )

        return reply.code(201).send(record)
      } catch (error: any) {
        request.log.error(error)
        if (error.message === "Asset not found") {
          return reply.code(404).send({ error: error.message })
        }
        return reply.code(500).send({ error: error.message || "Failed to upload attachment" })
      }
    }
  )

  // List attachments for an asset
  fastify.get(
    "/assets/:assetId/attachments",
    async (request, reply) => {
      try {
        const { assetId } = request.params as { assetId: string }
        const db = getDrizzleClient(fastify)

        const attachments = await listAttachments(
          assetId,
          fastify.supabase,
          db
        )

        return reply.code(200).send(attachments)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(500).send({ error: error.message || "Failed to list attachments" })
      }
    }
  )

  // Delete an attachment
  fastify.delete(
    "/attachments/:attachmentId",
    async (request, reply) => {
      try {
        const { attachmentId } = request.params as { attachmentId: string }
        const db = getDrizzleClient(fastify)

        await deleteAttachment(attachmentId, fastify.supabase, db)

        return reply.code(200).send({ message: "Attachment deleted" })
      } catch (error: any) {
        request.log.error(error)
        if (error.message === "Attachment not found") {
          return reply.code(404).send({ error: error.message })
        }
        return reply.code(500).send({ error: error.message || "Failed to delete attachment" })
      }
    }
  )
}
