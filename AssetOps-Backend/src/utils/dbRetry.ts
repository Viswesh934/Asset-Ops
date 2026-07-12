const RETRYABLE_PG_CODES = new Set([
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now
  "57P05", // idle_session_timeout
  "08000", // connection_exception
  "08003", // connection_does_not_exist
  "08006", // connection_failure
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08004", // sqlserver_rejected_establishment_of_sqlconnection
])

const RETRYABLE_NODE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "EPIPE",
  "ETIMEDOUT",
])

export function isRetryablePgError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false

  const error = err as { code?: string; message?: string }

  if (error.code && RETRYABLE_PG_CODES.has(error.code)) return true
  if (error.code && RETRYABLE_NODE_CODES.has(error.code)) return true

  const message = error.message || ""
  if (/terminating connection|connection terminated unexpectedly|Connection terminated/i.test(message)) {
    return true
  }

  return false
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation()
  } catch (err) {
    if (!isRetryablePgError(err)) throw err

    console.warn(
      "[dbRetry] Retrying after stale connection error" + (context ? " (" + context + ")" : "") + ":",
      err instanceof Error ? err.message : String(err)
    )

    return await operation()
  }
}
