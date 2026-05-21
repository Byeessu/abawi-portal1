import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import SEO from '../../components/SEO'
import ToolInfoPanel from '../../components/ToolInfoPanel';
import QuizMode from '../../components/abawi-ia/QuizMode';
import RechercheMode from '../../components/abawi-ia/RechercheMode';
import DefiMode from '../../components/abawi-ia/DefiMode';
import DebatMode from '../../components/abawi-ia/DebatMode';
import ApprentissageMode from '../../components/abawi-ia/ApprentissageMode';
import SimulationMode from '../../components/abawi-ia/SimulationMode';
import AnnahMode from '../../components/abawi-ia/AnnahMode';
import { LANGUAGES } from '../../lib/abawi-persona';
import { useAuth } from '../../context/AuthContext'
import { useToolGuard } from '../../hooks/useToolGuard'
import ToolUpsellModal, { ToolGuardBadge } from '../../components/ToolUpsellModal'

const MODES = [
  { id: 'quiz', icon: '🧠', label: 'Quiz Intelligent', desc: "Testez vos connaissances dans n'importe quel domaine", color: 'var(--purple)', gradient: 'linear-gradient(135deg, var(--purple), var(--accent))' },
  { id: 'recherche', icon: '🔍', label: 'Recherche IA', desc: "Posez n'importe quelle question, obtenez une réponse experte", color: 'var(--accent2)', gradient: 'linear-gradient(135deg, var(--accent2), var(--accent3))' },
  { id: 'defi', icon: '🎯', label: 'Défi de Connaissances', desc: 'Challenge progressif avec niveaux et score', color: 'var(--gold)', gradient: 'linear-gradient(135deg, var(--gold), var(--gold-hover))' },
  { id: 'debat', icon: '⚖️', label: 'Débat IA', desc: "Débattez avec l'IA sur n'importe quel sujet", color: 'var(--red)', gradient: 'linear-gradient(135deg, var(--red), var(--orange))' },
  { id: 'apprentissage', icon: '📚', label: 'Apprentissage Guidé', desc: "L'IA crée un parcours d'apprentissage sur mesure", color: 'var(--green)', gradient: 'linear-gradient(135deg, var(--green), var(--success-text))' },
  { id: 'simulation', icon: '💼', label: 'Simulation Professionnelle', desc: 'Simulez des entretiens, négociations, présentations', color: 'var(--cyan)', gradient: 'linear-gradient(135deg, var(--cyan), var(--accent2))' },
  { id: 'annah', icon: '✦', label: 'Annah — Assistant Vocal', desc: 'Coach vocal premium avec réponse stratégique et lecture audio instantanée', color: 'var(--gold-hover)', gradient: 'linear-gradient(135deg, var(--gold-hover), var(--gold))' },
];

const MODE_COMPONENTS = {
  quiz: QuizMode,
  recherche: RechercheMode,
  defi: DefiMode,
  debat: DebatMode,
  apprentissage: ApprentissageMode,
  simulation: SimulationMode,
  annah: AnnahMode,
};

const IA_STORAGE_KEYS = ['abawi_recherche_history', 'abawi_annah_messages']

