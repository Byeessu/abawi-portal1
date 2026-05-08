// One-shot sweep: insert `// eslint-disable-next-line react-hooks/exhaustive-deps`
// above every useEffect/useMemo/useCallback that ESLint flags with that rule.
// Each insertion carries a TODO so the dette stays visible.
//
// Usage: node scripts/sweep-exhaustive-deps.mjs
import { ESLint } from 'eslint'
import { readFileSync, writeFileSync } from 'fs'
import { EOL } from 'os'

const RULE = 'react-hooks/exhaustive-deps'
const DIRECTIVE = '// eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies'

const eslint = new ESLint()
const results = await eslint.lintFiles(['src'])

const byFile = new Map()
for (const r of results) {
  for (const m of r.messages) {
    if (m.ruleId === RULE) {
      const lines = byFile.get(r.filePath) ?? []
      lines.push(m.line)
      byFile.set(r.filePath, lines)
    }
  }
}

let totalInserted = 0

for (const [filePath, rawLines] of byFile) {
  const content = readFileSync(filePath, 'utf8')
  // Detect the EOL the file uses so we don't mix CRLF/LF.
  const eol = content.includes('\r\n') ? '\r\n' : '\n'
  const lines = content.split(/\r?\n/)

  // Insert from highest line first so earlier indices stay valid.
  const targetLines = [...new Set(rawLines)].sort((a, b) => b - a)

  for (const lineNumber of targetLines) {
    const idx = lineNumber - 1 // 0-indexed
    if (idx < 0 || idx >= lines.length) continue
    const target = lines[idx]
    const indent = target.match(/^(\s*)/)?.[1] ?? ''
    // Skip if a directive is already on the line above.
    const above = lines[idx - 1] ?? ''
    if (above.includes('eslint-disable-next-line') && above.includes('exhaustive-deps')) continue
    lines.splice(idx, 0, indent + DIRECTIVE)
    totalInserted++
  }

  writeFileSync(filePath, lines.join(eol), 'utf8')
}

console.log(`Inserted ${totalInserted} eslint-disable-next-line directives across ${byFile.size} files.${EOL}`)
