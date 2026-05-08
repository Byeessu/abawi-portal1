import fs from 'fs'
import path from 'path'

function slugify(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function findBestMatch(filename, list) {
  const fileSlug = slugify(filename.replace(/\.(mp3|wav|ogg|m4a)$/i, ''))
  let best = null, bestScore = 0
  for (const item of list) {
    const itemSlug = slugify(item.titre || '')
    const fw = fileSlug.split('-').filter(w => w.length > 2)
    const iw = itemSlug.split('-').filter(w => w.length > 2)
    const common = fw.filter(w => iw.includes(w)).length
    const score = common / Math.max(fw.length, iw.length, 1)
    if (score > bestScore && score > 0.25) { bestScore = score; best = item }
  }
  return best
}

async function main() {
  const SEARCH_DIRS = [
    'public/files/podcasts',
    'ABAWI DIGITAL',
    'ABAWI DIGITAL/AUDIO Pro',
    'ABAWI DIGITAL/Podcasts',
    'abawi',
    'abawi/podcasts',
  ]

  let found = []
  for (const dir of SEARCH_DIRS) {
    if (!fs.existsSync(dir)) continue
    const scan = (d) => {
      const entries = fs.readdirSync(d, { withFileTypes: true })
      for (const f of entries) {
        const fp = path.join(d, f.name)
        if (f.isFile() && /\.(mp3|wav|ogg|m4a)$/i.test(f.name)) {
          found.push({ name: f.name, path: fp })
        } else if (f.isDirectory()) {
          scan(fp)
        }
      }
    }
    scan(dir)
  }

  // Deduplicate by path
  const seen = new Set()
  found = found.filter(f => { if (seen.has(f.path)) return false; seen.add(f.path); return true })

  console.log(`\n🎵 ${found.length} fichiers audio trouvés\n`)

  fs.mkdirSync('public/files/podcasts', { recursive: true })

  const { podcasts } = await import('../src/data/products.js')
  const updates = []

  for (const file of found) {
    const srcSize = fs.statSync(file.path).size
    const match = findBestMatch(file.name, podcasts)

    if (match) {
      const destSlug = slugify(match.titre)
      const dest = `public/files/podcasts/${destSlug}.mp3`
      const destExists = fs.existsSync(dest)
      const destSize = destExists ? fs.statSync(dest).size : 0

      if (!destExists || srcSize > destSize) {
        fs.copyFileSync(file.path, dest)
        const action = destExists ? '🔄 Mis à jour' : '✅ Copié'
        console.log(`${action}: ${file.name} → ${dest} (${(srcSize/1024/1024).toFixed(2)} Mo)`)
        updates.push({ id: match.id, titre: match.titre, audio_url: `/files/podcasts/${destSlug}.mp3` })
      } else {
        console.log(`✓ Identique: ${dest}`)
      }
    } else {
      const destSlug = slugify(file.name.replace(/\.(mp3|wav|ogg|m4a)$/i, ''))
      const dest = `public/files/podcasts/${destSlug}.mp3`
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(file.path, dest)
        console.log(`📦 Sans correspondance: ${file.name} → ${dest}`)
      }
    }
  }

  if (updates.length > 0) {
    console.log(`\n📝 ${updates.length} audio_url à mettre à jour dans products.js`)
    let content = fs.readFileSync('src/data/products.js', 'utf8')
    let updated = 0

    for (const u of updates) {
      const idEscaped = u.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // [^{}] keeps the match within ONE flat object, refusing to cross
      // adjacent objects when the leading `{` does not belong to our id.
      const objPattern = new RegExp(`\\{[^{}]*?["']id["']\\s*:\\s*["']${idEscaped}["'][^{}]*?\\}`, 'm')
      const objMatch = content.match(objPattern)
      if (objMatch) {
        const obj = objMatch[0]
        const hasAnyAudioUrl = /(^|[^"\w])audio_url\s*:/.test(obj) || /"audio_url"\s*:/.test(obj)
        let replaced
        if (hasAnyAudioUrl) {
          // Replace ALL existing audio_url declarations (quoted or unquoted)
          // with a single canonical one — collapses any pre-existing dupes.
          let firstReplaced = false
          replaced = obj
            .replace(/("audio_url"|audio_url)\s*:\s*(null|'[^']*'|"[^"]*")\s*,?\s*\n/g, (line) => {
              if (!firstReplaced) {
                firstReplaced = true
                const indentMatch = line.match(/^(\s*)/)
                const indent = indentMatch ? indentMatch[1] : '    '
                return `${indent}audio_url: '${u.audio_url}',\n`
              }
              return ''
            })
        } else {
          // No audio_url at all — insert one right after the id line.
          replaced = obj.replace(
            new RegExp(`(["']id["']\\s*:\\s*["']${idEscaped}["'],?\\s*\\n)(\\s*)`),
            (_m, p1, p2) => `${p1}${p2}audio_url: '${u.audio_url}',\n${p2}`,
          )
        }
        content = content.replace(obj, replaced)
        updated++
        console.log(`  ✅ products.js mis à jour: ${u.titre}`)
      } else {
        console.log(`  ⚠️  Bloc d'objet introuvable pour id="${u.id}" — saut (le ciblage par regex a échoué).`)
      }
    }

    if (updated > 0) {
      fs.writeFileSync('src/data/products.js', content)
      console.log(`\n✅ ${updated} podcasts mis à jour dans products.js`)
    }
  }

  console.log('\n✅ Synchronisation podcast terminée')
}

main().catch(console.error)
