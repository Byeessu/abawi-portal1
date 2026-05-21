import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadFile } from '../../lib/uploadFile';
import ToolInfoPanel from '../../components/ToolInfoPanel';
import { supabase } from '../../lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────
const METIERS = ['Tous', 'Maçon', 'Électricien', 'Plombier', 'Carreleur', 'Menuisier', 'Peintre', 'Soudeur', 'Mécanicien auto', 'Chauffeur', 'Jardinier', 'Gardien/Vigile', 'Femme de ménage', 'Cuisinier/Traiteur', 'Informaticien', 'Couturier', 'Technicien froid/clim', 'Charpentier', 'Plâtrier', 'Autres'];
const VILLES  = ['Toutes', 'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 'Touba', 'Mbour', 'Rufisque', 'Pikine', 'Guédiawaye'];
const DISPOS  = ['Tous', 'Disponible maintenant', 'Disponible sous 1 semaine', 'Disponible sous 1 mois'];
const NOTES   = [0, 1, 2, 3, 4, 5];

const OUVRIERS_KEY = 'placeouvrier_ouvriers_v1';
const BESOINS_KEY  = 'placeouvrier_besoins_v1';
const AVIS_KEY     = 'placeouvrier_avis_v1';

function load(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function save(key, d) { try { localStorage.setItem(key, JSON.stringify(d)); } catch { /* ignore */ } }
function newId(p = 'x') { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }
function dateFR(iso) { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }
function stars(n) { return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n)); }
function noteColor(n) { return n >= 4.5 ? '#10B981' : n >= 3.5 ? '#F59E0B' : '#EF4444'; }

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
@keyframes poFadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.po-anim { animation: poFadeIn 0.3s ease-out; }
.po-card { background:var(--bg-card); border:1px solid var(--border); border-radius:16px; transition:all 0.2s; }
.po-card:hover { transform:translateY(-3px); box-shadow:0 10px 30px rgba(0,0,0,0.12); }
.po-btn-orange { background:linear-gradient(135deg,#EA580C,#C2410C); color:#fff; border:none; border-radius:10px; padding:10px 18px; font-weight:700; cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.po-btn-orange:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(234,88,12,0.35); }
.po-btn-green { background:linear-gradient(135deg,#16A34A,#15803D); color:#fff; border:none; border-radius:10px; padding:10px 18px; font-weight:700; cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.po-btn-green:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(22,163,74,0.35); }
.po-btn-ghost { background:transparent; border:1px solid var(--border); border-radius:10px; padding:8px 14px; color:var(--text-secondary); cursor:pointer; font-size:0.82rem; font-weight:600; transition:all 0.2s; }
.po-btn-ghost:hover { border-color:#EA580C; color:#EA580C; }
.po-input { background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary); border-radius:10px; padding:10px 14px; font-size:0.88rem; outline:none; font-family:Outfit,sans-serif; }
.po-input:focus { border-color:#EA580C; box-shadow:0 0 0 3px rgba(234,88,12,0.12); }
.po-select { background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary); border-radius:10px; padding:8px 12px; font-size:0.82rem; outline:none; cursor:pointer; }
.po-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:100px; font-size:0.72rem; font-weight:700; }
.po-tab { padding:8px 16px; border-radius:100px; border:2px solid transparent; cursor:pointer; font-weight:500; font-size:0.82rem; transition:all 0.2s; white-space:nowrap; }
.po-tab-active { border-color:#EA580C; background:rgba(234,88,12,0.1); color:#EA580C; font-weight:700; }
.po-tab-inactive { border-color:var(--border); background:transparent; color:var(--text-secondary); }
`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PlaceOuvrier() {
  const { membre } = useAuth();
  const isLoggedIn = !!membre?.id;

  const [ouvriers, setOuvriers]     = useState([]);
  const [besoins, setBesoins]       = useState([]);
  const [avis, setAvis]             = useState([]);
  const [dbLoading, setDbLoading]   = useState(true);
  const [view, setView]             = useState('explorer');
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState('');
  const [fMetier, setFMetier]       = useState('Tous');
  const [fVille, setFVille]         = useState('Toutes');
  const [fDispo, setFDispo]         = useState('Tous');
  const [fNoteMin, setFNoteMin]     = useState(0);
  const [notif, setNotif]           = useState(null);

  // ── Supabase: chargement initial + temps réel ──
  useEffect(() => {
    async function load() {
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
    load();
    const channel = supabase.channel('po-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ouvriers_profils' }, ({ new: r }) => setOuvriers(p => [r, ...p]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ouvriers_besoins' }, ({ new: r }) => setBesoins(p => [r, ...p]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ouvriers_profils' }, ({ old: r }) => setOuvriers(p => p.filter(o => o.id !== r.id)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ouvriers_besoins' }, ({ old: r }) => setBesoins(p => p.filter(b => b.id !== r.id)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
      if (target) { Promise.resolve().then(() => setSelected(target)); Promise.resolve().then(() => setView('profil')); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOuvriers = ouvriers
    .filter(o => o.statut === 'actif')
    .filter(o => fMetier === 'Tous' || o.metier === fMetier)
    .filter(o => fVille === 'Toutes' || o.ville === fVille)
    .filter(o => fDispo === 'Tous' || o.disponibilite === fDispo)
    .filter(o => (o.note || 0) >= fNoteMin)
    .filter(o => !search || o.nom.toLowerCase().includes(search.toLowerCase()) || o.metier.toLowerCase().includes(search.toLowerCase()) || (o.specialites || []).some(s => s.toLowerCase().includes(search.toLowerCase())));

  async function inscrireOuvrier(data) {
    const row = { ...data, note: 0, avis_count: 0, statut: 'actif', membre_id: membre?.id || null };
    const { data: created, error } = await supabase.from('ouvriers_profils').insert(row).select().single();
    if (error) { setNotif({ type: 'error', msg: '❌ ' + error.message }); return; }
    setOuvriers(p => [created, ...p]);
    setView('explorer');
    setNotif({ type: 'success', msg: `Profil de ${data.nom} publié avec succès !` });
  }

  async function publierBesoin(data) {
    const row = { ...data, statut: 'actif', membre_id: membre?.id || null };
    const { data: created, error } = await supabase.from('ouvriers_besoins').insert(row).select().single();
    if (error) { setNotif({ type: 'error', msg: '❌ ' + error.message }); return; }
    setBesoins(p => [created, ...p]);
    setView('mes-besoins');
    setNotif({ type: 'success', msg: 'Besoin publié ! Les ouvriers concernés seront notifiés.' });
  }

  async function soumettrAvis(ouvrierId, data) {
    const { data: created, error } = await supabase.from('ouvriers_avis').insert({ ouvrier_id: ouvrierId, ...data, membre_id: membre?.id || null }).select().single();
    if (error) { setNotif({ type: 'error', msg: '❌ ' + error.message }); return; }
    const newAvis = [created, ...avis];
    setAvis(newAvis);
    const ouvriersAvis = newAvis.filter(a => a.ouvrier_id === ouvrierId);
    const avg = ouvriersAvis.reduce((s, a) => s + (a.note || 0), 0) / ouvriersAvis.length;
    const avgRounded = Math.round(avg * 10) / 10;
    await supabase.from('ouvriers_profils').update({ note: avgRounded, avis_count: ouvriersAvis.length }).eq('id', ouvrierId);
    setOuvriers(p => p.map(o => o.id === ouvrierId ? { ...o, note: avgRounded, avis_count: ouvriersAvis.length } : o));
    if (selected?.id === ouvrierId) setSelected(s => ({ ...s, note: avgRounded, avis_count: ouvriersAvis.length }));
    setNotif({ type: 'success', msg: 'Avis publié. Merci !' });
  }

  async function deleteOuvrier(id) {
    if (!confirm('Supprimer ce profil ?')) return;
    await supabase.from('ouvriers_profils').delete().eq('id', id);
    setOuvriers(p => p.filter(o => o.id !== id));
  }

  const TABS = [
    { id: 'explorer',       label: '🔍 Trouver un ouvrier' },
    { id: 'publier-besoin', label: '📋 Publier un besoin' },
    { id: 'devenir-ouvrier',label: '👷 Devenir ouvrier' },
    { id: 'mes-besoins',    label: '📌 Mes besoins' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,rgba(234,88,12,0.15),rgba(0,0,0,0))', borderBottom: '1px solid var(--border)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <span style={{ fontSize: '2rem' }}>🔧</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>Place Ouvrier</h1>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Trouvez un ouvrier qualifié près de chez vous · {ouvriers.filter(o => o.statut === 'actif' && o.disponible).length} disponibles maintenant</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setView(t.id)}
                className={`po-tab ${view === t.id || (view === 'profil' && t.id === 'explorer') ? 'po-tab-active' : 'po-tab-inactive'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px 80px' }}>
        <ToolInfoPanel
          toolName="Place Ouvrier"
          icon="🔧"
          description="Trouvez le bon ouvrier qualifié selon votre métier, ville et disponibilité — ou inscrivez-vous comme prestataire"
          benefits={[
            'Recherchez parmi maçons, électriciens, plombiers, menuisiers, peintres et 15+ corps de métier',
            'Filtrez par disponibilité, ville, note et tarif journalier pour trouver exactement ce qu\'il vous faut',
            'Consultez les avis et notes des clients précédents pour choisir en confiance',
            'Contactez directement par WhatsApp ou téléphone — zéro intermédiaire',
            'Inscrivez votre profil d\'ouvrier gratuitement pour recevoir des missions dans votre secteur',
          ]}
          howToUse={[
            'Choisissez le corps de métier, la ville et la disponibilité souhaitée',
            'Parcourez les profils avec leurs notes, tarifs et spécialités',
            'Cliquez sur un profil pour voir les détails et contacter directement',
            'Publiez un besoin si vous n\'avez pas trouvé : les ouvriers disponibles vous contacteront',
            'Vous êtes ouvrier ? Inscrivez-vous gratuitement et recevez des missions',
          ]}
          tips={[
            'Préférez les ouvriers certifiés avec 10+ avis pour les travaux importants',
            'Le tarif journalier n\'inclut pas les matériaux — précisez-le dans votre besoin',
            'Publiez votre besoin avec photo si possible pour des devis plus précis',
          ]}
        />

        {notif && (
          <div className="po-anim" style={{
            position: 'fixed', top: 20, right: 20, zIndex: 100,
            padding: '12px 20px', borderRadius: 12, backdropFilter: 'blur(8px)',
            background: notif.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(234,88,12,0.15)',
            border: `1px solid ${notif.type === 'success' ? '#10B981' : '#EA580C'}`,
            color: notif.type === 'success' ? '#10B981' : '#EA580C',
            fontWeight: 600, fontSize: '0.85rem',
          }}>{notif.msg}</div>
        )}

        {/* ── EXPLORER / PROFIL ── */}
        {(view === 'explorer' || view === 'profil') && (
          <>
            {view === 'explorer' && (
              <>
                {/* Barre de recherche */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  <input className="po-input" placeholder="🔍 Nom, métier, spécialité…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                  <select className="po-select" value={fMetier} onChange={e => setFMetier(e.target.value)}>{METIERS.map(m => <option key={m}>{m}</option>)}</select>
                  <select className="po-select" value={fVille}  onChange={e => setFVille(e.target.value)}>{VILLES.map(v => <option key={v}>{v}</option>)}</select>
                  <select className="po-select" value={fDispo}  onChange={e => setFDispo(e.target.value)}>{DISPOS.map(d => <option key={d}>{d}</option>)}</select>
                  <select className="po-select" value={fNoteMin} onChange={e => setFNoteMin(Number(e.target.value))}>
                    <option value={0}>Toutes notes</option>
                    {[3, 4, 4.5].map(n => <option key={n} value={n}>★ {n}+</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {filteredOuvriers.length} ouvrier{filteredOuvriers.length !== 1 ? 's' : ''} trouvé{filteredOuvriers.length !== 1 ? 's' : ''}
                  </h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="po-btn-orange" onClick={() => setView('publier-besoin')}>📋 Publier un besoin</button>
                    <button className="po-btn-green" onClick={() => setView('devenir-ouvrier')}>👷 S'inscrire</button>
                  </div>
                </div>

                {filteredOuvriers.length === 0 ? (
                  <PoEmpty icon="🔧" title={ouvriers.length === 0 ? 'Aucun ouvrier inscrit' : 'Aucun résultat'} text={ouvriers.length === 0 ? 'Soyez le premier ! Inscrivez votre profil ou publiez votre besoin.' : 'Essayez d\'autres filtres.'} cta="Publier un besoin" onCta={() => setView('publier-besoin')} />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {filteredOuvriers.map(o => (
                      <OuvrierCard key={o.id} ouvrier={o} onClick={() => { setSelected(o); setView('profil'); }} />
                    ))}
                  </div>
                )}
              </>
            )}

            {view === 'profil' && selected && (
              <OuvrierDetail
                ouvrier={selected}
                avis={avis.filter(a => a.ouvrier_id === selected.id)}
                isOwn={selected.createur_id === membre?.id}
                isLoggedIn={isLoggedIn}
                onBack={() => setView('explorer')}
                onDelete={() => { deleteOuvrier(selected.id); setView('explorer'); }}
                onAvis={data => soumettrAvis(selected.id, data)}
              />
            )}
          </>
        )}

        {/* ── PUBLIER BESOIN ── */}
        {view === 'publier-besoin' && (
          <PublierBesoinView onPublish={publierBesoin} onBack={() => setView('explorer')} />
        )}

        {/* ── DEVENIR OUVRIER ── */}
        {view === 'devenir-ouvrier' && (
          isLoggedIn ? (
            <DevenirOuvrierView onInscrit={inscrireOuvrier} onBack={() => setView('explorer')} />
          ) : (
            <PoAuthGate message="Connectez-vous pour créer votre profil d'ouvrier." onBack={() => setView('explorer')} />
          )
        )}

        {/* ── MES BESOINS ── */}
        {view === 'mes-besoins' && (
          <MesBesoinsView
            besoins={isLoggedIn ? besoins.filter(b => b.createur_id === membre?.id) : besoins}
            onBack={() => setView('explorer')}
            onDelete={id => { if (confirm('Supprimer ce besoin ?')) setBesoins(besoins.filter(b => b.id !== id)); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── OuvrierCard ──────────────────────────────────────────────────────────────
function OuvrierCard({ ouvrier, onClick }) {
  return (
    <div className="po-card po-anim" style={{ cursor: 'pointer', overflow: 'hidden' }} onClick={onClick}>
      <div style={{ height: 100, background: 'linear-gradient(135deg,rgba(234,88,12,0.12),rgba(22,163,74,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {ouvrier.photo_url
          ? <img src={ouvrier.photo_url} alt={ouvrier.nom} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #EA580C' }} />
          : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(234,88,12,0.15)', border: '3px solid #EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👷</div>
        }
        {ouvrier.certifie && (
          <span style={{ position: 'absolute', top: 8, right: 8, padding: '2px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.9)', color: '#fff', fontSize: '0.65rem', fontWeight: 800 }}>✓ Certifié</span>
        )}
        {ouvrier.disponible && (
          <span style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', borderRadius: 100, background: 'rgba(22,163,74,0.9)', color: '#fff', fontSize: '0.65rem', fontWeight: 800 }}>● Dispo</span>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <h3 style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ouvrier.nom}</h3>
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
      </div>
    </div>
  );
}

// ─── OuvrierDetail ────────────────────────────────────────────────────────────
function OuvrierDetail({ ouvrier, avis, isOwn, isLoggedIn, onBack, onDelete, onAvis }) {
  const [showAvisForm, setShowAvisForm] = useState(false);
  const [avisForm, setAvisForm] = useState({ auteur: '', note: 5, commentaire: '' });

  function submitAvis(e) {
    e.preventDefault();
    if (!avisForm.auteur || !avisForm.commentaire) { alert('Remplissez tous les champs.'); return; }
    onAvis(avisForm);
    setAvisForm({ auteur: '', note: 5, commentaire: '' });
    setShowAvisForm(false);
  }

  const _ogP = new URLSearchParams({ n: ouvrier.nom, m: ouvrier.metier, v: ouvrier.ville });
  if (ouvrier.photo_url?.startsWith('https://')) _ogP.set('img', ouvrier.photo_url);
  const shareUrl = encodeURIComponent(`${window.location.origin}/outils/place-ouvrier?ouvrier=${ouvrier.id}&${_ogP}`);
  const shareText = encodeURIComponent(`👷 ${ouvrier.metier} disponible à ${ouvrier.ville} — ${ouvrier.nom}\nContactez via Place Ouvrier ABAWI`);

  return (
    <div className="po-anim">
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} className="po-btn-ghost">← Retour</button>
        {isOwn && <button onClick={onDelete} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Supprimer profil</button>}
      </div>

      <div className="po-card" style={{ padding: '28px', marginBottom: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 22 }}>
          <div style={{ position: 'relative' }}>
            {ouvrier.photo_url
              ? <img src={ouvrier.photo_url} alt={ouvrier.nom} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #EA580C' }} />
              : <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(234,88,12,0.12)', border: '3px solid #EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>👷</div>
            }
            {ouvrier.disponible && <span style={{ position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: '#16A34A', border: '2px solid var(--bg-card)', display: 'block' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              {ouvrier.certifie && <span className="po-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>✓ Certifié</span>}
              {ouvrier.disponible && <span className="po-badge" style={{ background: 'rgba(22,163,74,0.12)', color: '#16A34A' }}>● Disponible</span>}
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>{ouvrier.nom}</h2>
            <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#EA580C' }}>{ouvrier.metier}</p>
            <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>📍 {ouvrier.quartier ? `${ouvrier.quartier}, ` : ''}{ouvrier.ville} · {ouvrier.experience}</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { icon: '💰', label: 'Tarif / jour', val: ouvrier.tarif_jour ? `${ouvrier.tarif_jour.toLocaleString()} FCFA` : '—' },
            { icon: '⏱', label: 'Tarif / heure', val: ouvrier.tarif_heure ? `${ouvrier.tarif_heure.toLocaleString()} FCFA` : '—' },
            { icon: '🔨', label: 'Projets réalisés', val: `${ouvrier.projets_realises || 0}+` },
            { icon: '📅', label: 'Disponibilité', val: ouvrier.disponibilite || 'Immédiate' },
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

        {/* Partage */}
        <div style={{ marginBottom: 22, padding: '12px 16px', borderRadius: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Partager ce profil</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['💬 WhatsApp', `https://wa.me/?text=${shareText}%20${shareUrl}`], ['✈️ Telegram', `https://t.me/share/url?url=${shareUrl}&text=${shareText}`], ['📘 Facebook', `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`]].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="po-btn-ghost" style={{ padding: '6px 10px', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block' }}>{label}</a>
            ))}
            <button className="po-btn-ghost" onClick={() => navigator.clipboard?.writeText(decodeURIComponent(shareUrl)).then(() => alert('Lien copié !')).catch(() => {})} style={{ padding: '6px 10px', fontSize: '0.78rem' }}>🔗 Copier</button>
          </div>
        </div>

        {/* Contacts */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {ouvrier.tel && (
            <a href={`tel:${ouvrier.tel}`} className="po-btn-orange" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>📞 Appeler</a>
          )}
          {ouvrier.tel && (
            <a href={`https://wa.me/${ouvrier.tel.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${ouvrier.nom}, je vous contacte via Place Ouvrier ABAWI. J'aurais besoin de vos services en tant que ${ouvrier.metier}.`)}`}
               target="_blank" rel="noreferrer" className="po-btn-green" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              💬 WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Avis */}
      <div className="po-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>⭐ Avis clients ({avis.length})</h3>
          {isLoggedIn && !showAvisForm && <button className="po-btn-ghost" onClick={() => setShowAvisForm(true)}>+ Laisser un avis</button>}
        </div>

        {showAvisForm && (
          <form onSubmit={submitAvis} style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="po-input" placeholder="Votre nom" value={avisForm.auteur} onChange={e => setAvisForm(f => ({ ...f, auteur: e.target.value }))} required />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Note :</label>
              <select className="po-select" value={avisForm.note} onChange={e => setAvisForm(f => ({ ...f, note: Number(e.target.value) }))}>
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{stars(n)} ({n}/5)</option>)}
              </select>
            </div>
            <textarea className="po-input" placeholder="Votre commentaire…" rows={3} value={avisForm.commentaire} onChange={e => setAvisForm(f => ({ ...f, commentaire: e.target.value }))} required style={{ resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="po-btn-orange" style={{ padding: '8px 18px' }}>Publier</button>
              <button type="button" className="po-btn-ghost" onClick={() => setShowAvisForm(false)}>Annuler</button>
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

// ─── PublierBesoinView ────────────────────────────────────────────────────────
function PublierBesoinView({ onPublish, onBack }) {
  const [form, setForm] = useState({ titre: '', metier: 'Maçon', description: '', ville: 'Dakar', quartier: '', budget: '', duree: '', urgence: false, contact_tel: '', contact_email: '', photo_url: '' });
  const photoRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'covers', 'besoins');
      setForm(f => ({ ...f, photo_url: url }));
    } catch (err) { alert('Erreur photo : ' + err.message); }
    setUploading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.titre || !form.description || !form.contact_tel) { alert('Titre, description et téléphone obligatoires.'); return; }
    onPublish(form);
  }

  return (
    <div className="po-anim">
      <button onClick={onBack} className="po-btn-ghost" style={{ marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>📋 Publier un besoin en ouvrier</h2>
      <form onSubmit={handleSubmit} className="po-card" style={{ padding: '28px', maxWidth: 680 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input className="po-input" placeholder="Titre du besoin (ex: Besoin électricien urgent) *" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select className="po-select" value={form.metier} onChange={e => setForm(f => ({ ...f, metier: e.target.value }))}>{METIERS.slice(1).map(m => <option key={m}>{m}</option>)}</select>
            <select className="po-select" value={form.ville}  onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}>{VILLES.slice(1).map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <input className="po-input" placeholder="Quartier précis (optionnel)" value={form.quartier} onChange={e => setForm(f => ({ ...f, quartier: e.target.value }))} />
          <textarea className="po-input" placeholder="Décrivez votre besoin, les travaux à réaliser… *" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: 'vertical' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="po-input" placeholder="Budget (ex: 30 000 FCFA)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
            <input className="po-input" placeholder="Durée estimée (ex: 1 jour, 1 semaine)" value={form.duree} onChange={e => setForm(f => ({ ...f, duree: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="po-input" type="tel" placeholder="Téléphone de contact *" value={form.contact_tel} onChange={e => setForm(f => ({ ...f, contact_tel: e.target.value }))} required />
            <input className="po-input" type="email" placeholder="Email (optionnel)" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.urgence} onChange={e => setForm(f => ({ ...f, urgence: e.target.checked }))} /> 🔴 Besoin urgent
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              <button type="button" onClick={() => photoRef.current?.click()} disabled={uploading} className="po-btn-ghost" style={{ fontSize: '0.78rem' }}>
                {uploading ? '⏳' : form.photo_url ? '✅ Photo chargée' : '📷 Ajouter une photo'}
              </button>
            </div>
          </div>
          {form.photo_url && <img src={form.photo_url} alt="Aperçu" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />}
          <button type="submit" className="po-btn-orange" style={{ padding: '14px', fontSize: '1rem', marginTop: 4 }}>📋 Publier mon besoin</button>
        </div>
      </form>
    </div>
  );
}

// ─── DevenirOuvrierView ───────────────────────────────────────────────────────
function DevenirOuvrierView({ onInscrit, onBack }) {
  const [form, setForm] = useState({ nom: '', metier: 'Maçon', specialites: '', experience: '1-3 ans', ville: 'Dakar', quartier: '', tarif_jour: '', tarif_heure: '', disponible: true, disponibilite: 'Disponible maintenant', description: '', tel: '', certifie: false, photo_url: '' });
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef(null);

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'images', 'ouvriers');
      setForm(f => ({ ...f, photo_url: url }));
    } catch (err) { alert('Erreur photo : ' + err.message); }
    setUploading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom || !form.tel) { alert('Nom et téléphone obligatoires.'); return; }
    onInscrit({ ...form, specialites: form.specialites.split(',').map(s => s.trim()).filter(Boolean), tarif_jour: Number(form.tarif_jour) || 0, tarif_heure: Number(form.tarif_heure) || 0 });
  }

  return (
    <div className="po-anim">
      <button onClick={onBack} className="po-btn-ghost" style={{ marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>👷 Créer mon profil ouvrier</h2>
      <form onSubmit={handleSubmit} className="po-card" style={{ padding: '28px', maxWidth: 700 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="po-input" placeholder="Nom complet *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
            <select className="po-select" value={form.metier} onChange={e => setForm(f => ({ ...f, metier: e.target.value }))}>{METIERS.slice(1).map(m => <option key={m}>{m}</option>)}</select>
          </div>
          <input className="po-input" placeholder="Spécialités (ex: Câblage, Domotique, Panneaux solaires — séparées par des virgules)" value={form.specialites} onChange={e => setForm(f => ({ ...f, specialites: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <select className="po-select" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}>
              {['Moins de 1 an', '1-3 ans', '3-5 ans', '5-10 ans', '10+ ans'].map(e => <option key={e}>{e}</option>)}
            </select>
            <select className="po-select" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}>{VILLES.slice(1).map(v => <option key={v}>{v}</option>)}</select>
            <input className="po-input" placeholder="Quartier" value={form.quartier} onChange={e => setForm(f => ({ ...f, quartier: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="po-input" type="number" placeholder="Tarif journalier (FCFA)" value={form.tarif_jour} onChange={e => setForm(f => ({ ...f, tarif_jour: e.target.value }))} />
            <input className="po-input" type="number" placeholder="Tarif horaire (FCFA)" value={form.tarif_heure} onChange={e => setForm(f => ({ ...f, tarif_heure: e.target.value }))} />
          </div>
          <select className="po-select" value={form.disponibilite} onChange={e => setForm(f => ({ ...f, disponibilite: e.target.value, disponible: e.target.value === 'Disponible maintenant' }))}>
            {DISPOS.slice(1).map(d => <option key={d}>{d}</option>)}
          </select>
          <textarea className="po-input" placeholder="Parlez de vous, vos expériences passées, vos points forts…" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          <input className="po-input" type="tel" placeholder="Téléphone / WhatsApp *" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} required />
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.certifie} onChange={e => setForm(f => ({ ...f, certifie: e.target.checked }))} /> ✓ Je possède une certification / attestation
            </label>
            <div>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              <button type="button" onClick={() => photoRef.current?.click()} disabled={uploading} className="po-btn-ghost" style={{ fontSize: '0.78rem' }}>
                {uploading ? '⏳' : form.photo_url ? '✅ Photo chargée' : '📷 Ma photo de profil'}
              </button>
            </div>
          </div>
          {form.photo_url && <img src={form.photo_url} alt="Aperçu" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #EA580C' }} />}
          <button type="submit" className="po-btn-green" style={{ padding: '14px', fontSize: '1rem', marginTop: 4 }}>👷 Créer mon profil</button>
        </div>
      </form>
    </div>
  );
}

// ─── MesBesoinsView ───────────────────────────────────────────────────────────
function MesBesoinsView({ besoins, onBack, onDelete }) {
  return (
    <div className="po-anim">
      <button onClick={onBack} className="po-btn-ghost" style={{ marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>📌 Mes besoins publiés ({besoins.length})</h2>
      {besoins.length === 0 ? (
        <PoEmpty icon="📌" title="Aucun besoin publié" text="Publiez votre besoin pour être contacté par des ouvriers qualifiés." cta="Publier un besoin" onCta={onBack} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {besoins.map(b => (
            <div key={b.id} className="po-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  {b.urgence && <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: '0.72rem', fontWeight: 800 }}>🔴 Urgent</span>}
                  <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(234,88,12,0.1)', color: '#EA580C', fontSize: '0.72rem', fontWeight: 700 }}>{b.metier}</span>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{b.titre}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📍 {b.quartier ? `${b.quartier}, ` : ''}{b.ville} · {dateFR(b.date_pub)}</div>
                {b.budget && <div style={{ fontSize: '0.82rem', color: '#16A34A', fontWeight: 700, marginTop: 2 }}>💰 {b.budget}</div>}
              </div>
              <button onClick={() => onDelete(b.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0 }}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function PoEmpty({ icon, title, text, cta, onCta }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: '0.85rem', maxWidth: 340, margin: '0 auto 20px' }}>{text}</p>
      {cta && <button className="po-btn-orange" onClick={onCta}>{cta}</button>}
    </div>
  );
}

function PoAuthGate({ message, onBack }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>{message}</p>
      <button className="po-btn-ghost" onClick={onBack}>← Retour</button>
    </div>
  );
}
