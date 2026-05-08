import { useRef, useState } from 'react'
import { exportToPDF } from '../../lib/generatePDF'
import { exportExcel as exportToExcel } from '../../lib/generatePDF'
import { cleanIATextLight } from '../../lib/cleanText'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../hooks/useWorkspace'
import { useBackgroundJob } from '../../hooks/useBackgroundJob'
import { useDraftAutoSave } from '../../hooks/useDraftAutoSave'

import { callGroq as groqCall } from '../../lib/groqClient'
import SEO from '../../components/SEO'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import GestionComptablePro from './GestionComptablePro'
import RichDoc from '../../components/RichDoc'

const COMPTABLE_SYSTEM = `Tu es un expert-comptable certifié SYSCOHADA avec 20 ans d'expérience en Afrique de l'Ouest. Tu réponds en français, avec précision et conformité aux normes OHADA, SYSCOHADA, et la réglementation fiscale sénégalaise en vigueur.

RÈGLES DE FORMATAGE STRICTES :
- ## (deux dièses + espace) pour les sections principales, ### pour les sous-sections
- **texte** pour les termes importants en gras (jamais ***)
- Listes avec "- " (jamais * ou ***)
- Jamais --- *** ### /// seuls sur une ligne
- Paragraphes bien espacés, ponctuation française soignée
- Pas de symboles parasites, pas de caractères spéciaux isolés`

const callGroq = (prompt, maxTokens = 2000) => groqCall(prompt, { maxTokens, temperature: 0.1, system: COMPTABLE_SYSTEM })

// Élite Comptable Sections
const SECTIONS = [
  { id: 'journal', label: 'Journal comptable', icon: '📒', color: '#0EA5E9' },
  { id: 'balance', label: 'Balance générale', icon: '⚖️', color: '#8B5CF6' },
  { id: 'cr', label: 'Compte de résultat', icon: '📊', color: '#F59E0B' },
  { id: 'bilan', label: 'Bilan SYSCOHADA', icon: '📋', color: '#EC4899' },
  { id: 'tva', label: 'Déclaration TVA', icon: '💵', color: '#22D3EE' },
  { id: 'paie', label: 'Bulletin de paie', icon: '👥', color: '#22C55E' },
  { id: 'kpi', label: 'KPI Comptable', icon: '📈', color: '#FB923C' },
  { id: 'rapport', label: 'Rapport IA', icon: '📄', color: '#34D399' },
  { id: 'gestion_pro', label: 'Gestion Pro', icon: '💼', color: '#F0B429' },
]

const COMPTES_OHADA = [
  { num: '101', lib: 'Capital social' }, { num: '411', lib: 'Clients' },
  { num: '401', lib: 'Fournisseurs' }, { num: '521', lib: 'Banque' },
  { num: '571', lib: 'Caisse' }, { num: '701', lib: 'Ventes marchandises' },
  { num: '601', lib: 'Achats marchandises' }, { num: '641', lib: 'Charges de personnel' },
  { num: '661', lib: 'Charges d\'intérêts' }, { num: '281', lib: 'Amortissements immob.' },
  { num: '44561', lib: 'TVA collectée' }, { num: '44566', lib: 'TVA déductible' },
  { num: '130', lib: 'Résultat de l\'exercice' }, { num: '191', lib: 'Provisions' },
]

