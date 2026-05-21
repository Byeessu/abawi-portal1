import { supabase } from './supabase'
import { hasAllInclusiveAccess, normalizePlan, isSystemAdmin } from './permissions'

/** 1 crédit = 1000 tokens */
export const TOKENS_PER_CREDIT = 1000

/** Estime les tokens consommés par une action (texte = ~0.25 token/caractère) */
export function estimateTokens(text = '', baseCost = 0) {
  const textTokens = Math.ceil((text.length || 0) * 0.25)
  return Math.max(baseCost * TOKENS_PER_CREDIT, textTokens + baseCost * TOKENS_PER_CREDIT)
}

/** Convertit un coût crédit en tokens */
export function creditsToTokens(credits) {
  return (credits || 0) * TOKENS_PER_CREDIT
}

/** Convertit des tokens en crédits (arrondi au supérieur) */
export function tokensToCredits(tokens) {
  return Math.ceil((tokens || 0) / TOKENS_PER_CREDIT)
}

export const CREDIT_COSTS = {
  guide: 5, fascicule: 2, podcast: 2, news_premium: 1,
  cv: 2, lettre: 2, business_plan: 8, pitch: 6, facture: 0, analyse_cv: 3,
  finance_elite: 15, juridique_elite: 12, comptable_elite: 12, rh_elite: 8,
  immobilier_elite: 8, consultant_elite: 8,
  tontine: 8, senticket_create: 5, senticket_export: 2,
  studio_photo: 3, infographie: 4,
  dictionnaire: 0, exegetika: 5, sante: 0, traduction: 1,
  autoroute: 0, abspacegps: 8, smart_office: 5, maxavis: 5, editeur_pro: 0,
  crm_mensuel: 50, planification_mensuel: 30, stats_mensuel: 20,
  abawi_ia_quiz: 0, abawi_ia_recherche: 0, abawi_ia_defi: 0,
  abawi_ia_simulation: 0, abawi_ia_apprentissage: 0,
  store_view: 0,
  audio_studio: 8,
  image_pro: 3,
  qr_code_pro: 1,
  pro_card_elite: 1,
  format_converter: 0,
  dictionnaire_elite: 1,
  abawi_translator_elite: 1,
  abawi_ia: 1,
}

function canBypassCredits(membre) {
  if (!membre) return false
  const plan = normalizePlan(membre)
  return isSystemAdmin(membre) || plan === 'admin' || hasAllInclusiveAccess(membre)
}

function isActiveMember(membre) {
  if (!membre) return false
  const expired = membre.date_fin && new Date(membre.date_fin) < new Date()
  return membre.statut === 'actif' && !expired
}

export async function checkCredits(email, type) {
  const cost = CREDIT_COSTS[type] || 0
  if (cost === 0) return { ok: true, cost: 0, solde: 0, tokens: 0 }
  const { data: membre } = await supabase.from('membres').select('credits, tokens, plan, plan_type, role, statut, date_fin').eq('email', email).single()
  if (!membre) return { ok: false, reason: 'Membre non trouve' }
  if (canBypassCredits(membre)) return { ok: true, cost: 0, solde: 999999, tokens: 999999999 }
  if (!isActiveMember(membre)) return { ok: false, reason: 'Abonnement inactif ou expiré' }

  const totalTokens = (membre.tokens || 0) + (membre.credits || 0) * TOKENS_PER_CREDIT
  const tokenCost = creditsToTokens(cost)

  if (totalTokens < tokenCost) {
    return { ok: false, reason: 'Credits insuffisants', solde: membre.credits, tokens: membre.tokens, cost, manquant: cost - membre.credits }
  }
  return { ok: true, cost, solde: membre.credits, tokens: membre.tokens }
}

export async function debitCredits(email, type, produitId = '', tokenOverride = 0) {
  const cost = CREDIT_COSTS[type] || 0
  if (cost === 0 && tokenOverride === 0) return { ok: true, tokensUsed: 0 }
  const { data: membre } = await supabase.from('membres').select('credits, tokens, plan, plan_type, role, statut, date_fin, credits_total_utilises, tokens_total_utilises').eq('email', email).single()
  if (!membre) return { ok: false, reason: 'Membre non trouve' }
  if (canBypassCredits(membre)) return { ok: true, tokensUsed: 0 }
  if (!isActiveMember(membre)) return { ok: false, reason: 'Abonnement inactif ou expiré' }

  const tokenCost = tokenOverride > 0 ? tokenOverride : creditsToTokens(cost)
  const totalTokens = (membre.tokens || 0) + (membre.credits || 0) * TOKENS_PER_CREDIT

  if (totalTokens < tokenCost) return { ok: false, reason: 'Credits insuffisants' }

  // Priorité : dépenser les tokens d'abord, puis convertir les crédits si besoin
  let remainingTokens = tokenCost
  let newTokens = membre.tokens || 0
  let newCredits = membre.credits || 0

  if (newTokens >= remainingTokens) {
    newTokens -= remainingTokens
    remainingTokens = 0
  } else {
    remainingTokens -= newTokens
    newTokens = 0
    const creditsNeeded = tokensToCredits(remainingTokens)
    newCredits -= creditsNeeded
    remainingTokens = 0
  }

  await supabase.from('membres').update({
    credits: newCredits,
    tokens: newTokens,
    credits_total_utilises: (membre.credits_total_utilises || 0) + (membre.credits - newCredits),
    tokens_total_utilises: (membre.tokens_total_utilises || 0) + tokenCost,
  }).eq('email', email)

  await supabase.from('credit_transactions').insert({
    email, type: 'debit', montant: cost,
    tokens_montant: tokenCost,
    solde_avant: membre.credits, solde_apres: newCredits,
    description: `Utilisation ${type}`, produit_id: produitId, produit_type: type,
  })

  return { ok: true, solde: newCredits, tokens: newTokens, tokensUsed: tokenCost, cost }
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

export async function refundCredits(email, type, montant, produitId = '') {
  if (!email || !montant || montant <= 0) return { ok: false, reason: 'Parametres invalides' }
  const { data: membre } = await supabase.from('membres').select('credits').eq('email', email).single()
  if (!membre) return { ok: false, reason: 'Membre non trouve' }
  const newCredits = (membre.credits || 0) + montant
  await supabase.from('membres').update({ credits: newCredits }).eq('email', email)
  await supabase.from('credit_transactions').insert({ email, type: 'refund', montant, solde_avant: membre.credits || 0, solde_apres: newCredits, description: `Remboursement ${type}`, produit_id: produitId, produit_type: type })
  return { ok: true, solde: newCredits, credits_rembourses: montant }
}

/** Récupère crédits + tokens en temps réel */
export async function getTokenBalance(email) {
  const { data } = await supabase.from('membres').select('credits, tokens, tokens_total_utilises').eq('email', email).single()
  if (!data) return { credits: 0, tokens: 0, total: 0, consumed: 0 }
  return {
    credits: data.credits || 0,
    tokens: data.tokens || 0,
    total: (data.tokens || 0) + (data.credits || 0) * TOKENS_PER_CREDIT,
    consumed: data.tokens_total_utilises || 0,
  }
}

export async function getCredits(email) {
  const { data } = await supabase.from('membres').select('credits, plan').eq('email', email).single()
  return data?.credits || 0
}
