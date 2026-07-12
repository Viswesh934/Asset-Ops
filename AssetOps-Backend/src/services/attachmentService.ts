import { SupabaseClient } from "@supabase/supabase-js"
import { eq, and, sql } from "drizzle-orm"
import { DrizzleDb } from "../db/connection"
import { assetAttachment, asset } from "../db/schema"

const BUCKET = "Asset-Ops"

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_")
}

/**
 * Upload a file buffer directly to Supabase storage, then record in DB.
 */
export async function uploadAndConfirm(
  assetId: string,
  fileName: string,
  fileType: string,
  fileBuffer: Buffer,
  userId: string,
  supabase: SupabaseClient,
  db: DrizzleDb
) {
  const assetRow = await db
    .select({ id: asset.id })
    .from(asset)
    .where(eq(asset.id, assetId))
    .limit(1)

  if (assetRow.length === 0) {
    throw new Error("Asset not found")
  }

  const safeName = sanitizeFileName(fileName)
  const timestamp = Date.now()
  const filePath = `${assetId}/${timestamp}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: fileType,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`)
  }

  const publicUrl = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath).data.publicUrl

  const [record] = await db
    .insert(assetAttachment)
    .values({
      assetId,
      fileUrl: publicUrl,
      fileName,
      fileType,
      createdBy: null,
      updatedBy: null,
    })
    .returning()

  return record
}

/**
 * List all attachments for an asset, with signed download URLs.
 */
export async function listAttachments(
  assetId: string,
  supabase: SupabaseClient,
  db: DrizzleDb
) {
  const rows = await db
    .select()
    .from(assetAttachment)
    .where(eq(assetAttachment.assetId, assetId))
    .orderBy(sql`${assetAttachment.createdAt} DESC`)

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const storagePath = extractStoragePath(row.fileUrl)
      let signedUrl: string | null = null

      if (storagePath) {
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(storagePath, 3600)

        if (!error) {
          signedUrl = data.signedUrl
        }
      }

      return {
        ...row,
        signedUrl,
      }
    })
  )

  return enriched
}

/**
 * Delete an attachment from DB + Supabase storage.
 */
export async function deleteAttachment(
  attachmentId: string,
  supabase: SupabaseClient,
  db: DrizzleDb
) {
  const rows = await db
    .select()
    .from(assetAttachment)
    .where(eq(assetAttachment.id, attachmentId))
    .limit(1)

  if (rows.length === 0) {
    throw new Error("Attachment not found")
  }

  const row = rows[0]
  const storagePath = extractStoragePath(row.fileUrl)

  if (storagePath) {
    await supabase.storage.from(BUCKET).remove([storagePath])
  }

  await db.delete(assetAttachment).where(eq(assetAttachment.id, attachmentId))

  return row
}

function extractStoragePath(publicUrl: string): string | null {
  const marker = "/storage/v1/object/public/"
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null

  const rest = publicUrl.slice(idx + marker.length)
  const slashIdx = rest.indexOf("/")
  if (slashIdx === -1) return null

  const bucketAndPath = rest.slice(slashIdx + 1)
  return decodeURIComponent(bucketAndPath)
}
