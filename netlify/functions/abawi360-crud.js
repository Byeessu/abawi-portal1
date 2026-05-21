async function verifyToken(event, ownerEmail) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return false
  const { url, key } = env()
  const { createClient } = require('@supabase/supabase-js')
  const sb = createClient(url, key)
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return false
  return user.email?.toLowerCase() === ownerEmail.toLowerCase()
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') return res(405, { ok: false, error: 'Method not allowed' })
  try {
    const body = JSON.parse(event.body || '{}')
    const action = String(body.action || '')
    const table = String(body.table || '')
    const ownerEmail = String(body.ownerEmail || '')
    const payload = body.payload || {}
    const id = body.id
    const filters = body.filters || {}

    if (!ownerEmail) return res(400, { ok: false, error: 'ownerEmail required' })
    if (!ALLOWED_TABLES.includes(table)) return res(400, { ok: false, error: 'table not allowed' })

    const authorized = await verifyToken(event, ownerEmail)
    if (!authorized) return res(401, { ok: false, error: 'Unauthorized' })

    if (action === 'list') return res(200, { ok: true, data: await listRows(table, ownerEmail, filters) })
    if (action === 'insert') return res(200, { ok: true, row: await insertRow(table, ownerEmail, payload) })
    if (action === 'update') return res(200, { ok: true, row: await updateRow(table, ownerEmail, id, payload) })
    if (action === 'delete') return res(200, { ok: true, deleted: await deleteRows(table, ownerEmail, filters, id) })

    return res(400, { ok: false, error: 'unknown action' })
  } catch (e) {
    return res(500, { ok: false, error: e.message || 'Server error' })
  }
}

const ALLOWED_TABLES = ['crm_contacts', 'projets', 'taches', 'okr_objectifs', 'stat_formulaires', 'stat_reponses', 'ai_jobs']

function env() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Supabase env missing on function')
  return { url, key }
}

function headers(key, plus = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...plus }
}

function queryFromFilters(filters = {}) {
  return Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=eq.${encodeURIComponent(String(v))}`)
    .join('&')
}

async function listRows(table, ownerEmail, filters = {}) {
  const { url, key } = env()
  const baseFilters = { owner_email: ownerEmail, ...filters }
  const query = queryFromFilters(baseFilters)
  const endpoint = `${url}/rest/v1/${table}?${query}&order=created_at.desc`
  const r = await fetch(endpoint, { headers: headers(key) })
  if (!r.ok) throw new Error(`${table} list failed (${r.status})`)
  const data = await r.json()
  return Array.isArray(data) ? data : []
}

async function insertRow(table, ownerEmail, payload) {
  const { url, key } = env()
  const row = { ...payload, owner_email: ownerEmail, updated_at: new Date().toISOString() }
  const endpoint = `${url}/rest/v1/${table}`
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: headers(key, { Prefer: 'return=representation' }),
    body: JSON.stringify([row]),
  })
  if (!r.ok) throw new Error(`${table} insert failed (${r.status})`)
  const data = await r.json()
  return Array.isArray(data) ? data[0] : null
}

async function updateRow(table, ownerEmail, id, payload) {
  if (!id) throw new Error('id required')
  const { url, key } = env()
  const endpoint = `${url}/rest/v1/${table}?id=eq.${encodeURIComponent(String(id))}&owner_email=eq.${encodeURIComponent(ownerEmail)}`
  const r = await fetch(endpoint, {
    method: 'PATCH',
    headers: headers(key, { Prefer: 'return=representation' }),
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
  })
  if (!r.ok) throw new Error(`${table} update failed (${r.status})`)
  const data = await r.json()
  return Array.isArray(data) ? data[0] : null
}

async function deleteRows(table, ownerEmail, filters = {}, id) {
  const { url, key } = env()
  const safeFilters = { ...filters, owner_email: ownerEmail }
  if (id !== undefined && id !== null && id !== '') safeFilters.id = id
  const query = queryFromFilters(safeFilters)
  const endpoint = `${url}/rest/v1/${table}?${query}`
  const r = await fetch(endpoint, {
    method: 'DELETE',
    headers: headers(key, { Prefer: 'return=minimal' }),
  })
  if (!r.ok) throw new Error(`${table} delete failed (${r.status})`)
  return true
}

function res(statusCode, body) {
  return { statusCode, body: JSON.stringify(body) }
}
