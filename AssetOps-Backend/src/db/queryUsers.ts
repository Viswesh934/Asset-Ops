import "dotenv/config"
import { getStandaloneDrizzleClient } from "./connection"
import { userMaster, userRoleMap } from "./schema"
import { eq } from "drizzle-orm"

async function run() {
  const db = await getStandaloneDrizzleClient()
  try {
    const rows = await db
      .select({
        id: userMaster.id,
        login: userMaster.login,
        role: userRoleMap.role
      })
      .from(userMaster)
      .leftJoin(userRoleMap, eq(userMaster.id, userRoleMap.userId))
    console.log("Users and Roles:")
    console.dir(rows, { depth: null })
  } catch (err) {
    console.error("Query error:", err)
  } finally {
    process.exit(0)
  }
}

run()
