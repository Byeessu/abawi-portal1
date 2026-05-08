import { useScrollReveal } from '../../hooks/useScrollReveal'

/**
 * Wrapper simple pour révéler un contenu au scroll.
 *
 * Usage :
 *   <SectionReveal>
 *     <h2>Titre qui apparaît</h2>
 *   </SectionReveal>
 *
 *   <SectionReveal direction="left" delay={200}>
 *     <p>Paragraphe qui glisse depuis la droite</p>
 *   </SectionReveal>
 */
export default function SectionReveal({
  children,
  direction = 'up',
  delay = 0,
  distance = 24,
  duration = 600,
  threshold = 0.15,
  as: Tag = 'div',
  ...rest
}) {
  const ref = useScrollReveal({ direction, delay, distance, duration, threshold })
  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  )
}
