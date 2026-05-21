/**
 * ArkelUpLogo — Logo Arkel'Up Centre (PNG RGBA, fond transparent)
 * /public/arkelup-logo.png — 600×600, l'image contient le nom complet.
 */
export default function ArkelUpLogo({
  size = 48,
  variant = 'full',
  className = '',
  style = {},
  light: _light,
}) {
  // variant="icon" → affiche seulement la partie haute (symbole de l'arche)
  // en rognant le bas (texte), utile pour la navbar
  if (variant === 'icon') {
    return (
      <span
        className={className}
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          overflow: 'hidden',
          flexShrink: 0,
          ...style,
        }}
      >
        <img
          src="/arkelup-logo.png"
          alt="Arkel'Up Centre"
          style={{
            width: size * 1.8,           // zoom fort pour occuper la zone
            height: 'auto',
            marginLeft: -(size * 0.4),   // centre horizontalement
            marginTop: -(size * 0.05),   // légère remontée
            display: 'block',
          }}
          loading="eager"
          decoding="async"
        />
      </span>
    )
  }

  // variant="full" → logo entier, taille naturelle
  return (
    <img
      src="/arkelup-logo.png"
      alt="Arkel'Up Centre — L'Arche du Succès"
      height={size}
      width={size}
      style={{ objectFit: 'contain', display: 'block', ...style }}
      className={className}
      loading="lazy"
      decoding="async"
    />
  )
}
