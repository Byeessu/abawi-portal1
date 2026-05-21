import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PLANS } from '../data/plans'
import { TOOLS_ESSENTIELS, TOOLS_ELITE, CREDIT_COSTS_DISPLAY } from '../data/tools'
import SEO from '../components/SEO'

const SECTIONS = [
  { id: 'presentation', label: '📖 Présentation' },
  { id: 'outils',       label: '🛠️ Les Outils' },
  { id: 'plans',        label: '💎 Plans & Tarifs' },
  { id: 'credits',      label: '⚡ Crédits' },
  { id: 'faq',          label: '❓ FAQ' },
]

// ── Outils gratuits / accessibles sans crédits ──────────────────────
const OUTILS_GRATUITS = [
  { title: 'ABAWI IA', path: '/outils/abawi-ia', desc: 'Coach IA expert multilingue — 7 modes : quiz, recherche, simulation, vocal (FR, EN, Wolof).' },
  { title: 'ABAWI IA Vocal', path: '/outils/abawi-ia#annah', desc: 'Coach vocal Annah : réponses stratégiques + lecture vocale. FR, EN, Wolof.' },
  { title: 'Facture / Devis', path: '/outils/facture', desc: 'Factures et devis professionnels avec calcul automatique TVA. 100% gratuit.' },
  { title: 'Pro Card Élite', path: '/outils/pro-card-elite', desc: 'Cartes de visite numériques & physiques — 12 templates, QR code, export PDF, vCard NFC.' },
  { title: 'QR Code Pro', path: '/outils/qr-code-pro', desc: '12 types de QR codes — URL, vCard, WiFi, WhatsApp, SMS, paiement. Export PNG/SVG HD.' },
  { title: 'Smart Word Editor', path: '/outils/smart-word-editor', desc: 'Éditeur de documents professionnel — templates, mise en page, export HTML.' },
  { title: 'Format Converter Pro', path: '/outils/format-converter', desc: 'Convertisseur universel 100% local : images, audio, vidéo, documents. Aucun upload serveur.' },
  { title: 'Abawi Language Pro', path: '/outils/dictionnaire-elite', desc: 'Dictionnaire massif multilingue FR, EN, Wolof, 中文, ES, AR — auto-run IA.' },
  { title: 'Abawi Translator Elite', path: '/outils/translator-elite', desc: 'Traduction avancée + explication exhaustive dans la langue de votre choix.' },
  { title: 'AbZone', path: '/outils/abzone', desc: 'Espace communautaire — forum premium, défis business, entraide entre entrepreneurs.' },
  { title: 'ABAWI AutoRoute', path: '/outils/autoroute', desc: 'Assistant route & navigation — trafic temps réel, stations-service, dépannage.' },
  { title: 'Abavie Santé', path: '/outils/sante', desc: 'Annuaire santé Sénégal : hôpitaux, pharmacies de garde, urgences, carte GPS.' },
  { title: 'SenTicket', path: '/outils/senticket', desc: 'Billetterie événementielle complète — création, vente de tickets, QR codes, paiement mobile money.' },
  { title: 'Recrute-Moi SN', path: '/outils/recrute-moi-sn', desc: "Plateforme emploi & networking sénégalaise — offres d'emploi, candidatures, CDI, CDD, Freelance, Stages." },
  { title: 'Place Ouvrier', path: '/outils/place-ouvrier', desc: 'Trouvez ou proposez des services ouvriers qualifiés — maçon, électricien, plombier et 20+ métiers.' },
  { title: 'Espace Ouvrier', path: '/outils/espace-ouvrier', desc: 'Annuaire des artisans & prestataires — galerie de réalisations, devis en ligne, avis certifiés.' },
]

// ── Outils Essentiels (crédits) ──────────────────────────────────────
const OUTILS_CREDITS = [
  { title: 'Image Pro', path: '/outils/image-pro', desc: 'Éditeur photo pro : suppression fond IA, Chroma Key, tampon de clonage, export PNG/JPEG/WebP.', credits: 3 },
  { title: 'Studio Photo ID Pro', path: '/outils/photo-studio-pro', desc: 'Photos d\'identité HD : webcam, formats UE/USA/admin, retouche express, export PDF.', credits: 3 },
  { title: 'Créateur de CV Pro', path: '/outils/cv', desc: 'CV professionnel ATS — 8 thèmes, import fichier, variantes IA, export PDF/Word.', credits: 2 },
  { title: 'Lettre de Motivation', path: '/outils/lettre', desc: 'Lettre personnalisée et professionnelle en 2 minutes. Export PDF.', credits: 2 },
  { title: 'Analyse de CV par IA', path: '/outils/analyse-cv', desc: 'Score ATS, points forts/faibles, suggestions d\'amélioration ciblées.', credits: 3 },
]

