import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { speak as speakTTS, stopSpeaking } from '../../lib/ttsEngine'
import IAResponseDisplay from '../../components/IAResponseDisplay'
import ToolInfoPanel from '../../components/ToolInfoPanel';
import QuizMode from '../../components/abawi-ia/QuizMode';
import RechercheMode from '../../components/abawi-ia/RechercheMode';
import DefiMode from '../../components/abawi-ia/DefiMode';
import DebatMode from '../../components/abawi-ia/DebatMode';
import ApprentissageMode from '../../components/abawi-ia/ApprentissageMode';
import SimulationMode from '../../components/abawi-ia/SimulationMode';
import AnnahMode from '../../components/abawi-ia/AnnahMode';

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
  const location = useLocation();
  const [activeMode, setActiveMode] = useState(() => {
    if (location.hash === '#annah') return 'annah';
    return 'recherche';
  });
  const [resetKey, setResetKey] = useState(0);

  function handleReset() {
    IA_STORAGE_KEYS.forEach(k => { try { localStorage.removeItem(k) } catch {} })
    setResetKey(k => k + 1)
  }

  const ModeComp = MODE_COMPONENTS[activeMode] || RechercheMode;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 80 }}>
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
        <p style={{ color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.55 }}>
          Quiz, recherche experte, débats, apprentissage guidé, simulation professionnelle et Annah — tout en un.
        </p>
      </div>

      {/* MODES */}
      <div style={{ maxWidth: 'min(1440px, 96vw)', margin: '0 auto', padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2.5vw, 40px) 0' }}>
        <ToolInfoPanel
          toolName="ABAWI IA"
          icon="🤖"
          description="Assistant IA expert multi-modes : quiz, recherche, défi, débat, apprentissage, simulation, vocal"
          benefits={[
            'Apprenez, testez et débattez dans n\'importe quel domaine avec un niveau expert élite',
            'Mode Annah : réponses stratégiques + lecture audio instantanée',
            'Adapté au contexte africain (droit OHADA, économie, culture, langues locales)',
            'Simulez entretiens, négociations, présentations pour vous entraîner',
            'Parcours d\'apprentissage guidé avec progression personnalisée',
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
          </div>
        </div>

        {/* Rendu du mode actif — key=resetKey force le remontage complet */}
        <ModeComp key={resetKey} />
      </div>
    </main>
  );
}

