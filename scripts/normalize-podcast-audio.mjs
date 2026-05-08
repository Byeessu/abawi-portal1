import fs from 'fs'

const filePath = 'src/data/products.js'
let content = fs.readFileSync(filePath, 'utf8')

const podcastsStart = content.indexOf('export const podcasts = [')
if (podcastsStart === -1) {
  console.error('podcasts array not found')
  process.exit(1)
}

const packsStart = content.indexOf('export const digitalPacks', podcastsStart)
if (packsStart === -1) {
  console.error('digitalPacks section not found')
  process.exit(1)
}

const before = content.slice(0, podcastsStart)
const podcastsBlock = content.slice(podcastsStart, packsStart)
const after = content.slice(packsStart)

const normalizedBlock = podcastsBlock.replace(/\{[\s\S]*?\}/g, (obj) => {
  if (!obj.includes('"id"') || !obj.includes('"titre"')) return obj

  const matches = [...obj.matchAll(/audio_url\s*:\s*(null|'[^']*'|"[^"]*")\s*,?/g)]
  if (matches.length <= 1) return obj

  let selected = null
  for (const m of matches) {
    const raw = m[1]
    if (raw !== 'null') selected = raw
  }
  if (!selected) selected = 'null'

  let cleaned = obj.replace(/\n?\s*audio_url\s*:\s*(null|'[^']*'|"[^"]*")\s*,?/g, '')
  cleaned = cleaned.replace(/\{\s*\n/, '{\n')

  const idLineMatch = cleaned.match(/(\s*"id"\s*:\s*"[^"]+"\s*,\n)/)
  if (!idLineMatch) return obj

  const insert = `${idLineMatch[0].match(/^\s*/)[0]}audio_url: ${selected},\n`
  cleaned = cleaned.replace(idLineMatch[0], `${idLineMatch[0]}${insert}`)
  return cleaned
})

content = before + normalizedBlock + after
fs.writeFileSync(filePath, content)

console.log('✅ podcast audio_url fields normalized')