// ── Outils Élite (plan Élite ou crédits) ─────────────────────────────
const OUTILS_PUBLICS = [
  { title: 'Business Plan Élite', path: '/outils/business-plan', desc: 'Business plan exhaustif : executive summary, projections financières 3 ans, SWOT, analyse de marché.', credits: 8 },
  { title: 'Pitch Deck Investisseur', path: '/outils/pitch', desc: '10 slides VC-grade générées par IA, design professionnel, données Africa-first, export PDF.', credits: 6 },
  { title: 'Finance Élite', path: '/outils/finance', desc: 'Analyse financière complète : ratios, DCF, score crédit, trésorerie, rapport IA.', credits: 15 },
  { title: 'Juridique Élite', path: '/outils/juridique', desc: '12 types de documents juridiques OHADA : statuts, contrats, baux, NDA, PV AG.', credits: 12 },
  { title: 'Comptable Élite', path: '/outils/comptable', desc: 'Journal SYSCOHADA, balance, TVA, paie SN, KPI comptables, rapport IA.', credits: 12 },
  { title: 'RH Élite', path: '/outils/rh', desc: 'Grille salaires, évaluation 360°, paie SN, contrats, règlement intérieur, onboarding.', credits: 8 },
  { title: 'Immobilier Élite', path: '/outils/immobilier', desc: 'Simulation investissement, rendement, financement, estimation, bail, business plan.', credits: 8 },
  { title: 'Consultant Élite', path: '/outils/consultant', desc: 'Proposition commerciale, rapport de mission, étude de marché, SWOT, CR réunion, KPI.', credits: 8 },
  { title: 'Smart Office Pro', path: '/outils/smart-office', desc: 'Éditeur intelligent avancé pour documents professionnels avec commandes rapides et IA intégrée.', credits: 5 },
  { title: 'Abawi Exégètika', path: '/outils/exegetika', desc: 'Analyse exégétique totale : origines, contextes, interprétations — mot, phrase, document ou thème.', credits: 5 },
  { title: 'Audio Studio Élite', path: '/outils/audio-studio-elite', desc: 'Dictaphone pro, égaliseur 10 bandes, compresseur, réverbération, voice cloning, TTS, export WAV.', credits: 8 },
  { title: 'Infographie Pro', path: '/outils/infographie-pro', desc: 'Créateur d\'infographies : templates thématiques, canvas interactif, éléments graphiques, export HD.', credits: 4 },
  { title: 'Studio Visuel Pro', path: '/outils/studio-visuel-pro', desc: 'Studio visuel complet : affiches, bannières, posts réseaux sociaux, calques, export multi-formats HD.', credits: 4 },
  { title: 'AbSpace GPS', path: '/outils/abspacegps', desc: 'Intelligence territoriale : boutiques, restaurants, santé, transports, opportunités business. Sénégal & monde.', credits: 8 },
  { title: 'MaxAvis Elite', path: '/outils/maxavis', desc: 'Sondages, pétitions et études en ligne. Rapports détaillés, analytics temps réel.', credits: 5 },
  { title: 'Tontine SN Max', path: '/outils/tontine', desc: 'Gestion professionnelle des tontines — membres, tours, paiements, alertes automatiques.', credits: 8 },
  { title: 'AbSchool', path: '/outils/abschool', desc: 'Gestion scolaire complète : élèves, notes, présences, bulletins, tableau de bord temps réel.', credits: 10 },
  { title: 'Dissecteur Élite', path: '/abawi360/dissecteur-elite', desc: 'Analyse stratégique de documents PDF/DOCX/URL : résumé, flashcards, quiz, rapport, tendances, slides.', credits: 5 },
]

