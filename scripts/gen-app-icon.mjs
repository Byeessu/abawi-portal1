/**
 * Génère les icônes Android (mipmap) et iOS (AppIcon) à partir du logo ABAWI.
 * Usage : node scripts/gen-app-icon.mjs
 * Requiert : npm install sharp (si pas dispo, icône SVG manuelle)
 */
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// SVG source 1024×1024 — icône ABAWI
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#F0B429"/>
    </linearGradient>
    <linearGradient id="green" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22C55E"/>
      <stop offset="100%" stop-color="#15803D"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>

  <!-- Glow top-left -->
  <ellipse cx="300" cy="280" rx="300" ry="220" fill="#F0B429" opacity="0.06"/>

  <!-- Letter A — ABAWI wordmark style -->
  <path d="M512 180 L680 720 H580 L540 580 H484 L444 720 H344 Z
           M512 320 L466 520 H558 Z"
        fill="url(#gold)"/>

  <!-- Green accent bar below A -->
  <rect x="344" y="740" width="336" height="18" rx="9" fill="url(#green)"/>

  <!-- Sub-text ABAWI (small, spaced) -->
  <text x="512" y="850"
        font-family="Arial Black, sans-serif"
        font-size="72" font-weight="900"
        fill="white" opacity="0.15"
        text-anchor="middle" letter-spacing="18">ABAWI</text>

  <!-- Gold dot accent -->
  <circle cx="512" cy="890" r="12" fill="url(#gold)"/>
</svg>`

// Écrire le SVG source dans public/
import { writeFileSync } from 'fs'
const svgPath = join(ROOT, 'public', 'abawi-app-icon.svg')
writeFileSync(svgPath, SVG)
console.log('✅ SVG source écrit :', svgPath)

// Tenter de générer les PNG avec Sharp (si installé)
try {
  const sharp = (await import('sharp')).default
  const buf = Buffer.from(SVG)

  const ANDROID_SIZES = [
    { dir: 'mipmap-mdpi',    size: 48  },
    { dir: 'mipmap-hdpi',    size: 72  },
    { dir: 'mipmap-xhdpi',   size: 96  },
    { dir: 'mipmap-xxhdpi',  size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ]

  for (const { dir, size } of ANDROID_SIZES) {
    const outDir = join(ROOT, 'android/app/src/main/res', dir)
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
    await sharp(buf).resize(size, size).png().toFile(join(outDir, 'ic_launcher.png'))
    await sharp(buf).resize(size, size).png().toFile(join(outDir, 'ic_launcher_round.png'))
    console.log(`✅ Android ${dir}: ${size}x${size}`)
  }

  const IOS_SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
  const iosDir = join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset')
  if (existsSync(iosDir)) {
    for (const size of IOS_SIZES) {
      await sharp(buf).resize(size, size).png().toFile(join(iosDir, `Icon-${size}.png`))
      console.log(`✅ iOS ${size}x${size}`)
    }
  }

  console.log('\n🎉 Toutes les icônes générées !')
} catch {
  console.log('\n⚠️  Sharp non installé. Icônes PNG non générées automatiquement.')
  console.log('   Pour générer : npm install sharp && node scripts/gen-app-icon.mjs')
  console.log('   Ou utilisez Android Asset Studio : https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html')
  console.log('   Icône SVG source disponible dans : public/abawi-app-icon.svg')
}
