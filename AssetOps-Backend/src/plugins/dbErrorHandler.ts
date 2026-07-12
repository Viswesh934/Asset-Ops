import fp from "fastify-plugin"
import type { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from "fastify"
import "@fastify/jwt"
import { getDrizzleClient } from "../db/connection"


function extractDbErrorCode(error: FastifyError): string | undefined {
  if (error.code) return error.code
  const cause = (error as Error & { cause?: { code?: string } }).cause
  if (cause?.code) return cause.code
  return undefined
}

function categorizeError(error: FastifyError): string {
  const dbCode = extractDbErrorCode(error)
  const message = error.message?.toLowerCase() || ""

  if (dbCode === "23505" || message.includes("duplicate key") || message.includes("unique constraint")) {
    return "DB_DUPLICATE_KEY"
  }
  if (dbCode === "23503" || message.includes("foreign key constraint")) {
    return "DB_FOREIGN_KEY_VIOLATION"
  }
  if (dbCode === "ECONNREFUSED" || dbCode === "ENOTFOUND") return "DB_CONNECTION_FAILED"
  if (dbCode === "57P01" || dbCode === "57P03") return "DB_CONNECTION_TERMINATED"
  if (error.name?.includes("DatabaseError") || message.includes("failed query")) {
    return "DB_QUERY_FAILED"
  }

  if (error.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER") return "AUTH_NO_TOKEN"
  if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED") return "AUTH_TOKEN_EXPIRED"
  if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID" || message.includes("token signature")) {
    return "AUTH_TOKEN_INVALID"
  }
  if (error.statusCode === 401) return "AUTH_UNAUTHORIZED"
  if (error.statusCode === 403) return "AUTH_FORBIDDEN"

  if (error.validation) return "VALIDATION_ERROR"
  if (error.statusCode === 400) return "BAD_REQUEST"
  if (error.statusCode === 404) return "NOT_FOUND"

  return "UNKNOWN_ERROR"
}

export default fp(async function dbPlugin(fastify: FastifyInstance) {
  fastify.decorate("db", getDrizzleClient(fastify))

  fastify.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const event = categorizeError(error)
    const statusCode = error.statusCode || 500

    const errorContext = {
      event,
      statusCode,
      method: request.method,
      url: request.url,
      requestId: request.id,
      user: request.user,
      err: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack,
        ...(error.validation && { validation: error.validation }),
      },
    }

    if (statusCode >= 500) {
      request.log.error(errorContext, `[${event}] ${error.message}`)
    } else {
      request.log.warn(errorContext, `[${event}] ${error.message}`)
    }

    if (event === "DB_DUPLICATE_KEY") {
      return reply.code(409).send({ error: "Conflict", message: "Duplicate entry." })
    }
    if (event === "DB_FOREIGN_KEY_VIOLATION") {
      return reply.code(400).send({ error: "Bad Request", message: "Foreign key violation." })
    }
    if (event === "DB_QUERY_FAILED" || event === "DB_CONNECTION_FAILED" || event === "DB_CONNECTION_TERMINATED") {
      return reply.code(500).send({
        success: false,
        error: "DATABASE_ERROR",
        message: "A database error occurred. Please try again later.",
      })
    }
    if (event === "VALIDATION_ERROR") {
      return reply.code(400).send({
        success: false,
        error: "VALIDATION_FAILED",
        message: "Request validation failed.",
        details: error.validation,
      })
    }

    return reply.code(statusCode).send({
      success: false,
      error: event,
      message: error.message || "An unexpected error occurred.",
    })
  })
})
