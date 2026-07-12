import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  date,
  timestamp,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core"

/* ------------------------------------------------------------------ */
/*  ENUMS                                                             */
/* ------------------------------------------------------------------ */

export const roleEnum = pgEnum("role_enum", [
  "Admin",
  "Asset Manager",
  "Department Head",
  "Employee",
  "Technician",
])

export const statusEnum = pgEnum("status_enum", ["Active", "Inactive"])

export const assetStatusEnum = pgEnum("asset_status_enum", [
  "Available",
  "Allocated",
  "Reserved",
  "Under Maintenance",
  "Lost",
  "Retired",
  "Disposed",
])

export const assetConditionEnum = pgEnum("asset_condition_enum", [
  "New",
  "Good",
  "Fair",
  "Poor",
  "Damaged",
])

export const allocationStatusEnum = pgEnum("allocation_status_enum", [
  "Active",
  "Returned",
  "Overdue",
])

export const allocationTargetTypeEnum = pgEnum("allocation_target_type_enum", [
  "Employee",
  "Department",
])

export const transferStatusEnum = pgEnum("transfer_status_enum", [
  "Requested",
  "Approved",
  "Rejected",
  "Re-allocated",
])

export const bookingStatusEnum = pgEnum("booking_status_enum", [
  "Upcoming",
  "Ongoing",
  "Completed",
  "Cancelled",
])

export const maintenancePriorityEnum = pgEnum("maintenance_priority_enum", [
  "Low",
  "Medium",
  "High",
  "Critical",
])

export const maintenanceStatusEnum = pgEnum("maintenance_status_enum", [
  "Pending",
  "Approved",
  "Rejected",
  "Technician Assigned",
  "In Progress",
  "Resolved",
])

export const auditCycleStatusEnum = pgEnum("audit_cycle_status_enum", [
  "Draft",
  "In Progress",
  "Closed",
])

export const auditItemResultEnum = pgEnum("audit_item_result_enum", [
  "Pending",
  "Verified",
  "Missing",
  "Damaged",
])

export const notificationTypeEnum = pgEnum("notification_type_enum", [
  "Asset Assigned",
  "Maintenance Approved",
  "Maintenance Rejected",
  "Booking Confirmed",
  "Booking Cancelled",
  "Booking Reminder",
  "Transfer Approved",
  "Overdue Return Alert",
  "Audit Discrepancy Flagged",
])

/* ------------------------------------------------------------------ */
/*  AUTH / RBAC (existing tables, updated with audit columns)         */
/* ------------------------------------------------------------------ */

// User Master Table (Credentials & status)
export const userMaster = pgTable(
  "user_master",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    login: text().notNull(), // normalized email / login identifier
    password: text().notNull(), // bcrypt hash
    isActive: boolean("is_active").default(true).notNull(),
    username: text().notNull(),
    resetPassword: boolean("reset_password").default(true).notNull(),
    defaultUser: boolean("default_user").default(false).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedBy: uuid("updated_by"),
  },
  table => [
    unique("usermaster_login_key").on(table.login),
    unique("usermaster_username_key").on(table.username),
  ]
)

// User Role Map Table
// NOTE: per the spec, signup only ever creates an "Employee" role row.
// Admin is the only actor who can add "Department Head" / "Asset Manager" rows,
// done from the Employee Directory (Screen 3, Tab C).
export const userRoleMap = pgTable(
  "user_role_map",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userMaster.id),
    role: roleEnum().notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => userMaster.id),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedBy: uuid("updated_by").references(() => userMaster.id),
  },
  table => [unique("user_role_map_user_role_key").on(table.userId, table.role)]
)

// Role Permission Table
export const rolePermission = pgTable(
  "role_permission",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    role: roleEnum().notNull(),
    permission: text().notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => userMaster.id),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedBy: uuid("updated_by").references(() => userMaster.id),
  }
)

// Permission Table
export const permission = pgTable(
  "permission",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    code: text().notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => userMaster.id),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedBy: uuid("updated_by").references(() => userMaster.id),
  },
  table => [unique("permission_code_unique").on(table.code)]
)

/* ------------------------------------------------------------------ */
/*  ORGANIZATION SETUP (Screen 3)                                     */
/* ------------------------------------------------------------------ */

// Tab A - Department Management
export const department = pgTable(
  "department",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    headUserId: uuid("head_user_id").references(() => userMaster.id), // Department Head
    parentDepartmentId: uuid("parent_department_id"), // self-reference for hierarchy
    status: statusEnum().default("Active").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => userMaster.id),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedBy: uuid("updated_by").references(() => userMaster.id),
  },
  table => [unique("department_name_key").on(table.name)]
)