// Élite Comptable Component
export default function ComptableEliteSimple() {
  const { membre } = useAuth()
  const [proMode, setProMode] = useState(false)
  const [section, setSection] = useState('journal')
  const [paid, setPaid] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [rapport, setRapport] = useState('')
  const [uploadedContext, setUploadedContext] = useState('')
  const containerRef = useRef(null)
  const workspace = useWorkspace('comptable-elite-rapport')
  const bgJob = useBackgroundJob('comptable-elite-rapport', 'Rapport Comptable Élite', 'anonymous', setRapport)

  // Élite State Management
  const [journal, setJournal] = useState({
    date: '', compte: '', libelle: '', debit: 0, credit: 0,
    reference: '', piece: ''
  })

  const [balance, setBalance] = useState({
    exercice: new Date().getFullYear(),
    date_arret: '',
    comptes: [],
    total_debit: 0,
    total_credit: 0,
    solde: 0
  })

  const [compteResultat, setCompteResultat] = useState({
    exercice: new Date().getFullYear(),
    produits_exploitation: 0,
    charges_exploitation: 0,
    resultat_exploitation: 0,
    produits_financiers: 0,
    charges_financieres: 0,
    resultat_financier: 0,
    resultat_exceptionnel: 0,
    impot_benefice: 0,
    resultat_net: 0
  })

  const [bilan, setBilan] = useState({
    actif_immobilise: 0,
    actif_circulant: 0,
    tresorerie_active: 0,
    total_actif: 0,
    capitaux_propres: 0,
    dettes_long_terme: 0,
    dettes_court_terme: 0,
    total_passif: 0
  })

  const [tva, setTva] = useState({
    periode: '',
    tva_collectee: 0,
    tva_deductible: 0,
    tva_a_payer: 0,
    credit_tva_precedent: 0,
    tva_exigible: 0
  })

  const [paie, setPaie] = useState({
    employe: '',
    salaire_brut: 0,
    cnss_employeur: 0,
    cnss_employe: 0,
    impot_sur_revenu: 0,
    autres_retentions: 0,
    salaire_net: 0,
    date_paie: ''
  })

  const [kpi, setKpi] = useState({
    rotation_stocks: 0,
    delai_client: 0,
    delai_fournisseur: 0,
    fonds_roulement: 0,
    besoin_fonds_roulement: 0,
    tresorerie_net: 0,
    autonomie_financiere: 0,
    rentabilite_financiere: 0
  })

  // Persistence — auto-save form data (30 days)
  const { lastSavedAt: comptableSavedAt, clearDraft: clearComptableDraft } = useDraftAutoSave(
    'abawi-comptable-draft',
    { journal, balance, compteResultat, bilan, tva, paie, kpi },
    {
      onRestore: (d) => {
        if (d?.journal) setJournal(d.journal)
        if (d?.balance) setBalance(d.balance)
        if (d?.compteResultat) setCompteResultat(d.compteResultat)
        if (d?.bilan) setBilan(d.bilan)
        if (d?.tva) setTva(d.tva)
        if (d?.paie) setPaie(d.paie)
        if (d?.kpi) setKpi(d.kpi)
      }
    }
  )

  // L'outil reste utilisable pour tous; le verrouillage intervient au moment de l'export final.

  // Élite Generation Functions
  const generateDocument = async (sectionId) => {
    setGenerating(true)
    setRapport('')
    
    try {
      let prompt = ''
      
      switch (sectionId) {
        case 'journal':
          prompt = `Génère un journal comptable de niveau cabinet SYSCOHADA pour:
          Date: ${journal.date}
          Compte: ${journal.compte}
          Libellé: ${journal.libelle}
          Débit: ${journal.debit}
          Crédit: ${journal.credit}
          Référence: ${journal.reference}
          Pièce: ${journal.piece}
          
          Inclus: validation des comptes, équilibre débit/crédit, conformité SYSCOHADA.`
          break
          
        case 'balance':
          prompt = `Génère une balance générale de niveau cabinet SYSCOHADA pour:
          Exercice: ${balance.exercice}
          Date d'arrêt: ${balance.date_arret}
          Total débit: ${balance.total_debit}
          Total crédit: ${balance.total_credit}
          Solde: ${balance.solde}
          
          Inclus: ventilation par classe, soldes, vérifications équilibre.`
          break
          
        case 'cr':
          prompt = `Génère un compte de résultat de niveau cabinet SYSCOHADA pour:
          Exercice: ${compteResultat.exercice}
          Produits exploitation: ${compteResultat.produits_exploitation}
          Charges exploitation: ${compteResultat.charges_exploitation}
          Résultat exploitation: ${compteResultat.resultat_exploitation}
          Produits financiers: ${compteResultat.produits_financiers}
          Charges financières: ${compteResultat.charges_financieres}
          Résultat financier: ${compteResultat.resultat_financier}
          Résultat exceptionnel: ${compteResultat.resultat_exceptionnel}
          Impôt bénéfice: ${compteResultat.impot_benefice}
          Résultat net: ${compteResultat.resultat_net}
          
          Inclus: analyse détaillée, marges, ratios, commentaires.`
          break
          
        case 'bilan':
          prompt = `Génère un bilan de niveau cabinet SYSCOHADA pour:
          Actif immobilisé: ${bilan.actif_immobilise}
          Actif circulant: ${bilan.actif_circulant}
          Trésorerie active: ${bilan.tresorerie_active}
          Total actif: ${bilan.total_actif}
          Capitaux propres: ${bilan.capitaux_propres}
          Dettes long terme: ${bilan.dettes_long_terme}
          Dettes court terme: ${bilan.dettes_court_terme}
          Total passif: ${bilan.total_passif}
          
          Inclus: structure détaillée, fonds de roulement, trésorerie.`
          break
          
        case 'tva':
          prompt = `Génère une déclaration TVA de niveau cabinet pour:
          Période: ${tva.periode}
          TVA collectée: ${tva.tva_collectee}
          TVA déductible: ${tva.tva_deductible}
          TVA à payer: ${tva.tva_a_payer}
          Crédit TVA précédent: ${tva.credit_tva_precedent}
          TVA exigible: ${tva.tva_exigible}
          
          Inclus: calculs détaillés, régularisations, conformité fiscale.`
          break
          
        case 'paie':
          prompt = `Génère un bulletin de paie de niveau cabinet pour:
          Employé: ${paie.employe}
          Salaire brut: ${paie.salaire_brut}
          CNSS employeur: ${paie.cnss_employeur}
          CNSS employé: ${paie.cnss_employe}
          Impôt sur revenu: ${paie.impot_sur_revenu}
          Autres retenues: ${paie.autres_retentions}
          Salaire net: ${paie.salaire_net}
          Date paie: ${paie.date_paie}
          
          Inclus: barèmes SYSCOHADA, cotisations sociales, fiscale.`
          break
          
        case 'kpi':
          prompt = `Génère une analyse KPI de niveau cabinet pour:
          Rotation stocks: ${kpi.rotation_stocks}
          Délai client: ${kpi.delai_client}
          Délai fournisseur: ${kpi.delai_fournisseur}
          Fonds de roulement: ${kpi.fonds_roulement}
          Besoin fonds de roulement: ${kpi.besoin_fonds_roulement}
          Trésorerie net: ${kpi.tresorerie_net}
          Autonomie financière: ${kpi.autonomie_financiere}
          Rentabilité financière: ${kpi.rentabilite_financiere}
          
          Inclus: interprétation, benchmarks, recommandations.`
          break
          
        case 'rapport':
          prompt = `Génère un rapport comptable IA de niveau cabinet synthétique intégrant toutes les analyses comptables, financières et fiscales avec recommandations stratégiques.`
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
            filename: `comptable-elite-${section}-${Date.now()}.pdf`,
            includeHeader: true,
            includeFooter: true,
            headerText: `Rapport Comptable Élite - ${SECTIONS.find(s => s.id === section)?.label}`,
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
        journal, balance, compteResultat, bilan, tva, paie, kpi
      }
      
      await exportToExcel(data, {
        filename: `comptable-elite-${section}-${Date.now()}.xlsx`,
        sheetName: 'Rapport Comptable Élite'
      })
    } catch (error) {
      alert(`Erreur export Excel: ${error.message}`)
    }
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
      minHeight: '100vh',
    }}>
      <SEO
        title="Comptable Élite — SYSCOHADA & OHADA"
        description="Générez documents comptables SYSCOHADA conformes : journal, balance, TVA, paie, reporting. Expert-comptable virtuel OHADA pour l'Afrique de l'Ouest."
        keywords="SYSCOHADA, OHADA, comptabilité Sénégal, journal comptable, balance, TVA, paie, reporting financier, expert-comptable virtuel"
        type="article"
      />
      <ToolInfoPanel
        toolName="Comptable Élite"
        icon="📒"
        description="Comptabilité SYSCOHADA complète : journal, balance, TVA, paie, reporting IA"
        benefits={[
          'Saisissez votre journal comptable avec contrôle automatique de l\'équilibre débit/crédit',
          "Produisez bilan, compte de résultat et déclaration TVA aux normes SYSCOHADA",
          "Calculez les bulletins de paie selon la fiscalité sénégalaise (CNSS, IPRES, IR)",
          'Obtenez des KPI comptables et un rapport IA prêt à envoyer à votre expert-comptable',
          'Exportez en PDF et Excel pour votre cabinet ou vos archives',
        ]}
        howToUse={[
          'Commencez par saisir vos écritures dans le journal comptable',
          'Choisissez la section : balance, compte de résultat, bilan, TVA, paie, KPI',
          'Remplissez les champs spécifiques à chaque document',
          'Cliquez sur « Générer » pour obtenir le document calibré SYSCOHADA',
          "Utilisez le rapport IA pour un commentaire de gestion automatisé",
        ]}
        tips={[
          "Les comptes OHADA standards (411, 401, 601...) sont pré-chargés pour l'autocomplétion",
          "La TVA sénégalaise par défaut est de 18 % — ajustable par opération",
          "Pour la paie : saisissez le salaire brut, l'outil déduit CNSS/IPRES/IR automatiquement",
          "Le rapport IA combine toutes les données pour produire un diagnostic financier",
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
          Comptable Élite
        </h1>
        <p style={{ 
          color: '#DBEAFE', 
          fontSize: '1.2rem',
          margin: 0,
          position: 'relative',
          zIndex: 1
        }}>
          Expertise comptable SYSCOHADA avec IA et conformité OHADA
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
            ? Normes SYSCOHADA
          </div>
          <div style={{ 
            padding: '8px 16px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '100px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            ? Comptes OHADA
          </div>
          <div style={{ 
            padding: '8px 16px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '100px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            ? Fiscalité Sénégal
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
        <div ref={containerRef}>
          {section === 'journal' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Journal Comptable SYSCOHADA</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Date</label>
                  <input
                    type="date"
                    value={journal.date}
                    onChange={(e) => setJournal(prev => ({ ...prev, date: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Compte</label>
                  <select
                    value={journal.compte}
                    onChange={(e) => setJournal(prev => ({ ...prev, compte: e.target.value }))}
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
                    <option value="">Sélectionner un compte</option>
                    {COMPTES_OHADA.map(compte => (
                      <option key={compte.num} value={compte.num}>
                        {compte.num} - {compte.lib}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Libellé</label>
                  <input
                    type="text"
                    value={journal.libelle}
                    onChange={(e) => setJournal(prev => ({ ...prev, libelle: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Débit</label>
                  <input
                    type="number"
                    value={journal.debit}
                    onChange={(e) => setJournal(prev => ({ ...prev, debit: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Crédit</label>
                  <input
                    type="number"
                    value={journal.credit}
                    onChange={(e) => setJournal(prev => ({ ...prev, credit: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Référence</label>
                  <input
                    type="text"
                    value={journal.reference}
                    onChange={(e) => setJournal(prev => ({ ...prev, reference: e.target.value }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Pièce</label>
                  <input
                    type="text"
                    value={journal.piece}
                    onChange={(e) => setJournal(prev => ({ ...prev, piece: e.target.value }))}
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
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 8 }}>
                  Équilibre: Débit = {journal.debit} | Crédit = {journal.credit}
                </div>
                <div style={{ 
                  color: journal.debit === journal.credit ? '#22C55E' : '#EF4444', 
                  fontWeight: 600 
                }}>
                  {journal.debit === journal.credit ? '✅ Équilibré' : '⚠️ Non équilibré'}
                </div>
              </div>
            </div>
          )}

          {section === 'compte_resultat' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Compte de Résultat SYSCOHADA</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Exercice</label>
                  <input
                    type="number"
                    value={compteResultat.exercice}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, exercice: parseInt(e.target.value) }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Produits d'exploitation</label>
                  <input
                    type="number"
                    value={compteResultat.produits_exploitation}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, produits_exploitation: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Charges d'exploitation</label>
                  <input
                    type="number"
                    value={compteResultat.charges_exploitation}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, charges_exploitation: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Produits financiers</label>
                  <input
                    type="number"
                    value={compteResultat.produits_financiers}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, produits_financiers: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Charges financières</label>
                  <input
                    type="number"
                    value={compteResultat.charges_financieres}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, charges_financieres: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Résultat exceptionnel</label>
                  <input
                    type="number"
                    value={compteResultat.resultat_exceptionnel}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, resultat_exceptionnel: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Impôt sur bénéfice</label>
                  <input
                    type="number"
                    value={compteResultat.impot_benefice}
                    onChange={(e) => setCompteResultat(prev => ({ ...prev, impot_benefice: parseFloat(e.target.value) || 0 }))}
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
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Résultat d'exploitation</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>
                      {(compteResultat.produits_exploitation - compteResultat.charges_exploitation).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Résultat financier</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>
                      {(compteResultat.produits_financiers - compteResultat.charges_financieres).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Résultat net</div>
                    <div style={{ 
                      color: (compteResultat.produits_exploitation - compteResultat.charges_exploitation + 
                              compteResultat.produits_financiers - compteResultat.charges_financieres + 
                              compteResultat.resultat_exceptionnel - compteResultat.impot_benefice) >= 0 ? '#22C55E' : '#EF4444', 
                      fontSize: '1.2rem', 
                      fontWeight: 700 
                    }}>
                      {(compteResultat.produits_exploitation - compteResultat.charges_exploitation + 
                        compteResultat.produits_financiers - compteResultat.charges_financieres + 
                        compteResultat.resultat_exceptionnel - compteResultat.impot_benefice).toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'kpi' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>KPI Comptables</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Fonds de roulement</label>
                  <input
                    type="number"
                    value={kpi.fonds_roulement}
                    onChange={(e) => setKpi(prev => ({ ...prev, fonds_roulement: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Besoin en fonds de roulement</label>
                  <input
                    type="number"
                    value={kpi.besoin_fonds_roulement}
                    onChange={(e) => setKpi(prev => ({ ...prev, besoin_fonds_roulement: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Trésorerie net</label>
                  <input
                    type="number"
                    value={kpi.tresorerie_net}
                    onChange={(e) => setKpi(prev => ({ ...prev, tresorerie_net: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Autonomie financière (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={kpi.autonomie_financiere}
                    onChange={(e) => setKpi(prev => ({ ...prev, autonomie_financiere: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Rentabilité financière (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={kpi.rentabilite_financiere}
                    onChange={(e) => setKpi(prev => ({ ...prev, rentabilite_financiere: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Rotation des stocks</label>
                  <input
                    type="number"
                    step="0.01"
                    value={kpi.rotation_stocks}
                    onChange={(e) => setKpi(prev => ({ ...prev, rotation_stocks: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Délai client (jours)</label>
                  <input
                    type="number"
                    value={kpi.delai_client}
                    onChange={(e) => setKpi(prev => ({ ...prev, delai_client: parseFloat(e.target.value) || 0 }))}
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
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Délai fournisseur (jours)</label>
                  <input
                    type="number"
                    value={kpi.delai_fournisseur}
                    onChange={(e) => setKpi(prev => ({ ...prev, delai_fournisseur: parseFloat(e.target.value) || 0 }))}
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
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Trésorerie nette</div>
                    <div style={{ 
                      color: kpi.tresorerie_net >= 0 ? '#22C55E' : '#EF4444', 
                      fontSize: '1.2rem', 
                      fontWeight: 700 
                    }}>
                      {kpi.tresorerie_net.toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Trésorerie disponible</div>
                    <div style={{ 
                      color: (kpi.fonds_roulement - kpi.besoin_fonds_roulement) >= 0 ? '#22C55E' : '#EF4444', 
                      fontSize: '1.2rem', 
                      fontWeight: 700 
                    }}>
                      {(kpi.fonds_roulement - kpi.besoin_fonds_roulement).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Autonomie financière</div>
                    <div style={{ 
                      color: kpi.autonomie_financiere >= 50 ? '#22C55E' : kpi.autonomie_financiere >= 30 ? '#F59E0B' : '#EF4444', 
                      fontSize: '1.2rem', 
                      fontWeight: 700 
                    }}>
                      {kpi.autonomie_financiere.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Gestion Pro */}
          {section === 'gestion_pro' && (
            <GestionComptablePro />
          )}

          {/* Generated Content Display */}
          {rapport && (
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
                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Analyse Comptable Élite Générée</h3>
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
              <RichDoc text={rapport} />
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
          Comptable Élite - Propulsé par Abawi IA
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 24, 
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem'
        }}>
          <div>⚖️ Normes SYSCOHADA</div>
          <div>📒 Comptes OHADA</div>
          <div>💵 Fiscalité Sénégal</div>
          <div>📄 Export PDF/Excel</div>
        </div>
      </div>
    </div>
  )
}
