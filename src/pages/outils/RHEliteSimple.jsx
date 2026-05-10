import { useState } from 'react'
import { exportToPDF } from '../../lib/generatePDF'
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

const RH_SYSTEM = `Tu es un DRH expert spécialisé en droit du travail sénégalais et OHADA, gestion des ressources humaines en Afrique de l'Ouest. Tu rédiges des documents RH professionnels, conformes au Code du Travail sénégalais, à la Convention Collective Nationale Interprofessionnelle (CCNI) et aux barèmes IPRES/CSS en vigueur.

RÈGLES DE FORMATAGE STRICTES :
- ## (deux dièses + espace) pour les sections principales, ### (trois dièses + espace) pour les sous-sections
- **texte** pour les termes importants (deux astérisques, jamais trois)
- Listes avec "- " (tiret + espace), jamais avec * ou ***
- Jamais de séparateurs --- *** ### /// seuls sur une ligne
- Paragraphes bien espacés, une ligne vide entre chaque section
- Ponctuation française soignée (pas d'artefacts numériques ou de symboles parasites)`

const callGroqRH = (prompt) => groqCall(prompt, { maxTokens: 2500, temperature: 0.15, system: RH_SYSTEM })

// Élite RH Sections
const SECTIONS = [
  { id: 'fiche_poste', label: 'Fiche de poste', icon: '📋', color: '#0EA5E9' },
  { id: 'grille_salaires', label: 'Grille de salaires', icon: '💰', color: '#8B5CF6' },
  { id: 'evaluation', label: 'Évaluation 360°', icon: '⭐', color: '#F59E0B' },
  { id: 'paie_sn', label: 'Calcul de paie SN', icon: '💵', color: '#EC4899' },
  { id: 'contrat', label: 'Contrats de travail', icon: '📝', color: '#22D3EE' },
  { id: 'reglement', label: 'Règlement intérieur', icon: '📜', color: '#22C55E' },
  { id: 'onboarding', label: 'Kit Onboarding', icon: '🎯', color: '#FB923C' },
  { id: 'formation', label: 'Plan de formation', icon: '🎓', color: '#34D399' },
]

