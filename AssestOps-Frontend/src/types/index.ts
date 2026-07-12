export interface Asset {
  id: string
  assetTag: string
  name: string
  category: string
  categoryId: string
  status: 'Available' | 'Allocated' | 'Reserved' | 'Under Maintenance' | 'Lost' | 'Retired' | 'Disposed'
  condition: 'New' | 'Good' | 'Fair' | 'Poor' | 'Damaged'
  serialNumber?: string
  acquisitionDate?: string
  acquisitionCost?: number
  location?: string
  departmentId?: string
  isBookable: boolean
  assignedTo?: string
}

export interface AssetAllocation {
  id: string
  assetId: string
  allocatedToUserId: string | null
  allocatedToDepartmentId: string | null
  targetType: 'Employee' | 'Department'
  allocatedDate: string
  expectedReturnDate: string | null
  actualReturnDate: string | null
  status: 'Active' | 'Returned' | 'Overdue'
  notes: string | null
}

export interface MaintenanceRequest {
  id: string
  assetId: string
  issueDescription: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Pending' | 'Approved' | 'Rejected' | 'Technician Assigned' | 'In Progress' | 'Resolved'
  resolutionNotes: string | null
}

export interface AssetAttachment {
  id: string
  assetId: string
  fileUrl: string
}

export interface AssetDetail extends Asset {
  attachments: AssetAttachment[]
  allocations: AssetAllocation[]
  maintenance: MaintenanceRequest[]
}

export interface AuditCycle {
  id: string
  name: string
  scopeDepartmentId?: string
  scopeLocation?: string
  startDate: string
  endDate: string
  status: 'Draft' | 'In Progress' | 'Closed'
  closedAt?: string
  closedByUserId?: string
  createdAt: string
}

export interface AuditItem {
  id: string
  auditCycleId: string
  assetId: string
  result: 'Pending' | 'Verified' | 'Missing' | 'Damaged'
  verifiedByUserId?: string
  verifiedAt?: string
  notes?: string
  assetName: string
  assetTag: string
  serialNumber?: string
  location?: string
}

export interface Booking {
  id: string
  resource: string
  user: string
  date: string
  timeSlot: string
  status: 'Confirmed' | 'Pending Approval' | 'Cancelled'
}

export interface MaintenanceTicket {
  id: string
  assetName: string
  issue: string
  date: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Open' | 'In Progress' | 'Resolved'
}

export interface TransferRequest {
  id: string
  assetName: string
  fromUser: string
  toUser: string
  date: string
  status: 'Approved' | 'Pending Approval' | 'Pending Transfer' | 'Rejected'
}

export interface SystemNotification {
  id: string
  type: 'alert' | 'info' | 'success' | 'warning'
  title: string
  message: string
  time: string
  read: boolean
}
