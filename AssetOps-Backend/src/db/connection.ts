import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres"
import { FastifyInstance } from "fastify"
import { Pool } from "pg"
import * as schema from "./schema"
import { withRetry } from "../utils/dbRetry"

export const dbSchema = schema

export type DrizzleDb = NodePgDatabase<typeof dbSchema>
export type TransactionType = DrizzleDb

let drizzleInstance: DrizzleDb | null = null
const RETRY_WRAPPED = Symbol("retryWrapped")

/* eslint-disable @typescript-eslint/no-explicit-any */
function wrapPoolWithRetry(pool: Pool): Pool {
  if ((pool as any)[RETRY_WRAPPED]) {
    return pool
  }

  const originalQuery = pool.query.bind(pool)
  const wrappedQuery = (...args: any[]): any => {
    return withRetry(() => (originalQuery as any)(...args), "db.query")
  }

  ;(pool as any).query = wrappedQuery
  ;(pool as any)[RETRY_WRAPPED] = true
  return pool
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function getDrizzleClient(fastify: FastifyInstance): DrizzleDb {
  if (!drizzleInstance) {
    const wrappedPool = wrapPoolWithRetry(fastify.pg.pool)
    drizzleInstance = drizzle(wrappedPool, { schema: dbSchema })
  }
  return drizzleInstance
}

let standalonePool: Pool | null = null
let standaloneDrizzle: DrizzleDb | null = null

export function getStandaloneDrizzleClient(): DrizzleDb {
  if (!standaloneDrizzle) {
    standalonePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      idleTimeoutMillis: 60_000,
      connectionTimeoutMillis: 10_000,
    })
    standaloneDrizzle = drizzle(wrapPoolWithRetry(standalonePool), { schema: dbSchema })
  }
  return standaloneDrizzle
}
