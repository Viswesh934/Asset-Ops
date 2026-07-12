import { api } from "./api"

interface UploadUrlResponse {
  uploadUrl: string
  filePath: string
}

interface AttachmentRecord {
  fileUrl: string
  [key: string]: unknown
}

export async function getUploadUrl(fileName: string, fileType: string): Promise<UploadUrlResponse> {
  const data = await api.post<UploadUrlResponse>("/attachments/upload-url", { fileName, fileType })
  return data
}

export async function uploadFile(
  file: File,
  uploadUrl: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!response.ok) {
    throw new Error("File upload failed")
  }
}

export async function confirmUpload(
  assetId: string,
  filePath: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<void> {
  await api.post("/attachments/confirm", {
    assetId,
    filePath,
    fileName,
    fileType,
    fileSize,
  })
}

export async function uploadAssetFile(
  assetId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  onProgress?.(10)
  const { uploadUrl, filePath } = await getUploadUrl(file.name, file.type)
  onProgress?.(40)
  await uploadFile(file, uploadUrl)
  onProgress?.(80)
  await confirmUpload(assetId, filePath, file.name, file.type, file.size)
  onProgress?.(100)
}

/**
 * Upload a maintenance photo for a given asset.
 * Uses the asset-specific attachment endpoints to upload to Supabase Storage
 * and returns the public URL of the uploaded file.
 */
export async function uploadMaintenancePhoto(
  assetId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  onProgress?.(10)

  // 1. Get signed upload URL from the backend
  const { uploadUrl, filePath } = await api.post<UploadUrlResponse>(
    `/assets/${assetId}/attachments/upload-url`,
    { fileName: file.name, contentType: file.type }
  )

  onProgress?.(40)

  // 2. PUT the file directly to Supabase via the signed URL
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!uploadResponse.ok) {
    throw new Error("Photo upload to storage failed")
  }

  onProgress?.(75)

  // 3. Confirm upload in the backend DB and get back the public URL
  const record = await api.post<AttachmentRecord>(
    `/assets/${assetId}/attachments`,
    { filePath, fileType: file.type, label: "maintenance-photo" }
  )

  onProgress?.(100)

  return record.fileUrl
}
