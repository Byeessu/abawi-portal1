import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import PaymentFlow from '../components/PaymentFlow'

const PLANS = [
  {
    id: 'gratuit',
    nom: 'Gratuit',
    prix: 0,
    credits: 15,
    couleur: '#4A5568',
    badge: null,
    features: [
      { ok: true,  label: '15 crédits IA / mois' },
      { ok: true,  label: 'Guides gratuits' },
      { ok: true,  label: 'Podcasts gratuits' },
      { ok: true,  label: 'Outils IA basiques' },
      { ok: false, label: 'Guides premium' },
      { ok: false, label: 'ABAWI 360' },
      { ok: false, label: 'Support prioritaire' },
    ],
  },
  {
    id: 'starter',
    nom: 'Starter',
    prix: 4990,
    credits: 100,
    couleur: '#3B82F6',
    badge: null,
    features: [
      { ok: true,  label: '100 crédits IA / mois' },
      { ok: true,  label: 'Tous les guides premium' },
      { ok: true,  label: 'Fascicules scolaires' },
      { ok: true,  label: 'Outils IA avancés' },
      { ok: true,  label: 'Support email' },
      { ok: false, label: 'ABAWI 360' },
      { ok: false, label: 'Annah prioritaire' },
    ],
  },
  {
    id: 'pro',
    nom: 'Pro',
    prix: 9990,
    credits: 300,
    couleur: '#F0B429',
    badge: '⭐ Populaire',
    popular: true,
    features: [
      { ok: true, label: '300 crédits IA / mois' },
      { ok: true, label: 'Accès illimité guides + fascicules' },
      { ok: true, label: 'ABAWI 360 (CRM, Stats, Marketing)' },
      { ok: true, label: 'Outils IA élite' },
      { ok: true, label: 'Support prioritaire' },
      { ok: true, label: 'Téléchargement PDF illimité' },
      { ok: false, label: 'Annah prioritaire' },
    ],
  },
  {
    id: 'elite',
    nom: 'Elite',
    prix: 19990,
    credits: 1000,
    couleur: '#8B5CF6',
    badge: null,
    features: [
      { ok: true, label: '1000 crédits IA / mois' },
      { ok: true, label: 'Tout inclus Plan Pro' },
      { ok: true, label: 'Analyses financières avancées' },
      { ok: true, label: 'Business plans illimités' },
      { ok: true, label: 'Support dédié WhatsApp' },
      { ok: true, label: 'Bêta nouvelles fonctionnalités' },
      { ok: false, label: 'Annah prioritaire' },
    ],
  },
  {
    id: '360',
    nom: '360',
    prix: 14990,
    credits: 600,
    couleur: '#14B8A6',
    badge: '🌀 ABAWI 360',
    features: [
      { ok: true, label: '600 crédits IA / mois' },
      { ok: true, label: 'Tout inclus Plan Pro' },
      { ok: true, label: 'ABAWI 360 complet (CRM + Planif + Stats + Marketing)' },
      { ok: true, label: 'Outils IA Élite complets' },
      { ok: true, label: 'Support prioritaire WhatsApp' },
      { ok: true, label: 'Exports pro + tableaux avancés' },
      { ok: false, label: 'Annah prioritaire' },
    ],
  },
  {
    id: 'vip',
    nom: 'VIP',
    prix: 49990,
    credits: 9999,
    couleur: '#F59E0B',
    badge: '👑 VIP',
    features: [
      { ok: true, label: 'Crédits illimités' },
      { ok: true, label: 'Accès total à tout le contenu' },
      { ok: true, label: 'Annah prioritaire + assistance continue' },
      { ok: true, label: 'Priorité absolue sur tout' },
      { ok: true, label: 'Facture mensuelle fournie' },
      { ok: true, label: 'Badge VIP visible' },
      { ok: true, label: 'Accès anticipé aux nouveautés' },
    ],
  },
]

