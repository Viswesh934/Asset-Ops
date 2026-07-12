import "dotenv/config"
import { getStandaloneDrizzleClient } from "./connection"
import { userMaster, userRoleMap } from "./schema"
import bcrypt from "bcryptjs"
import { eq, and } from "drizzle-orm"

async function main() {
  const db = getStandaloneDrizzleClient()
  console.log("⏳ Seeding Neon Database...")

  try {
    const adminId = "11111111-1111-1111-1111-111111111111"
    const passwordHash = await bcrypt.hash("admin123", 10)

    // Insert admin user
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
      .onConflictDoNothing({ target: userMaster.login })

    // Check if role map already exists
    const existingRoleMap = await db
      .select()
      .from(userRoleMap)
      .where(and(eq(userRoleMap.userId, adminId), eq(userRoleMap.role, "Admin")))
      .limit(1)

    if (existingRoleMap.length === 0) {
      await db.insert(userRoleMap).values({
        userId: adminId,
        role: "Admin",
        isActive: true,
      })
    }

    console.log("✅ Database seeded successfully with default admin user:")
    console.log("   - Email: admin@example.com")
    console.log("   - Password: admin123")
    console.log("   - Role: Admin")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
  } finally {
    process.exit(0)
  }
}

main()
