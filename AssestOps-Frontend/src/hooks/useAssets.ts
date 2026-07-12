import { useState, useCallback } from "react"
import { api, ApiError } from "../utils/api"
import type { Asset, AssetDetail } from "../types/index"

export function useAssets() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<AssetDetail | null>(null)

  const fetchAssets = useCallback(async (filters?: {
    search?: string
    category?: string
    status?: string
    location?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (filters) {
        if (filters.search) queryParams.append("search", filters.search)
        if (filters.category) queryParams.append("category", filters.category)
        if (filters.status) queryParams.append("status", filters.status)
        if (filters.location) queryParams.append("location", filters.location)
      }

      const endpoint = `/assets?${queryParams.toString()}`
      const data = await api.get<Asset[]>(endpoint)
      setAssets(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("An unexpected network error occurred.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.get<{ id: string; name: string }[]>("/assets/categories")
      setCategories(data)
    } catch (err) {
      console.error("Failed to fetch categories:", err)
    }
  }, [])

  const fetchAssetDetails = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<AssetDetail>(`/assets/${id}`)
      setSelectedAssetDetail(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("An unexpected network error occurred.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const registerAsset = useCallback(async (assetData: {
    name: string
    categoryId: string
    serialNumber?: string
    acquisitionDate?: string
    acquisitionCost?: number
    condition?: string
    location?: string
    departmentId?: string
    isBookable?: boolean
    attachments?: string[]
  }): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await api.post("/assets", assetData)
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("An unexpected network error occurred.")
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    assets,
    categories,
    selectedAssetDetail,
    setSelectedAssetDetail,
    fetchAssets,
    fetchCategories,
    fetchAssetDetails,
    registerAsset,
  }
}
