/* ================================================================
   ABTALK — Settings / Paramètres
   Persisted in localStorage with migration from legacy clair key
   ================================================================ */

const SETTINGS_KEY = 'abtalk_settings_v1'
const LEGACY_KEY   = 'clair_settings_v1'

const DEFAULTS = {
  notifications_sound: true,
  notifications_preview: true,
  notifications_group: true,
  notifications_calls: true,
  notifications_mute_until: null,
  do_not_disturb: false,

  last_seen_visibility: 'all',
  profile_photo_visibility: 'all',
  read_receipts: true,
  typing_indicators: true,
  blocked_users: [],

  auto_download_images: true,
  auto_download_videos: false,
  auto_download_audio: true,
  keep_media: true,
  clear_cache_days: 30,

  theme: 'system',
  font_size: 'medium',
  theme_color: 'sky',
  chat_wallpaper: null,
  reduce_motion: false,

  max_file_size_mb: 5120,
  max_group_members: 5000,

  phone_number: null,
  username: null,
  about: '',
  language: 'fr',
}

function loadSettings() {
  try {
    // Migration unique depuis l'ancienne clé abavie
    if (!localStorage.getItem(SETTINGS_KEY)) {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        localStorage.setItem(SETTINGS_KEY, legacy)
        localStorage.removeItem(LEGACY_KEY)
      }
    }
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export const abTalkSettings = {
  get(key) {
    const s = loadSettings()
    return key ? s[key] : s
  },

  set(key, value) {
    const s = loadSettings()
    s[key] = value
    saveSettings(s)
    window.dispatchEvent(new CustomEvent('abtalk-settings-change', { detail: { key, value } }))
    return s
  },

  toggle(key) {
    const s = loadSettings()
    s[key] = !s[key]
    saveSettings(s)
    window.dispatchEvent(new CustomEvent('abtalk-settings-change', { detail: { key, value: s[key] } }))
    return s[key]
  },

  reset() {
    saveSettings({ ...DEFAULTS })
    window.dispatchEvent(new CustomEvent('abtalk-settings-change', { detail: { reset: true } }))
    return { ...DEFAULTS }
  },

  export() {
    return JSON.stringify(loadSettings(), null, 2)
  },

  import(json) {
    try {
      const merged = { ...DEFAULTS, ...JSON.parse(json) }
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

// Compat — certains composants importent encore abavieSettings
export { abTalkSettings as abavieSettings }
