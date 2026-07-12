export interface Asset {
  id: string
  assetTag: string
  name: string
  category: string
  categoryId: string
  status: 'Available' | 'Allocated' | 'Reserved' | 'Under Maintenance' | 'Lost' | 'Retired' | 'Disposed'
  condition: 'New' | 'Good' | 'Fair' | 'Poor' | 'Damaged'
  serialNumber?: string | null
  acquisitionDate?: string | null
  acquisitionCost?: number | string | null
  location?: string | null
  departmentId?: string | null
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
  assetName?: string
  assetTag?: string
  serialNumber?: string | null
  location?: string | null
  raisedByUserId: string
  raisedByName: string | null
  issueDescription: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  photoUrl?: string | null
  status: 'Pending' | 'Approved' | 'Rejected' | 'Technician Assigned' | 'In Progress' | 'Resolved'
  approvedByUserId?: string | null
  approvedAt?: string | null
  rejectionReason?: string | null
  technicianName?: string | null
  technicianAssignedAt?: string | null
  resolvedAt?: string | null
  resolutionNotes: string | null
  createdAt: string
}

export interface AssetAttachment {
  id: string
  assetId: string
  fileUrl: string
  fileName: string | null
  fileType: string | null
  signedUrl?: string | null
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

export interface AssetDetail extends Asset {
  qrCode?: string | null
  acquisitionDate?: string | null
  acquisitionCost?: string | null
  location?: string | null
  departmentId?: string | null
  isBookable: boolean
  activeAllocation?: string
  history?: AssetAllocation[]
  attachments?: AssetAttachment[]
  maintenanceHistory?: MaintenanceRequest[]
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

export interface Department {
  id: string
  name: string
  head: string
  headUserId?: string | null
  parentDept: string
  parentDepartmentId?: string | null
  status: 'Active' | 'Inactive'
}

export interface OrgCategory {
  id: string
  name: string
  type: 'Hardware' | 'Software' | 'Facilities' | 'Furniture'
  description: string
  status: 'Active' | 'Inactive'
}

export interface OrgEmployee {
  id: string
  name: string
  email: string
  department: string
  departmentId?: string | null
  role: string
  status: 'Active' | 'Inactive'
  userId?: string
}

export interface ActivityLogItem {
  id: string
  actorUserId: string
  action: string
  entityType: string
  entityId?: string | null
  details?: string | null
  createdAt: string
  username?: string | null
  actorName?: string | null
}


