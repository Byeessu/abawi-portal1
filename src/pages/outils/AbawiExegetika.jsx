import { useState } from 'react'
import { exportToPDF } from '../../lib/generatePDF'
import { cleanIATextLight } from '../../lib/cleanText'

import { callGroq as groqCall } from '../../lib/groqClient'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import FileContextUpload from '../../components/FileContextUpload'
import RichDoc from '../../components/RichDoc'

const EXEGETIKA_SYSTEM = `Tu es ABAWI Exegètika Elite, moteur d'analyse exégétique et d'intelligence stratégique de niveau cabinet international.

MISSION:
Analyser avec précision chirurgicale tout sujet, concept, document ou problématique. Fournir une intelligence actionnable, structurée et multiniveaux pour décideurs exigeants.

PRINCIPES DIRECTEURS ELITE:
1. ALLER DROIT AU BUT - Pas de remplissage, pas de sections vides. Si un angle d'analyse (étymologique, historique, technologique, etc.) n'apporte pas de valeur concrète, ne le mentionne pas.

2. RÉPONSE ADAPTATIVE INTELLIGENTE:
   - Pour un MOT/TERME : privilégier étymologie, évolution sémantique, usages actuels, connotations business
   - Pour un CONCEPT/IDÉE : privilégier définition opérationnelle, applications concrètes, bénéfices/menaces
   - Pour un DOCUMENT : privilégier synthèse exécutive, points critiques, recommandations stratégiques
   - Pour une PROBLÉMATIQUE : privilégier diagnostic, options de solution, risques/opportunités

3. STRUCTURE DYNAMIQUE ELITE:
   - ## Analyse Executive (synthèse 3-5 lignes maximum)
   - ## Intelligence Core (contenu pertinent adapté au sujet - sections variables selon pertinence)
   - ## Niveaux de Lecture (uniquement si demandé niveau intermédiaire+)
     - ### Niveau Essentiel (pour exécutif pressé)
     - ### Niveau Expert (pour spécialiste)
     - ### Niveau Stratégique (pour décideur)
   - ## Recommandations Actionnables (si applicable)

4. DISTINCTION RIGOUREUSE:
   - ✅ FAITS (certifiés, vérifiables)
   - ⚠️ HYPOTHÈSES (probabilité élevée mais à confirmer)
   - ❓ INCERTITUDES (points nécessitant investigation)

5. STYLE ELITE:
   - Français professionnel sans jargon inutile
   - Markdown structuré, sections condensées
   - Gras **pour l'essentiel**, listes pour la clarté
   - Chiffres, données, exemples africains/world quand pertinent
   - Ton: confident, expert, direct`

