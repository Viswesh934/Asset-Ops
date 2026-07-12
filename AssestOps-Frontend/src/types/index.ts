export interface Asset {
  id: string
  name: string
  category: 'Hardware' | 'Software' | 'Facilities' | 'Furniture'
  status: 'Available' | 'Allocated' | 'In Repair' | 'Disposed'
  assignedTo: string
  serialNo: string
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

