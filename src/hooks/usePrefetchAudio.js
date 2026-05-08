import { useEffect, useState } from 'react'
import { probeUrl } from '../lib/mediaResolver'

/**
 * Check if a static MP3 exists.
 * @param {string} slug — URL slug (e.g. "mindset-entrepreneur")
 * @param {'guide'|'fascicule'} type
 * @returns {boolean|null} null while loading, true if available, false if not
 */
export function usePrefetchAudio(slug, type = 'guide') {
  const [available, setAvailable] = useState(null)

  useEffect(() => {
    if (!slug) return
    const candidates = type === 'fascicule'
      ? [
          `/files/fascicules-audio/${slug}.mp3`,
          `/files/fascicules-audio/${slugifyLegacy(slug)}.mp3`,
        ]
      : [
          `/files/summaries/${slug}.mp3`,
          `/files/guides-audio/${slug}.mp3`,
          `/files/resumes/${slug}.mp3`,
        ]

    let cancelled = false
    Promise.any(candidates.map((u) => probeUrl(u).then((ok) => (ok ? true : Promise.reject(new Error('missing'))))))
      .then(() => { if (!cancelled) setAvailable(true) })
      .catch(() => { if (!cancelled) setAvailable(false) })

    return () => { cancelled = true }
  }, [slug, type])

  return available
}

function slugifyLegacy(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}
