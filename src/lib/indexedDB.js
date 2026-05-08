/**
 * IndexedDB Wrapper - Persistance locale avancée
 * Pour données offline et cache persistant
 */

const DB_NAME = 'abawi-portal-db'
const DB_VERSION = 1
const STORES = {
  ARTICLES: 'articles',
  PRODUCTS: 'products',
  USER_DATA: 'userData',
  DRAFTS: 'drafts',
  CACHE: 'cache',
  SYNC_QUEUE: 'syncQueue',
}

class IndexedDBManager {
  constructor() {
    this.db = null
    this.initPromise = null
  }

  // Initialisation de la base de données
  async init() {
    if (this.db) return this.db
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Store pour les articles
        if (!db.objectStoreNames.contains(STORES.ARTICLES)) {
          const articleStore = db.createObjectStore(STORES.ARTICLES, { keyPath: 'id' })
          articleStore.createIndex('by-date', 'created_at', { unique: false })
          articleStore.createIndex('by-category', 'category', { unique: false })
        }

        // Store pour les produits
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' })
          productStore.createIndex('by-category', 'category', { unique: false })
          productStore.createIndex('by-price', 'price', { unique: false })
        }

        // Store pour les données utilisateur
        if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
          db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' })
        }

        // Store pour les brouillons
        if (!db.objectStoreNames.contains(STORES.DRAFTS)) {
          const draftStore = db.createObjectStore(STORES.DRAFTS, { keyPath: 'id', autoIncrement: true })
          draftStore.createIndex('by-type', 'type', { unique: false })
          draftStore.createIndex('by-date', 'updatedAt', { unique: false })
        }

        // Store pour le cache générique
        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' })
          cacheStore.createIndex('by-expiry', 'expiry', { unique: false })
        }

        // Store pour la file de sync
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true })
          syncStore.createIndex('by-status', 'status', { unique: false })
          syncStore.createIndex('by-date', 'createdAt', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  // Opérations CRUD génériques
  async set(storeName, data) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async get(storeName, key) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAll(storeName, indexName = null, query = null) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const target = indexName ? store.index(indexName) : store
      const request = query ? target.getAll(query) : target.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName, key) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Méthodes spécifiques pour le cache
  async setCache(key, data, ttlMinutes = 60) {
    const expiry = Date.now() + ttlMinutes * 60 * 1000
    await this.set(STORES.CACHE, { key, data, expiry, createdAt: Date.now() })
  }

  async getCache(key) {
    const cached = await this.get(STORES.CACHE, key)
    if (!cached) return null

    // Vérifier expiration
    if (cached.expiry < Date.now()) {
      await this.delete(STORES.CACHE, key)
      return null
    }

    return cached.data
  }

  async clearExpiredCache() {
    const db = await this.init()
    const now = Date.now()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE], 'readwrite')
      const store = transaction.objectStore(STORES.CACHE)
      const index = store.index('by-expiry')
      const range = IDBKeyRange.upperBound(now)
      const request = index.openCursor(range)

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // File de synchronisation pour offline
  async addToSyncQueue(action, data) {
    await this.set(STORES.SYNC_QUEUE, {
      action,
      data,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
    })
  }

  async getPendingSync() {
    return this.getAll(STORES.SYNC_QUEUE, 'by-status', 'pending')
  }

  async markSyncComplete(id) {
    await this.delete(STORES.SYNC_QUEUE, id)
  }

  async markSyncFailed(id, error) {
    const item = await this.get(STORES.SYNC_QUEUE, id)
    if (item) {
      item.retryCount++
      item.lastError = error
      item.status = item.retryCount >= 3 ? 'failed' : 'pending'
      item.lastAttempt = Date.now()
      await this.set(STORES.SYNC_QUEUE, item)
    }
  }

  // Brouillons auto-save
  async saveDraft(type, data) {
    const existing = await this.getAll(STORES.DRAFTS, 'by-type', type)
    // Garder seulement les 5 derniers brouillons par type
    if (existing.length >= 5) {
      const oldest = existing.sort((a, b) => a.updatedAt - b.updatedAt)[0]
      await this.delete(STORES.DRAFTS, oldest.id)
    }

    await this.set(STORES.DRAFTS, {
      type,
      data,
      updatedAt: Date.now(),
    })
  }

  async getLatestDraft(type) {
    const drafts = await this.getAll(STORES.DRAFTS, 'by-type', type)
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt)[0] || null
  }

  // Stats
  async getStorageStats() {
    const stats = {}
    for (const store of Object.values(STORES)) {
      const data = await this.getAll(store)
      stats[store] = {
        count: data.length,
        size: JSON.stringify(data).length,
      }
    }
    return stats
  }
}

// Instance singleton
export const idb = new IndexedDBManager()
export { STORES }

// Helper pour usage avec React Query
export async function getCachedOrFetch(key, fetchFn, ttlMinutes = 60) {
  // Essayer cache d'abord
  const cached = await idb.getCache(key)
  if (cached) return cached

  // Fetch et mettre en cache
  const data = await fetchFn()
  await idb.setCache(key, data, ttlMinutes)
  return data
}

export async function clearAllData() {
  for (const store of Object.values(STORES)) {
    await idb.clear(store)
  }
}