const CREDIT_PACKS = [
  { id: 'pack-50',   nom: 'Pack Starter',  credits: 50,   prix: 2500,  bonus: 0,   popular: false },
  { id: 'pack-100',  nom: 'Pack Standard', credits: 100,  prix: 4500,  bonus: 10,  popular: false },
  { id: 'pack-200',  nom: 'Pack Pro',      credits: 200,  prix: 8000,  bonus: 25,  popular: true  },
  { id: 'pack-500',  nom: 'Pack Business', credits: 500,  prix: 17500, bonus: 75,  popular: false },
  { id: 'pack-1000', nom: 'Pack Elite',    credits: 1000, prix: 30000, bonus: 200, popular: false },
]

const COMPARISON = [
  { feature: 'Crédits IA / mois',        gratuit: '15',     starter: '100',   pro: '300',   elite: '1000',  '360': '600', vip: '∞' },
  { feature: 'Guides premium',           gratuit: '—',      starter: '✅',    pro: '✅',    elite: '✅',    '360': '✅', vip: '✅' },
  { feature: 'Fascicules scolaires',     gratuit: '—',      starter: '✅',    pro: '✅',    elite: '✅',    '360': '✅', vip: '✅' },
  { feature: 'ABAWI 360',                gratuit: '—',      starter: '—',     pro: 'Partiel', elite: '✅',  '360': 'Complet', vip: '✅' },
  { feature: 'Outils IA avancés',        gratuit: 'Basique', starter: '✅',   pro: '✅',    elite: '✅',    '360': '✅', vip: '✅' },
  { feature: 'Support',                  gratuit: '—',      starter: 'Email', pro: 'Prio.', elite: 'WA',    '360': 'WA+', vip: 'Dédié' },
  { feature: 'Téléchargement PDF',       gratuit: '—',      starter: '—',     pro: '✅',    elite: '✅',    '360': '✅', vip: '✅' },
  { feature: 'Assistant Annah',          gratuit: '—',      starter: '—',     pro: '—',     elite: '—',     '360': '—', vip: 'Prioritaire' },
  { feature: 'Badge membre',             gratuit: '—',      starter: '—',     pro: '—',     elite: '—',     '360': '🌀 360', vip: '👑 VIP' },
]

