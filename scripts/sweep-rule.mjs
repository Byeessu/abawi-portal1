// Insert `// eslint-disable-next-line <rule>` directives for every flagged line
// matching the given rule. CLI: node scripts/sweep-rule.mjs <rule> "<reason>"
import { ESLint } from 'eslint'
import { readFileSync, writeFileSync } from 'fs'

const rule = process.argv[2]
const reason = process.argv[3] ?? ''
if (!rule) {
  console.error('Usage: node scripts/sweep-rule.mjs <rule-id> "<reason>"')
  process.exit(1)
}
const directive = `// eslint-disable-next-line ${rule}${reason ? ` -- ${reason}` : ''}`

const eslint = new ESLint()
const results = await eslint.lintFiles(['src'])

const byFile = new Map()
for (const r of results) {
  for (const m of r.messages) {
    if (m.ruleId === rule) {
      const arr = byFile.get(r.filePath) ?? []
      arr.push(m.line)
      byFile.set(r.filePath, arr)
    }
  }
}

let inserted = 0
for (const [filePath, rawLines] of byFile) {
  const content = readFileSync(filePath, 'utf8')
  const eol = content.includes('\r\n') ? '\r\n' : '\n'
  const lines = content.split(/\r?\n/)
  const targets = [...new Set(rawLines)].sort((a, b) => b - a)
  for (const lineNumber of targets) {
    const idx = lineNumber - 1
    if (idx < 0 || idx >= lines.length) continue
    const indent = lines[idx].match(/^(\s*)/)?.[1] ?? ''
    const above = lines[idx - 1] ?? ''
    if (above.includes('eslint-disable-next-line') && above.includes(rule)) continue
    lines.splice(idx, 0, indent + directive)
    inserted++
  }
  writeFileSync(filePath, lines.join(eol), 'utf8')
}

console.log(`Inserted ${inserted} directives for rule ${rule} across ${byFile.size} files.`)
