import { createClient } from '@supabase/supabase-js';

// 1. Citim variabilele de mediu
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Debug
console.log('URL:', supabaseUrl);
console.log('KEY:', supabaseAnonKey);

// 3. Warning dacă nu sunt setate
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL sau VITE_SUPABASE_ANON_KEY nu sunt setate în .env');
}

// 4. Creăm clientul Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
