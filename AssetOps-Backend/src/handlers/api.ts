import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyEnv from "@fastify/env";
import fastifyPostgres from "@fastify/postgres";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import fastifyJwt from "@fastify/jwt";

import getDepartmentsRoutes from "../routes/Organization setup/getDepartments";
import getEmployeesRoutes from "../routes/Organization setup/getEmployees";
import getCategoriesRoutes from "../routes/Organization setup/getCategories";
import addItemRoutes from "../routes/Organization setup/addItem";

import { createAppLoggerConfig } from "../lib/logger";
import authenticate from "../plugins/auth";
import dbPlugin from "../plugins/dbErrorHandler";
import supabasePlugin from "../plugins/supabase";

import authRoutes from "../routes/auth";
import healthRoutes from "../routes/health";
import dashboardRoutes from "../routes/dashboard";
import assetRoutes from "../routes/assets";
import auditRoutes from "../routes/audits";

import { getDrizzleClient } from "../db/connection";
import { initSendGrid } from "../services/emailService";

import { userMaster, department, activityLog } from "../db/schema";
import { sql, eq } from "drizzle-orm";


app.register(
  async function protectedRoutes(fastifyPrivate) {
    fastifyPrivate.addHook("preHandler", fastifyPrivate.authenticate);

    fastifyPrivate.get("/me", async (request) => {
      return { user: request.user };
    });

    fastifyPrivate.register(getDepartmentsRoutes);
    fastifyPrivate.register(getEmployeesRoutes);
    fastifyPrivate.register(getCategoriesRoutes);
    fastifyPrivate.register(addItemRoutes);

    fastifyPrivate.register(assetRoutes);
    fastifyPrivate.register(auditRoutes);

    // Register dashboard routes if required
    fastifyPrivate.register(dashboardRoutes);

    fastifyPrivate.get("/users", async () => {
      const db = getDrizzleClient(fastifyPrivate);

      return await db
        .select({
          id: userMaster.id,
          login: userMaster.login,
          username: userMaster.username,
        })
        .from(userMaster);
    });

    fastifyPrivate.get("/departments", async () => {
      const db = getDrizzleClient(fastifyPrivate);

      return await db.select().from(department);
    });

    fastifyPrivate.get("/activity-log", async () => {
      const db = getDrizzleClient(fastifyPrivate);

      return await db
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
        .limit(10);
    });
  },
  { prefix: "/api" }
);