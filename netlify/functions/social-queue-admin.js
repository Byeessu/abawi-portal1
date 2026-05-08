exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) }
  }
  try {
    const body = JSON.parse(event.body || '{}')
    const action = String(body.action || '')
    const ownerEmail = String(body.ownerEmail || '')
    if (!ownerEmail) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'ownerEmail required' }) }

    if (action === 'retry_failed') {
      const count = await retryFailed(ownerEmail)
      return { statusCode: 200, body: JSON.stringify({ ok: true, action, updated: count }) }
    }

    if (action === 'set_pause') {
      const paused = !!body.paused
      await savePauseFlag(ownerEmail, paused)
      return { statusCode: 200, body: JSON.stringify({ ok: true, action, paused }) }
    }

    if (action === 'get_pause') {
      const paused = await getPauseFlag(ownerEmail)
      return { statusCode: 200, body: JSON.stringify({ ok: true, action, paused }) }
    }

    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Unknown action' }) }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) }
  }
}

async function retryFailed(ownerEmail) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) throw new Error('Supabase server env missing')

  const selectUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/social_dispatch_queue?owner_email=eq.${encodeURIComponent(ownerEmail)}&status=eq.failed&select=id`
  const res = await fetch(selectUrl, { headers: authHeaders(serviceRole) })
  if (!res.ok) throw new Error(`select failed ${res.status}`)
  const rows = await res.json()
  if (!Array.isArray(rows) || rows.length === 0) return 0

  let updated = 0
  for (const row of rows) {
    const patchUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/social_dispatch_queue?id=eq.${encodeURIComponent(row.id)}`
    const patch = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { ...authHeaders(serviceRole), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        status: 'pending',
        last_error: null,
        started_at: null,
        finished_at: null,
      }),
    })
    if (patch.ok) updated += 1
  }
  return updated
}

async function savePauseFlag(ownerEmail, paused) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) throw new Error('Supabase server env missing')
  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/site_content`
  const row = {
    owner_email: ownerEmail,
    content_type: 'social_queue',
    content_key: 'paused',
    content_value: { paused: !!paused },
    updated_at: new Date().toISOString(),
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders(serviceRole), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([row]),
  })
  if (!res.ok) throw new Error(`save pause failed ${res.status}`)
}

async function getPauseFlag(ownerEmail) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) throw new Error('Supabase server env missing')
  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/site_content?owner_email=eq.${encodeURIComponent(ownerEmail)}&content_type=eq.social_queue&content_key=eq.paused&select=content_value`
  const res = await fetch(url, { headers: authHeaders(serviceRole) })
  if (!res.ok) throw new Error(`get pause failed ${res.status}`)
  const data = await res.json()
  const paused = !!(Array.isArray(data) && data[0]?.content_value?.paused)
  return paused
}

function authHeaders(serviceRole) {
  return {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
  }
}
