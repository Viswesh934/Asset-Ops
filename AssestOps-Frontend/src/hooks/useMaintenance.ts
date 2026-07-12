import { useState, useCallback } from "react"
import { api, ApiError } from "../utils/api"
import type { MaintenanceRequest } from "../types"

export interface Technician {
  userId: string
  username: string
  name: string | null
  email: string | null
}

export function useMaintenance() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<MaintenanceRequest[]>("/maintenance-requests")
      setRequests(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to load maintenance requests.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTechnicians = useCallback(async () => {
    try {
      const data = await api.get<Technician[]>("/maintenance-requests/technicians")
      setTechnicians(data)
    } catch {
      // silently fail — user may not be a manager
    }
  }, [])

  const raiseRequest = useCallback(async (data: {
    assetId: string
    issueDescription: string
    priority: "Low" | "Medium" | "High" | "Critical"
    photoUrl?: string | null
  }): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await api.post("/maintenance-requests", data)
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to create maintenance request.")
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const approveRequest = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/maintenance-requests/${id}/approve`)
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to approve maintenance request.")
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const rejectRequest = useCallback(async (id: string, rejectionReason: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/maintenance-requests/${id}/reject`, { rejectionReason })
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to reject maintenance request.")
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const assignTech = useCallback(async (id: string, technicianUserId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/maintenance-requests/${id}/assign`, { technicianUserId })
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to assign technician.")
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const startWork = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/maintenance-requests/${id}/start-work`)
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to start work.")
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const resolveRequest = useCallback(async (id: string, resolutionNotes: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/maintenance-requests/${id}/resolve`, { resolutionNotes })
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to resolve request.")
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    requests,
    technicians,
    fetchRequests,
    fetchTechnicians,
    raiseRequest,
    approveRequest,
    rejectRequest,
    assignTech,
    startWork,
    resolveRequest,
  }
}
export type UseMaintenanceReturn = ReturnType<typeof useMaintenance>;
