import { api } from "./api"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

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
