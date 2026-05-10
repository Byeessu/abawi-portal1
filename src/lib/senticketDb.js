/* ── SenTicket Database Layer — Supabase ── */
import { supabase } from './supabase'

/* ═══ EVENTS ═══ */
export async function fetchEvents() {
  const { data, error } = await supabase
    .from('senticket_events')
    .select('*, senticket_tickets(*)')
    .order('created_at', { ascending: false })
  if (error) { console.error('[SenTicket DB] fetchEvents:', error); return null }
  return data.map(e => ({
    id: e.id,
    titre: e.titre,
    description: e.description,
    categorie: e.categorie,
    ville: e.ville,
    lieu: e.lieu,
    date: e.date,
    heure: e.heure,
    cover_url: e.cover_url,
    featured: e.featured,
    statut: e.statut,
    commission_rate: e.commission_rate,
    organizer_id: e.organizer_id,
    billets: (e.senticket_tickets || []).map(t => ({
      id: t.id,
      nom: t.nom,
      prix: t.prix,
      places: t.places,
      vendus: t.vendus,
    })),
    image: '',
  }))
}

export async function createEvent(payload) {
  const { event, billets } = payload
  const { data: ev, error } = await supabase
    .from('senticket_events')
    .insert(event)
    .select()
    .single()
  if (error) { console.error('[SenTicket DB] createEvent:', error); return null }
  if (billets?.length) {
    await supabase.from('senticket_tickets').insert(billets.map(b => ({ ...b, event_id: ev.id })))
  }
  return ev.id
}

export async function updateEvent(eventId, payload) {
  const { event, billets } = payload
  const { error } = await supabase.from('senticket_events').update(event).eq('id', eventId)
  if (error) { console.error('[SenTicket DB] updateEvent:', error); return false }
  if (billets?.length) {
    await supabase.from('senticket_tickets').delete().eq('event_id', eventId)
    await supabase.from('senticket_tickets').insert(billets.map(b => ({ ...b, event_id: eventId })))
  }
  return true
}

export async function deleteEvent(eventId) {
  const { error } = await supabase.from('senticket_events').delete().eq('id', eventId)
  if (error) { console.error('[SenTicket DB] deleteEvent:', error); return false }
  return true
}

/* ═══ ORDERS ═══ */
export async function fetchOrders(userId) {
  const { data, error } = await supabase
    .from('senticket_orders')
    .select('*, senticket_events!inner(titre)')
    .eq('user_id', userId)
    .order('date_achat', { ascending: false })
  if (error) { console.error('[SenTicket DB] fetchOrders:', error); return null }
  return data.map(o => ({
    id: o.id,
    eventId: o.event_id,
    eventTitre: o.senticket_events?.titre || '',
    billetId: o.ticket_id,
    billetNom: '', // filled later if needed
    prix: Math.round((o.prix_total || 0) / (o.qty || 1)),
    qty: o.qty,
    total: o.prix_total,
    commission: o.commission,
    discount: o.discount,
    netOrganisateur: o.net_organisateur,
    acheteur: o.acheteur || {},
    paymentMethod: o.payment_method,
    couponCode: o.coupon_code,
    groupEmails: o.group_emails || [],
    statut: o.statut,
    qrData: o.qr_data,
    scanned: o.scanned,
    dateAchat: o.date_achat,
  }))
}

export async function createOrder(order) {
  const { data, error } = await supabase.from('senticket_orders').insert(order).select().single()
  if (error) { console.error('[SenTicket DB] createOrder:', error); return null }
  return data
}

export async function updateTicketSales(ticketId, qty) {
  const { error } = await supabase.rpc('increment_ticket_sales', { ticket_id: ticketId, qty })
  if (error) {
    // fallback if rpc not created
    const { data: t } = await supabase.from('senticket_tickets').select('vendus').eq('id', ticketId).single()
    if (t) await supabase.from('senticket_tickets').update({ vendus: (t.vendus || 0) + qty }).eq('id', ticketId)
  }
}

/* ═══ FAVORITES ═══ */
export async function fetchFavorites(userId) {
  const { data, error } = await supabase
    .from('senticket_favorites')
    .select('event_id')
    .eq('user_id', userId)
  if (error) { console.error('[SenTicket DB] fetchFavorites:', error); return new Set() }
  return new Set(data.map(f => f.event_id))
}

