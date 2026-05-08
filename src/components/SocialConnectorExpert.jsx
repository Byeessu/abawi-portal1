import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const CONNECTORS = [
  { id: 'facebook', label: 'Facebook Pages', icon: '📘', hint: 'Page Access Token', accountHint: 'page_id' },
  { id: 'instagram', label: 'Instagram Business', icon: '📸', hint: 'IG Business + Meta Token', accountHint: 'ig_user_id' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', hint: 'OAuth Access Token', accountHint: 'urn:li:person:... ou urn:li:organization:...' },
  { id: 'x', label: 'X / Twitter', icon: '🐦', hint: 'API Key / Secret / Bearer' },
  { id: 'whatsapp', label: 'WhatsApp Business', icon: '💬', hint: 'Cloud API Token + Phone ID', accountHint: 'phone_number_id' },
  { id: 'telegram', label: 'Telegram Channel', icon: '📣', hint: 'Bot token + chat id', accountHint: 'chat_id' },
  { id: 'email', label: 'Emailing', icon: '📧', hint: 'SMTP/API provider key' },
]

const defaultCfg = () =>
  Object.fromEntries(CONNECTORS.map((c) => [c.id, { enabled: false, token: '', accountId: '', label: '' }]))

function mask(s) {
  if (!s) return ''
  if (s.length < 8) return '****'
  return `${s.slice(0, 4)}...${s.slice(-3)}`
}

export default function SocialConnectorExpert({ owner, toast }) {
  const [config, setConfig] = useState(defaultCfg())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [selected, setSelected] = useState([])
  const [dispatchMode, setDispatchMode] = useState('dry-run')
  const [useQueue, setUseQueue] = useState(true)
  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [queueRows, setQueueRows] = useState([])
  const [queuePaused, setQueuePaused] = useState(false)
  const [opsBusy, setOpsBusy] = useState(false)
  const [latestOpsReport, setLatestOpsReport] = useState(null)
  const [latestOpsAlert, setLatestOpsAlert] = useState(null)
  const [alertsConfig, setAlertsConfig] = useState({
    telegramBotToken: '',
    telegramChatId: '',
    whatsappToken: '',
    whatsappPhoneId: '',
    whatsappTo: '',
    emailWebhook: '',
  })

  useEffect(() => {
    if (!owner) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('content_key,content_value')
          .eq('content_type', 'social_connector')
          .eq('owner_email', owner)
        if (!error && !cancelled && Array.isArray(data) && data.length) {
          const next = defaultCfg()
          data.forEach((row) => {
            const key = row.content_key
            if (!next[key]) return
            next[key] = { ...next[key], ...(row.content_value || {}) }
          })
          setConfig(next)
        }
      // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
      } catch {}
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [owner])

  useEffect(() => {
    if (!owner) return
    loadHistory()
    loadQueue()
    loadPauseState()
    loadOpsSignals()
    loadAlertsConfig()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [owner])

  const readyCount = useMemo(
    () => CONNECTORS.filter((c) => config[c.id]?.enabled && config[c.id]?.token).length,
    [config]
  )

  async function saveConnectors() {
    if (!owner) return
    setSaving(true)
    try {
      const rows = Object.entries(config).map(([id, value]) => ({
        owner_email: owner,
        content_type: 'social_connector',
        content_key: id,
        content_value: value,
        updated_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'owner_email,content_type,content_key' })
      if (error) throw new Error(error.message)
      toast?.('✅ Connecteurs sociaux sauvegardés', 'success')
    } catch (e) {
      toast?.(`❌ Sauvegarde connecteurs échouée: ${e.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  function toggleSelection(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function dispatch() {
    if (!campaignName.trim() || !message.trim() || selected.length === 0) {
      toast?.('⚠️ Renseigne campagne, message et plateformes', 'warning')
      return
    }
    const payload = {
      ownerEmail: owner || '',
      campaignName: campaignName.trim(),
      mode: dispatchMode,
      asyncQueue: dispatchMode === 'live' ? useQueue : false,
      message: message.trim(),
      targets: selected.map((id) => ({
        platform: id,
        accountId: config[id]?.accountId || '',
        token: config[id]?.token || '',
        label: config[id]?.label || '',
      })),
    }
    try {
      const res = await fetch('/.netlify/functions/social-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`dispatch ${res.status}`)
      const out = await res.json()
      setReport(out)
      await loadHistory()
      await loadQueue()
      await supabase.from('ai_jobs').insert({
        tool: 'social-connector-expert',
        job_type: dispatchMode === 'live' ? 'social_dispatch_live' : 'social_dispatch_dry_run',
        payload: out,
      })
      toast?.('✅ Dispatch social traité', 'success')
    } catch (e) {
      toast?.(`❌ Dispatch social échoué: ${e.message}`, 'error')
    }
  }

  async function loadHistory() {
    if (!owner) return
    setHistoryLoading(true)
    try {
      const { data, error } = await supabase
        .from('social_dispatch_logs')
        .select('id,campaign_name,mode,payload,created_at')
        .eq('owner_email', owner)
        .order('created_at', { ascending: false })
        .limit(15)
      if (!error) setHistory(data || [])
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch {}
    setHistoryLoading(false)
  }

  async function loadQueue() {
    if (!owner) return
    try {
      const { data, error } = await supabase
        .from('social_dispatch_queue')
        .select('id,campaign_name,platform,status,attempts,last_error,created_at,started_at,finished_at')
        .eq('owner_email', owner)
        .order('created_at', { ascending: false })
        .limit(25)
      if (!error) setQueueRows(data || [])
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch {}
  }

  async function loadPauseState() {
    if (!owner) return
    try {
      const res = await fetch('/.netlify/functions/social-queue-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_pause', ownerEmail: owner }),
      })
      if (!res.ok) return
      const out = await res.json()
      setQueuePaused(!!out.paused)
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch {}
  }

  async function loadOpsSignals() {
    try {
      const { data, error } = await supabase
        .from('ai_jobs')
        .select('job_type,payload,created_at')
        .eq('tool', 'social-ops')
        .order('created_at', { ascending: false })
        .limit(20)
      if (error || !Array.isArray(data)) return
      const report = data.find((r) => r.job_type === 'daily_report')
      const alert = data.find((r) => r.job_type === 'alert')
      setLatestOpsReport(report || null)
      setLatestOpsAlert(alert || null)
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch {}
  }

  async function loadAlertsConfig() {
    if (!owner) return
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('content_value')
        .eq('owner_email', owner)
        .eq('content_type', 'social_ops')
        .eq('content_key', 'alerts_config')
        .maybeSingle()
      if (!error && data?.content_value) {
        setAlertsConfig((prev) => ({ ...prev, ...data.content_value }))
      }
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch {}
  }

  async function saveAlertsConfig() {
    if (!owner) return
    try {
      const { error } = await supabase.from('site_content').upsert({
        owner_email: owner,
        content_type: 'social_ops',
        content_key: 'alerts_config',
        content_value: alertsConfig,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_email,content_type,content_key' })
      if (error) throw new Error(error.message)
      toast?.('✅ Config alertes sauvegardée (référence dashboard)', 'success')
    } catch (e) {
      toast?.(`❌ Sauvegarde config alertes impossible: ${e.message}`, 'error')
    }
  }

  async function retryFailed() {
    if (!owner) return
    setOpsBusy(true)
    try {
      const res = await fetch('/.netlify/functions/social-queue-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry_failed', ownerEmail: owner }),
      })
      if (!res.ok) throw new Error(`retry ${res.status}`)
      const out = await res.json()
      toast?.(`✅ ${out.updated || 0} job(s) failed remis en pending`, 'success')
      await loadQueue()
    } catch (e) {
      toast?.(`❌ Relance failed impossible: ${e.message}`, 'error')
    }
    setOpsBusy(false)
  }

  async function togglePause() {
    if (!owner) return
    const next = !queuePaused
    setOpsBusy(true)
    try {
      const res = await fetch('/.netlify/functions/social-queue-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_pause', ownerEmail: owner, paused: next }),
      })
      if (!res.ok) throw new Error(`pause ${res.status}`)
      setQueuePaused(next)
      toast?.(next ? '⏸️ Queue en pause' : '▶️ Queue reprise', 'success')
    } catch (e) {
      toast?.(`❌ Changement pause/reprise impossible: ${e.message}`, 'error')
    }
    setOpsBusy(false)
  }

  async function testConnector(id) {
    const cfg = config[id]
    if (!cfg?.enabled || !cfg?.token) {
      toast?.(`⚠️ ${id}: active le connecteur et renseigne le token`, 'warning')
      return
    }
    try {
      const res = await fetch('/.netlify/functions/social-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'dry-run',
          campaignName: `TEST_${id.toUpperCase()}`,
          message: 'Test de connecteur social ABAWI',
          targets: [{ platform: id, accountId: cfg.accountId || '', token: cfg.token || '', label: cfg.label || '' }],
        }),
      })
      if (!res.ok) throw new Error(`test ${res.status}`)
      const out = await res.json()
      const status = out?.results?.[0]?.status || 'unknown'
      toast?.(`🧪 Test ${id}: ${status}`, 'success')
      setReport(out)
    } catch (e) {
      toast?.(`❌ Test ${id} échoué: ${e.message}`, 'error')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ border: '1px solid #1A2332', borderRadius: 16, background: '#0D1117', padding: 16 }}>
        <h3 style={{ marginTop: 0, color: '#F0F2F5' }}>Connecteur Social Expert</h3>
        <p style={{ color: '#8B95A5', fontSize: '0.84rem' }}>Connecte tes canaux, prépare des campagnes validées, puis déclenche un dispatch piloté.</p>
        <div style={{ color: '#18A84A', fontSize: '0.82rem', fontWeight: 700 }}>{readyCount} connecteur(s) prêt(s)</div>
      </section>

      <section style={{ border: '1px solid #1A2332', borderRadius: 16, background: '#0D1117', padding: 16 }}>
        {loading ? (
          <p style={{ color: '#8B95A5' }}>Chargement connecteurs...</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {CONNECTORS.map((c) => {
              const v = config[c.id]
              return (
                <div key={c.id} style={{ border: '1px solid #243044', borderRadius: 12, padding: 10, background: '#0A1017' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ color: '#F0F2F5', fontWeight: 700 }}>{c.icon} {c.label}</div>
                    <label style={{ color: '#8B95A5', fontSize: '0.8rem' }}>
                      <input
                        type="checkbox"
                        checked={!!v.enabled}
                        onChange={(e) => setConfig((p) => ({ ...p, [c.id]: { ...p[c.id], enabled: e.target.checked } }))}
                        style={{ marginRight: 6 }}
                      />
                      Actif
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 8 }}>
                    <input
                      placeholder={`${c.hint}`}
                      value={v.token}
                      onChange={(e) => setConfig((p) => ({ ...p, [c.id]: { ...p[c.id], token: e.target.value } }))}
                      style={inp}
                    />
                    <input
                      placeholder={c.accountHint || 'Account/Page/Channel ID'}
                      value={v.accountId}
                      onChange={(e) => setConfig((p) => ({ ...p, [c.id]: { ...p[c.id], accountId: e.target.value } }))}
                      style={inp}
                    />
                    <input
                      placeholder="Label interne"
                      value={v.label}
                      onChange={(e) => setConfig((p) => ({ ...p, [c.id]: { ...p[c.id], label: e.target.value } }))}
                      style={inp}
                    />
                  </div>
                  <div style={{ marginTop: 6, color: '#8B95A5', fontSize: '0.74rem' }}>
                    Token: {v.token ? mask(v.token) : 'non configuré'}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <button
                      onClick={() => testConnector(c.id)}
                      style={{ borderRadius: 8, border: '1px solid #2A3344', background: '#111827', color: '#9CA3AF', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Tester
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <button onClick={saveConnectors} disabled={saving} style={{ ...btn, background: 'linear-gradient(135deg,#3B82F6,#2563EB)' }}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder connecteurs'}
          </button>
        </div>
      </section>

      <section style={{ border: '1px solid #1A2332', borderRadius: 16, background: '#0D1117', padding: 16 }}>
        <h4 style={{ marginTop: 0, color: '#F0F2F5' }}>Dispatch campagne multi-plateforme</h4>
        <div style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Nom campagne" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} style={inp} />
          <textarea placeholder="Message à publier..." value={message} onChange={(e) => setMessage(e.target.value)} style={{ ...inp, minHeight: 110, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CONNECTORS.map((c) => (
              <button key={c.id} onClick={() => toggleSelection(c.id)} style={{ borderRadius: 999, border: `1px solid ${selected.includes(c.id) ? '#EC4899' : '#2A3344'}`, background: selected.includes(c.id) ? 'rgba(236,72,153,0.15)' : '#111827', color: selected.includes(c.id) ? '#EC4899' : '#9CA3AF', padding: '6px 10px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700 }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ color: '#8B95A5', fontSize: '0.8rem' }}>
              <input type="radio" checked={dispatchMode === 'dry-run'} onChange={() => setDispatchMode('dry-run')} style={{ marginRight: 6 }} />
              Dry run (simulation)
            </label>
            <label style={{ color: '#8B95A5', fontSize: '0.8rem' }}>
              <input type="radio" checked={dispatchMode === 'live'} onChange={() => setDispatchMode('live')} style={{ marginRight: 6 }} />
              Live (déclenchement)
            </label>
          </div>
          {dispatchMode === 'live' && (
            <label style={{ color: '#8B95A5', fontSize: '0.8rem' }}>
              <input type="checkbox" checked={useQueue} onChange={(e) => setUseQueue(e.target.checked)} style={{ marginRight: 6 }} />
              Utiliser la file d’attente (recommandé)
            </label>
          )}
          <button onClick={dispatch} style={{ ...btn, background: 'linear-gradient(135deg,#EC4899,#be185d)' }}>Déclencher dispatch</button>
        </div>
      </section>

      {report && (
        <section style={{ border: '1px solid rgba(24,168,74,0.24)', borderRadius: 16, background: 'rgba(24,168,74,0.06)', padding: 16 }}>
          <h4 style={{ marginTop: 0, color: '#18A84A' }}>Rapport de dispatch</h4>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#C8D3E0', fontSize: '0.78rem' }}>
            {JSON.stringify(report, null, 2)}
          </pre>
        </section>
      )}

      <section style={{ border: '1px solid #1A2332', borderRadius: 16, background: '#0D1117', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ margin: 0, color: '#F0F2F5' }}>Historique dispatch (live status)</h4>
          <button onClick={loadHistory} style={{ borderRadius: 8, border: '1px solid #2A3344', background: '#111827', color: '#9CA3AF', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
            Actualiser
          </button>
        </div>
        {historyLoading ? (
          <p style={{ color: '#8B95A5', margin: 0 }}>Chargement historique...</p>
        ) : history.length === 0 ? (
          <p style={{ color: '#8B95A5', margin: 0 }}>Aucun dispatch enregistré.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {history.map((h) => {
              const sum = h.payload?.summary || {}
              return (
                <div key={h.id} style={{ border: '1px solid #243044', borderRadius: 10, background: '#0A1017', padding: '8px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ color: '#F0F2F5', fontWeight: 700, fontSize: '0.82rem' }}>{h.campaign_name || 'Campagne'}</div>
                    <div style={{ color: '#8B95A5', fontSize: '0.73rem' }}>{new Date(h.created_at).toLocaleString('fr-FR')}</div>
                  </div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginTop: 4 }}>
                    mode={h.mode} · posted={sum.posted || 0} · failed={sum.failed || 0} · retried={sum.retried || 0}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section style={{ border: '1px solid #1A2332', borderRadius: 16, background: '#0D1117', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ margin: 0, color: '#F0F2F5' }}>File d’attente dispatch</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={retryFailed} disabled={opsBusy} style={{ borderRadius: 8, border: '1px solid rgba(240,180,41,0.35)', background: 'rgba(240,180,41,0.1)', color: '#F0B429', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
              Relancer failed
            </button>
            <button onClick={togglePause} disabled={opsBusy} style={{ borderRadius: 8, border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
              {queuePaused ? 'Reprendre queue' : 'Pause queue'}
            </button>
            <button onClick={loadQueue} style={{ borderRadius: 8, border: '1px solid #2A3344', background: '#111827', color: '#9CA3AF', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
              Actualiser
            </button>
          </div>
        </div>
        <div style={{ marginBottom: 8, color: queuePaused ? '#F0B429' : '#18A84A', fontSize: '0.76rem', fontWeight: 700 }}>
          {queuePaused ? 'Queue state: PAUSED' : 'Queue state: RUNNING'}
        </div>
        {queueRows.length === 0 ? (
          <p style={{ color: '#8B95A5', margin: 0 }}>Aucune tâche en file pour le moment.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {queueRows.map((q) => (
              <div key={q.id} style={{ border: '1px solid #243044', borderRadius: 10, background: '#0A1017', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ color: '#F0F2F5', fontWeight: 700, fontSize: '0.82rem' }}>#{q.id} · {q.campaign_name || 'Campagne'} · {q.platform}</div>
                  <div style={{ color: statusColor(q.status), fontWeight: 800, fontSize: '0.75rem' }}>{q.status}</div>
                </div>
                <div style={{ color: '#9CA3AF', fontSize: '0.74rem', marginTop: 4 }}>
                  attempts={q.attempts || 0} · created={new Date(q.created_at).toLocaleString('fr-FR')}
                </div>
                {!!q.last_error && <div style={{ color: '#EF4444', fontSize: '0.74rem', marginTop: 4 }}>{q.last_error}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      {(latestOpsAlert || latestOpsReport) && (
        <section style={{ border: '1px solid rgba(240,180,41,0.28)', borderRadius: 16, background: 'rgba(240,180,41,0.06)', padding: 16 }}>
          <h4 style={{ marginTop: 0, color: '#F0B429' }}>Signals Ops (auto)</h4>
          {latestOpsAlert && (
            <div style={{ marginBottom: 8, color: '#EF4444', fontSize: '0.8rem', fontWeight: 700 }}>
              ⚠️ {latestOpsAlert.payload?.title || 'Alerte système'} — {new Date(latestOpsAlert.created_at).toLocaleString('fr-FR')}
            </div>
          )}
          {latestOpsReport && (
            <div style={{ color: '#C8D3E0', fontSize: '0.78rem', lineHeight: 1.6 }}>
              Rapport quotidien: processed={latestOpsReport.payload?.totals?.processed ?? 0}, failed={latestOpsReport.payload?.totals?.failed ?? 0}, failureRate={latestOpsReport.payload?.totals?.failureRate ?? 0}%.
            </div>
          )}
        </section>
      )}

      <section style={{ border: '1px solid #1A2332', borderRadius: 16, background: '#0D1117', padding: 16 }}>
        <h4 style={{ marginTop: 0, color: '#F0F2F5' }}>Canaux d’alerte (Ops)</h4>
        <p style={{ color: '#8B95A5', fontSize: '0.78rem' }}>
          Configure ici les valeurs de référence. Les notifications live utilisent les variables d’environnement serveur.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="Telegram Bot Token" value={alertsConfig.telegramBotToken} onChange={(e) => setAlertsConfig((s) => ({ ...s, telegramBotToken: e.target.value }))} style={inp} />
          <input placeholder="Telegram Chat ID" value={alertsConfig.telegramChatId} onChange={(e) => setAlertsConfig((s) => ({ ...s, telegramChatId: e.target.value }))} style={inp} />
          <input placeholder="WhatsApp Token" value={alertsConfig.whatsappToken} onChange={(e) => setAlertsConfig((s) => ({ ...s, whatsappToken: e.target.value }))} style={inp} />
          <input placeholder="WhatsApp Phone ID" value={alertsConfig.whatsappPhoneId} onChange={(e) => setAlertsConfig((s) => ({ ...s, whatsappPhoneId: e.target.value }))} style={inp} />
          <input placeholder="WhatsApp To" value={alertsConfig.whatsappTo} onChange={(e) => setAlertsConfig((s) => ({ ...s, whatsappTo: e.target.value }))} style={inp} />
          <input placeholder="Email Webhook URL" value={alertsConfig.emailWebhook} onChange={(e) => setAlertsConfig((s) => ({ ...s, emailWebhook: e.target.value }))} style={inp} />
        </div>
        <div style={{ marginTop: 10 }}>
          <button onClick={saveAlertsConfig} style={{ ...btn, background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' }}>
            Sauvegarder config alertes
          </button>
        </div>
      </section>
    </div>
  )
}

const inp = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid #1A2332',
  background: '#070B0F',
  color: '#F0F2F5',
  padding: '9px 10px',
  fontSize: '0.82rem',
  fontFamily: 'Outfit,sans-serif',
}

const btn = {
  border: 'none',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: 'Outfit,sans-serif',
}

function statusColor(status) {
  if (status === 'done') return '#18A84A'
  if (status === 'running') return '#3B82F6'
  if (status === 'failed') return '#EF4444'
  return '#F0B429'
}
