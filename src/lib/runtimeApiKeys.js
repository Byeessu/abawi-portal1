const API_KEYS_STORAGE = 'abawi_api_keys_v2'

function readStoredApiKeys() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(API_KEYS_STORAGE) || '{}'
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function firstNonEmpty(values = []) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

export function getStoredProviderKeys(providerId) {
  const stored = readStoredApiKeys()
  const node = stored?.[providerId]
  if (!node || typeof node !== 'object') {
    return { key: '', alias: '' }
  }
  return {
    key: typeof node.key_value === 'string' ? node.key_value.trim() : '',
    alias: typeof node.key_alias_value === 'string' ? node.key_alias_value.trim() : '',
  }
}

export function resolveRuntimeApiKey({
  envKeys = [],
  providerId = '',
  includeAlias = true,
} = {}) {
  const provider = providerId ? getStoredProviderKeys(providerId) : { key: '', alias: '' }
  const storedValues = includeAlias ? [provider.key, provider.alias] : [provider.key]
  return firstNonEmpty([...envKeys, ...storedValues])
}
