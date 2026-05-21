/**
 * Met à jour image="/og-tools/[id].jpg" dans chaque <SEO> des outils.
 * Remplace les anciennes valeurs slider ET injecte si absent.
 * Run : node scripts/patch-seo-images.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root  = resolve(__dir, '..')

const PATCHES = [
  ['src/pages/outils/AbawiIA.jsx',                'abawi-ia'],
  ['src/pages/outils/AbawiTranslatorElite.jsx',   'translator-elite'],
  ['src/pages/outils/AnalyseCV.jsx',              'analyse-cv'],
  ['src/pages/outils/AudioStudioElite.jsx',       'audio-studio'],
  ['src/pages/outils/BusinessPlanEliteSimple.jsx','business-plan'],
  ['src/pages/outils/ComptableEliteSimple.jsx',   'comptable'],
  ['src/pages/outils/ConsultantEliteSimple.jsx',  'consultant'],
  ['src/pages/outils/CVCreator.jsx',              'cv'],
  ['src/pages/outils/DictionnaireElite.jsx',      'dictionnaire-elite'],
  ['src/pages/outils/FactureCreator.jsx',         'facture'],
  ['src/pages/outils/FinanceEliteSimple.jsx',     'finance'],
  ['src/pages/outils/FormatConverter.jsx',        'format-converter'],
  ['src/pages/outils/ImagePro.jsx',               'image-pro'],
  ['src/pages/outils/ImmobilierEliteSimple.jsx',  'immobilier'],
  ['src/pages/outils/InfographiePro.jsx',         'infographie-pro'],
  ['src/pages/outils/JuridiqueElite.jsx',         'juridique'],
  ['src/pages/outils/PhotoStudioPro.jsx',         'photo-studio-pro'],
  ['src/pages/outils/PitchDeck.jsx',              'pitch'],
  ['src/pages/outils/ProCardElite.jsx',           'pro-card-elite'],
  ['src/pages/outils/QRCodePro.jsx',              'qr-code-pro'],
  ['src/pages/outils/RHEliteSimple.jsx',          'rh'],
  ['src/pages/outils/SmartWordEditor.jsx',        'smart-word-editor'],
  ['src/pages/outils/StudioVisuelPro.jsx',        'studio-visuel-pro'],
]

let patched = 0, skipped = 0

for (const [rel, id] of PATCHES) {
  const filePath  = resolve(root, rel)
  const newImage  = `/og-tools/${id}.jpg`
  const thumbFile = resolve(root, 'public', 'og-tools', `${id}.jpg`)

  if (!existsSync(filePath))  { console.log(`  ⚠ Not found: ${rel}`); skipped++; continue }
  if (!existsSync(thumbFile)) { console.log(`  ⚠ No thumb:  ${newImage}`); skipped++; continue }

  let src = readFileSync(filePath, 'utf8')

  // Déjà correct ?
  if (src.includes(`image="${newImage}"`)) {
    console.log(`  · Up-to-date: ${rel}`); skipped++; continue
  }

  const before = src

  // Cas A — image existante à remplacer (n'importe quelle valeur)
  src = src.replace(/image="[^"]*"/, `image="${newImage}"`)

  // Cas B — pas d'image, SEO sur une seule ligne
  if (src === before) {
    src = src.replace(/(<SEO\b[^/\n>]*)(\/?>)/, (m, attrs, close) =>
      `${attrs} image="${newImage}"${close}`)
  }

  // Cas C — SEO multi-lignes, ajouter avant la fermeture />
  if (src === before) {
    src = src.replace(/(<SEO\b[\s\S]*?)(\/\s*>)/, (m, block, end) =>
      `${block}        image="${newImage}"\n      ${end}`)
  }

  if (src !== before) {
    writeFileSync(filePath, src)
    console.log(`  ✓  ${rel}`)
    patched++
  } else {
    console.log(`  ?  No pattern found: ${rel}`)
    skipped++
  }
}

console.log(`\n✅  ${patched} fichiers mis à jour, ${skipped} ignorés.`)
