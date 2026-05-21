import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadFile } from '../../lib/uploadFile';
import ToolInfoPanel from '../../components/ToolInfoPanel';
import { supabase } from '../../lib/supabase';
import ToolHero from '../../components/ToolHero';

// ─── Constants ────────────────────────────────────────────────────────────────
const METIERS = ['Tous', 'Maçon', 'Électricien', 'Plombier', 'Carreleur', 'Menuisier', 'Peintre', 'Soudeur', 'Mécanicien auto', 'Chauffeur', 'Jardinier', 'Gardien/Vigile', 'Femme de ménage', 'Cuisinier/Traiteur', 'Informaticien', 'Couturier', 'Technicien froid/clim', 'Charpentier', 'Plâtrier', 'Tapissier', 'Vitrier', 'Ferronnier', 'Paysagiste', 'Autres'];
const VILLES  = ['Toutes', 'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 'Touba', 'Mbour', 'Rufisque', 'Pikine', 'Guédiawaye', 'Diourbel', 'Louga', 'Tambacounda'];
const STATUTS = ['Tous', 'Disponible maintenant', 'En chantier', 'Absent'];
const EXPS    = ['Moins de 1 an', '1-3 ans', '3-5 ans', '5-10 ans', '10+ ans'];

const EO_OUVRIERS_KEY = 'eo_ouvriers_v1';
const EO_BESOINS_KEY  = 'eo_besoins_v1';
const EO_AVIS_KEY     = 'eo_avis_v1';
const EO_FAVORIS_KEY  = 'eo_favoris_v1';
const EO_DEVIS_KEY    = 'eo_devis_v1';

function load(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function save(key, d) { try { localStorage.setItem(key, JSON.stringify(d)); } catch { /* ignore */ } }
function newId(p = 'x') { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }
function dateFR(iso) { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }
function stars(n) { return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n)); }
function noteColor(n) { return n >= 4.5 ? '#10B981' : n >= 3.5 ? '#F59E0B' : '#EF4444'; }
function isTopOuvrier(o) { return (o.note || 0) >= 4.5 && (o.avis_count || 0) >= 5; }
function statutColor(s) {
  if (s === 'Disponible maintenant') return '#10B981';
  if (s === 'En chantier') return '#F59E0B';
  return '#9CA3AF';
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
@keyframes eoFadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.eo-anim { animation: eoFadeIn 0.3s ease-out; }
.eo-card { background:color-mix(in srgb,var(--bg-card) 92%,transparent); border:1px solid var(--border); border-radius:16px; transition:transform 0.3s cubic-bezier(0.22,1,0.36,1),box-shadow 0.3s ease,border-color 0.2s ease; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
.eo-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,0.16),inset 0 1px 0 rgba(255,255,255,0.06); border-color:rgba(234,88,12,0.2); }
.eo-btn-orange { background:linear-gradient(135deg,#EA580C,#C2410C); color:#fff; border:none; border-radius:10px; padding:10px 18px; font-weight:700; cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.eo-btn-orange:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(234,88,12,0.35); }
.eo-btn-green { background:linear-gradient(135deg,#16A34A,#15803D); color:#fff; border:none; border-radius:10px; padding:10px 18px; font-weight:700; cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.eo-btn-green:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(22,163,74,0.35); }
.eo-btn-ghost { background:transparent; border:1px solid var(--border); border-radius:10px; padding:8px 14px; color:var(--text-secondary); cursor:pointer; font-size:0.82rem; font-weight:600; transition:all 0.2s; }
.eo-btn-ghost:hover { border-color:#EA580C; color:#EA580C; }
.eo-btn-red { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:10px; padding:8px 14px; color:#EF4444; cursor:pointer; font-size:0.82rem; font-weight:600; transition:all 0.2s; }
.eo-input { background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary); border-radius:10px; padding:10px 14px; font-size:0.88rem; outline:none; font-family:inherit; width:100%; box-sizing:border-box; }
.eo-input:focus { border-color:#EA580C; box-shadow:0 0 0 3px rgba(234,88,12,0.12); }
.eo-select { background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary); border-radius:10px; padding:8px 12px; font-size:0.82rem; outline:none; cursor:pointer; }
.eo-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:100px; font-size:0.72rem; font-weight:700; }
.eo-tab { padding:8px 16px; border-radius:100px; border:2px solid transparent; cursor:pointer; font-weight:500; font-size:0.82rem; transition:all 0.2s; white-space:nowrap; }
.eo-tab-active { border-color:#EA580C; background:rgba(234,88,12,0.1); color:#EA580C; font-weight:700; }
.eo-tab-inactive { border-color:var(--border); background:transparent; color:var(--text-secondary); }
.eo-galerie { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:8px; }
.eo-galerie img { width:100%; height:100px; object-fit:cover; border-radius:10px; border:1px solid var(--border); cursor:pointer; transition:transform 0.2s; }
.eo-galerie img:hover { transform:scale(1.04); }
@media (max-width:640px) {
  .eo-grid-2 { grid-template-columns:1fr !important; }
  .eo-grid-3 { grid-template-columns:1fr 1fr !important; }
}
`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EspaceOuvrier() {
  const { membre, isAdmin } = useAuth();
  const isLoggedIn = !!membre?.id;

  const [ouvriers, setOuvriers]     = useState([]);
  const [besoins, setBesoins]       = useState([]);
  const [avis, setAvis]             = useState([]);
  const [favoris, setFavoris]       = useState(() => load(EO_FAVORIS_KEY));
  const [devisList, setDevisList]   = useState(() => load(EO_DEVIS_KEY));
  const [dbLoading, setDbLoading]   = useState(true);
  const [view, setView]             = useState('explorer');
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState('');
  const [fMetier, setFMetier]       = useState('Tous');
  const [fVille, setFVille]         = useState('Toutes');
  const [fStatut, setFStatut]       = useState('Tous');
  const [fNoteMin, setFNoteMin]     = useState(0);
  const [fTopOnly, setFTopOnly]     = useState(false);
  const [notif, setNotif]           = useState(null);
  const [editingOuvrier, setEditingOuvrier] = useState(null);

  useEffect(() => { save(EO_FAVORIS_KEY, favoris); }, [favoris]);
  useEffect(() => { save(EO_DEVIS_KEY, devisList); }, [devisList]);

  // ── Supabase: chargement + temps réel ──
  useEffect(() => {
    async function loadDb() {
      setDbLoading(true);
      const [{ data: ouv }, { data: bes }, { data: av }] = await Promise.all([
        supabase.from('ouvriers_profils').select('*').eq('statut', 'actif').order('created_at', { ascending: false }),
        supabase.from('ouvriers_besoins').select('*').eq('statut', 'actif').order('created_at', { ascending: false }),
        supabase.from('ouvriers_avis').select('*').order('created_at', { ascending: false }),
      ]);
      if (ouv) setOuvriers(ouv);
      if (bes) setBesoins(bes);
      if (av) setAvis(av);
      setDbLoading(false);
    }
    loadDb();
    const ch = supabase.channel('eo-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ouvriers_profils' }, ({ new: r }) => setOuvriers(p => [r, ...p]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ouvriers_profils' }, ({ new: r }) => setOuvriers(p => p.map(o => o.id === r.id ? r : o)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ouvriers_profils' }, ({ old: r }) => setOuvriers(p => p.filter(o => o.id !== r.id)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ouvriers_besoins' }, ({ new: r }) => setBesoins(p => [r, ...p]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ouvriers_besoins' }, ({ old: r }) => setBesoins(p => p.filter(b => b.id !== r.id)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ouvriers_avis' }, ({ new: r }) => setAvis(p => [r, ...p]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(() => setNotif(null), 3500);
    return () => clearTimeout(t);
  }, [notif]);

  // Deep link ?ouvrier=ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('ouvrier');
    if (id) {
      const target = ouvriers.find(o => o.id === id);
      if (target) { requestAnimationFrame(() => { setSelected(target); setView('profil'); }); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOuvriers = ouvriers
    .filter(o => o.statut === 'actif')
    .filter(o => fMetier === 'Tous' || o.metier === fMetier)
    .filter(o => fVille === 'Toutes' || o.ville === fVille)
    .filter(o => fStatut === 'Tous' || o.statut_dispo === fStatut)
    .filter(o => (o.note || 0) >= fNoteMin)
    .filter(o => !fTopOnly || isTopOuvrier(o))
    .filter(o => !search ||
      o.nom.toLowerCase().includes(search.toLowerCase()) ||
      o.metier.toLowerCase().includes(search.toLowerCase()) ||
      (o.specialites || []).some(s => s.toLowerCase().includes(search.toLowerCase())) ||
      (o.zones || []).some(z => z.toLowerCase().includes(search.toLowerCase())));

  const favOuvriers = ouvriers.filter(o => favoris.includes(o.id));

  function toggleFavori(id) {
    setFavoris(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  }

  async function inscrireOuvrier(data) {
    const row = { ...data, note: 0, avis_count: 0, statut: 'actif', membre_id: membre?.id || null };
    const { data: created, error } = await supabase.from('ouvriers_profils').insert(row).select().single();
    if (error) { showNotif('❌ ' + error.message, 'error'); return; }
    setOuvriers(p => [created, ...p]);
    setEditingOuvrier(null);
    setView('explorer');
    showNotif(`Profil de ${data.nom} publié avec succès !`);
  }

  async function modifierOuvrier(data) {
    if (!editingOuvrier) return;
    const { data: updated, error } = await supabase.from('ouvriers_profils').update(data).eq('id', editingOuvrier.id).select().single();
    if (error) { showNotif('❌ ' + error.message, 'error'); return; }
    setOuvriers(p => p.map(o => o.id === editingOuvrier.id ? updated : o));
    setEditingOuvrier(null);
    setView('explorer');
    showNotif(`Profil de ${data.nom} mis à jour !`);
  }

  async function adminDeleteOuvrier(id) {
    if (!confirm('Supprimer définitivement ce profil ?')) return;
    await supabase.from('ouvriers_profils').delete().eq('id', id);
    setOuvriers(p => p.filter(o => o.id !== id));
    if (selected?.id === id) { setSelected(null); setView('explorer'); }
    showNotif('Profil supprimé.', 'error');
  }

  async function publierBesoin(data) {
    const row = { ...data, statut: 'actif', membre_id: membre?.id || null };
    const { data: created, error } = await supabase.from('ouvriers_besoins').insert(row).select().single();
    if (error) { showNotif('❌ ' + error.message, 'error'); return; }
    setBesoins(p => [created, ...p]);
    setView('mes-besoins');
    showNotif('Besoin publié ! Les ouvriers concernés seront notifiés.');
  }

  function envoyerDevis(data) {
    const devis = { id: newId('dev'), ...data, date: new Date().toISOString(), statut_devis: 'Envoyé', createur_id: membre?.id || null };
    setDevisList([devis, ...devisList]);
    setView('profil');
    showNotif('Demande de devis envoyée avec succès !');
  }

  async function soumettrAvis(ouvrierId, data) {
    const { data: created, error } = await supabase.from('ouvriers_avis').insert({ ouvrier_id: ouvrierId, ...data, membre_id: membre?.id || null }).select().single();
    if (error) { showNotif('❌ ' + error.message, 'error'); return; }
    const newAvis = [created, ...avis];
    setAvis(newAvis);
    const oa = newAvis.filter(a => a.ouvrier_id === ouvrierId);
    const avg = Math.round((oa.reduce((s, a) => s + (a.note || 0), 0) / oa.length) * 10) / 10;
    await supabase.from('ouvriers_profils').update({ note: avg, avis_count: oa.length }).eq('id', ouvrierId);
    setOuvriers(p => p.map(o => o.id === ouvrierId ? { ...o, note: avg, avis_count: oa.length } : o));
    if (selected?.id === ouvrierId) setSelected(s => ({ ...s, note: avg, avis_count: oa.length }));
    showNotif('Avis publié. Merci !');
  }

  async function deleteOuvrier(id) {
    if (!confirm('Supprimer ce profil ?')) return;
    await supabase.from('ouvriers_profils').delete().eq('id', id);
    setOuvriers(p => p.filter(o => o.id !== id));
  }

  function showNotif(msg, type = 'success') { setNotif({ type, msg }); }

  const TABS = [
    { id: 'explorer',        label: '🔍 Trouver un ouvrier' },
    { id: 'publier-besoin',  label: '📋 Publier un besoin' },
    { id: 'devenir-ouvrier', label: '👷 Devenir ouvrier' },
    { id: 'favoris',         label: `❤️ Favoris${favoris.length > 0 ? ` (${favoris.length})` : ''}` },
    { id: 'mes-besoins',     label: '📌 Mes besoins' },
    ...(isAdmin ? [
      { id: 'admin-ouvriers', label: '🛠️ Gérer ouvriers' },
      { id: 'admin-devis',    label: `📋 Devis (${devisList.length})` },
    ] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <style>{CSS}</style>

      <ToolHero
        icon="🏗️"
        badge="Artisans · Devis · Corps de métier"
        title="Espace"
        titleAccent="Ouvrier"
        subtitle="Trouvez le bon professionnel qualifié parmi maçons, électriciens, plombiers, menuisiers et 20+ corps de métier au Sénégal"
        accentColor="#EA580C"
        accentFrom="#1c0a03"
        accentTo="#c2410c"
        stats={[['🔨', `${ouvriers.filter(o => o.statut_dispo === 'Disponible maintenant').length} disponibles`], ['⭐', 'Avis certifiés'], ['📋', 'Devis rapide'], ['🗺️', 'Tout le Sénégal']]}
      >
        <div className="tool-tabs" style={{ marginTop: 8 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              className={`tool-tab ${view === t.id || (view === 'profil' && t.id === 'explorer') || (view === 'demander-devis' && t.id === 'explorer') ? 'active' : ''}`}
              style={{ '--accent': '#EA580C' }}>
              {t.label}
            </button>
          ))}
        </div>
      </ToolHero>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px 80px' }}>
        <ToolInfoPanel
          toolName="Espace Ouvrier"
          icon="🏗️"
          description="Trouvez le bon professionnel qualifié — ou inscrivez-vous comme prestataire et développez votre clientèle"
          benefits={[
            'Recherchez parmi maçons, électriciens, plombiers, menuisiers, peintres et 20+ corps de métier',
            'Filtrez par disponibilité (libre maintenant / en chantier), ville, note et tarif',
            'Consultez galeries de réalisations, avis détaillés et notes par critère',
            'Demandez un devis directement depuis le profil — réponse rapide garantie',
            'Sauvegardez vos ouvriers favoris et publiez vos besoins en quelques clics',
          ]}
          howToUse={[
            'Recherchez par métier, ville et statut de disponibilité',
            'Cliquez sur un profil pour voir galerie, avis et contacter directement',
            'Cliquez "Demander un devis" pour recevoir une estimation précise',
            'Ajoutez aux favoris pour retrouver facilement vos artisans de confiance',
            'Ouvrier ? Inscrivez-vous gratuitement avec photos de vos réalisations',
          ]}
          tips={[
            'Préférez les profils "Top Ouvrier" (★4.5+ avec 5+ avis) pour les gros travaux',
            'Publiez un besoin avec photo du chantier pour des devis plus précis',
            'Le statut "En chantier" signifie disponible dans quelques jours — pas bloqué',
          ]}
        />

        {notif && (
          <div className={`tool-toast tool-toast--${notif.type} tp-fade-up`}>{notif.msg}</div>
        )}

        {/* ── SÉCURITÉ ── */}
        <div style={{ padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg,rgba(234,88,12,0.08),rgba(239,68,68,0.05))', border: '1px solid rgba(234,88,12,0.25)', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#EA580C', marginBottom: 4 }}>ABAWI vérifie ses professionnels</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Nous sélectionnons et contrôlons chaque profil. <strong style={{ color: '#EF4444' }}>Ne jamais envoyer d'argent</strong> avant d'avoir rencontré l'ouvrier et vérifié son identité. En cas de doute, contactez-nous. Nous n'acceptons pas les arnaqueurs ni les faussaires.
            </div>
          </div>
        </div>

        {/* ── EXPLORER ── */}
        {view === 'explorer' && (
          <ExplorerView
            ouvriers={filteredOuvriers}
            allCount={ouvriers.length}
            search={search} setSearch={setSearch}
            fMetier={fMetier} setFMetier={setFMetier}
            fVille={fVille} setFVille={setFVille}
            fStatut={fStatut} setFStatut={setFStatut}
            fNoteMin={fNoteMin} setFNoteMin={setFNoteMin}
            fTopOnly={fTopOnly} setFTopOnly={setFTopOnly}
            favoris={favoris} onToggleFav={toggleFavori}
            onSelect={o => { setSelected(o); setView('profil'); }}
            onBesoin={() => setView('publier-besoin')}
            onInscrire={() => setView('devenir-ouvrier')}
            isAdmin={isAdmin}
            onAdminEdit={o => { setEditingOuvrier(o); setView('devenir-ouvrier'); }}
            onAdminDelete={adminDeleteOuvrier}
          />
        )}

        {/* ── PROFIL ── */}
        {view === 'profil' && selected && (
          <OuvrierDetail
            ouvrier={selected}
            avis={avis.filter(a => a.ouvrier_id === selected.id)}
            isFav={favoris.includes(selected.id)}
            isOwn={selected.createur_id === membre?.id}
            isLoggedIn={isLoggedIn}
            devis={devisList.filter(d => d.ouvrier_id === selected.id && d.createur_id === membre?.id)}
            onBack={() => setView('explorer')}
            onDelete={() => { deleteOuvrier(selected.id); setView('explorer'); }}
            onAvis={data => soumettrAvis(selected.id, data)}
            onToggleFav={() => toggleFavori(selected.id)}
            onDevis={() => setView('demander-devis')}
          />
        )}

        {/* ── DEMANDER DEVIS ── */}
        {view === 'demander-devis' && selected && (
          <DemanderDevisView
            ouvrier={selected}
            membre={membre}
            onSubmit={envoyerDevis}
            onBack={() => setView('profil')}
          />
        )}

        {/* ── PUBLIER BESOIN ── */}
        {view === 'publier-besoin' && (
          <PublierBesoinView onPublish={publierBesoin} onBack={() => setView('explorer')} />
        )}

        {/* ── DEVENIR OUVRIER / ADMIN EDIT ── */}
        {view === 'devenir-ouvrier' && (
          isLoggedIn || isAdmin
            ? <DevenirOuvrierView
                initialData={editingOuvrier}
                onInscrit={editingOuvrier ? modifierOuvrier : inscrireOuvrier}
                onBack={() => { setEditingOuvrier(null); setView('explorer'); }}
              />
            : <EoAuthGate message="Connectez-vous pour créer votre profil d'ouvrier." onBack={() => setView('explorer')} />
        )}

        {/* ── FAVORIS ── */}
        {view === 'favoris' && (
          <MesFavorisView
            ouvriers={favOuvriers}
            favoris={favoris}
            onToggleFav={toggleFavori}
            onSelect={o => { setSelected(o); setView('profil'); }}
            onBack={() => setView('explorer')}
          />
        )}

        {/* ── MES BESOINS ── */}
        {view === 'mes-besoins' && (
          <MesBesoinsView
            besoins={isLoggedIn ? besoins.filter(b => b.createur_id === membre?.id) : besoins}
            onBack={() => setView('explorer')}
            onDelete={id => { if (confirm('Supprimer ce besoin ?')) setBesoins(besoins.filter(b => b.id !== id)); }}
          />
        )}

        {/* ── ADMIN OUVRIERS ── */}
        {view === 'admin-ouvriers' && isAdmin && (
          <AdminOuvriersView
            ouvriers={ouvriers}
            onEdit={o => { setEditingOuvrier(o); setView('devenir-ouvrier'); }}
            onDelete={adminDeleteOuvrier}
            onAdd={() => { setEditingOuvrier(null); setView('devenir-ouvrier'); }}
            onBack={() => setView('explorer')}
          />
        )}

        {/* ── ADMIN DEVIS ── */}
        {view === 'admin-devis' && isAdmin && (
          <AdminDevisView devisList={devisList} ouvriers={ouvriers} onBack={() => setView('explorer')} />
        )}
      </div>
    </div>
  );
}

// ─── ExplorerView ─────────────────────────────────────────────────────────────
function ExplorerView({ ouvriers, allCount, search, setSearch, fMetier, setFMetier, fVille, setFVille, fStatut, setFStatut, fNoteMin, setFNoteMin, fTopOnly, setFTopOnly, favoris, onToggleFav, onSelect, onBesoin, onInscrire, isAdmin, onAdminEdit, onAdminDelete }) {
  return (
    <div className="eo-anim">
      {/* Barre de recherche */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <input className="eo-input" placeholder="🔍 Nom, métier, spécialité, zone…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200, width: 'auto' }} />
        <select className="eo-select" value={fMetier} onChange={e => setFMetier(e.target.value)}>{METIERS.map(m => <option key={m}>{m}</option>)}</select>
        <select className="eo-select" value={fVille} onChange={e => setFVille(e.target.value)}>{VILLES.map(v => <option key={v}>{v}</option>)}</select>
        <select className="eo-select" value={fStatut} onChange={e => setFStatut(e.target.value)}>{STATUTS.map(s => <option key={s}>{s}</option>)}</select>
        <select className="eo-select" value={fNoteMin} onChange={e => setFNoteMin(Number(e.target.value))}>
          <option value={0}>Toutes notes</option>
          {[3, 4, 4.5].map(n => <option key={n} value={n}>★ {n}+</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {ouvriers.length} professionnel{ouvriers.length !== 1 ? 's' : ''} trouvé{ouvriers.length !== 1 ? 's' : ''}
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <input type="checkbox" checked={fTopOnly} onChange={e => setFTopOnly(e.target.checked)} />
            🏆 Top Ouvriers seulement
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="eo-btn-orange" onClick={onBesoin} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>📋 Publier un besoin</button>
          <button className="eo-btn-green" onClick={onInscrire} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>👷 S'inscrire</button>
        </div>
      </div>

      {ouvriers.length === 0 ? (
        <EoEmpty icon="🏗️" title={allCount === 0 ? 'Aucun ouvrier inscrit' : 'Aucun résultat'}
          text={allCount === 0 ? 'Soyez le premier ! Inscrivez votre profil ou publiez votre besoin.' : 'Essayez d\'autres filtres.'}
          cta="Publier un besoin" onCta={onBesoin} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {ouvriers.map(o => (
            <OuvrierCard key={o.id} ouvrier={o} isFav={favoris.includes(o.id)} onToggleFav={() => onToggleFav(o.id)} onClick={() => onSelect(o)} isAdmin={isAdmin} onAdminEdit={onAdminEdit} onAdminDelete={onAdminDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── OuvrierCard ──────────────────────────────────────────────────────────────
function OuvrierCard({ ouvrier, isFav, onToggleFav, onClick, isAdmin, onAdminEdit, onAdminDelete }) {
  const top = isTopOuvrier(ouvrier);
  const sc = statutColor(ouvrier.statut_dispo);
  return (
    <div className="eo-card eo-anim" style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }} onClick={onClick}>
      {top && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, padding: '2px 8px', borderRadius: 100, background: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: '0.62rem', fontWeight: 800 }}>🏆 Top Ouvrier</div>
      )}
      <button onClick={e => { e.stopPropagation(); onToggleFav(); }} style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }} title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
        {isFav ? '❤️' : '🤍'}
      </button>
      <div style={{ height: 100, background: 'linear-gradient(135deg,rgba(234,88,12,0.12),rgba(22,163,74,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {ouvrier.photo_url
          ? <img src={ouvrier.photo_url} alt={ouvrier.nom} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #EA580C' }} />
          : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(234,88,12,0.15)', border: '3px solid #EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👷</div>
        }
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ouvrier.nom}</h3>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: sc, background: `${sc}18`, padding: '2px 6px', borderRadius: 6, flexShrink: 0, marginLeft: 4 }}>● {ouvrier.statut_dispo || 'Disponible'}</span>
        </div>
        <p style={{ margin: '0 0 6px', fontSize: '0.82rem', fontWeight: 700, color: '#EA580C' }}>{ouvrier.metier}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {ouvrier.ville}{ouvrier.quartier ? ` · ${ouvrier.quartier}` : ''}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: noteColor(ouvrier.note || 0) }}>
            {ouvrier.note > 0 ? `${stars(ouvrier.note)} ${ouvrier.note}` : '—'}
          </span>
        </div>
        {(ouvrier.specialites || []).length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {ouvrier.specialites.slice(0, 3).map(s => (
              <span key={s} style={{ padding: '2px 6px', borderRadius: 6, background: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {ouvrier.tarif_jour ? <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16A34A' }}>{ouvrier.tarif_jour.toLocaleString()} FCFA/j</span> : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tarif à négocier</span>}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ouvrier.experience}</span>
        </div>
        {(ouvrier.galerie || []).length > 0 && (
          <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>📸 {ouvrier.galerie.length} photo{ouvrier.galerie.length > 1 ? 's' : ''} de réalisations</div>
        )}
        {isAdmin && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <button className="eo-btn-ghost" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => onAdminEdit(ouvrier)}>✏️ Modifier</button>
            <button className="eo-btn-red" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => onAdminDelete(ouvrier.id)}>🗑️ Supprimer</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OuvrierDetail ────────────────────────────────────────────────────────────
function OuvrierDetail({ ouvrier, avis, isFav, isOwn, isLoggedIn, devis, onBack, onDelete, onAvis, onToggleFav, onDevis }) {
  const [showAvisForm, setShowAvisForm] = useState(false);
  const [avisForm, setAvisForm] = useState({ auteur: '', note: 5, commentaire: '' });
  const [lightbox, setLightbox] = useState(null);

  function submitAvis(e) {
    e.preventDefault();
    if (!avisForm.auteur || !avisForm.commentaire) { alert('Remplissez tous les champs.'); return; }
    onAvis(avisForm);
    setAvisForm({ auteur: '', note: 5, commentaire: '' });
    setShowAvisForm(false);
  }

  const _ogP = new URLSearchParams({ n: ouvrier.nom, m: ouvrier.metier, v: ouvrier.ville });
  if (ouvrier.photo_url?.startsWith('https://')) _ogP.set('img', ouvrier.photo_url);
  const shareUrl = encodeURIComponent(`${window.location.origin}/outils/espace-ouvrier?ouvrier=${ouvrier.id}&${_ogP}`);
  const shareText = encodeURIComponent(`🏗️ ${ouvrier.metier} disponible à ${ouvrier.ville} — ${ouvrier.nom}\nContactez via Espace Ouvrier ABAWI`);
  const sc = statutColor(ouvrier.statut_dispo);

  return (
    <div className="eo-anim">
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={lightbox} alt="Réalisation" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={onBack} className="eo-btn-ghost">← Retour</button>
        <button onClick={onToggleFav} className="eo-btn-ghost" style={{ borderColor: isFav ? '#EF4444' : undefined, color: isFav ? '#EF4444' : undefined }}>
          {isFav ? '❤️ Favori' : '🤍 Ajouter aux favoris'}
        </button>
        {isOwn && <button onClick={onDelete} className="eo-btn-red">Supprimer profil</button>}
      </div>

      <div className="eo-card" style={{ padding: '28px', marginBottom: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 22 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {ouvrier.photo_url
              ? <img src={ouvrier.photo_url} alt={ouvrier.nom} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #EA580C' }} />
              : <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(234,88,12,0.12)', border: '3px solid #EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>👷</div>
            }
            <span style={{ position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: sc, border: '2px solid var(--bg-card)', display: 'block' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
              {isTopOuvrier(ouvrier) && <span className="eo-badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#D97706' }}>🏆 Top Ouvrier</span>}
              {ouvrier.certifie && <span className="eo-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>✓ Certifié</span>}
              <span className="eo-badge" style={{ background: `${sc}18`, color: sc }}>● {ouvrier.statut_dispo || 'Disponible'}</span>
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>{ouvrier.nom}</h2>
            <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#EA580C' }}>{ouvrier.metier}</p>
            <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              📍 {ouvrier.quartier ? `${ouvrier.quartier}, ` : ''}{ouvrier.ville} · {ouvrier.experience}
            </p>
            {ouvrier.note > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem', color: noteColor(ouvrier.note), fontWeight: 800 }}>{ouvrier.note}</span>
                <span style={{ color: '#F59E0B', fontSize: '1rem' }}>{stars(ouvrier.note)}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({ouvrier.avis_count} avis)</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }} className="eo-grid-3">
          {[
            { icon: '💰', label: 'Tarif / jour', val: ouvrier.tarif_jour ? `${ouvrier.tarif_jour.toLocaleString()} FCFA` : 'À négocier' },
            { icon: '⏱', label: 'Tarif / heure', val: ouvrier.tarif_heure ? `${ouvrier.tarif_heure.toLocaleString()} FCFA` : '—' },
            { icon: '🔨', label: 'Projets réalisés', val: `${ouvrier.projets_realises || 0}+` },
            { icon: '📅', label: 'Disponibilité', val: ouvrier.statut_dispo || 'Disponible maintenant' },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ padding: '12px', borderRadius: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {ouvrier.description && (
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>À propos</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.88rem', whiteSpace: 'pre-line' }}>{ouvrier.description}</p>
          </div>
        )}

        {/* Spécialités */}
        {(ouvrier.specialites || []).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Spécialités</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ouvrier.specialites.map(s => (
                <span key={s} style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)', fontSize: '0.82rem', color: '#EA580C', fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Zones d'intervention */}
        {(ouvrier.zones || []).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>📍 Zones d'intervention</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ouvrier.zones.map(z => (
                <span key={z} style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', fontSize: '0.82rem', color: '#16A34A', fontWeight: 600 }}>📍 {z}</span>
              ))}
            </div>
          </div>
        )}

        {/* Galerie de réalisations */}
        {(ouvrier.galerie || []).length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>📸 Galerie de réalisations</h3>
            <div className="eo-galerie">
              {ouvrier.galerie.map((url, i) => (
                <img key={i} src={url} alt={`Réalisation ${i + 1}`} onClick={() => setLightbox(url)} />
              ))}
            </div>
          </div>
        )}

        {/* Devis */}
        <div style={{ marginBottom: 16, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg,rgba(234,88,12,0.08),rgba(22,163,74,0.05))', border: '1px solid rgba(234,88,12,0.2)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>💡 Obtenir un devis</h3>
          <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Décrivez votre projet et recevez une estimation de coût et de délai.</p>
          <button className="eo-btn-orange" onClick={onDevis} style={{ padding: '10px 20px' }}>📋 Demander un devis gratuit</button>
          {devis.length > 0 && <span style={{ marginLeft: 12, fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>✓ {devis.length} devis envoyé{devis.length > 1 ? 's' : ''}</span>}
        </div>

        {/* Partage */}
        <div style={{ marginBottom: 22, padding: '12px 16px', borderRadius: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Partager ce profil</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              ['💬 WhatsApp', `https://wa.me/?text=${shareText}%20${shareUrl}`],
              ['✈️ Telegram', `https://t.me/share/url?url=${shareUrl}&text=${shareText}`],
              ['📘 Facebook', `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`],
              ['💼 LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`],
              ['𝕏 X (Twitter)', `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`],
            ].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="eo-btn-ghost" style={{ padding: '6px 10px', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block' }}>{label}</a>
            ))}
            <button className="eo-btn-ghost" onClick={() => navigator.clipboard?.writeText(decodeURIComponent(shareUrl)).then(() => alert('Lien copié !'))} style={{ padding: '6px 10px', fontSize: '0.78rem' }}>🔗 Copier</button>
          </div>
        </div>

        {/* Contacts */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {ouvrier.tel && (
            <a href={`tel:${ouvrier.tel}`} className="eo-btn-orange" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>📞 Appeler</a>
          )}
          {ouvrier.tel && (
            <a href={`https://wa.me/${ouvrier.tel.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${ouvrier.nom}, je vous contacte via Espace Ouvrier ABAWI. J'aurais besoin de vos services en tant que ${ouvrier.metier}.`)}`}
               target="_blank" rel="noreferrer" className="eo-btn-green" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              💬 WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Avis */}
      <div className="eo-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>⭐ Avis clients ({avis.length})</h3>
          {isLoggedIn && !showAvisForm && <button className="eo-btn-ghost" onClick={() => setShowAvisForm(true)}>+ Laisser un avis</button>}
        </div>

        {showAvisForm && (
          <form onSubmit={submitAvis} style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="eo-input" placeholder="Votre nom" value={avisForm.auteur} onChange={e => setAvisForm(f => ({ ...f, auteur: e.target.value }))} required />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Note :</label>
              <select className="eo-select" value={avisForm.note} onChange={e => setAvisForm(f => ({ ...f, note: Number(e.target.value) }))}>
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{stars(n)} ({n}/5)</option>)}
              </select>
            </div>
            <textarea className="eo-input" placeholder="Votre commentaire…" rows={3} value={avisForm.commentaire} onChange={e => setAvisForm(f => ({ ...f, commentaire: e.target.value }))} required style={{ resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="eo-btn-orange" style={{ padding: '8px 18px' }}>Publier</button>
              <button type="button" className="eo-btn-ghost" onClick={() => setShowAvisForm(false)}>Annuler</button>
            </div>
          </form>
        )}

        {avis.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucun avis pour le moment. Soyez le premier !</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {avis.map(a => (
              <div key={a.id} style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{a.auteur}</span>
                  <span style={{ color: '#F59E0B', fontSize: '0.85rem' }}>{stars(a.note)}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.commentaire}</p>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>{dateFR(a.date)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DemanderDevisView ────────────────────────────────────────────────────────
function DemanderDevisView({ ouvrier, membre, onSubmit, onBack }) {
  const [form, setForm] = useState({
    ouvrier_id: ouvrier.id,
    ouvrier_nom: ouvrier.nom,
    metier: ouvrier.metier,
    nom_client: membre ? `${membre.prenom || ''} ${membre.nom || ''}`.trim() : '',
    tel: membre?.telephone || '',
    email: membre?.email || '',
    description: '',
    budget: '',
    delai: '',
    adresse: '',
    urgence: false,
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom_client || !form.tel || !form.description) { alert('Nom, téléphone et description requis.'); return; }
    onSubmit(form);
  }

  return (
    <div className="eo-anim">
      <button onClick={onBack} className="eo-btn-ghost" style={{ marginBottom: 16 }}>← Retour au profil</button>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>📋 Demande de devis</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>Pour : <strong style={{ color: '#EA580C' }}>{ouvrier.nom}</strong> · {ouvrier.metier}</p>

      <form onSubmit={handleSubmit} className="eo-card" style={{ padding: '28px', maxWidth: 680 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="eo-grid-2">
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Votre nom *</label>
              <input className="eo-input" value={form.nom_client} onChange={e => setForm(f => ({ ...f, nom_client: e.target.value }))} required placeholder="Amadou Diallo" />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Téléphone *</label>
              <input className="eo-input" type="tel" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} required placeholder="77 XXX XX XX" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email (optionnel)</label>
            <input className="eo-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="vous@email.com" />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Adresse / Localisation du chantier</label>
            <input className="eo-input" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Ex: Almadies, Dakar" />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description des travaux *</label>
            <textarea className="eo-input" placeholder="Décrivez les travaux à réaliser en détail (surface, type de travaux, matériaux, contraintes…)" rows={5} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="eo-grid-2">
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Budget estimé</label>
              <input className="eo-input" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="Ex: 200 000 FCFA" />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Délai souhaité</label>
              <input className="eo-input" value={form.delai} onChange={e => setForm(f => ({ ...f, delai: e.target.value }))} placeholder="Ex: 1 semaine, avant le 30/06" />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={form.urgence} onChange={e => setForm(f => ({ ...f, urgence: e.target.checked }))} /> 🔴 Demande urgente (réponse sous 24h souhaitée)
          </label>
          <button type="submit" className="eo-btn-orange" style={{ padding: '14px', fontSize: '1rem', marginTop: 4 }}>📋 Envoyer ma demande de devis</button>
        </div>
      </form>
    </div>
  );
}

// ─── PublierBesoinView ────────────────────────────────────────────────────────
function PublierBesoinView({ onPublish, onBack }) {
  const [form, setForm] = useState({ titre: '', metier: 'Maçon', description: '', ville: 'Dakar', quartier: '', budget: '', duree: '', urgence: false, contact_tel: '', contact_email: '', photo_url: '' });
  const photoRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { const url = await uploadFile(file, 'covers', 'besoins'); setForm(f => ({ ...f, photo_url: url })); }
    catch (err) { alert('Erreur photo : ' + err.message); }
    setUploading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.titre || !form.description || !form.contact_tel) { alert('Titre, description et téléphone obligatoires.'); return; }
    onPublish(form);
  }

  return (
    <div className="eo-anim">
      <button onClick={onBack} className="eo-btn-ghost" style={{ marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>📋 Publier un besoin en professionnel</h2>
      <form onSubmit={handleSubmit} className="eo-card" style={{ padding: '28px', maxWidth: 680 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input className="eo-input" placeholder="Titre (ex: Besoin électricien urgent) *" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="eo-grid-2">
            <select className="eo-select" value={form.metier} onChange={e => setForm(f => ({ ...f, metier: e.target.value }))}>{METIERS.slice(1).map(m => <option key={m}>{m}</option>)}</select>
            <select className="eo-select" value={form.ville}  onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}>{VILLES.slice(1).map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <input className="eo-input" placeholder="Quartier précis (optionnel)" value={form.quartier} onChange={e => setForm(f => ({ ...f, quartier: e.target.value }))} />
          <textarea className="eo-input" placeholder="Décrivez votre besoin en détail… *" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: 'vertical' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="eo-grid-2">
            <input className="eo-input" placeholder="Budget (ex: 30 000 FCFA)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
            <input className="eo-input" placeholder="Durée estimée (ex: 2 jours)" value={form.duree} onChange={e => setForm(f => ({ ...f, duree: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="eo-grid-2">
            <input className="eo-input" type="tel" placeholder="Téléphone de contact *" value={form.contact_tel} onChange={e => setForm(f => ({ ...f, contact_tel: e.target.value }))} required />
            <input className="eo-input" type="email" placeholder="Email (optionnel)" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.urgence} onChange={e => setForm(f => ({ ...f, urgence: e.target.checked }))} /> 🔴 Besoin urgent
            </label>
            <div>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              <button type="button" onClick={() => photoRef.current?.click()} disabled={uploading} className="eo-btn-ghost" style={{ fontSize: '0.78rem' }}>
                {uploading ? '⏳' : form.photo_url ? '✅ Photo chargée' : '📷 Photo du chantier'}
              </button>
            </div>
          </div>
          {form.photo_url && <img src={form.photo_url} alt="Aperçu" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />}
          <button type="submit" className="eo-btn-orange" style={{ padding: '14px', fontSize: '1rem', marginTop: 4 }}>📋 Publier mon besoin</button>
        </div>
      </form>
    </div>
  );
}

// ─── DevenirOuvrierView ───────────────────────────────────────────────────────
function DevenirOuvrierView({ onInscrit, onBack, initialData }) {
  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        nom: initialData.nom || '',
        metier: initialData.metier || 'Maçon',
        specialites: (initialData.specialites || []).join(', '),
        experience: initialData.experience || '1-3 ans',
        ville: initialData.ville || 'Dakar',
        quartier: initialData.quartier || '',
        zones: (initialData.zones || []).join(', '),
        tarif_jour: initialData.tarif_jour || '',
        tarif_heure: initialData.tarif_heure || '',
        statut_dispo: initialData.statut_dispo || 'Disponible maintenant',
        description: initialData.description || '',
        tel: initialData.tel || '',
        certifie: initialData.certifie || false,
        photo_url: initialData.photo_url || '',
        galerie: initialData.galerie || [],
      };
    }
    return { nom: '', metier: 'Maçon', specialites: '', experience: '1-3 ans', ville: 'Dakar', quartier: '', zones: '', tarif_jour: '', tarif_heure: '', statut_dispo: 'Disponible maintenant', description: '', tel: '', certifie: false, photo_url: '', galerie: [] };
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingGal, setUploadingGal] = useState(false);
  const photoRef = useRef(null);
  const galerieRef = useRef(null);

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { const url = await uploadFile(file, 'images', 'ouvriers'); setForm(f => ({ ...f, photo_url: url })); }
    catch (err) { alert('Erreur photo : ' + err.message); }
    setUploading(false);
  }

  async function handleGalerie(e) {
    const files = [...e.target.files].slice(0, 6 - form.galerie.length);
    if (!files.length) return;
    setUploadingGal(true);
    try {
      const urls = await Promise.all(files.map(f => uploadFile(f, 'images', 'realisations')));
      setForm(f => ({ ...f, galerie: [...f.galerie, ...urls].slice(0, 6) }));
    } catch (err) { alert('Erreur galerie : ' + err.message); }
    setUploadingGal(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom || !form.tel) { alert('Nom et téléphone obligatoires.'); return; }
    onInscrit({
      ...form,
      specialites: form.specialites.split(',').map(s => s.trim()).filter(Boolean),
      zones: form.zones.split(',').map(z => z.trim()).filter(Boolean),
      tarif_jour: Number(form.tarif_jour) || 0,
      tarif_heure: Number(form.tarif_heure) || 0,
    });
  }

  return (
    <div className="eo-anim">
      <button onClick={onBack} className="eo-btn-ghost" style={{ marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>{initialData ? '✏️ Modifier le profil' : '👷 Créer mon profil professionnel'}</h2>
      <form onSubmit={handleSubmit} className="eo-card" style={{ padding: '28px', maxWidth: 700 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="eo-grid-2">
            <input className="eo-input" placeholder="Nom complet *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
            <select className="eo-select" value={form.metier} onChange={e => setForm(f => ({ ...f, metier: e.target.value }))}>{METIERS.slice(1).map(m => <option key={m}>{m}</option>)}</select>
          </div>
          <input className="eo-input" placeholder="Spécialités (séparées par virgules : ex. Câblage, Domotique, Solaire)" value={form.specialites} onChange={e => setForm(f => ({ ...f, specialites: e.target.value }))} />
          <input className="eo-input" placeholder="Zones d'intervention (ex. Plateau, Almadies, Parcelles)" value={form.zones} onChange={e => setForm(f => ({ ...f, zones: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }} className="eo-grid-3">
            <select className="eo-select" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}>
              {EXPS.map(e => <option key={e}>{e}</option>)}
            </select>
            <select className="eo-select" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}>{VILLES.slice(1).map(v => <option key={v}>{v}</option>)}</select>
            <input className="eo-input" placeholder="Quartier" value={form.quartier} onChange={e => setForm(f => ({ ...f, quartier: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="eo-grid-2">
            <input className="eo-input" type="number" placeholder="Tarif journalier (FCFA)" value={form.tarif_jour} onChange={e => setForm(f => ({ ...f, tarif_jour: e.target.value }))} />
            <input className="eo-input" type="number" placeholder="Tarif horaire (FCFA)" value={form.tarif_heure} onChange={e => setForm(f => ({ ...f, tarif_heure: e.target.value }))} />
          </div>
          <select className="eo-select" value={form.statut_dispo} onChange={e => setForm(f => ({ ...f, statut_dispo: e.target.value }))}>
            {STATUTS.slice(1).map(d => <option key={d}>{d}</option>)}
          </select>
          <textarea className="eo-input" placeholder="Parlez de vous, vos expériences passées, vos points forts…" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          <input className="eo-input" type="tel" placeholder="Téléphone / WhatsApp *" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} required />

          {/* Photo profil + Galerie */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              <button type="button" onClick={() => photoRef.current?.click()} disabled={uploading} className="eo-btn-ghost" style={{ fontSize: '0.78rem' }}>
                {uploading ? '⏳' : form.photo_url ? '✅ Photo profil' : '📷 Ma photo de profil'}
              </button>
            </div>
            <div>
              <input ref={galerieRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleGalerie} />
              <button type="button" onClick={() => galerieRef.current?.click()} disabled={uploadingGal || form.galerie.length >= 6} className="eo-btn-ghost" style={{ fontSize: '0.78rem' }}>
                {uploadingGal ? '⏳' : `📸 Galerie réalisations (${form.galerie.length}/6)`}
              </button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.certifie} onChange={e => setForm(f => ({ ...f, certifie: e.target.checked }))} /> ✓ Certifié / attestation
            </label>
          </div>

          {form.photo_url && <img src={form.photo_url} alt="Profil" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #EA580C' }} />}
          {form.galerie.length > 0 && (
            <div className="eo-galerie">
              {form.galerie.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} alt={`Réalisation ${i + 1}`} style={{ pointerEvents: 'none' }} />
                  <button type="button" onClick={() => setForm(f => ({ ...f, galerie: f.galerie.filter((_, j) => j !== i) }))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: '#fff', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <button type="submit" className={initialData ? 'eo-btn-orange' : 'eo-btn-green'} style={{ padding: '14px', fontSize: '1rem', marginTop: 4 }}>{initialData ? '💾 Enregistrer les modifications' : '👷 Créer mon profil'}</button>
        </div>
      </form>
    </div>
  );
}

// ─── MesFavorisView ───────────────────────────────────────────────────────────
function MesFavorisView({ ouvriers, favoris, onToggleFav, onSelect, onBack }) {
  return (
    <div className="eo-anim">
      <button onClick={onBack} className="eo-btn-ghost" style={{ marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>❤️ Mes ouvriers favoris ({ouvriers.length})</h2>
      {ouvriers.length === 0 ? (
        <EoEmpty icon="❤️" title="Aucun favori" text="Sauvegardez vos ouvriers de confiance en cliquant sur le cœur." cta="Trouver un ouvrier" onCta={onBack} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {ouvriers.map(o => (
            <OuvrierCard key={o.id} ouvrier={o} isFav={favoris.includes(o.id)} onToggleFav={() => onToggleFav(o.id)} onClick={() => onSelect(o)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MesBesoinsView ───────────────────────────────────────────────────────────
function MesBesoinsView({ besoins, onBack, onDelete }) {
  return (
    <div className="eo-anim">
      <button onClick={onBack} className="eo-btn-ghost" style={{ marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>📌 Mes besoins publiés ({besoins.length})</h2>
      {besoins.length === 0 ? (
        <EoEmpty icon="📌" title="Aucun besoin publié" text="Publiez votre besoin pour être contacté par des professionnels qualifiés." cta="Publier un besoin" onCta={onBack} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {besoins.map(b => (
            <div key={b.id} className="eo-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  {b.urgence && <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: '0.72rem', fontWeight: 800 }}>🔴 Urgent</span>}
                  <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(234,88,12,0.1)', color: '#EA580C', fontSize: '0.72rem', fontWeight: 700 }}>{b.metier}</span>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{b.titre}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📍 {b.quartier ? `${b.quartier}, ` : ''}{b.ville} · {dateFR(b.date_pub)}</div>
                {b.budget && <div style={{ fontSize: '0.82rem', color: '#16A34A', fontWeight: 700, marginTop: 2 }}>💰 {b.budget}</div>}
              </div>
              <button onClick={() => onDelete(b.id)} className="eo-btn-red" style={{ padding: '6px 12px', fontSize: '0.78rem', flexShrink: 0 }}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AdminOuvriersView ────────────────────────────────────────────────────────
function AdminOuvriersView({ ouvriers, onEdit, onDelete, onAdd, onBack }) {
  const [q, setQ] = useState('');
  const filtered = q
    ? ouvriers.filter(o => o.nom.toLowerCase().includes(q.toLowerCase()) || o.metier.toLowerCase().includes(q.toLowerCase()))
    : ouvriers;
  return (
    <div className="eo-anim">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} className="eo-btn-ghost">← Retour</button>
        <button className="eo-btn-green" onClick={onAdd}>+ Ajouter un ouvrier</button>
      </div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>🛠️ Gestion des ouvriers ({ouvriers.length})</h2>
      <input className="eo-input" placeholder="Rechercher un ouvrier…" value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 16, maxWidth: 400 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(o => (
          <div key={o.id} className="eo-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              {o.photo_url ? (
                <img src={o.photo_url} alt={`Photo de ${o.nom}`} width={44} height={44} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #EA580C' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(234,88,12,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👷</div>
              )}
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{o.nom}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.metier} · {o.ville} · {o.statut_dispo || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="eo-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => onEdit(o)}>✏️ Modifier</button>
              <button className="eo-btn-red" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => onDelete(o.id)}>🗑️ Supprimer</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucun ouvrier trouvé.</p>}
      </div>
    </div>
  );
}

// ─── AdminDevisView ───────────────────────────────────────────────────────────
function AdminDevisView({ devisList, ouvriers, onBack }) {
  const [q, setQ] = useState('');
  const filtered = q
    ? devisList.filter(d => (d.nom_client || '').toLowerCase().includes(q.toLowerCase()) || (d.ouvrier_nom || '').toLowerCase().includes(q.toLowerCase()))
    : devisList;
  return (
    <div className="eo-anim">
      <button onClick={onBack} className="eo-btn-ghost" style={{ marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>📋 Demandes de devis ({devisList.length})</h2>
      <input className="eo-input" placeholder="Rechercher un devis…" value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 16, maxWidth: 400 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(d => {
          const ouvrier = ouvriers.find(o => o.id === d.ouvrier_id);
          return (
            <div key={d.id} className="eo-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>📋 Devis pour {d.ouvrier_nom || '—'}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.metier} · {dateFR(d.date)}</div>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: d.urgence ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.1)', color: d.urgence ? '#EF4444' : '#10B981', fontSize: '0.72rem', fontWeight: 700 }}>{d.urgence ? '🔴 Urgent' : '✓ Reçu'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 10, fontSize: '0.82rem' }}>
                <div><strong style={{ color: 'var(--text-secondary)' }}>Client :</strong> {d.nom_client}</div>
                <div><strong style={{ color: 'var(--text-secondary)' }}>Tél :</strong> {d.tel}</div>
                <div><strong style={{ color: 'var(--text-secondary)' }}>Email :</strong> {d.email || '—'}</div>
                <div><strong style={{ color: 'var(--text-secondary)' }}>Budget :</strong> {d.budget || '—'}</div>
                <div><strong style={{ color: 'var(--text-secondary)' }}>Délai :</strong> {d.delai || '—'}</div>
                <div><strong style={{ color: 'var(--text-secondary)' }}>Adresse :</strong> {d.adresse || '—'}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {d.description}
              </div>
              {ouvrier && (
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  👷 Ouvrier : {ouvrier.nom} · {ouvrier.tel}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune demande de devis.</p>}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function EoEmpty({ icon, title, text, cta, onCta }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: '0.85rem', maxWidth: 340, margin: '0 auto 20px' }}>{text}</p>
      {cta && <button className="eo-btn-orange" onClick={onCta}>{cta}</button>}
    </div>
  );
}

function EoAuthGate({ message, onBack }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>{message}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/connexion" style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#EA580C,#C2410C)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>Se connecter</a>
        <button className="eo-btn-ghost" onClick={onBack}>← Retour</button>
      </div>
    </div>
  );
}
