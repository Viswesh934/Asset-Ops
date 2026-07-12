import { api } from "./api"

interface AttachmentRecord {
  fileUrl: string
  [key: string]: unknown
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

/**
 * Upload a file attachment for an asset (used in the Assets module).
 * POSTs as multipart/form-data to POST /assets/:assetId/attachments.
 */
export async function uploadAssetFile(
  assetId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  onProgress?.(20)

  const formData = new FormData()
  formData.append("file", file)

  const token = localStorage.getItem("token")
  const response = await fetch(`${BASE_URL}/assets/${assetId}/attachments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  onProgress?.(80)

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Upload failed" }))
    throw new Error(err.error || "Upload failed")
  }

  onProgress?.(100)
}

/**
 * Upload a maintenance photo for a given asset.
 * POSTs as multipart/form-data to POST /assets/:assetId/attachments,
 * which uploads to Supabase internally and returns a record with a public fileUrl.
 * The returned fileUrl is then stored as the photoUrl on the maintenance request.
 */
export async function uploadMaintenancePhoto(
  assetId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  onProgress?.(20)

  const formData = new FormData()
  formData.append("file", file, file.name)

  onProgress?.(40)

  // api.ts skips Content-Type for FormData so the browser sets the
  // correct multipart boundary automatically.
  const record = await api.post<AttachmentRecord>(
    `/assets/${assetId}/attachments`,
    formData
  )

  onProgress?.(100)

  return record.fileUrl
}
