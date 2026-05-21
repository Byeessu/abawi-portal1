import { useRef, useState } from 'react'
import SEO from '../../components/SEO'
import { exportToPDF } from '../../lib/generatePDF'
import { cleanIATextLight } from '../../lib/cleanText'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../hooks/useWorkspace'
import { useBackgroundJob } from '../../hooks/useBackgroundJob'
import { useDraftAutoSave } from '../../hooks/useDraftAutoSave'
import { useToolAccess } from '../../hooks/useToolAccess'

import { callGroq as groqCall } from '../../lib/groqClient'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import TokenCounter from '../../components/TokenCounter'
import ToolHero from '../../components/ToolHero'
import RichDoc from '../../components/RichDoc'

const CONSULT_SYSTEM = `Tu es un consultant stratégique senior avec 15 ans d'expérience en Afrique de l'Ouest, spécialisé en management, stratégie d'entreprise, développement organisationnel et marchés africains. Tu rédiges des livrables de conseil professionnels, structurés et actionnables. Tes analyses sont rigoureuses et tes recommandations concrètes et priorisées.

RÈGLES DE FORMATAGE STRICTES :
- ## (deux dièses + espace) pour les sections principales, ### (trois dièses + espace) pour les sous-sections
- **texte** pour les termes importants (deux astérisques, jamais trois)
- Listes avec "- " (tiret + espace), jamais avec * ou ***
- Jamais de séparateurs --- *** ### /// seuls sur une ligne
- Paragraphes bien espacés, une ligne vide entre chaque section
- Ponctuation française soignée (pas d'artefacts numériques ou de symboles parasites)`

const callGroqConsult = (prompt) => groqCall(prompt, { maxTokens: 3000, temperature: 0.2, system: CONSULT_SYSTEM })

// Élite Consultant Sections
const SECTIONS = [
  { id: 'proposition', label: 'Proposition commerciale', icon: '📝', color: '#0EA5E9' },
  { id: 'rapport_mission', label: 'Rapport de mission', icon: '📊', color: '#8B5CF6' },
  { id: 'etude_marche', label: 'Étude de marché', icon: '🔍', color: '#F59E0B' },
  { id: 'swot', label: 'Analyse SWOT/PESTEL', icon: '🎯', color: '#EC4899' },
  { id: 'note_synthese', label: 'Note de synthèse', icon: '📋', color: '#22D3EE' },
  { id: 'cr_reunion', label: 'Compte rendu réunion', icon: '🗓️', color: '#22C55E' },
  { id: 'kpi_dashboard', label: 'KPI Dashboard', icon: '📈', color: '#FB923C' },
]

