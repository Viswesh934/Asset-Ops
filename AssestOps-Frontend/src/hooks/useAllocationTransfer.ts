import { useState, useCallback } from "react"
import { api, ApiError } from "../utils/api"

export interface Allocation {
  id: string
  assetId: string
  assetName: string
  assetTag: string
  targetType: "Employee" | "Department"
  employeeId: string | null
  employeeName: string | null
  departmentId: string | null
  departmentName: string | null
  allocatedDate: string
  expectedReturnDate: string | null
  actualReturnDate: string | null
  returnConditionNotes: string | null
  status: "Active" | "Returned" | "Overdue"
}

export interface TransferRequest {
  id: string
  assetId: string
  assetName: string
  assetTag: string
  currentAllocationId: string | null
  fromUser: string
  toUser: string
  status: "Requested" | "Approved" | "Rejected" | "Re-allocated"
  createdAt: string
  requestedToEmployeeId?: string | null
  requestedToDepartmentId?: string | null
}

export interface EmployeeDirectoryItem {
  id: string
  name: string
  email: string
  departmentId: string | null
  departmentName: string | null
}

export interface DepartmentItem {
  id: string
  name: string
}

export function useAllocationTransfer() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [transfers, setTransfers] = useState<TransferRequest[]>([])
  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>([])
  const [departments, setDepartments] = useState<DepartmentItem[]>([])

  const fetchAllocations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Allocation[]>("/allocations")
      setAllocations(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch allocations")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTransfers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<TransferRequest[]>("/transfers")
      setTransfers(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch transfer requests")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await api.get<EmployeeDirectoryItem[]>("/get-employees")
      setEmployees(data)
    } catch (err) {
      console.error("Failed to fetch employees", err)
    }
  }, [])

  const fetchDepartments = useCallback(async () => {
    try {
      const data = await api.get<DepartmentItem[]>("/get-departments")
      setDepartments(data)
    } catch (err) {
      console.error("Failed to fetch departments", err)
    }
  }, [])

  const createAllocation = useCallback(async (payload: {
    assetId: string
    targetType: "Employee" | "Department"
    employeeId?: string | null
    departmentId?: string | null
    expectedReturnDate?: string | null
  }) => {
    setLoading(true)
    setError(null)
    try {
      await api.post("/allocations", payload)
      await fetchAllocations()
      return true
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Allocation failed"
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [fetchAllocations])

  const processReturn = useCallback(async (
    allocationId: string,
    payload: { returnConditionNotes?: string; condition?: string }
  ) => {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/allocations/${allocationId}/return`, payload)
      await fetchAllocations()
      return true
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Return failed"
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [fetchAllocations])

  const createTransferRequest = useCallback(async (payload: {
    assetId: string
    requestedToEmployeeId?: string | null
    requestedToDepartmentId?: string | null
  }) => {
    setLoading(true)
    setError(null)
    try {
      await api.post("/transfers", payload)
      await fetchTransfers()
      return true
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Transfer request failed"
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [fetchTransfers])

  const approveTransfer = useCallback(async (transferId: string) => {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/transfers/${transferId}/approve`, {})
      await fetchTransfers()
      await fetchAllocations()
      return true
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approval failed")
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchTransfers, fetchAllocations])

  const rejectTransfer = useCallback(async (transferId: string) => {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/transfers/${transferId}/reject`, {})
      await fetchTransfers()
      return true
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rejection failed")
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchTransfers])

  return {
    loading,
    error,
    allocations,
    transfers,
    employees,
    departments,
    fetchAllocations,
    fetchTransfers,
    fetchEmployees,
    fetchDepartments,
    createAllocation,
    processReturn,
    createTransferRequest,
    approveTransfer,
    rejectTransfer,
  }
}
