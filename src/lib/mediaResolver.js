export async function probeUrl(url) {
  if (!url) return false
  try {
    const head = await fetch(url, { method: 'HEAD' })
    if (head.ok) return true
  // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
  } catch { /* ignore */ }
  try {
    const get = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } })
    return get.ok
  } catch {
    return false
  }
}

export async function resolveFirstPlayable(candidates = []) {
  const unique = [...new Set(candidates.filter(Boolean).map((u) => encodeURI(u)))]
  for (const url of unique) {
    if (await probeUrl(url)) return url
  }
  return ''
}