// Élite Consultant Component
export default function ConsultantEliteSimple() {
  const { membre } = useAuth()
  const tool = useToolAccess('consultant', 'consultant_elite')
  const [section, setSection] = useState('proposition')
  const [showPayment, setShowPayment] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [docGenere, setDocGenere] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [uploadedContext, setUploadedContext] = useState('')
  const containerRef = useRef(null)
  const sectionLabel = SECTIONS.find(s => s.id === section)?.label || 'Document'
  const workspace = useWorkspace(`consultant-elite-${section}`)
  const bgJob = useBackgroundJob(`consultant-elite-${section}`, `${sectionLabel} Élite`, 'anonymous', setDocGenere)

  // Élite State Management
  const [prop, setProp] = useState({
    consultant: '', client: '', objet_mission: '', contexte: '',
    approche_methodologique: '', livrables: '', equipe: '',
    duree: '', honoraires: '', conditions_paiement: '',
  })

  const [mission, setMission] = useState({
    titre: '', client: '', date_debut: '', date_fin: '', contexte: '',
    objectifs: [], methodology: '', analyses: '', recommandations: [],
    prochaines_etapes: [], annexes: []
  })

  const [etudeMarche, setEtudeMarche] = useState({
    secteur: '', zone_geographique: '', taille_marche: '', croissance: '',
    segments: [], concurrents: [], tendances: [], opportunites: [],
    menaces: [], conclusions: []
  })

  const [swot, setSwot] = useState({
    forces: [], faiblesses: [], opportunites: [], menaces: [],
    pestel: { politique: [], economique: [], social: [], technologique: [], environnemental: [], legal: [] },
    synthese: '', recommandations: []
  })

  const [noteSynthese, setNoteSynthese] = useState({
    sujet: '', auteur: '', date: '', destinataires: [],
    contexte: '', points_cles: [], conclusions: [], recommandations: [],
    annexes: []
  })

  const [crReunion, setCrReunion] = useState({
    date: '', lieu: '', participants: [], ordre_jour: [],
    points_discutes: [], decisions: [], actions: [], prochain_reunion: ''
  })

  const [kpi, setKpi] = useState({
    titre: '', periode: '', indicateurs: [], objectifs: [],
    resultats: [], analyses: [], recommendations: []
  })

  // Persistence — auto-save form data (30 days)
  useDraftAutoSave(
    'abawi-consultant-draft',
    { prop, mission, etudeMarche, swot, noteSynthese, crReunion, kpi },
    {
      onRestore: (d) => {
        if (d?.prop) setProp(d.prop)
        if (d?.mission) setMission(d.mission)
        if (d?.etudeMarche) setEtudeMarche(d.etudeMarche)
        if (d?.swot) setSwot(d.swot)
        if (d?.noteSynthese) setNoteSynthese(d.noteSynthese)
        if (d?.crReunion) setCrReunion(d.crReunion)
        if (d?.kpi) setKpi(d.kpi)
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
        case 'proposition':
          prompt = `Génère une proposition commerciale de niveau cabinet pour:
          Consultant: ${prop.consultant}
          Client: ${prop.client}
          Objet mission: ${prop.objet_mission}
          Contexte: ${prop.contexte}
          Approche: ${prop.approche_methodologique}
          Livrables: ${prop.livrables}
          Équipe: ${prop.equipe}
          Durée: ${prop.duree}
          Honoraires: ${prop.honoraires}
          Conditions paiement: ${prop.conditions_paiement}
          
          Inclus: structure professionnelle, valeur ajoutée, méthodologie détaillée, plan de travail, garanties.`
          break
          
        case 'rapport_mission':
          prompt = `Génère un rapport de mission de niveau cabinet pour:
          Titre: ${mission.titre}
          Client: ${mission.client}
          Période: ${mission.date_debut} au ${mission.date_fin}
          Contexte: ${mission.contexte}
          Objectifs: ${mission.objectifs.join(', ')}
          Méthodologie: ${mission.methodology}
          
          Inclus: analyses approfondies, recommandations stratégiques, plan d'action, indicateurs de suivi.`
          break
          
        case 'etude_marche':
          prompt = `Génère une étude de marché de niveau cabinet pour:
          Secteur: ${etudeMarche.secteur}
          Zone géographique: ${etudeMarche.zone_geographique}
          Taille marché: ${etudeMarche.taille_marche}
          Croissance: ${etudeMarche.croissance}
          
          Inclus: analyse concurrentielle, segmentation, tendances, opportunités, menaces, recommandations stratégiques.`
          break
          
        case 'swot':
          prompt = `Génère une analyse SWOT/PESTEL de niveau cabinet.
          Forces: ${swot.forces.join(', ')}
          Faiblesses: ${swot.faiblesses.join(', ')}
          Opportunités: ${swot.opportunites.join(', ')}
          Menaces: ${swot.menaces.join(', ')}
          
          Inclus: analyse PESTEL complète, matrice de positionnement, recommandations stratégiques.`
          break
          
        case 'note_synthese':
          prompt = `Génère une note de synthèse de niveau cabinet pour:
          Sujet: ${noteSynthese.sujet}
          Auteur: ${noteSynthese.auteur}
          Date: ${noteSynthese.date}
          Destinataires: ${noteSynthese.destinataires.join(', ')}
          Contexte: ${noteSynthese.contexte}
          
          Inclus: synthèse concise, points clés, conclusions, recommandations actionnables.`
          break
          
        case 'cr_reunion':
          prompt = `Génère un compte rendu de réunion de niveau cabinet pour:
          Date: ${crReunion.date}
          Lieu: ${crReunion.lieu}
          Participants: ${crReunion.participants.join(', ')}
          Ordre du jour: ${crReunion.ordre_jour.join(', ')}
          
          Inclus: résumé des discussions, décisions prises, plan d'action, prochaines étapes.`
          break
          
        case 'kpi_dashboard':
          prompt = `Génère un KPI dashboard de niveau cabinet pour:
          Titre: ${kpi.titre}
          Période: ${kpi.periode}
          Indicateurs: ${kpi.indicateurs.join(', ')}
          Objectifs: ${kpi.objectifs.join(', ')}
          
          Inclus: tableau de bord complet, analyses de performance, recommandations d'optimisation.`
          break
      }
      
      await bgJob.run(
        async () => {
          const response = await callGroqConsult(prompt)
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
      const content = containerRef.current
      if (!content) { alert('Contenu non trouvé pour export PDF'); return }
      await bgJob.run(
        async () => await exportToPDF(content, { filename: `${section}-elite-${Date.now()}.pdf`, includeHeader: true, includeFooter: true }),
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
      <SEO title="Consultant Élite — Proposition commerciale et rapports IA" description="Proposition commerciale, rapport de mission, étude de marché, SWOT, CR réunion, KPI dashboard par IA." image="/og-tools/consultant.jpg" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <TokenCounter />
      </div>
      <ToolInfoPanel
        toolName="Consultant Élite"
        icon="🎯"
        description="Livrables de consulting niveau cabinet international pour le marché africain"
        benefits={[
          'Produisez propositions commerciales et rapports de mission professionnels',
          'Générez des études de marché structurées avec SWOT, PESTEL, Porter',
          'Rédigez notes de synthèse et comptes rendus de réunion en minutes',
          'Construisez des dashboards KPI prêts à présenter au COMEX',
          'Exportez tout en PDF mise en page cabinet',
        ]}
        howToUse={[
          'Choisissez le livrable (proposition, rapport, étude, SWOT, note, KPI)',
          'Remplissez le contexte client, les objectifs et le périmètre',
          'Importez vos documents de référence (brief, données, benchmark)',
          'Cliquez sur « Générer » — l\'IA suit les frameworks standards du consulting',
          'Exportez en PDF, puis ajustez le ton et les chiffres spécifiques',
        ]}
        tips={[
          "Plus votre brief est précis (client, enjeux, livrable attendu), plus la sortie est exploitable",
          "Le SWOT/PESTEL est idéal pour un diagnostic stratégique initial",
          "Utilisez « Compte rendu réunion » en collant simplement vos notes brutes",
          "Le dashboard KPI génère les indicateurs pertinents selon le secteur",
        ]}
      />
      <ToolHero
        icon="🎯"
        badge="Consulting · Afrique"
        title="Consultant"
        titleAccent="Élite"
        subtitle="Propositions, rapports, études PESTEL/SWOT, KPI dashboards — niveau cabinet international."
        gradient="linear-gradient(135deg, #0f172a 0%, #312e81 45%, #4338ca 100%)"
        glowColor="rgba(67,56,202,0.4)"
        accentColor="#C7D2FE"
        stats={[['📋','7 Livrables'],['🎯','Frameworks Tier-1'],['📊','KPI Dashboard'],['🌍','Africa-first']]}
      />

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
              color: section === toolSection.id ? toolSection.color : 'var(--text-secondary)',
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
        <div ref={containerRef}>
          {section === 'proposition' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Proposition Commerciale</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Consultant</label>
                  <input
                    type="text"
                    value={prop.consultant}
                    onChange={(e) => setProp(prev => ({ ...prev, consultant: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Client</label>
                  <input
                    type="text"
                    value={prop.client}
                    onChange={(e) => setProp(prev => ({ ...prev, client: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Objet de la mission</label>
                  <input
                    type="text"
                    value={prop.objet_mission}
                    onChange={(e) => setProp(prev => ({ ...prev, objet_mission: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Durée</label>
                  <input
                    type="text"
                    value={prop.duree}
                    onChange={(e) => setProp(prev => ({ ...prev, duree: e.target.value }))}
                    placeholder="Ex: 3 mois, 6 semaines"
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Honoraires</label>
                  <input
                    type="text"
                    value={prop.honoraires}
                    onChange={(e) => setProp(prev => ({ ...prev, honoraires: e.target.value }))}
                    placeholder="Ex: 15M FCFA"
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Conditions de paiement</label>
                  <input
                    type="text"
                    value={prop.conditions_paiement}
                    onChange={(e) => setProp(prev => ({ ...prev, conditions_paiement: e.target.value }))}
                    placeholder="Ex: 50% acompte, 50% livraison"
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
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Contexte de la mission</label>
                <textarea
                  value={prop.contexte}
                  onChange={(e) => setProp(prev => ({ ...prev, contexte: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Approche méthodologique</label>
                <textarea
                  value={prop.approche_methodologique}
                  onChange={(e) => setProp(prev => ({ ...prev, approche_methodologique: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Livrables</label>
                <textarea
                  value={prop.livrables}
                  onChange={(e) => setProp(prev => ({ ...prev, livrables: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Équipe consultante</label>
                <textarea
                  value={prop.equipe}
                  onChange={(e) => setProp(prev => ({ ...prev, equipe: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: 'var(--bg-secondary)',
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

          {section === 'rapport_mission' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Rapport de Mission</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Titre du rapport</label>
                  <input
                    type="text"
                    value={mission.titre}
                    onChange={(e) => setMission(prev => ({ ...prev, titre: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Client</label>
                  <input
                    type="text"
                    value={mission.client}
                    onChange={(e) => setMission(prev => ({ ...prev, client: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Date de début</label>
                  <input
                    type="date"
                    value={mission.date_debut}
                    onChange={(e) => setMission(prev => ({ ...prev, date_debut: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Date de fin</label>
                  <input
                    type="date"
                    value={mission.date_fin}
                    onChange={(e) => setMission(prev => ({ ...prev, date_fin: e.target.value }))}
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
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Contexte de la mission</label>
                <textarea
                  value={mission.contexte}
                  onChange={(e) => setMission(prev => ({ ...prev, contexte: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Méthodologie</label>
                <textarea
                  value={mission.methodology}
                  onChange={(e) => setMission(prev => ({ ...prev, methodology: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: 'var(--bg-secondary)',
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

          {section === 'etude_marche' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Étude de Marché</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Secteur d'activité</label>
                  <input
                    type="text"
                    value={etudeMarche.secteur}
                    onChange={(e) => setEtudeMarche(prev => ({ ...prev, secteur: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Zone géographique</label>
                  <input
                    type="text"
                    value={etudeMarche.zone_geographique}
                    onChange={(e) => setEtudeMarche(prev => ({ ...prev, zone_geographique: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Taille du marché</label>
                  <input
                    type="text"
                    value={etudeMarche.taille_marche}
                    onChange={(e) => setEtudeMarche(prev => ({ ...prev, taille_marche: e.target.value }))}
                    placeholder="Ex: 50M FCFA"
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Taux de croissance</label>
                  <input
                    type="text"
                    value={etudeMarche.croissance}
                    onChange={(e) => setEtudeMarche(prev => ({ ...prev, croissance: e.target.value }))}
                    placeholder="Ex: 15% par an"
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
            </div>
          )}

          {section === 'swot' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Analyse SWOT/PESTEL</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <h3 style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Forces</h3>
                  <textarea
                    value={swot.forces.join('\n')}
                    onChange={(e) => setSwot(prev => ({ ...prev, forces: e.target.value.split('\n').filter(f => f.trim()) }))}
                    rows={5}
                    placeholder="Une force par ligne"
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Faiblesses</h3>
                  <textarea
                    value={swot.faiblesses.join('\n')}
                    onChange={(e) => setSwot(prev => ({ ...prev, faiblesses: e.target.value.split('\n').filter(f => f.trim()) }))}
                    rows={5}
                    placeholder="Une faiblesse par ligne"
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Opportunités</h3>
                  <textarea
                    value={swot.opportunites.join('\n')}
                    onChange={(e) => setSwot(prev => ({ ...prev, opportunites: e.target.value.split('\n').filter(f => f.trim()) }))}
                    rows={5}
                    placeholder="Une opportunité par ligne"
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Menaces</h3>
                  <textarea
                    value={swot.menaces.join('\n')}
                    onChange={(e) => setSwot(prev => ({ ...prev, menaces: e.target.value.split('\n').filter(f => f.trim()) }))}
                    rows={5}
                    placeholder="Une menace par ligne"
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
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
                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Document Élite Généré</h3>
                <button
                  onClick={exportPDF}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
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
              color: '#0A0A0A',
              border: 'none',
              borderRadius: 12,
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: generating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(240, 180, 41, 0.3)'
            }}
          >
            {generating ? 'Génération en cours...' : `🚀 Générer ${sectionLabel} Élite`}
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
          Consultant Élite - Propulsé par Abawi IA
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 24, 
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem'
        }}>
          <div>🎯 Frameworks Tier-1</div>
          <div>📈 KPI Dashboards</div>
          <div>📑 Rapports Professionnels</div>
          <div>📄 Export PDF</div>
        </div>
      </div>
    </div>
  )
}
