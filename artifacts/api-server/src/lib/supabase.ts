import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env["SUPABASE_URL"];
const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
const bucket = process.env["SUPABASE_BUCKET_NAME"];

if (!url) throw new Error("SUPABASE_URL is required");
if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
if (!bucket) throw new Error("SUPABASE_BUCKET_NAME is required");

export const supabase: SupabaseClient = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const SUPABASE_BUCKET = bucket;
export const SUPABASE_URL = url;
