import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables to prevent runtime errors
const env = (import.meta as any).env || {};

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO DO SUPABASE
// 1. Acesse https://supabase.com/dashboard/project/_/settings/api
// 2. Copie a "Project URL" e cole abaixo na variável `supabaseUrl`
// ---------------------------------------------------------------------------

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://fotjdiabclkywmkkesjt.supabase.co'; // Ex: https://xyz.supabase.co
const supabaseAnonKey = env.VITE_SUPABASE_KEY || 'sb_publishable_yYj2CEA-BM_8sWcBNEmHHw_gXtf_ixD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);