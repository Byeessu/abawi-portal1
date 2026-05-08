exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) }
  }
  try {
    const body = JSON.parse(event.body || '{}')
    const action = String(body.action || '')
    const table = String(body.table || '')
    const ownerEmail = String(body.ownerEmail || '')
    if (!ownerEmail) return bad('ownerEmail required')
    if (!['marketing_posts', 'marketing_campagnes'].includes(table)) return bad('table not allowed')

    if (action === 'list') {
      const data = await listRows(table, ownerEmail)
      return ok({ data })
    }
    if (action === 'insert') {
      const row = await insertRow(table, ownerEmail, body.payload || {})
      return ok({ row })
    }
    if (action === 'update') {
      const row = await updateRow(table, ownerEmail, body.id, body.payload || {})
      return ok({ row })
    }
    if (action === 'delete') {
      await deleteRow(table, ownerEmail, body.id)
      return ok({ deleted: true })
    }
    return bad('unknown action')
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) }
  }
}

function ok(payload) { return { statusCode: 200, body: JSON.stringify({ ok: true, ...payload }) } }
function bad(error) { return { statusCode: 400, body: JSON.stringify({ ok: false, error }) } }

function sbEnv() {
  const url = process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Supabase server env missing')
  return { url: url.replace(/\/$/, ''), key }
}

function headers(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

async function listRows(table, ownerEmail) {
  const { url, key } = sbEnv()
  const endpoint = `${url}/rest/v1/${table}?owner_email=eq.${encodeURIComponent(ownerEmail)}&order=created_at.desc`
  const res = await fetch(endpoint, { headers: headers(key) })
  if (!res.ok) throw new Error(`${table} list failed (${res.status})`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function insertRow(table, ownerEmail, payload) {
  const { url, key } = sbEnv()
  const endpoint = `${url}/rest/v1/${table}`
  const row = {
    ...payload,
    owner_email: ownerEmail,
    created_at: payload.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { ...headers(key), Prefer: 'return=representation' },
    body: JSON.stringify([row]),
  })
  if (!res.ok) throw new Error(`${table} insert failed (${res.status})`)
  const data = await res.json()
  return Array.isArray(data) ? data[0] : null
}

async function updateRow(table, ownerEmail, id, payload) {
  if (!id) throw new Error('id required')
  const { url, key } = sbEnv()
  const endpoint = `${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&owner_email=eq.${encodeURIComponent(ownerEmail)}`
  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers: { ...headers(key), Prefer: 'return=representation' },
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error(`${table} update failed (${res.status})`)
  const data = await res.json()
  return Array.isArray(data) ? data[0] : null
}

async function deleteRow(table, ownerEmail, id) {
  if (!id) throw new Error('id required')
  const { url, key } = sbEnv()
  const endpoint = `${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&owner_email=eq.${encodeURIComponent(ownerEmail)}`
  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: { ...headers(key), Prefer: 'return=minimal' },
  })
  if (!res.ok) throw new Error(`${table} delete failed (${res.status})`)
}
