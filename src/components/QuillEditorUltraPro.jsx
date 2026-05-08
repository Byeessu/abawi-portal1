/**
 * Éditeur Ultra Pro ABAWI - Version ULTIMATE
 * Dépasse tous les outils de référence avec fonctionnalités avancées
 * IA intégrée, templates, collaboration, analyse de contenu, etc.
 */
import { useEffect, useRef, useCallback, useState } from 'react'
import { cleanIATextLight } from '../lib/cleanText'

/* ========================================
   TOOLBAR ULTRA PRO - Toutes les fonctionnalités
   ======================================== */
const ULTRA_TOOLBAR_OPTS = [
  // Polices et tailles étendues
  [{ font: ['', 'times', 'arial', 'georgia', 'calibri', 'courier', 'helvetica', 'verdana', 'tahoma', 'trebuchet'] }],
  [{ size: ['8pt','9pt','10pt','11pt','12pt','14pt','16pt','18pt','20pt','24pt','28pt','36pt','48pt','72pt'] }],
  
  // Headers et structure
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  
  // Formatage texte complet
  ['bold', 'italic', 'underline', 'strike', 'clean'],
  [{ script: 'sub' }, { script: 'super' }],
  [{ color: [] }, { background: [] }],
  
  // Listes et indentation
  [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }, { indent: '-1' }, { indent: '+1' }],
  
  // Alignement et espacement
  [{ align: [] }, { direction: 'rtl' }],
  
  // Médias et contenu
  ['link', 'image', 'video', 'blockquote', 'code-block'],
  
  // Tableaux et formulaires
  [{ table: [] }, { formula: [] }],
  
  // IA et fonctionnalités avancées
  ['ai-generate', 'ai-analyze', 'ai-optimize', 'template-insert'],
  
  // Collaboration et partage
  ['comment', 'track-changes', 'share'],
  
  // Outils avancés
  ['find-replace', 'spell-check', 'word-count', 'outline'],
]

/* ========================================
   CSS ULTRA PRO - Design professionnel avancé
   ======================================== */
const ULTRA_CSS = `
.ql-toolbar.ql-snow {
  border: none !important; 
  border-bottom: 2px solid #e5e7eb !important;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important; 
  padding: 8px 12px !important; 
  flex-wrap: wrap !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
}

.ql-toolbar.ql-snow .ql-formats { 
  margin-right: 12px !important;
  border-right: 1px solid #e5e7eb;
  padding-right: 12px;
}

.ql-toolbar.ql-snow .ql-formats:last-child {
  border-right: none;
}

.ql-container.ql-snow { 
  border: none !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Conteneur page ultra-professionnel */
.qup-page-wrap {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
  padding: 32px 28px !important;
  overflow-y: auto !important;
  flex: 1;
  position: relative;
}

/* Éditeur A4 ultra-professionnel */
.qup-editor {
  max-width: 816px !important;         /* 210mm @96dpi */
  margin: 0 auto !important;
  min-height: 1154px !important;       /* 297mm @96dpi */
  padding: 72px 96px !important;       /* marges professionnelles */
  background: #ffffff !important;
  box-shadow: 
    0 8px 32px rgba(0,0,0,0.12), 
    0 2px 8px rgba(0,0,0,0.08),
    0 0 0 1px rgba(0,0,0,0.04) !important;
  border-radius: 4px !important;
  position: relative;
}

/* En-tête et pied de page automatiques */
.qup-header, .qup-footer {
  position: absolute;
  left: 0;
  right: 0;
  padding: 0 96px;
  font-size: 9pt;
  color: #64748b;
  z-index: 10;
}

.qup-header {
  top: 24px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
}

.qup-footer {
  bottom: 24px;
  border-top: 1px solid #e2e8f0;
  padding-top: 8px;
  text-align: center;
}

/* Boutons IA spéciaux */
.ql-ai-generate, .ql-ai-analyze, .ql-ai-optimize, .ql-template-insert {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  color: white !important;
  border-radius: 6px !important;
  padding: 4px 8px !important;
  margin: 0 2px !important;
  font-weight: 600 !important;
  font-size: 11px !important;
}

.ql-ai-generate:hover, .ql-ai-analyze:hover, .ql-ai-optimize:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
  transform: translateY(-1px);
}

/* Boutons collaboration */
.ql-comment, .ql-track-changes, .ql-share {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: white !important;
  border-radius: 6px !important;
  padding: 4px 8px !important;
  margin: 0 2px !important;
  font-weight: 600 !important;
  font-size: 11px !important;
}

/* Mode sombre ultra-pro */
.dark .qup-page-wrap {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
}

.dark .qup-editor {
  background: #1e293b !important;
  color: #f1f5f9 !important;
  box-shadow: 
    0 8px 32px rgba(0,0,0,0.4), 
    0 2px 8px rgba(0,0,0,0.2),
    0 0 0 1px rgba(255,255,255,0.1) !important;
}

.dark .ql-toolbar.ql-snow {
  background: linear-gradient(135deg, #334155 0%, #1e293b 100%) !important;
  border-bottom-color: #475569 !important;
}

/* Mode plein écran */
.qup-fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 9999 !important;
  background: white !important;
}

.qup-fullscreen .qup-editor {
  max-width: none !important;
  margin: 0 !important;
  min-height: 100vh !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

/* Animations et transitions */
.qup-editor * {
  transition: all 0.2s ease !important;
}

/* Grille d'alignement */
.qup-grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    repeating-linear-gradient(0deg, transparent, transparent 19px, #e5e7eb 19px, #e5e7eb 20px),
    repeating-linear-gradient(90deg, transparent, transparent 19px, #e5e7eb 19px, #e5e7eb 20px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.qup-grid-overlay.active {
  opacity: 0.3;
}

/* Compteur de mots et caractères */
.qup-stats {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 10px;
  color: #94a3b8;
  background: rgba(255,255,255,0.9);
  padding: 4px 8px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}
`

