import { useEffect, useState } from 'react'
import { exportToPDF } from '../../lib/generatePDF'
import { cleanIATextLight } from '../../lib/cleanText'
import { useAuth } from '../../context/AuthContext'
import { hasAllInclusiveAccess } from '../../lib/permissions'
import { useWorkspace } from '../../hooks/useWorkspace'
import { useDraftAutoSave } from '../../hooks/useDraftAutoSave'
import { useToolAccess } from '../../hooks/useToolAccess'
import { callGroq as groqClientCall } from '../../lib/groqClient'
import SEO from '../../components/SEO'
import GradientOrbs from '../../components/premium/GradientOrbs'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import DocumentProfileManager from '../../components/DocumentProfileManager'
import FileContextUpload from '../../components/FileContextUpload'
import DocOutputPanel from '../../components/DocOutputPanel'
import WorkspacePanel from '../../components/WorkspacePanel'
import PaymentFlow from '../../components/PaymentFlow'

const SESSION_KEY = 'abawi_juridique_session'

const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

const DOC_TYPES = [
  { id: 'statuts_sarl', label: 'Statuts SARL', icon: '🏢', desc: 'Statuts de Société à Responsabilité Limitée (OHADA)' },
  { id: 'statuts_sa', label: 'Statuts SA', icon: '🏛️', desc: 'Statuts de Société Anonyme (OHADA)' },
  { id: 'contrat_cdi', label: 'Contrat CDI', icon: '📋', desc: 'Contrat à Durée Indéterminée conforme droit sénégalais' },
  { id: 'contrat_cdd', label: 'Contrat CDD', icon: '📝', desc: 'Contrat à Durée Déterminée avec clauses légales' },
  { id: 'bail_residentiel', label: 'Bail Résidentiel', icon: '🏠', desc: 'Contrat de bail d\'habitation avec toutes les clauses' },
  { id: 'bail_commercial', label: 'Bail Commercial', icon: '🏪', desc: 'Bail commercial conforme législation OHADA' },
  { id: 'contrat_prestation', label: 'Contrat de Prestation', icon: '🤝', desc: 'Prestation de services entre professionnels' },
  { id: 'nda', label: 'NDA / Accord Confidentialité', icon: '🔒', desc: 'Accord de non-divulgation bilatéral ou unilatéral' },
  { id: 'mise_en_demeure', label: 'Mise en Demeure', icon: '⚖️', desc: 'Lettre de mise en demeure à valeur juridique' },
  { id: 'cession_parts', label: 'Cession de Parts', icon: '📊', desc: 'Acte de cession de parts sociales SARL/SA' },
  { id: 'pv_ag', label: 'PV Assemblée Générale', icon: '📜', desc: 'Procès-verbal d\'assemblée générale ordinaire ou extraordinaire' },
  { id: 'contrat_franchise', label: 'Contrat de Franchise', icon: '🌐', desc: 'Contrat de franchise avec droits et obligations' },
]

