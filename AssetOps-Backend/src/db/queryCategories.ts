import "dotenv/config"
import { getStandaloneDrizzleClient } from "./connection"
import { assetCategory } from "./schema"

async function run() {
  const db = await getStandaloneDrizzleClient()
  try {
    const rows = await db.select().from(assetCategory)
    console.log("Categories:")
    console.dir(rows, { depth: null })
  } catch (err) {
    console.error("Query error:", err)
  } finally {
    process.exit(0)
  }
}

run()
