import { createClient } from '@supabase/supabase-js';

// Safely access environment variables, handling cases where import.meta.env might be undefined
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://fotjdiabclkywmkkesjt.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_KEY || 'sb_publishable_yYj2CEA-BM_8sWcBNEmHHw_gXtf_ixD';

// Aviso de console se as chaves não estiverem configuradas (Ajuda no Debug no Vercel)
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_KEY) {
    console.warn("ATENÇÃO: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_KEY não detectadas. Verifique as configurações do Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);