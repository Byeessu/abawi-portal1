// Emergency restorer for imports stripped by eslint-plugin-unused-imports'
// faulty autofix. For every `react/jsx-no-undef` error, look up where the
// missing name is exported in the codebase, and re-insert the import at the
// top of the affected file.
//
// Usage: node scripts/restore-jsx-imports.mjs

import { ESLint } from 'eslint'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative, dirname, sep } from 'path'

// --- 1. Build a project-wide export index ---------------------------------
// Map: identifier -> { absPath, kind: 'default' | 'named' }
const exportsIndex = new Map()

function indexDir(dir) {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry)
    const st = statSync(abs)
    if (st.isDirectory()) {
      if (/node_modules|dist|coverage|playwright-report|test-results/.test(entry)) continue
      indexDir(abs)
      continue
    }
    if (!/\.(jsx?|tsx?)$/.test(entry)) continue
    if (/_backup\.|_corrupted\./.test(entry)) continue
    const src = readFileSync(abs, 'utf8')

    // Default export from filename: `export default function Foo` / `export default Foo`
    const defaultMatch = src.match(/export\s+default\s+(?:function\s+|class\s+)?(\w+)/)
    if (defaultMatch) {
      // Use the FILENAME (without ext) as the canonical default-import binding
      const name = entry.replace(/\.(jsx?|tsx?)$/, '')
      if (!exportsIndex.has(name)) exportsIndex.set(name, { absPath: abs, kind: 'default' })
    }
    // `export default function Name(`/anonymous default => fallback to filename above

    // Named exports: `export function Foo`, `export const Foo`, `export class Foo`
    for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)/g)) {
      const name = m[1]
      if (!exportsIndex.has(name)) exportsIndex.set(name, { absPath: abs, kind: 'named' })
    }
    // `export { Foo, Bar }`, `export { Foo as Bar }`
    for (const m of src.matchAll(/export\s*\{\s*([^}]+?)\s*\}/g)) {
      for (const part of m[1].split(',')) {
        const cleaned = part.trim().replace(/\s+as\s+(\w+)$/, (_, alias) => alias)
        const name = cleaned.match(/^\w+/)?.[0]
        if (name && !exportsIndex.has(name)) exportsIndex.set(name, { absPath: abs, kind: 'named' })
      }
    }
  }
}

// Hard-coded resolutions for third-party packages that must not be confused
// with project-local exports. The plugin removed these too.
const PACKAGE_RESOLUTIONS = {
  // react-router-dom
  Link: { from: 'react-router-dom', kind: 'named' },
  NavLink: { from: 'react-router-dom', kind: 'named' },
  Outlet: { from: 'react-router-dom', kind: 'named' },
  Navigate: { from: 'react-router-dom', kind: 'named' },
  Routes: { from: 'react-router-dom', kind: 'named' },
  Route: { from: 'react-router-dom', kind: 'named' },
  // react
  Suspense: { from: 'react', kind: 'named' },
  Fragment: { from: 'react', kind: 'named' },
  StrictMode: { from: 'react', kind: 'named' },
  // react-leaflet
  MapContainer: { from: 'react-leaflet', kind: 'named' },
  TileLayer: { from: 'react-leaflet', kind: 'named' },
  Marker: { from: 'react-leaflet', kind: 'named' },
  Popup: { from: 'react-leaflet', kind: 'named' },
  // swiper/react
  Swiper: { from: 'swiper/react', kind: 'named' },
  SwiperSlide: { from: 'swiper/react', kind: 'named' },
  // react itself, used as `React.X`
  React: { from: 'react', kind: 'default' },
}

// --- 2. Collect undefined references via ESLint ---------------------------

console.log('🔍 Indexing project exports...')
indexDir(join(process.cwd(), 'src'))
console.log(`   Indexed ${exportsIndex.size} exports.\n`)

console.log('🔍 Running ESLint to collect jsx-no-undef errors...')
const eslint = new ESLint()
const results = await eslint.lintFiles(['src'])

const byFile = new Map() // absPath -> Set<name>
for (const r of results) {
  for (const m of r.messages) {
    if (m.ruleId !== 'react/jsx-no-undef') continue
    const name = m.message.match(/'([^']+)'/)?.[1]
    if (!name) continue
    if (!byFile.has(r.filePath)) byFile.set(r.filePath, new Set())
    byFile.get(r.filePath).add(name)
  }
}

console.log(`   Found undefined identifiers in ${byFile.size} files.\n`)

// --- 3. For each file, build import statements and inject at the top ------

function buildImportLine(name, fromSpec, kind) {
  return kind === 'default'
    ? `import ${name} from '${fromSpec}'`
    : `import { ${name} } from '${fromSpec}'`
}

function relativeImportPath(fromFile, toAbsPath) {
  let rel = relative(dirname(fromFile), toAbsPath).replace(/\\/g, '/')
  rel = rel.replace(/\.(jsx?|tsx?)$/, '')
  if (!rel.startsWith('.')) rel = './' + rel
  return rel
}

let totalFiles = 0
let totalImports = 0
const unresolved = []

for (const [filePath, names] of byFile) {
  const content = readFileSync(filePath, 'utf8')
  const eol = content.includes('\r\n') ? '\r\n' : '\n'
  const linesToInsert = []

  for (const name of names) {
    const pkg = PACKAGE_RESOLUTIONS[name]
    if (pkg) {
      linesToInsert.push(buildImportLine(name, pkg.from, pkg.kind))
      continue
    }
    const local = exportsIndex.get(name)
    if (local) {
      const rel = relativeImportPath(filePath, local.absPath)
      linesToInsert.push(buildImportLine(name, rel, local.kind))
      continue
    }
    unresolved.push({ file: filePath, name })
  }

  if (linesToInsert.length === 0) continue

  // Insert just after the last existing top-of-file import, or at line 0.
  const lines = content.split(/\r?\n/)
  let insertAt = 0
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (t.startsWith('import ') || t.startsWith("'use ") || t.startsWith('"use ')) {
      insertAt = i + 1
    } else if (t === '' || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) {
      // skip blank/comment lines but don't advance insertAt past them yet
      if (insertAt > 0) continue
    } else {
      break
    }
  }

  // De-dupe against existing imports
  const existing = new Set(lines.slice(0, insertAt).map((l) => l.trim()))
  const fresh = linesToInsert.filter((l) => !existing.has(l))
  if (fresh.length === 0) continue

  lines.splice(insertAt, 0, ...fresh)
  writeFileSync(filePath, lines.join(eol), 'utf8')
  totalFiles++
  totalImports += fresh.length
  console.log(`  ${relative(process.cwd(), filePath)}  (+${fresh.length} import${fresh.length > 1 ? 's' : ''})`)
}

console.log(`\n✅ Restored ${totalImports} imports across ${totalFiles} files.`)
if (unresolved.length) {
  console.log(`\n⚠️  ${unresolved.length} unresolved name(s) — manual fix needed:`)
  for (const u of unresolved.slice(0, 30)) {
    console.log(`   ${relative(process.cwd(), u.file)}  →  ${u.name}`)
  }
  if (unresolved.length > 30) console.log(`   …and ${unresolved.length - 30} more.`)
}
