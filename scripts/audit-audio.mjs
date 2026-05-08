import fs from 'fs'
import path from 'path'

const MIN_SIZE_BYTES = 20000

const DIRS_TO_CHECK = [
  { dir: 'public/files/summaries', type: 'guide' },
  { dir: 'public/files/fascicules-audio', type: 'fascicule' },
  { dir: 'public/files/page-audios', type: 'page' },
  { dir: 'public/files/podcasts', type: 'podcast' },
]

async function main() {
  console.log('\n🔍 AUDIT AUDIO — Détection des fichiers défectueux\n')
  const defective = []
  const ok = []

  for (const { dir, type } of DIRS_TO_CHECK) {
    if (!fs.existsSync(dir)) { console.log(`⚠️  Dossier absent: ${dir}`); continue }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3'))
    console.log(`\n📂 ${dir} — ${files.length} fichiers`)

    for (const f of files) {
      const fp = path.join(dir, f)
      const stats = fs.statSync(fp)
      const size = stats.size

      if (size === 0) {
        console.log(`  ❌ VIDE: ${f}`)
        defective.push({ fp, f, size, reason: 'vide', type })
        fs.unlinkSync(fp)
      } else if (size < MIN_SIZE_BYTES) {
        console.log(`  ⚠️  TROP PETIT (${(size/1024).toFixed(0)} Ko): ${f}`)
        defective.push({ fp, f, size, reason: 'trop_petit', type })
        fs.unlinkSync(fp)
      } else {
        const buffer = Buffer.alloc(4)
        const fd = fs.openSync(fp, 'r')
        fs.readSync(fd, buffer, 0, 4, 0)
        fs.closeSync(fd)
        const isMP3 = buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0
        const isID3 = buffer.toString('ascii', 0, 3) === 'ID3'
        if (!isMP3 && !isID3) {
          console.log(`  ⚠️  FORMAT INVALIDE (${(size/1024).toFixed(0)} Ko): ${f}`)
          defective.push({ fp, f, size, reason: 'format_invalide', type })
          fs.unlinkSync(fp)
        } else {
          console.log(`  ✅ OK (${(size/1024).toFixed(0)} Ko): ${f}`)
          ok.push({ fp, f, size })
        }
      }
    }
  }

  console.log(`\n════════════════════════════════`)
  console.log(`✅ ${ok.length} fichiers valides`)
  console.log(`❌ ${defective.length} fichiers défectueux supprimés`)
  console.log(`════════════════════════════════`)

  if (defective.length > 0) {
    console.log('\n📋 Fichiers supprimés :')
    defective.forEach(d => console.log(`  - ${d.f} (${d.reason})`))
    console.log('\n⚡ Exécutez : node scripts/regenerate-all-audio.mjs')
  } else {
    console.log('\n🎉 Tous les fichiers audio sont valides !')
  }
}

main().catch(console.error)