export default function Plans() {
  const { membre, isMember } = useAuth()
  const [payPlan, setPayPlan] = useState(null)
  const [payPack, setPayPack] = useState(null)
  const [billingAnnuel, setBillingAnnuel] = useState(false)
  const [activeTab, setActiveTab] = useState('plans') // 'plans' | 'credits' | 'compare'

  function prixAnnuel(prix) { return Math.round(prix * 10) } // ~2 mois offerts

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'Outfit, sans-serif' }}>
      {/* === HERO === */}
      <section style={{ background: 'linear-gradient(180deg, rgba(240,180,41,0.05) 0%, transparent 100%)', borderBottom: '1px solid rgba(240,180,41,0.08)', padding: '60px 24px 40px', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', padding: '4px 18px', borderRadius: '100px', background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)', color: '#F0B429', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '16px' }}>💎 ABAWI PLUS</span>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Choisissez votre plan
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '540px', margin: '0 auto 28px', lineHeight: 1.6 }}>
          Accédez à tous les contenus premium ABAWI, aux outils IA et à ABAWI 360. Sans engagement.
        </p>

        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: !billingAnnuel ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Mensuel</span>
          <button onClick={() => setBillingAnnuel(v => !v)} style={{ width: 46, height: 24, borderRadius: 12, background: billingAnnuel ? '#F0B429' : '#1A2332', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
            <span style={{ position: 'absolute', top: 2, left: billingAnnuel ? 24 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: billingAnnuel ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Annuel</span>
          {billingAnnuel && <span style={{ padding: '2px 10px', borderRadius: 100, background: 'rgba(24,168,74,0.15)', color: '#18A84A', fontSize: '0.72rem', fontWeight: 800 }}>-17% économisé</span>}
        </div>
      </section>

      {/* === TABS === */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '40px', paddingTop: '24px', overflowX: 'auto' }}>
          {[
            { id: 'plans',   label: '💎 Plans d\'abonnement' },
            { id: 'credits', label: '💳 Packs de crédits' },
            { id: 'compare', label: '📊 Comparaison' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap',
              color: activeTab === t.id ? '#F0B429' : 'var(--text-secondary)',
              borderBottom: activeTab === t.id ? '2px solid #F0B429' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* === PLANS === */}
        {activeTab === 'plans' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', paddingBottom: '60px' }}>
            {PLANS.map(plan => {
              const prix = billingAnnuel && plan.prix > 0 ? prixAnnuel(plan.prix) : plan.prix
              const isPopular = plan.popular
              return (
                <div key={plan.id} style={{
                  background: 'var(--bg-card)', border: `2px solid ${isPopular ? plan.couleur : plan.couleur + '30'}`,
                  borderRadius: '20px', padding: '28px 24px', position: 'relative',
                  boxShadow: isPopular ? `0 8px 32px ${plan.couleur}20` : 'none',
                  transform: isPopular ? 'translateY(-6px)' : 'none',
                }}>
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 100, background: plan.couleur, color: '#fff', fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {plan.badge}
                    </div>
                  )}
                  <h2 style={{ color: plan.couleur, fontSize: '1.2rem', fontWeight: 900, marginBottom: '8px' }}>{plan.nom}</h2>
                  <div style={{ marginBottom: '20px' }}>
                    {plan.prix === 0 ? (
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>Gratuit</span>
                    ) : (
                      <>
                        <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{prix.toLocaleString()}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}> FCFA/{billingAnnuel ? 'an' : 'mois'}</span>
                      </>
                    )}
                    <div style={{ color: plan.couleur, fontSize: '0.78rem', fontWeight: 700, marginTop: '4px' }}>
                      {plan.credits === 9999 ? '∞ crédits IA' : `${plan.credits} crédits IA/mois`}
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.82rem', color: f.ok ? 'var(--text-primary)' : 'var(--text-secondary)', opacity: f.ok ? 1 : 0.45 }}>
                        <span style={{ color: f.ok ? plan.couleur : '#4A5568', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>{f.ok ? '✓' : '✕'}</span>
                        {f.label}
                      </li>
                    ))}
                  </ul>
                  {plan.prix === 0 ? (
                    membre ? (
                      <div style={{ textAlign: 'center', padding: '10px', borderRadius: '12px', background: 'rgba(74,85,104,0.15)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem' }}>Plan actuel</div>
                    ) : (
                      <Link to="/login" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: '12px', background: 'rgba(74,85,104,0.15)', color: '#8B95A5', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>Commencer gratuitement</Link>
                    )
                  ) : (
                    <button onClick={() => setPayPlan(plan)} style={{
                      width: '100%', padding: '12px', borderRadius: '12px',
                      background: isPopular ? `linear-gradient(135deg, ${plan.couleur}, ${plan.couleur}cc)` : `rgba(${plan.couleur.replace('#','').match(/../g).map(h=>parseInt(h,16)).join(',')},0.15)`,
                      border: `1px solid ${plan.couleur}40`,
                      color: isPopular ? '#fff' : plan.couleur,
                      fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    }}>
                      {membre && isMember ? 'Passer à ce plan' : 'Choisir ce plan'} →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* === CREDIT PACKS === */}
        {activeTab === 'credits' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.4rem', marginBottom: '8px' }}>Packs de crédits IA</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Les crédits servent à utiliser tous les outils IA ABAWI. Ils ne expirent jamais.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', paddingBottom: '60px' }}>
              {CREDIT_PACKS.map(pack => (
                <div key={pack.id} style={{
                  background: 'var(--bg-card)', border: `2px solid ${pack.popular ? '#F0B429' : 'rgba(240,180,41,0.12)'}`,
                  borderRadius: '16px', padding: '24px 20px', position: 'relative',
                  boxShadow: pack.popular ? '0 8px 32px rgba(240,180,41,0.15)' : 'none',
                  transform: pack.popular ? 'translateY(-4px)' : 'none',
                }}>
                  {pack.popular && (
                    <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', padding: '3px 14px', borderRadius: 100, background: '#F0B429', color: '#070B0F', fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      ⭐ Meilleur rapport
                    </div>
                  )}
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F0B429', marginBottom: '4px' }}>
                    {pack.credits + pack.bonus}
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}> crédits</span>
                  </div>
                  {pack.bonus > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#18A84A', fontWeight: 700, marginBottom: '8px' }}>+{pack.bonus} offerts</div>
                  )}
                  <div style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.2rem', marginBottom: '4px' }}>{pack.prix.toLocaleString()} FCFA</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '20px' }}>≈ {Math.round(pack.prix / (pack.credits + pack.bonus))} FCFA / crédit</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{pack.nom}</div>
                  <button onClick={() => setPayPack(pack)} style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    background: pack.popular ? 'linear-gradient(135deg, #F0B429, #e5a820)' : 'rgba(240,180,41,0.12)',
                    border: '1px solid rgba(240,180,41,0.3)',
                    color: pack.popular ? '#070B0F' : '#F0B429',
                    fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  }}>
                    Acheter →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === COMPARISON === */}
        {activeTab === 'compare' && (
          <div style={{ paddingBottom: '60px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.82rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Fonctionnalité</th>
                  {PLANS.map(p => (
                    <th key={p.id} style={{ padding: '14px 16px', textAlign: 'center', color: p.couleur, fontWeight: 800, fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: p.popular ? `${p.couleur}08` : 'transparent' }}>
                      {p.nom}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>{row.feature}</td>
                    {['gratuit','starter','pro','360','elite','vip'].map(plan => (
                      <td key={plan} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.82rem', color: row[plan] === '✅' ? '#18A84A' : row[plan] === '—' ? '#4A5568' : 'var(--text-primary)', fontWeight: row[plan] === '✅' ? 800 : 600 }}>
                        {row[plan]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === FAQ === */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--text-primary)', fontWeight: 900, marginBottom: '28px', fontSize: '1.4rem' }}>Questions fréquentes</h2>
        {[
          { q: 'Comment fonctionne les crédits IA ?', r: 'Chaque utilisation d\'un outil IA (génération de CV, analyse juridique, business plan...) consomme des crédits. Les plans incluent un quota mensuel renouvelable. Vous pouvez aussi acheter des packs supplémentaires qui n\'expirent jamais.' },
          { q: 'Puis-je annuler à tout moment ?', r: 'Oui. Aucun engagement. Votre accès reste actif jusqu\'à la fin de la période payée.' },
          { q: 'Comment payer ?', r: 'Wave, Orange Money, Free Money ou carte bancaire. Paiement sécurisé via PayDunya.' },
          { q: 'Que contient ABAWI 360 ?', r: 'CRM (gestion clients), Planification de projets, Statistiques business, Marketing & Calendrier de contenu — tout pour gérer votre entreprise en un seul endroit.' },
        ].map((faq, i) => (
          <details key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
            <summary style={{ padding: '16px 0', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.92rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {faq.q}
              <span style={{ color: '#F0B429', fontSize: '1.2rem', fontWeight: 300 }}>+</span>
            </summary>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7, paddingBottom: '16px', margin: 0 }}>{faq.r}</p>
          </details>
        ))}
      </section>

      {/* === PAYMENT MODALS === */}
      {payPlan && (
        <PaymentFlow
          product={{
            id: payPlan.id,
            titre: `ABAWI Plus — Plan ${payPlan.nom}`,
            prix: billingAnnuel ? prixAnnuel(payPlan.prix) : payPlan.prix,
            type: 'abonnement',
          }}
          onClose={() => setPayPlan(null)}
          onSuccess={() => { setPayPlan(null); window.location.href = '/merci-abonnement' }}
        />
      )}
      {payPack && (
        <PaymentFlow
          product={{
            id: payPack.id,
            titre: `${payPack.nom} — ${payPack.credits + payPack.bonus} crédits`,
            prix: payPack.prix,
            type: 'credits',
          }}
          onClose={() => setPayPack(null)}
          onSuccess={() => { setPayPack(null); window.location.href = '/credits' }}
        />
      )}
    </main>
  )
}
