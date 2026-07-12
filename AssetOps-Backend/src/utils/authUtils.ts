import { FastifyRequest } from "fastify"
import "@fastify/jwt"


export interface AuthenticatedUser {
  userId: string
  roles?: string[]
}

export function extractUserContext(request: FastifyRequest): AuthenticatedUser {
  const user = request.user as AuthenticatedUser

  if (!user?.userId) {
    throw new Error("Invalid user context from JWT token")
  }

  return user
}

export function validateRequiredParams(params: Record<string, unknown>, requiredFields: string[]): void {
  const missing = requiredFields.filter(field => !params[field])

  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(", ")}`)
  }
}

export function buildJWTPayload(options: {
  user: { id: string }
  roles: string[]
}): AuthenticatedUser {
  return {
    userId: options.user.id,
    roles: options.roles,
  }
}
