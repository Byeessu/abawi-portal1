// Run ESLint programmatically and dump every no-undef issue with file/line/message.
// Usage: node scripts/lint-extract-undef.mjs
import { ESLint } from 'eslint'

const eslint = new ESLint()
const results = await eslint.lintFiles(['src'])
for (const r of results) {
  for (const m of r.messages) {
    if (m.ruleId === 'no-undef') {
      const rel = r.filePath.replace(/^.*portal1./, '')
      console.log(`${rel}|${m.line}|${m.message}`)
    }
  }
}
