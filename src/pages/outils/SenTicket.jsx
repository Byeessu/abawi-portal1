import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { uploadFile } from '../../lib/uploadFile';

// =====================================================================
// SenTicket — Plateforme de billetterie événementielle ABAWI
// =====================================================================

const CATEGORIES = ['Tous', 'Concert', 'Festival', 'Conférence', 'Sport', 'Théâtre', 'Gala', 'Workshop', 'Culture', 'Business'];
const VILLES = ['Toutes', 'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 'Touba', 'Mbour'];

const STORAGE_KEY = 'senticket_cart';
const ORDERS_KEY = 'senticket_orders';
const EVENTS_KEY = 'senticket_events';
const WITHDRAWALS_KEY = 'senticket_withdrawals';

const COMMISSION_RATE = 0.07; // 7% commission SenTicket

const FAVORITES_KEY = 'senticket_favorites';
const VIEWS_KEY = 'senticket_views';
const REVIEWS_KEY = 'senticket_reviews';

const VALID_COUPONS = {
  'SENTICKET10': { type: 'percent', value: 10 },
  'SENTICKET20': { type: 'percent', value: 20 },
  'ABAWI500': { type: 'fixed', value: 500 },
  'WELCOME1000': { type: 'fixed', value: 1000 },
};

function loadReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function saveReviews(obj) {
  try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(obj)); } catch {}
}
function useCountdown(targetDate) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(targetDate) - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, new Date(targetDate) - Date.now())), 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  const days = Math.floor(left / 86400000);
  const hours = Math.floor((left % 86400000) / 3600000);
  const minutes = Math.floor((left % 3600000) / 60000);
  const seconds = Math.floor((left % 60000) / 1000);
  return { days, hours, minutes, seconds, expired: left === 0 };
}
function openMaps(event) {
  const q = encodeURIComponent(`${event.lieu}, ${event.ville}, Sénégal`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}
function saveFavorites(set) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set])); } catch {}
}
function loadViews() {
  try {
    const raw = localStorage.getItem(VIEWS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function saveViews(obj) {
  try { localStorage.setItem(VIEWS_KEY, JSON.stringify(obj)); } catch {}
}
function bumpView(eventId) {
  const v = loadViews();
  v[eventId] = (v[eventId] || 0) + 1;
  saveViews(v);
  return v[eventId];
}
function generateICS(event) {
  const dt = event.date.replace(/-/g, '');
  const [h, m] = (event.heure || '00:00').split(':').map(Number);
  const start = `${dt}T${String(h).padStart(2, '0')}${String(m||0).padStart(2, '0')}00`;
  const endH = (h + 2) % 24;
  const end = `${dt}T${String(endH).padStart(2, '0')}${String(m||0).padStart(2, '0')}00`;
  const uid = `senticket-${event.id}@abawi.sn`;
  const summary = event.titre.replace(/,/g, '\\,');
  const location = `${event.lieu}, ${event.ville}`.replace(/,/g, '\\,');
  const desc = event.description.replace(/\n/g, '\\n').replace(/,/g, '\\,');
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ABAWI//SenTicket//FR\nBEGIN:VEVENT\nUID:${uid}\nDTSTART;TZID=Africa/Dakar:${start}\nDTEND;TZID=Africa/Dakar:${end}\nSUMMARY:${summary}\nLOCATION:${location}\nDESCRIPTION:${desc}\nEND:VEVENT\nEND:VCALENDAR`;
}
function downloadICS(event) {
  const blob = new Blob([generateICS(event)], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `senticket-${event.id}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function shareEvent(event, platform) {
  const url = window.location.href;
  const text = encodeURIComponent(`${event.titre} — ${event.date} à ${event.ville} via SenTicket 🎫`);
  const link = encodeURIComponent(url);
  const maps = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${link}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${link}`,
    whatsapp: `https://wa.me/?text=${text}%20${link}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${link}`,
  };
  if (maps[platform]) window.open(maps[platform], '_blank', 'width=600,height=400');
}
function copyLink(event) {
  const url = `${window.location.origin}/outils/senticket?event=${event.id}`;
  navigator.clipboard?.writeText(url).then(() => alert('Lien copié !')).catch(() => {});
}

function loadLocalEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultEvents();
}

function saveLocalEvents(events) {
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(events)); } catch {}
}

