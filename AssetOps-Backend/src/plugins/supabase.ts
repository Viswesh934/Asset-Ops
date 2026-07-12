import fp from "fastify-plugin"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import type { FastifyInstance } from "fastify"

declare module "fastify" {
  interface FastifyInstance {
    supabase: SupabaseClient
  }
}

export default fp(async function supabasePlugin(fastify: FastifyInstance) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = fastify.config

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    fastify.log.warn("Supabase URL or Service Role Key is missing. Supabase client will not be initialized.")
    return
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    fastify.decorate("supabase", supabase)
    fastify.log.info("⚡ Supabase client initialized successfully")
  } catch (error) {
    fastify.log.error({ err: error }, "Failed to initialize Supabase client")
  }
})
