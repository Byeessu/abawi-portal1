import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { groqChatCompletion } from '../lib/groqClient'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

async function callGroq(prompt, maxTokens = 1200) {
  const data = await groqChatCompletion({
    model: GROQ_MODEL,
    max_tokens: maxTokens,
    temperature: 0.5,
    messages: [{ role: 'user', content: prompt }],
  }, GROQ_KEY)
  return (data?.choices?.[0]?.message?.content || '').trim()
}

function safeJson(raw) {
  const clean = String(raw || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()
  return JSON.parse(clean)
}

async function marketingCrud(action, table, ownerEmail, payload = {}) {
  const res = await fetch('/.netlify/functions/marketing-crud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, table, ownerEmail, ...payload }),
  })
  const out = await res.json().catch(() => ({}))
  if (!res.ok || out?.ok === false) throw new Error(out?.error || `marketing-crud ${res.status}`)
  return out
}

const field = { width: '100%', borderRadius: 10, border: '1px solid #1A2332', background: '#070B0F', color: '#F0F2F5', padding: '10px 12px', fontSize: '0.85rem', fontFamily: 'Outfit,sans-serif' }
const label = { display: 'block', color: '#8B95A5', fontSize: '0.75rem', marginBottom: 6, fontWeight: 700, letterSpacing: 0.5 }

