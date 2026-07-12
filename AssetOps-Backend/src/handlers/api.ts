import fastify from "fastify"
import fastifyCors from "@fastify/cors"
import fastifyEnv from "@fastify/env"
import fastifyPostgres from "@fastify/postgres"
import rateLimit from "@fastify/rate-limit"
import helmet from "@fastify/helmet"
import fastifyJwt from "@fastify/jwt"

import { createAppLoggerConfig } from "../lib/logger"
import authenticate from "../plugins/auth"
import dbPlugin from "../plugins/dbErrorHandler"
import supabasePlugin from "../plugins/supabase"
import authRoutes from "../routes/auth"
import healthRoutes from "../routes/health"
import dashboardRoutes from "../routes/dashboard"
import assetRoutes from "../routes/assets"

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
    required: ["DATABASE_URL", "JWT_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    properties: {
      NODE_ENV: { type: "string", default: "local" },
      DATABASE_URL: { type: "string" },
      JWT_SECRET: { type: "string" },
      JWT_EXPIRES_IN: { type: "string", default: "4h" },
      PORT: { type: "string", default: "3000" },
      FRONTEND_ORIGIN: { type: "string", default: "http://localhost:5173" },
      SUPABASE_URL: { type: "string" },
      SUPABASE_SERVICE_ROLE_KEY: { type: "string" },
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
  
  // Register routes
  app.register(healthRoutes, { prefix: "/api" })
  app.register(authRoutes, { prefix: "/api" })
  app.register(dashboardRoutes, { prefix: "/api" })
  app.register(assetRoutes, { prefix: "/api" })

  // Example of how to protect routes using the authenticate hook:
  app.register(async function protectedRoutes(fastifyPrivate) {
    fastifyPrivate.addHook("preHandler", fastifyPrivate.authenticate)
    
    fastifyPrivate.get("/api/me", async (request) => {
      return { user: request.user }
    })
  })
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
