exports.config = {
  schedule: '0 7 * * *', // daily 07:00 UTC
}

exports.handler = async function handler() {
  try {
    const rows = await fetchRecentQueue(500)
    const logs = await fetchRecentDispatchLogs(200)

    const processed = rows.length
    const done = rows.filter((r) => r.status === 'done').length
    const failed = rows.filter((r) => r.status === 'failed').length
    const running = rows.filter((r) => r.status === 'running').length
    const pending = rows.filter((r) => r.status === 'pending').length
    const failureRate = processed > 0 ? (failed / processed) : 0

    const byPlatform = {}
    rows.forEach((r) => {
      const key = r.platform || 'unknown'
      if (!byPlatform[key]) byPlatform[key] = { total: 0, failed: 0, done: 0 }
      byPlatform[key].total += 1
      if (r.status === 'failed') byPlatform[key].failed += 1
      if (r.status === 'done') byPlatform[key].done += 1
    })

    const recommendations = []
    if (failureRate >= 0.35) recommendations.push('Réduire le volume live et renforcer les tests dry-run avant publication.')
    if (pending > 20) recommendations.push('Augmenter la fréquence du worker queue ou limiter les envois batch.')
    if (running > 0) recommendations.push('Surveiller les jobs bloqués en running et implémenter timeout kill.')
    if (recommendations.length === 0) recommendations.push('Maintenir le rythme actuel, système stable sur les dernières 24h.')

    const report = {
      period: 'last_24h',
      generatedAt: new Date().toISOString(),
      totals: { processed, done, failed, running, pending, failureRate: Number((failureRate * 100).toFixed(2)) },
      byPlatform,
      dispatchLogsCount: logs.length,
      recommendations,
    }

    await writeAiJob('social-ops', 'daily_report', report)
    if (failureRate >= 0.4) {
      const criticalAlert = {
        level: 'critical',
        title: 'Rapport quotidien: taux d’échec critique',
        message: `Échec ${Math.round(failureRate * 100)}% sur 24h.`,
        report,
      }
      await writeAiJob('social-ops', 'alert', criticalAlert)
      await triggerOpsNotify({
        title: criticalAlert.title,
        level: criticalAlert.level,
        details: criticalAlert.message,
        context: { summary: report.totals, report },
      })
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, report }) }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) }
  }
}

async function fetchRecentQueue(limit = 500) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) return []
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/social_dispatch_queue?created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=${limit}`
  const res = await fetch(endpoint, { headers: authHeaders(serviceRole) })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function fetchRecentDispatchLogs(limit = 200) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) return []
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/social_dispatch_logs?created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=${limit}`
  const res = await fetch(endpoint, { headers: authHeaders(serviceRole) })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function writeAiJob(tool, jobType, payload) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) return
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/ai_jobs`
  await fetch(endpoint, {
    method: 'POST',
    headers: { ...authHeaders(serviceRole), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ tool, job_type: jobType, payload }),
  })
}

function authHeaders(serviceRole) {
  return {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
  }
}

async function triggerOpsNotify(alertPayload) {
  try {
    const baseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || ''
    if (!baseUrl) return
    await fetch(`${baseUrl.replace(/\/$/, '')}/.netlify/functions/social-ops-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertPayload),
    })
  } catch {}
}
