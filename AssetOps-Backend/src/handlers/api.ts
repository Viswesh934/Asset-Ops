import fastify from "fastify"
import fastifyCors from "@fastify/cors"
import fastifyEnv from "@fastify/env"
import fastifyPostgres from "@fastify/postgres"
import rateLimit from "@fastify/rate-limit"
import helmet from "@fastify/helmet"
import fastifyJwt from "@fastify/jwt"
import fastifyMultipart from "@fastify/multipart"

import { createAppLoggerConfig } from "../lib/logger"
import authenticate from "../plugins/auth"
import dbPlugin from "../plugins/dbErrorHandler"
import { getDrizzleClient } from "../db/connection"
import supabasePlugin from "../plugins/supabase"
import authRoutes from "../routes/auth"
import healthRoutes from "../routes/health"
import assetRoutes from "../routes/assets"
import auditRoutes from "../routes/audits"
import { initSendGrid } from "../services/emailService"
import { userMaster, department, activityLog } from "../db/schema"
import { sql, eq } from "drizzle-orm"
import dashboardRoutes from "../routes/dashboard"
import allocationRoutes from "../routes/allocations"
import transferRoutes from "../routes/transfers"
import directoryRoutes from "../routes/directories"
import getDepartmentsRoutes from "../routes/organization-setup/getDepartments"
import getEmployeesRoutes from "../routes/organization-setup/getEmployees"
import getCategoriesRoutes from "../routes/organization-setup/getCategories"
import addItemRoutes from "../routes/organization-setup/addItem"
import attachmentRoutes from "../routes/attachments"
import notificationRoutes from "../routes/notifications"
import maintenanceRoutes from "../routes/maintenance"
import activityLogRoutes from "../routes/activityLogs"


export const app = fastify({
  logger: createAppLoggerConfig(),
  disableRequestLogging: true,
  pluginTimeout: 30000,
})

// Register environment plugin with schema validation
app.register(fastifyEnv, {
  confKey: "config",
  schema: {
    type: "object",
    required: ["DATABASE_URL", "JWT_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SEND_GRID"],
    properties: {
      NODE_ENV: { type: "string", default: "local" },
      DATABASE_URL: { type: "string" },
      JWT_SECRET: { type: "string" },
      JWT_EXPIRES_IN: { type: "string", default: "4h" },
      PORT: { type: "string", default: "3000" },
      FRONTEND_ORIGIN: { type: "string", default: "http://localhost:5173" },
      SUPABASE_URL: { type: "string" },
      SUPABASE_SERVICE_ROLE_KEY: { type: "string" },
      SEND_GRID: { type: "string" },
    },
  },
  dotenv: true,
})

app.register(rateLimit, {
  max: 300,
  timeWindow: "1 minute",
})

app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "same-site" },
  strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: "no-referrer" },
  frameguard: { action: "sameorigin" },
})

app.after(() => {
  const config = (app as any).config

  // Initialize SendGrid with API key
  initSendGrid(config.SEND_GRID)

  const allowedOrigins = (config.FRONTEND_ORIGIN ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean)

  app.register(fastifyCors, {
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })

  app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN,
    },
  })

  app.register(authenticate)

  app.register(fastifyPostgres, {
    connectionString: config.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000,
  })

  app.register(dbPlugin)
  app.register(supabasePlugin)
  app.register(fastifyMultipart, { limits: { fileSize: 10 * 1024 * 1024 } })

  // Register routes

  app.register(authRoutes, { prefix: "/api" });
  app.register(healthRoutes, { prefix: "/api" })
  // Example of how to protect routes using the authenticate hook:
  app.register(async function protectedRoutes(fastifyPrivate) {
    fastifyPrivate.addHook("preHandler", fastifyPrivate.authenticate)

    fastifyPrivate.register(assetRoutes)
    fastifyPrivate.register(auditRoutes)
    fastifyPrivate.register(dashboardRoutes)
    fastifyPrivate.register(allocationRoutes)
    fastifyPrivate.register(transferRoutes)
    fastifyPrivate.register(directoryRoutes)
    fastifyPrivate.register(getDepartmentsRoutes)
    fastifyPrivate.register(getEmployeesRoutes)
    fastifyPrivate.register(getCategoriesRoutes)
    fastifyPrivate.register(addItemRoutes)
    fastifyPrivate.register(attachmentRoutes)
    fastifyPrivate.register(notificationRoutes)
    fastifyPrivate.register(maintenanceRoutes)
    fastifyPrivate.register(activityLogRoutes)

    fastifyPrivate.get("/me", async (request) => {
      return { user: request.user }
    })

    fastifyPrivate.get("/users", async (request) => {
      const db = getDrizzleClient(fastifyPrivate)
      const users = await db.select({
        id: userMaster.id,
        login: userMaster.login,
        username: userMaster.username
      }).from(userMaster)
      return users
    })



    fastifyPrivate.get("/activity-log", async (request) => {
      const db = getDrizzleClient(fastifyPrivate)
      const logs = await db
        .select({
          id: activityLog.id,
          actorUserId: activityLog.actorUserId,
          action: activityLog.action,
          entityType: activityLog.entityType,
          entityId: activityLog.entityId,
          details: activityLog.details,
          createdAt: activityLog.createdAt,
          username: userMaster.username,
        })
        .from(activityLog)
        .leftJoin(userMaster, eq(activityLog.actorUserId, userMaster.id))
        .orderBy(sql`activity_log.created_at desc`)
        .limit(10)
      return logs
    })
  }, { prefix: "/api" })
})

declare module "fastify" {
  interface FastifyInstance {
    config: {
      NODE_ENV: string
      DATABASE_URL: string
      JWT_SECRET: string
      JWT_EXPIRES_IN: string
      PORT: string
      FRONTEND_ORIGIN: string
      SUPABASE_URL: string
      SUPABASE_SERVICE_ROLE_KEY: string
      SEND_GRID: string
    }
  }
}

// Start server if run directly
if (require.main === module) {
  app.ready().then(() => {
    const port = Number((app as any).config.PORT)
    app
      .listen({ port, host: "0.0.0.0" })
      .then(() => {
        app.log.info(`🚀 Auth Server Template running at http://localhost:${port}`)
      })
      .catch(err => {
        app.log.error(err)
        process.exit(1)
      })
  })

  const shutdown = (signal: string) => {
    app.log.info(`${signal} received, shutting down...`)
    app.close().then(
      () => process.exit(0),
      () => process.exit(1)
    )
  }
  process.on("SIGTERM", () => shutdown("SIGTERM"))
  process.on("SIGINT", () => shutdown("SIGINT"))
}
