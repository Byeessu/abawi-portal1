/* ================================================================
   ABAVIE — Settings / Paramètres avancés
   Persisted in localStorage with versioning
   ================================================================ */

const SETTINGS_KEY = 'abavie_settings_v1'

const DEFAULTS = {
  // Notifications
  notifications_sound: true,
  notifications_preview: true,
  notifications_group: true,
  notifications_calls: true,
  notifications_mute_until: null,
  do_not_disturb: false,

  // Privacy
  last_seen_visibility: 'all', // 'all' | 'contacts' | 'nobody'
  profile_photo_visibility: 'all',
  read_receipts: true,
  typing_indicators: true,
  blocked_users: [],

  // Data & Storage
  auto_download_images: true,
  auto_download_videos: false,
  auto_download_audio: true,
  keep_media: true,
  clear_cache_days: 30,

  // Appearance
  theme: 'system', // 'light' | 'dark' | 'system'
  font_size: 'medium', // 'small' | 'medium' | 'large'
  theme_color: 'green', // 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'teal' | 'gold'
  chat_wallpaper: null, // 'none' | 'gradient-1' | 'gradient-2' | 'gradient-3' | 'dots' | 'lines' | 'mesh' | 'abstract-1' | 'abstract-2' | 'abstract-3'
  reduce_motion: false,

  // Abavie features (all unlocked)
  max_file_size_mb: 5120,
  max_group_members: 5000,

  // Account
  phone_number: null,
  username: null,
  about: '',
  language: 'fr',
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw)
    // Merge with defaults for new keys
    return { ...DEFAULTS, ...parsed }
  } catch {
    return { ...DEFAULTS }
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// ── Public API ───────────────────────────────────────────────────

export const abavieSettings = {
  get(key) {
    const s = loadSettings()
    return key ? s[key] : s
  },

  set(key, value) {
    const s = loadSettings()
    s[key] = value
    saveSettings(s)
    window.dispatchEvent(new CustomEvent('abavie-settings-change', { detail: { key, value } }))
    return s
  },

  toggle(key) {
    const s = loadSettings()
    s[key] = !s[key]
    saveSettings(s)
    window.dispatchEvent(new CustomEvent('abavie-settings-change', { detail: { key, value: s[key] } }))
    return s[key]
  },

  reset() {
    saveSettings({ ...DEFAULTS })
    window.dispatchEvent(new CustomEvent('abavie-settings-change', { detail: { reset: true } }))
    return { ...DEFAULTS }
  },

  export() {
    return JSON.stringify(loadSettings(), null, 2)
  },

  import(json) {
    try {
      const data = JSON.parse(json)
      const merged = { ...DEFAULTS, ...data }
      saveSettings(merged)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },


  addBlock(userId) {
    const s = loadSettings()
    if (!s.blocked_users.includes(userId)) {
      s.blocked_users.push(userId)
      saveSettings(s)
    }
    return s.blocked_users
  },

  removeBlock(userId) {
    const s = loadSettings()
    s.blocked_users = s.blocked_users.filter(id => id !== userId)
    saveSettings(s)
    return s.blocked_users
  },

  isBlocked(userId) {
    return loadSettings().blocked_users.includes(userId)
  },
}
