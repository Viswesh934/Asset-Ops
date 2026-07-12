import pino, { Logger } from 'pino'

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'

export interface LoggerOptions {
  level?: LogLevel
  baseFields?: Record<string, unknown>
}

export function createAppLoggerConfig(options?: LoggerOptions) {
  const level = options?.level ?? (process.env.LOG_LEVEL as LogLevel) ?? 'info'

  return {
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      service: 'auth-server-template',
      stage: process.env.NODE_ENV || 'local',
      ...options?.baseFields,
    },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  } as const
}

export function createAppLogger(options?: LoggerOptions): Logger {
  return pino(createAppLoggerConfig(options))
}

export const LogEvents = {
  API_REQUEST: 'API_REQUEST',
  API_ERROR: 'API_ERROR',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_NO_TOKEN: 'AUTH_NO_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_DUPLICATE_KEY: 'DB_DUPLICATE_KEY',
  DB_FOREIGN_KEY_VIOLATION: 'DB_FOREIGN_KEY_VIOLATION',
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type LogEvent = (typeof LogEvents)[keyof typeof LogEvents]