// Tab B - Asset Category Management
export const assetCategory = pgTable(
  "asset_category",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(), // Electronics, Furniture, Vehicles, etc.
    description: text(),
    // category-specific fields (e.g. warranty period for Electronics) stored as JSON schema/values
    customFields: text("custom_fields"), // JSON string: [{ key, label, type }]
    status: statusEnum().default("Active").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => userMaster.id),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedBy: uuid("updated_by").references(() => userMaster.id),
  },
  table => [unique("asset_category_name_key").on(table.name)]
)

// Tab C - Employee Directory
// One row per employee, linked 1:1 to a login (userMaster).
export const employee = pgTable(
  "employee",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userMaster.id),
    name: text().notNull(),
    email: text().notNull(),
    departmentId: uuid("department_id").references(() => department.id),
    status: statusEnum().default("Active").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => userMaster.id),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedBy: uuid("updated_by").references(() => userMaster.id),
  },
  table => [
    unique("employee_user_id_key").on(table.userId),
    unique("employee_email_key").on(table.email),
  ]
)

/* ------------------------------------------------------------------ */
/*  ASSET REGISTRATION & DIRECTORY (Screen 4)                         */
/* ------------------------------------------------------------------ */

export const asset = pgTable(
  "asset",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    assetTag: text("asset_tag").notNull(), // auto-generated, e.g. AF-0001
    name: text().notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => assetCategory.id),
    serialNumber: text("serial_number"),
    qrCode: text("qr_code"),
    acquisitionDate: date("acquisition_date"),
    acquisitionCost: numeric("acquisition_cost", { precision: 14, scale: 2 }), // reporting/ranking only, not accounting
    condition: assetConditionEnum().default("Good").notNull(),
    location: text(),
    departmentId: uuid("department_id").references(() => department.id), // owning/home department
    isBookable: boolean("is_bookable").default(false).notNull(), // "shared/bookable" flag
    status: assetStatusEnum().default("Available").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => userMaster.id),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedBy: uuid("updated_by").references(() => userMaster.id),
  },
  table => [
    unique("asset_asset_tag_key").on(table.assetTag),
    unique("asset_serial_number_key").on(table.serialNumber),
  ]
)

// Photos / documents attached to an asset (multiple per asset)
export const assetAttachment = pgTable("asset_attachment", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => asset.id),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name"),
  fileType: text("file_type"), // photo | document
  label: text(),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => userMaster.id),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => userMaster.id),
})

/* ------------------------------------------------------------------ */
/*  ALLOCATION & TRANSFER (Screen 5)                                  */
/* ------------------------------------------------------------------ */

export const assetAllocation = pgTable("asset_allocation", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => asset.id),
  targetType: allocationTargetTypeEnum("target_type").notNull(), // Employee | Department
  employeeId: uuid("employee_id").references(() => employee.id), // set when targetType = Employee
  departmentId: uuid("department_id").references(() => department.id), // set when targetType = Department

  allocatedDate: date("allocated_date").notNull(),
  expectedReturnDate: date("expected_return_date"),
  actualReturnDate: date("actual_return_date"),
  returnConditionNotes: text("return_condition_notes"), // condition check-in notes
  status: allocationStatusEnum().default("Active").notNull(), // Active | Returned | Overdue

  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => userMaster.id),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => userMaster.id),
})

export const transferRequest = pgTable("transfer_request", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => asset.id),
  currentAllocationId: uuid("current_allocation_id").references(() => assetAllocation.id),
  requestedByUserId: uuid("requested_by_user_id")
    .notNull()
    .references(() => userMaster.id),
  requestedToEmployeeId: uuid("requested_to_employee_id").references(() => employee.id),
  requestedToDepartmentId: uuid("requested_to_department_id").references(() => department.id),

  status: transferStatusEnum().default("Requested").notNull(),
  approvedByUserId: uuid("approved_by_user_id").references(() => userMaster.id), // Asset Manager / Department Head
  approvedAt: timestamp("approved_at", { withTimezone: true, mode: "string" }),
  resultingAllocationId: uuid("resulting_allocation_id").references(() => assetAllocation.id), // set on Re-allocated

  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => userMaster.id),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => userMaster.id),
})

/* ------------------------------------------------------------------ */
/*  RESOURCE BOOKING (Screen 6)                                       */
/* ------------------------------------------------------------------ */