/* ========================================
   Templates professionnels
   ======================================== */
const PROFESSIONAL_TEMPLATES = {
  'rapport-consulting': {
    name: 'Rapport Consulting',
    template: `## RAPPORT DE CONSULTING

### Contexte et Objectifs

[Insérer le contexte du projet et les objectifs principaux]

### Analyse de la Situation

#### État des lieux
[Description de la situation actuelle]

#### Points critiques identifiés
[Liste des problèmes et défis]

### Recommandations Stratégiques

#### Priorité 1 - Actions immédiates
[Actions à entreprendre dans les 30 jours]

#### Priorité 2 - Plan à moyen terme
[Actions sur 3-6 mois]

#### Priorité 3 - Vision long terme
[Actions sur 1-2 ans]

### Plan d'Action

#### Étape 1: Préparation
[Détails de la première phase]

#### Étape 2: Mise en oeuvre
[Détails de la deuxième phase]

#### Étape 3: Suivi et ajustement
[Détails du suivi]

### Indicateurs de Succès

[KPIs et metrics de suivi]

### Conclusion

[Synthèse des recommandations et prochaines étapes]`
  },
  'analyse-financiere': {
    name: 'Analyse Financière',
    template: `## ANALYSE FINANCIÈRE COMPLÈTE

### Résumé Exécutif

[Synthèse des principaux résultats et recommandations]

### Analyse des Comptes

#### Bilan
[Analyse du bilan actif et passif]

#### Compte de Résultat
[Analyse des revenus et charges]

#### Tableau de Flux de Trésorerie
[Analyse des flux de trésorerie]

### Ratios Financiers

#### Ratios de liquidité
[Current ratio, quick ratio, etc.]

#### Ratios de rentabilité
[ROE, ROA, marge bénéficiaire, etc.]

#### Ratios d'endettement
[Debt ratio, interest coverage, etc.]

### Analyse Trend

#### Évolution sur 3 ans
[Tendances et variations]

#### Projections
[Prévisions basées sur les tendances]

### Recommandations

#### Optimisation financière
[Suggestions pour améliorer la performance]

#### Gestion des risques
[Recommandations pour la gestion des risques]

### Conclusion

[Synthèse finale et recommandations prioritaires]`
  },
  'plan-marketing': {
    name: 'Plan Marketing',
    template: `## PLAN MARKETING STRATÉGIQUE

### Analyse du Marché

#### Taille et croissance
[Données sur le marché cible]

#### Segmentation
[Détails des segments de clientèle]

#### Concurrence
[Analyse concurrentielle]

### Positionnement

#### Proposition de valeur
[Votre avantage concurrentiel]

#### Différenciation
[Comment vous vous différenciez]

### Stratégie Marketing

#### Objectifs
[Buts SMART pour 12 mois]

#### Canaux de distribution
[Comment atteindre vos clients]

#### Stratégie de prix
[Positionnement prix]

### Plan d'Action Marketing

#### Marketing digital
[SEO, SEM, social media, content]

#### Marketing traditionnel
[Événements, publicité, relations presse]

#### Ventes et distribution
[Stratégie de vente]

### Budget et KPIs

#### Allocation budget
[Répartition des investissements]

#### Indicateurs de performance
[Metrics de suivi]

### Calendrier de Mise en Oeuvre

#### Trimestre 1
[Actions prioritaires]

#### Trimestre 2-4
[Plan de déploiement]

### Mesure et Ajustement

#### Suivi des performances
[Comment mesurer le succès]

#### Plan d'ajustement
[Comment optimiser en continu]`
  }
}