function defaultEvents() {
  return [
    {
      id: 'evt-1',
      titre: 'Concert Wally Seck & Dip Doundou Guiss',
      description: 'Un spectacle époustouflant réunissant les deux stars de la musique sénégalaise. Scène grandiose, effets spéciaux et ambiance survoltée.',
      date: '2026-06-15',
      heure: '20:00',
      ville: 'Dakar',
      lieu: 'Stade Iba Mar Diop',
      categorie: 'Concert',
      image: '🎤',
      cover_url: '',
      billets: [
        { id: 'b1', nom: 'Standard', prix: 5000, places: 500, vendus: 320 },
        { id: 'b2', nom: 'VIP', prix: 15000, places: 150, vendus: 89 },
        { id: 'b3', nom: 'Premium', prix: 25000, places: 50, vendus: 42 },
        { id: 'b4', nom: 'Backstage Pass', prix: 50000, places: 20, vendus: 15 },
      ],
      featured: true,
      statut: 'actif',
      createur: 'ABAWI',
    },
    {
      id: 'evt-2',
      titre: 'Sommet des Startups Tech Afrique',
      description: 'Le plus grand rassemblement d\'entrepreneurs tech en Afrique de l\'Ouest. Keynotes, workshops, networking, pitch sessions avec des investisseurs.',
      date: '2026-05-25',
      heure: '09:00',
      ville: 'Dakar',
      lieu: 'CICAD',
      categorie: 'Business',
      image: '💼',
      cover_url: '',
      billets: [
        { id: 'b1', nom: 'Pass Jour 1', prix: 10000, places: 300, vendus: 180 },
        { id: 'b2', nom: 'Pass Complet 2J', prix: 18000, places: 200, vendus: 95 },
        { id: 'b3', nom: 'VIP Investisseur', prix: 50000, places: 30, vendus: 12 },
      ],
      featured: true,
      statut: 'actif',
      createur: 'ABAWI',
    },
    {
      id: 'evt-3',
      titre: 'Festival des Arts de la Rue — Saint-Louis',
      description: '3 jours de spectacles de rue, musique live, danse contemporaine, arts visuels et gastronomie locale dans la ville historique de Saint-Louis.',
      date: '2026-07-10',
      heure: '16:00',
      ville: 'Saint-Louis',
      lieu: 'Centre-ville & Faidherbe',
      categorie: 'Festival',
      image: '🎭',
      cover_url: '',
      billets: [
        { id: 'b1', nom: 'Pass Jour', prix: 3000, places: 1000, vendus: 600 },
        { id: 'b2', nom: 'Pass 3J + Logement', prix: 25000, places: 100, vendus: 45 },
      ],
      featured: false,
      statut: 'actif',
      createur: 'ABAWI',
    },
    {
      id: 'evt-4',
      titre: 'Finale Coupe du Sénégal — Génération Foot vs Jaraaf',
      description: 'La finale tant attendue du championnat national. Ambiance électrique, tribunes pleines, match à enjeux pour le titre.',
      date: '2026-05-30',
      heure: '17:00',
      ville: 'Dakar',
      lieu: 'Stade L.S. Senghor',
      categorie: 'Sport',
      image: '⚽',
      cover_url: '',
      billets: [
        { id: 'b1', nom: 'Tribune Populaire', prix: 2000, places: 8000, vendus: 5200 },
        { id: 'b2', nom: 'Tribune Honneur', prix: 8000, places: 2000, vendus: 1100 },
        { id: 'b3', nom: 'Loge VIP', prix: 30000, places: 100, vendus: 67 },
      ],
      featured: true,
      statut: 'actif',
      createur: 'ABAWI',
    },
    {
      id: 'evt-5',
      titre: 'Workshop IA & Automation — Niveau Pro',
      description: 'Formation intensive 2 jours sur l\'IA générative, les automatisations et les agents IA pour entreprises. Certificat délivré.',
      date: '2026-06-05',
      heure: '08:30',
      ville: 'Dakar',
      lieu: 'Campus ABAWI, VDN',
      categorie: 'Workshop',
      image: '🤖',
      cover_url: '',
      billets: [
        { id: 'b1', nom: 'Étudiant', prix: 15000, places: 30, vendus: 18 },
        { id: 'b2', nom: 'Pro', prix: 35000, places: 40, vendus: 22 },
        { id: 'b3', nom: 'Entreprise (5 pers.)', prix: 140000, places: 10, vendus: 5 },
      ],
      featured: false,
      statut: 'actif',
      createur: 'ABAWI',
    },
    {
      id: 'evt-6',
      titre: 'Gala de Charité — Fondation Enfance Sénégal',
      description: 'Soirée de gala au profit des enfants démunis. Dîner gastronomique, vente aux enchères d\'art, concerts acoustiques, discours inspirants.',
      date: '2026-06-20',
      heure: '19:00',
      ville: 'Dakar',
      lieu: 'Hôtel Terrou-Bi',
      categorie: 'Gala',
      image: '👑',
      cover_url: '',
      billets: [
        { id: 'b1', nom: 'Donateur Standard', prix: 25000, places: 200, vendus: 140 },
        { id: 'b2', nom: 'Donateur Or', prix: 100000, places: 50, vendus: 28 },
        { id: 'b3', nom: 'Table VIP (10 pers.)', prix: 800000, places: 5, vendus: 2 },
      ],
      featured: false,
      statut: 'actif',
      createur: 'ABAWI',
    },
    {
      id: 'evt-7',
      titre: 'Théâtre Moderne — « Le Prix de la Liberté »',
      description: 'Une pièce de théâtre contemporaine sur l\'histoire du Sénégal, écrite et mise en scène par de jeunes talents sénégalais.',
      date: '2026-05-18',
      heure: '19:30',
      ville: 'Thiès',
      lieu: 'Théâtre M. Gueye',
      categorie: 'Théâtre',
      image: '🎭',
      cover_url: '',
      billets: [
        { id: 'b1', nom: 'Standard', prix: 2000, places: 300, vendus: 150 },
        { id: 'b2', nom: 'VIP', prix: 8000, places: 50, vendus: 22 },
      ],
      featured: false,
      statut: 'actif',
      createur: 'ABAWI',
    },
    {
      id: 'evt-8',
      titre: 'Conférence — Femmes Leaders d\'Afrique',
      description: 'Panel exceptionnel de femmes entrepreneures, ministres et dirigeantes. Networking, mentorat, table ronde sur l\'égalité et l\'entrepreneuriat.',
      date: '2026-06-28',
      heure: '09:00',
      ville: 'Dakar',
      lieu: 'Radisson Blu',
      categorie: 'Conférence',
      image: '👩‍💼',
      cover_url: '',
      billets: [
        { id: 'b1', nom: 'Pass Standard', prix: 5000, places: 400, vendus: 220 },
        { id: 'b2', nom: 'Pass VIP', prix: 20000, places: 50, vendus: 31 },
      ],
      featured: true,
      statut: 'actif',
      createur: 'ABAWI',
    },
  ];
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveOrders(orders) {
  try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch {}
}

function loadWithdrawals() {
  try {
    const raw = localStorage.getItem(WITHDRAWALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveWithdrawals(w) {
  try { localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(w)); } catch {}
}

function genQRCodeData(orderId, eventId, billetId, email) {
  return `SENTICKET|${orderId}|${eventId}|${billetId}|${email}|${Date.now()}`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPrix(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

function newId(prefix = 'st') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// =====================================================================
// Composant principal
// =====================================================================

export default function SenTicket() {
  const [events, setEvents] = useState(() => loadLocalEvents());
  const [view, setView] = useState('explorer'); // explorer | detail | panier | checkout | billet | historique | organiser | mes-events
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(() => loadOrders());
  const [filterCat, setFilterCat] = useState('Tous');
  const [filterVille, setFilterVille] = useState('Toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [notification, setNotification] = useState(null);
  const [organizerTab, setOrganizerTab] = useState('creer'); // creer | stats
  const [withdrawals, setWithdrawals] = useState(() => loadWithdrawals());
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [views] = useState(() => loadViews());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [reviews, setReviews] = useState(() => loadReviews());
  const nav = useNavigate();

  // Persistance
  useEffect(() => { saveLocalEvents(events); }, [events]);
  useEffect(() => { saveOrders(orders); }, [orders]);
  useEffect(() => { saveWithdrawals(withdrawals); }, [withdrawals]);
  useEffect(() => { saveFavorites(favorites); }, [favorites]);

  // Notification auto-clear
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(t);
  }, [notification]);

  const filteredEvents = events
    .filter(e => e.statut === 'actif')
    .filter(e => !showFavoritesOnly || favorites.has(e.id))
    .filter(e => filterCat === 'Tous' || e.categorie === filterCat)
    .filter(e => filterVille === 'Toutes' || e.ville === filterVille)
    .filter(e => !searchQuery || e.titre.toLowerCase().includes(searchQuery.toLowerCase()) || e.ville.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'prix') return (a.billets[0]?.prix || 0) - (b.billets[0]?.prix || 0);
      if (sortBy === 'popularite') return (b.billets.reduce((s, bi) => s + bi.vendus, 0)) - (a.billets.reduce((s, bi) => s + bi.vendus, 0));
      return 0;
    });

  const featuredEvents = events.filter(e => e.featured && e.statut === 'actif');

  // ── Actions ─────────────────────────────────────────────────────────
  function addToCart(event, billet, qty) {
    const exists = cart.find(c => c.eventId === event.id && c.billetId === billet.id);
    if (exists) {
      setCart(cart.map(c => c.eventId === event.id && c.billetId === billet.id ? { ...c, qty: c.qty + qty } : c));
    } else {
      setCart([...cart, { eventId: event.id, eventTitre: event.titre, billetId: billet.id, billetNom: billet.nom, prix: billet.prix, qty, date: event.date, ville: event.ville, image: event.image, cover_url: event.cover_url }]);
    }
    setNotification({ type: 'success', msg: `${qty}× ${billet.nom} ajouté au panier` });
  }

  function removeFromCart(idx) {
    setCart(cart.filter((_, i) => i !== idx));
  }

  function clearCart() {
    setCart([]);
  }

  const cartTotal = cart.reduce((s, c) => s + c.prix * c.qty, 0);

  function confirmPurchase(paymentMethod, buyerInfo, meta = {}) {
    const newOrders = cart.map(item => {
      const total = item.prix * item.qty;
      const commission = Math.round(total * COMMISSION_RATE);
      const discount = meta.discount || 0;
      return {
        id: newId('ORD'),
        eventId: item.eventId,
        eventTitre: item.eventTitre,
        billetId: item.billetId,
        billetNom: item.billetNom,
        prixUnitaire: item.prix,
        qty: item.qty,
        total,
        discount,
        commission,
        netOrganisateur: total - commission - discount,
        acheteur: buyerInfo,
        paymentMethod,
        couponCode: meta.couponCode || null,
        groupEmails: meta.groupEmails || [],
        dateAchat: new Date().toISOString(),
        statut: 'confirmé',
        qrData: genQRCodeData(newId('ORD'), item.eventId, item.billetId, buyerInfo.email),
      };
    });

    // Mettre à jour les ventes dans les événements
    const updatedEvents = events.map(e => {
      const eventOrders = newOrders.filter(o => o.eventId === e.id);
      if (eventOrders.length === 0) return e;
      const newBillets = e.billets.map(b => {
        const sold = eventOrders.filter(o => o.billetId === b.id).reduce((s, o) => s + o.qty, 0);
        return { ...b, vendus: b.vendus + sold };
      });
      return { ...e, billets: newBillets };
    });

    setEvents(updatedEvents);
    setOrders([...newOrders, ...orders]);
    setCart([]);
    setView('historique');
    setNotification({ type: 'success', msg: `Achat confirmé ! ${newOrders.length} billet(s) acheté(s).` });
  }

  function createEvent(evtData) {
    const newEvent = {
      id: newId('evt'),
      ...evtData,
      vendus: 0,
      featured: false,
      statut: 'actif',
      createur: 'Moi',
    };
    setEvents([newEvent, ...events]);
    setView('mes-events');
    setNotification({ type: 'success', msg: `Événement « ${evtData.titre} » créé avec succès !` });
  }

  function deleteEvent(id) {
    if (!confirm('Supprimer cet événement ?')) return;
    setEvents(events.filter(e => e.id !== id));
    setNotification({ type: 'info', msg: 'Événement supprimé' });
  }

  // ── Rendu ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <style>{`
        @keyframes stFadeIn { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        .st-anim { animation: stFadeIn 0.35s ease-out; }
        .st-btn-primary {
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          color: #fff; border: none; border-radius: 12px;
          padding: 10px 18px; font-weight: 700; cursor: pointer;
          font-size: 0.85rem; transition: all 0.2s;
        }
        .st-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
        .st-btn-gold {
          background: linear-gradient(135deg, #F5C518, #D4A017);
          color: #0a0a0a; border: none; border-radius: 12px;
          padding: 10px 18px; font-weight: 800; cursor: pointer;
          font-size: 0.85rem; transition: all 0.2s;
        }
        .st-btn-gold:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(245,197,24,0.3); }
        .st-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden;
          transition: all 0.25s ease;
        }
        .st-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.12); }
        .st-input {
          background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary);
          border-radius: 10px; padding: 10px 14px; font-size: 0.88rem; outline: none;
          font-family: Outfit,sans-serif;
        }
        .st-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        .st-select {
          background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary);
          border-radius: 10px; padding: 8px 12px; font-size: 0.82rem; outline: none; cursor: pointer;
        }
        .st-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 100px; font-size: 0.72rem; font-weight: 700;
        }
        .st-scroll::-webkit-scrollbar { width: 6px; }
        .st-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.25); border-radius: 3px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 80%, #8B5CF6 20%) 100%)',
        borderBottom: '1px solid var(--border)', padding: '32px 24px 24px', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px',
          borderRadius: 100, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', marginBottom: 12,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6', display: 'inline-block' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#8B5CF6', letterSpacing: 2, textTransform: 'uppercase' }}>ABAWI · ÉVÉNEMENTS</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.1 }}>
          Sen<span style={{ color: '#8B5CF6' }}>Ticket</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', fontSize: '0.92rem', lineHeight: 1.5 }}>
          La billetterie événementielle la plus complète d'Afrique de l'Ouest. Concerts, festivals, conférences, sport — réservez en 2 clics.
        </p>

        {/* Navigation onglets */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          {[
            { id: 'explorer', label: '🔍 Explorer', active: view === 'explorer' || view === 'detail' },
            { id: 'panier', label: `🛒 Panier (${cart.length})`, active: view === 'panier' || view === 'checkout' },
            { id: 'historique', label: '🎫 Mes billets', active: view === 'historique' },
            { id: 'organiser', label: '➕ Organiser', active: view === 'organiser' || view === 'mes-events' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} style={{
              padding: '8px 16px', borderRadius: 100,
              border: `2px solid ${tab.active ? '#8B5CF6' : 'var(--border)'}`,
              background: tab.active ? 'rgba(139,92,246,0.1)' : 'transparent',
              color: tab.active ? '#8B5CF6' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: tab.active ? 700 : 500,
              fontSize: '0.82rem', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 'min(1200px, 96vw)', margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Notification */}
        {notification && (
          <div className="st-anim" style={{
            position: 'fixed', top: 20, right: 20, zIndex: 100,
            padding: '12px 20px', borderRadius: 12,
            background: notification.type === 'success' ? 'rgba(0,200,83,0.12)' : 'rgba(59,130,246,0.12)',
            border: `1px solid ${notification.type === 'success' ? '#00c853' : '#3B82F6'}`,
            color: notification.type === 'success' ? '#00c853' : '#3B82F6',
            fontWeight: 600, fontSize: '0.85rem', backdropFilter: 'blur(8px)',
          }}>
            {notification.msg}
          </div>
        )}

        {/* ── EXPLORER ── */}
        {(view === 'explorer' || view === 'detail') && (
          <>
            {view === 'explorer' && (
              <>
                {/* Barre de recherche + filtres */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Rechercher un événement, artiste, ville..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="st-input"
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="st-select">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filterVille} onChange={e => setFilterVille(e.target.value)} className="st-select">
                    {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="st-select">
                    <option value="date">Trier par date</option>
                    <option value="prix">Prix croissant</option>
                    <option value="popularite">Popularité</option>
                  </select>
                  <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} style={{
                    padding: '8px 14px', borderRadius: 100, border: `2px solid ${showFavoritesOnly ? '#EF4444' : 'var(--border)'}`,
                    background: showFavoritesOnly ? 'rgba(239,68,68,0.1)' : 'transparent',
                    color: showFavoritesOnly ? '#EF4444' : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: showFavoritesOnly ? 700 : 500,
                    fontSize: '0.82rem', transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}>{showFavoritesOnly ? '❤️ Mes favoris' : '🤍 Mes favoris'}</button>
                </div>

                {/* En vedette */}
                {featuredEvents.length > 0 && !searchQuery && filterCat === 'Tous' && filterVille === 'Toutes' && !showFavoritesOnly && (
                  <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>⭐ En vedette</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                      {featuredEvents.slice(0, 3).map(evt => (
                        <EventCard key={evt.id} event={evt} isFavorite={favorites.has(evt.id)} onClick={() => { setSelectedEvent(evt); setView('detail'); }} onToggleFavorite={() => { const next = new Set(favorites); if (next.has(evt.id)) next.delete(evt.id); else next.add(evt.id); setFavorites(next); }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste complète */}
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                  {searchQuery ? `Résultats (${filteredEvents.length})` : `Tous les événements (${filteredEvents.length})`}
                </h2>
                {filteredEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
                    <p>Aucun événement trouvé. Essayez d'autres filtres.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {filteredEvents.map(evt => (
                      <EventCard key={evt.id} event={evt} isFavorite={favorites.has(evt.id)} onClick={() => { setSelectedEvent(evt); setView('detail'); }} onToggleFavorite={() => { const next = new Set(favorites); if (next.has(evt.id)) next.delete(evt.id); else next.add(evt.id); setFavorites(next); }} />
                    ))}
                  </div>
                )}
              </>
            )}

            {view === 'detail' && selectedEvent && (
              <EventDetail
                event={selectedEvent}
                events={events}
                isFavorite={favorites.has(selectedEvent.id)}
                viewCount={views[selectedEvent.id] || 0}
                onBack={() => setView('explorer')}
                onAddToCart={(billet, qty) => addToCart(selectedEvent, billet, qty)}
                onGoPanier={() => setView('panier')}
                onToggleFavorite={() => {
                  const next = new Set(favorites);
                  if (next.has(selectedEvent.id)) next.delete(selectedEvent.id);
                  else next.add(selectedEvent.id);
                  setFavorites(next);
                }}
                onSelectEvent={evt => { setSelectedEvent(evt); bumpView(evt.id); }}
              />
            )}
          </>
        )}

        {/* ── PANIER ── */}
        {view === 'panier' && (
          <PanierView
            cart={cart} total={cartTotal}
            onRemove={removeFromCart} onClear={clearCart}
            onContinue={() => setView('checkout')}
            onBack={() => setView('explorer')}
          />
        )}

        {/* ── CHECKOUT ── */}
        {view === 'checkout' && (
          <CheckoutView
            cart={cart} total={cartTotal}
            onConfirm={confirmPurchase}
            onBack={() => setView('panier')}
          />
        )}

        {/* ── HISTORIQUE ── */}
        {view === 'historique' && (
          <HistoriqueView orders={orders} events={events} reviews={reviews} setReviews={setReviews} onBack={() => setView('explorer')} />
        )}

        {/* ── ORGANISER ── */}
        {(view === 'organiser' || view === 'mes-events') && (
          <>
            {view === 'organiser' && (
              <OrganizerView
                onCreate={createEvent}
                onViewEvents={() => setView('mes-events')}
              />
            )}
            {view === 'mes-events' && (
              <MesEventsView
                events={events.filter(e => e.createur === 'Moi')}
                orders={orders}
                withdrawals={withdrawals}
                onBack={() => setView('organiser')}
                onDelete={deleteEvent}
                onViewDetail={evt => { setSelectedEvent(evt); setView('detail'); }}
                onRequestWithdrawal={(montant) => {
                  if (!confirm(`Confirmer la demande de reversement de ${formatPrix(montant)} ?`)) return;
                  const w = { id: newId('WTH'), montant, date: new Date().toISOString(), statut: 'En cours' };
                  setWithdrawals([w, ...withdrawals]);
                  setNotification({ type: 'success', msg: `Demande de reversement de ${formatPrix(montant)} envoyée !` });
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// Sous-composants
// =====================================================================

function EventCard({ event, isFavorite, onClick, onToggleFavorite }) {
  const dispo = event.billets.reduce((s, b) => s + (b.places - b.vendus), 0);
  const plusBas = Math.min(...event.billets.map(b => b.prix));
  return (
    <div className="st-card st-anim" style={{ cursor: 'pointer', position: 'relative' }}>
      <div onClick={onClick} style={{
        height: 140,
        background: event.cover_url ? `url(${event.cover_url}) center/cover no-repeat` : 'linear-gradient(135deg, #1a103c, #2d1b69, #1a103c)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', position: 'relative',
      }}>
        {!event.cover_url && event.image}
        {event.featured && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            padding: '3px 10px', borderRadius: 100, background: 'linear-gradient(135deg, #F5C518, #D4A017)',
            color: '#0a0a0a', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
          }}>⭐ Vedette</span>
        )}
      </div>
      <div style={{ padding: '14px 16px' }} onClick={onClick}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          <span className="st-badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>{event.categorie}</span>
          <span className="st-badge" style={{ background: 'rgba(0,200,83,0.12)', color: '#00c853' }}>{event.ville}</span>
          {isFavorite && <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>❤️</span>}
        </div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>{event.titre}</h3>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
          📅 {formatDate(event.date)} · 🕐 {event.heure} · 📍 {event.lieu}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3B82F6' }}>à partir de {formatPrix(plusBas)}</span>
          <span style={{ fontSize: '0.72rem', color: dispo < 50 ? '#EF4444' : 'var(--text-muted)' }}>
            {dispo > 0 ? `${dispo} places restantes` : 'Complet'}
          </span>
        </div>
      </div>
      {onToggleFavorite && (
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 2,
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: isFavorite ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.4)',
            color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex',
            alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
          }}
        >{isFavorite ? '❤️' : '🤍'}</button>
      )}
    </div>
  );
}

function EventDetail({ event, events, isFavorite, viewCount, onBack, onAddToCart, onGoPanier, onToggleFavorite, onSelectEvent }) {
  const [selectedBillet, setSelectedBillet] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => { bumpView(event.id); }, [event.id]);

  const related = events.filter(e => e.id !== event.id && e.statut === 'actif' && (e.categorie === event.categorie || e.ville === event.ville)).slice(0, 3);

  return (
    <div className="st-anim">
      <button onClick={onBack} style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>← Retour</button>

      <div className="st-card" style={{ marginBottom: 20 }}>
        <div style={{
          height: 220,
          background: event.cover_url ? `url(${event.cover_url}) center/cover no-repeat` : 'linear-gradient(135deg, #1a103c, #2d1b69, #1a103c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', position: 'relative',
        }}>
          {!event.cover_url && event.image}
        </div>
        <div style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            <span className="st-badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>{event.categorie}</span>
            <span className="st-badge" style={{ background: 'rgba(0,200,83,0.12)', color: '#00c853' }}>{event.ville}</span>
            {event.featured && <span className="st-badge" style={{ background: 'rgba(245,197,24,0.15)', color: '#D4A017' }}>⭐ En vedette</span>}
            {viewCount > 0 && <span className="st-badge" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>👁 {viewCount} vue{viewCount>1?'s':''}</span>}
            <button onClick={onToggleFavorite} style={{
              marginLeft: 'auto', padding: '4px 10px', borderRadius: 100, border: `1px solid ${isFavorite ? '#EF4444' : 'var(--border)'}`,
              background: isFavorite ? 'rgba(239,68,68,0.1)' : 'transparent', color: isFavorite ? '#EF4444' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
            }}>{isFavorite ? '❤️ Favori' : '🤍 Ajouter aux favoris'}</button>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>{event.titre}</h2>

          {/* Compte à rebours */}
          <CountdownBox targetDate={`${event.date}T${event.heure || '00:00'}`} />

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>{event.description}</p>

          {/* Actions rapides */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <ActionBtn label="📅 Calendrier" onClick={() => downloadICS(event)} />
            <ActionBtn label="🔗 Copier lien" onClick={() => copyLink(event)} />
            <ActionBtn label="🗺️ Itinéraire" onClick={() => openMaps(event)} />
            <ActionBtn label="📘 Facebook" onClick={() => shareEvent(event, 'facebook')} />
            <ActionBtn label="🐦 X/Twitter" onClick={() => shareEvent(event, 'twitter')} />
            <ActionBtn label="💬 WhatsApp" onClick={() => shareEvent(event, 'whatsapp')} />
            <ActionBtn label="💼 LinkedIn" onClick={() => shareEvent(event, 'linkedin')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            <InfoBox icon="📅" label="Date" value={formatDate(event.date)} />
            <InfoBox icon="🕐" label="Heure" value={event.heure} />
            <InfoBox icon="📍" label="Lieu" value={event.lieu} />
            <InfoBox icon="🏙️" label="Ville" value={event.ville} />
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>🎫 Catégories de billets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {event.billets.map(b => {
              const dispo = b.places - b.vendus;
              const isSelected = selectedBillet?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => { setSelectedBillet(b); setQty(1); }}
                  style={{
                    padding: '14px 18px', borderRadius: 14,
                    border: `2px solid ${isSelected ? '#8B5CF6' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(139,92,246,0.08)' : 'var(--bg-card)',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{b.nom}</div>
                    <div style={{ fontSize: '0.78rem', color: dispo < 20 ? '#EF4444' : 'var(--text-muted)', marginTop: 4 }}>
                      {dispo > 0 ? `${dispo} places disponibles` : 'Complet'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#3B82F6', fontSize: '1.05rem' }}>{formatPrix(b.prix)}</div>
                    {isSelected && <div style={{ fontSize: '0.72rem', color: '#8B5CF6', marginTop: 2 }}>Sélectionné</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedBillet && (
            <div className="st-anim" style={{ marginTop: 18, padding: '18px', borderRadius: 14, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Quantité :</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}>-</button>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)', minWidth: 24, textAlign: 'center' }}>{qty}</span>
                  <button onClick={() => setQty(Math.min(selectedBillet.places - selectedBillet.vendus, qty + 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}>+</button>
                </div>
                <span style={{ fontWeight: 800, color: '#8B5CF6', fontSize: '1.1rem', marginLeft: 'auto' }}>Total : {formatPrix(selectedBillet.prix * qty)}</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="st-btn-primary" onClick={() => { onAddToCart(selectedBillet, qty); }} style={{ flex: 1 }}>
                  🛒 Ajouter au panier
                </button>
                <button className="st-btn-gold" onClick={() => { onAddToCart(selectedBillet, qty); onGoPanier(); }}>
                  Commander →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommandations */}
      {related.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>🔥 Vous pourriez aussi aimer</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {related.map(evt => (
              <EventCard key={evt.id} event={evt} onClick={() => onSelectEvent(evt)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)',
      background: 'var(--bg-card)', color: 'var(--text-secondary)',
      cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s',
    }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#8B5CF6'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
      {label}
    </button>
  );
}

function CountdownBox({ targetDate }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(targetDate);
  if (expired) return (
    <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#EF4444' }}>⏰ L'événement a commencé ou est terminé</span>
    </div>
  );
  const blocks = [
    { v: days, l: 'J' }, { v: hours, l: 'H' }, { v: minutes, l: 'M' }, { v: seconds, l: 'S' },
  ];
  return (
    <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>⏳ Début dans</span>
      {blocks.map(b => (
        <div key={b.l} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', textAlign: 'center', minWidth: 36 }}>
          <div style={{ fontWeight: 800, color: '#8B5CF6', fontSize: '0.95rem' }}>{String(b.v).padStart(2, '0')}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{b.l}</div>
        </div>
      ))}
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)', textAlign: 'center' }}>
      <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{value}</div>
    </div>
  );
}

function PanierView({ cart, total, onRemove, onClear, onContinue, onBack }) {
  if (cart.length === 0) {
    return (
      <div className="st-anim" style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🛒</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Votre panier est vide</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Parcourez les événements et ajoutez des billets.</p>
        <button className="st-btn-primary" onClick={onBack}>Explorer les événements</button>
      </div>
    );
  }

  return (
    <div className="st-anim">
      <button onClick={onBack} style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>← Continuer mes achats</button>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>🛒 Mon panier ({cart.length} article{cart.length > 1 ? 's' : ''})</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {cart.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10, flexShrink: 0,
              background: item.cover_url ? `url(${item.cover_url}) center/cover no-repeat` : 'linear-gradient(135deg, #1a103c, #2d1b69)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
            }}>{!item.cover_url && (item.image || '🎫')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.eventTitre}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.billetNom} × {item.qty} · {formatDate(item.date)} · {item.ville}</div>
            </div>
            <div style={{ fontWeight: 800, color: '#3B82F6', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{formatPrix(item.prix * item.qty)}</div>
            <button onClick={() => onRemove(i)} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', fontSize: '0.78rem' }}>✕</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderRadius: 14, background: 'var(--bg-primary)', border: '1px solid var(--border)', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>Total</span>
        <span style={{ fontWeight: 800, color: '#8B5CF6', fontSize: '1.3rem' }}>{formatPrix(total)}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="st-btn-primary" onClick={onContinue} style={{ flex: 1, minWidth: 200, padding: '14px 24px', fontSize: '1rem' }}>
          💳 Passer au paiement
        </button>
        <button onClick={onClear} style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Vider le panier</button>
      </div>
    </div>
  );
}

function CheckoutView({ cart, total, onConfirm, onBack }) {
  const [buyer, setBuyer] = useState({ nom: '', prenom: '', email: '', tel: '' });
  const [method, setMethod] = useState('wave');
  const [processing, setProcessing] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [groupEmails, setGroupEmails] = useState('');

  const commission = Math.round(total * COMMISSION_RATE);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') discount = Math.round(total * (appliedCoupon.value / 100));
    else discount = Math.min(appliedCoupon.value, total);
  }
  const totalTTC = total + commission - discount;

  const canSubmit = buyer.nom && buyer.prenom && buyer.email && buyer.tel;

  function applyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      setAppliedCoupon({ code, ...VALID_COUPONS[code] });
    } else {
      setAppliedCoupon(null);
    }
  }

  async function handlePay() {
    if (!canSubmit) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    onConfirm(method, buyer, { discount, couponCode: appliedCoupon?.code || null, groupEmails: groupEmails.split(',').map(e => e.trim()).filter(Boolean) });
    setProcessing(false);
  }

  return (
    <div className="st-anim">
      <button onClick={onBack} style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>← Retour au panier</button>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>💳 Paiement</h2>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Récap */}
        <div className="st-card" style={{ padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Récapitulatif</h3>
          {cart.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.eventTitre} — {item.billetNom} × {item.qty}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{formatPrix(item.prix * item.qty)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sous-total billets</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{formatPrix(total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Frais de service SenTicket (7%)</span>
            <span style={{ fontWeight: 600, color: '#F59E0B', fontSize: '0.85rem' }}>+ {formatPrix(commission)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Code promo ({appliedCoupon.code})</span>
              <span style={{ fontWeight: 600, color: '#00c853', fontSize: '0.85rem' }}>- {formatPrix(discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '2px solid var(--border)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total à payer</span>
            <span style={{ fontWeight: 800, color: '#8B5CF6', fontSize: '1.15rem' }}>{formatPrix(totalTTC)}</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>
            💡 La commission couvre les frais de transaction mobile money et le service de la plateforme. L'organisateur reçoit le net après déduction.
          </p>
        </div>

        {/* Formulaire */}
        <div className="st-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Informations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <input className="st-input" placeholder="Prénom" value={buyer.prenom} onChange={e => setBuyer({ ...buyer, prenom: e.target.value })} />
            <input className="st-input" placeholder="Nom" value={buyer.nom} onChange={e => setBuyer({ ...buyer, nom: e.target.value })} />
            <input className="st-input" placeholder="Email" type="email" value={buyer.email} onChange={e => setBuyer({ ...buyer, email: e.target.value })} />
            <input className="st-input" placeholder="Téléphone (Wave/OM/Free)" value={buyer.tel} onChange={e => setBuyer({ ...buyer, tel: e.target.value })} />
          </div>

          {/* Code promo */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>🎟️ Code promo</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input className="st-input" placeholder="Saisissez un code (ex: SENTICKET10)" value={coupon} onChange={e => setCoupon(e.target.value)} style={{ flex: 1 }} />
            <button onClick={applyCoupon} className="st-btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>Appliquer</button>
          </div>

          {/* Partage groupe */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>🧑‍🤝‍🧑 Acheter pour un groupe</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <textarea className="st-input" placeholder="Emails des participants (séparés par des virgules, optionnel)" rows={2} value={groupEmails} onChange={e => setGroupEmails(e.target.value)} />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Les billets seront envoyés à ces emails après confirmation du paiement.</p>
          </div>

          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Moyen de paiement</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {[
              { id: 'wave', label: 'Wave', color: '#1b4db3', icon: '💙' },
              { id: 'orange', label: 'Orange Money', color: '#ff6600', icon: '🍊' },
              { id: 'free', label: 'Free Money', color: '#00a0e3', icon: '💚' },
              { id: 'card', label: 'Carte bancaire', color: '#8B5CF6', icon: '💳' },
            ].map(p => (
              <div
                key={p.id}
                onClick={() => setMethod(p.id)}
                style={{
                  padding: '12px 14px', borderRadius: 12, border: `2px solid ${method === p.id ? p.color : 'var(--border)'}`,
                  background: method === p.id ? `${p.color}08` : 'var(--bg-card)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{p.label}</span>
                {method === p.id && <span style={{ marginLeft: 'auto', color: p.color, fontWeight: 700 }}>✓</span>}
              </div>
            ))}
          </div>

          <button
            className="st-btn-primary"
            onClick={handlePay}
            disabled={!canSubmit || processing}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', opacity: !canSubmit || processing ? 0.6 : 1 }}
          >
            {processing ? 'Traitement... ⏳' : `Payer ${formatPrix(totalTTC)}`}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10 }}>🔒 Paiement sécurisé · Vos données sont cryptées</p>
        </div>
      </div>
    </div>
  );
}

function HistoriqueView({ orders, events, reviews, setReviews, onBack }) {
  if (orders.length === 0) {
    return (
      <div className="st-anim" style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎫</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Aucun billet acheté</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Vos billets apparaîtront ici après achat.</p>
        <button className="st-btn-primary" onClick={onBack}>Explorer les événements</button>
      </div>
    );
  }

  function exportTicket(o) {
    const lines = [
      '═══════════════════════════════════════',
      '         SENTICKET · BILLET',
      '═══════════════════════════════════════',
      '',
      `Événement : ${o.eventTitre}`,
      `Billet    : ${o.billetNom} × ${o.qty}`,
      `Total     : ${formatPrix(o.total)}`,
      `Acheteur  : ${o.acheteur?.prenom || ''} ${o.acheteur?.nom || ''}`,
      `Email     : ${o.acheteur?.email || ''}`,
      `Tél       : ${o.acheteur?.tel || ''}`,
      `Date achat: ${formatDate(o.dateAchat)}`,
      `Statut    : ${o.statut.toUpperCase()}`,
      `ID        : ${o.id}`,
      '',
      '═══════════════════════════════════════',
      '  Présentez ce billet à l\'entrée',
      '═══════════════════════════════════════',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billet-${o.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function isPastEvent(eventDate) {
    return new Date(eventDate) < new Date();
  }

  return (
    <div className="st-anim">
      <button onClick={onBack} style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>← Explorer</button>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>🎫 Mes billets ({orders.length})</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {orders.map(o => {
          const evt = events.find(e => e.id === o.eventId);
          const past = evt && isPastEvent(evt.date);
          const review = reviews[o.eventId];
          return (
            <div key={o.id} className="st-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 4 }}>{o.eventTitre}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {o.billetNom} × {o.qty} · {formatPrix(o.total)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="st-badge" style={{ background: 'rgba(0,200,83,0.12)', color: '#00c853' }}>✓ {o.statut}</span>
                    <span className="st-badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>{formatDate(o.dateAchat)}</span>
                    <span className="st-badge" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>{o.paymentMethod}</span>
                    {o.couponCode && <span className="st-badge" style={{ background: 'rgba(245,197,24,0.1)', color: '#D4A017' }}>🎟 {o.couponCode}</span>}
                    {past && <span className="st-badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>✅ Terminé</span>}
                  </div>
                </div>
                <QRCodeDisplay data={o.qrData} size={90} />
              </div>
              {past && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  {!review ? (
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>⭐ Noter cet événement</div>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                        {[1,2,3,4,5].map(star => (
                          <button key={star} onClick={() => { const next = { ...reviews, [o.eventId]: { stars: star, text: '', date: new Date().toISOString() } }; setReviews(next); saveReviews(next); }} style={{
                            fontSize: '1.4rem', background: 'none', border: 'none', cursor: 'pointer', color: '#F5C518',
                          }}>⭐</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>⭐ Votre avis</div>
                      <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{'⭐'.repeat(review.stars)}</div>
                      {!review.text ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input className="st-input" placeholder="Décrivez votre expérience..." value={review.draft || ''} onChange={e => { const next = { ...reviews, [o.eventId]: { ...review, draft: e.target.value } }; setReviews(next); }} style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px' }} />
                          <button onClick={() => { const next = { ...reviews, [o.eventId]: { ...review, text: review.draft || '', draft: '' } }; setReviews(next); saveReviews(next); }} className="st-btn-primary" style={{ padding: '6px 12px', fontSize: '0.72rem' }}>Envoyer</button>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{review.text}"</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID : {o.id} · Présentez ce QR code à l'entrée</span>
                <button onClick={() => exportTicket(o)} style={{
                  padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 600,
                }}>📥 Télécharger le billet</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QRCodeDisplay({ data, size = 90 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#0a0a0a';
    const cell = Math.max(2, Math.floor(size / 25));
    const hash = data.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 25; x++) {
        const bit = ((hash + x * 7 + y * 13) % 17) > 4;
        // Finder patterns (corners)
        const isFinder = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
        if (isFinder) {
          const fx = x < 7 ? x : x - 18;
          const fy = y < 7 ? y : y - 17;
          const inFinder = (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4) || (fx === 0 || fx === 6 || fy === 0 || fy === 6) || (fx >= 1 && fx <= 5 && fy >= 1 && fy <= 5);
          ctx.fillStyle = inFinder ? '#0a0a0a' : '#fff';
          ctx.fillRect(x * cell, y * cell, cell, cell);
          ctx.fillStyle = '#0a0a0a';
        } else if (bit) {
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
    // Corner markers
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 7 * cell, cell); ctx.fillRect(0, 0, cell, 7 * cell);
    ctx.fillRect(0, 6 * cell, 7 * cell, cell); ctx.fillRect(6 * cell, 0, cell, 7 * cell);
    ctx.fillRect(2 * cell, 2 * cell, 3 * cell, 3 * cell);

    ctx.fillRect((size - 7 * cell), 0, 7 * cell, cell); ctx.fillRect(size - cell, 0, cell, 7 * cell);
    ctx.fillRect((size - 7 * cell), 6 * cell, 7 * cell, cell); ctx.fillRect(size - cell, 0, cell, 7 * cell);
    ctx.fillRect(size - 5 * cell, 2 * cell, 3 * cell, 3 * cell);

    ctx.fillRect(0, (size - 7 * cell), cell, 7 * cell); ctx.fillRect(0, size - cell, 7 * cell, cell);
    ctx.fillRect(6 * cell, (size - 7 * cell), cell, 7 * cell); ctx.fillRect(0, size - 7 * cell, cell, 7 * cell);
    ctx.fillRect(2 * cell, size - 5 * cell, 3 * cell, 3 * cell);
  }, [data, size]);

  return (
    <div style={{ padding: 6, background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
      <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block', imageRendering: 'pixelated' }} />
    </div>
  );
}

function OrganizerView({ onCreate, onViewEvents }) {
  const [form, setForm] = useState({
    titre: '', description: '', date: '', heure: '', ville: 'Dakar', lieu: '',
    categorie: 'Concert', image: '🎤', cover_url: '',
    billets: [{ id: newId('bt'), nom: 'Standard', prix: '', places: '' }],
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'images', 'senticket');
      setForm({ ...form, cover_url: url });
    } catch (err) {
      alert('Erreur upload : ' + err.message);
    }
    setUploading(false);
  }

  function addBillet() {
    setForm({ ...form, billets: [...form.billets, { id: newId('bt'), nom: '', prix: '', places: '' }] });
  }

  function updateBillet(i, field, value) {
    const b = [...form.billets];
    b[i] = { ...b[i], [field]: field === 'nom' ? value : (value === '' ? '' : parseInt(value)) };
    setForm({ ...form, billets: b });
  }

  function removeBillet(i) {
    setForm({ ...form, billets: form.billets.filter((_, j) => j !== i) });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const billets = form.billets.map(b => ({
      id: b.id,
      nom: b.nom || 'Billet',
      prix: Number(b.prix) || 0,
      places: Number(b.places) || 100,
      vendus: 0,
    }));
    onCreate({
      titre: form.titre,
      description: form.description,
      date: form.date,
      heure: form.heure,
      ville: form.ville,
      lieu: form.lieu,
      categorie: form.categorie,
      image: form.cover_url ? '📷' : form.image,
      cover_url: form.cover_url,
      billets,
    });
  }

  const canSubmit = form.titre && form.date && form.heure && form.lieu && form.billets.every(b => b.nom && b.prix && b.places);

  return (
    <div className="st-anim">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>➕ Créer un événement</h2>
        <button className="st-btn-primary" onClick={onViewEvents}>📋 Mes événements</button>
      </div>

      <form onSubmit={handleSubmit} className="st-card" style={{ padding: '24px', maxWidth: 700 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Informations générales</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <input className="st-input" placeholder="Titre de l'événement *" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required />
          <textarea className="st-input" placeholder="Description *" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="st-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            <input className="st-input" type="time" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select className="st-select" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })}>
              {VILLES.slice(1).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <input className="st-input" placeholder="Lieu précis *" value={form.lieu} onChange={e => setForm({ ...form, lieu: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select className="st-select" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
              {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="st-input" placeholder="URL image (optionnel)" value={form.cover_url} onChange={e => setForm({ ...form, cover_url: e.target.value })} style={{ flex: 1 }} />
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                padding: '7px 12px', borderRadius: 10, whiteSpace: 'nowrap',
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                color: '#8B5CF6', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
              }}>{uploading ? '⏳' : '📁 Upload'}</button>
            </div>
          </div>
          {form.cover_url && (
            <img src={form.cover_url} alt="Aperçu" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />
          )}
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Catégories de billets</h3>
        {form.billets.map((b, i) => (
          <div key={b.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input className="st-input" placeholder="Nom" style={{ flex: 2 }} value={b.nom} onChange={e => updateBillet(i, 'nom', e.target.value)} required />
            <input className="st-input" placeholder="Prix" type="number" style={{ flex: 1 }} value={b.prix} onChange={e => updateBillet(i, 'prix', e.target.value)} required />
            <input className="st-input" placeholder="Places" type="number" style={{ flex: 1 }} value={b.places} onChange={e => updateBillet(i, 'places', e.target.value)} required />
            {form.billets.length > 1 && (
              <button type="button" onClick={() => removeBillet(i)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', fontSize: '0.78rem' }}>✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addBillet} style={{ marginBottom: 20, padding: '6px 14px', borderRadius: 10, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>+ Ajouter une catégorie</button>

        <button type="submit" className="st-btn-primary" disabled={!canSubmit} style={{ width: '100%', padding: '14px', fontSize: '1rem', opacity: canSubmit ? 1 : 0.5 }}>
          🚀 Publier l'événement
        </button>
      </form>
    </div>
  );
}

function MesEventsView({ events, orders, withdrawals, onBack, onDelete, onViewDetail, onRequestWithdrawal }) {
  if (events.length === 0) {
    return (
      <div className="st-anim" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
        <p style={{ color: 'var(--text-muted)' }}>Vous n'avez pas encore créé d'événement.</p>
        <button className="st-btn-primary" onClick={onBack} style={{ marginTop: 16 }}>Créer mon premier événement</button>
      </div>
    );
  }

  // Agrégation globale
  const globalCA = events.reduce((s, e) => s + e.billets.reduce((s2, b) => s2 + b.prix * b.vendus, 0), 0);
  const globalComm = Math.round(globalCA * COMMISSION_RATE);
  const globalNet = globalCA - globalComm;
  const globalRetire = withdrawals.reduce((s, w) => s + w.montant, 0);
  const globalDispo = globalNet - globalRetire;

  return (
    <div className="st-anim">
      <button onClick={onBack} style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>← Créer un événement</button>

      {/* Dashboard financier global */}
      <div className="st-card" style={{ padding: '20px', marginBottom: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>💰 Dashboard Organisateur</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          <DashBox label="CA Brut" value={formatPrix(globalCA)} color="#3B82F6" />
          <DashBox label={`Commission (${(COMMISSION_RATE*100).toFixed(0)}%)`} value={formatPrix(globalComm)} color="#F59E0B" />
          <DashBox label="Net Organisateur" value={formatPrix(globalNet)} color="#8B5CF6" />
          <DashBox label="Déjà retiré" value={formatPrix(globalRetire)} color="#00c853" />
          <DashBox label="Disponible" value={formatPrix(globalDispo)} color={globalDispo > 0 ? '#18A84A' : '#EF4444'} />
        </div>
        {globalDispo > 0 && (
          <button className="st-btn-gold" onClick={() => onRequestWithdrawal(globalDispo)} style={{ width: '100%', marginTop: 14, padding: '12px' }}>
            💸 Demander un reversement de {formatPrix(globalDispo)}
          </button>
        )}
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10 }}>
          Les reversements se font par virement bancaire ou Mobile Money Business une fois l'événement terminé.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>📋 Mes événements ({events.length})</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {events.map(evt => {
          const totalPlaces = evt.billets.reduce((s, b) => s + b.places, 0);
          const totalVendus = evt.billets.reduce((s, b) => s + b.vendus, 0);
          const ca = evt.billets.reduce((s, b) => s + b.prix * b.vendus, 0);
          const comm = Math.round(ca * COMMISSION_RATE);
          const net = ca - comm;
          return (
            <div key={evt.id} className="st-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 4 }}>{evt.titre}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>📅 {formatDate(evt.date)} · {evt.ville} · {evt.categorie}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span className="st-badge" style={{ background: 'rgba(0,200,83,0.12)', color: '#00c853' }}>{totalVendus} / {totalPlaces} vendus</span>
                    <span className="st-badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>CA {formatPrix(ca)}</span>
                    <span className="st-badge" style={{ background: 'rgba(245,197,24,0.1)', color: '#D4A017' }}>Comm {formatPrix(comm)}</span>
                    <span className="st-badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>Net {formatPrix(net)}</span>
                  </div>
                  {evt.cover_url && <img src={evt.cover_url} alt="" style={{ width: '100%', maxHeight: 100, objectFit: 'cover', borderRadius: 8, marginTop: 4 }} />}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => onViewDetail(evt)} className="st-btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>Voir</button>
                  <button onClick={() => onDelete(evt.id)} style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historique des retraits */}
      {withdrawals.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>📤 Historique des reversements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {withdrawals.map(w => (
              <div key={w.id} className="st-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{formatPrix(w.montant)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(w.date)} · {w.statut}</div>
                </div>
                <span className="st-badge" style={{
                  background: w.statut === 'Traité' ? 'rgba(0,200,83,0.12)' : 'rgba(245,197,24,0.1)',
                  color: w.statut === 'Traité' ? '#00c853' : '#D4A017'
                }}>{w.statut}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DashBox({ label, value, color }) {
  return (
    <div style={{ padding: '12px', borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border)', textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 800, color, fontSize: '0.95rem' }}>{value}</div>
    </div>
  );
}
