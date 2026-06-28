import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase keys from environment variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "https://placeholder-project-url.supabase.co";
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "sb_publishable_WSU7LICBjlIcrt_1-_12wA_7xPMeksw";

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