const CREDIT_TABLE = [
  { outil: 'CV Pro', key: 'cv', cost: 2 },
  { outil: 'Lettre de motivation', key: 'lettre', cost: 2 },
  { outil: 'Business Plan Élite', key: 'business_plan', cost: 8 },
  { outil: 'Pitch Deck', key: 'pitch', cost: 6 },
  { outil: 'Analyse CV IA', key: 'analyse_cv', cost: 3 },
  { outil: 'Finance Élite', key: 'finance_elite', cost: 15 },
  { outil: 'Juridique Élite', key: 'juridique_elite', cost: 12 },
  { outil: 'Comptable Élite', key: 'comptable_elite', cost: 12 },
  { outil: 'RH Élite', key: 'rh_elite', cost: 8 },
  { outil: 'Immobilier Élite', key: 'immobilier_elite', cost: 8 },
  { outil: 'Consultant Élite', key: 'consultant_elite', cost: 8 },
  { outil: 'Tontine SN Max', key: 'tontine', cost: 8 },
  { outil: 'SenTicket (créer)', key: 'senticket_create', cost: 5 },
  { outil: 'SenTicket (export)', key: 'senticket_export', cost: 2 },
  { outil: 'Studio Photo ID', key: 'studio_photo', cost: 3 },
  { outil: 'Image Pro', key: 'image_pro', cost: 3 },
  { outil: 'Infographie Pro', key: 'infographie', cost: 4 },
  { outil: 'Audio Studio Élite', key: 'audio_studio', cost: 8 },
  { outil: 'AbSpace GPS', key: 'abspacegps', cost: 8 },
  { outil: 'Smart Office Pro', key: 'smart_office', cost: 5 },
  { outil: 'MaxAvis Elite', key: 'maxavis', cost: 5 },
  { outil: 'Exégètika', key: 'exegetika', cost: 5 },
  { outil: 'Guides premium', key: 'guide', cost: 5 },
  { outil: 'Fascicules scolaires', key: 'fascicule', cost: 2 },
  { outil: 'Podcasts premium', key: 'podcast', cost: 2 },
  { outil: 'Articles actualités', key: 'news_premium', cost: 1 },
]

const FAQ = [
  {
    q: 'Qu\'est-ce que le système de crédits ?',
    a: 'Les crédits sont la monnaie interne d\'ABAWI Portal. Chaque plan inclut des crédits mensuels. Ils se rechargent automatiquement chaque mois. Quand vous utilisez un outil payant (ex. CV Pro = 2 crédits), le montant est débité de votre solde. Les outils marqués "Gratuit" ne consomment aucun crédit.',
  },
  {
    q: 'Mes crédits sont-ils limités dans le temps ?',
    a: 'Les crédits inclus dans votre abonnement sont remis à zéro chaque mois (ils ne s\'accumulent pas). Les crédits achetés en pack, eux, ne expirent pas tant que votre compte est actif.',
  },
  {
    q: 'Que se passe-t-il quand mes crédits sont épuisés ?',
    a: 'Vous ne pouvez plus accéder aux outils payants jusqu\'à la prochaine remise à zéro mensuelle. Vous pouvez acheter un pack de crédits supplémentaires à tout moment, ou passer à un plan supérieur.',
  },
  {
    q: 'Les outils publics sont-ils vraiment gratuits ?',
    a: 'Oui. SenTicket, Recrute-Moi SN, Place Ouvrier, Espace Ouvrier, QR Code Pro, Pro Card Élite, Facture, Format Converter, Dictionnaire, Translator, ABAWI IA (mode basique) et AbZone sont totalement gratuits sans consommation de crédits.',
  },
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis la page Plans. Les modifications prennent effet immédiatement.',
  },
  {
    q: 'Quelle est la différence entre le plan 360 et le plan Elite ?',
    a: 'Le plan 360 est centré sur les outils de gestion d\'entreprise (CRM, Planification, Statistiques, Marketing). Le plan Elite inclut 1000 crédits/mois et un accès prioritaire à tous les outils IA avancés. Les deux plans incluent l\'accès complet aux outils Élite.',
  },
  {
    q: 'Y a-t-il un engagement minimum ?',
    a: 'Non. Tous les plans sont sans engagement, résiliables à tout moment. Le plan VIP est le seul à facturer mensuellement par facture dédiée.',
  },
  {
    q: 'Comment payer ?',
    a: 'ABAWI accepte Orange Money, Wave, Free Money, Carte bancaire (Visa/Mastercard) et Mobile Banking via la plateforme PayDunya.',
  },
  {
    q: 'Les données saisies dans les outils sont-elles stockées ?',
    a: 'Les outils comme SenTicket, Recrute-Moi SN, Place Ouvrier et Espace Ouvrier stockent les données dans Supabase (base de données sécurisée). D\'autres outils (PlaceOuvrier, EspaceOuvrier) utilisent le stockage local de votre navigateur. Aucune donnée personnelle n\'est revendue.',
  },
  {
    q: 'Comment contacter le support ?',
    a: 'Support par WhatsApp au +221 77 518 50 50 (plans Pro, Elite, 360, VIP). Email : contact@abawi.sn pour tous les plans.',
  },
]

