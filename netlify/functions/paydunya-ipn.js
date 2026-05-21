const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

const ABAWI_PLUS_IDS = ['aplus', 'aplus-mensuel', 'aplus-annuel', 'abawi-plus', 'abawi-plus-mensuel', 'abawi-plus-annuel']

// Vérifie la signature PayDunya: sha512(master_key + ':' + token)
function verifyPayDunyaHash(masterKey, token, receivedHash) {
  if (!masterKey || !token || !receivedHash) return false
  const expected = crypto.createHash('sha512').update(`${masterKey}:${token}`).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(receivedHash, 'hex'))
}

exports.handler = async function (event) {
  console.log('[PayDunya IPN] Method:', event.httpMethod)
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  // 1. Vérification secret IPN (paramètre URL configuré dans le dashboard PayDunya)
  const ipnSecret = process.env.PAYDUNYA_IPN_SECRET
  const receivedSecret = event.queryStringParameters?.ipn_secret
  if (ipnSecret && receivedSecret !== ipnSecret) {
    console.warn('[PayDunya IPN] Invalid IPN secret')
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    console.error('[PayDunya IPN] JSON parse error, raw body:', event.body?.substring(0, 200))
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  // 2. Vérification signature HMAC PayDunya
  const masterKey = process.env.PAYDUNYA_MASTER_KEY
  if (masterKey && payload.hash && payload.token) {
    if (!verifyPayDunyaHash(masterKey, payload.token, payload.hash)) {
      console.warn('[PayDunya IPN] Invalid hash signature')
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) }
    }
  }

  console.log('[PayDunya IPN] Status:', payload.status)
  console.log('[PayDunya IPN] Token:', payload.token)
  console.log('[PayDunya IPN] Amount:', payload.invoice?.total_amount)
  console.log('[PayDunya IPN] Customer email:', payload.customer?.email)
  console.log('[PayDunya IPN] Custom data:', JSON.stringify(payload.custom_data || {}))

  if (payload.status !== 'completed') {
    console.log('[PayDunya IPN] Non-completed status, skipping activation. Status:', payload.status)
    return { statusCode: 200, body: JSON.stringify({ received: true, action: 'none' }) }
  }

  try {
    const productId = payload.custom_data?.product_id || ''
    const billingType = payload.custom_data?.billing_type || ''
    const email = (payload.custom_data?.email || payload.customer?.email || '').toLowerCase().trim()
    const montant = payload.invoice?.total_amount || 0
    const token = payload.token || ''

    // 1. Vérifier si paiement déjà enregistré (idempotence)
    if (token) {
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('paydunya_token', token)
        .maybeSingle()

      if (existing) {
        console.log('[PayDunya IPN] Duplicate IPN, token already recorded:', token)
        return { statusCode: 200, body: JSON.stringify({ received: true, action: 'duplicate' }) }
      }
    }

    // 2. Enregistrer le paiement
    const { error: payError } = await supabase.from('payments').insert({
      product_id: productId,
      product_type: payload.custom_data?.product_type || 'guide',
      email,
      telephone: payload.customer?.phone || '',
      montant,
      methode: payload.payment_method || 'paydunya',
      statut: 'paid',
      paydunya_token: token,
    })

    if (payError) {
      console.error('[PayDunya IPN] Error inserting payment:', payError.message)
      // Continue anyway — activation is more important
    } else {
      console.log('[PayDunya IPN] Payment recorded for:', email, '| product:', productId, '| amount:', montant)
    }

    // 3. Activer ABAWI+ si applicable
    const isAbawPlus = ABAWI_PLUS_IDS.includes(productId) ||
      payload.custom_data?.product_type === 'abonnement'

    if (isAbawPlus && email) {
      const isAnnuel = billingType === 'annuel' || productId.includes('annuel')
      const normalizedBillingType = isAnnuel ? 'annuel' : 'mensuel'
      const days = isAnnuel ? 365 : 30
      const dateFin = new Date(Date.now() + days * 86400000).toISOString()

      // Check if member exists
      const { data: membre } = await supabase
        .from('membres')
        .select('id, statut, date_fin')
        .eq('email', email)
        .maybeSingle()

      if (membre) {
        // Extend existing subscription
        const currentEnd = membre.date_fin ? new Date(membre.date_fin) : new Date()
        const baseDate = currentEnd > new Date() ? currentEnd : new Date()
        const newDateFin = new Date(baseDate.getTime() + days * 86400000).toISOString()

        // Try saving billing_type when column exists, fallback gracefully otherwise.
        let { error: updErr } = await supabase
          .from('membres')
          .update({ statut: 'actif', date_fin: newDateFin, billing_type: normalizedBillingType })
          .eq('email', email)
        if (updErr && updErr.message?.toLowerCase().includes('billing_type')) {
          const fallback = await supabase
            .from('membres')
            .update({ statut: 'actif', date_fin: newDateFin })
            .eq('email', email)
          updErr = fallback.error
        }

        if (updErr) {
          console.error('[PayDunya IPN] Error updating membre:', updErr.message)
        } else {
          console.log('[PayDunya IPN] ABAWI+ extended for:', email, '| new date_fin:', newDateFin, '| days added:', days)
        }
      } else {
        // Create new member
        let { error: insErr } = await supabase.from('membres').insert({
          email,
          telephone: payload.customer?.phone || '',
          prenom: payload.customer?.first_name || '',
          nom: payload.customer?.last_name || '',
          statut: 'actif',
          date_fin: dateFin,
          role: 'membre',
          billing_type: normalizedBillingType,
        })
        if (insErr && insErr.message?.toLowerCase().includes('billing_type')) {
          const fallback = await supabase.from('membres').insert({
            email,
            telephone: payload.customer?.phone || '',
            prenom: payload.customer?.first_name || '',
            nom: payload.customer?.last_name || '',
            statut: 'actif',
            date_fin: dateFin,
            role: 'membre',
          })
          insErr = fallback.error
        }
        if (insErr) {
          console.error('[PayDunya IPN] Error creating membre:', insErr.message)
        } else {
          console.log('[PayDunya IPN] ABAWI+ new member created:', email, '| date_fin:', dateFin)
        }
      }

      return { statusCode: 200, body: JSON.stringify({ received: true, action: 'activated', email }) }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true, action: 'payment_recorded' }) }

  } catch (err) {
    console.error('[PayDunya IPN] Unhandled error:', err.message, err.stack)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
