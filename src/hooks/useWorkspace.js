import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const LS_PREFIX = 'abawi_workspace_v1_'
const DEFAULT_TTL = 30 // days

function isExpired(entry) {
  if (!entry?.expires_at) return false
  return new Date(entry.expires_at) < new Date()
}

function makeExpiry(ttlDays) {
  const d = new Date()
  d.setDate(d.getDate() + (ttlDays || DEFAULT_TTL))
  return d.toISOString()
}

/* Local fallback (anonymous users) */
function lsKey(toolId) { return LS_PREFIX + toolId }

function lsLoad(toolId) {
  try {
    const raw = JSON.parse(localStorage.getItem(lsKey(toolId)) || '[]')
    return raw.filter(e => !isExpired(e))
  } catch { return [] }
}

function lsSave(toolId, entries) {
  // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
  try { localStorage.setItem(lsKey(toolId), JSON.stringify(entries)) } catch { /* ignore */ }
}

export function useWorkspace(toolId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null))
  }, [])

  const refresh = useCallback(async () => {
    if (!toolId) return
    setLoading(true)
    try {
      if (userId) {
        const { data, error } = await supabase
          .from('ai_jobs')
          .select('*')
          .eq('tool', toolId)
          .eq('job_type', 'workspace')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
        if (!error && data) {
          const valid = data.filter(e => !isExpired(e.payload))
          setEntries(valid)
          return
        }
      }
      setEntries(lsLoad(toolId))
    } finally { setLoading(false) }
  }, [toolId, userId])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (content, title, ttlDays = DEFAULT_TTL) => {
    if (!content) return
    const expires_at = makeExpiry(ttlDays)
    const entry = {
      tool: toolId,
      job_type: 'workspace',
      payload: { content, title: title || toolId, expires_at, ttl_days: ttlDays },
      created_at: new Date().toISOString(),
    }
    if (userId) {
      await supabase.from('ai_jobs').insert({ ...entry, user_id: userId })
    } else {
      const list = lsLoad(toolId)
      list.unshift({ id: Date.now().toString(), ...entry, payload: { ...entry.payload } })
      lsSave(toolId, list.slice(0, 20))
    }
    await refresh()
  }, [toolId, userId, refresh])

  const remove = useCallback(async (id) => {
    if (userId) {
      await supabase.from('ai_jobs').delete().eq('id', id)
    } else {
      const list = lsLoad(toolId).filter(e => e.id !== id)
      lsSave(toolId, list)
    }
    await refresh()
  }, [toolId, userId, refresh])

  const clearAll = useCallback(async () => {
    if (userId) {
      await supabase.from('ai_jobs').delete().eq('tool', toolId).eq('job_type', 'workspace').eq('user_id', userId)
    } else {
      lsSave(toolId, [])
    }
    setEntries([])
  }, [toolId, userId])

  return { entries, loading, save, remove, clearAll, refresh }
}
