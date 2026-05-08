import { useEffect, useState, useRef } from 'react';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import './FinanceEliteSimple.css'
import { exportToPDF } from '../../lib/generatePDF'
import { exportExcel as exportToExcel } from '../../lib/generatePDF'
import { cleanIATextLight } from '../../lib/cleanText'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../hooks/useWorkspace'
import { useBackgroundJob } from '../../hooks/useBackgroundJob'
import { useDraftAutoSave } from '../../hooks/useDraftAutoSave'

import { callGroq as groqCall } from '../../lib/groqClient'
import { buildSystemPrompt } from '../../lib/writingModes'
import SEO from '../../components/SEO'
import RichDoc from '../../components/RichDoc'

// The premium_guide mode supplies the formatting rules (no #/##/**, dense
// paragraphs, structured headings, tables, key-principle boxes). We layer
// the finance-specific expertise on top via the extraContext arg.
const FINANCE_EXPERTISE = `EXPERTISE MÉTIER : tu es un expert financier senior CFA avec 20 ans d'expérience en Afrique de l'Ouest.
- Tes analyses sont conformes aux normes OHADA, SYSCOHADA et aux directives BCEAO.
- Tu donnes systématiquement les ratios chiffrés (rentabilité, liquidité, solvabilité), les références réglementaires applicables et l'impact opérationnel pour le dirigeant.
- Tes recommandations sont actionnables, datées et hiérarchisées par priorité (impact / urgence).
- Quand une donnée manque, tu signales l'hypothèse retenue plutôt que d'inventer un chiffre.`

const FINANCE_SYSTEM = buildSystemPrompt('premium_guide', FINANCE_EXPERTISE)

const callGroq = (prompt, maxTokens = 2000) => groqCall(prompt, { maxTokens, temperature: 0.2, system: FINANCE_SYSTEM })

// Élite Finance Sections
const SECTIONS = [
  { id: 'entreprise', label: 'Entreprise', icon: '🏢', color: 'var(--accent)' },
  { id: 'compte_resultat', label: 'Compte de résultat', icon: '📊', color: '#8B5CF6' },
  { id: 'bilan', label: 'Bilan', icon: '📒', color: '#F59E0B' },
  { id: 'tresorerie', label: 'Trésorerie', icon: '💵', color: '#EC4899' },
  { id: 'ratios', label: 'Ratios & Analyse', icon: '📈', color: '#22D3EE' },
  { id: 'valorisation', label: 'Valorisation', icon: '💎', color: '#22C55E' },
  { id: 'credit', label: 'Analyse Crédit', icon: '🏦', color: '#FB923C' },
  { id: 'risques', label: 'Risques', icon: '⚠️', color: '#34D399' },
  { id: 'rapport', label: 'Rapport Final', icon: '📄', color: '#F43F5E' },
]