export const resourceBooking = pgTable("resource_booking", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  assetId: uuid("asset_id") // the bookable resource (isBookable = true)
    .notNull()
    .references(() => asset.id),
  bookedByUserId: uuid("booked_by_user_id")
    .notNull()
    .references(() => userMaster.id),
  bookedForDepartmentId: uuid("booked_for_department_id").references(() => department.id),

  startTime: timestamp("start_time", { withTimezone: true, mode: "string" }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true, mode: "string" }).notNull(),
  status: bookingStatusEnum().default("Upcoming").notNull(),
  cancelledReason: text("cancelled_reason"),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => userMaster.id),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => userMaster.id),
})

/* ------------------------------------------------------------------ */
/*  MAINTENANCE MANAGEMENT (Screen 7)                                 */
/* ------------------------------------------------------------------ */

export const maintenanceRequest = pgTable("maintenance_request", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => asset.id),
  raisedByUserId: uuid("raised_by_user_id")
    .notNull()
    .references(() => userMaster.id),
  issueDescription: text("issue_description").notNull(),
  priority: maintenancePriorityEnum().default("Medium").notNull(),
  photoUrl: text("photo_url"),

  status: maintenanceStatusEnum().default("Pending").notNull(),
  approvedByUserId: uuid("approved_by_user_id").references(() => userMaster.id), // Asset Manager
  approvedAt: timestamp("approved_at", { withTimezone: true, mode: "string" }),
  rejectionReason: text("rejection_reason"),
  technicianName: text("technician_name"),
  technicianUserId: uuid("technician_user_id").references(() => userMaster.id),
  technicianAssignedAt: timestamp("technician_assigned_at", { withTimezone: true, mode: "string" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "string" }),
  resolutionNotes: text("resolution_notes"),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => userMaster.id),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => userMaster.id),
})

/* ------------------------------------------------------------------ */
/*  ASSET AUDIT (Screen 8)                                            */
/* ------------------------------------------------------------------ */

export const auditCycle = pgTable("audit_cycle", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: text().notNull(),
  scopeDepartmentId: uuid("scope_department_id").references(() => department.id),
  scopeLocation: text("scope_location"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: auditCycleStatusEnum().default("Draft").notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true, mode: "string" }),
  closedByUserId: uuid("closed_by_user_id").references(() => userMaster.id),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => userMaster.id),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => userMaster.id),
})

// Auditors assigned to a cycle (many-to-many: cycle <-> user)
export const auditCycleAuditor = pgTable(
  "audit_cycle_auditor",
  {
    auditCycleId: uuid("audit_cycle_id")
      .notNull()
      .references(() => auditCycle.id),
    auditorUserId: uuid("auditor_user_id")
      .notNull()
      .references(() => userMaster.id),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => userMaster.id),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedBy: uuid("updated_by").references(() => userMaster.id),
  },
  table => [primaryKey({ columns: [table.auditCycleId, table.auditorUserId] })]
)

// One row per asset in scope for a given audit cycle
export const auditItem = pgTable("audit_item", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  auditCycleId: uuid("audit_cycle_id")
    .notNull()
    .references(() => auditCycle.id),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => asset.id),
  result: auditItemResultEnum().default("Pending").notNull(), // Verified | Missing | Damaged
  verifiedByUserId: uuid("verified_by_user_id").references(() => userMaster.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "string" }),
  notes: text(),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => userMaster.id),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => userMaster.id),
})

// Auto-generated for flagged (Missing/Damaged) audit items
export const discrepancyReport = pgTable("discrepancy_report", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  auditItemId: uuid("audit_item_id")
    .notNull()
    .references(() => auditItem.id),
  description: text().notNull(),
  resolved: boolean().default(false).notNull(),
  resolvedByUserId: uuid("resolved_by_user_id").references(() => userMaster.id), // Asset Manager approval
  resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "string" }),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => userMaster.id),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => userMaster.id),
})

/* ------------------------------------------------------------------ */
/*  NOTIFICATIONS & ACTIVITY LOGS (Screen 10)                         */
/* ------------------------------------------------------------------ */

export const notification = pgTable("notification", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => userMaster.id), // recipient
  type: notificationTypeEnum().notNull(),
  message: text().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  // polymorphic link back to the record that triggered the notification
  relatedEntityType: text("related_entity_type"), // e.g. "asset_allocation", "resource_booking"
  relatedEntityId: uuid("related_entity_id"),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => userMaster.id),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => userMaster.id),
})

export const activityLog = pgTable("activity_log", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => userMaster.id), // who did it
  action: text().notNull(), // e.g. "APPROVED_MAINTENANCE", "REGISTERED_ASSET"
  entityType: text("entity_type").notNull(), // e.g. "asset", "maintenance_request"
  entityId: uuid("entity_id"),
  details: text(), // JSON string with before/after or extra context

  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => userMaster.id),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => userMaster.id),
})