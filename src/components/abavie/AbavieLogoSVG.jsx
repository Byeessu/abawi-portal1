/* Symbole ABAWI original — image réelle avec filtre CSS.
   Pas de background propre : s'adapte au fond du parent (vert ou autre).
   mix-blend-mode:screen fusionne le fond blanc de l'image avec le fond vert parent,
   rendant le symbole clair sur fond vert. */
export function AbavieLogoSVG({ size = 32 }) {
  return (
    <img
      src="/abawi-pay-icon.jpg"
      width={size}
      height={size}
      alt="Abavie"
      style={{
        display: 'block',
        objectFit: 'cover',
        flexShrink: 0,
        filter: 'invert(1) grayscale(1) brightness(2)',
        mixBlendMode: 'screen',
      }}
    />
  )
}
