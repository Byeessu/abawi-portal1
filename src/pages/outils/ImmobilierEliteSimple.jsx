import { useState } from 'react'
import { exportToPDF, exportExcel as exportToExcel } from '../../lib/generatePDF'
import { useWorkspace } from '../../hooks/useWorkspace'
import { useBackgroundJob } from '../../hooks/useBackgroundJob'
import { cleanIATextLight } from '../../lib/cleanText'
import { useAuth } from '../../context/AuthContext'
import { useDraftAutoSave } from '../../hooks/useDraftAutoSave'
import { useToolAccess } from '../../hooks/useToolAccess'

import { callGroq as groqCall } from '../../lib/groqClient'
import SEO from '../../components/SEO'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import RichDoc from '../../components/RichDoc'

const IMMO_SYSTEM = `Tu es un expert immobilier senior spécialisé dans le marché sénégalais et ouest-africain, avec une expertise en financement bancaire, droit immobilier OHADA et investissement locatif. Tu rédiges des analyses et documents immobiliers professionnels, conformes à la législation sénégalaise.

RÈGLES DE FORMATAGE STRICTES :
- ## (deux dièses + espace) pour les sections principales, ### pour les sous-sections
- **texte** pour les termes importants en gras (jamais ***)
- Listes avec "- " (jamais * ou ***)
- Jamais --- *** ### /// seuls sur une ligne
- Paragraphes bien espacés, ponctuation française soignée
- Pas de symboles parasites, pas de caractères spéciaux isolés`

const callGroqImmo = (prompt) => groqCall(prompt, { maxTokens: 2500, temperature: 0.15, system: IMMO_SYSTEM })

// Élite Immobilier Sections
const SECTIONS = [
  { id: 'simulation', label: 'Simulation investissement', icon: '🏢', color: '#0EA5E9' },
  { id: 'simulation_locative', label: 'Simulation locative', icon: '🏠', color: '#8B5CF6' },
  { id: 'simulation_construction', label: 'Simulation construction', icon: '🏗️', color: '#F59E0B' },
  { id: 'annonces', label: 'Annonces', icon: '📣', color: '#EC4899' },
  { id: 'comparatif', label: 'Achat vs Location', icon: '⚖️', color: '#22D3EE' },
  { id: 'financement', label: 'Financement bancaire', icon: '🏦', color: '#22C55E' },
  { id: 'estimation', label: 'Estimation du bien', icon: '💰', color: '#FB923C' },
  { id: 'contrat_bail', label: 'Contrat de bail', icon: '📝', color: '#34D399' },
  { id: 'business_plan', label: 'Business plan immo', icon: '📊', color: '#F43F5E' },
]