// Élite RH Component
export default function RHEliteSimple() {
  const { membre } = useAuth()
  const tool = useToolAccess('rh', 'rh_elite')
  const [section, setSection] = useState('fiche_poste')
  const [showPayment, setShowPayment] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [docGenere, setDocGenere] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [uploadedContext, setUploadedContext] = useState('')
  const workspace = useWorkspace(`rh-elite-${section}`)
  const bgJob = useBackgroundJob(`rh-elite-${section}`, `RH Élite - ${SECTIONS.find(s => s.id === section)?.label || section}`, 'anonymous', setDocGenere)

  // Élite State Management
  const [fiche, setFiche] = useState({
    titre: '', departement: '', direction: '', rattachement: '', niveau: 'Cadre',
    missions: '', competences_requises: '', competences_souhaitees: '',
    experience: '3 ans', formation: '', remuneration_min: 0, remuneration_max: 0,
    avantages: '', lieu: 'Dakar',
  })

  const [grille, setGrille] = useState({
    categorie: 'A', echelon: '1', indice: 100, salaire_base: 0,
    anciennete: 0, prime_responsabilite: 0, prime_technicite: 0,
    prime_representation: 0, avantage_nature: 0, salaire_brut: 0,
    retenues_cnss: 0, retenues_ipres: 0, impot_revenu: 0, salaire_net: 0
  })

  const [evaluation, setEvaluation] = useState({
    employe: '', evaluateur: '', periode: '', date_evaluation: '',
    objectifs: [], resultats: [], competences: [], notes: {},
    appreciation_globale: '', recommandations: [], plan_action: []
  })

  const [paie, setPaie] = useState({
    employe: '', categorie: 'A', echelon: '1', salaire_base: 0,
    heures_supplementaires: 0, prime_anciennete: 0, prime_responsabilite: 0,
    prime_logement: 0, prime_transport: 0, avantage_nature: 0,
    salaire_brut: 0, cnss_employeur: 0, cnss_employe: 0,
    ipres_employeur: 0, ipres_employe: 0, impot_revenu: 0,
    autres_retentions: 0, salaire_net: 0, periode_paie: ''
  })

  const [contrat, setContrat] = useState({
    type: 'CDI', employeur: '', employe: '', date_debut: '', date_fin: '',
    periode_essai: '', poste: '', lieu_travail: '', horaires: '',
    salaire_brut: '', avantages: [], obligations: [], motifs_rupture: [],
    juridiction: 'Conseil de Prud\'hommes de Dakar'
  })

  const [reglement, setReglement] = useState({
    raison_sociale: '', siege: '', effectif: 0, activite: '',
    horaires_travail: '', discipline: [], securite: [], representation_personnel: [],
    droit_grève: [], procedures_litiges: [], date_application: ''
  })

  const [onboarding, setOnboarding] = useState({
    employe: '', poste: '', departement: '', date_arrivee: '',
    manager: '', tuteur: '', checklist_integration: [],
    formations_obligatoires: [], equipements: [], acces_systemes: [],
    premier_semaine: [], premier_mois: [], objectifs_90_jours: []
  })

  const [formation, setFormation] = useState({
    annee: new Date().getFullYear(), budget_total: 0, objectifs: [],
    besoins_formation: [], plan_annuel: [], evaluateurs: [],
    suivi_evaluation: [], rapport_performance: []
  })

  // Persistence — auto-save form data (30 days)
  useDraftAutoSave(
    'abawi-rh-draft',
    { fiche, grille, evaluation, paie, contrat, reglement, onboarding, formation },
    {
      onRestore: (d) => {
        if (d?.fiche) setFiche(d.fiche)
        if (d?.grille) setGrille(d.grille)
        if (d?.evaluation) setEvaluation(d.evaluation)
        if (d?.paie) setPaie(d.paie)
        if (d?.contrat) setContrat(d.contrat)
        if (d?.reglement) setReglement(d.reglement)
        if (d?.onboarding) setOnboarding(d.onboarding)
        if (d?.formation) setFormation(d.formation)
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
        case 'fiche_poste':
          prompt = `Génère une fiche de poste de niveau cabinet pour:
          Titre: ${fiche.titre}
          Département: ${fiche.departement}
          Direction: ${fiche.direction}
          Rattachement: ${fiche.rattachement}
          Niveau: ${fiche.niveau}
          Missions: ${fiche.missions}
          Compétences requises: ${fiche.competences_requises}
          Compétences souhaitées: ${fiche.competences_souhaitees}
          Expérience: ${fiche.experience}
          Formation: ${fiche.formation}
          Rémunération: ${fiche.remuneration_min} - ${fiche.remuneration_max} FCFA
          Avantages: ${fiche.avantages}
          Lieu: ${fiche.lieu}
          
          Inclus: description détaillée, objectifs, indicateurs de performance, conditions de travail.`
          break
          
        case 'grille_salaires':
          prompt = `Génère une grille de salaires de niveau cabinet CCNI pour:
          Catégorie: ${grille.categorie}
          Échelon: ${grille.echelon}
          Indice: ${grille.indice}
          Salaire base: ${grille.salaire_base} FCFA
          Ancienneté: ${grille.anciennete} ans
          Prime responsabilité: ${grille.prime_responsabilite} FCFA
          Prime technicité: ${grille.prime_technicite} FCFA
          Prime représentation: ${grille.prime_representation} FCFA
          Avantage nature: ${grille.avantage_nature} FCFA
          
          Inclus: calculs détaillés CNSS, IPRES, impôt, conformité CCNI.`
          break
          
        case 'evaluation':
          prompt = `Génère une évaluation 360° de niveau cabinet pour:
          Employé: ${evaluation.employe}
          Évaluateur: ${evaluation.evaluateur}
          Période: ${evaluation.periode}
          Date: ${evaluation.date_evaluation}
          Objectifs: ${evaluation.objectifs.join(', ')}
          
          Inclus: grille d'évaluation, compétences techniques et comportementales, plan d'action.`
          break
          
        case 'paie_sn':
          prompt = `Génère un bulletin de paie de niveau cabinet Sénégal pour:
          Employé: ${paie.employe}
          Catégorie: ${paie.categorie}
          Échelon: ${paie.echelon}
          Salaire base: ${paie.salaire_base} FCFA
          Heures supplémentaires: ${paie.heures_supplementaires}
          Prime ancienneté: ${paie.prime_anciennete} FCFA
          Prime responsabilité: ${paie.prime_responsabilite} FCFA
          Prime logement: ${paie.prime_logement} FCFA
          Prime transport: ${paie.prime_transport} FCFA
          Avantage nature: ${paie.avantage_nature} FCFA
          
          Inclus: calculs CNSS/IPRES, barèmes fiscaux, conformité Code Travail.`
          break
          
        case 'contrat':
          prompt = `Génère un contrat de travail de niveau cabinet pour:
          Type: ${contrat.type}
          Employeur: ${contrat.employeur}
          Employé: ${contrat.employe}
          Date début: ${contrat.date_debut}
          Date fin: ${contrat.date_fin}
          Période essai: ${contrat.periode_essai}
          Poste: ${contrat.poste}
          Lieu travail: ${contrat.lieu_travail}
          Horaires: ${contrat.horaires}
          Salaire brut: ${contrat.salaire_brut}
          
          Inclus: clauses légales, obligations, conformité Code Travail Sénégal.`
          break
          
        case 'reglement':
          prompt = `Génère un règlement intérieur de niveau cabinet pour:
          Raison sociale: ${reglement.raison_sociale}
          Siège: ${reglement.siege}
          Effectif: ${reglement.effectif}
          Activité: ${reglement.activite}
          Horaires: ${reglement.horaires_travail}
          
          Inclus: discipline, sécurité, représentation personnel, conformité OHADA.`
          break
          
        case 'onboarding':
          prompt = `Génère un kit onboarding de niveau cabinet pour:
          Employé: ${onboarding.employe}
          Poste: ${onboarding.poste}
          Département: ${onboarding.departement}
          Date arrivée: ${onboarding.date_arrivee}
          Manager: ${onboarding.manager}
          Tuteur: ${onboarding.tuteur}
          
          Inclus: checklist, formations, intégration, objectifs 90 jours.`
          break
          
        case 'formation':
          prompt = `Génère un plan de formation de niveau cabinet pour:
          Année: ${formation.annee}
          Budget total: ${formation.budget_total} FCFA
          Objectifs: ${formation.objectifs.join(', ')}
          
          Inclus: besoins identification, plan annuel, évaluation, ROI formation.`
          break
      }
      
      await bgJob.run(
        async () => {
          const response = await callGroqRH(prompt)
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
    try {
      const content = document.getElementById('rh-content')
      if (!content) { alert('Contenu non trouvé pour export PDF'); return }
      await bgJob.run(
        async () => await exportToPDF(content, { filename: `rh-elite-${section}-${Date.now()}.pdf`, includeHeader: true, includeFooter: true }),
        { onError: (error) => alert(`Erreur export PDF: ${error.message}`) }
      )
      if (!tool.unlimited) { const res = await tool.debit(); if (!res.ok) { alert('Crédits insuffisants'); setShowPayment(true); return } }
      alert('PDF exporté avec succès')
    } catch (error) { alert(`Erreur export PDF: ${error.message}`) }
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
        title="RH Élite — Droit du travail sénégalais"
        description="Générez fiches de poste, contrats CDI/CDD, procédures disciplinaires, organigrammes conformes au Code du travail sénégalais et CCNI. Export PDF pro."
        keywords="RH Sénégal, contrat CDI, contrat CDD, fiche de poste, procédure disciplinaire, organigramme, code du travail sénégalais, CCNI, IPRES, CSS"
        type="article"
      />
      <ToolInfoPanel
        toolName="RH Élite"
        icon="👥"
        description="Gestion RH complète conforme au Code du travail sénégalais"
        benefits={[
          'Rédigez fiches de poste, contrats CDI/CDD et règlement intérieur conformes',
          "Calculez les bulletins de paie avec cotisations CNSS, IPRES et retenue d'impôt",
          "Construisez une grille salariale alignée sur le marché local",
          'Lancez des évaluations 360° structurées et un kit d\'onboarding professionnel',
          'Exportez chaque document en PDF prêt à signer',
        ]}
        howToUse={[
          "Choisissez la catégorie de document RH (fiche de poste, paie, contrat...)",
          "Saisissez les informations du poste, du salarié et de l'entreprise",
          "Cliquez sur « Générer » — l'IA produit un document RH calibré",
          'Relisez, ajustez les clauses spécifiques à votre convention collective',
          'Exportez en PDF et archivez dans votre dossier RH',
        ]}
        tips={[
          "Pour la paie : saisissez le salaire brut, l'outil applique les taux SN officiels",
          'Les contrats incluent les mentions obligatoires du droit du travail sénégalais',
          "L'évaluation 360° suit un cadre utilisé par les cabinets RH internationaux",
          'Utilisez la grille salariale pour négocier ou recruter au juste prix',
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
          RH Élite
        </h1>
        <p style={{ 
          color: '#DBEAFE', 
          fontSize: '1.2rem',
          margin: 0,
          position: 'relative',
          zIndex: 1
        }}>
          Gestion RH avancée avec conformité OHADA et Code Travail Sénégal
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
            ? 8 Modules RH
          </div>
          <div style={{ 
            padding: '8px 16px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '100px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            ? Conformité OHADA
          </div>
          <div style={{ 
            padding: '8px 16px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '100px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            ? Calcul Paie SN
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
        <div id="rh-content">
          {section === 'fiche_poste' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Fiche de Poste</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Titre du poste</label>
                  <input
                    type="text"
                    value={fiche.titre}
                    onChange={(e) => setFiche(prev => ({ ...prev, titre: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Département</label>
                  <input
                    type="text"
                    value={fiche.departement}
                    onChange={(e) => setFiche(prev => ({ ...prev, departement: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Direction</label>
                  <input
                    type="text"
                    value={fiche.direction}
                    onChange={(e) => setFiche(prev => ({ ...prev, direction: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Niveau hiérarchique</label>
                  <select
                    value={fiche.niveau}
                    onChange={(e) => setFiche(prev => ({ ...prev, niveau: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="Cadre">Cadre</option>
                    <option value="Agent de maîtrise">Agent de maîtrise</option>
                    <option value="Employé">Employé</option>
                    <option value="Ouvrier qualifié">Ouvrier qualifié</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Expérience requise</label>
                  <input
                    type="text"
                    value={fiche.experience}
                    onChange={(e) => setFiche(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="Ex: 3 ans"
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Lieu de travail</label>
                  <input
                    type="text"
                    value={fiche.lieu}
                    onChange={(e) => setFiche(prev => ({ ...prev, lieu: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Rémunération minimale (FCFA)</label>
                  <input
                    type="number"
                    value={fiche.remuneration_min}
                    onChange={(e) => setFiche(prev => ({ ...prev, remuneration_min: parseInt(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Rémunération maximale (FCFA)</label>
                  <input
                    type="number"
                    value={fiche.remuneration_max}
                    onChange={(e) => setFiche(prev => ({ ...prev, remuneration_max: parseInt(e.target.value) || 0 }))}
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
              
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Missions principales</label>
                <textarea
                  value={fiche.missions}
                  onChange={(e) => setFiche(prev => ({ ...prev, missions: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: '#1E293B',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Compétences requises</label>
                <textarea
                  value={fiche.competences_requises}
                  onChange={(e) => setFiche(prev => ({ ...prev, competences_requises: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: '#1E293B',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Formation requise</label>
                <input
                  type="text"
                  value={fiche.formation}
                  onChange={(e) => setFiche(prev => ({ ...prev, formation: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: '#1E293B',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Avantages</label>
                <textarea
                  value={fiche.avantages}
                  onChange={(e) => setFiche(prev => ({ ...prev, avantages: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: '#1E293B',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          )}

          {section === 'paie_sn' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Calcul de Paie Sénégal</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Employé</label>
                  <input
                    type="text"
                    value={paie.employe}
                    onChange={(e) => setPaie(prev => ({ ...prev, employe: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Catégorie</label>
                  <select
                    value={paie.categorie}
                    onChange={(e) => setPaie(prev => ({ ...prev, categorie: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="A">Catégorie A</option>
                    <option value="B">Catégorie B</option>
                    <option value="C">Catégorie C</option>
                    <option value="D">Catégorie D</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Échelon</label>
                  <input
                    type="text"
                    value={paie.echelon}
                    onChange={(e) => setPaie(prev => ({ ...prev, echelon: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Salaire de base (FCFA)</label>
                  <input
                    type="number"
                    value={paie.salaire_base}
                    onChange={(e) => setPaie(prev => ({ ...prev, salaire_base: parseInt(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Heures supplémentaires</label>
                  <input
                    type="number"
                    value={paie.heures_supplementaires}
                    onChange={(e) => setPaie(prev => ({ ...prev, heures_supplementaires: parseInt(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Prime ancienneté (FCFA)</label>
                  <input
                    type="number"
                    value={paie.prime_anciennete}
                    onChange={(e) => setPaie(prev => ({ ...prev, prime_anciennete: parseInt(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Prime responsabilité (FCFA)</label>
                  <input
                    type="number"
                    value={paie.prime_responsabilite}
                    onChange={(e) => setPaie(prev => ({ ...prev, prime_responsabilite: parseInt(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Prime logement (FCFA)</label>
                  <input
                    type="number"
                    value={paie.prime_logement}
                    onChange={(e) => setPaie(prev => ({ ...prev, prime_logement: parseInt(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Prime transport (FCFA)</label>
                  <input
                    type="number"
                    value={paie.prime_transport}
                    onChange={(e) => setPaie(prev => ({ ...prev, prime_transport: parseInt(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Avantage en nature (FCFA)</label>
                  <input
                    type="number"
                    value={paie.avantage_nature}
                    onChange={(e) => setPaie(prev => ({ ...prev, avantage_nature: parseInt(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Période de paie</label>
                  <input
                    type="text"
                    value={paie.periode_paie}
                    onChange={(e) => setPaie(prev => ({ ...prev, periode_paie: e.target.value }))}
                    placeholder="Ex: Janvier 2024"
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
              
              <div style={{ marginTop: 24, padding: 20, background: '#1E293B', borderRadius: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Salaire brut estimé</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
                      {(paie.salaire_base + paie.heures_supplementaires * 2000 + paie.prime_anciennete + 
                        paie.prime_responsabilite + paie.prime_logement + paie.prime_transport + 
                        paie.avantage_nature).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>CNSS (8.4% employé)</div>
                    <div style={{ color: '#F0B429', fontSize: '1.1rem', fontWeight: 600 }}>
                      {Math.round((paie.salaire_base + paie.prime_anciennete + paie.prime_responsabilite) * 0.084).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>IPRES (6% employé)</div>
                    <div style={{ color: '#F0B429', fontSize: '1.1rem', fontWeight: 600 }}>
                      {Math.round((paie.salaire_base + paie.prime_anciennete + paie.prime_responsabilite) * 0.06).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Salaire net estimé</div>
                    <div style={{ color: '#22C55E', fontSize: '1.2rem', fontWeight: 700 }}>
                      {Math.round((paie.salaire_base + paie.heures_supplementaires * 2000 + paie.prime_anciennete + 
                        paie.prime_responsabilite + paie.prime_logement + paie.prime_transport + 
                        paie.avantage_nature) - ((paie.salaire_base + paie.prime_anciennete + paie.prime_responsabilite) * 0.084) - 
                        ((paie.salaire_base + paie.prime_anciennete + paie.prime_responsabilite) * 0.06)).toLocaleString()} FCFA
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
                background: '#1E293B',
                borderRadius: 12
              }}>
                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Document RH Élite Généré</h3>
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
          RH Élite - Propulsé par Abawi IA
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 24, 
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem'
        }}>
          <div>⚖️ Conformité OHADA</div>
          <div>📜 Code Travail SN</div>
          <div>💵 Calcul Paie CNSS/IPRES</div>
          <div>📄 Export PDF</div>
        </div>
      </div>
    </div>
  )
}
