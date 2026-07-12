import { api } from "./api"

interface UploadUrlResponse {
  uploadUrl: string
  filePath: string
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