const FIELD_LABELS = {
  // Commun
  date_signature: 'Date de signature',
  ville: 'Ville',
  pays: 'Pays',
  // Société
  nom_societe: 'Nom de la société',
  forme_juridique: 'Forme juridique',
  capital_social: 'Capital social (FCFA)',
  siege_social: 'Siège social',
  objet_social: 'Objet social',
  gerant_nom: 'Nom du gérant',
  gerant_adresse: 'Adresse du gérant',
  associes: 'Associés (nom:apport, séparés par /)',
  duree_societe: 'Durée de la société (ans)',
  // Contrat travail
  employeur_nom: 'Nom de l\'employeur',
  employeur_adresse: 'Adresse de l\'employeur',
  employe_nom: 'Nom de l\'employé',
  employe_adresse: 'Adresse de l\'employé',
  poste: 'Poste / Fonction',
  salaire_brut: 'Salaire brut mensuel (FCFA)',
  date_debut: 'Date de début',
  date_fin: 'Date de fin (CDD)',
  periode_essai: 'Période d\'essai (mois)',
  lieu_travail: 'Lieu de travail',
  horaires: 'Horaires de travail',
  convention_collective: 'Convention collective applicable',
  // Bail
  bailleur_nom: 'Nom du bailleur',
  bailleur_adresse: 'Adresse du bailleur',
  locataire_nom: 'Nom du locataire',
  locataire_adresse: 'Adresse du locataire',
  adresse_bien: 'Adresse du bien loué',
  description_bien: 'Description du bien',
  loyer_mensuel: 'Loyer mensuel (FCFA)',
  depot_garantie: 'Dépôt de garantie (FCFA)',
  duree_bail: 'Durée du bail',
  date_entree: 'Date d\'entrée',
  usage: 'Usage (habitation/commercial)',
  // Prestation
  prestataire_nom: 'Nom du prestataire',
  prestataire_adresse: 'Adresse du prestataire',
  client_nom: 'Nom du client',
  client_adresse: 'Adresse du client',
  description_mission: 'Description de la mission',
  montant_honoraires: 'Montant des honoraires (FCFA)',
  duree_mission: 'Durée de la mission',
  modalites_paiement: 'Modalités de paiement',
  // NDA
  partie1_nom: 'Nom Partie 1',
  partie1_adresse: 'Adresse Partie 1',
  partie2_nom: 'Nom Partie 2',
  partie2_adresse: 'Adresse Partie 2',
  objet_nda: 'Objet de l\'accord de confidentialité',
  duree_confidentialite: 'Durée de confidentialité (ans)',
  type_nda: 'Type (unilatéral/bilatéral)',
  // Mise en demeure
  creancier_nom: 'Nom du créancier',
  creancier_adresse: 'Adresse du créancier',
  debiteur_nom: 'Nom du débiteur',
  debiteur_adresse: 'Adresse du débiteur',
  objet_litige: 'Objet du litige',
  montant_reclame: 'Montant réclamé (FCFA)',
  delai_reponse: 'Délai de réponse (jours)',
  // Cession de parts
  cedant_nom: 'Nom du cédant',
  cessionnaire_nom: 'Nom du cessionnaire',
  nombre_parts: 'Nombre de parts cédées',
  valeur_nominale: 'Valeur nominale par part (FCFA)',
  prix_cession: 'Prix de cession total (FCFA)',
  // PV AG
  type_ag: 'Type d\'AG (ordinaire/extraordinaire)',
  president_seance: 'Président de séance',
  secretaire_seance: 'Secrétaire de séance',
  ordre_du_jour: 'Ordre du jour',
  resolutions: 'Résolutions adoptées',
  // Franchise
  franchiseur_nom: 'Nom du franchiseur',
  franchiseur_adresse: 'Adresse du franchiseur',
  franchisé_nom: 'Nom du franchisé',
  franchisé_adresse: 'Adresse du franchisé',
  enseigne: 'Enseigne / Marque',
  droit_entree: 'Droit d\'entrée (FCFA)',
  redevance: 'Redevance mensuelle (%)',
  zone_exclusivite: 'Zone d\'exclusivité',
  duree_franchise: 'Durée du contrat (ans)',
}

const FIELDS_BY_TYPE = {
  statuts_sarl: ['nom_societe', 'capital_social', 'siege_social', 'objet_social', 'gerant_nom', 'gerant_adresse', 'associes', 'duree_societe', 'ville', 'date_signature'],
  statuts_sa: ['nom_societe', 'capital_social', 'siege_social', 'objet_social', 'gerant_nom', 'gerant_adresse', 'associes', 'duree_societe', 'ville', 'date_signature'],
  contrat_cdi: ['employeur_nom', 'employeur_adresse', 'employe_nom', 'employe_adresse', 'poste', 'salaire_brut', 'date_debut', 'periode_essai', 'lieu_travail', 'horaires', 'convention_collective', 'ville'],
  contrat_cdd: ['employeur_nom', 'employeur_adresse', 'employe_nom', 'employe_adresse', 'poste', 'salaire_brut', 'date_debut', 'date_fin', 'periode_essai', 'lieu_travail', 'horaires', 'ville'],
  bail_residentiel: ['bailleur_nom', 'bailleur_adresse', 'locataire_nom', 'locataire_adresse', 'adresse_bien', 'description_bien', 'loyer_mensuel', 'depot_garantie', 'duree_bail', 'date_entree', 'ville'],
  bail_commercial: ['bailleur_nom', 'bailleur_adresse', 'locataire_nom', 'locataire_adresse', 'adresse_bien', 'description_bien', 'loyer_mensuel', 'depot_garantie', 'duree_bail', 'date_entree', 'usage', 'ville'],
  contrat_prestation: ['prestataire_nom', 'prestataire_adresse', 'client_nom', 'client_adresse', 'description_mission', 'montant_honoraires', 'duree_mission', 'modalites_paiement', 'ville', 'date_signature'],
  nda: ['partie1_nom', 'partie1_adresse', 'partie2_nom', 'partie2_adresse', 'objet_nda', 'duree_confidentialite', 'type_nda', 'ville', 'date_signature'],
  mise_en_demeure: ['creancier_nom', 'creancier_adresse', 'debiteur_nom', 'debiteur_adresse', 'objet_litige', 'montant_reclame', 'delai_reponse', 'ville', 'date_signature'],
  cession_parts: ['nom_societe', 'cedant_nom', 'cessionnaire_nom', 'nombre_parts', 'valeur_nominale', 'prix_cession', 'ville', 'date_signature'],
  pv_ag: ['nom_societe', 'siege_social', 'type_ag', 'president_seance', 'secretaire_seance', 'capital_social', 'ordre_du_jour', 'resolutions', 'ville', 'date_signature'],
  contrat_franchise: ['franchiseur_nom', 'franchiseur_adresse', 'franchisé_nom', 'franchisé_adresse', 'enseigne', 'droit_entree', 'redevance', 'zone_exclusivite', 'duree_franchise', 'ville', 'date_signature'],
}