function formatPrix(p) {
  if (p === 0) return 'Gratuit'
  return `${p.toLocaleString('fr-FR')} F CFA / mois`
}

export default function Documentation() {
  const [section, setSection] = useState('presentation')

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'Outfit, sans-serif' }}>
      <SEO
        title="Documentation & Aide — ABAWI"
        description="Documentation complète ABAWI : guides d'utilisation, tarifs, crédits, FAQ. Tout comprendre sur les outils et services ABAWI."
        keywords="documentation ABAWI, aide, guide, FAQ, crédits, tarifs, outils, tutoriel"
        image="/abawi-og-banner.jpg"
      />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(180deg, rgba(240,180,41,0.06) 0%, transparent 100%)', borderBottom: '1px solid rgba(240,180,41,0.08)', padding: '56px 24px 36px', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', padding: '4px 18px', borderRadius: 100, background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)', color: '#F0B429', fontSize: '0.72rem', fontWeight: 800, letterSpacing: 2, marginBottom: 16 }}>📚 DOCUMENTATION</span>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12 }}>Centre d'aide ABAWI Portal</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          Tout ce qu'il faut savoir : outils, tarification, crédits, plans et questions fréquentes.
        </p>
      </section>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(24px, 4vw, 60px) 80px' }}>

        {/* Nav sections */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 40, paddingTop: 24, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap',
              color: section === s.id ? '#F0B429' : 'var(--text-secondary)',
              borderBottom: section === s.id ? '2px solid #F0B429' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>{s.label}</button>
          ))}
        </div>

        {/* ── PRÉSENTATION ── */}
        {section === 'presentation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '32px 28px', border: '1px solid var(--border)' }}>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.4rem', marginBottom: 16 }}>Qu'est-ce qu'ABAWI Portal ?</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16 }}>
                <strong style={{ color: 'var(--text-primary)' }}>ABAWI Portal</strong> est la plateforme premium africaine tout-en-un dédiée aux entrepreneurs, PME, étudiants et professionnels d'Afrique de l'Ouest. Elle regroupe des guides business, des outils IA, une académie, des actualités économiques et une suite complète d'outils métiers.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 24 }}>
                {[
                  { icon: '🛠️', titre: '30+ Outils IA', desc: 'CV, Business Plan, Finance, Juridique OHADA, RH, Immobilier et plus' },
                  { icon: '📚', titre: 'Contenu premium', desc: 'Guides, fascicules, podcasts, actualités économiques' },
                  { icon: '🌀', titre: 'ABAWI 360', desc: 'CRM, Planification, Statistiques, Marketing intégrés' },
                  { icon: '🆓', titre: 'Outils gratuits', desc: 'SenTicket, Emploi, Facture, QR Code, Dictionnaire...' },
                ].map(c => (
                  <div key={c.titre} style={{ background: 'rgba(240,180,41,0.04)', border: '1px solid rgba(240,180,41,0.12)', borderRadius: 14, padding: '18px 16px' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{c.icon}</div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{c.titre}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '32px 28px', border: '1px solid var(--border)' }}>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.2rem', marginBottom: 20 }}>Comment démarrer ?</h2>
              {[
                { n: '1', titre: 'Créez un compte gratuit', desc: 'Inscription en 30 secondes. Vous recevez 15 crédits gratuits à l\'activation.' },
                { n: '2', titre: 'Explorez les outils gratuits', desc: 'SenTicket, Emploi, Facture, QR Code, Dictionnaire sont disponibles sans crédit.' },
                { n: '3', titre: 'Utilisez vos crédits', desc: 'Les outils avancés (CV, Business Plan, Finance…) consomment des crédits. Votre solde est visible dans votre profil.' },
                { n: '4', titre: 'Passez à un plan si besoin', desc: 'Choisissez un plan mensuel adapté à vos besoins pour plus de crédits et l\'accès aux contenus premium.' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0B429', color: '#070B0F', fontWeight: 900, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{s.titre}</div>
                    <div style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
              <Link to="/login" style={{ display: 'inline-block', marginTop: 8, padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #F0B429, #e5a820)', color: '#070B0F', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}>
                Créer un compte gratuit →
              </Link>
            </div>
          </div>
        )}

        {/* ── OUTILS ── */}
        {section === 'outils' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Outils gratuits */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '28px 24px', border: '1px solid rgba(24,168,74,0.2)' }}>
              <h2 style={{ color: '#18A84A', fontWeight: 900, fontSize: '1.1rem', marginBottom: 6 }}>🆓 Outils 100% gratuits</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>Aucun crédit requis — accessibles à tous les utilisateurs, même sans abonnement.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {OUTILS_GRATUITS.map(o => (
                  <Link key={o.path} to={o.path} style={{ textDecoration: 'none', display: 'block', background: 'rgba(24,168,74,0.04)', border: '1px solid rgba(24,168,74,0.15)', borderRadius: 12, padding: '14px 16px', transition: 'all 0.2s' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: '0.92rem' }}>{o.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{o.desc}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Outils essentiels */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '28px 24px', border: '1px solid var(--border)' }}>
              <h2 style={{ color: '#3B82F6', fontWeight: 900, fontSize: '1.1rem', marginBottom: 6 }}>⚡ Outils Essentiels</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>Consomment des crédits. Accessibles dès le plan Gratuit (selon solde).</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {TOOLS_ESSENTIELS.filter(t => !t.free).map(t => (
                  <Link key={t.path} to={t.path} style={{ textDecoration: 'none', display: 'block', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{t.title}</span>
                      {t.creditKey && CREDIT_COSTS_DISPLAY[t.creditKey] > 0 && (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(59,130,246,0.12)', color: '#3B82F6', padding: '2px 7px', borderRadius: 6, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {CREDIT_COSTS_DISPLAY[t.creditKey]} crédits
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.desc}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Outils élite */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '28px 24px', border: '1px solid rgba(139,92,246,0.2)' }}>
              <h2 style={{ color: '#8B5CF6', fontWeight: 900, fontSize: '1.1rem', marginBottom: 6 }}>💎 Outils Élite</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>Outils avancés — requièrent un plan Pro, Élite, 360 ou VIP.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {TOOLS_ELITE.map(t => (
                  <Link key={t.path} to={t.path} style={{ textDecoration: 'none', display: 'block', background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{t.title}</span>
                      {t.creditKey && CREDIT_COSTS_DISPLAY[t.creditKey] > 0 && (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', padding: '2px 7px', borderRadius: 6, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {CREDIT_COSTS_DISPLAY[t.creditKey]} crédits
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.desc}</div>
                    {t.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                        {t.tags.slice(0, 3).map(tag => (
                          <span key={tag} style={{ fontSize: '0.66rem', background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PLANS & TARIFS ── */}
        {section === 'plans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {PLANS.map(plan => (
                <div key={plan.id} style={{
                  background: 'var(--bg-card)', borderRadius: 18, padding: '24px 20px',
                  border: `2px solid ${plan.popular ? plan.couleur : plan.couleur + '30'}`,
                  boxShadow: plan.popular ? `0 8px 28px ${plan.couleur}18` : 'none',
                  position: 'relative',
                }}>
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', padding: '3px 14px', borderRadius: 100, background: plan.couleur, color: '#fff', fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{plan.badge}</div>
                  )}
                  <h3 style={{ color: plan.couleur, fontWeight: 900, fontSize: '1.2rem', marginBottom: 4 }}>{plan.nom}</h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {plan.prix === 0 ? 'Gratuit' : `${plan.prix.toLocaleString('fr-FR')} F`}
                  </div>
                  {plan.prix > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>/mois · sans engagement</div>}
                  <div style={{ fontSize: '0.78rem', color: plan.couleur, fontWeight: 800, marginBottom: 14 }}>
                    {plan.credits >= 9999 ? '∞ crédits illimités' : `${plan.credits} crédits / mois`}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {plan.features.map(f => (
                      <li key={f.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.8rem', color: f.ok ? 'var(--text-secondary)' : 'var(--text-muted)', opacity: f.ok ? 1 : 0.45 }}>
                        <span style={{ color: f.ok ? '#18A84A' : 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>{f.ok ? '✓' : '✗'}</span>
                        {f.label}
                      </li>
                    ))}
                  </ul>
                  <Link to="/plans" style={{
                    display: 'block', textAlign: 'center', padding: '10px', borderRadius: 10, textDecoration: 'none',
                    background: plan.popular ? plan.couleur : 'transparent',
                    border: `1px solid ${plan.couleur}`,
                    color: plan.popular ? '#fff' : plan.couleur,
                    fontWeight: 700, fontSize: '0.82rem',
                  }}>
                    {plan.prix === 0 ? 'Commencer gratuitement' : 'Choisir ce plan'}
                  </Link>
                </div>
              ))}
            </div>

            {/* Packs crédits */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '28px 24px', border: '1px solid var(--border)' }}>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.1rem', marginBottom: 8 }}>💳 Packs de crédits supplémentaires</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>Achetez des crédits à la carte, sans abonnement. Ne périment pas.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {[
                  { nom: 'Pack Mini', credits: 50, prix: 2500 },
                  { nom: 'Pack Standard', credits: 100, prix: 4500, bonus: 10 },
                  { nom: 'Pack Plus', credits: 200, prix: 8000, bonus: 25, popular: true },
                  { nom: 'Pack Business', credits: 500, prix: 17500, bonus: 75 },
                  { nom: 'Pack Max', credits: 1000, prix: 30000, bonus: 200 },
                ].map(p => (
                  <div key={p.nom} style={{ background: p.popular ? 'rgba(240,180,41,0.06)' : 'var(--bg-primary)', border: `1px solid ${p.popular ? 'rgba(240,180,41,0.3)' : 'var(--border)'}`, borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, fontSize: '0.9rem' }}>{p.nom}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#F0B429' }}>{p.credits + (p.bonus || 0)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>crédits{p.bonus ? ` (+${p.bonus} bonus)` : ''}</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{p.prix.toLocaleString('fr-FR')} F</div>
                  </div>
                ))}
              </div>
              <Link to="/plans" style={{ display: 'inline-block', marginTop: 20, padding: '10px 24px', borderRadius: 10, background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.25)', color: '#F0B429', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
                Acheter des crédits →
              </Link>
            </div>

            {/* Modes de paiement */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '24px', border: '1px solid var(--border)' }}>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.1rem', marginBottom: 16 }}>💰 Modes de paiement acceptés</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Orange Money', 'Wave', 'Free Money', 'Carte Visa/Mastercard', 'Mobile Banking'].map(m => (
                  <span key={m} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429', fontWeight: 600, fontSize: '0.82rem' }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CRÉDITS ── */}
        {section === 'credits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '28px 24px', border: '1px solid var(--border)' }}>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.2rem', marginBottom: 12 }}>Comment fonctionnent les crédits ?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: '🎁', t: 'Crédits gratuits', d: 'Tout nouveau compte reçoit 15 crédits gratuits à l\'activation.' },
                  { icon: '📅', t: 'Remise mensuelle', d: 'Les crédits inclus dans votre plan sont renouvelés chaque mois. Ils ne s\'accumulent pas d\'un mois à l\'autre.' },
                  { icon: '💳', t: 'Packs sans expiration', d: 'Les crédits achetés en pack (hors abonnement) ne périment pas tant que votre compte est actif.' },
                  { icon: '⚡', t: 'Débit automatique', d: 'Quand vous utilisez un outil payant, les crédits sont déduits automatiquement. Aucune action de votre part.' },
                  { icon: '♾️', t: 'Plans all-inclusive', d: 'Les plans Pro, Élite, 360 et VIP donnent accès à tous les outils sans décompter de crédits pour la majorité des fonctions.' },
                ].map(i => (
                  <div key={i.t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', background: 'var(--bg-primary)', borderRadius: 12 }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{i.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{i.t}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{i.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table des coûts */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '28px 24px', border: '1px solid var(--border)' }}>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.1rem', marginBottom: 20 }}>Coût en crédits par outil</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Outil</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Crédits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CREDIT_TABLE.map((row, i) => (
                      <tr key={row.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{row.outil}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 6, background: 'rgba(240,180,41,0.1)', color: '#F0B429', fontWeight: 700 }}>
                            {row.cost === 0 ? 'Gratuit' : `${row.cost} cr.`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                * Les plans Pro, Élite, 360 et VIP bénéficient d'un accès all-inclusive qui réduit ou annule la consommation de crédits pour la plupart des outils.
              </p>
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        {section === 'faq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} />
            ))}
            <div style={{ marginTop: 16, padding: '24px', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>💬</div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                Vous n'avez pas trouvé votre réponse ?<br />Contactez notre support directement.
              </p>
              <a href="https://wa.me/221775185050" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 10, background: '#25D366', color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}>
                WhatsApp Support →
              </a>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: `1px solid ${open ? 'rgba(240,180,41,0.3)' : 'var(--border)'}`, overflow: 'hidden', transition: 'border 0.2s' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.4 }}>{question}</span>
        <span style={{ color: '#F0B429', fontSize: '1.1rem', flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 18px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
          {answer}
        </div>
      )}
    </div>
  )
}
