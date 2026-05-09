"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserConfig } from "./config";
import type { Database } from "./database.types";

export function createSupabaseBrowserClient() {
  const { anonKey, url } = getSupabaseBrowserConfig();
  return createBrowserClient<Database>(url, anonKey);
}
