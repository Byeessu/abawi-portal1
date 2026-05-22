import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadFile } from '../../lib/uploadFile';
import ToolInfoPanel from '../../components/ToolInfoPanel';
import { supabase } from '../../lib/supabase';
import ToolHero from '../../components/ToolHero';

// ─── Constants ────────────────────────────────────────────────────────────────
const SECTEURS = ['Tous', 'Tech & Digital', 'Finance & Banque', 'Marketing & Com.', 'RH & Formation', 'Commerce & Vente', 'Juridique & Conseil', 'Santé & Médical', 'BTP & Architecture', 'Éducation', 'Agriculture', 'Média & Créatif', 'Tourisme & Hôtellerie', 'Autres'];
const TYPES    = ['Tous', 'CDI', 'CDD', 'Freelance', 'Stage', 'Alternance', 'Temps partiel', 'Mission'];
const VILLES   = ['Toutes', 'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 'Touba', 'Mbour', 'Rufisque', 'Diourbel', 'Tambacounda'];
const EXPS     = ['Tous niveaux', 'Débutant (0-1 an)', 'Junior (1-3 ans)', 'Confirmé (3-5 ans)', 'Senior (5+ ans)', 'Expert (10+ ans)'];
const NET_TYPES = ['Tous', 'Startup', 'Investisseur', 'Expert RH', 'Entrepreneur', 'Freelance', 'Mentor'];
const AVANTAGES_OPT = ['Assurance santé', 'Télétravail', 'Formation continue', 'Prime annuelle', 'Mutuelle', 'Transport', 'Restaurant', 'Equity/BSPCE', 'Téléphone', 'Ordinateur', '13e mois', 'Crèche', 'Gym'];
const EVENT_TYPES = ['Job Fair', 'Meetup', 'Hackathon', 'Conférence', 'Atelier', 'Networking'];
const SORT_OPTIONS = ['Récentes', 'Salaire ↑', 'Salaire ↓', 'Expiration proche'];

const OFFRES_KEY    = 'rm_offres_v2';
const CANDS_KEY     = 'rm_cands_v2';
const NET_KEY       = 'rm_net_v2';
const EVENTS_KEY    = 'rm_events_v1';
const ALERTES_KEY   = 'rm_alertes_v1';
const SAVED_KEY     = 'rm_saved_v1';
const PROFIL_C_KEY  = 'rm_profil_candidat_v1';

function load(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function loadOne(key) { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } }
function save(key, d) { try { localStorage.setItem(key, JSON.stringify(d)); } catch { /* ignore */ } }
function newId(p = 'x') { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }
function dateFR(iso) { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }
function daysLeft(exp) { return exp ? Math.max(0, Math.ceil((new Date(exp) - Date.now()) / 86400000)) : 999; }
function getOffreUrl(offre) {
  const p = new URLSearchParams({ n: offre.titre, e: offre.entreprise || '', v: offre.ville, t: offre.type_contrat || '' });
  if (offre.logo_url?.startsWith('https://')) p.set('img', offre.logo_url);
  return `${window.location.origin}/outils/recrute-moi-sn?offre=${offre.id}&${p}`;
}
function shareOffre(offre, platform) {
  const url = encodeURIComponent(getOffreUrl(offre));
  const text = encodeURIComponent(`🚀 ${offre.titre} chez ${offre.entreprise || 'une entreprise'} — ${offre.type_contrat} à ${offre.ville}\nPostulez via Recrute-Moi SN ABAWI`);
  const maps = {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
  };
  if (maps[platform]) window.open(maps[platform], '_blank', 'width=600,height=400');
}
function copyLink(url) {
  navigator.clipboard?.writeText(url).then(() => alert('Lien copié !')).catch(() => prompt('Copiez :', url));
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
@keyframes rmFadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.rm-anim { animation: rmFadeIn 0.3s ease-out; }
.rm-card { background:color-mix(in srgb,var(--bg-card) 92%,transparent); border:1px solid var(--border); border-radius:16px; transition:transform 0.3s cubic-bezier(0.22,1,0.36,1),box-shadow 0.3s ease,border-color 0.2s ease; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
.rm-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,0.16),inset 0 1px 0 rgba(255,255,255,0.06); border-color:rgba(37,99,235,0.2); }
.rm-btn-blue { background:linear-gradient(135deg,#2563EB,#1D4ED8); color:#fff; border:none; border-radius:10px; padding:10px 18px; font-weight:700; cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.rm-btn-blue:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(37,99,235,0.35); }
.rm-btn-amber { background:linear-gradient(135deg,#F59E0B,#D97706); color:#0a0a0a; border:none; border-radius:10px; padding:10px 18px; font-weight:800; cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.rm-btn-amber:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(245,158,11,0.35); }
.rm-btn-ghost { background:transparent; border:1px solid var(--border); border-radius:10px; padding:8px 14px; color:var(--text-secondary); cursor:pointer; font-size:0.82rem; font-weight:600; transition:all 0.2s; }
.rm-btn-ghost:hover { border-color:#2563EB; color:#2563EB; }
.rm-btn-red { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:10px; padding:8px 14px; color:#EF4444; cursor:pointer; font-size:0.82rem; font-weight:600; transition:all 0.2s; }
.rm-input { background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary); border-radius:10px; padding:10px 14px; font-size:0.88rem; outline:none; font-family:inherit; width:100%; box-sizing:border-box; }
.rm-input:focus { border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,0.12); }
.rm-select { background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary); border-radius:10px; padding:8px 12px; font-size:0.82rem; outline:none; cursor:pointer; }
.rm-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:100px; font-size:0.72rem; font-weight:700; border:1px solid transparent; }
.rm-badge-blue  { background:rgba(37,99,235,0.12);  border-color:rgba(37,99,235,0.28);  color:#2563EB; }
.rm-badge-green { background:rgba(16,185,129,0.12); border-color:rgba(16,185,129,0.28); color:#10B981; }
.rm-badge-gray  { background:var(--bg-secondary,rgba(0,0,0,0.05)); border-color:var(--border); color:var(--text-secondary); }
.rm-badge-amber { background:rgba(245,158,11,0.12); border-color:rgba(245,158,11,0.28); color:#F59E0B; }
.rm-badge-red   { background:rgba(239,68,68,0.12);  border-color:rgba(239,68,68,0.25);  color:#EF4444; }
.rm-skill-tag { padding:2px 8px; border-radius:6px; background:var(--bg-secondary,rgba(0,0,0,0.05)); border:1px solid var(--border); font-size:0.72rem; color:var(--text-secondary); font-weight:600; }
/* Light mode — couleurs plus foncées pour assurer le contraste WCAG AA */
[data-mode="light"] .rm-badge-blue,  html.light .rm-badge-blue  { background:rgba(37,99,235,0.09);  color:#1d4ed8; }
[data-mode="light"] .rm-badge-green, html.light .rm-badge-green { background:rgba(16,185,129,0.1);  color:#047857; }
[data-mode="light"] .rm-badge-gray,  html.light .rm-badge-gray  { background:#f3f4f6; border-color:#d1d5db; color:#374151; }
[data-mode="light"] .rm-badge-amber, html.light .rm-badge-amber { background:rgba(245,158,11,0.1);  color:#92400e; }
[data-mode="light"] .rm-badge-red,   html.light .rm-badge-red   { background:rgba(239,68,68,0.09);  color:#b91c1c; }
[data-mode="light"] .rm-skill-tag,   html.light .rm-skill-tag   { background:#f3f4f6; border-color:#d1d5db; color:#374151; }
[data-mode="light"] .rm-tab-active,  html.light .rm-tab-active  { background:rgba(37,99,235,0.1); color:#1d4ed8; }
.rm-tab { padding:8px 16px; border-radius:100px; border:2px solid transparent; cursor:pointer; font-weight:500; font-size:0.82rem; transition:all 0.2s; white-space:nowrap; }
.rm-tab-active { border-color:#2563EB; background:rgba(37,99,235,0.1); color:#2563EB; font-weight:700; }
.rm-tab-inactive { border-color:var(--border); background:transparent; color:var(--text-secondary); }
.rm-event-card { background:var(--bg-card); border:1px solid var(--border); border-radius:14px; padding:18px 20px; transition:all 0.2s; }
.rm-event-card:hover { box-shadow:0 6px 20px rgba(0,0,0,0.10); }
@media (max-width:640px) {
  .rm-grid-2 { grid-template-columns:1fr !important; }
  .rm-grid-3 { grid-template-columns:1fr 1fr !important; }
  .rm-offre-meta { flex-direction:column !important; gap:4px !important; }
}
`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RecruteMoiSN() {
  const { membre, isAdmin } = useAuth();
  const isLoggedIn = !!membre?.id;

  const [offres, setOffres]           = useState([]);
  const [candidatures, setCands]      = useState([]);
  const [networking, setNetworking]   = useState([]);
  const [events, setEvents]           = useState([]);
  const [alertes, setAlertes]         = useState(() => load(ALERTES_KEY));
  const [savedIds, setSavedIds]       = useState(() => load(SAVED_KEY));
  const [candidatProfil, setCandidatProfil] = useState(() => loadOne(PROFIL_C_KEY));
  const [dbLoading, setDbLoading]     = useState(true);
  const [view, setView]               = useState('explorer');
  const [selectedOffre, setSelectedOffre] = useState(null);
  const [search, setSearch]           = useState('');
  const [fSecteur, setFSecteur]       = useState('Tous');
  const [fType, setFType]             = useState('Tous');
  const [fVille, setFVille]           = useState('Toutes');
  const [fExp, setFExp]               = useState('Tous niveaux');
  const [fNetType, setFNetType]       = useState('Tous');
  const [sortBy, setSortBy]           = useState('Récentes');
  const [notif, setNotif]             = useState(null);
  const [editingOffre, setEditingOffre] = useState(null);

  useEffect(() => { save(ALERTES_KEY, alertes); }, [alertes]);
  useEffect(() => { save(SAVED_KEY, savedIds); }, [savedIds]);
  useEffect(() => { save(PROFIL_C_KEY, candidatProfil); }, [candidatProfil]);
  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(() => setNotif(null), 3500);
    return () => clearTimeout(t);
  }, [notif]);

  // ── Supabase: chargement initial + temps réel ──
  useEffect(() => {
    async function loadDb() {
      setDbLoading(true);
      const [{ data: off }, { data: cands }, { data: net }, { data: evts }, { data: legacy }] = await Promise.all([
        supabase.from('rm_offres').select('*').order('created_at', { ascending: false }),
        supabase.from('rm_candidatures').select('*').order('created_at', { ascending: false }),
        supabase.from('rm_networking').select('*').eq('statut', 'actif').order('created_at', { ascending: false }),
        supabase.from('rm_events').select('*').eq('statut', 'actif').order('created_at', { ascending: false }),
        supabase.from('job_offers').select('*').eq('active', true).order('created_at', { ascending: false }).limit(200),
      ]);
      const mappedLegacy = (legacy || []).map(j => ({
        id: j.id,
        titre: j.title,
        entreprise: j.company,
        ville: j.location,
        type_contrat: j.contract_type,
        salaire: j.salary,
        description: j.description || j.summary || '',
        competences: [...new Set([...(j.requirements || []), ...(j.tags || [])])],
        secteur: (j.tags && j.tags[0]) || 'Autres',
        statut: 'actif',
        date_pub: j.created_at,
        date_exp: null,
        experience: null,
        teletravail: false,
        urgent: false,
        avantages: [],
        logo_url: null,
        contact_whatsapp: null,
        external_url: j.external_url || null,
        _source: 'job_offers',
        created_at: j.created_at,
      }));
      const allOffres = [...(off || []), ...mappedLegacy].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      if (allOffres.length) setOffres(allOffres);
      if (cands) setCands(cands);
      if (net) setNetworking(net);
      if (evts) setEvents(evts);
      setDbLoading(false);
    }
    loadDb();
    const ch = supabase.channel('rm-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rm_offres' }, ({ new: r }) => setOffres(p => [r, ...p]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rm_offres' }, ({ new: r }) => setOffres(p => p.map(o => o.id === r.id ? r : o)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rm_offres' }, ({ old: r }) => setOffres(p => p.filter(o => o.id !== r.id)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rm_candidatures' }, ({ new: r }) => setCands(p => [r, ...p]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rm_networking' }, ({ new: r }) => setNetworking(p => [r, ...p]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rm_events' }, ({ new: r }) => setEvents(p => [r, ...p]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Deep link ?offre=ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('offre');
    if (id) {
      const target = offres.find(o => o.id === id);
      if (target) { requestAnimationFrame(() => { setSelectedOffre(target); setView('detail'); }); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filtrage + tri ──
  let filtered = offres
    .filter(o => o.statut === 'actif')
    .filter(o => fSecteur === 'Tous' || o.secteur === fSecteur)
    .filter(o => fType === 'Tous' || o.type_contrat === fType)
    .filter(o => fVille === 'Toutes' || o.ville === fVille)
    .filter(o => fExp === 'Tous niveaux' || o.experience === fExp)
    .filter(o => !search || o.titre.toLowerCase().includes(search.toLowerCase()) || (o.entreprise || '').toLowerCase().includes(search.toLowerCase()) || (o.competences || []).some(c => c.toLowerCase().includes(search.toLowerCase())));

  if (sortBy === 'Expiration proche') filtered = [...filtered].sort((a, b) => daysLeft(a.date_exp) - daysLeft(b.date_exp));
  else if (sortBy === 'Salaire ↑') filtered = [...filtered].sort((a, b) => parseSalaire(a.salaire) - parseSalaire(b.salaire));
  else if (sortBy === 'Salaire ↓') filtered = [...filtered].sort((a, b) => parseSalaire(b.salaire) - parseSalaire(a.salaire));

  const filteredNet = networking.filter(p => fNetType === 'Tous' || p.type === fNetType);
  const savedOffres = offres.filter(o => savedIds.includes(o.id));

  // ── Match score ── (keywords overlap between offre.competences & profil.competences)
  function matchScore(offre) {
    if (!candidatProfil?.competences?.length) return null;
    const profilSet = new Set((candidatProfil.competences || '').toLowerCase().split(',').map(c => c.trim()));
    const offreSet = (offre.competences || []).map(c => c.toLowerCase());
    const matched = offreSet.filter(c => [...profilSet].some(p => c.includes(p) || p.includes(c)));
    return Math.round((matched.length / Math.max(offreSet.length, 1)) * 100);
  }

  function showNotif(msg, type = 'success') { setNotif({ type, msg }); }

  async function publish(data) {
    const row = { ...data, statut: 'actif', views: 0, membre_id: membre?.id || null };
    const { data: created, error } = await supabase.from('rm_offres').insert(row).select().single();
    if (error) { showNotif('❌ ' + error.message, 'error'); return; }
    setOffres(p => [created, ...p]);
    setEditingOffre(null);
    setView('explorer');
    showNotif(`Offre « ${data.titre} » publiée !`);
  }

  async function modifierOffre(data) {
    if (!editingOffre) return;
    const { data: updated, error } = await supabase.from('rm_offres').update(data).eq('id', editingOffre.id).select().single();
    if (error) { showNotif('❌ ' + error.message, 'error'); return; }
    setOffres(p => p.map(o => o.id === editingOffre.id ? updated : o));
    setEditingOffre(null);
    setView('explorer');
    showNotif(`Offre « ${data.titre} » mise à jour !`);
  }

  async function adminDeleteOffre(id) {
    if (!confirm('Supprimer définitivement cette offre ?')) return;
    await supabase.from('rm_offres').delete().eq('id', id);
    setOffres(p => p.filter(o => o.id !== id));
    showNotif('Offre supprimée.', 'error');
  }

  async function publishNet(data) {
    const { data: created, error } = await supabase.from('rm_networking').insert({ ...data, statut: 'actif', membre_id: membre?.id || null }).select().single();
    if (error) { showNotif('❌ ' + error.message, 'error'); return; }
    setNetworking(p => [created, ...p]);
    setView('networking');
    showNotif('Profil publié dans le réseau !');
  }

  async function publishEvent(data) {
    const { data: created, error } = await supabase.from('rm_events').insert({ ...data, statut: 'actif', membre_id: membre?.id || null }).select().single();
    if (error) { showNotif('❌ ' + error.message, 'error'); return; }
    setEvents(p => [created, ...p]);
    setView('events');
    showNotif('Événement publié !');
  }

  function registerEvent(eventId) {
    if (!isLoggedIn) { showNotif('Connectez-vous pour vous inscrire.', 'info'); return; }
    setEvents(events.map(e => e.id === eventId
      ? { ...e, inscrits: e.inscrits?.includes(membre.id) ? e.inscrits.filter(i => i !== membre.id) : [...(e.inscrits || []), membre.id] }
      : e));
  }

  async function apply(data) {
    const { data: created, error } = await supabase.from('rm_candidatures').insert({ ...data, statut: 'Envoyée', membre_id: membre?.id || null }).select().single();
    if (error) { showNotif('❌ ' + error.message, 'error'); return; }
    setCands(p => [created, ...p]);
    setView('mes-candidatures');
    showNotif('Candidature envoyée avec succès !');
  }

  function deleteOffre(id) {
    if (!confirm('Supprimer cette offre ?')) return;
    setOffres(offres.filter(o => o.id !== id));
    showNotif('Offre supprimée.');
  }

  function toggleSaved(id) {
    setSavedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function addAlerte(alerte) {
    const newAlerte = { id: newId('al'), ...alerte, date: new Date().toISOString() };
    setAlertes([newAlerte, ...alertes]);
    showNotif('Alerte emploi créée !');
    // Persister dans Supabase pour que le bot puisse diffuser par email
    if (alerte.email) {
      try {
        await supabase.from('rm_alertes').insert({
          email: alerte.email,
          prenom: membre?.prenom || '',
          membre_id: membre?.id || null,
          label: alerte.label,
          secteur: alerte.secteur || 'Tous',
          type_contrat: alerte.type || 'Tous',
          ville: alerte.ville || 'Toutes',
          keywords: alerte.keywords || '',
          actif: true,
        });
      } catch (e) {
        console.warn('[RecruteMoiSN] rm_alertes insert:', e.message);
      }
    }
  }

  const TABS = [
    { id: 'explorer',         label: '🔍 Explorer' },
    { id: 'networking',       label: '🤝 Networking' },
    { id: 'events',           label: '📅 Événements' },
    { id: 'sauvegardes',      label: `🔖 Sauvegardes${savedIds.length > 0 ? ` (${savedIds.length})` : ''}` },
    { id: 'alertes',          label: `🔔 Alertes${alertes.length > 0 ? ` (${alertes.length})` : ''}` },
    { id: 'publier',          label: '➕ Publier' },
    { id: 'profil-candidat',  label: `👤 Mon profil${candidatProfil ? ' ✓' : ''}` },
    { id: 'mes-candidatures', label: '📋 Candidatures' },
    { id: 'mes-offres',       label: '📂 Mes offres' },
    ...(isAdmin ? [{ id: 'admin-offres', label: '🛠️ Gérer offres' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <style>{CSS}</style>

      <ToolHero
        icon="💼"
        badge="Emploi · Networking · Événements"
        title="Recrute-Moi"
        titleAccent="SN"
        subtitle="La plateforme emploi sénégalaise — candidats, recruteurs, startups, investisseurs et experts RH en un seul écosystème"
        accentColor="#2563EB"
        accentFrom="#0f1e3a"
        accentTo="#1d4ed8"
        stats={[['🔍', `${offres.filter(o => o.statut === 'actif').length} offres actives`], ['🎯', 'Match IA'], ['🤝', 'Networking'], ['📅', 'Événements']]}
      >
        <div className="tool-tabs" style={{ marginTop: 8 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              className={`tool-tab ${view === t.id || (view === 'detail' && t.id === 'explorer') || (view === 'postuler' && t.id === 'explorer') || (view === 'publier-profil' && t.id === 'networking') || (view === 'create-event' && t.id === 'events') ? 'active' : ''}`}
              style={{ '--accent': '#2563EB' }}>
              {t.label}
            </button>
          ))}
        </div>
      </ToolHero>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px 80px' }}>
        <ToolInfoPanel
          toolName="Recrute-Moi SN"
          icon="💼"
          description="La plateforme emploi sénégalaise — candidats, recruteurs, startups, investisseurs et experts RH en un seul écosystème"
          benefits={[
            'Parcourez les offres par secteur, contrat, ville et expérience avec tri intelligent',
            'Créez votre profil candidat et obtenez un score de match automatique avec les offres',
            'Publiez vos offres et recevez des candidatures avec suivi en temps réel',
            'Rejoignez l\'espace Networking pour vous connecter avec startups, investisseurs, experts RH',
            'Participez aux événements : job fairs, meetups, hackathons — inscription en un clic',
            'Configurez des alertes emploi pour être notifié des nouvelles offres qui vous correspondent',
          ]}
          howToUse={[
            'Créez votre profil candidat pour un score de correspondance automatique avec les offres',
            'Explorer : filtrez et triez les offres, sauvegardez les intéressantes',
            'Postuler : remplissez le formulaire et uploadez votre CV en un clic',
            'Networking : présentez votre projet, expertise ou cherchez des co-fondateurs',
            'Événements : inscrivez-vous aux job fairs et meetups de l\'écosystème',
          ]}
          tips={[
            'Complétez votre profil candidat pour voir votre score de match sur chaque offre',
            'Activez une alerte emploi pour ne jamais rater une opportunité dans votre secteur',
            'Le networking est idéal pour trouver des co-fondateurs ou des investisseurs locaux',
          ]}
        />

        {notif && (
          <div className={`tool-toast tool-toast--${notif.type} tp-fade-up`}>{notif.msg}</div>
        )}

        {/* ── SÉCURITÉ ── */}
        <div style={{ padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg,rgba(37,99,235,0.08),rgba(239,68,68,0.05))', border: '1px solid rgba(37,99,235,0.25)', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#2563EB', marginBottom: 4 }}>ABAWI sécurise vos opportunités</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Nous vérifions les offres et les profils. <strong style={{ color: '#EF4444' }}>Ne jamais payer pour un entretien ni envoyer d'argent</strong> à un recruteur. Vérifiez l'identité de l'entreprise avant toute candidature. En cas de doute, signalez-nous. Nous n'acceptons pas les arnaqueurs ni les faussaires.
            </div>
          </div>
        </div>

        {/* ── EXPLORER ── */}
        {(view === 'explorer' || view === 'detail') && (
          <>
            {view === 'explorer' && (
              <div className="rm-anim">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <input className="rm-input" placeholder="🔍 Titre, entreprise, compétence…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200, width: 'auto' }} />
                  <select className="rm-select" value={fSecteur} onChange={e => setFSecteur(e.target.value)}>{SECTEURS.map(s => <option key={s}>{s}</option>)}</select>
                  <select className="rm-select" value={fType} onChange={e => setFType(e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
                  <select className="rm-select" value={fVille} onChange={e => setFVille(e.target.value)}>{VILLES.map(v => <option key={v}>{v}</option>)}</select>
                  <select className="rm-select" value={fExp} onChange={e => setFExp(e.target.value)}>{EXPS.map(e => <option key={e}>{e}</option>)}</select>
                  <select className="rm-select" value={sortBy} onChange={e => setSortBy(e.target.value)} title="Trier par">{SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}</select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {filtered.length} offre{filtered.length !== 1 ? 's' : ''}
                      {search ? ` pour « ${search} »` : ''}
                    </h2>
                    {candidatProfil && <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 6 }}>🎯 Scores de match activés</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="rm-btn-ghost" onClick={() => addAlerte({ label: search || `${fSecteur} · ${fVille}`, secteur: fSecteur, type: fType, ville: fVille, keywords: search })}>
                      🔔 Créer une alerte
                    </button>
                    <button className="rm-btn-blue" onClick={() => setView('publier')}>+ Publier une offre</button>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <EmptyState icon="💼"
                    title={offres.length === 0 ? 'Aucune offre publiée' : 'Aucun résultat'}
                    text={offres.length === 0 ? 'Soyez le premier recruteur ! Publiez votre offre d\'emploi.' : 'Essayez d\'autres filtres.'}
                    cta={offres.length === 0 ? 'Publier une offre' : null}
                    onCta={() => setView('publier')}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {filtered.map(o => (
                      <OffreCard
                        key={o.id}
                        offre={o}
                        isSaved={savedIds.includes(o.id)}
                        matchPct={matchScore(o)}
                        onToggleSave={() => toggleSaved(o.id)}
                        onClick={() => { setSelectedOffre(o); setView('detail'); }}
                        isAdmin={isAdmin}
                        onAdminEdit={o => { setEditingOffre(o); setView('publier'); }}
                        onAdminDelete={adminDeleteOffre}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === 'detail' && selectedOffre && (
              <OffreDetail
                offre={selectedOffre}
                isSaved={savedIds.includes(selectedOffre.id)}
                onToggleSave={() => toggleSaved(selectedOffre.id)}
                isLoggedIn={isLoggedIn}
                onBack={() => setView('explorer')}
                onPostuler={() => setView('postuler')}
              />
            )}
          </>
        )}

        {/* ── POSTULER ── */}
        {view === 'postuler' && selectedOffre && (
          <PostulerView
            offre={selectedOffre}
            isLoggedIn={isLoggedIn}
            membre={membre}
            candidatProfil={candidatProfil}
            onSubmit={apply}
            onBack={() => setView('detail')}
          />
        )}

        {/* ── PUBLIER OFFRE / ADMIN EDIT ── */}
        {view === 'publier' && (
          isLoggedIn || isAdmin
            ? <PublierOffreView
                initialData={editingOffre}
                onPublish={editingOffre ? modifierOffre : publish}
                onBack={() => { setEditingOffre(null); setView('explorer'); }}
              />
            : <AuthGate message="Connectez-vous pour publier une offre d'emploi." onBack={() => setView('explorer')} />
        )}

        {/* ── NETWORKING ── */}
        {(view === 'networking' || view === 'publier-profil') && (
          <>
            {view === 'networking' && (
              <NetworkingView
                profiles={filteredNet}
                filterType={fNetType}
                onFilter={setFNetType}
                isLoggedIn={isLoggedIn}
                onPublier={() => isLoggedIn ? setView('publier-profil') : showNotif('Connectez-vous pour publier votre profil.', 'info')}
              />
            )}
            {view === 'publier-profil' && (
              <PublierProfilView onPublish={publishNet} onBack={() => setView('networking')} />
            )}
          </>
        )}

        {/* ── ÉVÉNEMENTS ── */}
        {(view === 'events' || view === 'create-event') && (
          <>
            {view === 'events' && (
              <EventsView
                events={events}
                membre={membre}
                isLoggedIn={isLoggedIn}
                onRegister={registerEvent}
                onCreate={() => isLoggedIn ? setView('create-event') : showNotif('Connectez-vous pour créer un événement.', 'info')}
              />
            )}
            {view === 'create-event' && (
              <CreateEventView onPublish={publishEvent} onBack={() => setView('events')} />
            )}
          </>
        )}

        {/* ── SAUVEGARDES ── */}
        {view === 'sauvegardes' && (
          <SauvegardesView
            offres={savedOffres}
            savedIds={savedIds}
            onToggleSave={toggleSaved}
            onClick={o => { setSelectedOffre(o); setView('detail'); }}
            onBack={() => setView('explorer')}
          />
        )}

        {/* ── ALERTES ── */}
        {view === 'alertes' && (
          <AlertesView
            alertes={alertes}
            onDelete={id => setAlertes(alertes.filter(a => a.id !== id))}
            onAdd={addAlerte}
            onBack={() => setView('explorer')}
            membre={membre}
          />
        )}

        {/* ── PROFIL CANDIDAT ── */}
        {view === 'profil-candidat' && (
          <CandidatProfilView
            profil={candidatProfil}
            membre={membre}
            onSave={p => { setCandidatProfil(p); showNotif('Profil candidat sauvegardé !'); setView('explorer'); }}
            onBack={() => setView('explorer')}
          />
        )}

        {/* ── MES CANDIDATURES ── */}
        {view === 'mes-candidatures' && (
          isLoggedIn ? (
            <MesCandidaturesView
              candidatures={candidatures.filter(c => c.candidat_id === membre?.id || !c.candidat_id)}
              onBack={() => setView('explorer')}
            />
          ) : (
            <AuthGate message="Connectez-vous pour accéder à vos candidatures." onBack={() => setView('explorer')} />
          )
        )}

        {/* ── MES OFFRES ── */}
        {view === 'mes-offres' && (
          isLoggedIn ? (
            <MesOffresView
              offres={offres.filter(o => o.createur_id === membre?.id)}
              candidatures={candidatures}
              onBack={() => setView('explorer')}
              onDelete={deleteOffre}
              onView={o => { setSelectedOffre(o); setView('detail'); }}
            />
          ) : (
            <AuthGate message="Connectez-vous pour gérer vos offres." onBack={() => setView('explorer')} />
          )
        )}

        {/* ── ADMIN OFFRES ── */}
        {view === 'admin-offres' && isAdmin && (
          <AdminOffresView
            offres={offres}
            onEdit={o => { setEditingOffre(o); setView('publier'); }}
            onDelete={adminDeleteOffre}
            onAdd={() => { setEditingOffre(null); setView('publier'); }}
            onBack={() => setView('explorer')}
          />
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseSalaire(s) {
  if (!s) return 0;
  const n = parseInt(s.replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

// ─── OffreCard ────────────────────────────────────────────────────────────────
function OffreCard({ offre, isSaved, matchPct, onToggleSave, onClick, isAdmin, onAdminEdit, onAdminDelete }) {
  const left = daysLeft(offre.date_exp);
  return (
    <div className="rm-card rm-anim" style={{ padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative' }}>
      <div onClick={onClick} style={{ display: 'contents', cursor: 'pointer' }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
          {offre.logo_url ? <img src={offre.logo_url} alt={`Logo ${offre.entreprise || 'entreprise'}`} width={52} height={52} style={{ borderRadius: 12, objectFit: 'cover' }} /> : '🏢'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }} className="rm-offre-meta">
            {offre.urgent && <span className="rm-badge rm-badge-red">🔴 Urgent</span>}
            <span className="rm-badge rm-badge-blue">{offre.type_contrat}</span>
            <span className="rm-badge rm-badge-green">{offre.secteur}</span>
            <span className="rm-badge rm-badge-gray">📍 {offre.ville}{offre.teletravail ? ' + Remote' : ''}</span>
            {left <= 7 && left > 0 && <span className="rm-badge rm-badge-amber">⏳ {left}j restants</span>}
            {matchPct !== null && <span className={`rm-badge ${matchPct >= 70 ? 'rm-badge-green' : 'rm-badge-amber'}`}>🎯 {matchPct}% match</span>}
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{offre.titre}</h3>
          <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{offre.entreprise || 'Entreprise confidentielle'}</p>
          {offre.salaire && <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>💰 {offre.salaire}</p>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(offre.competences || []).slice(0, 4).map(c => (
              <span key={c} className="rm-skill-tag">{c}</span>
            ))}
            {(offre.competences || []).length > 4 && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+{offre.competences.length - 4}</span>}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <button onClick={e => { e.stopPropagation(); onToggleSave(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 2 }} title={isSaved ? 'Retirer des sauvegardes' : 'Sauvegarder'}>
          {isSaved ? '🔖' : '📌'}
        </button>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dateFR(offre.date_pub)}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{offre.experience}</div>
        {isAdmin && !offre._source && (
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }} onClick={e => e.stopPropagation()}>
            <button className="rm-btn-ghost" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => onAdminEdit(offre)}>✏️</button>
            <button style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer' }} onClick={() => onAdminDelete(offre.id)}>🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OffreDetail ──────────────────────────────────────────────────────────────
function OffreDetail({ offre, isSaved, onToggleSave, isLoggedIn: _isLoggedIn, onBack, onPostuler }) {
  return (
    <div className="rm-anim">
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={onBack} className="rm-btn-ghost">← Retour</button>
        <button onClick={onToggleSave} className="rm-btn-ghost" style={{ borderColor: isSaved ? '#2563EB' : undefined, color: isSaved ? '#2563EB' : undefined }}>
          {isSaved ? '🔖 Sauvegardé' : '📌 Sauvegarder'}
        </button>
      </div>
      <div className="rm-card" style={{ padding: '28px 32px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
            {offre.logo_url ? <img src={offre.logo_url} alt={`Logo ${offre.entreprise || 'entreprise'}`} width={64} height={64} style={{ borderRadius: 14, objectFit: 'cover' }} /> : '🏢'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>{offre.titre}</h2>
            <p style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#2563EB', fontWeight: 700 }}>{offre.entreprise || 'Entreprise confidentielle'}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {offre.urgent && <span className="rm-badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>🔴 Urgent</span>}
              <span className="rm-badge" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}>{offre.type_contrat}</span>
              <span className="rm-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>{offre.secteur}</span>
              <span className="rm-badge" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>📍 {offre.ville}{offre.teletravail ? ' + Remote' : ''}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { icon: '💰', label: 'Salaire', val: offre.salaire || 'À négocier' },
            { icon: '🎓', label: 'Expérience', val: offre.experience },
            { icon: '📅', label: 'Publiée le', val: dateFR(offre.date_pub) },
            { icon: '⏳', label: 'Expire le', val: offre.date_exp ? dateFR(offre.date_exp) : '—' },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{val}</div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Description du poste</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 18, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{offre.description}</p>

        {(offre.competences || []).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Compétences requises</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {offre.competences.map(c => (
                <span key={c} className="rm-badge rm-badge-blue" style={{ borderRadius: 8, fontSize: '0.82rem', padding: '4px 12px' }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {(offre.avantages || []).length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Avantages</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {offre.avantages.map(a => (
                <span key={a} className="rm-badge rm-badge-green" style={{ borderRadius: 8, fontSize: '0.82rem', padding: '4px 12px' }}>✓ {a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Partage */}
        <div style={{ marginBottom: 22, padding: '14px 18px', borderRadius: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Partager cette offre</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['💬','whatsapp'],['✈️','telegram'],['📘','facebook'],['💼','linkedin'],['🐦','twitter']].map(([icon, p]) => (
              <button key={p} onClick={() => shareOffre(offre, p)} className="rm-btn-ghost" style={{ padding: '6px 10px', fontSize: '0.82rem' }}>{icon}</button>
            ))}
            <button onClick={() => copyLink(getOffreUrl(offre))} className="rm-btn-ghost" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>🔗 Lien</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {offre.external_url ? (
            <a href={offre.external_url} target="_blank" rel="noreferrer" className="rm-btn-blue" style={{ flex: 1, minWidth: 200, padding: '14px', fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              Postuler sur le site externe →
            </a>
          ) : (
            <button className="rm-btn-blue" onClick={onPostuler} style={{ flex: 1, minWidth: 200, padding: '14px', fontSize: '1rem' }}>📨 Postuler maintenant</button>
          )}
          {offre.contact_whatsapp && (
            <a href={`https://wa.me/${offre.contact_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par l'offre : ${offre.titre}`)}`}
               target="_blank" rel="noreferrer" className="rm-btn-amber" style={{ padding: '14px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              💬 WhatsApp direct
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PostulerView ─────────────────────────────────────────────────────────────
function PostulerView({ offre, membre, candidatProfil, onSubmit, onBack }) {
  const [form, setForm] = useState({
    candidat_id: membre?.id || null,
    nom: candidatProfil?.nom || membre?.nom || '',
    prenom: candidatProfil?.prenom || membre?.prenom || '',
    email: candidatProfil?.email || membre?.email || '',
    tel: candidatProfil?.tel || membre?.telephone || '',
    linkedin: candidatProfil?.linkedin || '',
    lettre: '',
    cv_url: candidatProfil?.cv_url || '',
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function handleCvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { const url = await uploadFile(file, 'guides', 'cv'); setForm(f => ({ ...f, cv_url: url })); }
    catch (err) { alert('Erreur upload CV : ' + err.message); }
    setUploading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom || !form.prenom || !form.email || !form.tel) { alert('Remplissez tous les champs obligatoires.'); return; }
    onSubmit({ ...form, offre_id: offre.id, offre_titre: offre.titre, offre_entreprise: offre.entreprise });
  }

  return (
    <div className="rm-anim">
      <button onClick={onBack} className="rm-btn-ghost" style={{ marginBottom: 16 }}>← Retour à l'offre</button>
      <div className="rm-card" style={{ padding: '28px', maxWidth: 680 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>📨 Postuler à : {offre.titre}</h2>
        <p style={{ margin: '0 0 22px', fontSize: '0.85rem', color: '#2563EB', fontWeight: 600 }}>{offre.entreprise || 'Entreprise confidentielle'}</p>
        {candidatProfil && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', fontSize: '0.82rem', color: '#2563EB', fontWeight: 600 }}>
            ✓ Profil candidat préchargé — vérifiez et complétez si besoin
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rm-grid-2">
            <div><label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nom *</label><input className="rm-input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required placeholder="Diallo" /></div>
            <div><label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Prénom *</label><input className="rm-input" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} required placeholder="Moussa" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rm-grid-2">
            <div><label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email *</label><input className="rm-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
            <div><label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Téléphone *</label><input className="rm-input" type="tel" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} required /></div>
          </div>
          <input className="rm-input" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="Profil LinkedIn (optionnel)" />
          <textarea className="rm-input" style={{ minHeight: 120, resize: 'vertical' }} value={form.lettre} onChange={e => setForm(f => ({ ...f, lettre: e.target.value }))} placeholder="Lettre de motivation…" />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleCvUpload} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="rm-btn-ghost">
              {uploading ? '⏳ Upload…' : form.cv_url ? '✅ CV chargé' : '📎 Ajouter mon CV (PDF)'}
            </button>
            {form.cv_url && <a href={form.cv_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#2563EB' }}>Voir le CV</a>}
          </div>
          <button type="submit" className="rm-btn-blue" style={{ padding: '14px', fontSize: '1rem', marginTop: 8 }}>📨 Envoyer ma candidature</button>
        </form>
      </div>
    </div>
  );
}

// ─── PublierOffreView ─────────────────────────────────────────────────────────
function PublierOffreView({ onPublish, onBack, initialData }) {
  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        titre: initialData.titre || '',
        entreprise: initialData.entreprise || '',
        secteur: initialData.secteur || 'Tech & Digital',
        type_contrat: initialData.type_contrat || 'CDI',
        experience: initialData.experience || 'Confirmé (3-5 ans)',
        ville: initialData.ville || 'Dakar',
        teletravail: initialData.teletravail || false,
        salaire: initialData.salaire || '',
        description: initialData.description || '',
        competences: (initialData.competences || []).join(', '),
        avantages: initialData.avantages || [],
        contact_email: initialData.contact_email || '',
        contact_whatsapp: initialData.contact_whatsapp || '',
        urgent: initialData.urgent || false,
        date_exp: initialData.date_exp || '',
        logo_url: initialData.logo_url || '',
      };
    }
    return { titre: '', entreprise: '', secteur: 'Tech & Digital', type_contrat: 'CDI', experience: 'Confirmé (3-5 ans)', ville: 'Dakar', teletravail: false, salaire: '', description: '', competences: '', avantages: [], contact_email: '', contact_whatsapp: '', urgent: false, date_exp: '', logo_url: '' };
  });
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef(null);

  async function handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { const url = await uploadFile(file, 'covers', 'entreprises'); setForm(f => ({ ...f, logo_url: url })); }
    catch (err) { alert('Erreur logo : ' + err.message); }
    setUploading(false);
  }

  function toggleAvantage(a) {
    setForm(f => ({ ...f, avantages: f.avantages.includes(a) ? f.avantages.filter(x => x !== a) : [...f.avantages, a] }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.titre || !form.description || !form.contact_email) { alert('Titre, description et email requis.'); return; }
    onPublish({ ...form, competences: form.competences.split(',').map(c => c.trim()).filter(Boolean) });
  }

  return (
    <div className="rm-anim">
      <button onClick={onBack} className="rm-btn-ghost" style={{ marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>{initialData ? '✏️ Modifier l\'offre' : '➕ Publier une offre d\'emploi'}</h2>
      <form onSubmit={handleSubmit} className="rm-card" style={{ padding: '28px', maxWidth: 700 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input className="rm-input" placeholder="Titre du poste *" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rm-grid-2">
            <input className="rm-input" placeholder="Nom de l'entreprise" value={form.entreprise} onChange={e => setForm(f => ({ ...f, entreprise: e.target.value }))} />
            <select className="rm-select" value={form.secteur} onChange={e => setForm(f => ({ ...f, secteur: e.target.value }))}>{SECTEURS.slice(1).map(s => <option key={s}>{s}</option>)}</select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }} className="rm-grid-3">
            <select className="rm-select" value={form.type_contrat} onChange={e => setForm(f => ({ ...f, type_contrat: e.target.value }))}>{TYPES.slice(1).map(t => <option key={t}>{t}</option>)}</select>
            <select className="rm-select" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}>{EXPS.map(e => <option key={e}>{e}</option>)}</select>
            <select className="rm-select" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}>{VILLES.slice(1).map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rm-grid-2">
            <input className="rm-input" placeholder="Salaire (ex: 500 000 – 700 000 FCFA)" value={form.salaire} onChange={e => setForm(f => ({ ...f, salaire: e.target.value }))} />
            <input className="rm-input" type="date" value={form.date_exp} onChange={e => setForm(f => ({ ...f, date_exp: e.target.value }))} title="Date d'expiration" />
          </div>
          <textarea className="rm-input" placeholder="Description, missions, profil recherché… *" rows={5} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: 'vertical' }} />
          <input className="rm-input" placeholder="Compétences (séparées par virgules)" value={form.competences} onChange={e => setForm(f => ({ ...f, competences: e.target.value }))} />
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Avantages proposés</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {AVANTAGES_OPT.map(a => (
                <button key={a} type="button" onClick={() => toggleAvantage(a)} style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600,
                  background: form.avantages.includes(a) ? 'rgba(16,185,129,0.12)' : 'var(--bg-primary)',
                  border: `1px solid ${form.avantages.includes(a) ? '#10B981' : 'var(--border)'}`,
                  color: form.avantages.includes(a) ? '#10B981' : 'var(--text-secondary)',
                }}>{form.avantages.includes(a) ? '✓ ' : ''}{a}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rm-grid-2">
            <input className="rm-input" type="email" placeholder="Email de contact *" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} required />
            <input className="rm-input" type="tel" placeholder="WhatsApp (optionnel)" value={form.contact_whatsapp} onChange={e => setForm(f => ({ ...f, contact_whatsapp: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.urgent} onChange={e => setForm(f => ({ ...f, urgent: e.target.checked }))} /> 🔴 Offre urgente
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.teletravail} onChange={e => setForm(f => ({ ...f, teletravail: e.target.checked }))} /> 🌍 Télétravail possible
            </label>
            <div>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
              <button type="button" onClick={() => logoRef.current?.click()} disabled={uploading} className="rm-btn-ghost" style={{ fontSize: '0.78rem' }}>
                {uploading ? '⏳' : form.logo_url ? '✅ Logo chargé' : '🖼️ Logo entreprise'}
              </button>
            </div>
          </div>
          <button type="submit" className="rm-btn-blue" style={{ padding: '14px', fontSize: '1rem', marginTop: 4 }}>{initialData ? '💾 Enregistrer les modifications' : '🚀 Publier l\'offre'}</button>
        </div>
      </form>
    </div>
  );
}

// ─── NetworkingView ───────────────────────────────────────────────────────────
function NetworkingView({ profiles, filterType, onFilter, isLoggedIn: _isLoggedIn, onPublier }) {
  return (
    <div className="rm-anim">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>🤝 Espace Networking</h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Startups · Investisseurs · Experts RH · Entrepreneurs · Freelances · Mentors</p>
        </div>
        <button className="rm-btn-amber" onClick={onPublier}>+ Publier mon profil</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {NET_TYPES.map(t => (
          <button key={t} onClick={() => onFilter(t)} className={`rm-tab ${filterType === t ? 'rm-tab-active' : 'rm-tab-inactive'}`}>{t}</button>
        ))}
      </div>
      {profiles.length === 0 ? (
        <EmptyState icon="🤝" title="Aucun profil réseau" text="Présentez votre startup, projet, ou expertise pour rejoindre l'écosystème." cta="Publier mon profil" onCta={onPublier} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {profiles.map(p => <NetworkingCard key={p.id} profile={p} />)}
        </div>
      )}
    </div>
  );
}

function NetworkingCard({ profile }) {
  const colors = { Startup: '#2563EB', Investisseur: '#F59E0B', 'Expert RH': '#10B981', Entrepreneur: '#8B5CF6', Freelance: '#EC4899', Mentor: '#06B6D4' };
  const icons  = { Startup: '🚀', Investisseur: '💰', 'Expert RH': '👔', Entrepreneur: '💡', Freelance: '💻', Mentor: '🎓' };
  const color = colors[profile.type] || '#2563EB';
  return (
    <div className="rm-card rm-anim" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
          {icons[profile.type] || '💡'}
        </div>
        <div>
          <span style={{ padding: '2px 8px', borderRadius: 6, background: `${color}15`, color, fontSize: '0.7rem', fontWeight: 800 }}>{profile.type}</span>
          <h3 style={{ margin: '4px 0 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{profile.nom}</h3>
          {profile.organisation && <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{profile.organisation}</p>}
        </div>
      </div>
      {profile.secteur && <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>🏷 {profile.secteur} · 📍 {profile.ville}</p>}
      <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{profile.description}</p>
      {profile.cherche && <div style={{ marginBottom: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}><strong style={{ color: '#2563EB' }}>Cherche :</strong> {profile.cherche}</div>}
      {profile.offre && <div style={{ marginBottom: 12, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}><strong style={{ color: '#10B981' }}>Offre :</strong> {profile.offre}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {profile.contact_whatsapp && <a href={`https://wa.me/${profile.contact_whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>💬 WhatsApp</a>}
        {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(10,102,194,0.1)', border: '1px solid rgba(10,102,194,0.25)', color: '#0A66C2', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>💼 LinkedIn</a>}
        {profile.contact_email && <a href={`mailto:${profile.contact_email}`} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>✉️ Email</a>}
      </div>
    </div>
  );
}

function PublierProfilView({ onPublish, onBack }) {
  const [form, setForm] = useState({ type: 'Startup', nom: '', organisation: '', secteur: 'Tech & Digital', ville: 'Dakar', description: '', cherche: '', offre: '', contact_email: '', contact_whatsapp: '', linkedin: '' });
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom || !form.description) { alert('Nom et description requis.'); return; }
    onPublish(form);
  }
  return (
    <div className="rm-anim">
      <button onClick={onBack} className="rm-btn-ghost" style={{ marginBottom: 16 }}>← Retour au networking</button>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>🤝 Publier mon profil réseau</h2>
      <form onSubmit={handleSubmit} className="rm-card" style={{ padding: '28px', maxWidth: 640 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rm-grid-2">
            <select className="rm-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{NET_TYPES.slice(1).map(t => <option key={t}>{t}</option>)}</select>
            <select className="rm-select" value={form.secteur} onChange={e => setForm(f => ({ ...f, secteur: e.target.value }))}>{SECTEURS.slice(1).map(s => <option key={s}>{s}</option>)}</select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rm-grid-2">
            <input className="rm-input" placeholder="Votre nom / pseudo *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
            <input className="rm-input" placeholder="Entreprise / Organisation" value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} />
          </div>
          <select className="rm-select" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}>{VILLES.slice(1).map(v => <option key={v}>{v}</option>)}</select>
          <textarea className="rm-input" placeholder="Décrivez-vous, votre projet ou votre expertise *" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: 'vertical' }} />
          <input className="rm-input" placeholder="Ce que vous cherchez (ex: développeur, financement 50M FCFA…)" value={form.cherche} onChange={e => setForm(f => ({ ...f, cherche: e.target.value }))} />
          <input className="rm-input" placeholder="Ce que vous proposez (ex: equity 10%, mentorat…)" value={form.offre} onChange={e => setForm(f => ({ ...f, offre: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rm-grid-2">
            <input className="rm-input" type="email" placeholder="Email de contact" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
            <input className="rm-input" type="tel" placeholder="WhatsApp" value={form.contact_whatsapp} onChange={e => setForm(f => ({ ...f, contact_whatsapp: e.target.value }))} />
          </div>
          <input className="rm-input" placeholder="Profil LinkedIn (URL)" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} />
          <button type="submit" className="rm-btn-amber" style={{ padding: '14px', fontSize: '1rem' }}>🤝 Publier dans le réseau</button>
        </div>
      </form>
    </div>
  );
}

// ─── EventsView + CreateEventView ─────────────────────────────────────────────
function EventsView({ events, membre, isLoggedIn: _isLoggedIn, onRegister, onCreate }) {
  return (
    <div className="rm-anim">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>📅 Événements emploi & networking</h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Job Fairs · Meetups · Hackathons · Ateliers · Conférences</p>
        </div>
        <button className="rm-btn-blue" onClick={onCreate}>+ Créer un événement</button>
      </div>
      {events.length === 0 ? (
        <EmptyState icon="📅" title="Aucun événement" text="Soyez le premier à créer un événement pour la communauté." cta="Créer un événement" onCta={onCreate} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {events.map(evt => {
            const isRegistered = (evt.inscrits || []).includes(membre?.id);
            const spots = (evt.places || 0) - (evt.inscrits || []).length;
            return (
              <div key={evt.id} className="rm-event-card rm-anim">
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                    {evt.type === 'Job Fair' ? '🎪' : evt.type === 'Hackathon' ? '💻' : evt.type === 'Meetup' ? '🤝' : evt.type === 'Conférence' ? '🎤' : evt.type === 'Atelier' ? '🔧' : '🌐'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(37,99,235,0.1)', color: '#2563EB', fontSize: '0.7rem', fontWeight: 800 }}>{evt.type}</span>
                    <h3 style={{ margin: '4px 0 2px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{evt.titre}</h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {evt.lieu} · 📅 {evt.date ? dateFR(evt.date) : '—'}</p>
                  </div>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{evt.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    👥 {(evt.inscrits || []).length} inscrit{(evt.inscrits || []).length !== 1 ? 's' : ''}
                    {evt.places ? ` · ${Math.max(0, spots)} place${spots !== 1 ? 's' : ''} restante${spots !== 1 ? 's' : ''}` : ''}
                  </div>
                  <button onClick={() => onRegister(evt.id)} className={isRegistered ? 'rm-btn-ghost' : 'rm-btn-blue'} style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                    {isRegistered ? '✓ Inscrit — Se désinscrire' : "S'inscrire"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateEventView({ onPublish, onBack }) {
  const [form, setForm] = useState({ titre: '', type: 'Job Fair', description: '', lieu: '', date: '', heure: '', places: '', organisateur: '', contact: '' });
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.titre || !form.description || !form.lieu || !form.date) { alert('Titre, description, lieu et date requis.'); return; }
    onPublish({ ...form, places: Number(form.places) || 0 });
  }
  return (
    <div className="rm-anim">
      <button onClick={onBack} className="rm-btn-ghost" style={{ marginBottom: 16 }}>← Retour aux événements</button>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>📅 Créer un événement</h2>
      <form onSubmit={handleSubmit} className="rm-card" style={{ padding: '28px', maxWidth: 680 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input className="rm-input" placeholder="Titre de l'événement *" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rm-grid-2">
            <select className="rm-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <input className="rm-input" placeholder="Organisateur" value={form.organisateur} onChange={e => setForm(f => ({ ...f, organisateur: e.target.value }))} />
          </div>
          <textarea className="rm-input" placeholder="Description de l'événement *" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: 'vertical' }} />
          <input className="rm-input" placeholder="Lieu (ex: Hôtel Terrou-Bi, Dakar) *" value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }} className="rm-grid-3">
            <input className="rm-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required title="Date de l'événement" />
            <input className="rm-input" type="time" value={form.heure} onChange={e => setForm(f => ({ ...f, heure: e.target.value }))} title="Heure" />
            <input className="rm-input" type="number" placeholder="Nombre de places" value={form.places} onChange={e => setForm(f => ({ ...f, places: e.target.value }))} />
          </div>
          <input className="rm-input" type="tel" placeholder="Contact WhatsApp / Email de l'organisateur" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          <button type="submit" className="rm-btn-blue" style={{ padding: '14px', fontSize: '1rem', marginTop: 4 }}>📅 Publier l'événement</button>
        </div>
      </form>
    </div>
  );
}

// ─── SauvegardesView ──────────────────────────────────────────────────────────
function SauvegardesView({ offres, savedIds, onToggleSave, onClick, onBack }) {
  return (
    <div className="rm-anim">
      <button onClick={onBack} className="rm-btn-ghost" style={{ marginBottom: 16 }}>← Explorer</button>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>🔖 Offres sauvegardées ({offres.length})</h2>
      {offres.length === 0 ? (
        <EmptyState icon="🔖" title="Aucune sauvegarde" text="Sauvegardez les offres intéressantes en cliquant sur 📌 pour les retrouver ici." cta="Explorer les offres" onCta={onBack} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {offres.map(o => (
            <OffreCard key={o.id} offre={o} isSaved={savedIds.includes(o.id)} matchPct={null} onToggleSave={() => onToggleSave(o.id)} onClick={() => onClick(o)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AlertesView ──────────────────────────────────────────────────────────────
function AlertesView({ alertes, onDelete, onAdd, onBack, membre }) {
  const [form, setForm] = useState({ label: '', secteur: 'Tous', type: 'Tous', ville: 'Toutes', keywords: '', email: membre?.email || '' });
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.label) { alert('Donnez un nom à l\'alerte.'); return; }
    onAdd(form);
    setForm({ label: '', secteur: 'Tous', type: 'Tous', ville: 'Toutes', keywords: '', email: membre?.email || '' });
  }
  return (
    <div className="rm-anim">
      <button onClick={onBack} className="rm-btn-ghost" style={{ marginBottom: 16 }}>← Explorer</button>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>🔔 Mes alertes emploi ({alertes.length})</h2>

      <div className="rm-card" style={{ padding: '24px', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>+ Créer une alerte</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="rm-input" placeholder="Nom de l'alerte (ex: Dev mobile Dakar) *" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }} className="rm-grid-3">
            <select className="rm-select" value={form.secteur} onChange={e => setForm(f => ({ ...f, secteur: e.target.value }))}>{SECTEURS.map(s => <option key={s}>{s}</option>)}</select>
            <select className="rm-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <select className="rm-select" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}>{VILLES.map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <input className="rm-input" placeholder="Mots-clés (ex: React, Python, Marketing Digital)" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} />
          <input className="rm-input" type="email" placeholder="📧 Email pour les notifications (recommandé)" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: -6 }}>
            {form.email ? '✅ Vous recevrez les offres correspondantes par email' : '⚡ Sans email, les alertes restent locales à ce navigateur'}
          </div>
          <button type="submit" className="rm-btn-blue" style={{ padding: '10px', alignSelf: 'flex-start' }}>🔔 Créer l'alerte</button>
        </form>
      </div>

      {alertes.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>Aucune alerte. Créez-en une ci-dessus pour ne jamais rater une offre.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alertes.map(a => (
            <div key={a.id} className="rm-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>🔔 {a.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {[a.secteur !== 'Tous' && a.secteur, a.type !== 'Tous' && a.type, a.ville !== 'Toutes' && a.ville, a.keywords].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button onClick={() => onDelete(a.id)} className="rm-btn-red" style={{ padding: '6px 12px', fontSize: '0.78rem', flexShrink: 0 }}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CandidatProfilView ───────────────────────────────────────────────────────
function CandidatProfilView({ profil, membre, onSave, onBack }) {
  const [form, setForm] = useState(profil || {
    nom: membre?.nom || '', prenom: membre?.prenom || '', email: membre?.email || '',
    tel: membre?.telephone || '', titre: '', secteur: 'Tech & Digital', ville: 'Dakar',
    experience: 'Confirmé (3-5 ans)', competences: '', linkedin: '', cv_url: '', presentation: '',
  });
  const [uploading, setUploading] = useState(false);
  const cvRef = useRef(null);

  async function handleCv(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { const url = await uploadFile(file, 'guides', 'cv'); setForm(f => ({ ...f, cv_url: url })); }
    catch (err) { alert('Erreur : ' + err.message); }
    setUploading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom || !form.prenom || !form.email) { alert('Nom, prénom et email requis.'); return; }
    onSave(form);
  }

  return (
    <div className="rm-anim">
      <button onClick={onBack} className="rm-btn-ghost" style={{ marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>👤 Mon profil candidat</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>Complétez votre profil pour activer le score de correspondance automatique sur chaque offre.</p>
      <form onSubmit={handleSubmit} className="rm-card" style={{ padding: '28px', maxWidth: 700 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rm-grid-2">
            <div><label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nom *</label><input className="rm-input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required /></div>
            <div><label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Prénom *</label><input className="rm-input" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} required /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rm-grid-2">
            <div><label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email *</label><input className="rm-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
            <div><label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Téléphone</label><input className="rm-input" type="tel" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} /></div>
          </div>
          <input className="rm-input" placeholder="Titre professionnel (ex: Développeur Full Stack, Chef de projet)" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }} className="rm-grid-3">
            <select className="rm-select" value={form.secteur} onChange={e => setForm(f => ({ ...f, secteur: e.target.value }))}>{SECTEURS.slice(1).map(s => <option key={s}>{s}</option>)}</select>
            <select className="rm-select" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}>{EXPS.map(e => <option key={e}>{e}</option>)}</select>
            <select className="rm-select" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}>{VILLES.slice(1).map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Compétences (séparées par virgules) — utilisées pour le score de match</label>
            <input className="rm-input" placeholder="Ex: React, Python, Marketing digital, Excel, RH…" value={form.competences} onChange={e => setForm(f => ({ ...f, competences: e.target.value }))} />
          </div>
          <input className="rm-input" placeholder="Profil LinkedIn (URL)" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} />
          <textarea className="rm-input" placeholder="Présentation courte (2-3 lignes sur votre parcours et vos objectifs)" rows={4} value={form.presentation} onChange={e => setForm(f => ({ ...f, presentation: e.target.value }))} style={{ resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input ref={cvRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleCv} />
            <button type="button" onClick={() => cvRef.current?.click()} disabled={uploading} className="rm-btn-ghost">
              {uploading ? '⏳ Upload…' : form.cv_url ? '✅ CV chargé' : '📎 Uploader mon CV (PDF)'}
            </button>
            {form.cv_url && <a href={form.cv_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#2563EB' }}>Voir le CV</a>}
          </div>
          <button type="submit" className="rm-btn-blue" style={{ padding: '14px', fontSize: '1rem', marginTop: 4 }}>💾 Sauvegarder mon profil</button>
        </div>
      </form>
    </div>
  );
}

// ─── MesCandidaturesView ──────────────────────────────────────────────────────
function MesCandidaturesView({ candidatures, onBack }) {
  const statColors = { Envoyée: '#2563EB', 'En cours': '#F59E0B', Acceptée: '#10B981', Refusée: '#EF4444' };
  return (
    <div className="rm-anim">
      <button onClick={onBack} className="rm-btn-ghost" style={{ marginBottom: 16 }}>← Explorer les offres</button>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>📋 Mes candidatures ({candidatures.length})</h2>
      {candidatures.length === 0 ? (
        <EmptyState icon="📋" title="Aucune candidature" text="Vous n'avez encore postulé à aucune offre." cta="Explorer les offres" onCta={onBack} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {candidatures.map(c => (
            <div key={c.id} className="rm-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{c.offre_titre}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.offre_entreprise || '—'} · {dateFR(c.date)}</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 700, background: `${statColors[c.statut] || '#2563EB'}15`, color: statColors[c.statut] || '#2563EB' }}>{c.statut}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MesOffresView ────────────────────────────────────────────────────────────
function MesOffresView({ offres, candidatures, onBack, onDelete, onView }) {
  const totalCands = candidatures.filter(c => offres.some(o => o.id === c.offre_id)).length;
  return (
    <div className="rm-anim">
      <button onClick={onBack} className="rm-btn-ghost" style={{ marginBottom: 16 }}>← Explorer</button>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>📂 Mes offres ({offres.length})</h2>
      {offres.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { icon: '📂', label: 'Offres actives', val: offres.filter(o => o.statut === 'actif').length },
            { icon: '📨', label: 'Candidatures reçues', val: totalCands },
            { icon: '⏳', label: 'Expirent bientôt', val: offres.filter(o => daysLeft(o.date_exp) <= 7 && daysLeft(o.date_exp) > 0).length },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ padding: '14px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{val}</div>
            </div>
          ))}
        </div>
      )}
      {offres.length === 0 ? (
        <EmptyState icon="📂" title="Aucune offre publiée" text="Vous n'avez encore publié aucune offre d'emploi." cta={null} onCta={null} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {offres.map(o => {
            const cands = candidatures.filter(c => c.offre_id === o.id);
            return (
              <div key={o.id} className="rm-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onView(o)}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{o.titre}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{o.type_contrat} · {o.ville} · {dateFR(o.date_pub)}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 700 }}>📨 {cands.length} candidature{cands.length !== 1 ? 's' : ''}</span>
                      {o.date_exp && <span style={{ fontSize: '0.78rem', color: daysLeft(o.date_exp) <= 7 ? '#F59E0B' : 'var(--text-muted)' }}>⏳ Expire dans {daysLeft(o.date_exp)}j</span>}
                    </div>
                  </div>
                  <button onClick={() => onDelete(o.id)} className="rm-btn-red" style={{ padding: '6px 12px', fontSize: '0.78rem', flexShrink: 0 }}>Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AdminOffresView ──────────────────────────────────────────────────────────
function AdminOffresView({ offres, onEdit, onDelete, onAdd, onBack }) {
  const [q, setQ] = useState('');
  const filtered = q
    ? offres.filter(o => o.titre.toLowerCase().includes(q.toLowerCase()) || (o.entreprise || '').toLowerCase().includes(q.toLowerCase()))
    : offres;
  return (
    <div className="rm-anim">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} className="rm-btn-ghost">← Retour</button>
        <button className="rm-btn-blue" onClick={onAdd}>+ Ajouter une offre</button>
      </div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>🛠️ Gestion des offres ({offres.length})</h2>
      <input className="rm-input" placeholder="Rechercher une offre…" value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 16, maxWidth: 400 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(o => (
          <div key={o.id} className="rm-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              {o.logo_url ? (
                <img src={o.logo_url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏢</div>
              )}
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{o.titre}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.entreprise || '—'} · {o.secteur} · {o.ville}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="rm-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => onEdit(o)}>✏️ Modifier</button>
              <button style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer' }} onClick={() => onDelete(o.id)}>🗑️ Supprimer</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune offre trouvée.</p>}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function EmptyState({ icon, title, text, cta, onCta }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: '0.85rem', maxWidth: 340, margin: '0 auto 20px' }}>{text}</p>
      {cta && <button className="rm-btn-blue" onClick={onCta}>{cta}</button>}
    </div>
  );
}

function AuthGate({ message, onBack }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>{message}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/connexion" style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>Se connecter</a>
        <button className="rm-btn-ghost" onClick={onBack}>← Retour</button>
      </div>
    </div>
  );
}
