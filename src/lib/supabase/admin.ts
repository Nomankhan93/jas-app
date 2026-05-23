// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

function getRequiredEnv(name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY') {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

const supabaseUrl = getRequiredEnv('SUPABASE_URL')
const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')

export function createSupabaseAdminClient() {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}