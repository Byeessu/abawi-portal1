const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_KEY || ''
const GROQ_KEY = process.env.GROQ_API_KEY || ''

async function groqGenerate(prompt) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.75,
      }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
  } catch (e) {
    console.error('[groq]', e.message)
    return ''
  }
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const now = new Date()
  const in3days = new Date(now.getTime() + 3 * 86400000).toISOString()
  const in7days = new Date(now.getTime() + 7 * 86400000).toISOString()
  const today = now.toISOString()

  // Members expiring in next 3 days
  const { data: expiring3 } = await supabase
    .from('membres')
    .select('*')
    .eq('statut', 'actif')
    .neq('role', 'admin')
    .gte('date_fin', today)
    .lte('date_fin', in3days)

  // Members expiring between 3 and 7 days
  const { data: expiring7 } = await supabase
    .from('membres')
    .select('*')
    .eq('statut', 'actif')
    .neq('role', 'admin')
    .gt('date_fin', in3days)
    .lte('date_fin', in7days)

  const sent = []

  for (const membre of (expiring3 || [])) {
    const daysLeft = Math.ceil((new Date(membre.date_fin) - now) / 86400000)
    const prompt = `Tu es l'assistant d'ABAWI, plateforme éducative africaine premium.
Écris un rappel court et urgent en français pour ${membre.prenom || 'un membre'}.
Son abonnement ABAWI+ expire dans ${daysLeft} jour(s) seulement.
3 phrases max. Incite à renouveler sur abawi.sn. Termine par "L'équipe ABAWI 🏆"`
    const message = await groqGenerate(prompt)

    const { error } = await supabase.from('admin_messages').insert({
      membre_email: membre.email,
      membre_nom: `${membre.prenom || ''} ${membre.nom || ''}`.trim(),
      sujet: `⚠️ Votre abonnement ABAWI+ expire dans ${daysLeft} jour(s)`,
      message: message || `Bonjour ${membre.prenom || ''}, votre abonnement expire dans ${daysLeft} jour(s). Renouvelez maintenant sur abawi.sn pour conserver votre accès. L'équipe ABAWI 🏆`,
      canal: 'email',
      type: 'reminder',
      statut: 'envoye',
    })
    if (!error) sent.push({ email: membre.email, type: '3j', daysLeft })
  }

  for (const membre of (expiring7 || [])) {
    const daysLeft = Math.ceil((new Date(membre.date_fin) - now) / 86400000)
    const prompt = `Tu es l'assistant d'ABAWI, plateforme éducative africaine premium.
Écris un rappel amical en français pour ${membre.prenom || 'un membre'}.
Son abonnement ABAWI+ expire dans ${daysLeft} jours.
3 phrases max. Encourage à renouveler sur abawi.sn. Termine par "L'équipe ABAWI 🏆"`
    const message = await groqGenerate(prompt)

    const { error } = await supabase.from('admin_messages').insert({
      membre_email: membre.email,
      membre_nom: `${membre.prenom || ''} ${membre.nom || ''}`.trim(),
      sujet: `📅 Rappel — Abonnement ABAWI+ expire dans ${daysLeft} jours`,
      message: message || `Bonjour ${membre.prenom || ''}, votre abonnement expire dans ${daysLeft} jours. Pensez à le renouveler sur abawi.sn pour rester au top. L'équipe ABAWI 🏆`,
      canal: 'email',
      type: 'reminder',
      statut: 'envoye',
    })
    if (!error) sent.push({ email: membre.email, type: '7j', daysLeft })
  }

  console.log(`[send-reminders] Sent ${sent.length} reminders (${(expiring3||[]).length} urgent, ${(expiring7||[]).length} early)`)

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      sent: sent.length,
      details: sent,
    }),
  }
}
