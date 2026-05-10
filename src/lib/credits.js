import { supabase } from './supabase'
import { hasAllInclusiveAccess, normalizePlan } from './permissions'

export const CREDIT_COSTS = {
  guide: 5, fascicule: 3, podcast: 2, news_premium: 1,
  cv: 2, lettre: 2, business_plan: 5, pitch: 4, facture: 1, analyse_cv: 3,
  finance_elite: 10, juridique_elite: 8, comptable_elite: 8, rh_elite: 6,
  immobilier_elite: 6, consultant_elite: 6,
  tontine: 5, senticket_create: 5, senticket_export: 2,
  studio_photo: 3, studio_logo: 3, infographie: 4,
  traduction: 2, dictionnaire: 1, exegetika: 3, sante: 2,
  autoroute: 2, smart_office: 5, maxavis: 3, editeur_pro: 2,
  crm_mensuel: 50, planification_mensuel: 30, stats_mensuel: 20,
  abawi_ia_quiz: 1, abawi_ia_recherche: 1, abawi_ia_defi: 1,
  abawi_ia_simulation: 2, abawi_ia_apprentissage: 2,
  store_view: 0,
}

function canBypassCredits(membre) {
  if (!membre) return false
  const plan = normalizePlan(membre)
  return membre.role === 'admin' || plan === 'admin' || hasAllInclusiveAccess(membre)
}

function isActiveMember(membre) {
  if (!membre) return false
  const expired = membre.date_fin && new Date(membre.date_fin) < new Date()
  return membre.statut === 'actif' && !expired
}

export async function checkCredits(email, type) {
  const cost = CREDIT_COSTS[type] || 0
  if (cost === 0) return { ok: true, cost: 0, solde: 0 }
  const { data: membre } = await supabase.from('membres').select('credits, plan, plan_type, role, statut, date_fin').eq('email', email).single()
  if (!membre) return { ok: false, reason: 'Membre non trouve' }
  if (canBypassCredits(membre)) return { ok: true, cost: 0, solde: 999999 }
  if (!isActiveMember(membre)) return { ok: false, reason: 'Abonnement inactif ou expiré' }
  if (membre.credits < cost) return { ok: false, reason: 'Credits insuffisants', solde: membre.credits, cost, manquant: cost - membre.credits }
  return { ok: true, cost, solde: membre.credits }
}

export async function debitCredits(email, type, produitId = '') {
  const cost = CREDIT_COSTS[type] || 0
  if (cost === 0) return { ok: true }
  const { data: membre } = await supabase.from('membres').select('credits, plan, plan_type, role, statut, date_fin, credits_total_utilises').eq('email', email).single()
  if (!membre) return { ok: false, reason: 'Membre non trouve' }
  if (canBypassCredits(membre)) return { ok: true }
  if (!isActiveMember(membre)) return { ok: false, reason: 'Abonnement inactif ou expiré' }
  if (membre.credits < cost) return { ok: false, reason: 'Credits insuffisants' }
  const newCredits = membre.credits - cost
  await supabase.from('membres').update({ credits: newCredits, credits_total_utilises: (membre.credits_total_utilises || 0) + cost }).eq('email', email)
  await supabase.from('credit_transactions').insert({ email, type: 'debit', montant: cost, solde_avant: membre.credits, solde_apres: newCredits, description: `Utilisation ${type}`, produit_id: produitId, produit_type: type })
  return { ok: true, solde: newCredits, cost }
}

export async function rechargeCredits(email, packId) {
  const { data: pack } = await supabase.from('credit_packs').select('*').eq('id', packId).single()
  if (!pack) return { ok: false, reason: 'Pack introuvable' }
  const { data: membre } = await supabase.from('membres').select('credits').eq('email', email).single()
  const totalCredits = (pack.credits || 0) + (pack.bonus_credits || 0)
  const newCredits = (membre?.credits || 0) + totalCredits
  await supabase.from('membres').update({ credits: newCredits }).eq('email', email)
  await supabase.from('credit_transactions').insert({ email, type: 'recharge', montant: totalCredits, solde_avant: membre?.credits || 0, solde_apres: newCredits, description: `Recharge ${pack.nom}`, produit_id: packId })
  return { ok: true, solde: newCredits, credits_ajoutes: totalCredits }
}

export async function getCredits(email) {
  const { data } = await supabase.from('membres').select('credits, plan').eq('email', email).single()
  return data?.credits || 0
}
