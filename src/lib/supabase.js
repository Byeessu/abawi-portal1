import { createClient } from '@supabase/supabase-js'

const DEFAULT_URL  = 'https://nqpfmnsecjhqxuvfkqhi.supabase.co'
const DEFAULT_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGZtbnNlY2pocXh1dmZrcWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODI0MDgsImV4cCI6MjA4OTk1ODQwOH0.BCSmlEUmieRHFzT9AfIpSbauOCd2whl-NqQW-W0HIno'

function isValidHttpUrl(v) {
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false }
}

const envUrl  = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_URL  = isValidHttpUrl(envUrl) ? envUrl : DEFAULT_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// Test de connexion auto au démarrage
supabase.from('membres').select('count', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) console.error('[Supabase] ❌ Connexion échouée:', error.message)
    else console.log('[Supabase] ✅ Connexion OK')
  })
