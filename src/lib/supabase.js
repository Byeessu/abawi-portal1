import { createClient } from '@supabase/supabase-js'

const DEFAULT_URL  = 'https://nqpfmnsecjhqxuvfkqhi.supabase.co'
const DEFAULT_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGZtbnNlY2pocXh1dmZrcWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODI0MDgsImV4cCI6MjA4OTk1ODQwOH0.BCSmlEUmieRHFzT9AfIpSbauOCd2whl-NqQW-W0HIno'

function isValidHttpUrl(v) {
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false }
}

// A Supabase anon key is a JWT: 3 base64url segments separated by dots.
// We validate the shape so a missing / masked / malformed env value (e.g. when
// Netlify's secrets scanner replaces it with "*****") falls back to the
// known-good default instead of producing "Invalid API key" at runtime.
function isValidJwt(v) {
  if (typeof v !== 'string') return false
  const parts = v.split('.')
  if (parts.length !== 3) return false
  return parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p))
}

const envUrl  = import.meta.env.VITE_SUPABASE_URL || ''
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const SUPABASE_URL  = isValidHttpUrl(envUrl) ? envUrl : DEFAULT_URL
const SUPABASE_ANON = isValidJwt(envAnon) ? envAnon : DEFAULT_ANON

// Avertit en console si la clé/URL d'env a été ignorée (utile en prod Netlify).
if (envUrl && SUPABASE_URL !== envUrl) {
  console.warn('[Supabase] VITE_SUPABASE_URL invalide — fallback sur défaut')
}
if (envAnon && SUPABASE_ANON !== envAnon) {
  console.warn('[Supabase] VITE_SUPABASE_ANON_KEY invalide (format non-JWT) — fallback sur défaut')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// Test de connexion auto au démarrage
supabase.from('membres').select('count', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) console.error('[Supabase] ❌ Connexion échouée:', error.message)
    else console.log('[Supabase] ✅ Connexion OK')
  })