export default function AbawiExegetika() {
  const [query, setQuery] = useState('')
  const [context, setContext] = useState('')
  const [depth, setDepth] = useState('expert')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  async function runAnalysis() {
    if (!query.trim() && !context.trim()) return
    setLoading(true)
    try {
      const prompt = `SUJET À ANALYSER:
${query || '(analyse du document fourni uniquement)'}

NIVEAU DE PROFONDEUR: ${depth.toUpperCase()}

${context ? `CONTEXTE DOCUMENTAIRE FOURNI:\n${context.slice(0, 12000)}\n` : ''}

INSTRUCTIONS SPÉCIFIQUES:
1. Adapte ta structure EXACTEMENT au type de sujet (mot/concept/document/problématique)
2. Si un angle d'analyse n'apporte pas de valeur concrète, ignore-le complètement
3. Privilégie toujours l'actionnable et l'applicable
4. Pour niveau "${depth}": ${depth === 'essentiel' ? 'synthèse ultra-condensée, 2-3 sections max' : depth === 'strategique' ? 'focus risques, opportunités, scénarios et recommandations' : 'analyse complète mais sans remplissage'}

PRODUIS UNE ANALYSE EXEGETIQUE ELITE.`

      const out = await groqCall(prompt, {
        maxTokens: 4000,
        temperature: 0.2,
        system: EXEGETIKA_SYSTEM
      })
      setResult(cleanIATextLight(out || ''))
    } finally {
      setLoading(false)
    }
  }

  const fileSlug = `exegetika-${Date.now()}`

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 32px) 80px' }}>
      <ToolInfoPanel
        toolName="ABAWI Exégètika"
        icon="🧬"
        description="Analyse exégétique multidimensionnelle — origines, contextes, actualités, recommandations"
        benefits={[
          'Décomposez un mot, une phrase, un texte ou un document complet en plusieurs niveaux',
          'Découvrez les origines étymologiques, historiques et culturelles',
          'Obtenez le contexte juridique, économique, géopolitique ou technologique',
          'Visualisez 4 niveaux de lecture : essentiel, intermédiaire, expert, stratégique',
          'Distinguez faits vérifiables, hypothèses et points à confirmer',
        ]}
        howToUse={[
          'Collez le mot/phrase/texte à analyser dans la zone principale',
          'Ou uploadez un document (PDF, Word, texte) via la zone fichier',
          'Choisissez le niveau de profondeur souhaité (essentiel → stratégique)',
          'Cliquez sur « Lancer Exégèse » — l\'IA produit une analyse structurée',
          'Exportez en PDF pour conserver l\'analyse',
        ]}
        tips={[
          'Idéal pour décoder un concept juridique, financier ou géopolitique complexe',
          'Le niveau « stratégique » est le plus utile pour la prise de décision business',
          'Vous pouvez combiner texte + documents pour un contexte enrichi',
          'L\'outil marque toujours ce qui est hypothèse vs fait — utilisez-le comme assistant, pas oracle',
        ]}
      />
      {/* Hero Section Elite */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1a1033 0%, #2d1b69 50%, #1a1033 100%)', 
        border: '1px solid rgba(168,85,247,0.3)', 
        borderRadius: 24, 
        padding: '36px 32px', 
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Elements */}
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: -30,
          left: 30,
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            background: 'rgba(168,85,247,0.2)',
            borderRadius: 16,
            padding: '16px 20px',
            border: '1px solid rgba(168,85,247,0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <span style={{ fontSize: '3rem' }}>🧬</span>
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              background: 'rgba(168,85,247,0.9)',
              borderRadius: 20,
              marginBottom: 10
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Intelligence Stratégique
              </span>
            </div>
            
            <h1 style={{ 
              margin: 0, 
              color: '#fff', 
              fontSize: 'clamp(1.6rem,3vw,2.2rem)',
              fontWeight: 800,
              letterSpacing: '-0.5px'
            }}>ABAWI Exégètika Elite</h1>
            <p style={{ 
              marginTop: 10, 
              color: 'rgba(255,255,255,0.75)', 
              fontSize: '0.95rem',
              lineHeight: 1.6,
              maxWidth: 520
            }}>
              Analyse exégétique multidimensionnelle avec précision chirurgicale. 
              Concepts, documents, problématiques décryptés pour décideurs exigeants.
            </p>
            
            {/* Capabilities */}
            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              {['4 Niveaux', 'Adaptatif', 'Actionnable', 'Sans Remplissage'].map((tag, i) => (
                <span key={i} style={{
                  padding: '5px 12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 600
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          placeholder="Mot, phrase, concept, texte ou problématique à analyser..."
          style={{ width: '100%', padding: 14, borderRadius: 10, background: '#070B0F', border: '1px solid #1A2332', color: '#F0F2F5', resize: 'vertical', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={depth} onChange={(e) => setDepth(e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, background: '#0D1117', color: '#F0F2F5', border: '1px solid #1A2332' }}>
            <option value="essentiel">Essentiel</option>
            <option value="intermediaire">Intermédiaire</option>
            <option value="expert">Expert</option>
            <option value="strategique">Stratégique</option>
          </select>
          <button onClick={runAnalysis} disabled={loading} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#A855F7,#9333EA)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
            {loading ? 'Analyse...' : 'Lancer Exégèse'}
          </button>
          {result && (
            <button onClick={() => exportToPDF('exegetika-output', fileSlug)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(168,85,247,0.4)', background: 'rgba(168,85,247,0.12)', color: '#C084FC', fontWeight: 700, cursor: 'pointer' }}>
              Export PDF
            </button>
          )}
        </div>

        <FileContextUpload
          onExtracted={setContext}
          label="Documents / fichiers (optionnel)"
          hint="Ajoutez des pièces à exégérer : PDF, Word, texte, tableurs..."
        />

        <div id="exegetika-output" style={{ marginTop: 10 }}>
          <RichDoc text={result} editable onEdit={setResult} exportId="exegetika-output" exportSlug={fileSlug} docTitle="ABAWI Exégètika" />
        </div>
      </div>
    </main>
  )
}

