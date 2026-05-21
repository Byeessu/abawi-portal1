import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToolAccess } from '../../hooks/useToolAccess';
import SEO from '../../components/SEO';

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_LABELS = {
  maternelle:'Maternelle', primaire:'Primaire', college:'Collège',
  lycee:'Lycée', universite:'Université', formation:'Centre de formation', autre:'Autre',
};
const TRIMESTRES = [
  { id:1, label:'1er Trimestre' },
  { id:2, label:'2ème Trimestre' },
  { id:3, label:'3ème Trimestre' },
];
const STORAGE_KEY = 'abschool_data';

// ─── Storage helpers ──────────────────────────────────────────────────────────
function newId(p) { return `${p}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }
function loadData() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (r) {
      const loaded = JSON.parse(r);
      const defs = defaultData();
      const defaults = {
        etablissements:[],classes:[],matieres:[],enseignants:[],eleves:[],paiements:[],presences:[],notes:[],absences:[],paiement_details:[],
        sanctions:[],recus:[],contrats:[],justificatifs:[],documents_eleve:[],partenaires:[],personnel:[],notes_eleve:[],cursus:[]
      };
      for (const k of Object.keys(defaults)) if (!Array.isArray(loaded[k])) loaded[k] = [];
      return loaded;
    }
  } catch {}
  return defaultData();
}
function saveData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }
function defaultData() {
  const eid = newId('etab'), c1=newId('cls'), c2=newId('cls'), c3=newId('cls');
  const m1=newId('mat'),m2=newId('mat'),m3=newId('mat'),m4=newId('mat'),m5=newId('mat');
  const e1=newId('ens'),e2=newId('ens'), l1=newId('elv'),l2=newId('elv'),l3=newId('elv');
  return {
    etablissements:[{id:eid,nom:'École Exemple ABAWI',type:'college',adresse:'Dakar, Médina',ville:'Dakar',telephone:'33 123 45 67',email:'contact@ecole.sn',annee_scolaire:'2025-2026',directeur_nom:''}],
    classes:[{id:c1,etablissement_id:eid,nom:'6ème A',niveau:'6ème',section:'A',capacite:35,salle:'Salle 101'},{id:c2,etablissement_id:eid,nom:'5ème A',niveau:'5ème',section:'A',capacite:35,salle:'Salle 102'},{id:c3,etablissement_id:eid,nom:'4ème A',niveau:'4ème',section:'A',capacite:35,salle:'Salle 103'}],
    matieres:[{id:m1,etablissement_id:eid,nom:'Mathématiques',code:'MATH',coefficient:4,couleur:'#3B82F6'},{id:m2,etablissement_id:eid,nom:'Français',code:'FR',coefficient:3,couleur:'#EF4444'},{id:m3,etablissement_id:eid,nom:'Sciences',code:'SVT',coefficient:3,couleur:'#10B981'},{id:m4,etablissement_id:eid,nom:'Histoire-Géo',code:'HG',coefficient:2,couleur:'#F59E0B'},{id:m5,etablissement_id:eid,nom:'Anglais',code:'ANG',coefficient:2,couleur:'#8B5CF6'}],
    enseignants:[{id:e1,etablissement_id:eid,prenom:'Amadou',nom:'Diallo',email:'a.diallo@ecole.sn',telephone:'77 111 22 33',specialite:'Mathématiques',salaire_mensuel:250000,statut:'actif'},{id:e2,etablissement_id:eid,prenom:'Fatou',nom:'Ndiaye',email:'f.ndiaye@ecole.sn',telephone:'77 444 55 66',specialite:'Français',salaire_mensuel:220000,statut:'actif'}],
    eleves:[{id:l1,etablissement_id:eid,classe_id:c1,prenom:'Moussa',nom:'Fall',date_naissance:'2012-03-15',sexe:'M',matricule:'ABS-001',parent_nom:'Ousmane Fall',parent_telephone:'77 777 88 99',frais_scolarite:150000,statut:'actif'},{id:l2,etablissement_id:eid,classe_id:c1,prenom:'Aïcha',nom:'Sow',date_naissance:'2013-07-22',sexe:'F',matricule:'ABS-002',parent_nom:'Mariama Sow',parent_telephone:'77 000 11 22',frais_scolarite:150000,statut:'actif'},{id:l3,etablissement_id:eid,classe_id:c2,prenom:'Ibrahima',nom:'Sy',date_naissance:'2011-11-05',sexe:'M',matricule:'ABS-003',parent_nom:'Aliou Sy',parent_telephone:'77 333 44 55',frais_scolarite:150000,statut:'actif'}],
    notes:[],presences:[],paiements:[],bulletins:[],sanctions:[],recus:[],contrats:[],justificatifs:[],documents_eleve:[],partenaires:[],personnel:[],notes_eleve:[],cursus:[],
  };
}
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR'); }
function formatPrix(n) { if (n==null||isNaN(n)) return '0 FCFA'; return n.toLocaleString('fr-FR')+' FCFA'; }
function calcMoyenneEleve(notes) {
  if (!notes.length) return null;
  const total=notes.reduce((s,n)=>s+n.note*(n.coeff||1),0);
  const coeffs=notes.reduce((s,n)=>s+(n.coeff||1),0);
  return coeffs>0 ? +(total/coeffs).toFixed(2) : null;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const sv={fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round'};
function Ic({size=18,sw=1.8,children,style}){
  return <svg width={size} height={size} viewBox="0 0 24 24" {...sv} strokeWidth={sw} style={style}>{children}</svg>;
}
const IcDash=({s=18})=><Ic size={s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></Ic>;
const IcBuild=({s=18})=><Ic size={s}><path d="M3 21h18M6 21V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v14"/><rect x="10" y="12" width="4" height="9"/></Ic>;
const IcBook=({s=18})=><Ic size={s}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Ic>;
const IcUsers=({s=18})=><Ic size={s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Ic>;
const IcGrad=({s=18})=><Ic size={s}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></Ic>;
const IcClip=({s=18})=><Ic size={s}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></Ic>;
const IcCal=({s=18})=><Ic size={s}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></Ic>;
const IcCard=({s=18})=><Ic size={s}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></Ic>;
const IcFile=({s=18})=><Ic size={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Ic>;
const IcPlus=({s=16})=><Ic size={s} sw={2.2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ic>;
const IcPen=({s=14})=><Ic size={s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Ic>;
const IcTrash=({s=14})=><Ic size={s}><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></Ic>;
const IcCheck=({s=15})=><Ic size={s} sw={2.2}><polyline points="20 6 9 17 4 12"/></Ic>;
const IcX=({s=16})=><Ic size={s} sw={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ic>;
const IcKey=({s=18})=><Ic size={s}><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/></Ic>;
const IcNews=({s=18})=><Ic size={s}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></Ic>;
const IcChevD=({s=13})=><Ic size={s} sw={2}><polyline points="6 9 12 15 18 9"/></Ic>;
const IcChevR=({s=13})=><Ic size={s} sw={2}><polyline points="9 6 15 12 9 18"/></Ic>;
const IcAlert=({s=16})=><Ic size={s}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Ic>;
const IcAtom=({s=18})=><Ic size={s}><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/></Ic>;
const IcMenu=({s=20})=><Ic size={s} sw={2}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></Ic>;
const IcWallet=({s=18})=><Ic size={s}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><circle cx="18" cy="12" r="1" fill="currentColor" stroke="none"/></Ic>;
const IcShield=({s=18})=><Ic size={s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ic>;
const IcTicket=({s=18})=><Ic size={s}><path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z"/><path d="M2 15a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z"/></Ic>;
const IcContract=({s=18})=><Ic size={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Ic>;
const IcDocCheck=({s=18})=><Ic size={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></Ic>;
const IcFolder=({s=18})=><Ic size={s}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></Ic>;
const IcHandshake=({s=18})=><Ic size={s}><path d="M20.4 11.5l-2.8-2.8a2.1 2.1 0 0 0-2.9 0L13 11l-1-1a2.1 2.1 0 0 0-2.9 0L6.3 12.8a2.1 2.1 0 0 0 0 2.9l2.8 2.8a2.1 2.1 0 0 0 2.9 0L13 16l1 1a2.1 2.1 0 0 0 2.9 0l2.8-2.8a2.1 2.1 0 0 0 0-2.9z"/><path d="M18 10l-2.8-2.8a2.1 2.1 0 0 0-2.9 0L11 8l-1-1a2.1 2.1 0 0 0-2.9 0L4.3 9.8a2.1 2.1 0 0 0 0 2.9L7 15.5"/></Ic>;
const IcBriefcase=({s=18})=><Ic size={s}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Ic>;
const IcMessage=({s=18})=><Ic size={s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Ic>;
const IcRoute=({s=18})=><Ic size={s}><circle cx="6" cy="19" r="3"/><path d="M9 19h8a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h3"/><circle cx="18" cy="5" r="3"/></Ic>;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Abschool() {
  useAuth();
  useToolAccess('abschool', 'abschool');

  const [data, setData]               = useState(() => loadData());
  const [view, setView]               = useState('dashboard');
  const [etabFilter, setEtabFilter]   = useState('all');
  const [notification, setNotification] = useState(null);
  const [modal, setModal]             = useState(null);
  const [userRole, setUserRole]       = useState(() => localStorage.getItem('abschool_role') || 'admin');
  const [showPortal, setShowPortal]   = useState(() => !localStorage.getItem('abschool_last_etab'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { if (!notification) return; const t = setTimeout(()=>setNotification(null),3500); return ()=>clearTimeout(t); }, [notification]);

  // ── CRUD ──────────────────────────────────────────────────────────────────────
  function notify(type, msg)  { setNotification({ type, msg }); }
  function addItem(col, item) {
    const id = newId(col.slice(0,3));
    setData(p => ({ ...p, [col]: [...(p[col]||[]), { ...item, id }] }));
    notify('success', 'Enregistrement ajouté');
  }
  function updateItem(col, id, u) {
    setData(p => ({ ...p, [col]: p[col].map(x => x.id===id ? {...x,...u} : x) }));
    notify('success', 'Mis à jour');
  }
  function deleteItem(col, id) {
    if (!window.confirm('Supprimer cet enregistrement ?')) return;
    setData(p => ({ ...p, [col]: p[col].filter(x => x.id!==id) }));
    notify('success', 'Supprimé');
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────────
  const ALL_TABS = [
    { id:'dashboard',      label:'Tableau de bord', icon:<IcDash/>,  roles:['admin','enseignant','eleve','parent','tuteur'] },
    { id:'etablissements', label:'Établissements',  icon:<IcBuild/>, roles:['admin'] },
    { id:'classes',        label:'Classes',         icon:<IcBook/>,  roles:['admin','enseignant','eleve','parent','tuteur'] },
    { id:'matieres',       label:'Matières',        icon:<IcAtom/>,  roles:['admin','enseignant'] },
    { id:'enseignants',    label:'Enseignants',     icon:<IcUsers/>, roles:['admin'] },
    { id:'eleves',         label:'Élèves',          icon:<IcGrad/>,  roles:['admin','enseignant','parent','tuteur'] },
    { id:'notes',          label:'Notes',           icon:<IcClip/>,  roles:['admin','enseignant','eleve','parent','tuteur'] },
    { id:'presences',      label:'Présences',       icon:<IcCal/>,   roles:['admin','enseignant','eleve','parent','tuteur'] },
    { id:'paiements',      label:'Paiements',       icon:<IcCard/>,  roles:['admin','parent','tuteur'] },
    { id:'bulletins',      label:'Bulletins',       icon:<IcFile/>,  roles:['admin','enseignant','eleve','parent','tuteur'] },
    { id:'sanctions',      label:'Sanctions',       icon:<IcShield/>,roles:['admin','enseignant'] },
    { id:'recus',          label:'Reçus',           icon:<IcTicket/>, roles:['admin','parent','tuteur'] },
    { id:'contrats',       label:'Contrats',        icon:<IcContract/>,roles:['admin','enseignant'] },
    { id:'justificatifs',  label:'Justificatifs',   icon:<IcDocCheck/>,roles:['admin','enseignant','eleve','parent','tuteur'] },
    { id:'documents',      label:'Documents',       icon:<IcFolder/>, roles:['admin','eleve','parent','tuteur'] },
    { id:'partenaires',    label:'Partenaires',     icon:<IcHandshake/>,roles:['admin'] },
    { id:'personnel',      label:'Personnel',       icon:<IcBriefcase/>,roles:['admin'] },
    { id:'notes_eleve',    label:'Notes élève',     icon:<IcMessage/>,roles:['admin','enseignant'] },
    { id:'cursus',         label:'Cursus',          icon:<IcRoute/>,  roles:['admin','enseignant','eleve','parent','tuteur'] },
  ];
  const TABS = ALL_TABS.filter(t => t.roles.includes(userRole));

  const ROLE_CONFIG = {
    admin:      { label:'Administrateur', color:'#EF4444', bg:'rgba(239,68,68,0.1)' },
    enseignant: { label:'Enseignant',     color:'#8B5CF6', bg:'rgba(139,92,246,0.1)' },
    eleve:      { label:'Élève',          color:'#3B82F6', bg:'rgba(59,130,246,0.1)' },
    parent:     { label:'Parent',         color:'#10B981', bg:'rgba(16,185,129,0.1)' },
    tuteur:     { label:'Tuteur',         color:'#F59E0B', bg:'rgba(245,158,11,0.1)' },
  };

  // ── Derived state ─────────────────────────────────────────────────────────────
  const currentEtab     = etabFilter==='all' ? data.etablissements[0]||null : data.etablissements.find(e=>e.id===etabFilter)||null;
  const etabClasses     = data.classes.filter(c => currentEtab && c.etablissement_id===currentEtab.id);
  const etabEnseignants = data.enseignants.filter(e => currentEtab && e.etablissement_id===currentEtab.id);
  const etabEleves      = data.eleves.filter(e => currentEtab && e.etablissement_id===currentEtab.id);
  const etabPaiements   = data.paiements.filter(p => currentEtab && p.etablissement_id===currentEtab.id);
  const etabPresences   = data.presences.filter(p => currentEtab && p.etablissement_id===currentEtab.id);
  const etabNotes       = data.notes.filter(n => currentEtab && n.etablissement_id===currentEtab.id);
  const etabMatieres    = data.matieres.filter(m => currentEtab && m.etablissement_id===currentEtab.id);
  const etabSanctions   = data.sanctions.filter(s => currentEtab && s.etablissement_id===currentEtab.id);
  const etabRecus       = data.recus.filter(r => currentEtab && r.etablissement_id===currentEtab.id);
  const etabContrats    = data.contrats.filter(c => currentEtab && c.etablissement_id===currentEtab.id);
  const etabJustifs     = data.justificatifs.filter(j => currentEtab && j.etablissement_id===currentEtab.id);
  const etabDocs        = data.documents_eleve.filter(d => currentEtab && d.etablissement_id===currentEtab.id);
  const etabPartenaires = data.partenaires.filter(p => currentEtab && p.etablissement_id===currentEtab.id);
  const etabPersonnel   = data.personnel.filter(p => currentEtab && p.etablissement_id===currentEtab.id);
  const etabNotesEleve  = data.notes_eleve.filter(n => currentEtab && n.etablissement_id===currentEtab.id);
  const etabCursus      = data.cursus.filter(c => currentEtab && c.etablissement_id===currentEtab.id);

  const stats = useMemo(() => {
    if (!currentEtab) return {};
    return {
      nbClasses:    etabClasses.length,
      nbEnseignants:etabEnseignants.length,
      nbEleves:     etabEleves.length,
      garcons:      etabEleves.filter(e=>e.sexe==='M').length,
      filles:       etabEleves.filter(e=>e.sexe==='F').length,
      totalFrais:   etabEleves.reduce((s,e)=>s+(e.frais_scolarite||0),0),
      totalPaye:    etabPaiements.filter(p=>p.statut==='paye').reduce((s,p)=>s+p.montant,0),
      totalAbsent:  etabPresences.filter(p=>p.statut==='absent').length,
    };
  }, [currentEtab, etabClasses, etabEnseignants, etabEleves, etabPaiements, etabPresences]);

  const activeTab = TABS.find(t=>t.id===view) || TABS[0];

  const CSS = `
    .abs-shell{display:flex;min-height:100vh;background:var(--bg-primary)}
    .abs-sidebar{width:260px;flex-shrink:0;display:flex;flex-direction:column;background:var(--bg-card);border-right:1px solid var(--border);position:sticky;top:0;height:100vh;overflow-y:auto;z-index:40}
    .abs-sidebar-brand{padding:18px 16px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
    .abs-logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#10B981,#059669);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:.95rem;flex-shrink:0}
    .abs-brand-name{font-size:1rem;font-weight:900;color:var(--text-primary)}
    .abs-brand-name em{color:#10B981;font-style:normal}
    .abs-brand-sub{font-size:.62rem;color:var(--text-muted);font-weight:600;letter-spacing:.4px;margin-top:1px}
    .abs-school-chip{margin:10px 10px 4px;padding:8px 12px;border-radius:10px;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.18);font-size:.75rem;font-weight:700;color:var(--text-primary);line-height:1.4}
    .abs-school-chip span{display:block;font-size:.61rem;color:#10B981;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px}
    .abs-nav{padding:8px;flex:1;display:flex;flex-direction:column;gap:2px}
    .abs-nav-item{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:10px;cursor:pointer;font-size:.81rem;font-weight:500;color:var(--text-secondary);border:none;background:transparent;width:100%;text-align:left;transition:all .14s;font-family:inherit}
    .abs-nav-item:hover{background:var(--bg-primary);color:var(--text-primary)}
    .abs-nav-item.active{background:rgba(16,185,129,.12);color:#10B981;font-weight:700}
    .abs-nav-icon{width:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .abs-sidebar-foot{padding:12px;border-top:1px solid var(--border)}
    .abs-role-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:100px;font-size:.7rem;font-weight:700;margin-bottom:8px;width:100%}
    .abs-change-btn{width:100%;padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;font-size:.71rem;font-family:inherit;font-weight:600;transition:all .14s}
    .abs-change-btn:hover{border-color:#10B981;color:#10B981}
    .abs-main{flex:1;min-width:0;display:flex;flex-direction:column}
    .abs-topbar{padding:12px 22px;border-bottom:1px solid var(--border);background:var(--bg-card);display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:30;backdrop-filter:blur(8px)}
    .abs-topbar-icon{color:#10B981;display:flex;align-items:center}
    .abs-topbar-title{font-size:.9rem;font-weight:800;color:var(--text-primary)}
    .abs-topbar-sub{font-size:.7rem;color:var(--text-muted)}
    .abs-hamburger{display:none;background:none;border:none;cursor:pointer;color:var(--text-primary);padding:4px;align-items:center}
    .abs-page{padding:20px 22px 80px}
    .abs-stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:11px;margin-bottom:20px}
    .abs-stat{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:15px 17px;position:relative;overflow:hidden;transition:all .2s}
    .abs-stat::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--sc,#10B981)}
    .abs-stat:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}
    .abs-stat-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:9px}
    .abs-stat-val{font-size:1.3rem;font-weight:900;color:var(--text-primary);line-height:1}
    .abs-stat-lbl{font-size:.66rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:.9px;margin-top:3px}
    .abs-card{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;overflow:hidden}
    .abs-card-hd{padding:13px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:10px}
    .abs-card-title{font-size:.85rem;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:8px}
    .abs-card-bd{padding:16px 18px}
    .abs-btn{background:linear-gradient(135deg,#10B981,#059669);color:#fff;border:none;border-radius:9px;padding:8px 15px;font-weight:700;cursor:pointer;font-size:.79rem;transition:all .2s;display:inline-flex;align-items:center;gap:6px;font-family:inherit}
    .abs-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(16,185,129,.35)}
    .abs-btn-ghost{background:transparent;color:var(--text-secondary);border:1px solid var(--border);border-radius:9px;padding:8px 15px;font-weight:600;cursor:pointer;font-size:.79rem;font-family:inherit;display:inline-flex;align-items:center;gap:6px;transition:all .14s}
    .abs-btn-ghost:hover{background:var(--bg-primary)}
    .abs-icon-btn{width:28px;height:28px;border-radius:7px;border:none;background:transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all .14s}
    .abs-icon-btn:hover{background:var(--bg-primary)}
    .abs-icon-btn.edit{color:#3B82F6}
    .abs-icon-btn.del{color:#EF4444}
    .abs-input{background:var(--bg-card);border:1.5px solid var(--border);color:var(--text-primary);border-radius:9px;padding:9px 13px;font-size:.82rem;outline:none;font-family:inherit;width:100%;transition:border-color .15s,box-shadow .15s;box-sizing:border-box}
    .abs-input:focus{border-color:#10B981;box-shadow:0 0 0 3px rgba(16,185,129,.1)}
    .abs-select{background:var(--bg-card);border:1.5px solid var(--border);color:var(--text-primary);border-radius:9px;padding:9px 32px 9px 13px;font-size:.82rem;outline:none;cursor:pointer;font-family:inherit;width:100%;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 11px center;transition:border-color .15s;box-sizing:border-box}
    .abs-select:focus{border-color:#10B981;box-shadow:0 0 0 3px rgba(16,185,129,.1)}
    .abs-label{display:block;font-size:.66rem;font-weight:700;color:var(--text-muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:.8px}
    .abs-field-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:13px}
    .abs-tbl{width:100%;border-collapse:collapse}
    .abs-tbl th{text-align:left;padding:9px 16px;font-size:.65rem;text-transform:uppercase;letter-spacing:1.1px;color:var(--text-muted);border-bottom:1px solid var(--border);font-weight:700;white-space:nowrap;background:var(--bg-primary)}
    .abs-tbl td{padding:11px 16px;font-size:.82rem;color:var(--text-primary);border-bottom:1px solid var(--border)}
    .abs-tbl tr:last-child td{border-bottom:none}
    .abs-tbl tbody tr{transition:background .1s}
    .abs-tbl tbody tr:hover td{background:rgba(16,185,129,.03)}
    .abs-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:100px;font-size:.69rem;font-weight:700;white-space:nowrap}
    .abs-track{flex:1;height:7px;border-radius:4px;background:var(--bg-primary);overflow:hidden}
    .abs-fill{height:100%;border-radius:4px;transition:width .5s ease}
    .abs-sec-hd{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px}
    .abs-sec-h2{font-size:.98rem;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px}
    .abs-toast{position:fixed;top:20px;right:20px;z-index:500;padding:11px 18px;border-radius:12px;font-weight:600;font-size:.81rem;backdrop-filter:blur(8px);display:flex;align-items:center;gap:9px;box-shadow:0 4px 20px rgba(0,0,0,.14);animation:absSlide .25s ease-out}
    @keyframes absSlide{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
    @keyframes absFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .abs-anim{animation:absFade .22s ease-out}
    .abs-empty{text-align:center;padding:40px 20px;color:var(--text-muted);font-size:.82rem}
    .abs-empty-icon{margin-bottom:10px;opacity:.3;display:flex;justify-content:center}
    .abs-portal{max-width:560px;margin:32px auto;padding:0 16px}
    .abs-portal-card{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:34px}
    .abs-etab-row{display:flex;align-items:center;gap:12px;width:100%;padding:12px 15px;border-radius:12px;border:1px solid var(--border);background:var(--bg-primary);cursor:pointer;transition:all .17s;text-align:left;font-family:inherit;margin-bottom:8px}
    .abs-etab-row:hover{border-color:#10B981;background:rgba(16,185,129,.04)}
    .abs-etab-icon{width:40px;height:40px;border-radius:10px;background:rgba(16,185,129,.12);display:flex;align-items:center;justify-content:center;color:#10B981;flex-shrink:0}
    .abs-action-card{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 12px;border-radius:14px;border:1.5px dashed var(--border);cursor:pointer;transition:all .17s;background:transparent;font-family:inherit}
    .abs-action-card:hover{border-color:#10B981;background:rgba(16,185,129,.04)}
    .abs-action-card-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center}
    .abs-news-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:9px;background:var(--bg-primary);transition:background .14s;text-decoration:none}
    .abs-news-item:hover{background:rgba(16,185,129,.06)}
    .abs-overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:39}
    @media(max-width:768px){
      .abs-sidebar{position:fixed;top:0;left:0;bottom:0;transform:translateX(-100%);transition:transform .25s;box-shadow:4px 0 24px rgba(0,0,0,.15)}
      .abs-sidebar.open{transform:translateX(0)}
      .abs-hamburger{display:flex}
      .abs-page{padding:14px 12px 80px}
      .abs-topbar{padding:10px 12px}
      .abs-stat-grid{grid-template-columns:repeat(2,1fr);gap:9px}
      .abs-mobile-nav{position:fixed;bottom:0;left:0;right:0;z-index:50;background:var(--bg-card);border-top:1px solid var(--border);display:flex;overflow-x:auto;padding-bottom:env(safe-area-inset-bottom,4px)}
      .abs-mobile-btn{flex:1;min-width:56px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 4px;font-size:.57rem;color:var(--text-muted);cursor:pointer;border:none;background:none;font-family:inherit;font-weight:600;transition:color .14s}
      .abs-mobile-btn.active{color:#10B981}
    }
    @media(min-width:769px){.abs-mobile-nav{display:none!important}}

    /* ── Banner ── */
    .abs-banner{
      background:linear-gradient(135deg,#064e3b 0%,#065f46 40%,#047857 100%);
      border-radius:16px;padding:22px 26px;margin-bottom:20px;position:relative;overflow:hidden;
    }
    .abs-banner::before{content:'';position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.06)}
    .abs-banner::after{content:'';position:absolute;bottom:-60px;right:60px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.04)}
    .abs-banner-title{font-size:1.25rem;font-weight:900;color:#fff;margin-bottom:3px;line-height:1.2}
    .abs-banner-sub{font-size:.78rem;color:rgba(255,255,255,.65);font-weight:500;margin-bottom:16px;display:flex;align-items:center;gap:10px}
    .abs-banner-stats{display:flex;gap:20px;flex-wrap:wrap}
    .abs-banner-stat{display:flex;flex-direction:column;gap:2px}
    .abs-banner-stat-n{font-size:1.3rem;font-weight:900;color:#fff;line-height:1}
    .abs-banner-stat-l{font-size:.62rem;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.8px;font-weight:700}
    .abs-banner-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:100px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:.68rem;font-weight:700}
    /* ── Avatar ── */
    .abs-av{border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0}
    /* ── Quick actions ── */
    .abs-qa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-bottom:20px}
    .abs-qa{display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 10px;border-radius:12px;border:1px solid var(--border);background:var(--bg-card);cursor:pointer;transition:all .17s;font-family:inherit;text-align:center}
    .abs-qa:hover{transform:translateY(-2px);box-shadow:0 4px 14px rgba(0,0,0,.08)}
    .abs-qa-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center}
    .abs-qa-lbl{font-size:.71rem;font-weight:700;color:var(--text-secondary)}
    /* ── Grade chip ── */
    .abs-grade{display:inline-flex;align-items:center;justify-content:center;width:44px;height:28px;border-radius:7px;font-weight:900;font-size:.9rem}
    /* ── Bulletin pro card ── */
    .abs-bulletin-pro{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:all .2s}
    .abs-bulletin-pro:hover{box-shadow:0 6px 20px rgba(0,0,0,.09)}
    .abs-bulletin-stripe{height:4px}
    .abs-bulletin-hd{padding:14px 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border)}
    .abs-bulletin-avg{font-size:2rem;font-weight:900;line-height:1;min-width:52px;text-align:right}
    .abs-bulletin-body{padding:12px 18px;display:flex;flex-direction:column;gap:7px}
    .abs-grade-row{display:flex;align-items:center;gap:8px}
    .abs-grade-name{font-size:.75rem;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .abs-grade-bar-wrap{width:60px;height:5px;border-radius:3px;background:var(--bg-primary);overflow:hidden;flex-shrink:0}
    .abs-grade-bar-fill{height:100%;border-radius:3px}
    .abs-grade-note{font-size:.8rem;font-weight:800;min-width:28px;text-align:right}
    .abs-bulletin-ft{padding:10px 18px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
    /* ── Attendance ring ── */
    .abs-ring{position:relative;display:inline-flex;align-items:center;justify-content:center}
    .abs-ring svg{transform:rotate(-90deg)}
    .abs-ring-text{position:absolute;font-weight:900;font-size:.85rem;color:var(--text-primary)}
    /* ── Financial bar ── */
    .abs-finance-bar{height:10px;border-radius:5px;background:var(--bg-primary);overflow:hidden;margin:6px 0}
    .abs-finance-fill{height:100%;border-radius:5px;transition:width .6s ease}
    /* ── Student row with avatar ── */
    .abs-student-cell{display:flex;align-items:center;gap:10px}
    /* ── Print ── */
    @media print{.abs-sidebar,.abs-topbar,.abs-mobile-nav{display:none!important}.abs-page{padding:0!important}.abs-bulletin-pro{break-inside:avoid}}
  `;

  return (
    <div>
      <SEO title={currentEtab?`${currentEtab.nom} — AbSchool`:'AbSchool — Gestion Scolaire'} description="Gestion scolaire complète — élèves, notes, présences, paiements, bulletins." />
      <style>{CSS}</style>

      {sidebarOpen && <div className="abs-overlay" onClick={()=>setSidebarOpen(false)}/>}

      {notification && (
        <div className="abs-toast" style={{
          background:notification.type==='success'?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)',
          border:`1px solid ${notification.type==='success'?'rgba(16,185,129,.4)':'rgba(239,68,68,.4)'}`,
          color:notification.type==='success'?'#10B981':'#EF4444',
        }}>
          {notification.type==='success'?<IcCheck s={14}/>:<IcAlert s={14}/>}
          {notification.msg}
        </div>
      )}

      <div className="abs-shell">
        {/* Sidebar */}
        <aside className={`abs-sidebar${sidebarOpen?' open':''}`}>
          <div className="abs-sidebar-brand">
            <div className="abs-logo">Ab</div>
            <div>
              <div className="abs-brand-name">Ab<em>School</em></div>
              <div className="abs-brand-sub">ABAWI · Éducation</div>
            </div>
          </div>

          {currentEtab && (
            <div className="abs-school-chip">
              <span>Établissement actif</span>
              {currentEtab.nom}
            </div>
          )}

          <nav className="abs-nav">
            {TABS.map(tab => (
              <button key={tab.id} className={`abs-nav-item${view===tab.id?' active':''}`}
                onClick={()=>{ setView(tab.id); setSidebarOpen(false); }}>
                <span className="abs-nav-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="abs-sidebar-foot">
            <div className="abs-role-pill" style={{ background:ROLE_CONFIG[userRole]?.bg, color:ROLE_CONFIG[userRole]?.color }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block',flexShrink:0 }}/>
              {ROLE_CONFIG[userRole]?.label}
            </div>
            <button className="abs-change-btn" onClick={()=>{ setShowPortal(true); setSidebarOpen(false); }}>
              Changer d'établissement
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="abs-main">
          <header className="abs-topbar">
            <button className="abs-hamburger" onClick={()=>setSidebarOpen(v=>!v)}><IcMenu/></button>
            <span className="abs-topbar-icon">{activeTab?.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="abs-topbar-title">{activeTab?.label}</div>
              {currentEtab && <div className="abs-topbar-sub">{currentEtab.nom} · {TYPE_LABELS[currentEtab.type]} · {currentEtab.annee_scolaire}</div>}
            </div>
            {data.etablissements.length>1 && (
              <select className="abs-select" style={{ width:'auto',padding:'5px 30px 5px 10px',fontSize:'.73rem' }} value={etabFilter} onChange={e=>setEtabFilter(e.target.value)}>
                <option value="all">Tous</option>
                {data.etablissements.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
            )}
          </header>

          <main className="abs-page abs-anim">
            {(!currentEtab||showPortal) ? (
              <SchoolPortal
                establishments={data.etablissements}
                onCreate={ne=>{
                  const pass=(Math.random().toString(36).substring(2,6)+Math.random().toString(36).substring(2,6)).toUpperCase();
                  addItem('etablissements',{...ne,pass_code:pass});
                  setUserRole('admin'); localStorage.setItem('abschool_role','admin');
                  setShowPortal(false); localStorage.setItem('abschool_last_etab','ok');
                  notify('success',`Établissement créé — Code: ${pass}`);
                }}
                onJoin={(code,role)=>{
                  const found=data.etablissements.find(e=>e.pass_code===code);
                  if(!found){notify('error','Code invalide');return;}
                  setEtabFilter(found.id); setUserRole(role);
                  localStorage.setItem('abschool_role',role);
                  setShowPortal(false); localStorage.setItem('abschool_last_etab',found.id);
                  notify('success',`Bienvenue dans ${found.nom}`);
                }}
                onEnter={(etabId,role)=>{
                  setEtabFilter(etabId); setUserRole(role);
                  localStorage.setItem('abschool_role',role);
                  setShowPortal(false); localStorage.setItem('abschool_last_etab',etabId);
                }}
              />
            ) : (
              <>
                {/* DASHBOARD */}
                {view==='dashboard' && (
                  <div className="abs-anim">
                    {/* School Banner */}
                    <SchoolBanner etab={currentEtab} stats={stats} />

                    {/* Quick Actions */}
                    <div className="abs-qa-grid">
                      {[
                        {icon:<IcPlus s={18}/>,label:'Ajouter élève',color:'#10B981',bg:'rgba(16,185,129,.12)',action:()=>setView('eleves')},
                        {icon:<IcCal s={18}/>,label:'Présences',color:'#3B82F6',bg:'rgba(59,130,246,.12)',action:()=>{setView('presences');setTimeout(()=>setModal({type:'presence'}),100)}},
                        {icon:<IcClip s={18}/>,label:'Saisir note',color:'#8B5CF6',bg:'rgba(139,92,246,.12)',action:()=>{setView('notes');setTimeout(()=>setModal({type:'note'}),100)}},
                        {icon:<IcCard s={18}/>,label:'Paiement',color:'#F59E0B',bg:'rgba(245,158,11,.12)',action:()=>{setView('paiements');setTimeout(()=>setModal({type:'paiement'}),100)}},
                        {icon:<IcFile s={18}/>,label:'Bulletins',color:'#EC4899',bg:'rgba(236,72,153,.12)',action:()=>setView('bulletins')},
                        {icon:<IcUsers s={18}/>,label:'Enseignants',color:'#0EA5E9',bg:'rgba(14,165,233,.12)',action:()=>setView('enseignants')},
                      ].map((qa,i)=>(
                        <button key={i} className="abs-qa" onClick={qa.action}>
                          <div className="abs-qa-icon" style={{background:qa.bg,color:qa.color}}>{qa.icon}</div>
                          <span className="abs-qa-lbl">{qa.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* KPI + Charts row */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
                      {/* Élèves par genre */}
                      <div className="abs-card">
                        <div className="abs-card-hd" style={{paddingBottom:10}}><div className="abs-card-title"><IcGrad s={14}/> Répartition</div></div>
                        <div className="abs-card-bd" style={{display:'flex',alignItems:'center',gap:14}}>
                          <AttendanceRing pct={stats.nbEleves>0?Math.round((stats.garcons/stats.nbEleves)*100):0} color="#3B82F6" size={60}/>
                          <div style={{display:'flex',flexDirection:'column',gap:6}}>
                            <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:'#3B82F6',display:'inline-block'}}/><span style={{fontSize:'.72rem',color:'var(--text-muted)'}}>Garçons</span><span style={{fontSize:'.8rem',fontWeight:800,marginLeft:'auto'}}>{stats.garcons}</span></div>
                            <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:'#EC4899',display:'inline-block'}}/><span style={{fontSize:'.72rem',color:'var(--text-muted)'}}>Filles</span><span style={{fontSize:'.8rem',fontWeight:800,marginLeft:'auto'}}>{stats.filles}</span></div>
                            <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:'#10B981',display:'inline-block'}}/><span style={{fontSize:'.72rem',color:'var(--text-muted)'}}>Total</span><span style={{fontSize:'.8rem',fontWeight:800,marginLeft:'auto'}}>{stats.nbEleves}</span></div>
                          </div>
                        </div>
                      </div>
                      {/* Taux de présence */}
                      <div className="abs-card">
                        <div className="abs-card-hd" style={{paddingBottom:10}}><div className="abs-card-title"><IcCal s={14}/> Présences</div></div>
                        <div className="abs-card-bd" style={{display:'flex',alignItems:'center',gap:14}}>
                          {(()=>{
                            const tot=etabPresences.length;
                            const pres=etabPresences.filter(p=>p.statut==='present').length;
                            const pct=tot>0?Math.round((pres/tot)*100):0;
                            return<>
                              <AttendanceRing pct={pct} color="#10B981" size={60}/>
                              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                                <div style={{fontSize:'.72rem',color:'var(--text-muted)'}}>Taux de présence</div>
                                <div style={{fontSize:'1.1rem',fontWeight:900,color:'#10B981'}}>{pct}%</div>
                                <div style={{fontSize:'.68rem',color:'var(--text-muted)'}}>{stats.totalAbsent} absence(s)</div>
                              </div>
                            </>;
                          })()}
                        </div>
                      </div>
                      {/* Finances */}
                      <div className="abs-card">
                        <div className="abs-card-hd" style={{paddingBottom:10}}><div className="abs-card-title"><IcWallet s={14}/> Finances</div></div>
                        <div className="abs-card-bd">
                          {(()=>{
                            const pct=stats.totalFrais>0?Math.round((stats.totalPaye/stats.totalFrais)*100):0;
                            const reste=Math.max(0,(stats.totalFrais||0)-(stats.totalPaye||0));
                            return<>
                              <div style={{fontSize:'.72rem',color:'var(--text-muted)',marginBottom:4}}>Recouvrement scolarité</div>
                              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                                <span style={{fontSize:'.75rem',fontWeight:800,color:'#10B981'}}>{pct}% collecté</span>
                                <span style={{fontSize:'.72rem',color:'var(--text-muted)'}}>{formatPrix(stats.totalPaye)}</span>
                              </div>
                              <div className="abs-finance-bar"><div className="abs-finance-fill" style={{width:`${pct}%`,background:`linear-gradient(90deg,#10B981,#059669)`}}/></div>
                              <div style={{fontSize:'.68rem',color:'var(--text-muted)',marginTop:4}}>Reste : {formatPrix(reste)}</div>
                            </>;
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Classes + Payments */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:0}}>
                      <div className="abs-card">
                        <div className="abs-card-hd"><div className="abs-card-title"><IcBook s={15}/> Classes</div></div>
                        <div className="abs-card-bd" style={{display:'flex',flexDirection:'column',gap:10}}>
                          {etabClasses.length===0&&<Empty icon={<IcBook s={22}/>} msg="Aucune classe"/>}
                          {etabClasses.map(cls=>{
                            const nb=etabEleves.filter(e=>e.classe_id===cls.id).length;
                            const pct=cls.capacite>0?Math.round((nb/cls.capacite)*100):0;
                            const col=pct>90?'#EF4444':pct>70?'#F59E0B':'#10B981';
                            return(
                              <div key={cls.id} style={{display:'flex',alignItems:'center',gap:10}}>
                                <div style={{width:30,height:30,borderRadius:8,background:`${col}18`,display:'flex',alignItems:'center',justifyContent:'center',color:col,flexShrink:0,fontSize:'.65rem',fontWeight:900}}>{cls.niveau?.slice(0,2)}</div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                                    <span style={{fontSize:'.78rem',fontWeight:700}}>{cls.nom}</span>
                                    <span style={{fontSize:'.7rem',color:col,fontWeight:800}}>{nb}/{cls.capacite}</span>
                                  </div>
                                  <div className="abs-track"><div className="abs-fill" style={{width:`${Math.min(pct,100)}%`,background:col}}/></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="abs-card">
                        <div className="abs-card-hd">
                          <div className="abs-card-title"><IcCard s={15}/> Paiements récents</div>
                          <button style={{fontSize:'.7rem',padding:'3px 9px',borderRadius:7,border:'1px solid var(--border)',background:'transparent',color:'var(--text-muted)',cursor:'pointer',fontFamily:'inherit'}} onClick={()=>setView('paiements')}>Tout voir</button>
                        </div>
                        <div style={{overflowX:'auto'}}>
                          <table className="abs-tbl">
                            <thead><tr><th>Élève</th><th>Montant</th><th>Statut</th></tr></thead>
                            <tbody>
                              {etabPaiements.slice(-4).reverse().map(p=>{
                                const elv=data.eleves.find(e=>e.id===p.eleve_id);
                                return(
                                  <tr key={p.id}>
                                    <td><div className="abs-student-cell"><Av nom={elv?.nom} prenom={elv?.prenom} size={26}/><span style={{fontWeight:600,fontSize:'.8rem'}}>{elv?`${elv.prenom} ${elv.nom}`:'—'}</span></div></td>
                                    <td style={{fontWeight:800,fontSize:'.82rem'}}>{formatPrix(p.montant)}</td>
                                    <td><Bdg status={p.statut} map={{paye:['Payé','#10B981'],attente:['Attente','#F59E0B']}}/></td>
                                  </tr>
                                );
                              })}
                              {etabPaiements.length===0&&<tr><td colSpan={3}><Empty icon={null} msg="Aucun paiement"/></td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ÉTABLISSEMENTS */}
                {view==='etablissements' && (
                  <CrudView title="Établissements" icon={<IcBuild s={16}/>} items={data.etablissements}
                    fields={[
                      {key:'nom',label:'Nom',required:true},
                      {key:'type',label:'Type',type:'select',options:Object.entries(TYPE_LABELS).map(([k,v])=>({value:k,label:v}))},
                      {key:'adresse',label:'Adresse',tableHidden:true},
                      {key:'ville',label:'Ville'},
                      {key:'telephone',label:'Téléphone'},
                      {key:'email',label:'Email'},
                      {key:'directeur_nom',label:'Directeur'},
                      {key:'annee_scolaire',label:'Année scolaire',required:true},
                    ]}
                    onAdd={item=>addItem('etablissements',item)}
                    onUpdate={(id,u)=>updateItem('etablissements',id,u)}
                    onDelete={id=>deleteItem('etablissements',id)}
                    renderRow={e=>(<>
                      <td style={{fontWeight:700}}>{e.nom}</td>
                      <td><Bdg status={e.type} map={Object.fromEntries(Object.entries(TYPE_LABELS).map(([k,v])=>[k,[v,'#10B981']]))}/></td>
                      <td style={{color:'var(--text-muted)'}}>{e.ville||'—'}</td>
                      <td style={{color:'var(--text-muted)'}}>{e.telephone||'—'}</td>
                      <td style={{color:'var(--text-muted)'}}>{e.directeur_nom||'—'}</td>
                      <td style={{fontWeight:600}}>{e.annee_scolaire}</td>
                    </>)}
                  />
                )}

                {/* CLASSES */}
                {view==='classes' && (
                  <CrudView title="Classes" icon={<IcBook s={16}/>} items={etabClasses}
                    fields={[
                      {key:'nom',label:'Nom',required:true},
                      {key:'niveau',label:'Niveau',required:true},
                      {key:'section',label:'Section'},
                      {key:'capacite',label:'Capacité',type:'number'},
                      {key:'salle',label:'Salle'},
                    ]}
                    onAdd={item=>{ if(!currentEtab)return; addItem('classes',{...item,etablissement_id:currentEtab.id}); }}
                    onUpdate={(id,u)=>updateItem('classes',id,u)}
                    onDelete={id=>deleteItem('classes',id)}
                    renderRow={c=>{
                      const nb=etabEleves.filter(e=>e.classe_id===c.id).length;
                      return(<>
                        <td style={{fontWeight:700}}>{c.nom}</td>
                        <td>{c.niveau}</td>
                        <td style={{color:'var(--text-muted)'}}>{c.section||'—'}</td>
                        <td><b>{nb}</b><span style={{color:'var(--text-muted)',fontSize:'.78rem'}}>/{c.capacite}</span></td>
                        <td style={{color:'var(--text-muted)'}}>{c.salle||'—'}</td>
                      </>);
                    }}
                  />
                )}

                {/* MATIÈRES */}
                {view==='matieres' && (
                  <CrudView title="Matières" icon={<IcAtom s={16}/>} items={etabMatieres}
                    fields={[
                      {key:'nom',label:'Nom',required:true},
                      {key:'code',label:'Code'},
                      {key:'coefficient',label:'Coefficient',type:'number'},
                      {key:'couleur',label:'Couleur',type:'color'},
                    ]}
                    onAdd={item=>{ if(!currentEtab)return; addItem('matieres',{...item,etablissement_id:currentEtab.id}); }}
                    onUpdate={(id,u)=>updateItem('matieres',id,u)}
                    onDelete={id=>deleteItem('matieres',id)}
                    renderRow={m=>(<>
                      <td><span style={{display:'inline-flex',alignItems:'center',gap:8,fontWeight:700}}>
                        <span style={{width:10,height:10,borderRadius:'50%',background:m.couleur||'#ccc',display:'inline-block',flexShrink:0}}/>
                        {m.nom}
                      </span></td>
                      <td><span className="abs-badge" style={{background:'var(--bg-primary)',color:'var(--text-secondary)',border:'1px solid var(--border)'}}>{m.code||'—'}</span></td>
                      <td style={{fontWeight:700,color:'var(--text-muted)',fontSize:'.8rem'}}>Coeff. {m.coefficient}</td>
                    </>)}
                  />
                )}

                {/* ENSEIGNANTS */}
                {view==='enseignants' && (
                  <CrudView title="Enseignants" icon={<IcUsers s={16}/>} items={etabEnseignants}
                    fields={[
                      {key:'prenom',label:'Prénom',required:true},
                      {key:'nom',label:'Nom',required:true},
                      {key:'email',label:'Email'},
                      {key:'telephone',label:'Téléphone'},
                      {key:'specialite',label:'Spécialité'},
                      {key:'salaire_mensuel',label:'Salaire (FCFA)',type:'number'},
                      {key:'statut',label:'Statut',type:'select',options:[{value:'actif',label:'Actif'},{value:'inactif',label:'Inactif'},{value:'conge',label:'En congé'}]},
                    ]}
                    onAdd={item=>{ if(!currentEtab)return; addItem('enseignants',{...item,etablissement_id:currentEtab.id}); }}
                    onUpdate={(id,u)=>updateItem('enseignants',id,u)}
                    onDelete={id=>deleteItem('enseignants',id)}
                    renderRow={e=>(<>
                      <td><div className="abs-student-cell"><Av nom={e.nom} prenom={e.prenom} size={32} color="#8B5CF6"/><div><div style={{fontWeight:700,fontSize:'.82rem'}}>{e.prenom} {e.nom}</div><div style={{fontSize:'.68rem',color:'var(--text-muted)'}}>{e.specialite||'—'}</div></div></div></td>
                      <td style={{color:'var(--text-muted)',fontSize:'.79rem'}}>{e.email||'—'}</td>
                      <td style={{color:'var(--text-muted)'}}>{e.telephone||'—'}</td>
                      <td style={{fontWeight:700,fontSize:'.82rem'}}>{formatPrix(e.salaire_mensuel)}</td>
                      <td><Bdg status={e.statut} map={{actif:['Actif','#10B981'],inactif:['Inactif','#EF4444'],conge:['Congé','#F59E0B']}}/></td>
                    </>)}
                  />
                )}

                {/* ÉLÈVES */}
                {view==='eleves' && (
                  <CrudView title="Élèves" icon={<IcGrad s={16}/>} items={etabEleves}
                    fields={[
                      {key:'prenom',label:'Prénom',required:true},
                      {key:'nom',label:'Nom',required:true},
                      {key:'matricule',label:'Matricule',required:true},
                      {key:'date_naissance',label:'Date naissance',type:'date',tableHidden:true},
                      {key:'sexe',label:'Sexe',type:'select',options:[{value:'M',label:'Masculin'},{value:'F',label:'Féminin'}],tableHidden:true},
                      {key:'classe_id',label:'Classe',type:'select',options:etabClasses.map(c=>({value:c.id,label:c.nom}))},
                      {key:'parent_nom',label:'Nom du parent',tableHidden:true},
                      {key:'parent_telephone',label:'Tél. parent',tableHidden:true},
                      {key:'frais_scolarite',label:'Frais scolarité (FCFA)',type:'number'},
                      {key:'statut',label:'Statut',type:'select',options:[{value:'actif',label:'Actif'},{value:'suspendu',label:'Suspendu'},{value:'exclu',label:'Exclu'}]},
                    ]}
                    onAdd={item=>{ if(!currentEtab)return; addItem('eleves',{...item,etablissement_id:currentEtab.id}); }}
                    onUpdate={(id,u)=>updateItem('eleves',id,u)}
                    onDelete={id=>deleteItem('eleves',id)}
                    renderRow={e=>{
                      const cls=data.classes.find(c=>c.id===e.classe_id);
                      const ns=data.notes.filter(n=>n.eleve_id===e.id);
                      const moy=calcMoyenneEleve(ns);
                      const moyColor=moy===null?'var(--text-muted)':moy>=14?'#F0B429':moy>=10?'#10B981':moy>=8?'#F59E0B':'#EF4444';
                      return(<>
                        <td><div className="abs-student-cell"><Av nom={e.nom} prenom={e.prenom} sexe={e.sexe} size={32}/><div><div style={{fontWeight:700,fontSize:'.82rem'}}>{e.prenom} {e.nom}</div><div style={{fontSize:'.68rem',color:'var(--text-muted)',fontFamily:'monospace'}}>{e.matricule}</div></div></div></td>
                        <td>{cls?.nom||'—'}</td>
                        <td style={{fontWeight:700,fontSize:'.82rem'}}>{formatPrix(e.frais_scolarite)}</td>
                        <td><span style={{fontWeight:900,color:moyColor}}>{moy!==null?moy.toFixed(1):'—'}</span></td>
                        <td><Bdg status={e.statut} map={{actif:['Actif','#10B981'],suspendu:['Suspendu','#F59E0B'],exclu:['Exclu','#EF4444']}}/></td>
                      </>);
                    }}
                  />
                )}

                {/* NOTES */}
                {view==='notes' && (
                  <div className="abs-anim">
                    <div className="abs-sec-hd">
                      <div className="abs-sec-h2"><IcClip s={16}/> Notes & Évaluations</div>
                      {userRole!=='eleve'&&userRole!=='parent'&&(
                        <button className="abs-btn" onClick={()=>setModal({type:'note'})}><IcPlus s={13}/> Ajouter une note</button>
                      )}
                    </div>
                    <div className="abs-card" style={{ marginBottom:14,overflowX:'auto' }}>
                      <div className="abs-card-hd"><div className="abs-card-title">Toutes les notes — {currentEtab?.annee_scolaire}</div></div>
                      <table className="abs-tbl">
                        <thead><tr><th>Élève</th><th>Matière</th><th>Type</th><th>Note /20</th><th>Coeff.</th><th>Trim.</th><th></th></tr></thead>
                        <tbody>
                          {etabNotes.map(n=>{
                            const elv=data.eleves.find(e=>e.id===n.eleve_id);
                            const mat=data.matieres.find(m=>m.id===n.matiere_id);
                            const nc=n.note>=16?'#F0B429':n.note>=14?'#10B981':n.note>=10?'#10B981':n.note>=8?'#F59E0B':'#EF4444';
                            return(
                              <tr key={n.id}>
                                <td><div className="abs-student-cell"><Av nom={elv?.nom} prenom={elv?.prenom} size={28}/><span style={{fontWeight:600,fontSize:'.82rem'}}>{elv?`${elv.prenom} ${elv.nom}`:'—'}</span></div></td>
                                <td><span style={{display:'inline-flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:mat?.couleur||'#ccc',display:'inline-block',flexShrink:0}}/><span style={{fontSize:'.82rem'}}>{mat?.nom||'—'}</span></span></td>
                                <td><span className="abs-badge" style={{background:'var(--bg-primary)',color:'var(--text-muted)',border:'1px solid var(--border)',textTransform:'capitalize'}}>{n.type}</span></td>
                                <td><span className="abs-grade" style={{background:`${nc}18`,color:nc}}>{n.note}</span></td>
                                <td style={{color:'var(--text-muted)',fontSize:'.8rem'}}>× {n.coeff}</td>
                                <td><span className="abs-badge" style={{background:'rgba(16,185,129,.08)',color:'#10B981'}}>T{n.trimestre}</span></td>
                                <td><button className="abs-icon-btn del" onClick={()=>deleteItem('notes',n.id)}><IcTrash/></button></td>
                              </tr>
                            );
                          })}
                          {etabNotes.length===0&&<tr><td colSpan={7}><Empty icon={<IcClip s={26}/>} msg="Aucune note enregistrée"/></td></tr>}
                        </tbody>
                      </table>
                    </div>
                    {etabEleves.length>0&&(
                      <div className="abs-card">
                        <div className="abs-card-hd"><div className="abs-card-title">Moyennes par élève</div></div>
                        <div className="abs-card-bd" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(172px,1fr))',gap:10 }}>
                          {etabEleves.map(e=>{
                            const ns=data.notes.filter(n=>n.eleve_id===e.id);
                            const moy=calcMoyenneEleve(ns);
                            const cls=data.classes.find(c=>c.id===e.classe_id);
                            const col=moy===null?'var(--text-muted)':moy>=10?'#10B981':'#EF4444';
                            return(
                              <div key={e.id} style={{ padding:'12px 14px',borderRadius:10,background:'var(--bg-primary)',border:'1px solid var(--border)' }}>
                                <div style={{fontWeight:700,fontSize:'.83rem'}}>{e.prenom} {e.nom}</div>
                                <div style={{fontSize:'.72rem',color:'var(--text-muted)',marginBottom:5}}>{cls?.nom||'—'}</div>
                                <div style={{fontSize:'1.35rem',fontWeight:900,color:col}}>{moy!==null?moy.toFixed(2):'—'}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PRÉSENCES */}
                {view==='presences' && (
                  <div className="abs-anim">
                    <div className="abs-sec-hd">
                      <div className="abs-sec-h2"><IcCal s={16}/> Présences & Absences</div>
                      {userRole!=='eleve'&&userRole!=='parent'&&(
                        <button className="abs-btn" onClick={()=>setModal({type:'presence'})}><IcPlus s={13}/> Marquer une présence</button>
                      )}
                    </div>
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:10,marginBottom:14 }}>
                      {[['present','Présences','#10B981'],['absent','Absences','#EF4444'],['retard','Retards','#F59E0B'],['justifie','Justifiés','#3B82F6']].map(([s,lbl,col])=>(
                        <div key={s} style={{padding:'13px 15px',borderRadius:12,background:'var(--bg-card)',border:'1px solid var(--border)',textAlign:'center'}}>
                          <div style={{fontSize:'1.55rem',fontWeight:900,color:col}}>{etabPresences.filter(p=>p.statut===s).length}</div>
                          <div style={{fontSize:'.66rem',color:'var(--text-muted)',textTransform:'uppercase',fontWeight:700,letterSpacing:'.8px',marginTop:3}}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                    <div className="abs-card" style={{ overflowX:'auto' }}>
                      <table className="abs-tbl">
                        <thead><tr><th>Date</th><th>Élève</th><th>Classe</th><th>Statut</th><th>Motif</th><th></th></tr></thead>
                        <tbody>
                          {etabPresences.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(p=>{
                            const elv=data.eleves.find(e=>e.id===p.eleve_id);
                            const cls=data.classes.find(c=>c.id===p.classe_id);
                            return(
                              <tr key={p.id}>
                                <td style={{color:'var(--text-muted)',fontSize:'.79rem',fontWeight:600}}>{formatDate(p.date)}</td>
                                <td style={{fontWeight:600}}>{elv?`${elv.prenom} ${elv.nom}`:'—'}</td>
                                <td style={{color:'var(--text-muted)'}}>{cls?.nom||'—'}</td>
                                <td><Bdg status={p.statut} map={{present:['Présent','#10B981'],absent:['Absent','#EF4444'],retard:['Retard','#F59E0B'],justifie:['Justifié','#3B82F6']}}/></td>
                                <td style={{color:'var(--text-muted)',fontSize:'.79rem'}}>{p.motif||'—'}</td>
                                <td><button className="abs-icon-btn del" onClick={()=>deleteItem('presences',p.id)}><IcTrash/></button></td>
                              </tr>
                            );
                          })}
                          {etabPresences.length===0&&<tr><td colSpan={6}><Empty icon={<IcCal s={26}/>} msg="Aucune donnée de présence"/></td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* PAIEMENTS */}
                {view==='paiements' && (
                  <div className="abs-anim">
                    <div className="abs-sec-hd">
                      <div className="abs-sec-h2"><IcCard s={16}/> Paiements & Scolarité</div>
                      {userRole==='admin'&&<button className="abs-btn" onClick={()=>setModal({type:'paiement'})}><IcPlus s={13}/> Enregistrer un paiement</button>}
                    </div>
                    <div className="abs-card" style={{ marginBottom:14 }}>
                      <div className="abs-card-hd"><div className="abs-card-title">Solde par élève</div></div>
                      <div className="abs-card-bd" style={{ display:'flex',flexDirection:'column',gap:8 }}>
                        {etabEleves.length===0&&<Empty icon={<IcGrad s={26}/>} msg="Aucun élève enregistré"/>}
                        {etabEleves.map(e=>{
                          const paye=etabPaiements.filter(p=>p.eleve_id===e.id&&p.statut==='paye').reduce((s,p)=>s+p.montant,0);
                          const solde=(e.frais_scolarite||0)-paye;
                          const ok=solde<=0;
                          const pct=e.frais_scolarite>0?Math.min(100,Math.round((paye/e.frais_scolarite)*100)):0;
                          return(
                            <div key={e.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:12,background:'var(--bg-primary)',border:'1px solid var(--border)'}}>
                              <Av nom={e.nom} prenom={e.prenom} sexe={e.sexe} size={34}/>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                                  <span style={{fontWeight:700,fontSize:'.82rem'}}>{e.prenom} {e.nom}</span>
                                  <span style={{fontWeight:800,fontSize:'.8rem',color:ok?'#10B981':'#EF4444'}}>{ok?'Soldé':`−${formatPrix(solde)}`}</span>
                                </div>
                                <div className="abs-finance-bar" style={{marginBottom:3}}><div className="abs-finance-fill" style={{width:`${pct}%`,background:ok?'linear-gradient(90deg,#10B981,#059669)':'linear-gradient(90deg,#F59E0B,#D97706)'}}/></div>
                                <div style={{fontSize:'.68rem',color:'var(--text-muted)'}}>{formatPrix(paye)} / {formatPrix(e.frais_scolarite)} · {pct}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="abs-card" style={{ overflowX:'auto' }}>
                      <div className="abs-card-hd"><div className="abs-card-title">Historique des paiements</div></div>
                      <table className="abs-tbl">
                        <thead><tr><th>Élève</th><th>Type</th><th>Montant</th><th>Méthode</th><th>Date</th><th>Statut</th><th></th></tr></thead>
                        <tbody>
                          {etabPaiements.slice().sort((a,b)=>new Date(b.date_paiement)-new Date(a.date_paiement)).map(p=>{
                            const elv=data.eleves.find(e=>e.id===p.eleve_id);
                            return(
                              <tr key={p.id}>
                                <td style={{fontWeight:600}}>{elv?`${elv.prenom} ${elv.nom}`:'—'}</td>
                                <td style={{color:'var(--text-muted)'}}>{p.type}</td>
                                <td style={{fontWeight:800}}>{formatPrix(p.montant)}</td>
                                <td><span className="abs-badge" style={{background:'var(--bg-primary)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>{p.methode}</span></td>
                                <td style={{color:'var(--text-muted)',fontSize:'.79rem'}}>{formatDate(p.date_paiement)}</td>
                                <td><Bdg status={p.statut} map={{paye:['Payé','#10B981'],attente:['En attente','#F59E0B']}}/></td>
                                <td><button className="abs-icon-btn del" onClick={()=>deleteItem('paiements',p.id)}><IcTrash/></button></td>
                              </tr>
                            );
                          })}
                          {etabPaiements.length===0&&<tr><td colSpan={7}><Empty icon={<IcCard s={26}/>} msg="Aucun paiement enregistré"/></td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* BULLETINS */}
                {view==='bulletins' && (
                  <div className="abs-anim">
                    <div className="abs-sec-hd">
                      <div className="abs-sec-h2"><IcFile s={16}/> Bulletins scolaires</div>
                      <div style={{display:'flex',gap:8}}>
                        <span style={{fontSize:'.72rem',color:'var(--text-muted)',background:'var(--bg-card)',border:'1px solid var(--border)',padding:'4px 12px',borderRadius:100,fontWeight:600}}>
                          {etabEleves.length} élève(s) · {currentEtab?.annee_scolaire}
                        </span>
                        <button className="abs-btn-ghost" style={{fontSize:'.72rem',padding:'4px 12px'}} onClick={()=>window.print()}>
                          Imprimer tout
                        </button>
                      </div>
                    </div>
                    {etabEleves.length===0&&<Empty icon={<IcFile s={32}/>} msg="Aucun élève dans cet établissement"/>}

                    {/* Trimestre selector */}
                    <BulletinsView eleves={etabEleves} notes={data.notes} matieres={etabMatieres} classes={data.classes} etablissement={currentEtab} />
                    <EducationNewsBanner/>
                  </div>
                )}

                {/* SANCTIONS */}
                {view==='sanctions' && (
                  <div className="abs-anim">
                    <CrudView title="Sanctions & Avertissements" icon={<IcShield s={16}/>}
                      items={etabSanctions}
                      fields={[
                        {key:'eleve_id',label:'Élève',type:'select',options:etabEleves.map(e=>({value:e.id,label:`${e.prenom} ${e.nom}`})),required:true},
                        {key:'type',label:'Type',type:'select',options:[{value:'avertissement',label:'Avertissement'},{value:'blame',label:'Blâme'},{value:'exclusion',label:'Exclusion'},{value:'suspension',label:'Suspension'}],required:true},
                        {key:'motif',label:'Motif',required:true},
                        {key:'date',label:'Date',type:'date',required:true},
                        {key:'decideur',label:'Décideur'},
                      ]}
                      onAdd={s=>addItem('sanctions',{...s,etablissement_id:currentEtab?.id})}
                      onUpdate={(id,u)=>updateItem('sanctions',id,u)}
                      onDelete={id=>deleteItem('sanctions',id)}
                      renderRow={s=>{
                        const el=etabEleves.find(e=>e.id===s.eleve_id);
                        return(<><td style={{fontWeight:700}}>{el?.prenom} {el?.nom}</td><td><Bdg status={s.type} map={{avertissement:['Avertissement','#F59E0B'],blame:['Blâme','#EF4444'],exclusion:['Exclusion','#DC2626'],suspension:['Suspension','#7C3AED']}}/></td><td>{s.motif}</td><td>{formatDate(s.date)}</td><td>{s.decideur||'—'}</td></>);
                      }}
                    />
                  </div>
                )}

                {/* RECUS */}
                {view==='recus' && (
                  <div className="abs-anim">
                    <div className="abs-sec-hd">
                      <div className="abs-sec-h2"><IcTicket s={16}/> Reçus de paiement</div>
                      <button className="abs-btn" onClick={()=>{
                        const payes=etabPaiements.filter(p=>p.statut==='paye');
                        if(!payes.length){notify('error','Aucun paiement validé');return;}
                        payes.forEach(p=>{
                          const ex=etabRecus.find(r=>r.paiement_id===p.id);
                          if(!ex){
                            const el=etabEleves.find(e=>e.id===p.eleve_id);
                            addItem('recus',{paiement_id:p.id,eleve_id:p.eleve_id,montant:p.montant,date_recu:new Date().toISOString(),etablissement_id:currentEtab?.id,reference:`REC-${Date.now().toString(36).toUpperCase().slice(-6)}`,libelle:`Scolarité — ${el?.prenom} ${el?.nom}`});
                          }
                        });
                        notify('success',`Reçus générés`);
                      }}><IcFile s={14}/> Générer</button>
                    </div>
                    {etabRecus.length===0&&<Empty icon={<IcTicket s={32}/>} msg="Aucun reçu — cliquez sur Générer pour créer les reçus des paiements validés"/>}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
                      {etabRecus.map(r=>{
                        const el=etabEleves.find(e=>e.id===r.eleve_id);
                        return(
                          <div key={r.id} className="abs-card">
                            <div className="abs-card-hd">
                              <div>
                                <div style={{fontSize:'.78rem',color:'var(--text-muted)',fontWeight:700}}>{r.reference}</div>
                                <div style={{fontWeight:800,fontSize:'.88rem',color:'var(--text-primary)'}}>{formatPrix(r.montant)}</div>
                              </div>
                              <button className="abs-icon-btn del" onClick={()=>deleteItem('recus',r.id)}><IcTrash s={13}/></button>
                            </div>
                            <div style={{padding:'10px 16px',fontSize:'.78rem',color:'var(--text-secondary)'}}>
                              <div>{r.libelle}</div>
                              <div style={{marginTop:4}}>{el?.prenom} {el?.nom} · {formatDate(r.date_recu)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CONTRATS */}
                {view==='contrats' && (
                  <div className="abs-anim">
                    <div className="abs-sec-hd">
                      <div className="abs-sec-h2"><IcContract s={16}/> Contrats</div>
                      <button className="abs-btn" onClick={()=>{
                        const type=prompt('Type de contrat ? (enseignant / eleve / partenaire)');
                        if(!type)return;
                        const t=type.toLowerCase().trim();
                        let nom='', contenu='', lien='';
                        if(t==='enseignant'&&etabEnseignants.length){const e=etabEnseignants[0];nom=`Contrat — ${e.prenom} ${e.nom}`;contenu=`Contrat de travail pour ${e.prenom} ${e.nom}, enseignant de ${e.specialite}, salaire mensuel ${formatPrix(e.salaire_mensuel)}.`;lien=e.id;}
                        else if(t==='eleve'&&etabEleves.length){const e=etabEleves[0];nom=`Fiche inscription — ${e.prenom} ${e.nom}`;contenu=`Fiche d'inscription de l'élève ${e.prenom} ${e.nom}, matricule ${e.matricule}, classe ${data.classes.find(c=>c.id===e.classe_id)?.nom||'—'}.`;lien=e.id;}
                        else{nom='Contrat type';contenu='Contrat standard de l\'établissement.';}
                        addItem('contrats',{type:t,nom,contenu,lien_id:lien||'',date_debut:new Date().toISOString().slice(0,10),date_fin:'',statut:'actif',etablissement_id:currentEtab?.id});
                        notify('success','Contrat généré');
                      }}><IcFile s={14}/> Générer</button>
                    </div>
                    {etabContrats.length===0&&<Empty icon={<IcContract s={32}/>} msg="Aucun contrat — cliquez sur Générer pour créer"/>}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
                      {etabContrats.map(c=>{
                        const target=c.type==='enseignant'?etabEnseignants.find(e=>e.id===c.lien_id):c.type==='eleve'?etabEleves.find(e=>e.id===c.lien_id):null;
                        return(
                          <div key={c.id} className="abs-card">
                            <div className="abs-card-hd">
                              <div>
                                <div style={{fontSize:'.72rem',color:'var(--text-muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>{c.type}</div>
                                <div style={{fontWeight:800,fontSize:'.9rem',color:'var(--text-primary)',marginTop:2}}>{c.nom}</div>
                              </div>
                              <div style={{display:'flex',gap:4}}>
                                <button className="abs-icon-btn" title="Copier le contenu" onClick={()=>{navigator.clipboard.writeText(c.contenu);notify('success','Copié');}}><IcClip s={13}/></button>
                                <button className="abs-icon-btn del" onClick={()=>deleteItem('contrats',c.id)}><IcTrash s={13}/></button>
                              </div>
                            </div>
                            <div style={{padding:'10px 16px',fontSize:'.78rem',color:'var(--text-secondary)',lineHeight:1.45}}>
                              {c.contenu}
                              {target&&<div style={{marginTop:6,color:'var(--text-muted)'}}>Cible: {target.prenom} {target.nom}</div>}
                              <div style={{marginTop:6}}>{formatDate(c.date_debut)}{c.date_fin&&` → ${formatDate(c.date_fin)}`}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* JUSTIFICATIFS */}
                {view==='justificatifs' && (
                  <div className="abs-anim">
                    <CrudView title="Justificatifs d'absence" icon={<IcDocCheck s={16}/>}
                      items={etabJustifs}
                      fields={[
                        {key:'eleve_id',label:'Élève',type:'select',options:etabEleves.map(e=>({value:e.id,label:`${e.prenom} ${e.nom}`})),required:true},
                        {key:'type',label:'Type',type:'select',options:[{value:'absence',label:'Absence'},{value:'retard',label:'Retard'},{value:'maladie',label:'Maladie'},{value:'familial',label:'Raison familiale'}],required:true},
                        {key:'date_debut',label:'Du',type:'date',required:true},
                        {key:'date_fin',label:'Au',type:'date'},
                        {key:'motif',label:'Motif détaillé',required:true},
                        {key:'statut',label:'Statut',type:'select',options:[{value:'en_attente',label:'En attente'},{value:'approuve',label:'Approuvé'},{value:'refuse',label:'Refusé'}]},
                      ]}
                      onAdd={j=>addItem('justificatifs',{...j,etablissement_id:currentEtab?.id})}
                      onUpdate={(id,u)=>updateItem('justificatifs',id,u)}
                      onDelete={id=>deleteItem('justificatifs',id)}
                      renderRow={j=>{
                        const el=etabEleves.find(e=>e.id===j.eleve_id);
                        return(<><td style={{fontWeight:700}}>{el?.prenom} {el?.nom}</td><td><Bdg status={j.type} map={{absence:['Absence','#3B82F6'],retard:['Retard','#F59E0B'],maladie:['Maladie','#EF4444'],familial:['Familial','#8B5CF6']}}/></td><td>{j.motif}</td><td>{formatDate(j.date_debut)}{j.date_fin&&` → ${formatDate(j.date_fin)}`}</td><td><Bdg status={j.statut} map={{en_attente:['En attente','#F59E0B'],approuve:['Approuvé','#10B981'],refuse:['Refusé','#EF4444']}}/></td></>);
                      }}
                    />
                  </div>
                )}

                {/* DOCUMENTS */}
                {view==='documents' && (
                  <div className="abs-anim">
                    <CrudView title="Documents élèves" icon={<IcFolder s={16}/>}
                      items={etabDocs}
                      fields={[
                        {key:'eleve_id',label:'Élève',type:'select',options:etabEleves.map(e=>({value:e.id,label:`${e.prenom} ${e.nom}`})),required:true},
                        {key:'type',label:'Type',type:'select',options:[{value:'bulletin',label:'Bulletin'},{value:'certificat',label:'Certificat'},{value:'photo',label:'Photo'},{value:'piece_identite',label:'Pièce d\'identité'},{value:'extrait_naissance',label:'Extrait de naissance'},{value:'autre',label:'Autre'}],required:true},
                        {key:'nom',label:'Nom du document',required:true},
                        {key:'url',label:'Lien / URL'},
                        {key:'date',label:'Date',type:'date'},
                      ]}
                      onAdd={d=>addItem('documents_eleve',{...d,etablissement_id:currentEtab?.id})}
                      onUpdate={(id,u)=>updateItem('documents_eleve',id,u)}
                      onDelete={id=>deleteItem('documents_eleve',id)}
                      renderRow={d=>{
                        const el=etabEleves.find(e=>e.id===d.eleve_id);
                        return(<><td style={{fontWeight:700}}>{el?.prenom} {el?.nom}</td><td><Bdg status={d.type} map={{bulletin:['Bulletin','#3B82F6'],certificat:['Certificat','#10B981'],photo:['Photo','#F59E0B'],piece_identite:['ID','#8B5CF6'],extrait_naissance:['Naissance','#EF4444'],autre:['Autre','#6B7280']}}/></td><td>{d.nom}</td><td style={{fontSize:'.75rem',color:'var(--text-muted)'}}>{d.url?<a href={d.url} target="_blank" rel="noreferrer" style={{color:'#10B981'}}>Ouvrir ↗</a>:'—'}</td><td>{formatDate(d.date)}</td></>);
                      }}
                    />
                  </div>
                )}

                {/* PARTENAIRES */}
                {view==='partenaires' && (
                  <div className="abs-anim">
                    <CrudView title="Partenaires & Dossiers" icon={<IcHandshake s={16}/>}
                      items={etabPartenaires}
                      fields={[
                        {key:'nom',label:'Nom',required:true},
                        {key:'type',label:'Type',type:'select',options:[{value:'sponsor',label:'Sponsor'},{value:'fournisseur',label:'Fournisseur'},{value:'institution',label:'Institution'},{value:'association',label:'Association'},{value:'autre',label:'Autre'}],required:true},
                        {key:'contact',label:'Personne contact'},
                        {key:'telephone',label:'Téléphone'},
                        {key:'email',label:'Email',type:'email'},
                        {key:'statut',label:'Statut',type:'select',options:[{value:'actif',label:'Actif'},{value:'inactif',label:'Inactif'}]},
                      ]}
                      onAdd={p=>addItem('partenaires',{...p,etablissement_id:currentEtab?.id})}
                      onUpdate={(id,u)=>updateItem('partenaires',id,u)}
                      onDelete={id=>deleteItem('partenaires',id)}
                      renderRow={p=>(<><td style={{fontWeight:700}}>{p.nom}</td><td><Bdg status={p.type} map={{sponsor:['Sponsor','#F59E0B'],fournisseur:['Fournisseur','#3B82F6'],institution:['Institution','#8B5CF6'],association:['Association','#10B981'],autre:['Autre','#6B7280']}}/></td><td>{p.contact||'—'}</td><td>{p.telephone||'—'}</td><td>{p.email||'—'}</td><td><Bdg status={p.statut} map={{actif:['Actif','#10B981'],inactif:['Inactif','#EF4444']}}/></td></>)}
                    />
                  </div>
                )}

                {/* PERSONNEL */}
                {view==='personnel' && (
                  <div className="abs-anim">
                    <CrudView title="Personnel administratif" icon={<IcBriefcase s={16}/>}
                      items={etabPersonnel}
                      fields={[
                        {key:'prenom',label:'Prénom',required:true},
                        {key:'nom',label:'Nom',required:true},
                        {key:'poste',label:'Poste',required:true},
                        {key:'telephone',label:'Téléphone'},
                        {key:'email',label:'Email',type:'email'},
                        {key:'salaire_mensuel',label:'Salaire (FCFA)',type:'number'},
                        {key:'statut',label:'Statut',type:'select',options:[{value:'actif',label:'Actif'},{value:'conge',label:'En congé'},{value:'licencie',label:'Licencié'}]},
                      ]}
                      onAdd={p=>addItem('personnel',{...p,etablissement_id:currentEtab?.id})}
                      onUpdate={(id,u)=>updateItem('personnel',id,u)}
                      onDelete={id=>deleteItem('personnel',id)}
                      renderRow={p=>(<><td style={{fontWeight:700}}>{p.prenom}</td><td>{p.nom}</td><td>{p.poste}</td><td>{p.telephone||'—'}</td><td>{p.email||'—'}</td><td>{formatPrix(p.salaire_mensuel)}</td><td><Bdg status={p.statut} map={{actif:['Actif','#10B981'],conge:['Congé','#F59E0B'],licencie:['Licencié','#EF4444']}}/></td></>)}
                    />
                  </div>
                )}

                {/* NOTES ELEVE */}
                {view==='notes_eleve' && (
                  <div className="abs-anim">
                    <CrudView title="Notes & Observations sur les élèves" icon={<IcMessage s={16}/>}
                      items={etabNotesEleve}
                      fields={[
                        {key:'eleve_id',label:'Élève',type:'select',options:etabEleves.map(e=>({value:e.id,label:`${e.prenom} ${e.nom}`})),required:true},
                        {key:'auteur',label:'Auteur (enseignant)',required:true},
                        {key:'contenu',label:'Observation',required:true},
                        {key:'date',label:'Date',type:'date',required:true},
                      ]}
                      onAdd={n=>addItem('notes_eleve',{...n,etablissement_id:currentEtab?.id})}
                      onUpdate={(id,u)=>updateItem('notes_eleve',id,u)}
                      onDelete={id=>deleteItem('notes_eleve',id)}
                      renderRow={n=>{
                        const el=etabEleves.find(e=>e.id===n.eleve_id);
                        return(<><td style={{fontWeight:700}}>{el?.prenom} {el?.nom}</td><td style={{maxWidth:300,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{n.contenu}</td><td>{n.auteur}</td><td>{formatDate(n.date)}</td></>);
                      }}
                    />
                  </div>
                )}

                {/* CURSUS */}
                {view==='cursus' && (
                  <div className="abs-anim">
                    <CrudView title="Parcours scolaire (Cursus)" icon={<IcRoute s={16}/>}
                      items={etabCursus}
                      fields={[
                        {key:'eleve_id',label:'Élève',type:'select',options:etabEleves.map(e=>({value:e.id,label:`${e.prenom} ${e.nom}`})),required:true},
                        {key:'annee',label:'Année scolaire',required:true},
                        {key:'classe',label:'Classe / Niveau',required:true},
                        {key:'etablissement_nom',label:'Établissement'},
                        {key:'moyenne',label:'Moyenne annuelle',type:'number'},
                        {key:'statut',label:'Statut',type:'select',options:[{value:'passe',label:'Passé'},{value:'redouble',label:'Redoublé'},{value:'transfert',label:'Transfert'},{value:'en_cours',label:'En cours'}],required:true},
                      ]}
                      onAdd={c=>addItem('cursus',{...c,etablissement_id:currentEtab?.id})}
                      onUpdate={(id,u)=>updateItem('cursus',id,u)}
                      onDelete={id=>deleteItem('cursus',id)}
                      renderRow={c=>{
                        const el=etabEleves.find(e=>e.id===c.eleve_id);
                        return(<><td style={{fontWeight:700}}>{el?.prenom} {el?.nom}</td><td>{c.annee}</td><td>{c.classe}</td><td>{c.etablissement_nom||currentEtab?.nom||'—'}</td><td style={{fontWeight:800,color:(c.moyenne||0)>=10?'var(--text-primary)':'#EF4444'}}>{c.moyenne!=null?c.moyenne.toFixed(2):'—'}</td><td><Bdg status={c.statut} map={{passe:['Passé','#10B981'],redouble:['Redoublé','#F59E0B'],transfert:['Transfert','#3B82F6'],en_cours:['En cours','#8B5CF6']}}/></td></>);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="abs-mobile-nav">
        {TABS.slice(0,5).map(tab=>(
          <button key={tab.id} className={`abs-mobile-btn${view===tab.id?' active':''}`} onClick={()=>setView(tab.id)}>
            {tab.icon}
            <span>{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      {modal?.type==='note'&&<NoteModal eleves={etabEleves} matieres={etabMatieres} onClose={()=>setModal(null)} onSave={note=>{addItem('notes',{...note,etablissement_id:currentEtab?.id});setModal(null);}} annee={currentEtab?.annee_scolaire||'2025-2026'}/>}
      {modal?.type==='presence'&&<PresenceModal eleves={etabEleves} classes={etabClasses} onClose={()=>setModal(null)} onSave={p=>{addItem('presences',{...p,etablissement_id:currentEtab?.id});setModal(null);}}/>}
      {modal?.type==='paiement'&&<PaiementModal eleves={etabEleves} onClose={()=>setModal(null)} onSave={p=>{addItem('paiements',{...p,etablissement_id:currentEtab?.id});setModal(null);}}/>}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SCard({ icon, label, value, color, bg }) {
  return (
    <div className="abs-stat" style={{ '--sc':color }}>
      <div className="abs-stat-icon" style={{ background:bg, color }}>{icon}</div>
      <div className="abs-stat-val">{value}</div>
      <div className="abs-stat-lbl">{label}</div>
    </div>
  );
}

function Bdg({ status, map }) {
  const [label, color] = map[status] || [status, '#6B7280'];
  return <span className="abs-badge" style={{ background:`${color}18`, color, border:`1px solid ${color}28` }}>{label}</span>;
}

function Empty({ icon, msg }) {
  return (
    <div className="abs-empty">
      {icon && <div className="abs-empty-icon">{icon}</div>}
      <div>{msg}</div>
    </div>
  );
}

function CrudView({ title, icon, items, fields, onAdd, onUpdate, onDelete, renderRow }) {
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  function reset() { setForm({}); setEditId(null); }
  function handleSubmit(e) {
    e.preventDefault();
    if (editId) { onUpdate(editId, form); reset(); }
    else { onAdd(form); reset(); }
  }
  function startEdit(item) {
    setEditId(item.id);
    const clean = {};
    fields.forEach(f => { clean[f.key] = item[f.key] ?? (f.type==='number' ? '' : ''); });
    setForm(clean);
  }

  const tableFields = fields.filter(f => !f.hidden && !f.tableHidden);
  const formFields  = fields.filter(f => !f.hidden);

  return (
    <div className="abs-anim">
      <div className="abs-sec-hd">
        <div className="abs-sec-h2">{icon} {title}</div>
        <span style={{ fontSize:'.73rem',color:'var(--text-muted)',fontWeight:600 }}>{items.length} enregistrement(s)</span>
      </div>

      <form onSubmit={handleSubmit} className="abs-card" style={{ marginBottom:18 }}>
        <div className="abs-card-hd">
          <div className="abs-card-title" style={{ fontSize:'.8rem' }}>
            {editId ? <><IcPen s={13}/> Modifier</> : <><IcPlus s={13}/> Ajouter</>}
          </div>
          {editId && <button type="button" className="abs-btn-ghost" style={{ fontSize:'.71rem',padding:'4px 10px' }} onClick={reset}>Annuler</button>}
        </div>
        <div style={{ padding:'15px 18px' }}>
          <div className="abs-field-grid" style={{ marginBottom:13 }}>
            {formFields.map(f => (
              <div key={f.key}>
                <label className="abs-label">{f.label}{f.required&&' *'}</label>
                {f.type==='select' ? (
                  <select className="abs-select" value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})} required={f.required}>
                    <option value="">Choisir...</option>
                    {f.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type==='color' ? (
                  <input type="color" className="abs-input" style={{ height:40,padding:4 }} value={form[f.key]||'#3B82F6'} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>
                ) : (
                  <input className="abs-input" type={f.type||'text'} placeholder={f.label} value={form[f.key]||''} required={f.required}
                    onChange={e=>setForm({...form,[f.key]:f.type==='number'?(e.target.value===''?'':Number(e.target.value)):e.target.value})}/>
                )}
              </div>
            ))}
          </div>
          <button type="submit" className="abs-btn">{editId?'Mettre à jour':<><IcPlus s={13}/> Ajouter</>}</button>
        </div>
      </form>

      <div className="abs-card" style={{ overflowX:'auto' }}>
        <table className="abs-tbl">
          <thead>
            <tr>
              {tableFields.map((f,i) => <th key={i}>{f.label}</th>)}
              <th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                {renderRow(item)}
                <td style={{ textAlign:'right',whiteSpace:'nowrap' }}>
                  <button className="abs-icon-btn edit" onClick={()=>startEdit(item)} title="Modifier"><IcPen s={13}/></button>
                  <button className="abs-icon-btn del"  onClick={()=>onDelete(item.id)} title="Supprimer"><IcTrash s={13}/></button>
                </td>
              </tr>
            ))}
            {items.length===0&&(
              <tr><td colSpan={tableFields.length+1}><Empty icon={null} msg="Aucun enregistrement — utilisez le formulaire ci-dessus pour en ajouter."/></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SchoolPortal({ onCreate, onJoin, onEnter, establishments }) {
  const [view, setView] = useState('select');
  const [joinCode, setJoinCode] = useState('');
  const [joinRole, setJoinRole] = useState('eleve');
  const [ne, setNe] = useState({ nom:'', type:'college', ville:'Dakar', telephone:'', email:'', annee_scolaire:'2025-2026' });

  const backBtn = <button onClick={()=>setView('select')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:6,fontSize:'.79rem',marginBottom:20,fontFamily:'inherit',fontWeight:600,padding:0 }}>← Retour</button>;

  if (view==='create') return (
    <div className="abs-portal">
      <div className="abs-portal-card">
        {backBtn}
        <h3 style={{fontWeight:800,fontSize:'1.1rem',color:'var(--text-primary)',marginBottom:6}}>Créer un établissement</h3>
        <p style={{fontSize:'.81rem',color:'var(--text-muted)',marginBottom:20}}>Vous deviendrez automatiquement administrateur.</p>
        <div style={{display:'flex',flexDirection:'column',gap:11}}>
          <input className="abs-input" placeholder="Nom de l'établissement *" value={ne.nom} onChange={e=>setNe({...ne,nom:e.target.value})}/>
          <select className="abs-select" value={ne.type} onChange={e=>setNe({...ne,type:e.target.value})}>
            {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
          {[['ville','Ville'],['telephone','Téléphone'],['email','Email'],['annee_scolaire','Année scolaire']].map(([key,ph])=>(
            <input key={key} className="abs-input" placeholder={ph} value={ne[key]} onChange={e=>setNe({...ne,[key]:e.target.value})}/>
          ))}
          <button className="abs-btn" style={{marginTop:4}} onClick={()=>{if(!ne.nom)return;onCreate(ne);}}>
            <IcCheck s={14}/> Créer et devenir Admin
          </button>
        </div>
      </div>
    </div>
  );

  if (view==='join') return (
    <div className="abs-portal">
      <div className="abs-portal-card">
        {backBtn}
        <h3 style={{fontWeight:800,fontSize:'1.1rem',color:'var(--text-primary)',marginBottom:6}}>Rejoindre un établissement</h3>
        <p style={{fontSize:'.81rem',color:'var(--text-muted)',marginBottom:20}}>Demandez le code d'accès à votre administrateur.</p>
        <div style={{display:'flex',flexDirection:'column',gap:11}}>
          <input className="abs-input" placeholder="Code d'accès" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} style={{textTransform:'uppercase',letterSpacing:3,fontWeight:800,fontSize:'1.05rem',textAlign:'center'}}/>
          <select className="abs-select" value={joinRole} onChange={e=>setJoinRole(e.target.value)}>
            <option value="eleve">Élève / Étudiant</option>
            <option value="parent">Parent</option>
            <option value="tuteur">Tuteur</option>
            <option value="enseignant">Enseignant</option>
          </select>
          <button className="abs-btn" onClick={()=>{if(!joinCode)return;onJoin(joinCode,joinRole);}}>
            <IcKey s={14}/> Rejoindre
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="abs-portal">
      <div className="abs-portal-card">
        <div style={{textAlign:'center',marginBottom:26}}>
          <div style={{width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,#10B981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'1.4rem',fontWeight:900,margin:'0 auto 12px'}}>Ab</div>
          <h2 style={{fontSize:'1.3rem',fontWeight:900,color:'var(--text-primary)',marginBottom:5}}>AbSchool Campus</h2>
          <p style={{fontSize:'.82rem',color:'var(--text-muted)'}}>Chaque établissement est indépendant. Choisissez ou créez le vôtre.</p>
        </div>

        {establishments.length>0&&(
          <div style={{marginBottom:22}}>
            <div style={{fontSize:'.66rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:10}}>Mes établissements</div>
            {establishments.map(e=>(
              <button key={e.id} className="abs-etab-row" onClick={()=>onEnter(e.id,'admin')}>
                <div className="abs-etab-icon"><IcBuild s={18}/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:'.86rem',color:'var(--text-primary)'}}>{e.nom}</div>
                  <div style={{fontSize:'.71rem',color:'var(--text-muted)'}}>{TYPE_LABELS[e.type]} · {e.ville}</div>
                </div>
                <IcChevR s={13}/>
              </button>
            ))}
          </div>
        )}

        <div style={{display:'flex',gap:11}}>
          <button className="abs-action-card" onClick={()=>setView('create')}>
            <div className="abs-action-card-icon" style={{background:'rgba(16,185,129,.1)',color:'#10B981'}}><IcBuild s={22}/></div>
            <div style={{fontWeight:800,fontSize:'.88rem',color:'var(--text-primary)'}}>Créer</div>
            <div style={{fontSize:'.7rem',color:'var(--text-muted)'}}>Nouvel établissement</div>
          </button>
          <button className="abs-action-card" onClick={()=>setView('join')}>
            <div className="abs-action-card-icon" style={{background:'rgba(139,92,246,.1)',color:'#8B5CF6'}}><IcKey s={22}/></div>
            <div style={{fontWeight:800,fontSize:'.88rem',color:'var(--text-primary)'}}>Rejoindre</div>
            <div style={{fontSize:'.7rem',color:'var(--text-muted)'}}>Avec un code</div>
          </button>
        </div>
      </div>
    </div>
  );
}

function EducationNewsBanner() {
  const [news, setNews]       = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem('abschool_news');
    if (cached) { try { setNews(JSON.parse(cached)); return; } catch {} }
    setNews([
      {id:'n1',title:'Examens du BFEM 2025 : les dates officielles annoncées',source:'Ministère Éducation SN',date:new Date().toISOString(),url:'#',desc:'Le Ministère de l\'Éducation nationale du Sénégal a officialisé les dates des examens du BFEM 2025. Les épreuves écrites se tiendront du 8 au 12 juin 2025. Les candidats sont invités à consulter leurs centres d\'examen sur le portail officiel à partir du 20 mai 2025. Les modalités d\'inscription et les frais de dossier restent inchangés par rapport à l\'année précédente.'},
      {id:'n2',title:"Lancement du programme « École numérique » dans 500 établissements",source:'Gouv.sn',date:new Date().toISOString(),url:'#',desc:'Le gouvernement du Sénégal a lancé le programme ambitieux « École numérique » qui vise à équiper 500 établissements scolaires en tablettes, ordinateurs et connexion internet haut débit d\'ici la rentrée 2026. Un budget de 3,2 milliards FCFA a été alloué. Les enseignants suivront une formation de 3 mois sur les outils numériques pédagogiques.'},
      {id:'n3',title:"UCAD parmi les 100 meilleures universités africaines (QS 2026)",source:'QS Rankings',date:new Date().toISOString(),url:'#',desc:'L\'Université Cheikh Anta Diop de Dakar (UCAD) intègre le top 100 des meilleures universités africaines selon le classement QS 2026. Elle progresse de 12 places grâce à l\'augmentation de ses publications scientifiques et à l\'amélioration du ratio enseignants/étudiants. Le recteur a salué cette avancée et promis des investissements dans la recherche.'},
      {id:'n4',title:"Gratuité scolaire : 2,5 milliards FCFA débloqués pour 2025-2026",source:'Budget National SN',date:new Date().toISOString(),url:'#',desc:'L\'Assemblée nationale a voté un budget supplémentaire de 2,5 milliards FCFA pour la gratuité de l\'enseignement primaire et secondaire au Sénégal pour l\'année scolaire 2025-2026. Cette enveloppe couvrira les fournitures scolaires, les manuels et les cantines dans les zones rurales prioritaires.'},
    ]);
  }, []);

  if (!news.length) return null;
  const visible = expanded ? news : news.slice(0,2);

  return (
    <>
      <div className="abs-card" style={{ marginTop:18,borderLeft:'3px solid #10B981' }}>
        <div className="abs-card-hd">
          <div className="abs-card-title"><IcNews s={14}/> Actualités Éducation · Sénégal
            <span className="abs-badge" style={{background:'rgba(16,185,129,.1)',color:'#10B981',fontSize:'.61rem'}}>Live</span>
          </div>
          <button onClick={()=>setExpanded(!expanded)} style={{background:'none',border:'none',color:'#10B981',cursor:'pointer',fontSize:'.73rem',fontWeight:700,display:'flex',alignItems:'center',gap:3,fontFamily:'inherit'}}>
            {expanded?'Réduire':'Voir tout'} <IcChevD s={11}/>
          </button>
        </div>
        <div className="abs-card-bd" style={{display:'flex',flexDirection:'column',gap:5}}>
          {visible.map(n=>(
            <button key={n.id} onClick={()=>setSelected(n)} className="abs-news-item" style={{background:'none',border:'none',width:'100%',textAlign:'left',cursor:'pointer'}}>
              <span style={{fontSize:'.7rem',color:'var(--text-muted)',minWidth:52,fontWeight:600}}>{new Date(n.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
              <span style={{fontSize:'.81rem',color:'var(--text-primary)',fontWeight:600,flex:1,lineHeight:1.35}}>{n.title}</span>
              <span style={{fontSize:'.67rem',color:'#10B981',fontWeight:700,flexShrink:0}}>{n.source}</span>
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <Modal onClose={()=>setSelected(null)} title={<span style={{display:'flex',alignItems:'center',gap:6}}><IcNews s={16}/> Actualité</span>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div>
              <div style={{fontSize:'.68rem',color:'#10B981',fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>{selected.source}</div>
              <div style={{fontSize:'1.05rem',fontWeight:800,color:'var(--text-primary)',lineHeight:1.35,marginTop:4}}>{selected.title}</div>
              <div style={{fontSize:'.72rem',color:'var(--text-muted)',marginTop:4}}>{new Date(selected.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
            </div>
            <div style={{fontSize:'.9rem',color:'var(--text-secondary)',lineHeight:1.6}}>{selected.desc || selected.title}</div>
            {selected.url && selected.url!=='#' && (
              <a href={selected.url} target="_blank" rel="noreferrer" style={{color:'#10B981',fontWeight:700,fontSize:'.82rem',display:'inline-flex',alignItems:'center',gap:4}}>
                Lire l'article original ↗
              </a>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

function NoteModal({ eleves, matieres, onClose, onSave, annee }) {
  const [form, setForm] = useState({eleve_id:'',matiere_id:'',type:'devoir',note:'',coeff:1,trimestre:1});
  return (
    <Modal onClose={onClose} title="Ajouter une note">
      <div style={{display:'flex',flexDirection:'column',gap:11}}>
        <div><label className="abs-label">Élève</label>
          <select className="abs-select" value={form.eleve_id} onChange={e=>setForm({...form,eleve_id:e.target.value})}>
            <option value="">Choisir...</option>
            {eleves.map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
          </select>
        </div>
        <div><label className="abs-label">Matière</label>
          <select className="abs-select" value={form.matiere_id} onChange={e=>setForm({...form,matiere_id:e.target.value})}>
            <option value="">Choisir...</option>
            {matieres.map(m=><option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
          <div><label className="abs-label">Type</label>
            <select className="abs-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              {['devoir','interro','participation','examen','rattrapage'].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="abs-label">Trimestre</label>
            <select className="abs-select" value={form.trimestre} onChange={e=>setForm({...form,trimestre:Number(e.target.value)})}>
              {TRIMESTRES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
          <div><label className="abs-label">Note /20</label>
            <input className="abs-input" type="number" step=".5" min="0" max="20" placeholder="Ex: 14.5" value={form.note} onChange={e=>setForm({...form,note:Number(e.target.value)})}/>
          </div>
          <div><label className="abs-label">Coefficient</label>
            <input className="abs-input" type="number" min="1" value={form.coeff} onChange={e=>setForm({...form,coeff:Number(e.target.value)})}/>
          </div>
        </div>
        <button className="abs-btn" onClick={()=>{if(!form.eleve_id||!form.matiere_id||form.note==='')return;onSave({...form,annee,date:new Date().toISOString()});}}>
          <IcCheck s={14}/> Enregistrer
        </button>
      </div>
    </Modal>
  );
}

function PresenceModal({ eleves, classes, onClose, onSave }) {
  const today=new Date().toISOString().slice(0,10);
  const [form,setForm]=useState({eleve_id:'',classe_id:'',date:today,statut:'present',motif:''});
  const clsEleves=eleves.filter(e=>!form.classe_id||e.classe_id===form.classe_id);
  return (
    <Modal onClose={onClose} title="Marquer une présence">
      <div style={{display:'flex',flexDirection:'column',gap:11}}>
        <div><label className="abs-label">Classe</label>
          <select className="abs-select" value={form.classe_id} onChange={e=>setForm({...form,classe_id:e.target.value,eleve_id:''})}>
            <option value="">Toutes les classes</option>
            {classes.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div><label className="abs-label">Élève</label>
          <select className="abs-select" value={form.eleve_id} onChange={e=>setForm({...form,eleve_id:e.target.value})}>
            <option value="">Choisir...</option>
            {clsEleves.map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
          </select>
        </div>
        <div><label className="abs-label">Date</label>
          <input className="abs-input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </div>
        <div>
          <label className="abs-label">Statut</label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7}}>
            {[['present','Présent','#10B981'],['absent','Absent','#EF4444'],['retard','Retard','#F59E0B'],['justifie','Justifié','#3B82F6']].map(([val,lbl,col])=>(
              <button key={val} type="button" onClick={()=>setForm({...form,statut:val})}
                style={{padding:'7px 4px',borderRadius:8,border:`1.5px solid ${form.statut===val?col:'var(--border)'}`,background:form.statut===val?`${col}15`:'transparent',color:form.statut===val?col:'var(--text-muted)',fontWeight:700,fontSize:'.7rem',cursor:'pointer',fontFamily:'inherit',transition:'all .14s'}}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        {form.statut!=='present'&&(
          <div><label className="abs-label">Motif (optionnel)</label>
            <input className="abs-input" placeholder="Motif de l'absence / retard" value={form.motif} onChange={e=>setForm({...form,motif:e.target.value})}/>
          </div>
        )}
        <button className="abs-btn" onClick={()=>{if(!form.eleve_id||!form.date)return;onSave({...form});}}>
          <IcCheck s={14}/> Enregistrer
        </button>
      </div>
    </Modal>
  );
}

function PaiementModal({ eleves, onClose, onSave }) {
  const today=new Date().toISOString().slice(0,10);
  const [form,setForm]=useState({eleve_id:'',montant:'',type:'scolarite',methode:'especes',date_paiement:today,statut:'paye'});
  return (
    <Modal onClose={onClose} title="Enregistrer un paiement">
      <div style={{display:'flex',flexDirection:'column',gap:11}}>
        <div><label className="abs-label">Élève</label>
          <select className="abs-select" value={form.eleve_id} onChange={e=>setForm({...form,eleve_id:e.target.value})}>
            <option value="">Choisir un élève...</option>
            {eleves.map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom} ({e.matricule})</option>)}
          </select>
        </div>
        <div><label className="abs-label">Montant (FCFA)</label>
          <input className="abs-input" type="number" placeholder="Ex: 75000" value={form.montant} onChange={e=>setForm({...form,montant:Number(e.target.value)})}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
          <div><label className="abs-label">Type</label>
            <select className="abs-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              {['scolarite','inscription','cantine','transport','examen','autre'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div><label className="abs-label">Méthode</label>
            <select className="abs-select" value={form.methode} onChange={e=>setForm({...form,methode:e.target.value})}>
              {['especes','wave','orange_money','free_money','virement','cheque'].map(m=><option key={m} value={m}>{m.replace('_',' ')}</option>)}
            </select>
          </div>
        </div>
        <div><label className="abs-label">Date de paiement</label>
          <input className="abs-input" type="date" value={form.date_paiement} onChange={e=>setForm({...form,date_paiement:e.target.value})}/>
        </div>
        <button className="abs-btn" onClick={()=>{if(!form.eleve_id||!form.montant)return;onSave({...form});}}>
          <IcCheck s={14}/> Enregistrer le paiement
        </button>
      </div>
    </Modal>
  );
}

function Modal({ children, title, onClose }) {
  return (
    <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:18,padding:'20px 22px',maxWidth:460,width:'100%',maxHeight:'90vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h3 style={{fontSize:'.92rem',fontWeight:800,color:'var(--text-primary)',margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:7,transition:'background .14s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-primary)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <IcX s={15}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Av({ prenom='', nom='', sexe, size=34, color }) {
  const initials = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || '?';
  const col = color || (sexe==='F' ? '#EC4899' : '#3B82F6');
  return (
    <div className="abs-av" style={{ width:size, height:size, background:`${col}20`, color:col, fontSize:size*.32, flexShrink:0 }}>
      {initials}
    </div>
  );
}

// ─── AttendanceRing ───────────────────────────────────────────────────────────
function AttendanceRing({ pct, color='#10B981', size=60 }) {
  const r = (size/2)*0.75;
  const circ = 2*Math.PI*r;
  const dash = (pct/100)*circ;
  return (
    <div className="abs-ring" style={{ width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-primary)" strokeWidth={size*0.11}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.11}
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round" style={{transition:'stroke-dasharray .6s ease'}}/>
      </svg>
      <span className="abs-ring-text" style={{ fontSize:size*.22 }}>{pct}%</span>
    </div>
  );
}

// ─── SchoolBanner ─────────────────────────────────────────────────────────────
function SchoolBanner({ etab, stats }) {
  if (!etab) return null;
  return (
    <div className="abs-banner">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
        <div style={{minWidth:0}}>
          <div className="abs-banner-sub">
            <span className="abs-banner-badge">
              {TYPE_LABELS[etab.type] || etab.type}
            </span>
            <span style={{display:'flex',alignItems:'center',gap:4}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#86efac',display:'inline-block'}}/>
              Année {etab.annee_scolaire}
            </span>
            {etab.ville && <span>· {etab.ville}</span>}
          </div>
          <div className="abs-banner-title">{etab.nom}</div>
          {etab.directeur_nom && (
            <div style={{fontSize:'.74rem',color:'rgba(255,255,255,.5)',marginTop:4}}>Dir. {etab.directeur_nom}</div>
          )}
        </div>
        <div className="abs-banner-stats">
          {[
            [stats.nbEleves,'Élèves'],
            [stats.nbClasses,'Classes'],
            [stats.nbEnseignants,'Enseignants'],
            [stats.totalAbsent,'Absences'],
          ].map(([n,l])=>(
            <div key={l} className="abs-banner-stat">
              <span className="abs-banner-stat-n">{n??'—'}</span>
              <span className="abs-banner-stat-l">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BulletinsView ────────────────────────────────────────────────────────────
function BulletinsView({ eleves, notes, matieres, classes, etablissement }) {
  const [trim, setTrim] = useState(1);

  function gradeColor(n) {
    if (n === null) return 'var(--text-muted)';
    if (n >= 16) return '#F0B429';
    if (n >= 14) return '#10B981';
    if (n >= 10) return '#10B981';
    if (n >= 8)  return '#F59E0B';
    return '#EF4444';
  }
  function mention(n) {
    if (n === null) return null;
    if (n >= 16) return { label:'Très Bien', color:'#F0B429' };
    if (n >= 14) return { label:'Bien', color:'#10B981' };
    if (n >= 12) return { label:'Assez Bien', color:'#10B981' };
    if (n >= 10) return { label:'Passable', color:'#3B82F6' };
    return { label:'Insuffisant', color:'#EF4444' };
  }

  return (
    <>
      {/* Trimestre selector */}
      <div style={{display:'flex',gap:8,marginBottom:18}}>
        {TRIMESTRES.map(t=>(
          <button key={t.id} onClick={()=>setTrim(t.id)}
            style={{padding:'6px 16px',borderRadius:100,border:`1.5px solid ${trim===t.id?'#10B981':'var(--border)'}`,background:trim===t.id?'rgba(16,185,129,.1)':'transparent',color:trim===t.id?'#10B981':'var(--text-muted)',fontWeight:700,fontSize:'.78rem',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
        {eleves.map((e,rank)=>{
          const cls=classes.find(c=>c.id===e.classe_id);
          const ns=notes.filter(n=>n.eleve_id===e.id&&n.trimestre===trim);
          const moy=calcMoyenneEleve(ns);
          const mc=mention(moy);
          const col=gradeColor(moy);
          const stripeColor=moy===null?'#94a3b8':moy>=14?'#10B981':moy>=10?'#3B82F6':moy>=8?'#F59E0B':'#EF4444';

          return (
            <div key={e.id} className="abs-bulletin-pro">
              <div className="abs-bulletin-stripe" style={{background:`linear-gradient(90deg,${stripeColor},${stripeColor}88)`}}/>
              <div className="abs-bulletin-hd">
                <Av nom={e.nom} prenom={e.prenom} sexe={e.sexe} size={38}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:'.88rem',color:'var(--text-primary)'}}>{e.prenom} {e.nom}</div>
                  <div style={{fontSize:'.69rem',color:'var(--text-muted)',marginTop:1}}>{cls?.nom||'—'} · {e.matricule}</div>
                  {mc && <span style={{fontSize:'.65rem',fontWeight:700,color:mc.color,marginTop:2,display:'block'}}>{mc.label}</span>}
                </div>
                <div className="abs-bulletin-avg" style={{color:col}}>{moy!==null?moy.toFixed(2):'—'}</div>
              </div>
              <div className="abs-bulletin-body">
                {ns.length===0 && <span style={{fontSize:'.77rem',color:'var(--text-muted)'}}>Aucune note ce trimestre</span>}
                {ns.map(n=>{
                  const mat=matieres.find(m=>m.id===n.matiere_id);
                  const nc=gradeColor(n.note);
                  const barPct=Math.round((n.note/20)*100);
                  return(
                    <div key={n.id} className="abs-grade-row">
                      <span style={{width:8,height:8,borderRadius:'50%',background:mat?.couleur||'#ccc',display:'inline-block',flexShrink:0}}/>
                      <span className="abs-grade-name">{mat?.nom||'—'}</span>
                      <div className="abs-grade-bar-wrap"><div className="abs-grade-bar-fill" style={{width:`${barPct}%`,background:nc}}/></div>
                      <span className="abs-grade-note" style={{color:nc}}>{n.note}</span>
                    </div>
                  );
                })}
              </div>
              <div className="abs-bulletin-ft">
                <span style={{fontSize:'.7rem',color:'var(--text-muted)',fontWeight:600}}>T{trim} — {ns.length} évaluation(s)</span>
                <Bdg status={moy!==null&&moy>=10?'admis':moy!==null?'surveiller':'nc'} map={{admis:['Admis','#10B981'],surveiller:['Insuffisant','#EF4444'],nc:['Sans notes','#94a3b8']}}/>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
