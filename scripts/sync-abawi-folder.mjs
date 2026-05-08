import fs from 'fs'
import path from 'path'

// Dossier source — "ABAWI DIGITAL" à la racine du projet
const SOURCE = 'ABAWI DIGITAL'

const DEST_MAP = {
  '.pdf': (filename, subdir) => {
    const s = subdir.toLowerCase()
    if (s.includes('academy') || s.includes('fascicule') || s.includes('bac')) {
      return `public/files/fascicules/${filename}`
    }
    return `public/files/guides/${filename}`
  },
  '.mp3': (filename, subdir) => {
    const s = subdir.toLowerCase()
    if (s.includes('summary') || s.includes('resume') || s.includes('résumé')) return `public/files/summaries/${filename}`
    if (s.includes('fascicule-audio') || s.includes('fascicules-audio')) return `public/files/fascicules-audio/${filename}`
    return `public/files/podcasts/${filename}`
  },
  '.m4a': (filename, subdir) => `public/files/podcasts/${filename.replace('.m4a', '.m4a')}`,
  '.jpg': (filename) => `public/images/${filename}`,
  '.jpeg': (filename) => `public/images/${filename}`,
  '.png': (filename) => `public/images/${filename}`,
  '.webp': (filename) => `public/images/${filename}`,
}

function getAllFiles(dir, baseDir = dir) {
  const results = []
  if (!fs.existsSync(dir)) return results
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      results.push(...getAllFiles(fullPath, baseDir))
    } else {
      const ext = path.extname(item.name).toLowerCase()
      results.push({
        fullPath,
        filename: item.name,
        subdir: path.relative(baseDir, dir).toLowerCase(),
        ext,
        size: fs.statSync(fullPath).size,
      })
    }
  }
  return results
}

async function main() {
  console.log('\n🔄 SYNCHRONISATION ABAWI DIGITAL → PUBLIC\n')

  if (!fs.existsSync(SOURCE)) {
    console.error(`❌ Dossier source introuvable: ${SOURCE}`)
    console.log(`   Attendu à : ${path.resolve(SOURCE)}`)
    return
  }

  const DEST_DIRS = [
    'public/files/guides',
    'public/files/fascicules',
    'public/files/fascicules/l1',
    'public/files/fascicules/l2',
    'public/files/podcasts',
    'public/files/summaries',
    'public/files/fascicules-audio',
    'public/images',
  ]
  DEST_DIRS.forEach((d) => fs.mkdirSync(d, { recursive: true }))

  const sourceFiles = getAllFiles(SOURCE)
  const supported = sourceFiles.filter((f) => DEST_MAP[f.ext])
  const ignored = sourceFiles.filter((f) => !DEST_MAP[f.ext])

  console.log(`📂 ${sourceFiles.length} fichiers trouvés dans "${SOURCE}/"`)
  console.log(`   ✔ ${supported.length} supportés  ·  ⏭  ${ignored.length} ignorés (xlsx, docx, avif…)\n`)

  let copied = 0, skipped = 0, updated = 0, errors = 0

  for (const file of supported) {
    const destFn = DEST_MAP[file.ext]
    const destPath = destFn(file.filename, file.subdir)
    const destDir = path.dirname(destPath)
    fs.mkdirSync(destDir, { recursive: true })

    try {
      if (fs.existsSync(destPath)) {
        const destSize = fs.statSync(destPath).size
        if (file.size > destSize + 1024) {
          fs.copyFileSync(file.fullPath, destPath)
          console.log(`🔄 Mis à jour  ${path.basename(destPath)} (${(file.size / 1024).toFixed(0)}Ko)`)
          updated++
        } else {
          skipped++
        }
      } else {
        fs.copyFileSync(file.fullPath, destPath)
        console.log(`✅ Copié  ${file.filename} → ${destPath}`)
        copied++
      }
    } catch (e) {
      console.error(`❌ Erreur: ${file.filename} — ${e.message}`)
      errors++
    }
  }

  // Résumé par type
  const guides = fs.existsSync('public/files/guides') ? fs.readdirSync('public/files/guides').filter((f) => f.endsWith('.pdf')).length : 0
  const fascicules = fs.existsSync('public/files/fascicules') ? getAllFiles('public/files/fascicules').filter((f) => f.ext === '.pdf').length : 0
  const podcasts = fs.existsSync('public/files/podcasts') ? fs.readdirSync('public/files/podcasts').filter((f) => f.endsWith('.mp3') || f.endsWith('.m4a')).length : 0

  console.log('\n═══════════════════════════════════════')
  console.log(`✅ ${copied} copiés | 🔄 ${updated} mis à jour | ⏭  ${skipped} déjà présents | ❌ ${errors} erreurs`)
  console.log(`\n📊 Contenu public/ :`)
  console.log(`   Guides PDF    : ${guides}`)
  console.log(`   Fascicules PDF: ${fascicules}`)
  console.log(`   Podcasts audio: ${podcasts}`)
  console.log('═══════════════════════════════════════\n')

  // Vérification audios manquants
  console.log('🎙️  Vérification audios manquants...')
  await checkMissingAudios()
}

async function checkMissingAudios() {
  const { guides, allFascicules } = await import('../src/data/products.js')

  function slugify(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  const missingGuides = guides.filter((g) => {
    const fp = `public/files/summaries/${slugify(g.titre)}.mp3`
    return !fs.existsSync(fp) || fs.statSync(fp).size < 1000
  })

  const missingFasc = allFascicules.filter((f) => {
    const fp = `public/files/fascicules-audio/${slugify(f.titre)}.mp3`
    return !fs.existsSync(fp) || fs.statSync(fp).size < 1000
  })

  if (missingGuides.length > 0 || missingFasc.length > 0) {
    console.log(`\n⚠️  Audios manquants : ${missingGuides.length} guides, ${missingFasc.length} fascicules`)
    console.log('   Exécuter : node scripts/regenerate-all-audio.mjs\n')
  } else {
    console.log('✅ Tous les audios sont présents.\n')
  }
}

main().catch(console.error)
