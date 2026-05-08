import fs from 'fs'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
fs.mkdirSync('public/icons', { recursive: true })

const svgIcon = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#070B0F"/>
  <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial Black, sans-serif" font-weight="900" font-size="${Math.round(size * 0.42)}"
    fill="#F0B429">A</text>
</svg>`

sizes.forEach(size => {
  fs.writeFileSync(`public/icons/icon-${size}.svg`, svgIcon(size))
  console.log(`✅ icon-${size}.svg créé`)
})
console.log('\n✅ Tous les icônes SVG générés dans public/icons/')
