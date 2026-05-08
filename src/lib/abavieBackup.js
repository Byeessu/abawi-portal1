/* ================================================================
   ABAVIE — Backup / Restore
   Export and import conversations as JSON files
   ================================================================ */

import { supabase } from './supabase'
import {
  cacheMessages,
  cacheConversation,
  cacheProfile,
  getCachedMessages,
  getCachedConversations,
} from './abavieIndexedDB'

const BACKUP_VERSION = 1

/**
 * Export all user conversations + messages from Supabase to a JSON file.
 * Falls back to IndexedDB cache if offline.
 */
export async function exportAllConversations(membreId) {
  if (!membreId) throw new Error('Membre ID requis')

  let conversations = []
  let messagesByConv = {}
  let profiles = {}

  // Try Supabase first
  try {
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${membreId},participant_2.eq.${membreId}`)
      .order('updated_at', { ascending: false })

    conversations = convs || []

    for (const c of conversations) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: true })
      messagesByConv[c.id] = msgs || []

      // Profiles for both participants
      for (const pid of [c.participant_1, c.participant_2].filter(Boolean)) {
        if (!profiles[pid]) {
          const { data: p } = await supabase
            .from('membres')
            .select('id, nom, prenom, avatar_url, email')
            .eq('id', pid)
            .single()
          if (p) profiles[pid] = p
        }
      }
    }
  } catch (e) {
    // Fallback to IndexedDB cache
    conversations = await getCachedConversations()
    for (const c of conversations) {
      messagesByConv[c.id] = await getCachedMessages(c.id)
    }
  }

  const payload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    membreId,
    conversations,
    messagesByConv,
    profiles,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = new Date().toISOString().split('T')[0]
  a.download = `abavie-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return {
    conversationsCount: conversations.length,
    messagesCount: Object.values(messagesByConv).reduce((s, m) => s + m.length, 0),
  }
}

/**
 * Import a JSON backup. Restores into IndexedDB only by default
 * (does NOT push back to Supabase — would require permissions checks).
 */
export async function importBackup(file, { restoreToCloud = false, membreId } = {}) {
  if (!file) throw new Error('Aucun fichier fourni')

  const text = await file.text()
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('Fichier JSON invalide')
  }

  if (!payload.version) throw new Error('Format de sauvegarde inconnu')
  if (payload.version > BACKUP_VERSION) {
    throw new Error(`Version trop récente (${payload.version}). Mets à jour Abavie.`)
  }

  const conversations = payload.conversations || []
  const messagesByConv = payload.messagesByConv || {}
  const profiles = payload.profiles || {}

  let convCount = 0
  let msgCount = 0
  let profileCount = 0

  // Always restore to local cache
  for (const c of conversations) {
    await cacheConversation(c)
    convCount++
  }
  for (const convId of Object.keys(messagesByConv)) {
    const msgs = messagesByConv[convId]
    if (Array.isArray(msgs) && msgs.length) {
      await cacheMessages(msgs)
      msgCount += msgs.length
    }
  }
  for (const pid of Object.keys(profiles)) {
    await cacheProfile(profiles[pid])
    profileCount++
  }

  // Optional: push back to Supabase (only own messages)
  if (restoreToCloud && membreId) {
    for (const convId of Object.keys(messagesByConv)) {
      const msgs = messagesByConv[convId].filter(m => m.sender_id === membreId)
      if (msgs.length === 0) continue
      // Use upsert to avoid duplicates
      const sanitized = msgs.map(m => {
        const { _membreId, ...rest } = m
        return rest
      })
      await supabase.from('messages').upsert(sanitized, { onConflict: 'id' })
    }
  }

  return {
    conversationsCount: convCount,
    messagesCount: msgCount,
    profilesCount: profileCount,
    exportedAt: payload.exportedAt,
  }
}
