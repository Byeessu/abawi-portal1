import { supabase } from './supabase'
import { normalizePlan, isSystemAdmin } from './permissions'

// Cache mémoire côté client (durée de vie : 30s)
const cache = new Map()
const CACHE_TTL = 30000

function cacheKey(email, toolKey, planId) {
  return `${email}::${toolKey}::${planId}`
}

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key, data) {
  cache.set(key, { ts: Date.now(), data })
}

/**
 * Récupère la config de quota pour un outil + plan
 */
export async function getQuotaConfig(toolKey, planId = 'all') {
  // Cherche d'abord le quota spécifique au plan, sinon 'all'
  const { data, error } = await supabase
    .from('tool_quotas')
    .select('*')
    .eq('tool_key', toolKey)
    .in('plan_id', [planId, 'all'])
    .order('limit_count', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return null
  return data[0]
}

/**
 * Compte les usages d'un user pour un outil dans la fenêtre glissante
 */
export async function countUsage(email, toolKey, windowType) {
  const since = {
    hour:  new Date(Date.now() - 60 * 60 * 1000),
    day:   new Date(Date.now() - 24 * 60 * 60 * 1000),
    week:  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  }[windowType] || new Date(Date.now() - 24 * 60 * 60 * 1000)

  const { count, error } = await supabase
    .from('tool_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .eq('tool_key', toolKey)
    .gte('used_at', since.toISOString())

  if (error) {
    console.error('[quota] countUsage error:', error)
    return 0
  }
  return count || 0
}

/**
 * Vérifie si un user peut utiliser un outil (crédits + quota)
 * @returns { ok, reason, quota, used, remaining, windowType, limit, costOverride, nextReset }
 */
export async function checkQuota(email, toolKey, membre = null) {
  const planId = normalizePlan(membre) || 'gratuit'

  // Admin = pas de quota
  if (isSystemAdmin(membre)) {
    return { ok: true, reason: null, unlimited: true, used: 0, remaining: 999999, limit: 0 }
  }

  const cfg = await getQuotaConfig(toolKey, planId)

  // Pas de quota configuré = illimité (juste crédits gèrent)
  if (!cfg || cfg.limit_count === 0) {
    return { ok: true, reason: null, unlimited: false, used: 0, remaining: null, limit: 0 }
  }

  const used = await countUsage(email, toolKey, cfg.window_type)
  const remaining = Math.max(0, cfg.limit_count - used)

  if (remaining > 0) {
    return {
      ok: true,
      reason: null,
      used,
      remaining,
      limit: cfg.limit_count,
      windowType: cfg.window_type,
      costOverride: cfg.cost_override,
      actionType: cfg.action_type,
      nextReset: getNextReset(cfg.window_type),
    }
  }

  // Dépassement — selon action_type
  if (cfg.action_type === 'block') {
    return {
      ok: false,
      reason: 'quota_exceeded',
      message: `Limite atteinte : ${cfg.limit_count} utilisations par ${translateWindow(cfg.window_type)}`,
      used,
      remaining: 0,
      limit: cfg.limit_count,
      windowType: cfg.window_type,
      nextReset: getNextReset(cfg.window_type),
    }
  }

  if (cfg.action_type === 'premium_cost') {
    return {
      ok: true,
      reason: null,
      used,
      remaining: 0,
      limit: cfg.limit_count,
      windowType: cfg.window_type,
      costOverride: cfg.cost_override,
      actionType: 'premium_cost',
      nextReset: getNextReset(cfg.window_type),
      message: `Dépassement — coût majoré : ${cfg.cost_override} crédits`,
    }
  }

  // warn
  return {
    ok: true,
    reason: null,
    used,
    remaining: 0,
    limit: cfg.limit_count,
    windowType: cfg.window_type,
    actionType: 'warn',
    nextReset: getNextReset(cfg.window_type),
    message: `Attention : vous avez atteint votre limite de ${cfg.limit_count} par ${translateWindow(cfg.window_type)}`,
  }
}

/**
 * Vérifie le cooldown entre 2 utilisations d'un outil
 * @returns { ok, lastUsedAt, minutesSince, minutesLeft }
 */
export async function checkCooldown(email, toolKey, cooldownMin = 0) {
  if (!cooldownMin || cooldownMin <= 0) return { ok: true, minutesLeft: 0 }

  const { data, error } = await supabase
    .from('tool_usage_logs')
    .select('used_at')
    .eq('email', email)
    .eq('tool_key', toolKey)
    .order('used_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return { ok: true, minutesLeft: 0 }

  const lastUsed = new Date(data[0].used_at)
  const minutesSince = Math.floor((Date.now() - lastUsed.getTime()) / (60 * 1000))
  const minutesLeft = Math.max(0, cooldownMin - minutesSince)

  return {
    ok: minutesLeft <= 0,
    lastUsedAt: lastUsed,
    minutesSince,
    minutesLeft,
  }
}

/**
 * Log un usage (appelé APRÈS le succès de l'outil)
 */
export async function logUsage(email, toolKey, cost = 0, planId = '', metadata = {}) {
  try {
    await supabase.from('tool_usage_logs').insert({
      email,
      tool_key: toolKey,
      cost,
      plan_id: planId || normalizePlan({ plan: planId }),
      metadata,
    })
  } catch (e) {
    console.error('[quota] logUsage error:', e)
  }
}

/**
 * Récupère les stats de quota pour un user (dashboard)
 */
export async function getUserQuotas(email, membre = null) {
  const planId = normalizePlan(membre) || 'gratuit'
  const { data: configs } = await supabase
    .from('tool_quotas')
    .select('*')
    .in('plan_id', [planId, 'all'])

  if (!configs || configs.length === 0) return []

  const results = []
  for (const cfg of configs) {
    const used = await countUsage(email, cfg.tool_key, cfg.window_type)
    results.push({
      toolKey: cfg.tool_key,
      limit: cfg.limit_count,
      used,
      remaining: Math.max(0, cfg.limit_count - used),
      windowType: cfg.window_type,
      actionType: cfg.action_type,
      nextReset: getNextReset(cfg.window_type),
    })
  }
  return results
}

// Helpers
function getNextReset(windowType) {
  const now = new Date()
  switch (windowType) {
    case 'hour':
      return new Date(now.getTime() + 60 * 60 * 1000 - (now.getTime() % (60 * 60 * 1000)))
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    case 'week': {
      const day = now.getDay()
      const daysUntilMonday = day === 0 ? 1 : 8 - day
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday)
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1)
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
}

function translateWindow(w) {
  return { hour: 'heure', day: 'jour', week: 'semaine', month: 'mois' }[w] || w
}

/**
 * Formate le temps restant avant reset
 */
export function formatTimeUntil(date) {
  const diff = new Date(date) - Date.now()
  if (diff <= 0) return 'maintenant'
  const h = Math.floor(diff / (1000 * 60 * 60))
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
