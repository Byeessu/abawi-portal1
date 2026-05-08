// Group all current ESLint issues by ruleId, sorted by count.
import { ESLint } from 'eslint'

const eslint = new ESLint()
const results = await eslint.lintFiles(['src'])

const counts = new Map()
for (const r of results) {
  for (const m of r.messages) {
    const id = m.ruleId ?? '<parser>'
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
}

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
const total = sorted.reduce((a, [, n]) => a + n, 0)
console.log(`Total: ${total}\n`)
for (const [rule, n] of sorted) {
  console.log(`${String(n).padStart(5)}  ${rule}`)
}
