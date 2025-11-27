import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables to prevent runtime errors
const env = (import.meta as any).env || {};

// Configure Supabase
// IMPORTANT: You must replace 'https://your-project.supabase.co' with your actual Supabase Project URL found in your Supabase Dashboard > Settings > API.
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_KEY || 'sb_publishable_yYj2CEA-BM_8sWcBNEmHHw_gXtf_ixD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