async function callGroqJuridique(docType, fields, formData, mode = 'standard', uploadedContext = '') {
  const docInfo = DOC_TYPES.find(d => d.id === docType)
  const fieldSummary = fields.map(f => `${FIELD_LABELS[f] || f}: ${formData[f] || 'Non renseigné'}`).join('\n')

  const systemPrompt = `Tu es un expert juridique spécialisé en droit OHADA et droit sénégalais.
Tu rédiges des documents juridiques professionnels, complets et conformes à la législation en vigueur.
Chaque document doit être:
- Rédigé en français juridique formel
- Conforme aux exigences OHADA et du droit sénégalais
- Structuré avec des articles numérotés
- Prêt à être signé après vérification par un juriste

RÈGLES DE FORMATAGE STRICTES :
- Utilise ## (deux dièses + espace) pour les grandes sections et ### (trois dièses + espace) pour les sous-sections
- Utilise **texte** pour les termes importants en gras (deux astérisques de chaque côté, jamais trois)
- Les listes commencent par "- " (tiret + espace), jamais par * ou ***
- Jamais de lignes de séparation composées de tirets ou étoiles consécutifs (---, ***, ###, ///)
- Paragraphes bien espacés, ponctuation soignée
- Réponds UNIQUEMENT avec le texte du document structuré`

  const outputInstruction =
    mode === 'explain'
      ? `Après le document, ajoute une section "EXPLICATIONS CLAUSES" avec un langage simple orienté entrepreneur (points clés, risques, vigilance).`
      : mode === 'checklist'
        ? `Après le document, ajoute une section "CHECKLIST DE CONFORMITÉ" (signature, pièces à joindre, enregistrement, fiscalité, archivage).`
        : 'Ne fournis que le document juridique.'

  const userPrompt = `Rédige un(e) ${docInfo.label} complet(e) et professionnel(le) avec les informations suivantes:

${fieldSummary}

Le document doit:
1. Commencer par le titre officiel du document en majuscules
2. Mentionner la date et le lieu
3. Identifier clairement toutes les parties
4. Inclure tous les articles obligatoires selon la loi OHADA/sénégalaise
5. Avoir une section signature avec espaces pour toutes les parties
6. Être prêt à l'usage (complet et professionnel)

${outputInstruction}

Pays: Sénégal — Droit applicable: OHADA + Code du Travail sénégalais${uploadedContext ? `\n\nDocuments de reference fournis :\n${uploadedContext.slice(0, 5000)}` : ''}`

  return await groqClientCall(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { maxTokens: 4000, temperature: 0.3 }
  )
}

