import { supabase } from './supabase'

export async function loadPodcastOverrides() {
  try {
    const { data, error } = await supabase.from('podcasts_db').select('id,titre,serie,audio_url,lyrics,premium,gratuit,prix,actif')
    if (error || !Array.isArray(data)) return new Map()
    const map = new Map()
    for (const row of data) {
      if (!row?.id) continue
      map.set(row.id, row)
    }
    return map
  } catch {
    return new Map()
  }
}

export function mergePodcastWithOverride(basePodcast, override) {
  if (!override) return basePodcast
  return {
    ...basePodcast,
    titre: override.titre || basePodcast.titre,
    serie: override.serie || basePodcast.serie,
    audio_url: override.audio_url || basePodcast.audio_url,
    lyrics: override.lyrics || basePodcast.lyrics,
    premium: typeof override.premium === 'boolean' ? override.premium : basePodcast.premium,
    gratuit: typeof override.gratuit === 'boolean' ? override.gratuit : basePodcast.gratuit,
    prix: Number.isFinite(Number(override.prix)) ? Number(override.prix) : basePodcast.prix,
    actif: typeof override.actif === 'boolean' ? override.actif : true,
  }
}
