/* ================================================================
   ABAVIE — IndexedDB Offline Sync
   Multi-device message persistence + offline queue
   ================================================================ */

const DB_NAME = 'abavie_db'
const DB_VERSION = 2

const STORES = {
  messages: 'messages',
  conversations: 'conversations',
  profiles: 'profiles',
  pending: 'pending_messages',
  settings: 'settings',
  keys: 'e2e_keys',
  media_cache: 'media_cache',
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORES.messages)) {
        const ms = db.createObjectStore(STORES.messages, { keyPath: 'id' })
        ms.createIndex('conversation_id', 'conversation_id', { unique: false })
        ms.createIndex('created_at', 'created_at', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORES.conversations)) {
        db.createObjectStore(STORES.conversations, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.profiles)) {
        db.createObjectStore(STORES.profiles, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.pending)) {
        db.createObjectStore(STORES.pending, { keyPath: 'localId', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(STORES.keys)) {
        db.createObjectStore(STORES.keys, { keyPath: 'userId' })
      }
      if (!db.objectStoreNames.contains(STORES.media_cache)) {
        const mc = db.createObjectStore(STORES.media_cache, { keyPath: 'url' })
        mc.createIndex('last_accessed', 'lastAccessed', { unique: false })
        mc.createIndex('message_id', 'messageId', { unique: false })
        mc.createIndex('conversation_id', 'conversationId', { unique: false })
      }
    }
  })
}

// Generic CRUD
async function put(store, data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).put(data)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function get(store, key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getAll(store) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getAllByIndex(store, indexName, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const idx = tx.objectStore(store).index(indexName)
    const req = idx.getAll(value)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function remove(store, key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function clearStore(store) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// Messages
export async function cacheMessages(messages) {
  for (const m of messages) await put(STORES.messages, m)
}

export async function getCachedMessages(conversationId) {
  return getAllByIndex(STORES.messages, 'conversation_id', conversationId)
}

export async function cacheConversation(conv) {
  await put(STORES.conversations, conv)
}

export async function getCachedConversations() {
  return getAll(STORES.conversations)
}

export async function cacheProfile(profile) {
  await put(STORES.profiles, profile)
}

export async function getCachedProfile(userId) {
  return get(STORES.profiles, userId)
}

// Pending messages (offline queue)
export async function queuePendingMessage(msg) {
  const pending = { ...msg, queuedAt: Date.now(), status: 'pending' }
  const id = await put(STORES.pending, pending)
  return id
}

export async function getPendingMessages() {
  const all = await getAll(STORES.pending)
  return all.filter(m => m.status === 'pending').sort((a, b) => a.queuedAt - b.queuedAt)
}

export async function removePendingMessage(localId) {
  await remove(STORES.pending, localId)
}

export async function updatePendingStatus(localId, status) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.pending, 'readwrite')
    const store = tx.objectStore(STORES.pending)
    const req = store.get(localId)
    req.onsuccess = () => {
      const data = req.result
      if (data) {
        data.status = status
        store.put(data)
      }
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

// Settings
export async function setSetting(key, value) {
  await put(STORES.settings, { key, value, updatedAt: Date.now() })
}

export async function getSetting(key) {
  const s = await get(STORES.settings, key)
  return s?.value
}

// E2E keys
export async function cacheE2EKey(userId, keyData) {
  await put(STORES.keys, { userId, ...keyData, cachedAt: Date.now() })
}

export async function getE2EKey(userId) {
  return get(STORES.keys, userId)
}

export async function removeAllData() {
  for (const s of Object.values(STORES)) await clearStore(s)
}

// Sync helper: flush pending when back online
export async function flushPending(sendFn) {
  const pending = await getPendingMessages()
  for (const msg of pending) {
    try {
      await sendFn(msg)
      await removePendingMessage(msg.localId)
    } catch (e) {
      console.error('Failed to flush pending message', msg.localId, e)
    }
  }
}

// Size info for stats
export async function getStorageStats() {
  const db = await openDB()
  const stats = {}
  for (const name of db.objectStoreNames) {
    const tx = db.transaction(name, 'readonly')
    const count = await new Promise((resolve, reject) => {
      const req = tx.objectStore(name).count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    stats[name] = count
  }
  return stats
}

// ── Media Cache — intelligent indexing ──────────────────────────

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function fetchMedia(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('fetch failed')
  return res.blob()
}

export async function cacheMedia({ url, messageId, conversationId, type }) {
  try {
    const blob = await fetchMedia(url)
    const data = await blobToBase64(blob)
    await put(STORES.media_cache, {
      url,
      data,
      type,
      messageId,
      conversationId,
      size: blob.size,
      lastAccessed: Date.now(),
      indexedAt: Date.now(),
    })
    return true
  } catch {
    return false
  }
}

export async function getCachedMedia(url) {
  const cached = await get(STORES.media_cache, url)
  if (!cached) return null
  // Update last accessed
  cached.lastAccessed = Date.now()
  await put(STORES.media_cache, cached)
  return cached.data
}

export async function unindexMedia({ messageId, url }) {
  if (url) {
    await remove(STORES.media_cache, url)
    return
  }
  if (messageId) {
    const all = await getAll(STORES.media_cache)
    const toRemove = all.filter(m => m.messageId === messageId)
    for (const m of toRemove) {
      await remove(STORES.media_cache, m.url)
    }
  }
}

export async function cleanupMediaCache({ maxAgeDays = 30, maxItems = 500, maxBytes = 512 * 1024 * 1024 } = {}) {
  const all = await getAll(STORES.media_cache)
  const now = Date.now()
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000

  let totalSize = 0
  for (const m of all) totalSize += m.size || 0

  // Sort by lastAccessed ascending (oldest first)
  const sorted = [...all].sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0))
  let removed = 0

  for (const m of sorted) {
    const tooOld = now - (m.lastAccessed || m.indexedAt || 0) > maxAgeMs
    const tooMany = all.length - removed > maxItems
    const tooBig = totalSize > maxBytes
    if (tooOld || tooMany || tooBig) {
      await remove(STORES.media_cache, m.url)
      totalSize -= m.size || 0
      removed++
    }
  }
  return { removed, remaining: all.length - removed }
}

export async function getMediaCacheSize() {
  const all = await getAll(STORES.media_cache)
  const bytes = all.reduce((sum, m) => sum + (m.size || 0), 0)
  return { count: all.length, bytes }
}
