// Remove every line that ESLint flags as "Unused eslint-disable directive".
// These are leftovers from previous bulk-sweeps that became redundant once
// neighbouring directives took precedence.
import { ESLint } from 'eslint'
import { readFileSync, writeFileSync } from 'fs'

const eslint = new ESLint()
const results = await eslint.lintFiles(['src'])

const byFile = new Map()
for (const r of results) {
  for (const m of r.messages) {
    if (m.ruleId === null && m.message.startsWith('Unused eslint-disable directive')) {
      const arr = byFile.get(r.filePath) ?? []
      arr.push(m.line)
      byFile.set(r.filePath, arr)
    }
  }
}

let removed = 0
for (const [filePath, rawLines] of byFile) {
  const content = readFileSync(filePath, 'utf8')
  const eol = content.includes('\r\n') ? '\r\n' : '\n'
  const lines = content.split(/\r?\n/)
  const targets = [...new Set(rawLines)].sort((a, b) => b - a)
  for (const lineNumber of targets) {
    const idx = lineNumber - 1
    if (idx < 0 || idx >= lines.length) continue
    if (!lines[idx].includes('eslint-disable')) continue
    lines.splice(idx, 1)
    removed++
  }
  writeFileSync(filePath, lines.join(eol), 'utf8')
}

console.log(`Removed ${removed} unused eslint-disable directives from ${byFile.size} files.`)
