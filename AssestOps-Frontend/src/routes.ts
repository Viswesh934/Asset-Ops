import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Settings,
  Package,
  RefreshCw,
  Calendar,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  Activity
} from "lucide-react"

export interface RouteConfig {
  path: string
  title: string
  icon: LucideIcon
  requiresAuth: boolean
}

export const routes: RouteConfig[] = [
  { path: "/dashboard", title: "Dashboard", icon: LayoutDashboard, requiresAuth: true },
  { path: "/org-setup", title: "Organization setup", icon: Settings, requiresAuth: true },
  { path: "/assets", title: "Assets", icon: Package, requiresAuth: true },
  { path: "/allocation-transfer", title: "Allocation & Transfer", icon: RefreshCw, requiresAuth: true },
  { path: "/resource-booking", title: "Resource Booking", icon: Calendar, requiresAuth: true },
  { path: "/maintenance", title: "Maintenance", icon: Wrench, requiresAuth: true },
  { path: "/audit", title: "Audit", icon: ClipboardCheck, requiresAuth: true },
  { path: "/reports", title: "Reports", icon: BarChart3, requiresAuth: true },
  { path: "/activity-log", title: "Activity Log", icon: Activity, requiresAuth: true },
  { path: "/notifications", title: "Notifications", icon: Bell, requiresAuth: true },
]
