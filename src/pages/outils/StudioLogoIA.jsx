import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { canAccess } from '../../lib/permissions'
import { useTheme } from '../../context/ThemeContext'
import SEO from '../../components/SEO'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import { generateLogosV3, generateBrandOfferV3, getGenerationStats, getGenerationHistory, clearGenerationHistory, downloadLogo as downloadLogoAPI, saveLogoToHistory, getLogoHistory } from '../../lib/logoAIAPI-v3'
import { generateDesign, getAvailableDesignTypes, getDesignTypeName, DESIGN_TYPES } from '../../lib/designStudioAPI'

const ACCENT = 'var(--accent)'
const ACCENT2 = 'var(--accent2)'
const ACCENT3 = 'var(--accent3)'

// Styles pour le Studio Design Pro
const STUDIO_STYLES = `
  .studio-container {
    min-height: 100vh;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .studio-header {
    background: linear-gradient(135deg, var(--accent3) 0%, var(--accent3) 100%);
    padding: 40px 32px;
    color: white;
    border-radius: 0 0 32px 32px;
    box-shadow: 0 12px 48px var(--accent3)30;
    margin-bottom: 32px;
  }
  
  .studio-logo {
    width: 72px;
    height: 72px;
    background: var(--bg-card);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    margin-bottom: 20px;
  }
  
  .studio-title {
    font-size: 2.8rem;
    font-weight: 900;
    margin: 0 0 12px 0;
    background: linear-gradient(135deg, #fff, rgba(255,255,255,0.8));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .studio-subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    margin: 0;
    max-width: 600px;
  }
  
  .studio-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 32px 32px;
  }
  
  .studio-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 32px;
    margin-bottom: 32px;
  }
  
  .studio-panel {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 28px;
    transition: all 0.3s;
  }
  
  .studio-panel:hover {
    box-shadow: 0 8px 32px var(--accent)15;
    border-color: var(--accent);
  }
  
  .studio-section-title {
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0 0 20px 0;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .studio-form-group {
    margin-bottom: 24px;
  }
  
  .studio-label {
    display: block;
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary);
  }
  
  .studio-input,
  .studio-select,
  .studio-textarea {
    width: 100%;
    padding: 14px 18px;
    border: 2px solid var(--border);
    border-radius: 12px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.95rem;
    font-family: inherit;
    transition: all 0.2s;
  }
  
  .studio-input:focus,
  .studio-select:focus,
  .studio-textarea:focus {
    outline: none;
    border-color: var(--accent3);
    box-shadow: 0 0 0 4px var(--accent3)15;
  }
  
  .studio-textarea {
    min-height: 120px;
    resize: vertical;
  }
  
  .studio-style-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .studio-style-card {
    padding: 16px;
    border: 2px solid var(--border);
    border-radius: 12px;
    background: var(--bg-primary);
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }
  
  .studio-style-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  
  .studio-style-card.active {
    border-color: var(--accent3);
    background: var(--accent3)10;
  }
  
  .studio-style-icon {
    font-size: 2rem;
    margin-bottom: 8px;
  }
  
  .studio-style-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-primary);
  }
  
  .studio-color-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .studio-color-option {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 12px;
    border: 3px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }
  
  .studio-color-option:hover {
    transform: scale(1.05);
  }
  
  .studio-color-option.active {
    border-color: var(--text-primary);
    box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--text-primary);
  }
  
  .studio-preview-area {
    background: var(--bg-card);
    border: 2px solid var(--border);
    border-radius: 20px;
    padding: 40px;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  
  .studio-preview-logo {
    width: 200px;
    height: 200px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 72px;
    font-weight: 900;
    margin-bottom: 24px;
    position: relative;
    transition: all 0.3s;
  }
  
  .studio-preview-name {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 12px;
    color: var(--text-primary);
  }
  
  .studio-preview-slogan {
    font-size: 1.1rem;
    color: var(--text-secondary);
    text-align: center;
    max-width: 400px;
  }
  
  .studio-actions {
    display: flex;
    gap: 16px;
    margin-top: 32px;
  }
  
  .studio-btn {
    padding: 14px 28px;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .studio-btn-primary {
    background: linear-gradient(135deg, var(--accent3) 0%, var(--accent3) 100%);
    color: white;
  }
  
  .studio-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px var(--accent3)40;
  }
  
  .studio-btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 2px solid var(--border);
  }
  
  .studio-btn-secondary:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  
  .studio-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;
    color: var(--text-secondary);
  }
  
  .studio-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top: 3px solid var(--accent3);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .studio-results {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin-top: 32px;
  }
  
  .studio-result-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    transition: all 0.2s;
    cursor: pointer;
  }
  
  .studio-result-card:hover {
    border-color: var(--accent);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px var(--accent)20;
  }
  
  .studio-result-logo {
    width: 120px;
    height: 120px;
    margin: 0 auto 16px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: 900;
  }
  
  .studio-result-name {
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text-primary);
  }
  
  .studio-result-style {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 12px;
  }
  
  .studio-result-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  
  .studio-result-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .studio-result-btn-primary {
    background: var(--accent);
    color: white;
  }
  
  .studio-result-btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }
  
  @media (max-width: 1024px) {
    .studio-grid {
      grid-template-columns: 1fr;
    }
    
    .studio-style-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .studio-color-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  @media (max-width: 640px) {
    .studio-header {
      padding: 32px 20px;
    }
    
    .studio-content {
      padding: 0 20px 20px;
    }
    
    .studio-panel {
      padding: 20px;
    }
    
    .studio-title {
      font-size: 2.2rem;
    }
    
    .studio-style-grid {
      grid-template-columns: 1fr;
    }
    
    .studio-color-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
`