export default function AutonomousMarketingExpert({ owner, toast }) {
  const [context, setContext] = useState({
    company: 'ABAWI',
    sector: 'Éducation / Business / Outils IA',
    market: 'Sénégal, Afrique francophone',
    audience: 'Entrepreneurs, étudiants, professionnels',
    offer: 'Guides, podcasts, outils IA, abonnement ABAWI+',
    objective: 'Acquisition + conversion + fidélisation',
    monthlyBudget: '300000',
  })
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [creative, setCreative] = useState('')
  const [runningAuto, setRunningAuto] = useState(false)
  const [campaignPreview, setCampaignPreview] = useState(null)
  const [simulatingActivation, setSimulatingActivation] = useState(false)

  const canRun = useMemo(() => context.company && context.market && context.objective, [context])

  async function runStrategicWatch() {
    setLoading(true)
    setAnalysis(null)
    try {
      const prompt = `Tu es un directeur marketing expert Afrique en veille stratégique continue.
Analyse le contexte suivant et propose un plan d'action autonome orienté performance.
Contexte:
- Entreprise: ${context.company}
- Secteur: ${context.sector}
- Marché: ${context.market}
- Audience: ${context.audience}
- Offre: ${context.offer}
- Objectif: ${context.objective}
- Budget mensuel FCFA: ${context.monthlyBudget}

Retourne UNIQUEMENT un JSON valide de cette forme:
{
  "marketSignals": ["..."],
  "opportunities": [{"title":"...","why":"...","timing":"...","channel":"...","offer":"..."}],
  "campaigns": [{
    "name":"...",
    "platform":"instagram|facebook|linkedin|whatsapp|email|pub",
    "goal":"...",
    "budget":120000,
    "timelineDays":14,
    "target":"...",
    "angle":"...",
    "cta":"...",
    "kpi":["...","..."],
    "posts":[{"title":"...","type":"...","dayOffset":1,"time":"09:00","content":"..."}]
  }],
  "advice": ["..."],
  "nextActions": ["..."]
}`
      const raw = await callGroq(prompt, 1800)
      const parsed = safeJson(raw)
      setAnalysis(parsed)
      toast?.('✅ Veille IA terminée: plan stratégique généré', 'success')
    } catch (e) {
      toast?.(`❌ Veille IA impossible: ${e.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function activateCampaign(campaign) {
    if (!owner) {
      toast?.('❌ Utilisateur non identifié', 'error')
      return
    }
    try {
      const now = new Date()
      const dateDebut = now.toISOString().slice(0, 10)
      const dateFin = new Date(now.getTime() + (Number(campaign.timelineDays || 14) * 86400000)).toISOString().slice(0, 10)
      const campPayload = {
        nom: campaign.name,
        plateforme: campaign.platform || 'instagram',
        budget: Number(campaign.budget || 0),
        depense: 0,
        revenus: 0,
        date_debut: dateDebut,
        date_fin: dateFin,
        statut: 'active',
        objectif: campaign.goal || '',
        notes: `IA angle: ${campaign.angle || ''}`,
      }
      await marketingCrud('insert', 'marketing_campagnes', owner, { payload: campPayload })

      const postRows = (campaign.posts || []).map((p) => {
        const target = new Date(now.getTime() + (Number(p.dayOffset || 0) * 86400000)).toISOString().slice(0, 10)
        return {
          titre: p.title || campaign.name,
          plateforme: campaign.platform || 'instagram',
          type_contenu: p.type || 'Post promotionnel',
          date_publication: target,
          heure: p.time || '09:00',
          statut: 'planifié',
          contenu: p.content || '',
        }
      })
      if (postRows.length) {
        for (const row of postRows) {
          await marketingCrud('insert', 'marketing_posts', owner, { payload: row })
        }
      }
      try {
        await supabase.from('ai_jobs').insert({
          tool: 'marketing-autonomy-expert',
          job_type: 'campaign_activation',
          payload: { campaignName: campaign.name, platform: campaign.platform, postCount: postRows.length },
        })
      // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
      } catch {}
      toast?.(`✅ Campagne activée: ${campaign.name}`, 'success')
    } catch (e) {
      toast?.(`❌ Activation échouée: ${e.message}`, 'error')
    }
  }

  async function simulateCampaignActivation(campaign) {
    setSimulatingActivation(true)
    try {
      const prompt = `Simule l'activation de campagne suivante et donne un rendu final avant validation.
Nom: ${campaign.name}
Plateforme: ${campaign.platform}
Objectif: ${campaign.goal}
Budget: ${campaign.budget}
Angle: ${campaign.angle}
CTA: ${campaign.cta}
Posts: ${JSON.stringify(campaign.posts || [])}

Retourne un JSON:
{
  "readinessScore": 0-100,
  "risks": ["..."],
  "finalRender": {"hook":"...","body":"...","cta":"..."},
  "adjustments": ["..."],
  "goLiveRecommendation":"go|revise"
}`
      const raw = await callGroq(prompt, 900)
      const parsed = safeJson(raw)
      setCampaignPreview({ campaign, simulation: parsed })
    } catch (e) {
      toast?.(`❌ Simulation impossible: ${e.message}`, 'error')
    }
    setSimulatingActivation(false)
  }

  async function generateInfography(campaign) {
    setSelectedCampaign(campaign)
    setCreative('')
    try {
      const prompt = `Crée une infographie marketing textuelle prête à designer.
Campagne: ${campaign.name}
Plateforme: ${campaign.platform}
Objectif: ${campaign.goal}
Audience: ${campaign.target}
Angle: ${campaign.angle}
CTA: ${campaign.cta}
Retourne un format structuré:
TITRE
SOUS-TITRE
BLOCS (4 blocs max)
CHIFFRES CLÉS
OFFRE
CTA FINAL
STYLE VISUEL (palette couleurs, typographie, iconographie).`
      const out = await callGroq(prompt, 1000)
      setCreative(out)
    } catch (e) {
      toast?.(`❌ Génération infographie impossible: ${e.message}`, 'error')
    }
  }

  async function toggleAutonomy() {
    const next = !runningAuto
    setRunningAuto(next)
    if (owner) {
      try {
        await supabase.from('ai_jobs').insert({
          tool: 'marketing-autonomy-expert',
          job_type: next ? 'autonomy_on' : 'autonomy_off',
          payload: { owner, market: context.market, objective: context.objective },
        })
      // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
      } catch {}
    }
    toast?.(next ? '🤖 Autonomie marketing activée (veille + suggestions)' : '⏸️ Autonomie marketing désactivée', 'success')
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ border: '1px solid #1A2332', background: 'linear-gradient(135deg, rgba(236,72,153,0.14), rgba(2,6,23,0.75))', borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: '0 0 6px', color: '#F0F2F5' }}>Autonomie Marketing Expert</h3>
            <p style={{ margin: 0, color: '#A7B1C2', fontSize: '0.85rem' }}>Veille IA, recommandations, déclenchement campagnes validées et studio infographie publicitaire.</p>
          </div>
          <button onClick={toggleAutonomy} style={{ borderRadius: 999, padding: '8px 14px', border: `1px solid ${runningAuto ? 'rgba(24,168,74,0.45)' : 'rgba(240,180,41,0.35)'}`, background: runningAuto ? 'rgba(24,168,74,0.15)' : 'rgba(240,180,41,0.1)', color: runningAuto ? '#18A84A' : '#F0B429', fontWeight: 800, cursor: 'pointer' }}>
            {runningAuto ? 'AUTONOMIE ACTIVE' : 'ACTIVER AUTONOMIE'}
          </button>
        </div>
      </section>

      <section style={{ border: '1px solid #1A2332', borderRadius: 16, background: '#0D1117', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={label}>Entreprise</label><input style={field} value={context.company} onChange={(e) => setContext((s) => ({ ...s, company: e.target.value }))} /></div>
          <div><label style={label}>Secteur</label><input style={field} value={context.sector} onChange={(e) => setContext((s) => ({ ...s, sector: e.target.value }))} /></div>
          <div><label style={label}>Marché</label><input style={field} value={context.market} onChange={(e) => setContext((s) => ({ ...s, market: e.target.value }))} /></div>
          <div><label style={label}>Audience</label><input style={field} value={context.audience} onChange={(e) => setContext((s) => ({ ...s, audience: e.target.value }))} /></div>
          <div><label style={label}>Offre</label><input style={field} value={context.offer} onChange={(e) => setContext((s) => ({ ...s, offer: e.target.value }))} /></div>
          <div><label style={label}>Budget mensuel (FCFA)</label><input type="number" style={field} value={context.monthlyBudget} onChange={(e) => setContext((s) => ({ ...s, monthlyBudget: e.target.value }))} /></div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={label}>Objectif stratégique</label>
          <textarea style={{ ...field, minHeight: 84, resize: 'vertical' }} value={context.objective} onChange={(e) => setContext((s) => ({ ...s, objective: e.target.value }))} />
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <button onClick={runStrategicWatch} disabled={loading || !canRun} style={{ borderRadius: 10, border: 'none', padding: '10px 14px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', background: loading ? '#1A2332' : 'linear-gradient(135deg,#EC4899,#be185d)', color: '#fff' }}>
            {loading ? 'Analyse en cours...' : 'Lancer veille IA stratégique'}
          </button>
        </div>
      </section>

      {analysis && (
        <>
          <section style={{ border: '1px solid #1A2332', borderRadius: 16, background: '#0D1117', padding: 16 }}>
            <h4 style={{ marginTop: 0, color: '#F0F2F5' }}>Signaux marché détectés</h4>
            {(analysis.marketSignals || []).map((s, i) => (
              <div key={i} style={{ color: '#C8D3E0', fontSize: '0.84rem', marginBottom: 6 }}>• {s}</div>
            ))}
          </section>

          <section style={{ border: '1px solid #1A2332', borderRadius: 16, background: '#0D1117', padding: 16 }}>
            <h4 style={{ marginTop: 0, color: '#F0F2F5' }}>Campagnes proposées par l’IA</h4>
            <div style={{ display: 'grid', gap: 12 }}>
              {(analysis.campaigns || []).map((camp, i) => (
                <div key={`${camp.name}-${i}`} style={{ border: '1px solid #243044', borderRadius: 12, padding: 12, background: '#0A1017' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: '#F0F2F5', fontWeight: 800 }}>{camp.name}</div>
                      <div style={{ color: '#8B95A5', fontSize: '0.8rem' }}>{camp.platform} · budget {Number(camp.budget || 0).toLocaleString('fr')} FCFA · {camp.timelineDays || 14} jours</div>
                      <div style={{ color: '#C8D3E0', fontSize: '0.82rem', marginTop: 4 }}>{camp.goal}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => simulateCampaignActivation(camp)} style={{ borderRadius: 8, border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.12)', color: '#60A5FA', fontWeight: 800, padding: '7px 10px', cursor: 'pointer' }}>
                        {simulatingActivation ? 'Simulation...' : 'Simulation'}
                      </button>
                      <button onClick={() => activateCampaign(camp)} style={{ borderRadius: 8, border: '1px solid rgba(24,168,74,0.35)', background: 'rgba(24,168,74,0.12)', color: '#18A84A', fontWeight: 800, padding: '7px 10px', cursor: 'pointer' }}>Valider & Déclencher</button>
                      <button onClick={() => generateInfography(camp)} style={{ borderRadius: 8, border: '1px solid rgba(240,180,41,0.35)', background: 'rgba(240,180,41,0.1)', color: '#F0B429', fontWeight: 800, padding: '7px 10px', cursor: 'pointer' }}>Infographie IA</button>
                    </div>
                  </div>
                  {!!camp.kpi?.length && <div style={{ marginTop: 8, color: '#A7B1C2', fontSize: '0.78rem' }}>KPI: {camp.kpi.join(' • ')}</div>}
                </div>
              ))}
            </div>
          </section>

          <section style={{ border: '1px solid #1A2332', borderRadius: 16, background: '#0D1117', padding: 16 }}>
            <h4 style={{ marginTop: 0, color: '#F0F2F5' }}>Conseils IA actionnables</h4>
            {(analysis.advice || []).map((a, i) => (
              <div key={i} style={{ color: '#C8D3E0', fontSize: '0.84rem', marginBottom: 6 }}>• {a}</div>
            ))}
          </section>
        </>
      )}

      {(selectedCampaign || creative) && (
        <section style={{ border: '1px solid rgba(240,180,41,0.2)', borderRadius: 16, background: 'rgba(240,180,41,0.04)', padding: 16 }}>
          <h4 style={{ marginTop: 0, color: '#F0B429' }}>Studio Infographie IA</h4>
          {selectedCampaign && <p style={{ color: '#A7B1C2', fontSize: '0.82rem' }}>Campagne: {selectedCampaign.name}</p>}
          <textarea value={creative} onChange={(e) => setCreative(e.target.value)} style={{ ...field, minHeight: 220, resize: 'vertical', borderColor: 'rgba(240,180,41,0.28)' }} placeholder="Votre structure infographie sera affichée ici..." />
        </section>
      )}
      {campaignPreview && (
        <section style={{ border: '1px solid rgba(59,130,246,0.3)', borderRadius: 16, background: 'rgba(59,130,246,0.06)', padding: 16 }}>
          <h4 style={{ marginTop: 0, color: '#60A5FA' }}>Prévisualisation finale avant validation</h4>
          <div style={{ color: '#C8D3E0', fontSize: '0.82rem', marginBottom: 8 }}>
            Score: {campaignPreview.simulation?.readinessScore ?? '—'} · Recommandation: {campaignPreview.simulation?.goLiveRecommendation || '—'}
          </div>
          <div style={{ background: '#070B0F', border: '1px solid #1A2332', borderRadius: 10, padding: 12, color: '#C8D3E0' }}>
            <div><strong style={{ color: '#F0F2F5' }}>Hook:</strong> {campaignPreview.simulation?.finalRender?.hook || '—'}</div>
            <div style={{ marginTop: 6 }}><strong style={{ color: '#F0F2F5' }}>Body:</strong> {campaignPreview.simulation?.finalRender?.body || '—'}</div>
            <div style={{ marginTop: 6 }}><strong style={{ color: '#F0F2F5' }}>CTA:</strong> {campaignPreview.simulation?.finalRender?.cta || '—'}</div>
          </div>
          {!!campaignPreview.simulation?.adjustments?.length && (
            <div style={{ marginTop: 8, color: '#A7B1C2', fontSize: '0.78rem' }}>
              Ajustements: {campaignPreview.simulation.adjustments.join(' • ')}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