export async function toggleFavorite(userId, eventId, isAdding) {
  if (isAdding) {
    const { error } = await supabase.from('senticket_favorites').insert({ user_id: userId, event_id: eventId })
    if (error && !error.message.includes('duplicate')) console.error('[SenTicket DB] addFav:', error)
  } else {
    await supabase.from('senticket_favorites').delete().eq('user_id', userId).eq('event_id', eventId)
  }
}

/* ═══ REVIEWS ═══ */
export async function fetchReviews(eventId) {
  const { data, error } = await supabase
    .from('senticket_reviews')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  if (error) { console.error('[SenTicket DB] fetchReviews:', error); return [] }
  return data
}

export async function upsertReview(userId, eventId, review) {
  const { data: existing } = await supabase
    .from('senticket_reviews')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle()
  const payload = { event_id: eventId, user_id: userId, stars: review.stars, text: review.text || '' }
  if (existing) {
    const { error } = await supabase.from('senticket_reviews').update(payload).eq('id', existing.id)
    if (error) console.error('[SenTicket DB] updateReview:', error)
  } else {
    const { error } = await supabase.from('senticket_reviews').insert(payload)
    if (error) console.error('[SenTicket DB] insertReview:', error)
  }
}

/* ═══ WITHDRAWALS ═══ */
export async function fetchWithdrawals(organizerId) {
  const { data, error } = await supabase
    .from('senticket_withdrawals')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false })
  if (error) { console.error('[SenTicket DB] fetchWithdrawals:', error); return null }
  return data.map(w => ({ id: w.id, eventId: w.event_id, montant: w.montant, methode: w.methode, telephone: w.telephone, statut: w.statut, date: w.created_at }))
}

export async function createWithdrawal(payload) {
  const { data, error } = await supabase.from('senticket_withdrawals').insert(payload).select().single()
  if (error) { console.error('[SenTicket DB] createWithdrawal:', error); return null }
  return data
}

/* ═══ VIEWS ═══ */
export async function bumpView(eventId) {
  await supabase.from('senticket_views').insert({ event_id: eventId, ip_hash: 'anon' })
}

export async function fetchViewCount(eventId) {
  const { count, error } = await supabase.from('senticket_views').select('*', { count: 'exact', head: true }).eq('event_id', eventId)
  if (error) return 0
  return count || 0
}

/* ═══ SCAN / VALIDATE ═══ */
export async function fetchOrderByQr(qrData) {
  const { data, error } = await supabase
    .from('senticket_orders')
    .select('*, senticket_events!inner(titre, date, heure, lieu)')
    .eq('qr_data', qrData)
    .maybeSingle()
  if (error || !data) return null
  return {
    ...data,
    eventTitre: data.senticket_events?.titre || '',
    eventDate: data.senticket_events?.date || '',
    eventHeure: data.senticket_events?.heure || '',
    eventLieu: data.senticket_events?.lieu || '',
  }
}

export async function markOrderScanned(orderId) {
  const { error } = await supabase.from('senticket_orders').update({ scanned: true }).eq('id', orderId)
  if (error) console.error('[SenTicket DB] markScanned:', error)
  return !error
}

/* ═══ EMAIL NOTIFICATIONS (simulation / log) ═══ */
export async function sendTicketEmail({ to, subject, body }) {
  console.log('[SenTicket Email]', { to, subject })
  try {
    await supabase.functions.invoke('send-email', {
      body: { to, subject, body, from: 'SenTicket <contact@abawi.sn>' },
    })
  } catch {
    // Edge function may not exist — fallback silent
  }
  return true
}

/* ═══ PAIEMENT PAYDUNYA ═══ */
export async function initiatePayment({ amount, description, orderId, returnUrl, buyerEmail, buyerPhone }) {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: { amount, description, orderId, returnUrl, buyerEmail, buyerPhone },
    })
    if (error || !data?.success) {
      console.error('[SenTicket Payment] initiate failed:', error || data?.error)
      return null
    }
    return data
  } catch (err) {
    console.error('[SenTicket Payment] error:', err)
    return null
  }
}

export async function verifyPayment(token) {
  try {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { token },
    })
    if (error) {
      console.error('[SenTicket Payment] verify failed:', error)
      return null
    }
    return data
  } catch (err) {
    console.error('[SenTicket Payment] verify error:', err)
    return null
  }
}
