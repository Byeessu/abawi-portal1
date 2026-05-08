import { supabase } from './supabase'

const FN_URL = '/.netlify/functions/abawi360-crud'
const ALLOWED_TABLES = new Set([
  'crm_contacts',
  'projets',
  'taches',
  'okr_objectifs',
  'stat_formulaires',
  'stat_reponses',
  'ai_jobs',
  'marketing_posts',
  'marketing_campaigns',
])

async function runViaFunction(action, table, ownerEmail, payload = {}) {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, table, ownerEmail, ...payload }),
  })
  const out = await res.json().catch(() => ({}))
  if (!res.ok || out?.ok === false) {
    const error = new Error(out?.error || `abawi360-crud ${res.status}`)
    error.status = res.status
    throw error
  }
  return out
}

async function runViaSupabase(action, table, ownerEmail, payload = {}) {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error('table not allowed')
  }

  if (action === 'list') {
    let query = supabase.from(table).select('*').eq('owner_email', ownerEmail).order('created_at', { ascending: false })
    if (payload.filters) {
      Object.entries(payload.filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query = query.eq(k, v)
      })
    }
    const { data, error } = await query
    if (error) throw error
    return { ok: true, data: data || [] }
  }

  if (action === 'insert') {
    const row = { ...(payload.payload || {}), owner_email: ownerEmail, updated_at: new Date().toISOString() }
    const { data, error } = await supabase.from(table).insert([row]).select().single()
    if (error) throw error
    return { ok: true, row: data }
  }

  if (action === 'update') {
    if (!payload.id) throw new Error('id required')
    const { data, error } = await supabase
      .from(table)
      .update({ ...(payload.payload || {}), updated_at: new Date().toISOString() })
      .eq('id', payload.id)
      .eq('owner_email', ownerEmail)
      .select()
      .single()
    if (error) throw error
    return { ok: true, row: data }
  }

  if (action === 'delete') {
    let query = supabase.from(table).delete().eq('owner_email', ownerEmail)
    if (payload.id !== undefined && payload.id !== null && payload.id !== '') {
      query = query.eq('id', payload.id)
    }
    if (payload.filters) {
      Object.entries(payload.filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query = query.eq(k, v)
      })
    }
    const { error } = await query
    if (error) throw error
    return { ok: true, deleted: true }
  }

  throw new Error('unknown action')
}

export async function run360Crud(action, table, ownerEmail, payload = {}) {
  // Utiliser Supabase directement (l'endpoint Netlify n'existe pas)
  return runViaSupabase(action, table, ownerEmail, payload)
}