// Élite Immobilier Component
export default function ImmobilierEliteSimple() {
  const { membre } = useAuth()
  const tool = useToolAccess('immobilier', 'immobilier_elite')
  const [section, setSection] = useState('simulation')
  const [showPayment, setShowPayment] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [docGenere, setDocGenere] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [uploadedContext, setUploadedContext] = useState('')
  const workspace = useWorkspace(`immo-elite-${section}`)
  const bgJob = useBackgroundJob(`immo-elite-${section}`, `Immobilier Élite - ${SECTIONS.find(s => s.id === section)?.label || section}`, 'anonymous', setDocGenere)

  // Élite State Management
  const [sim, setSim] = useState({
    prix_achat: 0, frais_notaire_pct: 5, travaux: 0,
    loyer_mensuel: 0, charges_mensuelles: 0, taxe_fonciere: 0,
    vacance_locative_pct: 5, credit_mensuel: 0, horizon_ans: 10,
    apreciation_annuelle: 3,
  })

  const [simLoc, setSimLoc] = useState({
    surface: 0, loyer_m2: 0, charges_mensuelles: 0,
    vacance_locative_pct: 5, entretien_annuel_pct: 1, taxe_fonciere_annuelle: 0,
    horizon_ans: 10, apreciation_loyer_annuelle: 2,
  })

  const [simConst, setSimConst] = useState({
    terrain_m2: 0, prix_terrain_m2: 0, surface_batie_m2: 0,
    cout_construction_m2: 0, frais_permis_pct: 3, honoraires_architecte_pct: 8,
    duree_construction_mois: 12, taux_financement: 6, apport_personnel_pct: 30,
    horizon_ans: 20,
  })

  const [annonce, setAnnonce] = useState({
    titre: '', type_bien: '', surface: 0, nb_pieces: 0, nb_chambres: 0,
    nb_sdb: 0, description: '', adresse: '', ville: '', quartier: '',
    prix: 0, charges_mensuelles: 0, taxe_fonciere: 0,
    annee_construction: 0, etat_general: '', chauffage: '', parking: false,
    balcon: false, jardin: false, piscine: false, ascenseur: false,
    photos: [], contact_nom: '', contact_telephone: '', contact_email: '',
  })

  const [comparatif, setComparatif] = useState({
    loyer_mensuel: 0, charges_mensuelles: 0, apport_initial: 0,
    prix_achat: 0, frais_notaire: 0, travaux: 0,
    duree_credit_annees: 20, taux_credit: 4.5, taxe_fonciere_annuelle: 0,
    entretien_annuel: 0, vacance_locative_pct: 5,
    horizon_ans: 10, inflation_loyers: 2, appreciation_biens: 3,
  })

  const [financement, setFinancement] = useState({
    prix_achat: 0, apport_personnel: 0, duree_annees: 20,
    taux_nominal: 4.5, taux_assurance: 0.3, frais_dossier: 0,
    garantie_pret: 0, mensualite: 0, cout_total_credit: 0,
    taux_endettement: 0, revenus_mensuels: 0,
  })

  const [estimation, setEstimation] = useState({
    adresse: '', surface: 0, nb_pieces: 0, type_bien: '',
    annee_construction: 0, etat_general: '', quartier: '',
    ville: '', standing: '', vue: '', exposition: '',
    parking: false, balcon: false, jardin: false, ascenseur: false,
    prix_estime: 0, prix_min: 0, prix_max: 0,
    comparables: [], facteurs_ajustement: [],
  })

  const [contratBail, setContratBail] = useState({
    type_bail: 'habitation', proprietaire: '', locataire: '',
    adresse_bien: '', surface: 0, nb_pieces: 0,
    date_debut: '', duree_mois: 36, loyer_mensuel: 0,
    charges_mensuelles: 0, depot_garantie_mois: 2,
    date_paiement: '5', mode_paiement: 'virement',
    charges_particulieres: [], obligations_locataire: [],
    obligations_proprietaire: [], motifs_resiliation: [],
    juridiction: 'Tribunal de Dakar',
  })

  const [businessPlan, setBusinessPlan] = useState({
    nom_projet: '', type_projet: '', localisation: '',
    investissement_total: 0, apport_personnel: 0, financement_externe: 0,
    description: '', marche_cible: '', concurrents: [],
    revenus_annuels_previsionnels: [], charges_annuelles_previsionnelles: [],
    rentabilite_previsionnelle: [], risques: [], mitigation_risques: [],
    calendrier_realisation: [], equipe_projet: [],
  })

  // Persistence — auto-save form data (30 days)
  useDraftAutoSave(
    'abawi-immo-draft',
    { sim, simLoc, simConst, annonce, comparatif, financement, estimation, contratBail, businessPlan },
    {
      onRestore: (d) => {
        if (d?.sim) setSim(d.sim)
        if (d?.simLoc) setSimLoc(d.simLoc)
        if (d?.simConst) setSimConst(d.simConst)
        if (d?.annonce) setAnnonce(d.annonce)
        if (d?.comparatif) setComparatif(d.comparatif)
        if (d?.financement) setFinancement(d.financement)
        if (d?.estimation) setEstimation(d.estimation)
        if (d?.contratBail) setContratBail(d.contratBail)
        if (d?.businessPlan) setBusinessPlan(d.businessPlan)
      }
    }
  )

  // L'outil reste utilisable pour tous; le verrouillage intervient au moment de l'export final.

  // Élite Generation Functions
  const generateDocument = async (sectionId) => {
    setGenerating(true)
    setDocGenere('')
    
    try {
      let prompt = ''
      
      switch (sectionId) {
        case 'simulation':
          prompt = `Génère une simulation d'investissement immobilier de niveau cabinet pour:
          Prix d'achat: ${sim.prix_achat} FCFA
          Frais notaire: ${sim.frais_notaire_pct}%
          Travaux: ${sim.travaux} FCFA
          Loyer mensuel: ${sim.loyer_mensuel} FCFA
          Charges mensuelles: ${sim.charges_mensuelles} FCFA
          Taxe foncière: ${sim.taxe_fonciere} FCFA/an
          Vacance locative: ${sim.vacance_locative_pct}%
          Crédit mensuel: ${sim.credit_mensuel} FCFA
          Horizon: ${sim.horizon_ans} ans
          Appréciation annuelle: ${sim.apreciation_annuelle}%
          
          Inclus: TRI, cash flows, rentabilité, analyse de sensibilité.`
          break
          
        case 'simulation_locative':
          prompt = `Génère une simulation locative de niveau cabinet pour:
          Surface: ${simLoc.surface} m²
          Loyer au m²: ${simLoc.loyer_m2} FCFA
          Charges mensuelles: ${simLoc.charges_mensuelles} FCFA
          Vacance locative: ${simLoc.vacance_locative_pct}%
          Entretien annuel: ${simLoc.entretien_annuel_pct}%
          Taxe foncière: ${simLoc.taxe_fonciere_annuelle} FCFA
          Horizon: ${simLoc.horizon_ans} ans
          Appréciation loyers: ${simLoc.apreciation_loyer_annuelle}%
          
          Inclus: rendement, cash flows, optimisation fiscale.`
          break
          
        case 'financement':
          prompt = `Génère une analyse de financement bancaire de niveau cabinet pour:
          Prix d'achat: ${financement.prix_achat} FCFA
          Apport personnel: ${financement.apport_personnel} FCFA
          Durée: ${financement.duree_annees} ans
          Taux nominal: ${financement.taux_nominal}%
          Taux assurance: ${financement.taux_assurance}%
          Revenus mensuels: ${financement.revenus_mensuels} FCFA
          
          Inclus: capacité d'emprunt, mensualités, taux d'endettement, ratios bancaires.`
          break
          
        case 'estimation':
          prompt = `Génère une estimation immobilière de niveau cabinet pour:
          Adresse: ${estimation.adresse}
          Surface: ${estimation.surface} m²
          Type: ${estimation.type_bien}
          Année construction: ${estimation.annee_construction}
          État: ${estimation.etat_general}
          Quartier: ${estimation.quartier}
          Ville: ${estimation.ville}
          Standing: ${estimation.standing}
          
          Inclus: méthode comparative, ajustements, fourchette de prix, facteurs de valeur.`
          break
          
        case 'contrat_bail':
          prompt = `Génère un contrat de bail de niveau cabinet pour:
          Type bail: ${contratBail.type_bail}
          Propriétaire: ${contratBail.proprietaire}
          Locataire: ${contratBail.locataire}
          Adresse: ${contratBail.adresse_bien}
          Surface: ${contratBail.surface} m²
          Pièces: ${contratBail.nb_pieces}
          Durée: ${contratBail.duree_mois} mois
          Loyer: ${contratBail.loyer_mensuel} FCFA
          Charges: ${contratBail.charges_mensuelles} FCFA
          Dépôt garantie: ${contratBail.depot_garantie_mois} mois
          
          Inclus: clauses légales, obligations, conformité Code Civil Sénégal.`
          break
          
        case 'business_plan':
          prompt = `Génère un business plan immobilier de niveau cabinet pour:
          Projet: ${businessPlan.nom_projet}
          Type: ${businessPlan.type_projet}
          Localisation: ${businessPlan.localisation}
          Investissement total: ${businessPlan.investissement_total} FCFA
          Apport personnel: ${businessPlan.apport_personnel} FCFA
          Financement externe: ${businessPlan.financement_externe} FCFA
          Description: ${businessPlan.description}
          Marché cible: ${businessPlan.marche_cible}
          
          Inclus: analyse marché, plan financier, rentabilité, risques.`
          break
      }
      
      await bgJob.run(
        async () => {
          const response = await callGroqImmo(prompt)
          return cleanIATextLight(response)
        },
        {
          onDone: (result) => {
            setDocGenere(result)
            setGenerating(false)
          },
          onError: (error) => {
            setDocGenere(`Erreur: ${error.message}`)
            setGenerating(false)
          }
        }
      )
    } catch (error) {
      setDocGenere(`Erreur: ${error.message}`)
      setGenerating(false)
    }
  }

  const exportPDF = async () => {
    if (!tool.allowed) { setShowPayment(true); return }
    if (!tool.unlimited) { const res = await tool.debit(); if (!res.ok) { alert('Crédits insuffisants'); setShowPayment(true); return } }
    try {
      const content = document.getElementById('immo-content')
      if (!content) { alert('Contenu non trouvé pour export PDF'); return }
      await bgJob.run(
        async () => await exportToPDF(content, { filename: `immobilier-elite-${section}-${Date.now()}.pdf`, includeHeader: true, includeFooter: true }),
        { onDone: () => alert('PDF exporté avec succès'), onError: (error) => alert(`Erreur export PDF: ${error.message}`) }
      )
    } catch (error) { alert(`Erreur export PDF: ${error.message}`) }
  }

  const exportExcel = async () => {
    if (!tool.allowed) { setShowPayment(true); return }
    if (!tool.unlimited) { const res = await tool.debit(); if (!res.ok) { alert('Crédits insuffisants'); setShowPayment(true); return } }
    try {
      const data = { simulation: sim, simulation_locative: simLoc, simulation_construction: simConst, annonces, comparatif, financement, estimation, contrat_bail: contratBail, business_plan: businessPlan }
      await exportToExcel(data, { filename: `immobilier-elite-${section}-${Date.now()}.xlsx`, sheetName: 'Immobilier Élite' })
    } catch (error) { alert(`Erreur export Excel: ${error.message}`) }
  }

  // Élite Render
  return (
    <div style={{
      maxWidth: 'min(1440px, 96vw)',
      margin: '0 auto',
      padding: 'clamp(16px, 2.5vw, 32px) clamp(16px, 2.5vw, 40px)',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: 'var(--text-primary)',
      background: 'var(--gradient-hero)',
      minHeight: '100vh'
    }}>
      <SEO
        title="Immobilier Élite — Sénégal & Afrique de l'Ouest"
        description="Simulations de rentabilité immobilière, financement bancaire, actes et contrats conformes à la législation sénégalaise. Analyse locative et investissement."
        keywords="immobilier Sénégal, simulation rentabilité, financement immobilier, acte de vente, contrat de bail, investissement locatif, Loi Mbao, Caisse de Dépôt"
        type="article"
      />
      <ToolInfoPanel
        toolName="Immobilier Élite"
        icon="🏢"
        description="Simulations, financement et actes immobiliers pour l'Afrique de l'Ouest"
        benefits={[
          'Simulez la rentabilité d\'un investissement locatif ou de construction',
          'Comparez les scénarios « achat vs location » pour votre résidence principale',
          'Calculez votre capacité d\'emprunt et le plan d\'amortissement bancaire',
          'Générez annonces, estimations et contrats de bail conformes au droit OHADA',
          'Préparez un business plan immobilier prêt à présenter à un investisseur',
        ]}
        howToUse={[
          'Choisissez la simulation ou le document à produire',
          'Saisissez le prix du bien, les loyers, charges, durée et taux bancaire',
          'Cliquez sur « Générer » — l\'outil calcule rendement, TRI et cash-flow',
          'Pour les actes : complétez les parties (bailleur, locataire, clauses)',
          'Exportez en PDF ou Excel pour votre banquier ou notaire',
        ]}
        tips={[
          'Le taux bancaire par défaut au Sénégal est entre 7 % et 11 % selon le profil',
          'Pour l\'investissement locatif : un rendement brut > 8 % est considéré excellent',
          'Le bail commercial OHADA impose une durée minimale et des clauses spécifiques',
          'Utilisez « Estimation » avant de négocier un prix de vente',
        ]}
      />
      {/* Élite Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3B82F6, #2563EB)', 
        padding: '40px', 
        borderRadius: '20px', 
        marginBottom: '32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(240,180,41,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          transform: 'translate(50%, -50%)'
        }} />
        <h1 style={{ 
          color: '#FFFFFF', 
          fontSize: '3rem', 
          fontWeight: '900',
          margin: '0 0 16px 0',
          position: 'relative',
          zIndex: 1
        }}>
          Immobilier Élite
        </h1>
        <p style={{ 
          color: '#DBEAFE', 
          fontSize: '1.2rem',
          margin: 0,
          position: 'relative',
          zIndex: 1
        }}>
          Simulations immobilières avancées et expertise marché ouest-africain
        </p>
        <div style={{ 
          marginTop: '24px',
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ 
            padding: '8px 16px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '100px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            ? 9 Modules Immobiliers
          </div>
          <div style={{ 
            padding: '8px 16px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '100px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            ? Simulations Avancées
          </div>
          <div style={{ 
            padding: '8px 16px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '100px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            ? Financement Bancaire
          </div>
        </div>
      </div>

      {/* Élite Navigation */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 8,
        marginBottom: 32,
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap'
      }}>
        {SECTIONS.map((toolSection) => (
          <button
            key={toolSection.id}
            onClick={() => setSection(toolSection.id)}
            style={{
              padding: '12px 20px',
              background: section === toolSection.id ? toolSection.color + '20' : 'transparent',
              color: section === toolSection.id ? toolSection.color : '#64748B',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {toolSection.icon} {toolSection.label}
          </button>
        ))}
      </div>

      {/* Élite Content */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 32,
        marginBottom: 32
      }}>
        <div id="immo-content">
          {section === 'simulation' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Simulation d'Investissement Immobilier</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Prix d'achat (FCFA)</label>
                  <input
                    type="number"
                    value={sim.prix_achat}
                    onChange={(e) => setSim(prev => ({ ...prev, prix_achat: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Frais notaire (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sim.frais_notaire_pct}
                    onChange={(e) => setSim(prev => ({ ...prev, frais_notaire_pct: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Travaux (FCFA)</label>
                  <input
                    type="number"
                    value={sim.travaux}
                    onChange={(e) => setSim(prev => ({ ...prev, travaux: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Loyer mensuel (FCFA)</label>
                  <input
                    type="number"
                    value={sim.loyer_mensuel}
                    onChange={(e) => setSim(prev => ({ ...prev, loyer_mensuel: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Charges mensuelles (FCFA)</label>
                  <input
                    type="number"
                    value={sim.charges_mensuelles}
                    onChange={(e) => setSim(prev => ({ ...prev, charges_mensuelles: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Taxe foncière (FCFA/an)</label>
                  <input
                    type="number"
                    value={sim.taxe_fonciere}
                    onChange={(e) => setSim(prev => ({ ...prev, taxe_fonciere: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Vacance locative (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sim.vacance_locative_pct}
                    onChange={(e) => setSim(prev => ({ ...prev, vacance_locative_pct: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Crédit mensuel (FCFA)</label>
                  <input
                    type="number"
                    value={sim.credit_mensuel}
                    onChange={(e) => setSim(prev => ({ ...prev, credit_mensuel: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Horizon (ans)</label>
                  <input
                    type="number"
                    value={sim.horizon_ans}
                    onChange={(e) => setSim(prev => ({ ...prev, horizon_ans: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Appréciation annuelle (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sim.apreciation_annuelle}
                    onChange={(e) => setSim(prev => ({ ...prev, appreciation_annuelle: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Investissement total</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
                      {(sim.prix_achat + (sim.prix_achat * sim.frais_notaire_pct / 100) + sim.travaux).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loyer annuel brut</div>
                    <div style={{ color: '#22C55E', fontSize: '1.1rem', fontWeight: 600 }}>
                      {(sim.loyer_mensuel * 12 * (1 - sim.vacance_locative_pct / 100)).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Rendement brut</div>
                    <div style={{ color: '#F0B429', fontSize: '1.1rem', fontWeight: 600 }}>
                      {(((sim.loyer_mensuel * 12 * (1 - sim.vacance_locative_pct / 100)) / (sim.prix_achat + (sim.prix_achat * sim.frais_notaire_pct / 100) + sim.travaux)) * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cash flow mensuel</div>
                    <div style={{ 
                      color: (sim.loyer_mensuel * (1 - sim.vacance_locative_pct / 100) - sim.charges_mensuelles - sim.taxe_fonciere / 12 - sim.credit_mensuel) >= 0 ? '#22C55E' : '#EF4444', 
                      fontSize: '1.1rem', 
                      fontWeight: 600 
                    }}>
                      {(sim.loyer_mensuel * (1 - sim.vacance_locative_pct / 100) - sim.charges_mensuelles - sim.taxe_fonciere / 12 - sim.credit_mensuel).toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'financement' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Financement Bancaire</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Prix d'achat (FCFA)</label>
                  <input
                    type="number"
                    value={financement.prix_achat}
                    onChange={(e) => setFinancement(prev => ({ ...prev, prix_achat: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Apport personnel (FCFA)</label>
                  <input
                    type="number"
                    value={financement.apport_personnel}
                    onChange={(e) => setFinancement(prev => ({ ...prev, apport_personnel: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Durée (ans)</label>
                  <input
                    type="number"
                    value={financement.duree_annees}
                    onChange={(e) => setFinancement(prev => ({ ...prev, duree_annees: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Taux nominal (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={financement.taux_nominal}
                    onChange={(e) => setFinancement(prev => ({ ...prev, taux_nominal: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Taux assurance (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={financement.taux_assurance}
                    onChange={(e) => setFinancement(prev => ({ ...prev, taux_assurance: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Frais de dossier (FCFA)</label>
                  <input
                    type="number"
                    value={financement.frais_dossier}
                    onChange={(e) => setFinancement(prev => ({ ...prev, frais_dossier: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Revenus mensuels (FCFA)</label>
                  <input
                    type="number"
                    value={financement.revenus_mensuels}
                    onChange={(e) => setFinancement(prev => ({ ...prev, revenus_mensuels: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Montant à emprunter</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
                      {Math.max(0, financement.prix_achat - financement.apport_personnel).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mensualité estimée</div>
                    <div style={{ color: '#F0B429', fontSize: '1.1rem', fontWeight: 600 }}>
                      {Math.round((Math.max(0, financement.prix_achat - financement.apport_personnel) * (financement.taux_nominal / 100 / 12) * Math.pow(1 + financement.taux_nominal / 100 / 12, financement.duree_annees * 12) / (Math.pow(1 + financement.taux_nominal / 100 / 12, financement.duree_annees * 12) - 1)) + (Math.max(0, financement.prix_achat - financement.apport_personnel) * financement.taux_assurance / 100 / 12)).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Taux d'endettement</div>
                    <div style={{ 
                      color: (financement.revenus_mensuels > 0 && ((Math.max(0, financement.prix_achat - financement.apport_personnel) * (financement.taux_nominal / 100 / 12) * Math.pow(1 + financement.taux_nominal / 100 / 12, financement.duree_annees * 12) / (Math.pow(1 + financement.taux_nominal / 100 / 12, financement.duree_annees * 12) - 1) + (Math.max(0, financement.prix_achat - financement.apport_personnel) * financement.taux_assurance / 100 / 12)) / financement.revenus_mensuels * 100) <= 33) ? '#22C55E' : '#EF4444',
                      fontSize: '1.1rem', 
                      fontWeight: 600 
                    }}>
                      {financement.revenus_mensuels > 0
                        ? Math.round((((Math.max(0, financement.prix_achat - financement.apport_personnel) * (financement.taux_nominal / 100 / 12) * Math.pow(1 + financement.taux_nominal / 100 / 12, financement.duree_annees * 12) / (Math.pow(1 + financement.taux_nominal / 100 / 12, financement.duree_annees * 12) - 1)) + (Math.max(0, financement.prix_achat - financement.apport_personnel) * financement.taux_assurance / 100 / 12)) / financement.revenus_mensuels) * 100)
                        : 0}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Capacité d'emprunt</div>
                    <div style={{ color: '#3B82F6', fontSize: '1.1rem', fontWeight: 600 }}>
                      {Math.round(financement.revenus_mensuels * 0.33 * 12 / (financement.taux_nominal / 100) * (1 - Math.pow(1 + financement.taux_nominal / 100 / 12, -financement.duree_annees * 12))).toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Content Display */}
          {docGenere && (
            <div style={{ marginTop: 32 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 20,
                padding: '16px 20px',
                background: 'var(--bg-secondary)',
                borderRadius: 12
              }}>
                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Analyse Immobilière Élite Générée</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={exportPDF}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    📄 Export PDF
                  </button>
                  <button
                    onClick={exportExcel}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    📊 Export Excel
                  </button>
                </div>
              </div>
              <RichDoc text={docGenere} />
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <button
            onClick={() => generateDocument(section)}
            disabled={generating}
            style={{
              padding: '16px 48px',
              background: generating ? '#64748B' : 'linear-gradient(135deg, #F0B429, #F59E0B)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: generating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(240, 180, 41, 0.3)'
            }}
          >
            {generating ? 'Génération en cours...' : `🚀 Générer ${SECTIONS.find(s => s.id === section)?.label} Élite`}
          </button>
        </div>
      </div>

      {/* Élite Footer */}
      <div style={{
        textAlign: 'center',
        padding: 32,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          Immobilier Élite - Propulsé par Abawi IA
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 24, 
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem'
        }}>
          <div>📈 Simulations Avancées</div>
          <div>🏦 Financement Bancaire</div>
          <div>⚖️ Droit Immobilier</div>
          <div>📄 Export PDF/Excel</div>
        </div>
      </div>
    </div>
  )
}
