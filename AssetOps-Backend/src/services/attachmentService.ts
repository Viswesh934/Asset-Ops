import { SupabaseClient } from "@supabase/supabase-js"
import { eq, and, sql } from "drizzle-orm"
import { DrizzleDb } from "../db/connection"
import { assetAttachment, asset } from "../db/schema"

const BUCKET = "asset-attachments"

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_")
}

/**
 * Generate a presigned upload URL for the frontend to upload directly to Supabase.
 * Returns { uploadUrl, filePath, token } — the frontend PUTs the file to uploadUrl,
 * then calls confirmUpload to finalize.
 */
export async function generateUploadUrl(
  assetId: string,
  fileName: string,
  contentType: string,
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

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(filePath)

  if (error) {
    throw new Error(`Failed to create upload URL: ${error.message}`)
  }

  return {
    uploadUrl: data.signedUrl,
    filePath: data.path,
    token: data.token,
  }
}

/**
 * Record an attachment in the DB after the frontend has uploaded via signed URL.
 */
export async function confirmUpload(
  assetId: string,
  filePath: string,
  fileType: string | null,
  label: string | null,
  userId: string,
  supabase: SupabaseClient,
  db: DrizzleDb
) {
  const publicUrl = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath).data.publicUrl

  const [record] = await db
    .insert(assetAttachment)
    .values({
      assetId,
      fileUrl: publicUrl,
      fileType: fileType || "photo",
      label: label || null,
      createdBy: userId,
      updatedBy: userId,
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
