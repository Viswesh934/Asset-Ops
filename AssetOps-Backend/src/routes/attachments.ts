import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import {
  generateUploadUrl,
  confirmUpload,
  listAttachments,
  deleteAttachment,
} from "../services/attachmentService"

export default async function attachmentRoutes(fastify: FastifyInstance) {
  // 1. Get presigned upload URL — frontend PUTs file directly to Supabase
  fastify.post(
    "/assets/:assetId/attachments/upload-url",
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: "object",
          required: ["fileName", "contentType"],
          properties: {
            fileName: { type: "string" },
            contentType: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { assetId } = request.params as { assetId: string }
        const { fileName, contentType } = request.body as {
          fileName: string
          contentType: string
        }
        const db = getDrizzleClient(fastify)

        const result = await generateUploadUrl(
          assetId,
          fileName,
          contentType,
          fastify.supabase,
          db
        )

        return reply.code(200).send(result)
      } catch (error: any) {
        request.log.error(error)
        if (error.message === "Asset not found") {
          return reply.code(404).send({ error: error.message })
        }
        return reply.code(500).send({ error: error.message || "Failed to generate upload URL" })
      }
    }
  )

  // 2. Confirm upload — records metadata in DB after frontend uploaded via signed URL
  fastify.post(
    "/assets/:assetId/attachments",
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: "object",
          required: ["filePath"],
          properties: {
            filePath: { type: "string" },
            fileType: { type: "string", nullable: true },
            label: { type: "string", nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { assetId } = request.params as { assetId: string }
        const { filePath, fileType, label } = request.body as {
          filePath: string
          fileType?: string
          label?: string
        }
        const userId = request.user.userId
        const db = getDrizzleClient(fastify)

        const record = await confirmUpload(
          assetId,
          filePath,
          fileType || null,
          label || null,
          userId,
          fastify.supabase,
          db
        )

        return reply.code(201).send(record)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(500).send({ error: error.message || "Failed to confirm upload" })
      }
    }
  )

  // 3. List attachments for an asset
  fastify.get(
    "/assets/:assetId/attachments",
    {
      preHandler: [fastify.authenticate],
    },
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

  // 4. Delete an attachment
  fastify.delete(
    "/attachments/:attachmentId",
    {
      preHandler: [fastify.authenticate],
    },
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
