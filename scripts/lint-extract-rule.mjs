// Dump every issue for a given rule (1st CLI arg) with file/line/message.
// Usage: node scripts/lint-extract-rule.mjs react-hooks/exhaustive-deps
import { ESLint } from 'eslint'

const rule = process.argv[2]
if (!rule) {
  console.error('Usage: node scripts/lint-extract-rule.mjs <rule-id>')
  process.exit(1)
}

const eslint = new ESLint()
const results = await eslint.lintFiles(['src'])
for (const r of results) {
  for (const m of r.messages) {
    const target = rule === 'null' ? m.ruleId === null : m.ruleId === rule
    if (target) {
      const rel = r.filePath.replace(/^.*portal1./, '')
      console.log(`${rel}|${m.line}|${m.message.replace(/\n/g, ' ')}`)
    }
  }
}
