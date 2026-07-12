export interface Asset {
  id: string
  name: string
  category: 'Hardware' | 'Software' | 'Facilities' | 'Furniture'
  status: 'Available' | 'Allocated' | 'In Repair' | 'Disposed'
  assignedTo: string
  serialNo: string
}

export interface AssetDetail extends Asset {
  qrCode?: string | null
  acquisitionDate?: string | null
  acquisitionCost?: string | null
  location?: string | null
  departmentId?: string | null
  isBookable: boolean
  activeAllocation?: any
  history?: any[]
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