// Styles de logo prédéfinis
const LOGO_STYLES = [
  { id: 'modern', name: 'Moderne', icon: '🎯', description: 'Lignes épurées, minimaliste' },
  { id: 'classic', name: 'Classique', icon: '🏛️', description: 'Élégant, intemporel' },
  { id: 'tech', name: 'Tech', icon: '💻', description: 'Numérique, innovant' },
  { id: 'eco', name: 'Éco', icon: '🌿', description: 'Naturel, organique' },
  { id: 'bold', name: 'Audacieux', icon: '🔥', description: 'Fort, impactant' },
  { id: 'playful', name: 'Ludique', icon: '🎨', description: 'Créatif, amusant' },
]

// Palette de couleurs professionnelle
const COLOR_PALETTE = [
  '#1E40AF', // Bleu profond
  '#DC2626', // Rouge vif
  '#059669', // Émeraude
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#0891B2', // Cyan
  '#BE123C', // Rose
  '#65A30D', // Vert lime
  '#4338CA', // Indigo
  '#083344', // Teal foncé
  '#991B1B', // Bordeaux
  '#451A03', // Brun
]

export default function StudioLogoIA() {
  const { membre } = useAuth()
  const { darkMode } = useTheme()
  
  const [formData, setFormData] = useState({
    nomEntreprise: '',
    slogan: '',
    secteur: '',
    valeurs: '',
    publicCible: '',
    stylePrefere: 'modern',
    couleurPrimaire: '#1E40AF',
    couleurSecondaire: '#DC2626',
    modeGeneration: 'creative', // 'creative', 'efficient', 'balanced'
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLogos, setGeneratedLogos] = useState([])
  const [selectedLogo, setSelectedLogo] = useState(null)
  const [brandOffer, setBrandOffer] = useState(null)
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [generationStats, setGenerationStats] = useState(null)
  
  // États pour le Studio Design complet
  const [activeTab, setActiveTab] = useState('logos') // 'logos', 'designs'
  const [selectedDesignType, setSelectedDesignType] = useState(DESIGN_TYPES.LOGO)
  const [generatedDesigns, setGeneratedDesigns] = useState([])
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false)
  
  // Charger les statistiques au montage
  useEffect(() => {
    setGenerationStats(getGenerationStats())
  }, [])

  // Mettre à jour les stats après chaque génération
  useEffect(() => {
    const interval = setInterval(() => {
      setGenerationStats(getGenerationStats())
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Vérification des permissions
  if (!canAccess(membre, 'outils-elite')) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem' }}>🚫</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Accès Restreint</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '500px' }}>
          Vous n'avez pas les permissions nécessaires pour accéder au Studio Design Pro.
          Cette fonctionnalité est réservée aux membres Élite.
        </p>
      </div>
    )
  }
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleStyleSelect = (styleId) => {
    setFormData(prev => ({ ...prev, stylePrefere: styleId }))
  }
  
  const handleColorSelect = (colorType, color) => {
    setFormData(prev => ({ ...prev, [colorType]: color }))
  }
  
  const generateLogosHandler = async () => {
    if (!formData.nomEntreprise.trim()) {
      alert('Veuillez renseigner le nom de votre entreprise')
      return
    }
    
    setIsGenerating(true)
    
    try {
      // Utiliser le moteur de génération sélectionné
      const response = await generateLogosV3(formData, formData.modeGeneration)
      
      if (response.success) {
        setGeneratedLogos(response.logos)
        setSelectedLogo(response.logos[0])
        
        // Sauvegarder dans l'historique
        if (membre?.id) {
          try {
            await saveLogoToHistory(response.logos[0], membre.id)
          } catch (saveError) {
            console.warn('Erreur sauvegarde historique:', saveError)
          }
        }
        
        // Afficher un message si fallback utilisé ou pour indiquer le mode
        if (response.fallback) {
          console.log('Génération locale utilisée:', response.message)
        } else {
          console.log(`✅ Génération réussie avec ${response.provider || 'moteur inconnu'}`)
        }
      } else {
        throw new Error('Échec de la génération')
      }
    } catch (error) {
      console.error('Erreur lors de la génération des logos:', error)
      alert(error.message || 'Une erreur est survenue lors de la génération des logos')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const downloadLogoHandler = async (logo, format = 'png') => {
    try {
      await downloadLogoAPI(logo, format)
      // Le téléchargement est déjà géré dans la fonction API
    } catch (error) {
      console.error('Erreur téléchargement logo:', error)
      alert('Impossible de télécharger le logo. Veuillez réessayer.')
    }
  }
  
  const customizeLogo = (logo) => {
    setSelectedLogo(logo)
    setBrandOffer(null) // Réinitialiser l'offre quand on change de logo
    // Pré-remplir le formulaire avec les données du logo sélectionné
    setFormData(prev => ({
      ...prev,
      stylePrefere: logo.style,
      couleurPrimaire: logo.primaryColor,
      couleurSecondaire: logo.secondaryColor
    }))
  }
  
  const generateBrandOfferHandler = async () => {
    if (!selectedLogo) {
      alert('Veuillez d\'abord sélectionner un logo')
      return
    }
    
    setIsGeneratingOffer(true)
    
    try {
      const offer = await generateBrandOfferV3(formData, selectedLogo, formData.modeGeneration)
      
      if (offer.success) {
        setBrandOffer(offer)
        console.log('✅ Offre complète générée')
      } else {
        throw new Error('Échec de la génération de l\'offre')
      }
    } catch (error) {
      console.error('Erreur génération offre:', error)
      alert(error.message || 'Une erreur est survenue lors de la génération de l\'offre')
    } finally {
      setIsGeneratingOffer(false)
    }
  }
  
  const generateDesignHandler = async () => {
    if (!formData.nomEntreprise.trim()) {
      alert('Veuillez renseigner le nom de votre entreprise')
      return
    }
    
    setIsGeneratingDesign(true)
    
    try {
      const response = await generateDesign(formData, selectedDesignType, formData.modeGeneration)
      
      if (response.success) {
        setGeneratedDesigns([response])
        setSelectedDesign(response)
        console.log('✅ Design généré avec succès')
      } else {
        throw new Error('Échec de la génération du design')
      }
    } catch (error) {
      console.error('Erreur génération design:', error)
      alert(error.message || 'Une erreur est survenue lors de la génération du design')
    } finally {
      setIsGeneratingDesign(false)
    }
  }
  
  return (
    <>
      <SEO
        title="Studio Design Pro | Logos, affiches, mockups et identité visuelle IA"
        description="Studio Design Pro by ABAWI : générez logos, affiches, flyers, posters, cartes de visite, mockups, bannières et chartes graphiques complètes par IA. Branding 360° prêt à imprimer, export PNG/SVG/PDF."
        keywords="logo IA, studio design, branding, charte graphique, flyer IA, affiche IA, mockup, carte de visite, identité visuelle, ABAWI"
      />

      <div className="studio-container">
        <style>{STUDIO_STYLES}</style>

        {/* Header */}
        <header className="studio-header">
          <div className="studio-logo">🎨</div>
          <h1 className="studio-title">Studio Design Pro</h1>
          <p className="studio-subtitle">
            La suite création visuelle ultime. Générez par IA des logos uniques, des affiches, flyers, posters,
            cartes de visite, bannières réseaux, mockups et chartes graphiques complètes — tout votre branding 360°
            prêt à imprimer ou publier, en quelques minutes.
          </p>
          
          {/* Onglets de navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '32px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '16px'
          }}>
            <button
              className={`studio-tab ${activeTab === 'logos' ? 'active' : ''}`}
              onClick={() => setActiveTab('logos')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'logos' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'logos' ? 'white' : 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === 'logos' ? 'bold' : 'normal',
                transition: 'all 0.3s ease'
              }}
            >
              🎯 Logos & Branding
            </button>
            <button
              className={`studio-tab ${activeTab === 'designs' ? 'active' : ''}`}
              onClick={() => setActiveTab('designs')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'designs' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'designs' ? 'white' : 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === 'designs' ? 'bold' : 'normal',
                transition: 'all 0.3s ease'
              }}
            >
              🎨 Designs Créatifs
            </button>
          </div>
        </header>
        
        <div className="studio-content">
          <div className="studio-grid">
            {/* Panneau de configuration */}
            <div className="studio-panel">
              <h2 className="studio-section-title">
                <span>⚙️</span>
                Configuration du Logo
              </h2>
              
              <div className="studio-form-group">
                <label className="studio-label">Nom de l'entreprise *</label>
                <input
                  type="text"
                  className="studio-input"
                  value={formData.nomEntreprise}
                  onChange={(e) => handleInputChange('nomEntreprise', e.target.value)}
                  placeholder="Ex: TechInnov"
                />
              </div>
              
              <div className="studio-form-group">
                <label className="studio-label">Slogan (optionnel)</label>
                <textarea
                  className="studio-textarea"
                  value={formData.slogan}
                  onChange={(e) => handleInputChange('slogan', e.target.value)}
                  placeholder="Ex: L'innovation au service de demain"
                />
              </div>
              
              <div className="studio-form-group">
                <label className="studio-label">Secteur d'activité</label>
                <select
                  className="studio-select"
                  value={formData.secteur}
                  onChange={(e) => handleInputChange('secteur', e.target.value)}
                >
                  <option value="">Sélectionnez un secteur</option>
                  <option value="tech">Technologie</option>
                  <option value="finance">Finance</option>
                  <option value="sante">Santé</option>
                  <option value="education">Éducation</option>
                  <option value="retail">Commerce</option>
                  <option value="restaurant">Restauration</option>
                  <option value="consulting">Conseil</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              
              <div className="studio-form-group">
                <label className="studio-label">Valeurs de l'entreprise</label>
                <textarea
                  className="studio-textarea"
                  value={formData.valeurs}
                  onChange={(e) => handleInputChange('valeurs', e.target.value)}
                  placeholder="Ex: Innovation, Durabilité, Confiance"
                />
              </div>
              
              <div className="studio-form-group">
                <label className="studio-label">Public cible</label>
                <textarea
                  className="studio-textarea"
                  value={formData.publicCible}
                  onChange={(e) => handleInputChange('publicCible', e.target.value)}
                  placeholder="Ex: Jeunes professionnels, Entreprises B2B"
                />
              </div>
              
              <div className="studio-form-group">
                <label className="studio-label">Mode de génération</label>
                <select
                  className="studio-select"
                  value={formData.modeGeneration}
                  onChange={(e) => handleInputChange('modeGeneration', e.target.value)}
                >
                  <option value="creative">🎨 Mode Créatif</option>
                  <option value="efficient">⚡ Mode Efficace</option>
                  <option value="balanced">🎯 Mode Équilibré</option>
                </select>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--text-secondary)', 
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  {formData.modeGeneration === 'creative' 
                    ? 'Génération ultra-créative avec designs audacieux et symbolisme profond (Claude)'
                    : formData.modeGeneration === 'efficient'
                    ? 'Génération rapide et efficace pour résultats immédiats (Groq)'
                    : 'Génération équilibrée avec optimisation qualité/vitesse (OpenAI)'}
                </div>
              </div>
              
              <div className="studio-form-group">
                <label className="studio-label">Style de logo</label>
                <div className="studio-style-grid">
                  {LOGO_STYLES.map(style => (
                    <div
                      key={style.id}
                      className={`studio-style-card ${formData.stylePrefere === style.id ? 'active' : ''}`}
                      onClick={() => handleStyleSelect(style.id)}
                    >
                      <div className="studio-style-icon">{style.icon}</div>
                      <div className="studio-style-name">{style.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="studio-form-group">
                <label className="studio-label">Couleur primaire</label>
                <div className="studio-color-grid">
                  {COLOR_PALETTE.map(color => (
                    <div
                      key={color}
                      className={`studio-color-option ${formData.couleurPrimaire === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => handleColorSelect('couleurPrimaire', color)}
                    />
                  ))}
                </div>
              </div>
              
              <div className="studio-form-group">
                <label className="studio-label">Couleur secondaire</label>
                <div className="studio-color-grid">
                  {COLOR_PALETTE.map(color => (
                    <div
                      key={color}
                      className={`studio-color-option ${formData.couleurSecondaire === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => handleColorSelect('couleurSecondaire', color)}
                    />
                  ))}
                </div>
              </div>
              
              <div className="studio-actions">
                <button
                  className="studio-btn studio-btn-primary"
                  onClick={generateLogosHandler}
                  disabled={isGenerating}
                >
                  <span>🎨</span>
                  {isGenerating ? 'Génération...' : 'Générer les logos'}
                </button>
                <button
                  className="studio-btn studio-btn-secondary"
                  onClick={() => setFormData({
                    nomEntreprise: '',
                    slogan: '',
                    secteur: '',
                    valeurs: '',
                    publicCible: '',
                    stylePrefere: 'modern',
                    couleurPrimaire: '#1E40AF',
                    couleurSecondaire: '#DC2626',
                    modeGeneration: 'creative',
                  })}
                >
                  <span>🔄</span>
                  Réinitialiser
                </button>
              </div>
            </div>
            
            {/* Panneau de prévisualisation */}
            <div className="studio-panel">
              <h2 className="studio-section-title">
                <span>👁️</span>
                Prévisualisation
              </h2>
              
              {isGenerating ? (
                <div className="studio-loading">
                  <div className="studio-spinner"></div>
                  <span>Génération de vos logos en cours...</span>
                </div>
              ) : selectedLogo ? (
                <div className="studio-preview-area">
                  {selectedLogo.svg ? (
                    <div 
                      className="studio-preview-logo"
                      style={{
                        background: 'transparent',
                        padding: '20px'
                      }}
                      dangerouslySetInnerHTML={{ __html: selectedLogo.svg }}
                    />
                  ) : (
                    <div 
                      className="studio-preview-logo"
                      style={{
                        background: `linear-gradient(135deg, ${selectedLogo.primaryColor}, ${selectedLogo.secondaryColor})`,
                        color: '#FFFFFF'
                      }}
                    >
                      {selectedLogo.preview}
                    </div>
                  )}
                  <div className="studio-preview-name">{selectedLogo.name}</div>
                  {formData.slogan && (
                    <div className="studio-preview-slogan">{formData.slogan}</div>
                  )}
                </div>
              ) : (
                <div className="studio-preview-area">
                  <div style={{ 
                    fontSize: '4rem', 
                    marginBottom: '20px', 
                    opacity: 0.3 
                  }}>
                    🎨
                  </div>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    color: 'var(--text-secondary)', 
                    textAlign: 'center' 
                  }}>
                    Configurez votre logo et cliquez sur "Générer les logos" 
                    pour voir la prévisualisation
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Section de suivi des générations */}
          {generationStats && (
            <div className="studio-panel">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h2 className="studio-section-title">
                  <span>📊</span>
                  Suivi des Générations
                </h2>
                <button
                  className="studio-btn studio-btn-secondary"
                  onClick={() => setShowStats(!showStats)}
                  style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                >
                  {showStats ? 'Masquer' : 'Afficher'} les stats
                </button>
              </div>
              
              {showStats && (
                <div style={{ 
                  background: 'var(--bg-tertiary)', 
                  padding: '20px', 
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                        {generationStats.total}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Total générations
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--green)' }}>
                        {generationStats.successRate}%
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Taux de succès
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--blue)' }}>
                        {generationStats.byType.logo}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Logos générés
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--purple)' }}>
                        {generationStats.byType.offer}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Offres créées
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Utilisation par moteur
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div style={{ 
                        background: 'var(--bg-primary)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span>🎨</span>
                          <strong>Mode Créatif</strong>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                          {generationStats.byEngine.creative}
                        </div>
                      </div>
                      <div style={{ 
                        background: 'var(--bg-primary)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span>⚡</span>
                          <strong>Mode Efficace</strong>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--orange)' }}>
                          {generationStats.byEngine.efficient}
                        </div>
                      </div>
                      <div style={{ 
                        background: 'var(--bg-primary)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span>🎯</span>
                          <strong>Mode Équilibré</strong>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--blue)' }}>
                          {generationStats.byEngine.balanced}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <button
                      className="studio-btn studio-btn-secondary"
                      onClick={() => {
                        clearGenerationHistory()
                        setGenerationStats(getGenerationStats())
                      }}
                      style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                    >
                      🗑️ Effacer l'historique
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Résultats générés (logos) */}
          {activeTab === 'logos' && generatedLogos.length > 0 && (
            <div className="studio-panel">
              <h2 className="studio-section-title">
                <span>✨</span>
                Logos générés ({generatedLogos.length})
              </h2>
              
              {/* Indicateur du moteur utilisé */}
              <div style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {generatedLogos[0]?.provider === 'creative' ? '🎨' : 
                   generatedLogos[0]?.provider === 'efficient' ? '⚡' : 
                   generatedLogos[0]?.provider === 'balanced' ? '🎯' : 
                   generatedLogos[0]?.provider === 'local-fallback' ? '🔄' : '❓'}
                </span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {generatedLogos[0]?.provider === 'creative' ? 'Généré en Mode Créatif (Claude - Ultra-créatif)' :
                     generatedLogos[0]?.provider === 'efficient' ? 'Généré en Mode Efficace (Groq - Rapide)' :
                     generatedLogos[0]?.provider === 'balanced' ? 'Généré en Mode Équilibré (OpenAI - Optimal)' :
                     generatedLogos[0]?.provider === 'local-fallback' ? 'Généré localement (Mode hors-ligne)' :
                     'Mode inconnu'}
                  </div>
                  {generatedLogos[0]?.provider && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {generatedLogos[0].provider === 'creative' ? 'Designs audacieux et symbolisme profond' :
                       generatedLogos[0].provider === 'efficient' ? 'Génération rapide et efficace' :
                       generatedLogos[0].provider === 'balanced' ? 'Optimisation qualité/vitesse' :
                       'Mode local de secours'}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="studio-results">
                {generatedLogos.map(logo => (
                  <div
                    key={logo.id}
                    className={`studio-result-card ${selectedLogo?.id === logo.id ? 'active' : ''}`}
                    onClick={() => setSelectedLogo(logo)}
                  >
                    {logo.svg ? (
                      <div 
                        className="studio-result-logo"
                        style={{
                          background: 'transparent',
                          padding: '10px'
                        }}
                        dangerouslySetInnerHTML={{ __html: logo.svg }}
                      />
                    ) : (
                      <div 
                        className="studio-result-logo"
                        style={{
                          background: `linear-gradient(135deg, ${logo.primaryColor}, ${logo.secondaryColor})`,
                          color: '#FFFFFF'
                        }}
                      >
                        {logo.preview}
                      </div>
                    )}
                    <div className="studio-result-name">{logo.name}</div>
                    <div className="studio-result-style">Style: {logo.style}</div>
                    
                    {/* Afficher les champs avancés si disponibles (OpenAI) */}
                    {logo.description && (
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-secondary)', 
                        marginBottom: '8px',
                        fontStyle: 'italic'
                      }}>
                        "{logo.description}"
                      </div>
                    )}
                    
                    {logo.symbolism && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--text-muted)', 
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontWeight: 600 }}>Symbolisme:</span> {logo.symbolism}
                      </div>
                    )}
                    
                    {logo.uniquenessScore && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--text-muted)', 
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontWeight: 600 }}>Unicité:</span> {logo.uniquenessScore}/10
                      </div>
                    )}
                    
                    <div className="studio-result-actions">
                      <button
                        className="studio-result-btn studio-result-btn-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadLogoHandler(logo, 'png')
                        }}
                      >
                        📥 Télécharger
                      </button>
                      <button
                        className="studio-result-btn studio-result-btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          customizeLogo(logo)
                        }}
                      >
                        ✏️ Personnaliser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Section Designs Créatifs */}
          {activeTab === 'designs' && (
            <div className="studio-panel">
              <h2 className="studio-section-title">
                <span>🎨</span>
                Designs Créatifs
              </h2>
              
              {/* Sélecteur de type de design */}
              <div className="studio-form-group">
                <label className="studio-label">Type de Design</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  {getAvailableDesignTypes().map(type => (
                    <button
                      key={type.id}
                      className={`studio-design-type-card ${selectedDesignType === type.id ? 'active' : ''}`}
                      onClick={() => setSelectedDesignType(type.id)}
                      style={{
                        padding: '16px',
                        background: selectedDesignType === type.id 
                          ? 'var(--accent)' 
                          : 'var(--bg-tertiary)',
                        color: selectedDesignType === type.id 
                          ? 'white' 
                          : 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                        {type.icon}
                      </div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {type.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Bouton de génération */}
              <button
                className="studio-btn studio-btn-primary"
                onClick={generateDesignHandler}
                disabled={isGeneratingDesign}
                style={{ width: '100%', marginBottom: '24px' }}
              >
                <span>🎨</span>
                {isGeneratingDesign ? 'Génération en cours...' : `Générer ${getDesignTypeName(selectedDesignType)}`}
              </button>
              
              {/* Résultats des designs */}
              {generatedDesigns.length > 0 && (
                <div>
                  <h3 style={{ 
                    color: 'var(--text-primary)', 
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    Design généré
                  </h3>
                  
                  {generatedDesigns.map((design, index) => (
                    <div key={index} style={{
                      background: 'var(--bg-tertiary)',
                      padding: '24px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      marginBottom: '16px'
                    }}>
                      {/* En-tête du design */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                      }}>
                        <div>
                          <h4 style={{ 
                            color: 'var(--text-primary)', 
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                          }}>
                            {getDesignTypeName(design.designType)}
                          </h4>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Généré avec {design.provider === 'creative' ? 'Mode Créatif (Claude)' :
                                      design.provider === 'balanced' ? 'Mode Équilibré (OpenAI)' :
                                      'Mode local'}
                          </div>
                        </div>
                        <div style={{ fontSize: '1.5rem' }}>
                          {design.provider === 'creative' ? '🎨' :
                           design.provider === 'balanced' ? '🎯' : '🔄'}
                        </div>
                      </div>
                      
                      {/* Contenu du design */}
                      {design.design && (
                        <div>
                          {/* Titre et tagline si disponibles */}
                          {design.design.title && (
                            <div style={{ marginBottom: '16px' }}>
                              <h5 style={{ 
                                color: 'var(--accent)', 
                                marginBottom: '8px',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                              }}>
                                {design.design.title}
                              </h5>
                              {design.design.tagline && (
                                <p style={{ 
                                  color: 'var(--text-secondary)', 
                                  fontStyle: 'italic',
                                  marginBottom: '8px'
                                }}>
                                  "{design.design.tagline}"
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Description */}
                          {design.design.description && (
                            <div style={{ marginBottom: '16px' }}>
                              <h6 style={{ 
                                color: 'var(--text-primary)', 
                                marginBottom: '8px',
                                fontWeight: 'bold'
                              }}>
                                Description
                              </h6>
                              <p style={{ 
                                color: 'var(--text-secondary)', 
                                lineHeight: '1.6'
                              }}>
                                {design.design.description}
                              </p>
                            </div>
                          )}
                          
                          {/* Palette de couleurs */}
                          {design.design.colorScheme && (
                            <div style={{ marginBottom: '16px' }}>
                              <h6 style={{ 
                                color: 'var(--text-primary)', 
                                marginBottom: '8px',
                                fontWeight: 'bold'
                              }}>
                                Palette de Couleurs
                              </h6>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {Object.entries(design.design.colorScheme).map(([key, color]) => (
                                  <div key={key} style={{ textAlign: 'center' }}>
                                    <div style={{
                                      width: '32px',
                                      height: '32px',
                                      backgroundColor: color,
                                      borderRadius: '6px',
                                      border: '1px solid var(--border)',
                                      marginBottom: '4px'
                                    }}></div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      {key}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Typographie */}
                          {design.design.typography && (
                            <div style={{ marginBottom: '16px' }}>
                              <h6 style={{ 
                                color: 'var(--text-primary)', 
                                marginBottom: '8px',
                                fontWeight: 'bold'
                              }}>
                                Typographie
                              </h6>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                                {Object.entries(design.design.typography).map(([key, font]) => (
                                  <div key={key} style={{
                                    background: 'var(--bg-primary)',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)'
                                  }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      {key}
                                    </div>
                                    <div style={{ fontWeight: 'bold' }}>
                                      {font}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Éléments visuels */}
                          {design.design.elements && design.design.elements.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                              <h6 style={{ 
                                color: 'var(--text-primary)', 
                                marginBottom: '8px',
                                fontWeight: 'bold'
                              }}>
                                Éléments Visuels
                              </h6>
                              <div style={{ display: 'grid', gap: '8px' }}>
                                {design.design.elements.map((element, idx) => (
                                  <div key={idx} style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)'
                                  }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                      {element.type}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                      {element.description}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Impact émotionnel */}
                          {design.design.emotionalImpact && (
                            <div style={{ marginBottom: '16px' }}>
                              <h6 style={{ 
                                color: 'var(--text-primary)', 
                                marginBottom: '8px',
                                fontWeight: 'bold'
                              }}>
                                Impact Émotionnel
                              </h6>
                              <p style={{ 
                                color: 'var(--text-secondary)', 
                                fontStyle: 'italic'
                              }}>
                                {design.design.emotionalImpact}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Section Offre Complète */}
          {activeTab === 'logos' && selectedLogo && (
            <div className="studio-panel">
              <h2 className="studio-section-title">
                <span>🎯</span>
                Offre Complète de Branding
              </h2>
              
              {!brandOffer ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📋</div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Générez une offre complète
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                    Obtenez un projet détaillé avec variantes pour tous supports, 
                    guidelines de marque et applications concrètes.
                  </p>
                  <button
                    className="studio-btn studio-btn-primary"
                    onClick={generateBrandOfferHandler}
                    disabled={isGeneratingOffer}
                  >
                    <span>🎯</span>
                    {isGeneratingOffer ? 'Génération...' : 'Générer l\'offre complète'}
                  </button>
                </div>
              ) : (
                <div>
                  {/* Indicateur du provider */}
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>📋</span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        Offre générée avec {brandOffer.provider === 'ai-generated' ? 'IA avancée' : 'modèle standard'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Projet */}
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📁</span> Projet
                    </h3>
                    <div style={{ 
                      background: 'var(--bg-tertiary)', 
                      padding: '20px', 
                      borderRadius: '12px',
                      border: '1px solid var(--border)'
                    }}>
                      <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                        {brandOffer.project?.title || 'PROJET BRANDING'}
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        {brandOffer.project?.description || 'Description du projet'}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Objectifs:</strong>
                          <div style={{ color: 'var(--text-secondary)', margin: '8px 0', paddingLeft: '0px' }}>
                            {(brandOffer.project?.objectives || ['1. Créer identité visuelle', '2. Assurer cohérence']).map((obj, i) => (
                              <div key={i} style={{ marginBottom: '4px' }}>{obj}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Timeline:</strong>
                          <p style={{ color: 'var(--text-secondary)', margin: '8px 0' }}>
                            {brandOffer.project?.timeline || '2-3 semaines'}
                          </p>
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Budget:</strong>
                          <p style={{ color: 'var(--text-secondary)', margin: '8px 0' }}>
                            {brandOffer.project?.budget || 'Sur devis'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Variantes */}
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                      <span>🎨</span> Variantes par Support
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                      {(brandOffer.variants || []).map((variant, index) => (
                        <div key={index} style={{
                          background: 'var(--bg-tertiary)',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '1px solid var(--border)'
                        }}>
                          <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                            {variant.support}
                          </h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                            {variant.description}
                          </p>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <div><strong>Specs:</strong> {variant.specifications}</div>
                            <div><strong>Typo:</strong> {variant.typography}</div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <strong>Couleurs:</strong>
                              {(variant.colors || []).map((color, i) => (
                                <span key={i} style={{
                                  display: 'inline-block',
                                  width: '16px',
                                  height: '16px',
                                  backgroundColor: color,
                                  borderRadius: '4px',
                                  border: '1px solid var(--border)'
                                }} title={color}></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Applications */}
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                      <span>🚀</span> Applications
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                      {(brandOffer.applications || []).map((app, index) => (
                        <div key={index} style={{
                          background: 'var(--bg-tertiary)',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '1px solid var(--border)'
                        }}>
                          <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                            {app.support}
                          </h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                            {app.usage}
                          </p>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <div><strong>Format:</strong> {app.format}</div>
                            <div><strong>Notes:</strong> {app.notes}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Guidelines */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                      <span>📖</span> Guidelines de Marque
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                      <div>
                        <h4 style={{ color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>✅ À faire</h4>
                        <div style={{ color: 'var(--text-secondary)', margin: '0', paddingLeft: '0px' }}>
                          {(brandOffer.guidelines?.do || ['1. Maintenir cohérence', '2. Respecter espaces']).map((item, i) => (
                            <div key={i} style={{ marginBottom: '4px' }}>{item}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 style={{ color: 'var(--red)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>❌ À ne pas faire</h4>
                        <div style={{ color: 'var(--text-secondary)', margin: '0', paddingLeft: '0px' }}>
                          {(brandOffer.guidelines?.dont || ['1. Modifier proportions', '2. Couleurs non autorisées']).map((item, i) => (
                            <div key={i} style={{ marginBottom: '4px' }}>{item}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Palette de couleurs */}
                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Palette de couleurs</h4>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        {Object.entries(brandOffer.guidelines?.colors || {}).map(([key, color]) => (
                          <div key={key} style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              backgroundColor: color,
                              borderRadius: '8px',
                              border: '2px solid var(--border)',
                              marginBottom: '4px'
                            }}></div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {key}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <button
                      className="studio-btn studio-btn-secondary"
                      onClick={() => setBrandOffer(null)}
                    >
                      <span>🔄</span>
                      Régénérer l'offre
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* ToolInfoPanel */}
        <ToolInfoPanel
          toolName="Studio Design Pro"
          icon="🎨"
          description="Suite créative IA tout-en-un : logos, affiches, flyers, posters, mockups, cartes de visite, bannières, chartes graphiques et branding 360°."
          benefits={[
            'Logos uniques générés en mode Créatif (Claude), Équilibré (OpenAI) ou Efficace (Groq)',
            'Affiches, flyers et posters prêts à imprimer (A4, A3, web)',
            'Cartes de visite recto/verso, en-têtes, signatures email',
            'Bannières et visuels réseaux sociaux (Instagram, Facebook, LinkedIn, TikTok)',
            'Mockups et maquettes produit pour présenter votre marque',
            'Charte graphique complète : logo, palette, typographie, do/don\'t',
            'Export multi-formats : PNG haute résolution, SVG vectoriel, PDF imprimable',
            'Mode Projection plein écran intégré pour pitcher en réunion'
          ]}
          features={[
            '3 moteurs IA combinés (Claude, OpenAI, Groq) avec sélection du mode',
            '9+ types de design : logo, affiche, flyer, carte, bannière, mockup…',
            'Palette de 12 couleurs professionnelles + sélection libre',
            '6 styles de logo : moderne, classique, tech, éco, audacieux, ludique',
            'Prévisualisation temps réel + variantes par support',
            'Historique persistant de toutes vos générations',
            'Statistiques d\'usage par moteur (taux de succès, types générés)',
            'Offre complète de branding avec applications concrètes & guidelines'
          ]}
        />
      </div>
    </>
  )
}
