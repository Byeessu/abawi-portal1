import { supabase } from './supabase'

const BUCKET_CONFIG = {
  guides: { maxMB: 50, contentTypes: ['application/pdf'] },
  podcasts: { maxMB: 200, contentTypes: ['audio/'] },
  covers: { maxMB: 10, contentTypes: ['image/'] },
  'audio-summaries': { maxMB: 50, contentTypes: ['audio/'] },
  images: { maxMB: 10, contentTypes: ['image/'] },
  'store-images': { maxMB: 10, contentTypes: ['image/'] },
}

function cleanFilename(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    .substring(0, 100)
}

async function withRetry(fn, attempts = 3, delayMs = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      if (i === attempts - 1) throw e
      await new Promise(r => setTimeout(r, delayMs * (i + 1)))
    }
  }
}

/**
 * Upload a file to a Supabase Storage bucket.
 * @param {File} file
 * @param {string} bucket
 * @param {string} [folder]
 * @returns {Promise<string>} public URL
 */
export async function uploadFile(file, bucket, folder = '') {
  if (!BUCKET_CONFIG[bucket]) throw new Error(`Bucket inconnu: ${bucket}`)

  const ext = file.name.split('.').pop()
  const base = cleanFilename(file.name.replace(`.${ext}`, ''))
  const name = `${Date.now()}_${base}.${ext}`
  const path = folder ? `${folder}/${name}` : name

  return withRetry(async () => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })
    if (error) {
      if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        throw new Error(`Bucket "${bucket}" introuvable dans Supabase Storage`)
      }
      throw new Error(`Upload échoué (${bucket}/${path}) : ${error.message}`)
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  })
}

/**
 * Upload an audio summary blob to the 'audio-summaries' bucket.
 * @param {string} titre - Product title (used to build filename)
 * @param {Blob} audioBlob - MP3 blob
 * @returns {Promise<string>} public URL
 */
export async function testUpload() {
  console.log('[Upload Test] Démarrage...')
  const testBlob = new Blob(['test content ABAWI'], { type: 'text/plain' })
  const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    if (bucketError) {
      console.error('[Upload Test] Erreur listage buckets:', bucketError.message)
      return { ok: false, error: 'Buckets inaccessibles: ' + bucketError.message }
    }
    console.log('[Upload Test] Buckets disponibles:', buckets.map(b => b.name))
    const coverBucket = buckets.find(b => b.name === 'covers')
    if (!coverBucket) {
      console.error('[Upload Test] Bucket "covers" introuvable !')
      return { ok: false, error: 'Bucket "covers" non créé dans Supabase — exécutez le SQL' }
    }
    const { data, error } = await supabase.storage
      .from('covers')
      .upload('test-' + Date.now() + '.txt', testFile, { upsert: true })
    if (error) {
      console.error('[Upload Test] Upload échoué:', error.message)
      return { ok: false, error: error.message }
    }
    console.log('[Upload Test] ✅ Upload réussi:', data)
    await supabase.storage.from('covers').remove([data.path])
    return { ok: true, buckets: buckets.map(b => b.name) }
  } catch(e) {
    console.error('[Upload Test] Exception:', e.message)
    return { ok: false, error: e.message }
  }
}

export async function uploadAudioSummary(titre, audioBlob) {
  const slug = titre
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    .substring(0, 60)

  const path = `${slug}_${Date.now()}.mp3`

  return withRetry(async () => {
    const { error } = await supabase.storage.from('audio-summaries').upload(path, audioBlob, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'audio/mpeg',
    })
    if (error) {
      if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        throw new Error('Bucket "audio-summaries" introuvable dans Supabase Storage')
      }
      throw new Error(`Upload audio échoué : ${error.message}`)
    }
    const { data } = supabase.storage.from('audio-summaries').getPublicUrl(path)
    return data.publicUrl
  })
}
