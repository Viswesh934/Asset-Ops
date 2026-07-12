import { FastifyInstance } from "fastify"
import { getDrizzleClient } from "../db/connection"
import { buildJWTPayload } from "../utils/authUtils"
import { AuthService } from "../services/authService"

const loginSchema = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: { type: "string" },
    password: { type: "string" },
  },
  additionalProperties: false,
}

const signupSchema = {
  type: "object",
  required: ["email", "username", "name"],
  properties: {
    email: { type: "string" },
    password: { type: "string" },
    username: { type: "string" },
    name: { type: "string" },
    departmentId: { type: "string", nullable: true },
  },
  additionalProperties: false,
}

const forgotPasswordSchema = {
  type: "object",
  required: ["email"],
  properties: {
    email: { type: "string" },
  },
  additionalProperties: false,
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Login Endpoint
  fastify.post(
    "/login",
    {
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
      schema: {
        body: loginSchema,
      },
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body as {
          email: string
          password: string
        }
        const emailNormalized = email.toLowerCase()

        // SSO check (optional fallback in template)
        const isProduction = (fastify as any).config.NODE_ENV === "production"
        if (isProduction && emailNormalized.includes("@apexon.com")) {
          return reply.code(403).send({
            error: "Apexon employees must login with SSO. Please use the SSO login option.",
          })
        }

        const db = getDrizzleClient(fastify)
        const { user, roles, permissions } = await AuthService.loginUser(email, password, db)

        // Block candidates from logging in (if candidate checks ever need to be made)
        if ((roles as string[]).includes("ROLE.CANDIDATE")) {
          return reply.code(403).send({
            error: "This functionality is not available for candidates. Please use the candidate portal for your actions.",
          })
        }

        const jwtPayload = buildJWTPayload({ user, roles })

        // Generate JWT token
        const accessToken = fastify.jwt.sign(jwtPayload, { expiresIn: (fastify as any).config.JWT_EXPIRES_IN })

        return {
          user: email,
          userId: user.id,
          accessToken,
          roles,
          permissions,
          resetPassword: user.resetPassword,
        }
      } catch (error: any) {
        if (error.message === "Invalid credentials") {
          return reply.code(401).send({ error: "Invalid credentials" })
        }
        if (error.message === "Account is locked") {
          return reply.code(423).send({ error: "Account is locked. Please contact support." })
        }
        request.log.error(error)
        return reply.code(500).send({ error: "Internal server error" })
      }
    }
  )

  // Signup Endpoint
  fastify.post(
    "/signup",
    {
      schema: {
        body: signupSchema,
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const body = request.body as any
        const result = await AuthService.signupUser(body, db)
        return reply.code(201).send(result)
      } catch (error: any) {
        if (
          error.message === "Email already registered" ||
          error.message === "Username already taken"
        ) {
          return reply.code(400).send({ error: error.message })
        }
        request.log.error(error)
        return reply.code(500).send({ error: "Internal server error" })
      }
    }
  )

  // Forgot Password Endpoint
  fastify.post(
    "/forgot-password",
    {
      schema: {
        body: forgotPasswordSchema,
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const { email } = request.body as { email: string }
        const result = await AuthService.forgotPassword(email, db)
        return reply.send(result)
      } catch (error: any) {
        if (error.message === "User not found") {
          return reply.code(404).send({ error: error.message })
        }
        request.log.error(error)
        return reply.code(500).send({ error: "Internal server error" })
      }
    }
  )

  // Reset Password Endpoint
  const resetPasswordSchema = {
    type: "object",
    required: ["email", "tempPassword", "newPassword"],
    properties: {
      email: { type: "string" },
      tempPassword: { type: "string" },
      newPassword: { type: "string" },
    },
    additionalProperties: false,
  }

  fastify.post(
    "/reset-password",
    {
      schema: {
        body: resetPasswordSchema,
      },
    },
    async (request, reply) => {
      try {
        const db = getDrizzleClient(fastify)
        const { email, tempPassword, newPassword } = request.body as any
        const result = await AuthService.resetPassword(email, tempPassword, newPassword, db)
        return reply.send(result)
      } catch (error: any) {
        if (
          error.message === "User not found" ||
          error.message === "Password reset not requested or already completed" ||
          error.message === "Invalid temporary password"
        ) {
          return reply.code(400).send({ error: error.message })
        }
        request.log.error(error)
        return reply.code(500).send({ error: "Internal server error" })
      }
    }
  )
}