// Élite Finance Component
export default function FinanceEliteSimple() {
  const { membre } = useAuth()
  const [section, setSection] = useState('entreprise')
  const [paid, setPaid] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [rapport, setRapport] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const [uploadedContext, setUploadedContext] = useState('')
  const caFileRef = useRef(null)
  const containerRef = useRef(null)
  const workspace = useWorkspace('finance-elite-rapport')
  const bgJob = useBackgroundJob('finance-elite-rapport', 'Rapport Financier Élite', 'anonymous', setRapport);
  const { themed } = useThemedStyles();

  // Élite State Management
  const [entreprise, setEntreprise] = useState({
    nom: '', secteur: 'Commerce', forme_juridique: 'SARL',
    annee_creation: new Date().getFullYear() - 3,
    effectif: 10, capital_social: 1000000, pays: 'Sénégal'
  })

  const [compteResultat, setCompteResultat] = useState({
    chiffre_affaires: 50000000, achats: 30000000, services_exterieurs: 5000000,
    salaires_charges: 8000000, dotations: 2000000, charges_financieres: 1000000,
    impots_taxes: 1500000, resultat_exploitation: 0, resultat_net: 0
  })

  const [bilan, setBilan] = useState({
    immobilisations: 15000000, stocks: 5000000, creances_clients: 8000000,
    disponibilites: 2000000, capital_social: 10000000, reserves: 2000000,
    resultat_net: 0, dettes_financieres: 8000000, dettes_fournisseurs: 6000000,
    dettes_fiscales_sociales: 2000000
  })

  const [tresorerie, setTresorerie] = useState({
    flux_exploitation: 0, flux_investissement: 0, flux_financement: 0,
    variation_tresorerie: 0, tresorerie_finale: 0
  })

  const [ratios, setRatios] = useState({
    rentabilite: { marge_nette: 0, roe: 0, roa: 0 },
    liquidite: { current_ratio: 0, quick_ratio: 0, cash_ratio: 0 },
    endettement: { debt_to_equity: 0, debt_to_assets: 0, interest_coverage: 0 },
    activite: { rotation_stocks: 0, delai_client: 0, delai_fournisseur: 0 }
  })

  const [valorisation, setValorisation] = useState({
    method: 'dcf', wacc: 0.12, croissance: 0.03, multiple: 5,
    valeur_entreprise: 0, valeur_actions: 0
  })

  const [credit, setCredit] = useState({
    note: 'AAA', capacite_endettement: 0, ratio_couverture: 0,
    recommandations: [], garanties: []
  })

  const [risques, setRisques] = useState([
    { id: 1, risque: 'Risque de marché', probabilite: 3, impact: 4, mitigation: 'Diversification' },
    { id: 2, risque: 'Risque de crédit', probabilite: 2, impact: 5, mitigation: 'Analyse renforcée' },
    { id: 3, risque: 'Risque opérationnel', probabilite: 3, impact: 3, mitigation: 'Contrôles internes' },
    { id: 4, risque: 'Risque de liquidité', probabilite: 2, impact: 4, mitigation: 'Fonds de roulement' }
  ])

  // Auto-save brouillon 30 jours
  const { lastSavedAt: draftSavedAt, clearDraft: clearFinanceDraft } = useDraftAutoSave(
    'abawi-finance-draft',
    { entreprise, compteResultat, bilan, tresorerie, ratios, valorisation, credit, risques },
    {
      onRestore: (d) => {
        if (d?.entreprise) setEntreprise(d.entreprise)
        if (d?.compteResultat) setCompteResultat(d.compteResultat)
        if (d?.bilan) setBilan(d.bilan)
        if (d?.tresorerie) setTresorerie(d.tresorerie)
        if (d?.ratios) setRatios(d.ratios)
        if (d?.valorisation) setValorisation(d.valorisation)
        if (d?.credit) setCredit(d.credit)
        if (d?.risques) setRisques(d.risques)
      },
    }
  )

  // L'outil reste utilisable pour tous; le verrouillage intervient au moment de l'export final.

  // Élite Calcul Functions
  const calculerResultatNet = () => {
    const resultat_exploitation = compteResultat.chiffre_affaires 
      - compteResultat.achats 
      - compteResultat.services_exterieurs 
      - compteResultat.salaires_charges 
      - compteResultat.dotations
    
    const resultat_net = resultat_exploitation 
      - compteResultat.charges_financieres 
      - compteResultat.impots_taxes
    
    setCompteResultat(prev => ({ ...prev, resultat_exploitation, resultat_net }))
    setBilan(prev => ({ ...prev, resultat_net }))
  }

  const calculerBilanEquilibre = () => {
    const actif = bilan.immobilisations + bilan.stocks + bilan.creances_clients + bilan.disponibilites
    const passif = bilan.capital_social + bilan.reserves + bilan.resultat_net 
      + bilan.dettes_financieres + bilan.dettes_fournisseurs + bilan.dettes_fiscales_sociales
    
    // Ajuster les disponibilités pour équilibrer
    const disponibilites_ajustees = passif - (bilan.immobilisations + bilan.stocks + bilan.creances_clients)
    setBilan(prev => ({ ...prev, disponibilites: disponibilites_ajustees }))
  }

  const calculerTresorerie = () => {
    const flux_exploitation = compteResultat.resultat_net + compteResultat.dotations
      - (bilan.stocks - bilan.stocks * 0.8) - (bilan.creances_clients - bilan.creances_clients * 0.9)
      + (bilan.dettes_fournisseurs - bilan.dettes_fournisseurs * 0.85)
    
    const flux_investissement = -bilan.immobilisations * 0.1 // Investissement annuel
    const flux_financement = 0 // Pas de nouveau financement
    
    const variation_tresorerie = flux_exploitation + flux_investissement + flux_financement
    const tresorerie_finale = bilan.disponibilites + variation_tresorerie
    
    setTresorerie({ flux_exploitation, flux_investissement, flux_financement, variation_tresorerie, tresorerie_finale })
  }

  const calculerRatios = () => {
    const actif_courant = bilan.stocks + bilan.creances_clients + bilan.disponibilites
    const passif_courant = bilan.dettes_fournisseurs + bilan.dettes_fiscales_sociales
    
    const rentabilite = {
      marge_nette: (compteResultat.resultat_net / compteResultat.chiffre_affaires) * 100,
      roe: (compteResultat.resultat_net / (bilan.capital_social + bilan.reserves + bilan.resultat_net)) * 100,
      roa: (compteResultat.resultat_net / (bilan.immobilisations + bilan.stocks + bilan.creances_clients + bilan.disponibilites)) * 100
    }
    
    const liquidite = {
      current_ratio: actif_courant / passif_courant,
      quick_ratio: (bilan.creances_clients + bilan.disponibilites) / passif_courant,
      cash_ratio: bilan.disponibilites / passif_courant
    }
    
    const endettement = {
      debt_to_equity: bilan.dettes_financieres / (bilan.capital_social + bilan.reserves + bilan.resultat_net),
      debt_to_assets: (bilan.dettes_financieres + bilan.dettes_fournisseurs + bilan.dettes_fiscales_sociales) 
        / (bilan.immobilisations + bilan.stocks + bilan.creances_clients + bilan.disponibilites),
      interest_coverage: Math.abs(compteResultat.resultat_exploitation / compteResultat.charges_financieres)
    }
    
    const activite = {
      rotation_stocks: compteResultat.achats / bilan.stocks,
      delai_client: (bilan.creances_clients / compteResultat.chiffre_affaires) * 365,
      delai_fournisseur: (bilan.dettes_fournisseurs / compteResultat.achats) * 365
    }
    
    setRatios({ rentabilite, liquidite, endettement, activite })
  }

  const calculerValorisation = () => {
    const wacc = valorisation.wacc
    const croissance = valorisation.croissance
    const fcfe = compteResultat.resultat_net + compteResultat.dotations // Simplified FCFF
    
    // DCF simplifié sur 5 ans
    let valeur_actuelle = 0
    for (let i = 1; i <= 5; i++) {
      const fcfe_annee = fcfe * Math.pow(1 + croissance, i)
      const va = fcfe_annee / Math.pow(1 + wacc, i)
      valeur_actuelle += va
    }
    
    const valeur_terminal = (fcfe * Math.pow(1 + croissance, 5) * (1 + croissance)) / (wacc - croissance)
    const va_terminal = valeur_terminal / Math.pow(1 + wacc, 5)
    
    const valeur_entreprise = valeur_actuelle + va_terminal
    const valeur_actions = valeur_entreprise - bilan.dettes_financieres
    
    setValorisation(prev => ({ ...prev, valeur_entreprise, valeur_actions }))
  }

  // Élite Generation Functions
  const generateSection = async (sectionId) => {
    setGenerating(true)
    setRapport('')
    
    try {
      let prompt = ''
      
      switch (sectionId) {
        case 'entreprise':
          prompt = `Génère une analyse d'entreprise de niveau cabinet pour:
          Nom: ${entreprise.nom}
          Secteur: ${entreprise.secteur}
          Forme juridique: ${entreprise.forme_juridique}
          Année création: ${entreprise.annee_creation}
          Effectif: ${entreprise.effectif}
          Capital social: ${entreprise.capital_social} FCFA
          Pays: ${entreprise.pays}
          
          Inclus: analyse sectorielle, positionnement concurrentiel, forces/faiblesses, perspectives de croissance.`
          break
          
        case 'compte_resultat':
          prompt = `Génère une analyse de niveau cabinet du compte de résultat:
          Chiffre d'affaires: ${compteResultat.chiffre_affaires.toLocaleString()} FCFA
          Achats: ${compteResultat.achats.toLocaleString()} FCFA
          Services extérieurs: ${compteResultat.services_exterieurs.toLocaleString()} FCFA
          Salaires et charges: ${compteResultat.salaires_charges.toLocaleString()} FCFA
          Dotations: ${compteResultat.dotations.toLocaleString()} FCFA
          Charges financières: ${compteResultat.charges_financieres.toLocaleString()} FCFA
          Impôts et taxes: ${compteResultat.impots_taxes.toLocaleString()} FCFA
          Résultat exploitation: ${compteResultat.resultat_exploitation.toLocaleString()} FCFA
          Résultat net: ${compteResultat.resultat_net.toLocaleString()} FCFA
          
          Inclus: analyse de la structure des coûts, marges, rentabilité, comparaison sectorielle.`
          break
          
        case 'bilan':
          prompt = `Génère une analyse de niveau cabinet du bilan:
          Immobilisations: ${bilan.immobilisations.toLocaleString()} FCFA
          Stocks: ${bilan.stocks.toLocaleString()} FCFA
          Créances clients: ${bilan.creances_clients.toLocaleString()} FCFA
          Disponibilités: ${bilan.disponibilites.toLocaleString()} FCFA
          Capital social: ${bilan.capital_social.toLocaleString()} FCFA
          Réserves: ${bilan.reserves.toLocaleString()} FCFA
          Résultat net: ${bilan.resultat_net.toLocaleString()} FCFA
          Dettes financières: ${bilan.dettes_financieres.toLocaleString()} FCFA
          Dettes fournisseurs: ${bilan.dettes_fournisseurs.toLocaleString()} FCFA
          Dettes fiscales et sociales: ${bilan.dettes_fiscales_sociales.toLocaleString()} FCFA
          
          Inclus: analyse de la structure financière, équilibre, solvabilité, fonds de roulement.`
          break
          
        case 'tresorerie':
          prompt = `Génère une analyse de niveau cabinet de la trésorerie:
          Flux d'exploitation: ${tresorerie.flux_exploitation.toLocaleString()} FCFA
          Flux d'investissement: ${tresorerie.flux_investissement.toLocaleString()} FCFA
          Flux de financement: ${tresorerie.flux_financement.toLocaleString()} FCFA
          Variation trésorerie: ${tresorerie.variation_tresorerie.toLocaleString()} FCFA
          Trésorerie finale: ${tresorerie.tresorerie_finale.toLocaleString()} FCFA
          
          Inclus: analyse des flux, besoin en fonds de roulement, capacité d'autofinancement.`
          break
          
        case 'ratios':
          prompt = `Génère une analyse de niveau cabinet des ratios financiers:
          Rentabilité:
          - Marge nette: ${ratios.rentabilite.marge_nette.toFixed(2)}%
          - ROE: ${ratios.rentabilite.roe.toFixed(2)}%
          - ROA: ${ratios.rentabilite.roa.toFixed(2)}%
          
          Liquidité:
          - Current ratio: ${ratios.liquidite.current_ratio.toFixed(2)}
          - Quick ratio: ${ratios.liquidite.quick_ratio.toFixed(2)}
          - Cash ratio: ${ratios.liquidite.cash_ratio.toFixed(2)}
          
          Endettement:
          - Debt to equity: ${ratios.endettement.debt_to_equity.toFixed(2)}
          - Debt to assets: ${ratios.endettement.debt_to_assets.toFixed(2)}
          - Interest coverage: ${ratios.endettement.interest_coverage.toFixed(2)}
          
          Activité:
          - Rotation stocks: ${ratios.activite.rotation_stocks.toFixed(2)}
          - Délai client: ${ratios.activite.delai_client.toFixed(0)} jours
          - Délai fournisseur: ${ratios.activite.delai_fournisseur.toFixed(0)} jours
          
          Inclus: interprétation détaillée, comparaison sectorielle, tendances.`
          break
          
        case 'valorisation':
          prompt = `Génère une analyse de niveau cabinet de la valorisation:
          Méthode: ${valorisation.method}
          WACC: ${(valorisation.wacc * 100).toFixed(1)}%
          Croissance: ${(valorisation.croissance * 100).toFixed(1)}%
          Multiple: ${valorisation.multiple}
          Valeur entreprise: ${valorisation.valeur_entreprise.toLocaleString()} FCFA
          Valeur actions: ${valorisation.valeur_actions.toLocaleString()} FCFA
          
          Inclus: méthodes DCF, comparables, synergies, sensibilité.`
          break
          
        case 'credit':
          prompt = `Génère une analyse de niveau cabinet du crédit:
          Note: ${credit.note}
          Capacité d'endettement: ${credit.capacite_endettement.toLocaleString()} FCFA
          Ratio couverture: ${credit.ratio_couverture.toFixed(2)}
          Recommandations: ${credit.recommandations.join(', ')}
          Garanties: ${credit.garanties.join(', ')}
          
          Inclus: analyse de la capacité de remboursement, risques, covenants.`
          break
          
        case 'risques':
          prompt = `Génère une analyse de niveau cabinet des risques:
          ${risques.map(r => `- ${r.risque}: probabilité ${r.probabilite}/5, impact ${r.impact}/5, mitigation: ${r.mitigation}`).join('\n')}
          
          Inclus: matrice des risques, plan de mitigation, assurance.`
          break
          
        case 'rapport':
          prompt = `Génère un rapport financier de niveau cabinet synthétique intégrant toutes les analyses précédentes pour l'entreprise ${entreprise.nom}. Inclus: résumé exécutif, points forts, points faibles, recommandations stratégiques, perspectives.`
          break
      }
      
      await bgJob.run(
        async () => {
          const response = await callGroq(prompt, 3000)
          return cleanIATextLight(response)
        },
        {
          onDone: (result) => {
            setRapport(result)
            setGenerating(false)
          },
          onError: (error) => {
            setRapport(`Erreur: ${error.message}`)
            setGenerating(false)
          }
        }
      )
    } catch (error) {
      setRapport(`Erreur: ${error.message}`)
      setGenerating(false)
    }
  }

  const exportPDF = async () => {
    try {
      const content = containerRef.current
      if (!content) {
        alert('Contenu non trouvé pour export PDF')
        return
      }
      
      await bgJob.run(
        async () => {
          return await exportToPDF(content, {
            filename: `rapport-finance-elite-${entreprise.nom.replace(/\s+/g, '-')}.pdf`,
            includeHeader: true,
            includeFooter: true,
            headerText: `Rapport Financier Élite - ${entreprise.nom}`,
            footerText: 'Généré avec Abawi IA'
          })
        },
        {
          onDone: () => {
            alert('PDF exporté avec succès')
          },
          onError: (error) => {
            alert(`Erreur export PDF: ${error.message}`)
          }
        }
      )
    } catch (error) {
      alert(`Erreur: ${error.message}`)
    }
  }

  const exportExcel = async () => {
    try {
      const data = {
        entreprise,
        compte_resultat: compteResultat,
        bilan: bilan,
        tresorerie: tresorerie,
        ratios: ratios,
        valorisation: valorisation
      }
      
      await exportToExcel(data, {
        filename: `finance-elite-${entreprise.nom.replace(/\s+/g, '-')}.xlsx`,
        sheetName: 'Rapport Finance Élite'
      })
    } catch (error) {
      alert(`Erreur export Excel: ${error.message}`)
    }
  }

  // Auto-calculs
  useEffect(() => {
    calculerResultatNet()
    calculerBilanEquilibre()
    calculerTresorerie()
    calculerRatios()
    calculerValorisation()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [compteResultat.chiffre_affaires, compteResultat.achats, compteResultat.services_exterieurs, 
      compteResultat.salaires_charges, compteResultat.dotations, compteResultat.charges_financieres, 
      compteResultat.impots_taxes, bilan.immobilisations, bilan.stocks, bilan.creances_clients])

  // Élite Render
  return (
    <div className="finance-elite-container">
      <SEO
        title="Finance Élite — Analyse financière OHADA / BCEAO"
        description="Analyse financière complète conforme OHADA/SYSCOHADA : ratios, valorisation DCF, score crédit, bilan, compte de résultat, trésorerie. Rapport IA exportable PDF/Excel."
        keywords="analyse financière OHADA, SYSCOHADA, ratios financiers, valorisation DCF, score crédit BCEAO, bilan, compte de résultat, trésorerie, UEMOA"
      />
      <main className="finance-elite-main">
        {/* Header */}
        <header className="finance-elite-header">
          <h1 className="finance-elite-title">Finance Élite</h1>
          <p className="finance-elite-subtitle">Analyse financière avancée CFA avec modèles OHADA et évaluation DCF</p>
        </header>

        {/* Navigation */}
        <nav className="finance-elite-nav">
          {SECTIONS.map((toolSection) => (
            <button
              key={toolSection.id}
              onClick={() => setSection(toolSection.id)}
              className={`finance-elite-nav-btn ${section === toolSection.id ? 'active' : ''}`}
            >
              <span>{toolSection.icon}</span>
              {toolSection.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div ref={containerRef}>
          {section === 'entreprise' && (
            <section className="finance-elite-section finance-elite-fade-in">
              <h2 className="finance-elite-section-title">
                <span className="icon">🏢</span>
                Informations Entreprise
              </h2>
              <div className="finance-elite-form-grid">
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Nom de l'entreprise</label>
                  <input
                    type="text"
                    value={entreprise.nom}
                    onChange={(e) => setEntreprise(prev => ({ ...prev, nom: e.target.value }))}
                    className="finance-elite-input"
                  />
                </div>
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Secteur</label>
                  <select
                    value={entreprise.secteur}
                    onChange={(e) => setEntreprise(prev => ({ ...prev, secteur: e.target.value }))}
                    className="finance-elite-select"
                  >
                    <option value="Commerce">Commerce</option>
                    <option value="Services">Services</option>
                    <option value="Industrie">Industrie</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Technologie">Technologie</option>
                    <option value="Transport">Transport</option>
                    <option value="Construction">Construction</option>
                    <option value="Santé">Santé</option>
                    <option value="Éducation">Éducation</option>
                  </select>
                </div>
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Forme juridique</label>
                  <select
                    value={entreprise.forme_juridique}
                    onChange={(e) => setEntreprise(prev => ({ ...prev, forme_juridique: e.target.value }))}
                    className="finance-elite-select"
                  >
                    <option value="SARL">SARL</option>
                    <option value="SAS">SAS</option>
                    <option value="SA">SA</option>
                    <option value="SNC">SNC</option>
                    <option value="SCS">SCS</option>
                    <option value="Entreprise Individuelle">Entreprise Individuelle</option>
                    <option value="Coopérative">Coopérative</option>
                    <option value="GIE">GIE</option>
                  </select>
                </div>
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Effectif</label>
                  <input
                    type="number"
                    value={entreprise.effectif}
                    onChange={(e) => setEntreprise(prev => ({ ...prev, effectif: parseInt(e.target.value) }))}
                    className="finance-elite-input"
                  />
                </div>
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Capital social (FCFA)</label>
                  <input
                    type="number"
                    value={entreprise.capital_social}
                    onChange={(e) => setEntreprise(prev => ({ ...prev, capital_social: parseInt(e.target.value) }))}
                    className="finance-elite-input"
                  />
                </div>
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Pays</label>
                  <input
                    type="text"
                    value={entreprise.pays}
                    onChange={(e) => setEntreprise(prev => ({ ...prev, pays: e.target.value }))}
                    className="finance-elite-input"
                  />
                </div>
              </div>
            </section>
          )}

          {section === 'compte_resultat' && (
            <div>
              <h2 className="finance-elite-section-title">Compte de Résultat</h2>
              <div className="finance-elite-form-grid">
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Chiffre d'affaires (FCFA)</label>
                  <input
                    type="number"
                    value={compteResultat.chiffre_affaires}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, chiffre_affaires: parseInt(e.target.value) }))}
                    className="finance-elite-input"
                  />
                </div>
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Achats (FCFA)</label>
                  <input
                    type="number"
                    value={compteResultat.achats}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, achats: parseInt(e.target.value) }))}
                    className="finance-elite-input"
                  />
                </div>
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Services extérieurs (FCFA)</label>
                  <input
                    type="number"
                    value={compteResultat.services_exterieurs}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, services_exterieurs: parseInt(e.target.value) }))}
                    className="finance-elite-input"
                  />
                </div>
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Salaires et charges (FCFA)</label>
                  <input
                    type="number"
                    value={compteResultat.salaires_charges}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, salaires_charges: parseInt(e.target.value) }))}
                    className="finance-elite-input"
                  />
                </div>
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Dotations (FCFA)</label>
                  <input
                    type="number"
                    value={compteResultat.dotations}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, dotations: parseInt(e.target.value) }))}
                    className="finance-elite-input"
                  />
                </div>
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Charges financières (FCFA)</label>
                  <input
                    type="number"
                    value={compteResultat.charges_financieres}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, charges_financieres: parseInt(e.target.value) }))}
                    className="finance-elite-input"
                  />
                </div>
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Impôts et taxes (FCFA)</label>
                  <input
                    type="number"
                    value={compteResultat.impots_taxes}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, impots_taxes: parseInt(e.target.value) }))}
                    className="finance-elite-input"
                  />
                </div>
              </div>

              <div className="finance-elite-card" style={{ marginTop: 20 }}>
                <div className="finance-elite-form-grid">
                  <div className="finance-elite-form-group">
                    <div className="finance-elite-metric-label">Résultat d'exploitation</div>
                    <div className="finance-elite-metric-value">{compteResultat.resultat_exploitation.toLocaleString()} FCFA</div>
                  </div>
                  <div className="finance-elite-form-group">
                    <div className="finance-elite-metric-label">Résultat net</div>
                    <div className="finance-elite-metric-value" style={themed({ color: compteResultat.resultat_net >= 0 ? 'var(--success-text)' : 'var(--error-text)' })}>
                      {compteResultat.resultat_net.toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={themed({ color: 'var(--text-muted)', fontSize: '0.9rem' })}>Marge nette</div>
                    <div style={themed({ color: 'var(--gold)', fontSize: '1.2rem', fontWeight: 700 })}>
                      {((compteResultat.resultat_net / compteResultat.chiffre_affaires) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'bilan' && (
            <div>
              <h2 className="finance-elite-section-title">Bilan</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
                <div className="finance-elite-card">
                  <h3 style={themed({ color: 'var(--warning-text)', marginBottom: 14, fontSize: '0.95rem', fontWeight: 700 })}>Actif</h3>
                  <div className="finance-elite-form-grid">
                    <div className="finance-elite-form-group">
                      <label className="finance-elite-label">Immobilisations (FCFA)</label>
                      <input
                        type="number"
                        value={bilan.immobilisations}
                        onChange={(e) => setBilan(prev => ({ ...prev, immobilisations: parseInt(e.target.value) }))}
                        className="finance-elite-input"
                      />
                    </div>
                    <div className="finance-elite-form-group">
                      <label className="finance-elite-label">Stocks (FCFA)</label>
                      <input
                        type="number"
                        value={bilan.stocks}
                        onChange={(e) => setBilan(prev => ({ ...prev, stocks: parseInt(e.target.value) }))}
                        className="finance-elite-input"
                      />
                    </div>
                    <div className="finance-elite-form-group">
                      <label className="finance-elite-label">Créances clients (FCFA)</label>
                      <input
                        type="number"
                        value={bilan.creances_clients}
                        onChange={(e) => setBilan(prev => ({ ...prev, creances_clients: parseInt(e.target.value) }))}
                        className="finance-elite-input"
                      />
                    </div>
                    <div className="finance-elite-form-group">
                      <label className="finance-elite-label">Disponibilités (FCFA)</label>
                      <input
                        type="number"
                        value={bilan.disponibilites}
                        onChange={(e) => setBilan(prev => ({ ...prev, disponibilites: parseInt(e.target.value) }))}
                        className="finance-elite-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="finance-elite-card">
                  <h3 style={themed({ color: 'var(--accent)', marginBottom: 14, fontSize: '0.95rem', fontWeight: 700 })}>Passif</h3>
                  <div className="finance-elite-form-grid">
                    <div className="finance-elite-form-group">
                      <label className="finance-elite-label">Capital social (FCFA)</label>
                      <input
                        type="number"
                        value={bilan.capital_social}
                        onChange={(e) => setBilan(prev => ({ ...prev, capital_social: parseInt(e.target.value) }))}
                        className="finance-elite-input"
                      />
                    </div>
                    <div className="finance-elite-form-group">
                      <label className="finance-elite-label">Réserves (FCFA)</label>
                      <input
                        type="number"
                        value={bilan.reserves}
                        onChange={(e) => setBilan(prev => ({ ...prev, reserves: parseInt(e.target.value) }))}
                        className="finance-elite-input"
                      />
                    </div>
                    <div className="finance-elite-form-group">
                      <label className="finance-elite-label">Dettes financières (FCFA)</label>
                      <input
                        type="number"
                        value={bilan.dettes_financieres}
                        onChange={(e) => setBilan(prev => ({ ...prev, dettes_financieres: parseInt(e.target.value) }))}
                        className="finance-elite-input"
                      />
                    </div>
                    <div className="finance-elite-form-group">
                      <label className="finance-elite-label">Dettes fournisseurs (FCFA)</label>
                      <input
                        type="number"
                        value={bilan.dettes_fournisseurs}
                        onChange={(e) => setBilan(prev => ({ ...prev, dettes_fournisseurs: parseInt(e.target.value) }))}
                        className="finance-elite-input"
                      />
                    </div>
                    <div className="finance-elite-form-group">
                      <label className="finance-elite-label">Dettes fiscales et sociales (FCFA)</label>
                      <input
                        type="number"
                        value={bilan.dettes_fiscales_sociales}
                        onChange={(e) => setBilan(prev => ({ ...prev, dettes_fiscales_sociales: parseInt(e.target.value) }))}
                        className="finance-elite-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Actif</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
                      {(bilan.immobilisations + bilan.stocks + bilan.creances_clients + bilan.disponibilites).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Passif</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
                      {(bilan.capital_social + bilan.reserves + bilan.resultat_net + bilan.dettes_financieres + bilan.dettes_fournisseurs + bilan.dettes_fiscales_sociales).toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'ratios' && (
            <div>
              <h2 className="finance-elite-section-title">Ratios Financiers</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                  <h3 style={{ color: '#F0B429', marginBottom: 16 }}>Rentabilité</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Marge nette</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.rentabilite.marge_nette.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ROE (Return on Equity)</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.rentabilite.roe.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ROA (Return on Assets)</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.rentabilite.roa.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                  <h3 style={{ color: '#3B82F6', marginBottom: 16 }}>Liquidité</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Current Ratio</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.liquidite.current_ratio.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Quick Ratio</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.liquidite.quick_ratio.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cash Ratio</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.liquidite.cash_ratio.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                  <h3 style={{ color: '#EF4444', marginBottom: 16 }}>Endettement</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Debt to Equity</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.endettement.debt_to_equity.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Debt to Assets</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.endettement.debt_to_assets.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Interest Coverage</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.endettement.interest_coverage.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                  <h3 style={{ color: '#22C55E', marginBottom: 16 }}>Activité</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rotation des stocks</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.activite.rotation_stocks.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Délai client (jours)</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.activite.delai_client.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Délai fournisseur (jours)</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {ratios.activite.delai_fournisseur.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'valorisation' && (
            <div>
              <h2 className="finance-elite-section-title">Évaluation d'Entreprise</h2>
              <div className="finance-elite-form-grid">
                <div className="finance-elite-form-group">
                  <label className="finance-elite-label">Méthode d'évaluation</label>
                  <select
                    value={valorisation.method}
                    onChange={(e) => setValorisation(prev => ({ ...prev, method: e.target.value }))}
                    className="finance-elite-select"
                  >
                    <option value="dcf">DCF (Discounted Cash Flow)</option>
                    <option value="multiples">Multiples</option>
                    <option value="actif_net">Actif Net Comptable</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>WACC (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={valorisation.wacc}
                    onChange={(e) => setValorisation(prev => ({ ...prev, wacc: parseFloat(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid #3B82F6',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Croissance (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={valorisation.croissance}
                    onChange={(e) => setValorisation(prev => ({ ...prev, croissance: parseFloat(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid #3B82F6',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Multiple (EBITDA)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={valorisation.multiple}
                    onChange={(e) => setValorisation(prev => ({ ...prev, multiple: parseFloat(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid #3B82F6',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {section === 'risques' && (
            <div>
              <h2 className="finance-elite-section-title">Analyse des Risques</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                  <thead>
                    <tr style={{ background: '#0D1117' }}>
                      <th style={{ padding: 16, textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Risque</th>
                      <th style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Probabilité</th>
                      <th style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Impact</th>
                      <th style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Niveau</th>
                      <th style={{ padding: 16, textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Mitigation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risques.map(r => {
                      const niveau = r.probabilite * r.impact
                      const couleur = niveau >= 15 ? '#EF4444' : niveau >= 8 ? '#F59E0B' : '#22C55E'
                      const niveauText = niveau >= 15 ? 'Élevé' : niveau >= 8 ? 'Moyen' : 'Faible'
                      
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: 16, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.risque}</td>
                          <td style={{ padding: 16, textAlign: 'center' }}>
                            <input type="range" min="1" max="5" value={r.probabilite}
                              onChange={e => setRisques(rs => rs.map(x => x.id === r.id ? { ...x, probabilite: parseInt(e.target.value) } : x))}
                              style={{ width: '80px' }} />
                            <span style={{ color: '#F0B429', fontWeight: 700, marginLeft: '8px' }}>{r.probabilite}</span>
                          </td>
                          <td style={{ padding: 16, textAlign: 'center' }}>
                            <input type="range" min="1" max="5" value={r.impact}
                              onChange={e => setRisques(rs => rs.map(x => x.id === r.id ? { ...x, impact: parseInt(e.target.value) } : x))}
                              style={{ width: '80px' }} />
                            <span style={{ color: '#ef4444', fontWeight: 700, marginLeft: '8px' }}>{r.impact}</span>
                          </td>
                          <td style={{ padding: 16, textAlign: 'center' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, background: couleur + '20', color: couleur }}>
                              {niveauText}
                            </span>
                          </td>
                          <td style={{ padding: 16, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.mitigation}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Generated Content Display */}
          {rapport && (
            <div style={{ marginTop: 32 }}>
              <div className="finance-elite-card" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1rem' }}>Analyse Élite Générée</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={exportPDF} className="finance-elite-btn finance-elite-btn-primary">
                    📄 Export PDF
                  </button>
                  <button onClick={exportExcel} className="finance-elite-btn" style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: 'white' }}>
                    📊 Export Excel
                  </button>
                </div>
              </div>
              <RichDoc text={rapport} />
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <button
            onClick={() => generateSection(section)}
            disabled={generating}
            style={{
              padding: '16px 48px',
              background: generating ? '#64748B' : 'linear-gradient(135deg, #F0B429, #F59E0B)',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: 12,
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: generating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(240, 180, 41, 0.3)'
            }}
          >
            {generating ? 'Génération en cours...' : `🚀 Générer Analyse ${SECTIONS.find(s => s.id === section)?.label}`}
          </button>
        </div>

      {/* Footer */}
      <footer className="finance-elite-footer">
        <div className="finance-elite-footer-content">
          Finance Élite - Propulsé par Abawi IA
        </div>
        <div className="finance-elite-footer-badges">
          <span>⚖️ Normes OHADA</span>
          <span>💎 Évaluation DCF</span>
          <span>📈 Ratios Avancés</span>
          <span>📄 Export PDF/Excel</span>
        </div>
      </footer>
    </main>
  </div>
  )
}
