import "dotenv/config"
import { getStandaloneDrizzleClient } from "./connection"
import {
  userMaster,
  userRoleMap,
  assetCategory,
  department,
  employee,
  asset,
  assetAllocation,
  transferRequest,
  resourceBooking,
  maintenanceRequest,
  auditCycle,
  auditCycleAuditor,
  auditItem,
  discrepancyReport,
  notification,
  activityLog,
  assetAttachment,
} from "./schema"
import bcrypt from "bcryptjs"

async function main() {
  const db = getStandaloneDrizzleClient()
  console.log("⏳ Seeding Neon Database with real production-grade data...")

  try {
    // Clear existing records in correct order to avoid constraint violations
    console.log("⏳ Clearing all existing tables...")
    await db.delete(activityLog)
    await db.delete(notification)
    await db.delete(discrepancyReport)
    await db.delete(auditItem)
    await db.delete(auditCycleAuditor)
    await db.delete(auditCycle)
    await db.delete(maintenanceRequest)
    await db.delete(resourceBooking)
    await db.delete(transferRequest)
    await db.delete(assetAllocation)
    await db.delete(assetAttachment)
    await db.delete(asset)
    await db.delete(employee)
    await db.delete(department)
    await db.delete(assetCategory)
    await db.delete(userRoleMap)
    await db.delete(userMaster)

    // 1. Seed Users
    const passwordHash = await bcrypt.hash("admin123", 10)
    const adminId = "11111111-1111-1111-1111-111111111111"
    const auditorId = "22222222-2222-2222-2222-222222222222"
    const managerId = "33333333-3333-3333-3333-333333333333"

    console.log("⏳ Seeding users...")
    await db.insert(userMaster)
      .values({
        id: adminId,
        login: "admin@example.com",
        password: passwordHash,
        username: "admin",
        isActive: true,
        resetPassword: false,
        defaultUser: true,
      })

    await db.insert(userMaster)
      .values({
        id: auditorId,
        login: "auditor@example.com",
        password: passwordHash,
        username: "auditor_priya",
        isActive: true,
        resetPassword: false,
        defaultUser: false,
      })

    await db.insert(userMaster)
      .values({
        id: managerId,
        login: "manager@example.com",
        password: passwordHash,
        username: "manager_sam",
        isActive: true,
        resetPassword: false,
        defaultUser: false,
      })

    // Roles Mapping
    await db.insert(userRoleMap).values({ userId: adminId, role: "Admin" })
    await db.insert(userRoleMap).values({ userId: auditorId, role: "Employee" })
    await db.insert(userRoleMap).values({ userId: managerId, role: "Asset Manager" })

    // 2. Seed Categories
    console.log("⏳ Seeding asset categories...")
    const categories = [
      { id: "c1111111-1111-1111-1111-111111111111", name: "Electronics", description: "Laptops, phones, monitors and tech hardware" },
      { id: "c2222222-2222-2222-2222-222222222222", name: "Furniture", description: "Office chairs, standing desks, whiteboards" },
      { id: "c3333333-3333-3333-3333-333333333333", name: "Facilities", description: "Projectors, servers, networking hubs" },
      { id: "c4444444-4444-4444-4444-444444444444", name: "Software", description: "SaaS subscriptions, dev tools and operating systems" }
    ]
    for (const cat of categories) {
      await db.insert(assetCategory).values(cat)
    }

    // 3. Seed Departments
    console.log("⏳ Seeding departments...")
    const depts = [
      { id: "d1111111-1111-1111-1111-111111111111", name: "Engineering", status: "Active" as const },
      { id: "d2222222-2222-2222-2222-222222222222", name: "Operations", status: "Active" as const },
      { id: "d3333333-3333-3333-3333-333333333333", name: "Product & Design", status: "Active" as const },
      { id: "d4444444-4444-4444-4444-444444444444", name: "Human Resources", status: "Active" as const }
    ]
    for (const dept of depts) {
      await db.insert(department).values(dept)
    }

    // 4. Seed Employees
    console.log("⏳ Seeding employees...")
    const employees = [
      {
        id: "e1111111-1111-1111-1111-111111111111",
        userId: adminId,
        name: "Admin User",
        email: "admin@example.com",
        departmentId: "d1111111-1111-1111-1111-111111111111",
        status: "Active" as const,
      },
      {
        id: "e2222222-2222-2222-2222-222222222222",
        userId: auditorId,
        name: "Priya Shah",
        email: "auditor@example.com",
        departmentId: "d2222222-2222-2222-2222-222222222222",
        status: "Active" as const,
      },
      {
        id: "e3333333-3333-3333-3333-333333333333",
        userId: managerId,
        name: "Sam Manager",
        email: "manager@example.com",
        departmentId: "d1111111-1111-1111-1111-111111111111",
        status: "Active" as const,
      }
    ]
    for (const emp of employees) {
      await db.insert(employee).values(emp)
    }

    // 5. Seed Assets
    console.log("⏳ Seeding assets...")
    const assetsData = [
      {
        id: "a1111111-1111-1111-1111-111111111111",
        assetTag: "AF-0001",
        name: "MacBook Pro M3 16-inch",
        categoryId: "c1111111-1111-1111-1111-111111111111",
        serialNumber: "C02GL999XD3",
        acquisitionDate: "2026-01-10",
        acquisitionCost: "2499.00",
        condition: "New" as const,
        location: "Bangalore Tech Park (HQ)",
        departmentId: "d1111111-1111-1111-1111-111111111111",
        isBookable: false,
        status: "Allocated" as const,
      },
      {
        id: "a2222222-2222-2222-2222-222222222222",
        assetTag: "AF-0002",
        name: "Epson Projector X41",
        categoryId: "c3333333-3333-3333-3333-333333333333",
        serialNumber: "EP-987216-A",
        acquisitionDate: "2025-11-05",
        acquisitionCost: "799.00",
        condition: "Good" as const,
        location: "London Office - Room 4A",
        departmentId: "d2222222-2222-2222-2222-222222222222",
        isBookable: true,
        status: "Available" as const,
      },
      {
        id: "a3333333-3333-3333-3333-333333333333",
        assetTag: "AF-0003",
        name: "Dell UltraSharp 27-inch 4K Monitor",
        categoryId: "c1111111-1111-1111-1111-111111111111",
        serialNumber: "CN-012X45-9",
        acquisitionDate: "2026-02-15",
        acquisitionCost: "450.00",
        condition: "Good" as const,
        location: "Bangalore Tech Park (HQ)",
        departmentId: "d1111111-1111-1111-1111-111111111111",
        isBookable: false,
        status: "Allocated" as const,
      },
      {
        id: "a4444444-4444-4444-4444-444444444444",
        assetTag: "AF-0004",
        name: "Adobe Creative Cloud License",
        categoryId: "c4444444-4444-4444-4444-444444444444",
        serialNumber: "LIC-AD-CS99",
        acquisitionDate: "2026-03-01",
        acquisitionCost: "600.00",
        condition: "New" as const,
        location: "Cloud System",
        departmentId: "d3333333-3333-3333-3333-333333333333",
        isBookable: false,
        status: "Allocated" as const,
      },
      {
        id: "a5555555-5555-5555-5555-555555555555",
        assetTag: "AF-0005",
        name: "Ergonomic Office Chair",
        categoryId: "c2222222-2222-2222-2222-222222222222",
        serialNumber: "FUR-CH-0089",
        acquisitionDate: "2025-08-12",
        acquisitionCost: "320.00",
        condition: "Fair" as const,
        location: "New York Office",
        departmentId: "d4444444-4444-4444-4444-444444444444",
        isBookable: false,
        status: "Under Maintenance" as const,
      }
    ]
    for (const ast of assetsData) {
      await db.insert(asset).values(ast)
    }

    // 6. Seed Allocations
    console.log("⏳ Seeding asset allocations...")
    const allocations = [
      {
        id: "a1111111-aaaa-1111-1111-111111111111",
        assetId: "a1111111-1111-1111-1111-111111111111",
        targetType: "Employee" as const,
        employeeId: "e2222222-2222-2222-2222-222222222222", // Priya Shah
        allocatedDate: "2026-01-10",
        status: "Active" as const,
        createdBy: adminId,
      },
      {
        id: "a2222222-aaaa-2222-2222-222222222222",
        assetId: "a3333333-3333-3333-3333-333333333333",
        targetType: "Employee" as const,
        employeeId: "e3333333-3333-3333-3333-333333333333", // Sam Manager
        allocatedDate: "2026-02-15",
        status: "Active" as const,
        createdBy: adminId,
      }
    ]
    for (const alloc of allocations) {
      await db.insert(assetAllocation).values(alloc)
    }

    // 7. Seed Past closed audit and active audit
    console.log("⏳ Seeding audit cycles...")
    const cycle1 = {
      id: "a1111111-bbbb-1111-1111-111111111111",
      name: "Q1 IT Hardware Reconcile",
      scopeDepartmentId: "d1111111-1111-1111-1111-111111111111",
      scopeLocation: "Bangalore Tech Park (HQ)",
      startDate: "2026-03-01",
      endDate: "2026-03-10",
      status: "Closed" as const,
      closedAt: "2026-03-09T18:00:00.000Z",
      closedByUserId: adminId,
      createdBy: adminId,
    }
    const cycle2 = {
      id: "a2222222-bbbb-2222-2222-222222222222",
      name: "Mid-Year Departmental Audit",
      scopeLocation: "Bangalore Tech Park (HQ)",
      startDate: "2026-07-01",
      endDate: "2026-07-20",
      status: "In Progress" as const,
      createdBy: adminId,
    }

    await db.insert(auditCycle).values(cycle1)
    await db.insert(auditCycle).values(cycle2)

    // Auditors assignment
    await db.insert(auditCycleAuditor).values({ auditCycleId: cycle1.id, auditorUserId: auditorId })
    await db.insert(auditCycleAuditor).values({ auditCycleId: cycle2.id, auditorUserId: auditorId })

    // Scoped items for past cycle
    console.log("⏳ Seeding audit items...")
    const itemsPast = [
      {
        id: "a1111111-cccc-1111-1111-111111111111",
        auditCycleId: cycle1.id,
        assetId: "a1111111-1111-1111-1111-111111111111",
        result: "Verified" as const,
        verifiedByUserId: auditorId,
        verifiedAt: "2026-03-05T10:00:00.000Z",
        notes: "Excellent condition",
        createdBy: auditorId,
      },
      {
        id: "a2222222-cccc-2222-2222-222222222222",
        auditCycleId: cycle1.id,
        assetId: "a3333333-3333-3333-3333-333333333333",
        result: "Verified" as const,
        verifiedByUserId: auditorId,
        verifiedAt: "2026-03-05T10:30:00.000Z",
        notes: "Verified at desk 12",
        createdBy: auditorId,
      }
    ]
    for (const item of itemsPast) {
      await db.insert(auditItem).values(item)
    }

    // Scoped items for active cycle (pending)
    const itemsActive = [
      {
        id: "a3333333-cccc-3333-3333-333333333333",
        auditCycleId: cycle2.id,
        assetId: "a1111111-1111-1111-1111-111111111111",
        result: "Pending" as const,
        createdBy: adminId,
      },
      {
        id: "a4444444-cccc-4444-4444-444444444444",
        auditCycleId: cycle2.id,
        assetId: "a3333333-3333-3333-3333-333333333333",
        result: "Pending" as const,
        createdBy: adminId,
      }
    ]
    for (const item of itemsActive) {
      await db.insert(auditItem).values(item)
    }

    // 8. Seed Activity Logs
    console.log("⏳ Seeding activity logs...")
    const logs = [
      {
        actorUserId: adminId,
        action: "REGISTERED_ASSET",
        entityType: "asset",
        entityId: "a1111111-1111-1111-1111-111111111111",
        details: "Registered MacBook Pro M3 (AF-0001)",
      },
      {
        actorUserId: adminId,
        action: "REGISTERED_ASSET",
        entityType: "asset",
        entityId: "a2222222-2222-2222-2222-222222222222",
        details: "Registered Epson Projector X41 (AF-0002)",
      },
      {
        actorUserId: adminId,
        action: "LAUNCHED_AUDIT_CYCLE",
        entityType: "audit_cycle",
        entityId: cycle1.id,
        details: "Launched Q1 IT Hardware Reconcile",
      },
      {
        actorUserId: auditorId,
        action: "VERIFIED_AUDIT_ITEM",
        entityType: "audit_item",
        entityId: "a1111111-cccc-1111-1111-111111111111",
        details: "Verified MacBook Pro M3 (AF-0001) as in Good shape.",
      },
      {
        actorUserId: adminId,
        action: "CLOSED_AUDIT_CYCLE",
        entityType: "audit_cycle",
        entityId: cycle1.id,
        details: "Closed Q1 IT Hardware Reconcile cycle.",
      }
    ]
    for (const log of logs) {
      await db.insert(activityLog).values(log)
    }

    console.log("✅ Production seed complete.")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
  } finally {
    process.exit(0)
  }
}

main()
