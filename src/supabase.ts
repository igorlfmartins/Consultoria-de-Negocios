import { createClient } from '@supabase/supabase-js'

// URL fornecida pelo usuário
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vvndogbmygllhpxjeuwm.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.warn('VITE_SUPABASE_ANON_KEY not set in environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseKey || 'missing-key')
