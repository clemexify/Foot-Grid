import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceConfig } from "./config";
import type { Database } from "./database.types";

export function createSupabaseAdminClient() {
  const { serviceRoleKey, url } = getSupabaseServiceConfig();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
