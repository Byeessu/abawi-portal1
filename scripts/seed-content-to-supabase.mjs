#!/usr/bin/env node
/**
 * seed-content-to-supabase.mjs
 * Importe toutes les données statiques (guides, fascicules, podcasts)
 * dans les tables Supabase. À exécuter une seule fois.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes: VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Charger products.js sans l'importer directement (c'est du JS modules)
// On va parser le fichier products.js pour extraire les tableaux
// Alternative : utiliser l'API de Supabase directement avec les données connues
// Comme products.js est complexe, on va utiliser une approche plus simple :
// lire les données du fichier products.js en exécutant du JS

const productsPath = new URL('../src/data/products.js', import.meta.url)
const productsCode = fs.readFileSync(productsPath, 'utf-8')

// Évaluer le fichier pour obtenir les exports
const moduleCode = productsCode + '\nexport { guides, fascicules, allFascicules, podcasts, videos, summaries, fasciculeAudios, digitalPacks, academyPacks }'
const dataModule = await import('data:text/javascript,' + encodeURIComponent(moduleCode))

const guides = dataModule.guides || []
const fascicules = dataModule.allFascicules || []
const podcasts = dataModule.podcasts || []
const videos = dataModule.videos || []
const summaries = dataModule.summaries || []
const fasciculeAudios = dataModule.fasciculeAudios || []

console.log(`📊 Données trouvées : ${guides.length} guides, ${fascicules.length} fascicules, ${podcasts.length} podcasts`)

async function seedGuides() {
  const rows = guides.map(g => ({
    slug: slugify(g.titre),
    titre: g.titre,
    categorie: g.categorie || 'Autre',
    prix: g.prix || 1490,
    prix_barre: g.prix_barre || null,
    file_url: g.file_url || null,
    drive_url: g.drive_url || null,
    brand: g.brand || 'digital',
    gratuit: g.gratuit || false,
    premium: g.premium !== false,
    active: true,
  }))

  const { error } = await supabase.from('guides').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
  if (error) console.error('❌ Guides:', error.message)
  else console.log(`✅ Guides : ${rows.length} insérés/mis à jour`)
}

async function seedFascicules() {
  const rows = fascicules.map(f => ({
    slug: slugify(f.titre),
    titre: f.titre,
    matiere: f.matiere || 'Autre',
    serie: f.serie || 'Autre',
    chapitre: f.chapitre || null,
    prix: f.prix || 990,
    prix_barre: f.prix_barre || null,
    file_url: f.file_url || null,
    drive_url: f.drive_url || null,
    brand: f.brand || 'academy',
    gratuit: f.gratuit || false,
    premium: f.premium !== false,
    active: true,
  }))

  const { error } = await supabase.from('fascicules').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
  if (error) console.error('❌ Fascicules:', error.message)
  else console.log(`✅ Fascicules : ${rows.length} insérés/mis à jour`)
}

async function seedPodcasts() {
  const rows = podcasts.map(p => ({
    slug: slugify(p.titre),
    titre: p.titre,
    serie: p.serie || 'Business & Digital',
    prix: p.prix || 1900,
    audio_url: p.audio_url || null,
    premium: p.premium !== false,
    gratuit: p.gratuit || false,
    featured: p.featured || false,
    lyrics: p.lyrics || null,
    active: true,
  }))

  const { error } = await supabase.from('podcasts').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
  if (error) console.error('❌ Podcasts:', error.message)
  else console.log(`✅ Podcasts : ${rows.length} insérés/mis à jour`)
}

async function seedVideosFromFiles() {
  // Vidéos trouvées dans public/files/videos
  const videoDir = new URL('../public/files/videos', import.meta.url)
  const videos = []
  if (fs.existsSync(videoDir)) {
    for (const f of fs.readdirSync(videoDir)) {
      if (f.endsWith('.mp4')) {
        const name = f.replace('.mp4', '').replace(/_/g, ' ')
        videos.push({
          slug: slugify(name),
          titre: name,
          categorie: 'Business & Digital',
          video_url: `/files/videos/${f}`,
          active: true,
        })
      }
    }
  }

  if (videos.length === 0) {
    console.log('ℹ️ Aucune vidéo trouvée dans public/files/videos')
    return
  }

  const { error } = await supabase.from('videos').upsert(videos, { onConflict: 'slug', ignoreDuplicates: true })
  if (error) console.error('❌ Vidéos:', error.message)
  else console.log(`✅ Vidéos : ${videos.length} insérées/mises à jour`)
}

async function seedPacks() {
  const packs = [
    ...dataModule.digitalPacks.map(p => ({ ...p, type: 'digital' })),
    ...dataModule.academyPacks.map(p => ({ ...p, type: 'academy' })),
  ].map(p => ({
    slug: slugify(p.nom),
    nom: p.nom,
    emoji: p.emoji || '',
    description: p.description || '',
    prix: p.prix,
    prix_barre: p.prix_barre || null,
    type: p.type,
    badge: p.badge || null,
    highlight: p.highlight || false,
    contenu: p.contenu || [],
    active: true,
  }))

  const { error } = await supabase.from('content_packs').upsert(packs, { onConflict: 'slug', ignoreDuplicates: true })
  if (error) console.error('❌ Packs:', error.message)
  else console.log(`✅ Packs : ${packs.length} insérés/mis à jour`)
}

async function seedVideos() {
  const rows = videos.map(v => ({
    slug: slugify(v.titre),
    titre: v.titre,
    categorie: v.categorie || 'Business & Digital',
    prix: v.prix || 1900,
    video_url: v.video_url || null,
    cover_url: v.cover_url || null,
    premium: v.premium !== false,
    gratuit: v.gratuit || false,
    active: true,
  }))
  if (rows.length === 0) { console.log('ℹ️ Aucune vidéo'); return }
  const { error } = await supabase.from('videos').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
  if (error) console.error('❌ Vidéos:', error.message)
  else console.log(`✅ Vidéos : ${rows.length} insérées/mises à jour`)
}

async function seedSummaries() {
  const rows = summaries.map(s => ({
    slug: slugify(s.titre),
    titre: s.titre,
    categorie: s.categorie || 'Résumé Audio',
    audio_url: s.audio_url || null,
    cover_url: s.cover_url || null,
    premium: s.premium !== false,
    gratuit: s.gratuit !== false,
    active: true,
  }))
  if (rows.length === 0) { console.log('ℹ️ Aucun résumé'); return }
  const { error } = await supabase.from('summaries').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
  if (error) console.error('❌ Résumés:', error.message)
  else console.log(`✅ Résumés : ${rows.length} insérés/mis à jour`)
}

async function seedFasciculeAudios() {
  const rows = fasciculeAudios.map(fa => ({
    slug: slugify(fa.titre),
    titre: fa.titre,
    serie: fa.serie || 'Autre',
    matiere: fa.matiere || 'Autre',
    chapitre: fa.chapitre || null,
    audio_url: fa.audio_url || null,
    cover_url: fa.cover_url || null,
    premium: fa.premium !== false,
    gratuit: fa.gratuit !== false,
    active: true,
  }))
  if (rows.length === 0) { console.log('ℹ️ Aucun audio fascicule'); return }
  const { error } = await supabase.from('fascicule_audios').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
  if (error) console.error('❌ Fascicule audios:', error.message)
  else console.log(`✅ Fascicule audios : ${rows.length} insérés/mis à jour`)
}

await seedGuides()
await seedFascicules()
await seedPodcasts()
await seedVideos()
await seedSummaries()
await seedFasciculeAudios()
await seedPacks()

console.log('\n🎉 Seeding terminé !')