export default function AbawiIA() {
  const { membre } = useAuth()
  const guard = useToolGuard('abawi_ia', 'abawi_ia')

  const location = useLocation();
  const [activeMode, setActiveMode] = useState(() => {
    if (location.hash === '#annah') return 'annah';
    return 'recherche';
  });
  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('abawi_ia_lang') || 'fr' } catch { return 'fr' }
  });

  function handleReset() {
    IA_STORAGE_KEYS.forEach(k => { try { localStorage.removeItem(k) } catch { /* ignore */ } })
    setResetKey(k => k + 1)
  }

  function handleLangChange(code) {
    setLanguage(code)
    try { localStorage.setItem('abawi_ia_lang', code) } catch { /* ignore */ }
    setResetKey(k => k + 1)
  }

  const ModeComp = MODE_COMPONENTS[activeMode] || RechercheMode;

  return (
    <>
      <SEO
        title="ABAWI IA — Coach expert senior multilingue"
        description="Coach IA expert senior : 7 modes (quiz, recherche, simulation, débat, apprentissage, assistant vocal). FR · EN · Wolof. Réponses stratégiques de niveau McKinsey."
        keywords="IA Sénégal, coach IA, assistant IA, quiz IA, simulation business, débat IA, Wolof IA"
        image="/og-tools/abawi-ia.jpg"
      />
      <main style={{
        minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 80,
        ...(isFullscreen ? { position: 'fixed', inset: 0, zIndex: 9999, paddingBottom: 0, overflowY: 'auto' } : {})
    }}>
      <style>{`
        @keyframes abia-spin { to { transform: rotate(360deg); } }
        @keyframes abia-pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
        .ia-reset-btn:hover { background: rgba(239,68,68,0.1) !important; border-color: #EF4444 !important; color: #EF4444 !important; }
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 75%, #8B5CF6 25%) 100%)', borderBottom: '1px solid var(--border)', padding: 'clamp(32px, 5vw, 56px) 24px 40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 100, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6', display: 'inline-block' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#8B5CF6', letterSpacing: 2, textTransform: 'uppercase' }}>ABAWI IA · Expert Élite</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.1 }}>
          ABAWI <span style={{ color: '#8B5CF6' }}>Intelligence</span> Artificielle
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 14px', fontSize: '0.95rem', lineHeight: 1.55 }}>
          Quiz, recherche experte, débats, apprentissage guidé, simulation professionnelle et Annah — tout en un.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['🇫🇷', 'Français'], ['🇬🇧', 'English'], ['🇸🇳', 'Wolof']].map(([flag, lang]) => (
            <span key={lang} style={{ padding: '4px 14px', borderRadius: 100, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', fontSize: '0.78rem', fontWeight: 700, color: '#8B5CF6' }}>
              {flag} {lang}
            </span>
          ))}
        </div>
      </div>

      {/* MODES */}
      <div style={{ maxWidth: 'min(1440px, 96vw)', margin: '0 auto', padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2.5vw, 40px) 0' }}>
        <ToolInfoPanel
          toolName="ABAWI IA"
          icon="🤖"
          description="Coach IA expert senior multilingue — Français, English, Wolof. 7 modes : quiz, recherche, défi, débat, apprentissage, simulation, vocal."
          benefits={[
            '🇫🇷 Français · 🇬🇧 English · 🇸🇳 Wolof — changez de langue en un clic, la préférence est mémorisée',
            'Expertise senior universelle : OHADA, finance, droit, marketing, technologie, santé, culture africaine',
            'Mode Annah : coach vocal premium avec réponses stratégiques + lecture audio instantanée',
            'Simulez entretiens d\'embauche, négociations et présentations — l\'IA joue le rôle face à vous',
            'Parcours d\'apprentissage guidé adapté à votre niveau avec progression personnalisée',
          ]}
          howToUse={[
            'Choisissez un mode parmi les 7 disponibles en haut de page',
            '**Recherche** : posez n\'importe quelle question experte',
            '**Quiz** : sélectionnez un domaine, répondez aux questions',
            '**Débat** : confrontez vos idées à l\'IA sur un sujet',
            '**Simulation** : entretien d\'embauche, pitch, négociation — l\'IA joue le rôle',
          ]}
          tips={[
            'Le mode **Annah** (vocal) est idéal pour apprendre en mobilité',
            'Uploadez des fichiers dans n\'importe quel mode pour contextualiser les réponses',
            'Les réponses sont optimisées pour l\'Afrique de l\'Ouest mais utilisables globalement',
            'Pour le défi : commencez facile et montez en difficulté — l\'IA s\'adapte',
          ]}
        />
        <div style={{ marginTop: 8 }}>
          <ToolGuardBadge guard={guard} />
        </div>
        {/* Barre de modes — scroll horizontal sur mobile, wrapping sur desktop */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          marginBottom: 36, marginTop: 24,
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          paddingBottom: 4,
        }}>
          <style>{`.ia-tabs-scroll::-webkit-scrollbar{display:none}`}</style>
          <div className="ia-tabs-scroll" style={{
            display: 'flex', gap: 8, alignItems: 'center',
            flexWrap: 'wrap', justifyContent: 'center', width: '100%',
          }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => setActiveMode(m.id)} style={{
                padding: 'clamp(7px,1.5vw,10px) clamp(10px,2vw,18px)', borderRadius: 100,
                border: `2px solid ${activeMode === m.id ? m.color : 'var(--border)'}`,
                background: activeMode === m.id ? `${m.color}18` : 'transparent',
                color: activeMode === m.id ? m.color : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: activeMode === m.id ? 700 : 400,
                fontSize: 'clamp(0.7rem,1.8vw,0.82rem)',
                transition: 'all 0.2s', fontFamily: 'Outfit,sans-serif',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                <span aria-hidden>{m.icon}</span>{' '}
                <span style={{ display: 'inline' }}>{m.label}</span>
              </button>
            ))}
            {/* ── Language selector ── */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 8px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
              {Object.values(LANGUAGES).map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code)}
                  title={lang.label}
                  style={{
                    padding: '4px 9px', borderRadius: 100, border: 'none',
                    background: language === lang.code ? 'var(--accent, #8B5CF6)' : 'transparent',
                    color: language === lang.code ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem',
                    transition: 'all 0.18s', fontFamily: 'Outfit,sans-serif',
                    letterSpacing: '0.4px',
                  }}
                >
                  {lang.flag} {lang.short}
                </button>
              ))}
            </div>

            <button
              className="ia-reset-btn"
              onClick={handleReset}
              title="Réinitialiser la conversation"
              style={{
                padding: 'clamp(6px,1.2vw,8px) clamp(10px,1.8vw,16px)',
                borderRadius: 100, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: 'clamp(0.68rem,1.5vw,0.76rem)',
                fontWeight: 600, fontFamily: 'Outfit,sans-serif',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              ↺ Réinitialiser
            </button>

            {!isFullscreen ? (
              <button
                onClick={() => setIsFullscreen(true)}
                title="Plein écran"
                style={{
                  padding: 'clamp(6px,1.2vw,8px) clamp(10px,1.8vw,16px)',
                  borderRadius: 100, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 'clamp(0.68rem,1.5vw,0.76rem)',
                  fontWeight: 600, fontFamily: 'Outfit,sans-serif',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                ⛶ Plein écran
              </button>
            ) : (
              <button
                onClick={() => setIsFullscreen(false)}
                title="Revenir aux outils"
                style={{
                  padding: 'clamp(6px,1.2vw,8px) clamp(10px,1.8vw,16px)',
                  borderRadius: 100, border: '1px solid #EF4444',
                  background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                  cursor: 'pointer', fontSize: 'clamp(0.68rem,1.5vw,0.76rem)',
                  fontWeight: 600, fontFamily: 'Outfit,sans-serif',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                ← Revenir aux outils
              </button>
            )}
          </div>
        </div>

        {/* Rendu du mode actif — key=resetKey force le remontage complet */}
        <ModeComp key={resetKey} language={language} />
      </div>

      <ToolUpsellModal
        isOpen={guard.upsellOpen}
        config={guard.upsellConfig}
        onClose={guard.closeUpsell}
        onUseCredit={async () => {
          const r = await guard.checkAndDebit()
          if (r.ok) guard.closeUpsell()
        }}
      />
    </main>
    </>
  );
}

