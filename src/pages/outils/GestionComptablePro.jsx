import { useState, useEffect, useMemo, useRef } from 'react'
import { exportExcel } from '../../lib/generatePDF'
import '../../styles/ThemeUniversal.css'
import ToolInfoPanel from '../../components/ToolInfoPanel'

const STORAGE_KEY = 'abawi_comptable_pro_v1'
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }

// ── Styles ──────────────────────────────────────────────────────────────────
const C = 'var(--green)'
const inp = { width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'Outfit,sans-serif', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }
const btn = (color = C) => ({ padding: '9px 18px', borderRadius: '8px', background: `linear-gradient(135deg,${color === 'var(--green)' ? '#18A84A' : color},${color === 'var(--green)' ? '#16a34a' : color + 'cc'})`, border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Outfit,sans-serif' })
const btnGhost = (color = C) => ({ padding: '8px 14px', borderRadius: '8px', background: color === 'var(--green)' ? 'rgba(24,168,74,0.08)' : color + '14', border: `1px solid ${color === 'var(--green)' ? 'rgba(24,168,74,0.2)' : color + '33'}`, color, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Outfit,sans-serif' })

// ── Plan comptable SYSCOHADA par défaut ──────────────────────────────────────
const PLAN_DEFAULT = [
  // Classe 1
  { num:'101', lib:'Capital social', cl:1, type:'P' },
  { num:'111', lib:'Réserves légales', cl:1, type:'P' },
  { num:'118', lib:'Autres réserves', cl:1, type:'P' },
  { num:'121', lib:'Report à nouveau (solde créditeur)', cl:1, type:'P' },
  { num:'129', lib:'Report à nouveau (solde débiteur)', cl:1, type:'A' },
  { num:'130', lib:'Résultat net exercice (bénéfice)', cl:1, type:'P' },
  { num:'139', lib:'Résultat net exercice (perte)', cl:1, type:'A' },
  { num:'141', lib:'Subventions d\'équipement reçues', cl:1, type:'P' },
  { num:'161', lib:'Emprunts obligataires', cl:1, type:'P' },
  { num:'162', lib:'Emprunts — établissements de crédit', cl:1, type:'P' },
  { num:'163', lib:'Emprunts et dettes financières divers', cl:1, type:'P' },
  { num:'164', lib:'Dettes de location-acquisition', cl:1, type:'P' },
  { num:'165', lib:'Dépôts et cautionnements reçus', cl:1, type:'P' },
  { num:'191', lib:'Provisions pour risques', cl:1, type:'P' },
  { num:'192', lib:'Provisions pour charges', cl:1, type:'P' },
  // Classe 2
  { num:'201', lib:'Frais de développement', cl:2, type:'A' },
  { num:'202', lib:'Brevets, licences, logiciels', cl:2, type:'A' },
  { num:'203', lib:'Fonds commercial', cl:2, type:'A' },
  { num:'211', lib:'Terrains', cl:2, type:'A' },
  { num:'221', lib:'Bâtiments sur sol propre', cl:2, type:'A' },
  { num:'222', lib:'Bâtiments sur sol d\'autrui', cl:2, type:'A' },
  { num:'231', lib:'Matériel et outillage industriel', cl:2, type:'A' },
  { num:'234', lib:'Matériel d\'emballage récupérable', cl:2, type:'A' },
  { num:'241', lib:'Matériel et mobilier', cl:2, type:'A' },
  { num:'242', lib:'Matériel de transport', cl:2, type:'A' },
  { num:'243', lib:'Matériel et mobilier de bureau', cl:2, type:'A' },
  { num:'244', lib:'Matériel informatique', cl:2, type:'A' },
  { num:'251', lib:'Dépôts et cautionnements versés', cl:2, type:'A' },
  { num:'261', lib:'Titres de participation', cl:2, type:'A' },
  { num:'271', lib:'Prêts et créances non commerciales', cl:2, type:'A' },
  { num:'281', lib:'Amort. immobilisations incorporelles', cl:2, type:'AC' },
  { num:'283', lib:'Amort. bâtiments', cl:2, type:'AC' },
  { num:'284', lib:'Amort. matériel', cl:2, type:'AC' },
  // Classe 3
  { num:'31', lib:'Marchandises', cl:3, type:'A' },
  { num:'32', lib:'Matières premières', cl:3, type:'A' },
  { num:'33', lib:'Autres approvisionnements', cl:3, type:'A' },
  { num:'35', lib:'Produits finis', cl:3, type:'A' },
  { num:'37', lib:'Emballages commerciaux', cl:3, type:'A' },
  // Classe 4
  { num:'401', lib:'Fournisseurs', cl:4, type:'P' },
  { num:'402', lib:'Fournisseurs — effets à payer', cl:4, type:'P' },
  { num:'408', lib:'Fournisseurs — factures non parvenues', cl:4, type:'P' },
  { num:'409', lib:'Fournisseurs — avances versés', cl:4, type:'A' },
  { num:'411', lib:'Clients', cl:4, type:'A' },
  { num:'412', lib:'Clients — effets à recevoir', cl:4, type:'A' },
  { num:'418', lib:'Clients — produits non encore facturés', cl:4, type:'A' },
  { num:'419', lib:'Clients — avances reçus', cl:4, type:'P' },
  { num:'421', lib:'Personnel — rémunérations dues', cl:4, type:'P' },
  { num:'422', lib:'Personnel — avances et acomptes', cl:4, type:'A' },
  { num:'431', lib:'IPRES et retraite', cl:4, type:'P' },
  { num:'432', lib:'IPM et mutuelle', cl:4, type:'P' },
  { num:'433', lib:'CSS — autres cotisations', cl:4, type:'P' },
  { num:'441', lib:'État — impôts et taxes à payer', cl:4, type:'P' },
  { num:'4421', lib:'État — TVA facturée', cl:4, type:'P' },
  { num:'4431', lib:'État — TVA due', cl:4, type:'P' },
  { num:'4441', lib:'État — impôts sur bénéfices', cl:4, type:'P' },
  { num:'4456', lib:'État — TVA déductible', cl:4, type:'A' },
  { num:'446', lib:'État — crédit de TVA', cl:4, type:'A' },
  { num:'471', lib:'Débiteurs divers', cl:4, type:'A' },
  { num:'481', lib:'Charges constatées d\'avance', cl:4, type:'A' },
  { num:'487', lib:'Produits constatés d\'avance', cl:4, type:'P' },
  { num:'491', lib:'Provisions dépréciation clients', cl:4, type:'AC' },
  // Classe 5
  { num:'511', lib:'Chèques à encaisser', cl:5, type:'A' },
  { num:'521', lib:'Banque — compte courant', cl:5, type:'A' },
  { num:'522', lib:'Banque — compte à terme', cl:5, type:'A' },
  { num:'531', lib:'CCP', cl:5, type:'A' },
  { num:'571', lib:'Caisse siège social', cl:5, type:'A' },
  { num:'572', lib:'Caisse agence', cl:5, type:'A' },
  // Classe 6
  { num:'601', lib:'Achats de marchandises', cl:6, type:'C' },
  { num:'602', lib:'Achats de matières premières', cl:6, type:'C' },
  { num:'603', lib:'Variations des stocks — marchandises', cl:6, type:'C' },
  { num:'604', lib:'Achats de matières et fournitures', cl:6, type:'C' },
  { num:'605', lib:'Autres achats', cl:6, type:'C' },
  { num:'611', lib:'Transports sur achats', cl:6, type:'C' },
  { num:'612', lib:'Transports sur ventes', cl:6, type:'C' },
  { num:'621', lib:'Sous-traitance générale', cl:6, type:'C' },
  { num:'622', lib:'Locations et charges locatives', cl:6, type:'C' },
  { num:'623', lib:'Redevances de crédit-bail', cl:6, type:'C' },
  { num:'624', lib:'Entretien, réparations', cl:6, type:'C' },
  { num:'625', lib:'Primes d\'assurance', cl:6, type:'C' },
  { num:'626', lib:'Études, recherches', cl:6, type:'C' },
  { num:'627', lib:'Publicité, publications', cl:6, type:'C' },
  { num:'628', lib:'Télécommunications et frais bureau', cl:6, type:'C' },
  { num:'629', lib:'Autres services extérieurs', cl:6, type:'C' },
  { num:'631', lib:'Impôts et taxes directs', cl:6, type:'C' },
  { num:'632', lib:'Impôts indirects', cl:6, type:'C' },
  { num:'641', lib:'Salaires et traitements', cl:6, type:'C' },
  { num:'643', lib:'IPRES — part patronale', cl:6, type:'C' },
  { num:'644', lib:'IPM — part patronale', cl:6, type:'C' },
  { num:'645', lib:'CSS — part patronale', cl:6, type:'C' },
  { num:'651', lib:'Pertes sur créances irrécouvrables', cl:6, type:'C' },
  { num:'661', lib:'Intérêts des emprunts', cl:6, type:'C' },
  { num:'671', lib:'VNC cessions d\'immobilisations', cl:6, type:'C' },
  { num:'681', lib:'Dotations aux amortissements', cl:6, type:'C' },
  { num:'691', lib:'Impôts sur les bénéfices (IS)', cl:6, type:'C' },
  // Classe 7
  { num:'701', lib:'Ventes de marchandises', cl:7, type:'R' },
  { num:'702', lib:'Ventes de produits finis', cl:7, type:'R' },
  { num:'703', lib:'Ventes de travaux et services', cl:7, type:'R' },
  { num:'704', lib:'Prestations de services', cl:7, type:'R' },
  { num:'706', lib:'Produits accessoires', cl:7, type:'R' },
  { num:'731', lib:'Variations stocks produits finis', cl:7, type:'R' },
  { num:'741', lib:'Subventions d\'exploitation', cl:7, type:'R' },
  { num:'751', lib:'Revenus des participations', cl:7, type:'R' },
  { num:'761', lib:'Intérêts de prêts et créances', cl:7, type:'R' },
  { num:'771', lib:'Produits des cessions d\'immobilisations', cl:7, type:'R' },
  { num:'781', lib:'Reprises d\'amortissements', cl:7, type:'R' },
  { num:'791', lib:'Transferts de charges', cl:7, type:'R' },
]

const JOURNAUX = [
  { code:'VTE', lib:'Ventes', icon:'💰' },
  { code:'ACH', lib:'Achats', icon:'🛒' },
  { code:'BNQ', lib:'Banque', icon:'🏦' },
  { code:'CAI', lib:'Caisse', icon:'💵' },
  { code:'PAI', lib:'Paie', icon:'👥' },
  { code:'OD',  lib:'Opérations diverses', icon:'📝' },
]

const SECTIONS = [
  { id:'dashboard', label:'Tableau de bord', icon:'🏠' },
  { id:'plan',      label:'Plan comptable', icon:'📋' },
  { id:'saisie',    label:'Saisir écriture', icon:'✏️' },
  { id:'journal',   label:'Journal général', icon:'📔' },
  { id:'grand_livre',label:'Grand livre', icon:'📖' },
  { id:'balance',   label:'Balance', icon:'⚖️' },
  { id:'cr',        label:'Compte de résultat', icon:'📊' },
  { id:'bilan',     label:'Bilan SYSCOHADA', icon:'🏛️' },
  { id:'immo',      label:'Immobilisations', icon:'🏭' },
  { id:'rapprochement',label:'Rapprochement', icon:'🔗' },
  { id:'exercices', label:'Exercices', icon:'🗓️' },
]

function initData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const now = new Date().getFullYear()
  return {
    plan: PLAN_DEFAULT.map(c => ({ ...c, custom: false })),
    ecritures: [],
    immobilisations: [],
    exercices: [{ id: String(now), annee: now, debut: `${now}-01-01`, fin: `${now}-12-31`, statut: 'ouvert' }],
    currentExercice: String(now),
  }
}

function calcAmortissement(immo) {
  const base = new Date(immo.date_service || immo.date_acquisition)
  const rows = []
  let vnc = immo.valeur_brute
  const dot = immo.valeur_brute / immo.duree_ans
  for (let i = 0; i < immo.duree_ans; i++) {
    const annee = base.getFullYear() + i
    const d = immo.methode === 'degressif' ? vnc * (immo.taux / 100) : dot
    const real = Math.min(d, vnc)
    vnc = Math.max(0, vnc - real)
    rows.push({ annee, dotation: Math.round(real), amort_cumul: Math.round(immo.valeur_brute - vnc), vnc: Math.round(vnc) })
  }
  return rows
}

// ── AccountSearch ─────────────────────────────────────────────────────────────
function AccountSearch({ plan, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState(value || '')
  const ref = useRef()

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
  useEffect(() => { setQ(value || '') }, [value])

  const filtered = useMemo(() => {
    if (!q || q.length < 1) return []
    const qn = q.toLowerCase()
    return plan.filter(c => c.num.startsWith(q) || c.lib.toLowerCase().includes(qn)).slice(0, 8)
  }, [q, plan])

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <input value={q} placeholder={placeholder || 'N° compte ou libellé'} style={inp}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--bg-card)', border: `1px solid ${C}44`, borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
          {filtered.map(c => (
            <div key={c.num} onMouseDown={() => { onChange(c.num, c.lib); setQ(`${c.num} — ${c.lib}`); setOpen(false) }}
              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--border)', fontSize: '0.78rem' }}
              onMouseEnter={e => e.currentTarget.style.background = '#18A84A18'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ color: 'var(--gold)', fontWeight: 700, minWidth: 50 }}>{c.num}</span>
              <span style={{ color: 'var(--text-primary)' }}>{c.lib}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 4, padding: '2px 6px' }}>
                {c.type === 'A' ? 'Actif' : c.type === 'P' ? 'Passif' : c.type === 'C' ? 'Charge' : c.type === 'R' ? 'Produit' : c.type === 'AC' ? 'Contra' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GestionComptablePro({ onBack }) {
  const [data, setData] = useState(initData)
  const [section, setSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Saisie écriture state
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), piece: '', libelle: '', journal: 'OD', exercice: '' })
  const [lignes, setLignes] = useState([
    { id: uid(), compte: '', compteLib: '', debit: '', credit: '' },
    { id: uid(), compte: '', compteLib: '', debit: '', credit: '' },
  ])
  const [saisieMsg, setSaisieMsg] = useState('')

  // Plan comptable state
  const [planSearch, setPlanSearch] = useState('')
  const [planClass, setPlanClass] = useState('all')
  const [newCompte, setNewCompte] = useState({ num: '', lib: '', cl: 1, type: 'A' })
  const [showAddCompte, setShowAddCompte] = useState(false)

  // Grand livre filter
  const [glCompte, setGlCompte] = useState('')
  const [glCompteName, setGlCompteName] = useState('')

  // Immobilisation state
  const [newImmo, setNewImmo] = useState({ designation: '', compte: '241', compteLib: 'Matériel', date_acquisition: new Date().toISOString().slice(0,10), date_service: '', valeur_brute: 0, methode: 'lineaire', duree_ans: 3, taux: 33.33 })
  const [showAddImmo, setShowAddImmo] = useState(false)
  const [selectedImmo, setSelectedImmo] = useState(null)

  // Rapprochement
  const [rappCompte, setRappCompte] = useState('521')
  const [rappLignes, setRappLignes] = useState([{ id: uid(), date: '', lib: '', montant: 0, type: 'D', pointe: false }])

  // Exercice filter
  const exercice = data.exercices.find(e => e.id === data.currentExercice) || data.exercices[0]

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
  }, [data])

  // Init form exercice
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
    setForm(f => ({ ...f, exercice: data.currentExercice }))
  }, [data.currentExercice])

  // ── Computed ──────────────────────────────────────────────────────────────
  const ecrituresExo = useMemo(() =>
    data.ecritures.filter(e => e.exercice === data.currentExercice),
    [data.ecritures, data.currentExercice])

  const balance = useMemo(() => {
    const acc = {}
    ecrituresExo.forEach(e => {
      e.lignes.forEach(l => {
        if (!acc[l.compte]) acc[l.compte] = { debit: 0, credit: 0 }
        acc[l.compte].debit += Number(l.debit) || 0
        acc[l.compte].credit += Number(l.credit) || 0
      })
    })
    return acc
  }, [ecrituresExo])

  const grandLivre = useMemo(() => {
    const gl = {}
    ecrituresExo.forEach(e => {
      e.lignes.forEach(l => {
        if (!gl[l.compte]) gl[l.compte] = []
        gl[l.compte].push({ date: e.date, piece: e.piece, libelle: e.libelle, compteLib: l.compteLib, debit: Number(l.debit)||0, credit: Number(l.credit)||0, ecrId: e.id })
      })
    })
    Object.values(gl).forEach(arr => arr.sort((a,b) => a.date > b.date ? 1 : -1))
    return gl
  }, [ecrituresExo])

  const crCalc = useMemo(() => {
    let ventes=0, achats=0, autresCharges=0, chargesPersonnel=0, dotations=0, chargesFin=0, produitsFin=0, is=0, autresProduits=0
    Object.entries(balance).forEach(([num, val]) => {
      const solde = val.debit - val.credit
      const cl = parseInt(num[0])
      if (cl === 7) {
        const net = val.credit - val.debit
        if (['701','702','703','704','705','706'].some(p => num.startsWith(p))) ventes += net
        else if (num.startsWith('76') || num.startsWith('75')) produitsFin += net
        else autresProduits += net
      }
      if (cl === 6) {
        if (['601','602','603','604','605'].some(p => num.startsWith(p))) achats += solde
        else if (num.startsWith('64') || num.startsWith('65')) chargesPersonnel += solde
        else if (num.startsWith('68')) dotations += solde
        else if (num.startsWith('66') || num.startsWith('67')) chargesFin += solde
        else if (num.startsWith('69')) is += solde
        else autresCharges += solde
      }
    })
    const mb = ventes - achats
    const va = mb - autresCharges
    const ebe = va - chargesPersonnel
    const re = ebe - dotations
    const rf = produitsFin - chargesFin + autresProduits
    const rai = re + rf
    const rn = rai - is
    return { ventes, achats, autresCharges, chargesPersonnel, dotations, chargesFin, produitsFin, is, mb, va, ebe, re, rf, rai, rn }
  }, [balance])

  const bilanCalc = useMemo(() => {
    const actif = { immo_brut:0, amort:0, stocks:0, clients:0, tresorerie:0, autres_actif:0 }
    const passif = { capitaux:0, reserves:0, emprunts:0, fournisseurs:0, autres_passif:0 }
    Object.entries(balance).forEach(([num, val]) => {
      const compte = data.plan.find(c => num.startsWith(c.num) || c.num === num)
      if (!compte) return
      const solde = val.debit - val.credit
      const cl = compte.cl
      if (cl === 2) {
        if (compte.type === 'AC') actif.amort += Math.abs(solde)
        else actif.immo_brut += solde
      } else if (cl === 3) { actif.stocks += solde }
      else if (cl === 4) {
        if (compte.type === 'A') actif.clients += solde > 0 ? solde : 0
        else passif.autres_passif += solde < 0 ? -solde : 0
        if (num.startsWith('411') || num.startsWith('412')) actif.clients += (solde > 0 ? solde : 0)
        if (num.startsWith('401') || num.startsWith('402')) passif.fournisseurs += (solde < 0 ? -solde : 0)
      } else if (cl === 5) { actif.tresorerie += solde }
      else if (cl === 1) {
        if (num.startsWith('1') && ['101','111','112','118','121','130'].some(p => num.startsWith(p))) passif.capitaux += (-solde)
        else if (num.startsWith('16')) passif.emprunts += (-solde)
        else passif.autres_passif += (-solde)
      }
    })
    const actif_net = actif.immo_brut - actif.amort + actif.stocks + actif.clients + actif.tresorerie + actif.autres_actif
    const passif_total = passif.capitaux + passif.reserves + passif.emprunts + passif.fournisseurs + passif.autres_passif
    return { actif, passif, actif_net, passif_total }
  }, [balance, data.plan])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function saveEcriture() {
    const totalDebit = lignes.reduce((s,l) => s + (Number(l.debit)||0), 0)
    const totalCredit = lignes.reduce((s,l) => s + (Number(l.credit)||0), 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) { setSaisieMsg('❌ Débit ≠ Crédit — l\'écriture n\'est pas équilibrée'); return }
    if (!form.date || !form.libelle) { setSaisieMsg('❌ Date et libellé requis'); return }
    const validLignes = lignes.filter(l => l.compte && (Number(l.debit)||0) + (Number(l.credit)||0) > 0)
    if (validLignes.length < 2) { setSaisieMsg('❌ Minimum 2 lignes avec montant'); return }
    const ecr = { id: uid(), ...form, lignes: validLignes }
    setData(d => ({ ...d, ecritures: [...d.ecritures, ecr] }))
    setLignes([{ id:uid(), compte:'', compteLib:'', debit:'', credit:'' }, { id:uid(), compte:'', compteLib:'', debit:'', credit:'' }])
    setForm(f => ({ ...f, piece: '', libelle: '' }))
    setSaisieMsg('✅ Écriture enregistrée')
    setTimeout(() => setSaisieMsg(''), 2500)
  }

  function deleteEcriture(id) {
    setData(d => ({ ...d, ecritures: d.ecritures.filter(e => e.id !== id) }))
  }

  function addLigne() {
    setLignes(l => [...l, { id:uid(), compte:'', compteLib:'', debit:'', credit:'' }])
  }

  function addCompte() {
    if (!newCompte.num || !newCompte.lib) return
    if (data.plan.some(c => c.num === newCompte.num)) { alert('Ce numéro existe déjà'); return }
    setData(d => ({ ...d, plan: [...d.plan, { ...newCompte, custom: true }].sort((a,b) => a.num.localeCompare(b.num)) }))
    setNewCompte({ num:'', lib:'', cl:1, type:'A' })
    setShowAddCompte(false)
  }

  function deleteCompte(num) {
    const used = data.ecritures.some(e => e.lignes.some(l => l.compte === num))
    if (used) { alert('Ce compte est utilisé dans des écritures'); return }
    setData(d => ({ ...d, plan: d.plan.filter(c => c.num !== num) }))
  }

  function addImmobilisation() {
    if (!newImmo.designation || !newImmo.valeur_brute) return
    setData(d => ({ ...d, immobilisations: [...d.immobilisations, { ...newImmo, id: uid(), taux: 100/newImmo.duree_ans }] }))
    setNewImmo({ designation:'', compte:'241', compteLib:'Matériel', date_acquisition: new Date().toISOString().slice(0,10), date_service:'', valeur_brute:0, methode:'lineaire', duree_ans:3, taux:33.33 })
    setShowAddImmo(false)
  }

  function addExercice() {
    const annee = new Date().getFullYear() + 1
    const id = String(annee)
    if (data.exercices.some(e => e.id === id)) return
    setData(d => ({ ...d, exercices: [...d.exercices, { id, annee, debut:`${annee}-01-01`, fin:`${annee}-12-31`, statut:'ouvert' }] }))
  }

  const fmt = n => (n||0).toLocaleString('fr-FR')

  // ── Render sections ───────────────────────────────────────────────────────
  const planFiltered = useMemo(() => {
    let list = data.plan
    if (planClass !== 'all') list = list.filter(c => c.cl === parseInt(planClass))
    if (planSearch) {
      const q = planSearch.toLowerCase()
      list = list.filter(c => c.num.includes(q) || c.lib.toLowerCase().includes(q))
    }
    return list
  }, [data.plan, planClass, planSearch])

  const totalDebit = lignes.reduce((s,l) => s + (Number(l.debit)||0), 0)
  const totalCredit = lignes.reduce((s,l) => s + (Number(l.credit)||0), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01

  const typeLabel = { A:'Actif', P:'Passif', C:'Charge', R:'Produit', AC:'Contra' }
  const clLabel = { 1:'Cl.1 Ressources', 2:'Cl.2 Immobilisations', 3:'Cl.3 Stocks', 4:'Cl.4 Tiers', 5:'Cl.5 Trésorerie', 6:'Cl.6 Charges', 7:'Cl.7 Produits' }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 0 80px' }}>

      <ToolInfoPanel
        toolName="Gestion Comptable Pro"
        icon="📒"
        description="Comptabilité SYSCOHADA complète : plan comptable, journal, grand livre, balance et états financiers"
        benefits={[
          'Plan comptable SYSCOHADA intégré avec 80+ comptes pré-configurés et recherche intelligente',
          'Saisie des écritures comptables avec contrôle de la partie double automatique',
          'Grand livre par compte, balance générale et états financiers générés instantanément',
          'Gestion multi-exercices pour suivre l\'évolution sur plusieurs années',
          'Export Excel pour votre expert-comptable ou audit fiscal',
        ]}
        howToUse={[
          'Créez votre exercice comptable (année, devise) depuis le tableau de bord',
          'Saisissez chaque écriture avec date, libellé et les lignes débit/crédit',
          'Consultez le grand livre pour vérifier chaque compte individuellement',
          'Générez la balance pour préparer vos états de synthèse SYSCOHADA',
          'Exportez en Excel pour transmission à votre comptable ou administration fiscale',
        ]}
        tips={[
          'Utilisez la recherche de compte par numéro ou libellé pour saisir plus vite',
          'Vérifiez régulièrement la balance : débit total = crédit total impérativement',
          'Créez un exercice de test pour vous familiariser avant de saisir vos vraies données',
        ]}
      />

      {/* Header Pro */}
      <div style={{ background:'linear-gradient(135deg,rgba(24,168,74,0.12),rgba(0,0,0,0))', border:`1px solid ${C}30`, borderRadius:16, padding:'20px 28px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <div style={{ padding:'3px 12px', borderRadius:100, background:`${C}20`, border:`1px solid ${C}40`, color:C, fontSize:'0.68rem', fontWeight:800, letterSpacing:1 }}>⚡ GESTION COMPTABLE PRO</div>
            <div style={{ fontSize:'0.72rem', color:'#4A5568' }}>Better than Odoo & Sage</div>
          </div>
          <h2 style={{ fontWeight:900, color:'#F0F2F5', fontSize:'1.3rem', margin:0 }}>Comptabilité SYSCOHADA — Illimitée</h2>
          <p style={{ color:'#8B95A5', fontSize:'0.8rem', margin:'4px 0 0' }}>
            {data.plan.length} comptes · {ecrituresExo.length} écritures · Exercice {exercice?.annee}
          </p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <select value={data.currentExercice} onChange={e => setData(d => ({...d, currentExercice: e.target.value}))}
            style={{ ...inp, width:'auto', padding:'8px 12px', fontSize:'0.8rem' }}>
            {data.exercices.map(e => <option key={e.id} value={e.id}>{e.annee} — {e.statut}</option>)}
          </select>
          <button onClick={onBack} style={btnGhost('#8B95A5')}>← Retour</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: sidebarOpen ? '200px 1fr' : '48px 1fr', gap:20, transition:'grid-template-columns 0.2s' }}>

        {/* Sidebar */}
        <div style={{ background:'#0D1117', border:'1px solid #1A2332', borderRadius:14, padding:'10px 8px', height:'fit-content', position:'sticky', top:20 }}>
          <button onClick={() => setSidebarOpen(v => !v)} style={{ ...btnGhost(), width:'100%', marginBottom:8, padding:'6px', justifyContent:'center', display:'flex' }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} title={s.label} style={{
              display:'flex', alignItems:'center', gap:sidebarOpen?8:0, justifyContent:sidebarOpen?'flex-start':'center',
              width:'100%', padding:'9px 10px', borderRadius:9, border:'none', marginBottom:2,
              background: section===s.id ? `${C}18` : 'transparent',
              borderLeft: `3px solid ${section===s.id ? C : 'transparent'}`,
              color: section===s.id ? C : '#8B95A5',
              cursor:'pointer', fontSize:'0.8rem', fontWeight:section===s.id?700:400,
              textAlign:'left', fontFamily:'Outfit,sans-serif',
            }}>
              <span style={{ fontSize:'1rem' }}>{s.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.label}</span>}
            </button>
          ))}
        </div>

        {/* Main */}
        <div style={{ background:'#0D1117', border:'1px solid #1A2332', borderRadius:14, padding:'24px', minHeight:500 }}>

          {/* ── DASHBOARD ── */}
          {section === 'dashboard' && (
            <div>
              <h2 style={{ color:'#F0F2F5', fontWeight:900, fontSize:'1.1rem', marginBottom:20 }}>🏠 Tableau de bord — {exercice?.annee}</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
                {[
                  { label:'Chiffre d\'affaires', val:fmt(crCalc.ventes)+' F', color:'#18A84A', icon:'📈' },
                  { label:'Résultat net', val:fmt(crCalc.rn)+' F', color:crCalc.rn>=0?'#18A84A':'#ef4444', icon:'🏆' },
                  { label:'Trésorerie', val:fmt(Object.entries(balance).filter(([n])=>n.startsWith('5')||n.startsWith('521')||n.startsWith('571')).reduce((s,[,v])=>s+(v.debit-v.credit),0))+' F', color:'#3B82F6', icon:'💰' },
                  { label:'Écritures', val:ecrituresExo.length, color:'#F0B429', icon:'📔' },
                ].map(k => (
                  <div key={k.label} style={{ background:'#070B0F', border:`1px solid ${k.color}20`, borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:'1.4rem', marginBottom:6 }}>{k.icon}</div>
                    <div style={{ fontSize:'0.68rem', color:'#8B95A5', marginBottom:4 }}>{k.label}</div>
                    <div style={{ fontSize:'1rem', fontWeight:900, color:k.color }}>{k.val}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {/* CR résumé */}
                <div style={{ background:'#070B0F', border:'1px solid #1A2332', borderRadius:12, padding:18 }}>
                  <div style={{ fontWeight:800, color:'#F0F2F5', marginBottom:14, fontSize:'0.88rem' }}>📊 Compte de résultat</div>
                  {[
                    { label:'Ventes', v:crCalc.ventes, color:'#18A84A' },
                    { label:'- Achats', v:crCalc.achats, color:'#ef4444' },
                    { label:'= Marge brute', v:crCalc.mb, color:'#3B82F6', bold:true },
                    { label:'EBE', v:crCalc.ebe, color:'#8B5CF6' },
                    { label:'Résultat exploit.', v:crCalc.re, color:'#F0B429' },
                    { label:'Résultat net', v:crCalc.rn, color:crCalc.rn>=0?'#18A84A':'#ef4444', bold:true },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.8rem' }}>
                      <span style={{ color:'#8B95A5', fontWeight:r.bold?700:400 }}>{r.label}</span>
                      <span style={{ color:r.color, fontWeight:r.bold?900:600 }}>{fmt(r.v)} F</span>
                    </div>
                  ))}
                </div>

                {/* Dernières écritures */}
                <div style={{ background:'#070B0F', border:'1px solid #1A2332', borderRadius:12, padding:18 }}>
                  <div style={{ fontWeight:800, color:'#F0F2F5', marginBottom:14, fontSize:'0.88rem' }}>📔 Dernières écritures</div>
                  {ecrituresExo.length === 0
                    ? <p style={{ color:'#4A5568', fontSize:'0.8rem' }}>Aucune écriture — <button onClick={() => setSection('saisie')} style={{ background:'none', border:'none', color:C, cursor:'pointer', fontFamily:'Outfit,sans-serif', fontSize:'0.8rem', padding:0 }}>Saisir maintenant →</button></p>
                    : [...ecrituresExo].reverse().slice(0,6).map(e => (
                      <div key={e.id} style={{ padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.78rem' }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <span style={{ color:'#F0F2F5', fontWeight:600 }}>{e.libelle}</span>
                          <span style={{ color:'#F0B429', fontSize:'0.7rem' }}>{e.date}</span>
                        </div>
                        <div style={{ color:'#4A5568', fontSize:'0.7rem' }}>{e.journal} · {e.lignes.length} lignes · {fmt(e.lignes.reduce((s,l)=>s+(Number(l.debit)||0),0))} F</div>
                      </div>
                    ))}
                  <button onClick={() => setSection('saisie')} style={{ ...btn(), marginTop:12, width:'100%', padding:'10px', fontSize:'0.78rem' }}>✏️ Nouvelle écriture</button>
                </div>
              </div>

              {/* Bilan résumé */}
              <div style={{ marginTop:16, background:'#070B0F', border:'1px solid #1A2332', borderRadius:12, padding:18 }}>
                <div style={{ fontWeight:800, color:'#F0F2F5', marginBottom:14, fontSize:'0.88rem' }}>🏛️ Bilan simplifié</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <div style={{ color:'#3B82F6', fontWeight:700, fontSize:'0.78rem', marginBottom:8 }}>ACTIF</div>
                    {[
                      { label:'Immo. nettes', v:bilanCalc.actif.immo_brut-bilanCalc.actif.amort },
                      { label:'Stocks', v:bilanCalc.actif.stocks },
                      { label:'Clients', v:bilanCalc.actif.clients },
                      { label:'Trésorerie', v:bilanCalc.actif.tresorerie },
                    ].map(r => (
                      <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', padding:'3px 0' }}>
                        <span style={{ color:'#8B95A5' }}>{r.label}</span>
                        <span style={{ color:'#3B82F6', fontWeight:600 }}>{fmt(r.v)} F</span>
                      </div>
                    ))}
                    <div style={{ borderTop:'1px solid #1A2332', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:900, fontSize:'0.82rem' }}>
                      <span style={{ color:'#3B82F6' }}>Total Actif</span>
                      <span style={{ color:'#3B82F6' }}>{fmt(bilanCalc.actif_net)} F</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ color:C, fontWeight:700, fontSize:'0.78rem', marginBottom:8 }}>PASSIF</div>
                    {[
                      { label:'Capitaux propres', v:bilanCalc.passif.capitaux },
                      { label:'Emprunts', v:bilanCalc.passif.emprunts },
                      { label:'Fournisseurs', v:bilanCalc.passif.fournisseurs },
                      { label:'Autres passifs', v:bilanCalc.passif.autres_passif },
                    ].map(r => (
                      <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', padding:'3px 0' }}>
                        <span style={{ color:'#8B95A5' }}>{r.label}</span>
                        <span style={{ color:C, fontWeight:600 }}>{fmt(r.v)} F</span>
                      </div>
                    ))}
                    <div style={{ borderTop:'1px solid #1A2332', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:900, fontSize:'0.82rem' }}>
                      <span style={{ color:C }}>Total Passif</span>
                      <span style={{ color:C }}>{fmt(bilanCalc.passif_total)} F</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop:12, padding:'8px 14px', borderRadius:8, background: Math.abs(bilanCalc.actif_net - bilanCalc.passif_total) < 1 ? `${C}15` : 'rgba(239,68,68,0.1)', border:`1px solid ${Math.abs(bilanCalc.actif_net-bilanCalc.passif_total)<1?C:'#ef4444'}25`, textAlign:'center', fontSize:'0.78rem', fontWeight:700, color: Math.abs(bilanCalc.actif_net-bilanCalc.passif_total)<1?C:'#ef4444' }}>
                  {Math.abs(bilanCalc.actif_net-bilanCalc.passif_total)<1 ? '✅ Bilan équilibré' : `❌ Écart : ${fmt(Math.abs(bilanCalc.actif_net-bilanCalc.passif_total))} F`}
                </div>
              </div>
            </div>
          )}

          {/* ── PLAN COMPTABLE ── */}
          {section === 'plan' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <h2 style={{ color:'#F0F2F5', fontWeight:900, fontSize:'1.1rem', margin:0 }}>📋 Plan comptable — {data.plan.length} comptes</h2>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setShowAddCompte(v => !v)} style={btn()}>+ Compte personnalisé</button>
                </div>
              </div>

              {showAddCompte && (
                <div style={{ background:'#070B0F', border:`1px solid ${C}40`, borderRadius:12, padding:18, marginBottom:20 }}>
                  <div style={{ fontWeight:700, color:C, marginBottom:12, fontSize:'0.85rem' }}>Nouveau compte</div>
                  <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 100px 100px auto', gap:10, alignItems:'end' }}>
                    <div><label style={lbl}>N° compte *</label><input value={newCompte.num} onChange={e => setNewCompte(p => ({...p, num:e.target.value}))} style={inp} placeholder="ex: 6282" /></div>
                    <div><label style={lbl}>Libellé *</label><input value={newCompte.lib} onChange={e => setNewCompte(p => ({...p, lib:e.target.value}))} style={inp} placeholder="Frais de déplacement" /></div>
                    <div><label style={lbl}>Classe</label>
                      <select value={newCompte.cl} onChange={e => setNewCompte(p => ({...p, cl:parseInt(e.target.value)}))} style={inp}>
                        {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div><label style={lbl}>Type</label>
                      <select value={newCompte.type} onChange={e => setNewCompte(p => ({...p, type:e.target.value}))} style={inp}>
                        {Object.entries(typeLabel).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <button onClick={addCompte} style={btn()}>Ajouter</button>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                <input value={planSearch} onChange={e => setPlanSearch(e.target.value)} placeholder="Rechercher..." style={{ ...inp, flex:1, minWidth:200 }} />
                <select value={planClass} onChange={e => setPlanClass(e.target.value)} style={{ ...inp, width:'auto' }}>
                  <option value="all">Toutes les classes</option>
                  {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{clLabel[n]}</option>)}
                </select>
              </div>

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid #1A2332' }}>
                      {['N° Compte','Libellé','Cl.','Type','Débit','Crédit','Solde',''].map(h => (
                        <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:'#8B95A5', fontSize:'0.7rem', fontWeight:700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {planFiltered.map(c => {
                      const b = balance[c.num] || { debit:0, credit:0 }
                      const solde = b.debit - b.credit
                      return (
                        <tr key={c.num} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(24,168,74,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'6px 10px', color:'#F0B429', fontWeight:700, fontSize:'0.78rem' }}>{c.num}</td>
                          <td style={{ padding:'6px 10px', color:'#F0F2F5', fontSize:'0.8rem' }}>
                            {c.lib} {c.custom && <span style={{ fontSize:'0.62rem', color:C, background:`${C}20`, borderRadius:4, padding:'1px 5px', marginLeft:4 }}>custom</span>}
                          </td>
                          <td style={{ padding:'6px 10px', color:'#4A5568', fontSize:'0.75rem' }}>{c.cl}</td>
                          <td style={{ padding:'6px 10px', fontSize:'0.7rem' }}>
                            <span style={{ padding:'2px 6px', borderRadius:4, background:`${c.type==='C'?'#ef4444':c.type==='R'?'#18A84A':c.type==='A'?'#3B82F6':'#8B5CF6'}20`, color:c.type==='C'?'#ef4444':c.type==='R'?C:c.type==='A'?'#3B82F6':'#8B5CF6' }}>
                              {typeLabel[c.type]||c.type}
                            </span>
                          </td>
                          <td style={{ padding:'6px 10px', textAlign:'right', color:'#8B95A5', fontSize:'0.78rem' }}>{b.debit>0?fmt(b.debit):''}</td>
                          <td style={{ padding:'6px 10px', textAlign:'right', color:'#8B95A5', fontSize:'0.78rem' }}>{b.credit>0?fmt(b.credit):''}</td>
                          <td style={{ padding:'6px 10px', textAlign:'right', fontSize:'0.78rem', fontWeight:600, color:solde>0?C:solde<0?'#ef4444':'#4A5568' }}>
                            {solde !== 0 ? fmt(Math.abs(solde))+' '+(solde>0?'D':'C') : '—'}
                          </td>
                          <td style={{ padding:'4px' }}>
                            {c.custom && (
                              <button onClick={() => deleteCompte(c.num)} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:5, color:'#ef4444', cursor:'pointer', padding:'3px 8px', fontSize:'0.7rem' }}>✕</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SAISIE ÉCRITURE ── */}
          {section === 'saisie' && (
            <div>
              <h2 style={{ color:'#F0F2F5', fontWeight:900, fontSize:'1.1rem', marginBottom:20 }}>✏️ Saisie d'écriture comptable</h2>

              {/* Header écriture */}
              <div style={{ display:'grid', gridTemplateColumns:'150px 120px 1fr 120px', gap:12, marginBottom:20, background:'#070B0F', padding:16, borderRadius:12, border:'1px solid #1A2332' }}>
                <div><label style={lbl}>Date *</label><input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} style={inp} /></div>
                <div><label style={lbl}>N° Pièce</label><input value={form.piece} onChange={e => setForm(f=>({...f,piece:e.target.value}))} placeholder="F001" style={inp} /></div>
                <div><label style={lbl}>Libellé *</label><input value={form.libelle} onChange={e => setForm(f=>({...f,libelle:e.target.value}))} placeholder="Description de l'opération..." style={inp} /></div>
                <div><label style={lbl}>Journal</label>
                  <select value={form.journal} onChange={e => setForm(f=>({...f,journal:e.target.value}))} style={inp}>
                    {JOURNAUX.map(j => <option key={j.code} value={j.code}>{j.icon} {j.code} — {j.lib}</option>)}
                  </select>
                </div>
              </div>

              {/* Lignes */}
              <div style={{ overflowX:'auto', marginBottom:14 }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid #1A2332' }}>
                      <th style={{ padding:'8px', color:'#8B95A5', fontSize:'0.7rem', textAlign:'left', width:'35%' }}>Compte</th>
                      <th style={{ padding:'8px', color:'#8B95A5', fontSize:'0.7rem', textAlign:'left' }}>Libellé ligne</th>
                      <th style={{ padding:'8px', color:'#18A84A', fontSize:'0.7rem', textAlign:'right', width:'130px' }}>Débit</th>
                      <th style={{ padding:'8px', color:'#ef4444', fontSize:'0.7rem', textAlign:'right', width:'130px' }}>Crédit</th>
                      <th style={{ width:40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l, i) => (
                      <tr key={l.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding:'4px 6px' }}>
                          <AccountSearch plan={data.plan} value={l.compte ? `${l.compte} — ${l.compteLib}` : ''} placeholder="N° ou libellé..."
                            onChange={(num, lib) => setLignes(p => p.map((x,j) => j===i ? {...x, compte:num, compteLib:lib} : x))} />
                        </td>
                        <td style={{ padding:'4px 6px' }}>
                          <input value={l.compteLib} onChange={e => setLignes(p => p.map((x,j) => j===i ? {...x, compteLib:e.target.value} : x))}
                            style={{ ...inp, padding:'7px 10px' }} placeholder="Libellé..." />
                        </td>
                        <td style={{ padding:'4px 6px' }}>
                          <input type="number" value={l.debit} onChange={e => setLignes(p => p.map((x,j) => j===i ? {...x, debit:e.target.value, credit:''} : x))}
                            style={{ ...inp, textAlign:'right', padding:'7px 10px', color:'#18A84A' }} placeholder="0" />
                        </td>
                        <td style={{ padding:'4px 6px' }}>
                          <input type="number" value={l.credit} onChange={e => setLignes(p => p.map((x,j) => j===i ? {...x, credit:e.target.value, debit:''} : x))}
                            style={{ ...inp, textAlign:'right', padding:'7px 10px', color:'#ef4444' }} placeholder="0" />
                        </td>
                        <td style={{ padding:'4px' }}>
                          {lignes.length > 2 && (
                            <button onClick={() => setLignes(p => p.filter((_,j) => j!==i))} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:5, color:'#ef4444', cursor:'pointer', padding:'4px 8px', fontSize:'0.72rem' }}>✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:'rgba(255,255,255,0.02)', borderTop:'2px solid #1A2332' }}>
                      <td colSpan={2} style={{ padding:'10px', color:'#8B95A5', fontSize:'0.78rem', fontWeight:700 }}>TOTAUX</td>
                      <td style={{ padding:'10px', textAlign:'right', fontWeight:900, color:'#18A84A', fontSize:'0.9rem' }}>{fmt(totalDebit)} F</td>
                      <td style={{ padding:'10px', textAlign:'right', fontWeight:900, color:'#ef4444', fontSize:'0.9rem' }}>{fmt(totalCredit)} F</td>
                      <td style={{ padding:'10px', textAlign:'center', fontSize:'0.9rem' }}>
                        {totalDebit > 0 || totalCredit > 0 ? (balanced ? '✅' : '❌') : ''}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                <button onClick={addLigne} style={btnGhost()}>+ Ligne</button>
                <button onClick={saveEcriture} style={{ ...btn(), padding:'10px 28px', opacity: balanced && form.libelle ? 1 : 0.6 }}>
                  💾 Enregistrer l'écriture
                </button>
                {saisieMsg && <span style={{ color: saisieMsg.startsWith('✅') ? C : '#ef4444', fontSize:'0.82rem', fontWeight:600 }}>{saisieMsg}</span>}
                {!balanced && totalDebit > 0 && (
                  <span style={{ color:'#ef4444', fontSize:'0.78rem' }}>
                    Déséquilibre : {fmt(Math.abs(totalDebit-totalCredit))} F
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── JOURNAL GÉNÉRAL ── */}
          {section === 'journal' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <h2 style={{ color:'#F0F2F5', fontWeight:900, fontSize:'1.1rem', margin:0 }}>📔 Journal général — {ecrituresExo.length} écritures</h2>
                <button onClick={() => exportExcel(
                  [['Date','Pièce','Journal','Libellé','Compte','Débit','Crédit'],
                   ...ecrituresExo.flatMap(e => e.lignes.map(l => [e.date, e.piece, e.journal, e.libelle, l.compte+' '+l.compteLib, l.debit||0, l.credit||0]))],
                  'Journal', 'Journal-General-'+exercice?.annee
                )} style={btnGhost()}>📊 Excel</button>
              </div>
              {ecrituresExo.length === 0
                ? <div style={{ textAlign:'center', padding:40, color:'#4A5568' }}>
                    <div style={{ fontSize:'2rem', marginBottom:12 }}>📔</div>
                    <p>Aucune écriture pour cet exercice</p>
                    <button onClick={() => setSection('saisie')} style={btn()}>✏️ Saisir la première écriture</button>
                  </div>
                : [...ecrituresExo].reverse().map(e => {
                  const tot = e.lignes.reduce((s,l) => s+(Number(l.debit)||0), 0)
                  return (
                    <div key={e.id} style={{ background:'#070B0F', border:'1px solid #1A2332', borderRadius:10, padding:14, marginBottom:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                          <span style={{ color:'#F0B429', fontWeight:800, fontSize:'0.8rem' }}>{e.date}</span>
                          <span style={{ background:`${C}20`, color:C, borderRadius:5, padding:'2px 7px', fontSize:'0.68rem', fontWeight:700 }}>{e.journal}</span>
                          {e.piece && <span style={{ color:'#4A5568', fontSize:'0.72rem' }}>#{e.piece}</span>}
                          <span style={{ color:'#F0F2F5', fontWeight:600, fontSize:'0.82rem' }}>{e.libelle}</span>
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={{ color:'#8B95A5', fontSize:'0.75rem' }}>{fmt(tot)} F</span>
                          <button onClick={() => deleteEcriture(e.id)} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:5, color:'#ef4444', cursor:'pointer', padding:'3px 8px', fontSize:'0.7rem' }}>✕</button>
                        </div>
                      </div>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.75rem' }}>
                        <tbody>
                          {e.lignes.map((l,i) => (
                            <tr key={i}>
                              <td style={{ padding:'3px 8px', color:'#F0B429', width:60 }}>{l.compte}</td>
                              <td style={{ padding:'3px 8px', color:'#8B95A5' }}>{l.compteLib}</td>
                              <td style={{ padding:'3px 8px', textAlign:'right', color:'#18A84A', width:110 }}>{l.debit>0?fmt(l.debit)+' F':''}</td>
                              <td style={{ padding:'3px 8px', textAlign:'right', color:'#ef4444', width:110 }}>{l.credit>0?fmt(l.credit)+' F':''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
            </div>
          )}

          {/* ── GRAND LIVRE ── */}
          {section === 'grand_livre' && (
            <div>
              <h2 style={{ color:'#F0F2F5', fontWeight:900, fontSize:'1.1rem', marginBottom:20 }}>📖 Grand livre</h2>
              <div style={{ marginBottom:20 }}>
                <label style={lbl}>Sélectionner un compte</label>
                <AccountSearch plan={data.plan} value={glCompte ? `${glCompte} — ${glCompteName}` : ''}
                  onChange={(num, lib) => { setGlCompte(num); setGlCompteName(lib) }}
                  placeholder="Tapez un numéro ou libellé..." />
              </div>

              {glCompte && grandLivre[glCompte] ? (
                <div>
                  <div style={{ fontWeight:800, color:C, fontSize:'0.88rem', marginBottom:14 }}>{glCompte} — {glCompteName}</div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom:'2px solid #1A2332' }}>
                          {['Date','Pièce','Libellé','Débit','Crédit','Solde'].map(h => (
                            <th key={h} style={{ padding:'8px 10px', textAlign:h.includes('Débit')||h.includes('Crédit')||h.includes('Solde')?'right':'left', color:'#8B95A5', fontSize:'0.7rem' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let runSolde = 0
                          return (grandLivre[glCompte] || []).map((l,i) => {
                            runSolde += (l.debit||0) - (l.credit||0)
                            return (
                              <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding:'7px 10px', color:'#F0B429', fontSize:'0.78rem' }}>{l.date}</td>
                                <td style={{ padding:'7px 10px', color:'#4A5568', fontSize:'0.72rem' }}>{l.piece}</td>
                                <td style={{ padding:'7px 10px', color:'#F0F2F5', fontSize:'0.78rem' }}>{l.libelle}</td>
                                <td style={{ padding:'7px 10px', textAlign:'right', color:'#18A84A', fontSize:'0.78rem' }}>{l.debit>0?fmt(l.debit):''}</td>
                                <td style={{ padding:'7px 10px', textAlign:'right', color:'#ef4444', fontSize:'0.78rem' }}>{l.credit>0?fmt(l.credit):''}</td>
                                <td style={{ padding:'7px 10px', textAlign:'right', fontWeight:700, fontSize:'0.78rem', color:runSolde>=0?C:'#ef4444' }}>
                                  {fmt(Math.abs(runSolde))} {runSolde>=0?'D':'C'}
                                </td>
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : glCompte ? (
                <p style={{ color:'#4A5568', fontSize:'0.82rem' }}>Aucune écriture pour ce compte dans cet exercice.</p>
              ) : (
                <p style={{ color:'#4A5568', fontSize:'0.82rem' }}>Sélectionnez un compte pour afficher son grand livre.</p>
              )}
            </div>
          )}

          {/* ── BALANCE ── */}
          {section === 'balance' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <h2 style={{ color:'#F0F2F5', fontWeight:900, fontSize:'1.1rem', margin:0 }}>⚖️ Balance des comptes</h2>
                <button onClick={() => {
                  const rows = [['N° Compte','Libellé','Débit','Crédit','Solde D','Solde C']]
                  const comptesList = data.plan.filter(c => balance[c.num])
                  comptesList.forEach(c => {
                    const b = balance[c.num]
                    const s = b.debit - b.credit
                    rows.push([c.num, c.lib, b.debit, b.credit, s>0?s:0, s<0?-s:0])
                  })
                  exportExcel(rows, 'Balance', 'Balance-'+exercice?.annee)
                }} style={btnGhost()}>📊 Excel</button>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid #1A2332' }}>
                      {['N° Compte','Libellé','Mouv. Débit','Mouv. Crédit','Solde débiteur','Solde créditeur'].map(h => (
                        <th key={h} style={{ padding:'8px 10px', textAlign:h.includes('Mouv')||h.includes('Solde')?'right':'left', color:'#8B95A5', fontSize:'0.7rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.plan.filter(c => balance[c.num]).map(c => {
                      const b = balance[c.num]
                      const solde = b.debit - b.credit
                      return (
                        <tr key={c.num} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(24,168,74,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}
                          onClick={() => { setGlCompte(c.num); setGlCompteName(c.lib); setSection('grand_livre') }}
                          style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:'pointer' }}>
                          <td style={{ padding:'7px 10px', color:'#F0B429', fontWeight:700, fontSize:'0.78rem' }}>{c.num}</td>
                          <td style={{ padding:'7px 10px', color:'#F0F2F5', fontSize:'0.8rem' }}>{c.lib}</td>
                          <td style={{ padding:'7px 10px', textAlign:'right', color:'#8B95A5', fontSize:'0.78rem' }}>{fmt(b.debit)}</td>
                          <td style={{ padding:'7px 10px', textAlign:'right', color:'#8B95A5', fontSize:'0.78rem' }}>{fmt(b.credit)}</td>
                          <td style={{ padding:'7px 10px', textAlign:'right', color:C, fontWeight:600, fontSize:'0.78rem' }}>{solde>0?fmt(solde):'—'}</td>
                          <td style={{ padding:'7px 10px', textAlign:'right', color:'#ef4444', fontWeight:600, fontSize:'0.78rem' }}>{solde<0?fmt(-solde):'—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop:'2px solid #1A2332', background:'rgba(255,255,255,0.02)' }}>
                      <td colSpan={2} style={{ padding:'10px', color:'#F0B429', fontWeight:800 }}>TOTAUX</td>
                      <td style={{ padding:'10px', textAlign:'right', color:C, fontWeight:900 }}>{fmt(Object.values(balance).reduce((s,b)=>s+b.debit,0))} F</td>
                      <td style={{ padding:'10px', textAlign:'right', color:'#ef4444', fontWeight:900 }}>{fmt(Object.values(balance).reduce((s,b)=>s+b.credit,0))} F</td>
                      <td colSpan={2} style={{ padding:'10px', textAlign:'right' }}>
                        {Math.abs(Object.values(balance).reduce((s,b)=>s+b.debit-b.credit,0)) < 1
                          ? <span style={{ color:C, fontWeight:700 }}>✅ Équilibrée</span>
                          : <span style={{ color:'#ef4444', fontWeight:700 }}>❌ Déséquilibre</span>}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── CR ── */}
          {section === 'cr' && (
            <div>
              <h2 style={{ color:'#F0F2F5', fontWeight:900, fontSize:'1.1rem', marginBottom:20 }}>📊 Compte de résultat — {exercice?.annee}</h2>
              <div style={{ maxWidth:600 }}>
                {[
                  { label:'Chiffre d\'affaires', value:crCalc.ventes, color:'#18A84A', bg:'rgba(24,168,74,0.08)', sep:false },
                  { label:'- Achats et variations de stocks', value:-crCalc.achats, color:'#ef4444', sep:false },
                  { label:'= MARGE BRUTE', value:crCalc.mb, color:'#3B82F6', bold:true, sep:true },
                  { label:'- Autres charges externes', value:-crCalc.autresCharges, color:'#ef4444', sep:false },
                  { label:'= VALEUR AJOUTÉE', value:crCalc.va, color:'#8B5CF6', bold:true, sep:false },
                  { label:'- Charges de personnel', value:-crCalc.chargesPersonnel, color:'#ef4444', sep:false },
                  { label:'= EBE (EBITDA)', value:crCalc.ebe, color:'#F0B429', bold:true, sep:true },
                  { label:'- Dotations aux amortissements', value:-crCalc.dotations, color:'#ef4444', sep:false },
                  { label:'= RÉSULTAT D\'EXPLOITATION', value:crCalc.re, color:'#F0B429', bold:true, sep:true },
                  { label:'± Résultat financier net', value:crCalc.rf, color:crCalc.rf>=0?'#18A84A':'#ef4444', sep:false },
                  { label:'= RÉSULTAT AVANT IS', value:crCalc.rai, color:'#F0B429', bold:true, sep:true },
                  { label:'- Impôts sur bénéfices (IS)', value:-crCalc.is, color:'#ef4444', sep:false },
                  { label:'= RÉSULTAT NET', value:crCalc.rn, color:crCalc.rn>=0?'#18A84A':'#ef4444', bold:true, sep:true },
                ].map(r => (
                  <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:r.bold?'14px 16px':'8px 16px', marginBottom:r.sep?8:2, borderRadius:r.bold?10:6, background:r.bold?r.color+'15':'transparent', border:r.bold?`1px solid ${r.color}25`:'none' }}>
                    <span style={{ fontSize:r.bold?'0.88rem':'0.82rem', color:r.bold?'#F0F2F5':'#8B95A5', fontWeight:r.bold?800:400 }}>{r.label}</span>
                    <span style={{ fontSize:r.bold?'1rem':'0.85rem', fontWeight:r.bold?900:600, color:r.color }}>{fmt(r.value)} F</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:20 }}>
                <button onClick={() => exportExcel([
                  ['Indicateur','Montant (FCFA)'],
                  ['Chiffre d\'affaires', crCalc.ventes], ['Achats', crCalc.achats], ['Marge brute', crCalc.mb],
                  ['EBE', crCalc.ebe], ['Résultat d\'exploitation', crCalc.re], ['Résultat net', crCalc.rn]
                ], 'CR', 'Compte-de-Resultat-'+exercice?.annee)} style={btnGhost()}>📊 Exporter Excel</button>
              </div>
            </div>
          )}

          {/* ── BILAN ── */}
          {section === 'bilan' && (
            <div>
              <h2 style={{ color:'#F0F2F5', fontWeight:900, fontSize:'1.1rem', marginBottom:20 }}>🏛️ Bilan SYSCOHADA — {exercice?.annee}</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
                <div style={{ background:'#070B0F', border:'1px solid #1E3A5F', borderRadius:12, padding:18 }}>
                  <div style={{ color:'#3B82F6', fontWeight:800, fontSize:'0.88rem', marginBottom:14, paddingBottom:10, borderBottom:'1px solid #1A2332' }}>ACTIF</div>
                  {[
                    { label:'Immobilisations brutes', v:bilanCalc.actif.immo_brut },
                    { label:'- Amortissements', v:-bilanCalc.actif.amort, color:'#ef4444' },
                    { label:'= Immobilisations nettes', v:bilanCalc.actif.immo_brut-bilanCalc.actif.amort, bold:true },
                    { label:'Stocks', v:bilanCalc.actif.stocks },
                    { label:'Créances clients', v:bilanCalc.actif.clients },
                    { label:'Trésorerie', v:bilanCalc.actif.tresorerie },
                    { label:'Autres actifs', v:bilanCalc.actif.autres_actif },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:r.bold?'10px 0':'5px 0', borderBottom:r.bold?'1px solid #1A2332':'none', fontSize:'0.8rem' }}>
                      <span style={{ color:r.bold?'#F0F2F5':'#8B95A5', fontWeight:r.bold?700:400 }}>{r.label}</span>
                      <span style={{ color:r.color||'#3B82F6', fontWeight:r.bold?800:500 }}>{fmt(r.v)} F</span>
                    </div>
                  ))}
                  <div style={{ marginTop:14, padding:'12px 0', borderTop:'2px solid #1E3A5F', display:'flex', justifyContent:'space-between', fontWeight:900 }}>
                    <span style={{ color:'#3B82F6' }}>TOTAL ACTIF NET</span>
                    <span style={{ color:'#3B82F6', fontSize:'1.05rem' }}>{fmt(bilanCalc.actif_net)} F</span>
                  </div>
                </div>
                <div style={{ background:'#070B0F', border:`1px solid ${C}30`, borderRadius:12, padding:18 }}>
                  <div style={{ color:C, fontWeight:800, fontSize:'0.88rem', marginBottom:14, paddingBottom:10, borderBottom:'1px solid #1A2332' }}>PASSIF</div>
                  {[
                    { label:'Capitaux propres', v:bilanCalc.passif.capitaux, bold:true },
                    { label:'Réserves', v:bilanCalc.passif.reserves },
                    { label:'Résultat de l\'exercice', v:crCalc.rn, color:crCalc.rn>=0?C:'#ef4444' },
                    { label:'Emprunts et dettes fin.', v:bilanCalc.passif.emprunts },
                    { label:'Dettes fournisseurs', v:bilanCalc.passif.fournisseurs },
                    { label:'Autres passifs', v:bilanCalc.passif.autres_passif },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:'0.8rem' }}>
                      <span style={{ color:r.bold?'#F0F2F5':'#8B95A5', fontWeight:r.bold?700:400 }}>{r.label}</span>
                      <span style={{ color:r.color||C, fontWeight:r.bold?800:500 }}>{fmt(r.v)} F</span>
                    </div>
                  ))}
                  <div style={{ marginTop:14, padding:'12px 0', borderTop:`2px solid ${C}40`, display:'flex', justifyContent:'space-between', fontWeight:900 }}>
                    <span style={{ color:C }}>TOTAL PASSIF</span>
                    <span style={{ color:C, fontSize:'1.05rem' }}>{fmt(bilanCalc.passif_total+crCalc.rn)} F</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop:14, padding:'10px 16px', borderRadius:8, background: Math.abs(bilanCalc.actif_net-(bilanCalc.passif_total+crCalc.rn))<1?`${C}15`:'rgba(239,68,68,0.1)', border:`1px solid ${Math.abs(bilanCalc.actif_net-(bilanCalc.passif_total+crCalc.rn))<1?C:'#ef4444'}30`, textAlign:'center', fontWeight:800, color:Math.abs(bilanCalc.actif_net-(bilanCalc.passif_total+crCalc.rn))<1?C:'#ef4444' }}>
                {Math.abs(bilanCalc.actif_net-(bilanCalc.passif_total+crCalc.rn))<1 ? '✅ Bilan équilibré — Actif = Passif' : `❌ Écart de ${fmt(Math.abs(bilanCalc.actif_net-(bilanCalc.passif_total+crCalc.rn)))} F`}
              </div>
            </div>
          )}

          {/* ── IMMOBILISATIONS ── */}
          {section === 'immo' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <h2 style={{ color:'#F0F2F5', fontWeight:900, fontSize:'1.1rem', margin:0 }}>🏭 Registre des immobilisations</h2>
                <button onClick={() => setShowAddImmo(v => !v)} style={btn()}>+ Ajouter</button>
              </div>

              {showAddImmo && (
                <div style={{ background:'#070B0F', border:`1px solid ${C}40`, borderRadius:12, padding:18, marginBottom:20 }}>
                  <div style={{ fontWeight:700, color:C, marginBottom:12, fontSize:'0.85rem' }}>Nouvelle immobilisation</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
                    <div><label style={lbl}>Désignation *</label><input value={newImmo.designation} onChange={e => setNewImmo(p=>({...p,designation:e.target.value}))} style={inp} /></div>
                    <div><label style={lbl}>Compte</label><AccountSearch plan={data.plan.filter(c=>c.cl===2)} value={newImmo.compte?`${newImmo.compte} — ${newImmo.compteLib}`:''} onChange={(n,l)=>setNewImmo(p=>({...p,compte:n,compteLib:l}))} /></div>
                    <div><label style={lbl}>Valeur d'acquisition (FCFA) *</label><input type="number" value={newImmo.valeur_brute} onChange={e=>setNewImmo(p=>({...p,valeur_brute:parseFloat(e.target.value)||0}))} style={inp} /></div>
                    <div><label style={lbl}>Date d'acquisition</label><input type="date" value={newImmo.date_acquisition} onChange={e=>setNewImmo(p=>({...p,date_acquisition:e.target.value}))} style={inp} /></div>
                    <div><label style={lbl}>Date de mise en service</label><input type="date" value={newImmo.date_service} onChange={e=>setNewImmo(p=>({...p,date_service:e.target.value}))} style={inp} /></div>
                    <div><label style={lbl}>Durée (années)</label><input type="number" value={newImmo.duree_ans} onChange={e=>setNewImmo(p=>({...p,duree_ans:parseInt(e.target.value)||3,taux:100/(parseInt(e.target.value)||3)}))} style={inp} /></div>
                    <div><label style={lbl}>Méthode</label>
                      <select value={newImmo.methode} onChange={e=>setNewImmo(p=>({...p,methode:e.target.value}))} style={inp}>
                        <option value="lineaire">Linéaire</option>
                        <option value="degressif">Dégressif</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={addImmobilisation} style={btn()}>💾 Enregistrer</button>
                </div>
              )}

              {data.immobilisations.length === 0
                ? <p style={{ color:'#4A5568', textAlign:'center', padding:40 }}>Aucune immobilisation enregistrée</p>
                : data.immobilisations.map(immo => {
                  const amortRows = calcAmortissement(immo)
                  const anneeActuelle = new Date().getFullYear()
                  const currentRow = amortRows.find(r => r.annee === anneeActuelle)
                  return (
                    <div key={immo.id} style={{ background:'#070B0F', border:'1px solid #1A2332', borderRadius:12, padding:16, marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                        <div>
                          <div style={{ color:'#F0F2F5', fontWeight:800, fontSize:'0.88rem' }}>{immo.designation}</div>
                          <div style={{ color:'#4A5568', fontSize:'0.72rem' }}>{immo.compte} — Acquis le {immo.date_acquisition} — {immo.methode} {immo.duree_ans} ans ({immo.taux.toFixed(2)}%)</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ color:'#F0B429', fontWeight:900 }}>{fmt(immo.valeur_brute)} F</div>
                          {currentRow && <div style={{ color:C, fontSize:'0.75rem' }}>VNC {anneeActuelle}: {fmt(currentRow.vnc)} F</div>}
                        </div>
                      </div>
                      <div style={{ cursor:'pointer' }} onClick={() => setSelectedImmo(selectedImmo===immo.id?null:immo.id)}>
                        <div style={{ color:C, fontSize:'0.75rem', fontWeight:600 }}>{selectedImmo===immo.id?'▲ Masquer':'▼ Tableau d\'amortissement'}</div>
                      </div>
                      {selectedImmo === immo.id && (
                        <table style={{ width:'100%', marginTop:10, borderCollapse:'collapse', fontSize:'0.75rem' }}>
                          <thead><tr style={{ borderBottom:'1px solid #1A2332' }}>
                            {['Année','Dotation','Amort. cumulé','VNC'].map(h=><th key={h} style={{ padding:'5px 8px', textAlign:h==='Année'?'left':'right', color:'#8B95A5' }}>{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {amortRows.map(r => (
                              <tr key={r.annee} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', background:r.annee===anneeActuelle?`${C}08`:'transparent' }}>
                                <td style={{ padding:'5px 8px', color:r.annee===anneeActuelle?C:'#8B95A5', fontWeight:r.annee===anneeActuelle?700:400 }}>{r.annee} {r.annee===anneeActuelle&&'←'}</td>
                                <td style={{ padding:'5px 8px', textAlign:'right', color:'#ef4444' }}>{fmt(r.dotation)} F</td>
                                <td style={{ padding:'5px 8px', textAlign:'right', color:'#8B95A5' }}>{fmt(r.amort_cumul)} F</td>
                                <td style={{ padding:'5px 8px', textAlign:'right', color:r.vnc===0?'#4A5568':C, fontWeight:600 }}>{fmt(r.vnc)} F</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      <button onClick={() => setData(d=>({...d,immobilisations:d.immobilisations.filter(x=>x.id!==immo.id)}))}
                        style={{ ...btnGhost('#ef4444'), marginTop:10, fontSize:'0.72rem', padding:'5px 10px' }}>Supprimer</button>
                    </div>
                  )
                })}
            </div>
          )}

          {/* ── RAPPROCHEMENT ── */}
          {section === 'rapprochement' && (
            <div>
              <h2 style={{ color:'#F0F2F5', fontWeight:900, fontSize:'1.1rem', marginBottom:20 }}>🔗 Rapprochement bancaire</h2>
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Compte bancaire</label>
                <select value={rappCompte} onChange={e=>setRappCompte(e.target.value)} style={{ ...inp, width:'auto' }}>
                  {data.plan.filter(c=>c.cl===5&&c.type==='A').map(c=><option key={c.num} value={c.num}>{c.num} — {c.lib}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div>
                  <div style={{ fontWeight:700, color:'#F0B429', fontSize:'0.85rem', marginBottom:12 }}>Relevé bancaire</div>
                  {rappLignes.map((l,i) => (
                    <div key={l.id} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                      <input type="date" value={l.date} onChange={e=>setRappLignes(p=>p.map((x,j)=>j===i?{...x,date:e.target.value}:x))} style={{ ...inp, width:130, flex:'none' }} />
                      <input value={l.lib} onChange={e=>setRappLignes(p=>p.map((x,j)=>j===i?{...x,lib:e.target.value}:x))} placeholder="Libellé" style={{ ...inp, flex:1 }} />
                      <input type="number" value={l.montant} onChange={e=>setRappLignes(p=>p.map((x,j)=>j===i?{...x,montant:parseFloat(e.target.value)||0}:x))} style={{ ...inp, width:100, flex:'none', textAlign:'right' }} />
                      <select value={l.type} onChange={e=>setRappLignes(p=>p.map((x,j)=>j===i?{...x,type:e.target.value}:x))} style={{ ...inp, width:60, flex:'none', padding:'8px 4px' }}>
                        <option value="D">D</option><option value="C">C</option>
                      </select>
                      <button onClick={()=>setRappLignes(p=>p.map((x,j)=>j===i?{...x,pointe:!x.pointe}:x))} style={{ background:l.pointe?`${C}20`:'transparent', border:`1px solid ${l.pointe?C:'#1A2332'}`, borderRadius:5, color:l.pointe?C:'#4A5568', cursor:'pointer', padding:'5px 8px', fontSize:'0.75rem', fontFamily:'Outfit,sans-serif' }}>
                        {l.pointe?'✓':'○'}
                      </button>
                    </div>
                  ))}
                  <button onClick={()=>setRappLignes(p=>[...p,{id:uid(),date:'',lib:'',montant:0,type:'D',pointe:false}])} style={btnGhost()}>+ Ligne</button>
                </div>
                <div>
                  <div style={{ fontWeight:700, color:C, fontSize:'0.85rem', marginBottom:12 }}>Écritures comptables — {rappCompte}</div>
                  {(grandLivre[rappCompte]||[]).map((l,i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', borderRadius:6, marginBottom:4, background:'#070B0F', border:'1px solid #1A2332', fontSize:'0.75rem' }}>
                      <span style={{ color:'#F0B429' }}>{l.date}</span>
                      <span style={{ color:'#F0F2F5', flex:1, margin:'0 8px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.libelle}</span>
                      <span style={{ color:l.debit>0?C:'#ef4444', fontWeight:600 }}>{l.debit>0?'+'+fmt(l.debit):'-'+fmt(l.credit)} F</span>
                    </div>
                  ))}
                  {!(grandLivre[rappCompte]||[]).length && <p style={{ color:'#4A5568', fontSize:'0.8rem' }}>Aucune écriture pour ce compte</p>}
                </div>
              </div>
              <div style={{ marginTop:16, padding:'12px 16px', background:'#070B0F', borderRadius:10, border:'1px solid #1A2332' }}>
                <div style={{ display:'flex', gap:24, fontSize:'0.8rem' }}>
                  <div>
                    <span style={{ color:'#8B95A5' }}>Solde relevé : </span>
                    <span style={{ color:'#F0B429', fontWeight:700 }}>{fmt(rappLignes.reduce((s,l)=>s+(l.type==='D'?l.montant:-l.montant),0))} F</span>
                  </div>
                  <div>
                    <span style={{ color:'#8B95A5' }}>Solde comptable : </span>
                    <span style={{ color:C, fontWeight:700 }}>{fmt((balance[rappCompte]?.debit||0)-(balance[rappCompte]?.credit||0))} F</span>
                  </div>
                  <div>
                    <span style={{ color:'#8B95A5' }}>Pointés : </span>
                    <span style={{ color:C, fontWeight:700 }}>{rappLignes.filter(l=>l.pointe).length}/{rappLignes.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── EXERCICES ── */}
          {section === 'exercices' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h2 style={{ color:'#F0F2F5', fontWeight:900, fontSize:'1.1rem', margin:0 }}>🗓️ Gestion des exercices</h2>
                <button onClick={addExercice} style={btn()}>+ Nouvel exercice</button>
              </div>
              {data.exercices.map(e => (
                <div key={e.id} style={{ background:'#070B0F', border:`1px solid ${data.currentExercice===e.id?C:'#1A2332'}`, borderRadius:12, padding:18, marginBottom:10, cursor:'pointer' }}
                  onClick={()=>setData(d=>({...d,currentExercice:e.id}))}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:800, color:'#F0F2F5', fontSize:'0.92rem' }}>Exercice {e.annee}</div>
                      <div style={{ color:'#4A5568', fontSize:'0.75rem' }}>{e.debut} → {e.fin}</div>
                    </div>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <span style={{ padding:'3px 10px', borderRadius:100, background:e.statut==='ouvert'?`${C}20`:'#1A2332', color:e.statut==='ouvert'?C:'#4A5568', fontSize:'0.72rem', fontWeight:700 }}>{e.statut}</span>
                      {data.currentExercice === e.id && <span style={{ color:C, fontSize:'0.78rem', fontWeight:700 }}>✓ Actif</span>}
                    </div>
                  </div>
                  <div style={{ marginTop:10, display:'flex', gap:16, fontSize:'0.75rem', color:'#4A5568' }}>
                    <span>{data.ecritures.filter(ec=>ec.exercice===e.id).length} écritures</span>
                  </div>
                  {e.statut === 'ouvert' && (
                    <button onClick={ev=>{ev.stopPropagation();setData(d=>({...d,exercices:d.exercices.map(x=>x.id===e.id?{...x,statut:'cloture'}:x)}))}}
                      style={{ ...btnGhost('#ef4444'), marginTop:10, fontSize:'0.72rem', padding:'5px 12px' }}>
                      Clôturer cet exercice
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
