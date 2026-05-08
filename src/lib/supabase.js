import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// Test de connexion auto au démarrage
supabase.from('membres').select('count', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) console.error('[Supabase] ❌ Connexion échouée:', error.message)
    else console.log('[Supabase] ✅ Connexion OK')
  })
