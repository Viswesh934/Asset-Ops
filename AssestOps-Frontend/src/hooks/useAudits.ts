import { useState, useCallback } from "react"
import { api } from "../utils/api"

interface AuditCycle {
  id: string
  name: string
  scopeDepartmentId: string | null
  scopeLocation: string | null
  startDate: string
  endDate: string
  status: string
  closedAt: string | null
  closedByUserId: string | null
  createdAt: string
}

interface AuditItem {
  id: string
  auditCycleId: string
  assetId: string
  result: string
  verifiedAt: string | null
  notes: string | null
  assetName: string
  assetTag: string
  serialNumber: string | null
  location: string | null
}

interface LaunchCyclePayload {
  name: string
  scopeDepartmentId?: string
  scopeLocation?: string
  startDate: string
  endDate: string
  auditorIds: string[]
}

interface VerifyPayload {
  result: "Verified" | "Missing" | "Damaged"
  notes?: string
}

export function useAudits() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cycles, setCycles] = useState<AuditCycle[]>([])
  const [items, setItems] = useState<AuditItem[]>([])

  const fetchCycles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<AuditCycle[]>("/audits")
      setCycles(data)
    } catch (err: any) {
      setError(err?.message || "Failed to fetch audit cycles")
    } finally {
      setLoading(false)
    }
  }, [])

  const launchCycle = useCallback(async (payload: LaunchCyclePayload): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await api.post("/audits", payload)
      return true
    } catch (err: any) {
      setError(err?.message || "Failed to launch audit cycle")
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCycleItems = useCallback(async (cycleId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<AuditItem[]>(`/audits/${cycleId}/items`)
      setItems(data)
    } catch (err: any) {
      setError(err?.message || "Failed to fetch audit items")
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyItem = useCallback(async (itemId: string, payload: VerifyPayload): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const updated = await api.patch<AuditItem>(`/audits/items/${itemId}`, payload)
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...updated } : i)))
      return true
    } catch (err: any) {
      setError(err?.message || "Failed to verify audit item")
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const closeCycle = useCallback(async (cycleId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/audits/${cycleId}/close`, {})
      setCycles((prev) =>
        prev.map((c) => (c.id === cycleId ? { ...c, status: "Closed", closedAt: new Date().toISOString() } : c))
      )
      return true
    } catch (err: any) {
      setError(err?.message || "Failed to close audit cycle")
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    cycles,
    items,
    fetchCycles,
    launchCycle,
    fetchCycleItems,
    verifyItem,
    closeCycle,
  }
}
