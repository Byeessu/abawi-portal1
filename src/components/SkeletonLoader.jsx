/**
 * Skeleton Loader Components
 * État de chargement élégant pour une meilleure UX
 */

// Skeleton de base
export function Skeleton({ width, height, circle = false, style = {} }) {
  return (
    <div
      style={{
        width: width || '100%',
        height: height || '20px',
        background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%)',
        backgroundSize: '200% 100%',
        borderRadius: circle ? '50%' : '4px',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  )
}

// Skeleton pour une carte
export function CardSkeleton() {
  return (
    <div
      style={{
        padding: '20px',
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
      }}
    >
      <Skeleton height="200px" style={{ marginBottom: '16px', borderRadius: '8px' }} />
      <Skeleton width="60%" height="24px" style={{ marginBottom: '12px' }} />
      <Skeleton width="80%" height="16px" style={{ marginBottom: '8px' }} />
      <Skeleton width="40%" height="16px" />
    </div>
  )
}

// Skeleton pour liste
export function ListSkeleton({ count = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'var(--bg-card)',
            borderRadius: '8px',
          }}
        >
          <Skeleton width="40px" height="40px" circle />
          <div style={{ flex: 1 }}>
            <Skeleton width="70%" height="16px" style={{ marginBottom: '8px' }} />
            <Skeleton width="50%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Skeleton pour article
export function ArticleSkeleton() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Skeleton height="300px" style={{ marginBottom: '24px', borderRadius: '12px' }} />
      <Skeleton width="80%" height="32px" style={{ marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <Skeleton width="80px" height="20px" />
        <Skeleton width="120px" height="20px" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          width={`${Math.random() * 40 + 60}%`}
          height="16px"
          style={{ marginBottom: '12px' }}
        />
      ))}
    </div>
  )
}

// Skeleton pour produit
export function ProductSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      <div>
        <Skeleton height="400px" style={{ borderRadius: '12px', marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="80px" height="80px" style={{ borderRadius: '8px' }} />
          ))}
        </div>
      </div>
      <div>
        <Skeleton width="70%" height="36px" style={{ marginBottom: '16px' }} />
        <Skeleton width="40%" height="28px" style={{ marginBottom: '24px' }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height="16px" style={{ marginBottom: '12px' }} />
        ))}
        <Skeleton width="60%" height="48px" style={{ marginTop: '24px', borderRadius: '8px' }} />
      </div>
    </div>
  )
}

// Skeleton pour tableau de bord
export function DashboardSkeleton() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '20px',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <Skeleton width="40px" height="40px" circle style={{ marginBottom: '12px' }} />
            <Skeleton width="60%" height="24px" style={{ marginBottom: '8px' }} />
            <Skeleton width="40%" height="16px" />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <Skeleton height="300px" style={{ borderRadius: '12px' }} />
        <Skeleton height="300px" style={{ borderRadius: '12px' }} />
      </div>
    </div>
  )
}

// Grille de skeletons
export function SkeletonGrid({ count = 6, columns = 3 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '20px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export default {
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  ArticleSkeleton,
  ProductSkeleton,
  DashboardSkeleton,
  SkeletonGrid,
}