export default function JuridiqueElite() {
  const { membre } = useAuth()
  const tool = useToolAccess('juridique', 'juridique_elite')
  const [docType, setDocType] = useState('statuts_sarl')
  const [formData, setFormData] = useState({})
  const [docContent, setDocContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingGenerate, setPendingGenerate] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [step, setStep] = useState('form') // 'form' | 'preview'
  const [generationTab, setGenerationTab] = useState('standard')
  const [uploadedContext, setUploadedContext] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const workspace = useWorkspace(`juridique-elite-${docType}`)

  // Auto-save brouillon 30 jours (remplace l'ancienne session éphémère)
  const { lastSavedAt: juridiqueSavedAt, clearDraft: clearJuridiqueDraft } = useDraftAutoSave(
    'abawi-juridique-draft',
    { docType, formData, docContent, generationTab },
    {
      onRestore: (d) => {
        if (d?.docType) setDocType(d.docType)
        if (d?.formData) setFormData(d.formData)
        if (d?.docContent) { setDocContent(d.docContent); setEditContent(d.docContent); setStep('preview') }
        if (d?.generationTab) setGenerationTab(d.generationTab)
      },
    }
  )

  useEffect(() => {
    if (tool.allowed) setShowPayment(false)
  }, [tool.allowed])

  const currentDoc = DOC_TYPES.find(d => d.id === docType)
  const fields = FIELDS_BY_TYPE[docType] || []

  function setField(key, val) {
    setFormData(prev => ({ ...prev, [key]: val }))
  }

  function handleDocTypeChange(id) {
    setDocType(id)
    setDocContent('')
    setEditContent('')
    setStep('form')
    setError('')
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ docType: id, formData: {}, docContent: '', generationTab })) } catch {}
  }

  async function genererDocument() {
    setLoading(true)
    setError('')
    try {
      const content = cleanIATextLight(await callGroqJuridique(docType, fields, formData, generationTab, uploadedContext))
      setDocContent(content)
      setEditContent(content)
      setStep('preview')
    } catch (e) {
      setError('Erreur lors de la génération. Vérifiez votre connexion et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!tool.allowed) {
      setPendingGenerate(true)
      setShowPayment(true)
      return
    }
    try {
      await genererDocument()
      if (!tool.unlimited) {
        const res = await tool.debit()
        if (!res.ok) { setShowPayment(true); return }
      }
    } catch (e) {
      // Génération échouée, pas de débit
    }
  }

  function handlePaymentSuccess() {
    if (pendingGenerate) {
      setPendingGenerate(false)
      setTimeout(() => handleGenerate(), 100)
    }
  }

  async function handleExportPDF() {
    if (!tool.allowed) { setShowPayment(true); return }
    try {
      await exportToPDF('doc-juridique-preview', `${currentDoc.label.replace(/\s+/g, '_')}_${Date.now()}`)
      if (!tool.unlimited) { const res = await tool.debit(); if (!res.ok) { setShowPayment(true); return } }
    } catch (e) { alert('Erreur export PDF') }
  }

  const displayContent = editMode ? editContent : docContent

  const filledCount = fields.filter(f => formData[f] && formData[f].trim()).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}>
      <SEO
        title="Juridique Élite — 12 documents OHADA conformes"
        description="Statuts SARL/SA, contrats CDI/CDD, baux résidentiel/commercial, NDA, mise en demeure, cession de parts, PV AG. Conforme droit OHADA et Code du travail sénégalais. Export PDF."
        keywords="OHADA, statuts SARL, statuts SA, contrat CDI Sénégal, contrat CDD, bail commercial OHADA, NDA, mise en demeure, cession parts, PV AG, droit des affaires"
        type="article"
      />
      {/* Header Premium */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 60%, #1c1408 100%)',
        borderBottom: '1px solid rgba(201,168,76,0.35)',
        padding: 'clamp(28px, 4vw, 48px) 2rem',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(201,168,76,0.18)',
      }}>
        <GradientOrbs variant="gold" intensity={0.5} count={3} />

        <div style={{ position: 'absolute', top: 12, right: 28, fontSize: '5rem', opacity: 0.07, transform: 'rotate(-14deg)', pointerEvents: 'none' }}>📜</div>
        <div style={{ position: 'absolute', bottom: 8, right: '18%', fontSize: '3.6rem', opacity: 0.06, transform: 'rotate(8deg)', pointerEvents: 'none' }}>⚖️</div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 100, background: 'rgba(201,168,76,0.18)', border: '1px solid rgba(201,168,76,0.45)', color: '#F0C040', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', marginBottom: 18, backdropFilter: 'blur(8px)' }}>
            ⚖️ JURIDIQUE · ÉLITE OHADA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: 64, height: 64,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(240,192,64,0.1))',
              border: '1px solid rgba(201,168,76,0.5)',
              fontSize: '2rem',
              boxShadow: '0 8px 24px rgba(201,168,76,0.35)',
              flexShrink: 0,
            }}>⚖️</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 900, background: 'linear-gradient(90deg, #c9a84c, #f0c040 50%, #fff5d6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                ABAWI Juridique Élite
              </h1>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Documents juridiques OHADA · Conformes droit sénégalais · Rédaction IA
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
            {[
              { icon: '📋', text: '12 types de documents' },
              { icon: '🌍', text: 'Droit OHADA + Sénégal' },
              { icon: '📄', text: 'Export PDF professionnel' },
              { icon: '🤖', text: 'Rédaction IA juridique' },
            ].map((tag) => (
              <span key={tag.text} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.4)',
                borderRadius: 100, padding: '5px 12px',
                fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 600,
                backdropFilter: 'blur(6px)',
              }}>
                <span>{tag.icon}</span>{tag.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 'min(1440px, 96vw)', margin: '0 auto', padding: 'clamp(16px, 2.5vw, 32px) clamp(16px, 2.5vw, 40px)' }}>
        <ToolInfoPanel
          toolName="Juridique Élite"
          icon="⚖️"
          description="12 types de documents juridiques OHADA conformes au droit sénégalais"
          benefits={[
            'Statuts SARL/SA, contrats CDI/CDD, baux, NDA, mise en demeure, cession de parts, PV d\'AG, franchise',
            'Toutes les mentions légales et clauses obligatoires sont pré-intégrées',
            'Adapté au droit OHADA et au Code du travail du Sénégal',
            'Rédaction automatique par IA à partir de vos informations',
            'Export PDF signable par les parties',
          ]}
          howToUse={[
            'Sélectionnez le type de document dans la colonne de gauche',
            'Remplissez les champs spécifiques (parties, montants, dates, clauses)',
            'Cliquez sur « Générer » — l\'IA produit l\'acte rédigé au format juridique',
            'Relisez attentivement et faites valider par un conseil juridique avant signature',
            'Exportez en PDF, signez et archivez',
          ]}
          tips={[
            'L\'outil est un assistant de rédaction — toujours faire valider les actes importants par un avocat',
            'Pour les statuts SARL/SA : capital minimum 1 000 000 FCFA (OHADA)',
            'Le contrat CDI au Sénégal impose une période d\'essai maximale de 3 mois',
            'Le bail commercial OHADA a une durée minimum de 3 ans renouvelables',
          ]}
        />
      </div>
      <div style={{ maxWidth: 'min(1440px, 96vw)', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px) 2rem', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
        {/* Sidebar — type de document */}
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', position: 'sticky', top: '1rem' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #222', background: 'var(--bg-secondary)' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Type de document</p>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {DOC_TYPES.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => handleDocTypeChange(doc.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '0.8rem 1rem',
                    background: docType === doc.id ? 'rgba(201,168,76,0.1)' : 'transparent',
                    border: 'none', borderLeft: docType === doc.id ? '3px solid #c9a84c' : '3px solid transparent',
                    color: docType === doc.id ? '#c9a84c' : '#ccc',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem',
                    fontSize: '0.85rem', transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{doc.icon}</span>
                  <span style={{ fontWeight: docType === doc.id ? 600 : 400 }}>{doc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <DocumentProfileManager />
          </div>
          {step === 'form' ? (
            <div>
              {/* Doc info card */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '2rem' }}>{currentDoc.icon}</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--gold)' }}>{currentDoc.label}</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{currentDoc.desc}</p>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--gold)' }}>7 900 FCFA</strong> · Accès 30 jours · Modifications illimitées · Export PDF inclus
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'standard', label: '📄 Document complet' },
                    { id: 'explain', label: '🧠 + Explications' },
                    { id: 'checklist', label: '✅ + Checklist conformité' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setGenerationTab(tab.id)}
                      style={{
                        padding: '0.45rem 0.8rem',
                        borderRadius: 999,
                        border: generationTab === tab.id ? '1px solid #c9a84c' : '1px solid #333',
                        background: generationTab === tab.id ? 'rgba(201,168,76,0.12)' : '#141414',
                        color: generationTab === tab.id ? '#c9a84c' : '#aaa',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form fields */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Informations du document</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filledCount}/{fields.length} champs remplis</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {fields.map(field => {
                    const isTextarea = ['objet_social', 'description_mission', 'description_bien', 'objet_litige', 'ordre_du_jour', 'resolutions', 'associes'].includes(field)
                    return (
                      <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: isTextarea ? 'span 2' : 'span 1' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {FIELD_LABELS[field] || field}
                        </label>
                        {isTextarea ? (
                          <textarea
                            rows={3}
                            value={formData[field] || ''}
                            onChange={e => setField(field, e.target.value)}
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.6rem 0.8rem', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }}
                          />
                        ) : (
                          <input
                            type="text"
                            value={formData[field] || ''}
                            onChange={e => setField(field, e.target.value)}
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.6rem 0.8rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.8rem 1rem', marginBottom: '1rem', color: '#EF4444', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              {/* Documents de reference */}
              <div style={{ marginBottom: '1.5rem' }}>
                <FileContextUpload
                  onExtracted={setUploadedContext}
                  label="Documents de reference (optionnel)"
                  hint="Modeles existants, conventions collectives, actes — PDF, Word, TXT"
                />
              </div>

              {/* Generate — always accessible */}
              <button
                onClick={genererDocument}
                disabled={loading}
                style={{
                  width: '100%', padding: '1rem', background: loading ? '#333' : 'linear-gradient(135deg, #c9a84c, #f0c040)',
                  border: 'none', borderRadius: 10, color: loading ? '#aaa' : '#0a0a0a', fontSize: '1rem',
                  fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Génération en cours...' : `⚖️ Générer un aperçu — ${currentDoc.label}`}
              </button>
              {!paid && (
                <p style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem', marginTop: '0.8rem' }}>
                  Aperçu gratuit · Paiement unique pour télécharger · Accès à tous les types de documents
                </p>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => setStep('form')} style={{ padding: '7px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem' }}>
                  ← Modifier les infos
                </button>
                <button onClick={genererDocument} disabled={loading} style={{ padding: '7px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--gold)', cursor: 'pointer', fontSize: '0.82rem' }}>
                  {loading ? '⏳ Régénération…' : '🔄 Régénérer'}
                </button>
                {!paid && (
                  <span style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--gold)', fontSize: '0.74rem', fontWeight: 700 }}>
                    🔒 Aperçu — paiement requis pour télécharger
                  </span>
                )}
              </div>

              {/* Paywall overlay wrapping the preview */}
              <div style={{ position: 'relative' }}>
                <div style={{ filter: paid ? 'none' : 'blur(5px)', userSelect: paid ? 'auto' : 'none', pointerEvents: paid ? 'auto' : 'none', transition: 'filter 0.3s' }}>
                  <DocOutputPanel
                    text={displayContent}
                    onTextChange={paid ? setEditContent : undefined}
                    exportId="doc-juridique-preview"
                    exportSlug={`document-juridique-${docType}`}
                    docTitle={DOC_TYPES.find(d => d.id === docType)?.label || 'Document juridique'}
                    dark={false}
                    editable={paid}
                  />
                </div>

                {paid && (
                  <div style={{ marginTop: 16 }}>
                    <WorkspacePanel
                      workspace={workspace}
                      onLoad={(content) => { setDocContent(content); setEditContent(content) }}
                      onReset={() => { setDocContent(''); setEditContent(''); setStep('form') }}
                      currentContent={displayContent}
                      toolLabel={currentDoc?.label || 'Document juridique'}
                      toolId={`juridique-elite-${docType}`}
                      toolPath="/outils/juridique"
                      accent="#c9a84c"
                    />
                  </div>
                )}
                {!paid && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(10,10,10,0.55)', backdropFilter: 'blur(2px)', borderRadius: 12, zIndex: 10,
                  }}>
                    <div style={{
                      background: 'var(--bg-card)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 16,
                      padding: '32px 28px', maxWidth: 400, width: '90%', textAlign: 'center',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔒</div>
                      <h3 style={{ color: 'var(--gold)', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 8px' }}>
                        Votre document est prêt
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 20px' }}>
                        Payez une fois pour débloquer le téléchargement, l'édition et l'export PDF de <strong style={{ color: 'var(--text-primary)' }}>{currentDoc?.label}</strong>.
                      </p>
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '1.6rem', fontWeight: 900, color: 'var(--gold)' }}>
                        7 900 FCFA
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 16 }}>
                        Paiement unique · Accès à tous les documents juridiques
                      </div>
                      <button
                        onClick={() => setShowPayment(true)}
                        style={{
                          width: '100%', padding: '14px', borderRadius: 10,
                          background: 'linear-gradient(135deg, #c9a84c, #f0c040)',
                          border: 'none', color: '#0a0a0a', fontSize: '1rem',
                          fontWeight: 800, cursor: 'pointer',
                        }}
                      >
                        💳 Débloquer ce document
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showPayment && (
        <PaymentFlow
          product={{ titre: `ABAWI Juridique Élite — ${currentDoc?.label}`, prix: 7900, id: 'juridique-elite', type: 'outil' }}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  )
}