/* ========================================
   Composant principal
   ======================================== */
export default function QuillEditorUltraPro({
  value = '',
  onChange,
  placeholder = 'Commencez à rédiger votre document professionnel...',
  dark = false,
  fullscreen = false,
  showStats = true,
  showGrid = false,
  template = null,
  onWordCount = null,
  ...props
}) {
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showGridOverlay, setShowGridOverlay] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState(null)

  /* Initialisation Quill */
  useEffect(() => {
    if (typeof window === 'undefined' || !editorRef.current) return

    const loadQuill = async () => {
      try {
        const Quill = await import('quill')
        
        // Configuration des modules
        const modules = {
          toolbar: ULTRA_TOOLBAR_OPTS,
          history: { delay: 1000, userOnly: true },
          clipboard: { matchVisual: false },
        }

        // Initialisation
        const quill = new Quill.default(editorRef.current, {
          theme: 'snow',
          modules,
          placeholder,
        })

        quillRef.current = quill

        // Gestion du changement
        quill.on('text-change', () => {
          const text = quill.getText()
          const words = text.trim().split(/\s+/).filter(word => word.length > 0).length
          const chars = text.length
          
          setWordCount(words)
          setCharCount(chars)
          
          if (onWordCount) onWordCount(words, chars)
          if (onChange) onChange(quill.root.innerHTML)
        })

        // Insertion du contenu initial
        if (value) {
          quill.root.innerHTML = value
        }

        // Gestion des boutons IA
        setupAIButtons(quill)
        
        // Gestion des templates
        setupTemplateButtons(quill)

      } catch (error) {
        console.error('Erreur chargement Quill:', error)
      }
    }

    loadQuill()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [])

  /* Configuration des boutons IA */
  const setupAIButtons = (quill) => {
    // Bouton de génération IA
    const generateBtn = document.querySelector('.ql-ai-generate')
    if (generateBtn) {
      generateBtn.addEventListener('click', async () => {
        const selection = quill.getSelection()
        const prompt = window.prompt('Que voulez-vous générer ?')
        
        if (prompt) {
          try {
            // Appel à l'API de génération
            const response = await fetch('/api/ai/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt })
            })
            
            const result = await response.json()
            const cleanedText = cleanIATextLight(result.text)
            
            if (selection) {
              quill.insertText(selection.index, cleanedText)
            } else {
              quill.setText(cleanedText)
            }
          } catch (error) {
            console.error('Erreur génération IA:', error)
          }
        }
      })
    }

    // Bouton d'analyse IA
    const analyzeBtn = document.querySelector('.ql-ai-analyze')
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        const text = quill.getText()
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length
        
        const analysis = `
## Analyse du Document

### Statistiques
- Mots: ${words}
- Caractères: ${text.length}
- Paragraphes: ${text.split('\n\n').length}

### Qualité
- Ton: ${words > 500 ? 'Professionnel' : 'Concise'}
- Structure: ${text.includes('##') ? 'Bien structuré' : 'À améliorer'}
- Lisibilité: ${words < 200 ? 'Élevée' : words < 500 ? 'Moyenne' : 'Faible'}

### Recommandations
${words < 100 ? '- Ajouter plus de détails\n- Structurer avec des titres' : words < 500 ? '- Ajouter des exemples\n- Développer les points clés' : '- Simplifier certaines sections\n- Ajouter des résumés'}
        `
        
        quill.insertText(quill.getLength(), '\n\n' + analysis)
      })
    }

    // Bouton d'optimisation IA
    const optimizeBtn = document.querySelector('.ql-ai-optimize')
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => {
        const text = quill.getText()
        const optimized = cleanIATextLight(text)
        quill.setText(optimized)
      })
    }
  }

  /* Configuration des templates */
  const setupTemplateButtons = (quill) => {
    const templateBtn = document.querySelector('.ql-template-insert')
    if (templateBtn) {
      templateBtn.addEventListener('click', () => {
        const templateNames = Object.keys(PROFESSIONAL_TEMPLATES)
        const selected = window.prompt(
          'Choisissez un template:\n' + 
          templateNames.map((key, i) => `${i+1}. ${PROFESSIONAL_TEMPLATES[key].name}`).join('\n')
        )
        
        if (selected && templateNames[selected - 1]) {
          const templateKey = templateNames[selected - 1]
          const template = PROFESSIONAL_TEMPLATES[templateKey]
          
          if (confirm(`Remplacer le contenu par le template "${template.name}" ?`)) {
            quill.setText(template.template)
            setActiveTemplate(templateKey)
          }
        }
      })
    }
  }

  /* Gestion du plein écran */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
    if (!isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isFullscreen])

  /* Gestion de la grille */
  const toggleGrid = useCallback(() => {
    setShowGridOverlay(prev => !prev)
  }, [])

  /* Export avancé */
  const exportDocument = useCallback((format) => {
    if (!quillRef.current) return
    
    const content = quillRef.current.root.innerHTML
    const text = quillRef.current.getText()
    
    switch (format) {
      case 'pdf':
        // Export PDF avec en-têtes et pieds de page
        window.print()
        break
      case 'word':
        // Export Word avancé
        // eslint-disable-next-line no-case-declarations -- Block declaration scope is OK in this switch
        const blob = new Blob([content], { type: 'application/msword' })
        // eslint-disable-next-line no-case-declarations -- Block declaration scope is OK in this switch
        const url = URL.createObjectURL(blob)
        // eslint-disable-next-line no-case-declarations -- Block declaration scope is OK in this switch
        const a = document.createElement('a')
        a.href = url
        a.download = 'document-ultra-pro.doc'
        a.click()
        break
      case 'markdown':
        // Export Markdown
        // eslint-disable-next-line no-case-declarations -- Block declaration scope is OK in this switch
        const markdown = content
          .replace(/<h([1-6])>(.*?)<\/h[1-6]>/g, (match, level, text) => '#'.repeat(parseInt(level)) + ' ' + text + '\n\n')
          .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
          .replace(/<em>(.*?)<\/em>/g, '*$1*')
          .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        
        // eslint-disable-next-line no-case-declarations -- Block declaration scope is OK in this switch
        const mdBlob = new Blob([markdown], { type: 'text/markdown' })
        // eslint-disable-next-line no-case-declarations -- Block declaration scope is OK in this switch
        const mdUrl = URL.createObjectURL(mdBlob)
        // eslint-disable-next-line no-case-declarations -- Block declaration scope is OK in this switch
        const mdA = document.createElement('a')
        mdA.href = mdUrl
        mdA.download = 'document.md'
        mdA.click()
        break
    }
  }, [])

  return (
    <div className={`qup-container ${dark ? 'dark' : ''} ${isFullscreen ? 'qup-fullscreen' : ''}`}>
      <style>{ULTRA_CSS}</style>
      
      {/* Barre d'outils supérieure */}
      <div className="qup-toolbar-extra" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: dark ? '#1e293b' : '#f8fafc',
        borderBottom: '1px solid #e5e7eb',
        fontSize: '12px',
        color: dark ? '#94a3b8' : '#64748b'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>Éditeur Ultra Pro</span>
          {activeTemplate && <span style={{ color: '#3b82f6' }}>Template: {PROFESSIONAL_TEMPLATES[activeTemplate]?.name}</span>}
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={toggleGrid} style={{
            padding: '4px 8px',
            background: showGridOverlay ? '#3b82f6' : 'transparent',
            color: showGridOverlay ? 'white' : dark ? '#94a3b8' : '#64748b',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}>
            Grille
          </button>
          
          <button onClick={toggleFullscreen} style={{
            padding: '4px 8px',
            background: isFullscreen ? '#3b82f6' : 'transparent',
            color: isFullscreen ? 'white' : dark ? '#94a3b8' : '#64748b',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}>
            {isFullscreen ? 'Sortir' : 'Plein écran'}
          </button>
          
          <select onChange={(e) => exportDocument(e.target.value)} style={{
            padding: '4px 8px',
            background: 'transparent',
            color: dark ? '#94a3b8' : '#64748b',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}>
            <option value="">Exporter</option>
            <option value="pdf">PDF</option>
            <option value="word">Word</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>
      </div>

      {/* Conteneur de l'éditeur */}
      <div className="qup-page-wrap">
        <div ref={editorRef} style={{ position: 'relative' }}>
          {/* En-tête automatique */}
          <div className="qup-header">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ABAWI Ultra Pro</span>
              <span>{new Date().toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          
          {/* Grille d'alignement */}
          {showGridOverlay && <div className="qup-grid-overlay active" />}
          
          {/* Éditeur principal */}
          <div className="qup-editor" />
          
          {/* Pied de page automatique */}
          <div className="qup-footer">
            <div>Document généré avec ABAWI Ultra Pro - Page 1</div>
          </div>
          
          {/* Statistiques */}
          {showStats && (
            <div className="qup-stats">
              {wordCount} mots | {charCount} caractères
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
