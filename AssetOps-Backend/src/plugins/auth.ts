import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import fp from "fastify-plugin"
import { eq, inArray, and } from "drizzle-orm"
import { getDrizzleClient } from "../db/connection"
import { rolePermission, permission } from "../db/schema"

export default fp(async function (fastify: FastifyInstance) {
  // Authentication decorator - verifies the JWT token
  fastify.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
    } catch (error) {
      const errorCode =
        typeof error === "object" && error !== null && "code" in error ? (error as { code: string }).code : undefined
      const errorMessage = error instanceof Error ? error.message : "Unknown auth error"

      const requestContext = {
        method: request.method,
        url: request.url,
        routerPath: request.routeOptions?.url,
        requestId: request.id,
        userAgent: request.headers["user-agent"],
      }

      if (errorCode === "FST_JWT_NO_AUTHORIZATION_IN_HEADER") {
        request.log.warn(
          { event: "AUTH_NO_TOKEN", request: requestContext },
          "[AUTH_NO_TOKEN] No authorization header provided"
        )
      } else if (errorCode === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED") {
        request.log.warn(
          { event: "AUTH_TOKEN_EXPIRED", request: requestContext },
          "[AUTH_TOKEN_EXPIRED] JWT token has expired"
        )
      } else {
        request.log.error(
          {
            event: "AUTH_TOKEN_INVALID",
            request: requestContext,
            err: { message: errorMessage, code: errorCode },
          },
          `[AUTH_TOKEN_INVALID] ${errorMessage}`
        )
      }
      return reply.code(401).send({ error: "Unauthorized" })
    }
  })

  // Authorization decorator - checks if user has required permissions
  fastify.decorate("authorize", function (requiredPermissions: string | string[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      const user = request.user as { userId: string; roles?: string[] }

      if (!user.roles?.length) {
        request.log.error({ userId: user.userId }, "User has no roles")
        return reply.code(403).send({ error: "Forbidden - No roles assigned" })
      }

      const permissionsToCheck = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
      const db = getDrizzleClient(fastify)

      const permissionsResult = await db
        .select({
          code: rolePermission.permission,
          name: permission.name,
        })
        .from(rolePermission)
        .leftJoin(permission, eq(rolePermission.permission, permission.code))
        .where(and(inArray(rolePermission.role, user.roles as any), eq(rolePermission.isActive, true)))

      const hasRequiredPermission = permissionsResult.some(
        perm => permissionsToCheck.includes(perm.name || "") || permissionsToCheck.includes(perm.code)
      )

      if (hasRequiredPermission) {
        return
      }

      request.log.error(
        {
          userId: user.userId,
          userRoles: user.roles,
          userPermissions: permissionsResult.map(p => p.name || p.code),
          requiredPermissions: permissionsToCheck,
        },
        "Authorization failed - user lacks required permissions"
      )

      return reply.code(403).send({ error: "Forbidden - Insufficient permissions" })
    }
  })

  // Decorator to restrict access if user has any of the specified roles
  fastify.decorate("restrictRoles", function (restrictedRoles: string | string[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      const user = request.user as { userId: string; roles?: string[] }

      if (!user.roles?.length) {
        request.log.error({ userId: user.userId }, "User has no roles")
        return reply.code(403).send({ error: "Forbidden - No roles assigned" })
      }

      const rolesToRestrict = Array.isArray(restrictedRoles) ? restrictedRoles : [restrictedRoles]
      const hasRestrictedRole = user.roles.some(role => rolesToRestrict.includes(role))

      if (hasRestrictedRole) {
        request.log.error(
          {
            userId: user.userId,
            userRoles: user.roles,
            restrictedRoles: rolesToRestrict,
          },
          "Authorization failed - user has restricted role"
        )
        return reply.code(403).send({ error: "Forbidden - Restricted role" })
      }
    }
  })

  // Decorator to check if user has any of the required roles
  fastify.decorate("requireRoles", function (requiredRoles: string | string[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      const user = request.user as { userId: string; roles?: string[] }

      if (!user.roles?.length) {
        request.log.error({ userId: user.userId }, "User has no roles")
        return reply.code(403).send({ error: "Forbidden - No roles assigned" })
      }

      const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
      const hasRequiredRole = user.roles.some(role => rolesToCheck.includes(role))

      if (!hasRequiredRole) {
        request.log.error(
          {
            userId: user.userId,
            userRoles: user.roles,
            requiredRoles: rolesToCheck,
          },
          "Authorization failed - user lacks required role"
        )
        return reply.code(403).send({ error: "Forbidden - Insufficient role access" })
      }
    }
  })
})

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authorize: (
      requiredPermissions: string | string[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    restrictRoles: (
      restrictedRoles: string | string[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireRoles: (requiredRoles: string | string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string
      roles?: string[]
    }
    user: {
      userId: string
      roles?: string[]
    }
  }
}
