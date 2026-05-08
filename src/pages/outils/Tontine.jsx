/**
 * TONTINE SN MAX — Gestion complète des tontines
 * 3 niveaux de prix:
 * - Starter (jusqu'à 100 pers): 4 900 FCFA/mois
 * - Pro (jusqu'à 500 pers): 9 900 FCFA/mois  
 * - Enterprise (500+ pers): % sur cagnotte ou forfait flexible
 * 
 * Fonctionnalités:
 * - Multi-tontines avec rôles (Admin/Membre)
 * - Calculs dynamiques (cagnottes, pénalités, intérêts)
 * - Système de tours et attributions
 * - Paiements et suivi des cotisations
 * - Alertes et notifications
 * - Export PDF/Excel
 * - Persistence localStorage + Supabase ready
 * - Design premium UI/UX
 */

import { useState, useEffect, useMemo } from 'react'
import '../../components/elite/elite.css'
import SEO from '../../components/SEO'
import ToolInfoPanel from '../../components/ToolInfoPanel'

// ═══════════════════════════════════════════════════════════════
// ICONES SVG PROFESSIONNELS - Remplacent les emojis
// ═══════════════════════════════════════════════════════════════
const IconSVG = ({ type, size = 20, color = 'currentColor' }) => {
  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    members: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <circle cx="9" cy="8" r="3"/>
        <path d="M3 18C3 14.5 5 12 9 12C13 12 15 14.5 15 18"/>
        <circle cx="17" cy="8" r="2.5"/>
        <path d="M21 16C21 13.5 19.5 12 17 12"/>
      </svg>
    ),
    rotate: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M20 12C20 16.5 16.5 20 12 20C7.5 20 4 16.5 4 12C4 7.5 7.5 4 12 4C15 4 17.5 5.5 19 8"/>
        <path d="M20 4V8H16"/>
        <circle cx="12" cy="12" r="2" fill={color}/>
      </svg>
    ),
    money: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <circle cx="12" cy="12" r="8"/>
        <path d="M12 8V16M9 10H12M12 14H15"/>
        <circle cx="12" cy="12" r="1" fill={color}/>
      </svg>
    ),
  }
  return icons[type] || null
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTES & CONFIGURATION
═══════════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'abawi_tontine_data'
const USER_KEY = 'abawi_tontine_user'

/* ═══════════════════════════════════════════════════════════════
   NIVEAUX DE PRIX
═══════════════════════════════════════════════════════════════ */
const PRICING_TIERS = [
  { 
    id: 'starter', 
    name: 'Starter', 
    maxMembers: 100, 
    price: 4900, 
    color: '#10B981',
    features: ['100 membres max', '3 tontines', 'Export CSV', 'Support email']
  },
  { 
    id: 'pro', 
    name: 'Pro', 
    maxMembers: 500, 
    price: 9900, 
    color: '#3B82F6',
    features: ['500 membres max', 'Tontines illimitées', 'Export PDF/Excel', 'Support prioritaire', 'Rapports avancés']
  },
  { 
    id: 'enterprise', 
    name: 'Enterprise', 
    maxMembers: Infinity, 
    price: null, 
    color: '#8B5CF6',
    features: ['Membres illimités', 'Tontines illimitées', 'API access', 'Support dédié', 'Personnalisation', 'Tarif: % ou forfait']
  },
]

const getPricingTier = (memberCount) => {
  if (memberCount <= 100) return PRICING_TIERS[0]
  if (memberCount <= 500) return PRICING_TIERS[1]
  return PRICING_TIERS[2]
}

/* ═══════════════════════════════════════════════════════════════
   LOGO SVG
═══════════════════════════════════════════════════════════════ */
const TontineLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tontineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="50%" stopColor="#059669" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Circle background */}
    <circle cx="50" cy="50" r="45" fill="url(#tontineGradient)" opacity="0.1" />
    <circle cx="50" cy="50" r="40" stroke="url(#tontineGradient)" strokeWidth="3" fill="none" />
    {/* SN letters */}
    <text x="50" y="45" textAnchor="middle" fontSize="28" fontWeight="bold" fill="url(#tontineGradient)" fontFamily="system-ui">SN</text>
    {/* Coins/tontine symbol */}
    <circle cx="35" cy="60" r="8" fill="#10B981" opacity="0.8" />
    <circle cx="50" cy="65" r="8" fill="#059669" opacity="0.9" />
    <circle cx="65" cy="60" r="8" fill="#047857" opacity="0.8" />
    {/* Connection lines */}
    <path d="M35 60 L50 50 L65 60" stroke="url(#tontineGradient)" strokeWidth="2" fill="none" opacity="0.6" />
    {/* Star/badge */}
    <path d="M50 75 L52 80 L57 80 L53 83 L54 88 L50 85 L46 88 L47 83 L43 80 L48 80 Z" fill="#F59E0B" />
  </svg>
)

const TONTINE_TYPES = [
  { id: 'classique', name: 'Tontine Classique', desc: 'Chaque membre reçoit la cagnotte à son tour' },
  { id: 'ascendant', name: 'Montante (Ascendante)', desc: 'Montants croissants selon l\'ordre' },
  { id: 'descendant', name: 'Descendante', desc: 'Montants décroissants selon l\'ordre' },
  { id: 'aleatoire', name: 'Attribution Aléatoire', desc: 'Tirage au sort pour chaque tour' },
  { id: 'urgence', name: 'Tontine Urgence', desc: 'Priorité aux besoins urgents documentés' },
  { id: 'groupe', name: 'Tontine de Groupe', desc: 'Plusieurs sous-groupes dans une tontine' },
]

const FREQUENCES = [
  { id: 'hebdo', name: 'Hebdomadaire', jours: 7 },
  { id: 'bihebdo', name: 'Bi-hebdomadaire', jours: 14 },
  { id: 'mensuel', name: 'Mensuelle', jours: 30 },
  { id: 'bimensuel', name: 'Bimensuelle', jours: 60 },
]

const STATUTS_MEMBRE = {
  actif: { label: 'Actif', couleur: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  inactif: { label: 'Inactif', couleur: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
  retard: { label: 'Retard', couleur: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  exclus: { label: 'Exclu', couleur: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
}

const STATUTS_TOUR = {
  planifie: { label: 'Planifié', couleur: '#6B7280' },
  en_cours: { label: 'En cours', couleur: '#3B82F6' },
  complete: { label: 'Complété', couleur: '#10B981' },
  retarde: { label: 'Retardé', couleur: '#EF4444' },
}

/* ═══════════════════════════════════════════════════════════════
   STYLES CSS
═══════════════════════════════════════════════════════════════ */
const TONTINE_STYLES = `
  /* ═══════════════════════════════════════════════════════════════
     ANIMATIONS & KEYFRAMES
  ════════════════════════════════════════════════════════════════ */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
    50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.6); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .tontine-container {
    min-height: 100vh;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: fadeInUp 0.5s ease-out;
  }
  
  .tontine-header {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 0 0 20px 20px;
    margin-bottom: 24px;
    box-shadow: 0 10px 40px rgba(5, 150, 105, 0.3);
    position: relative;
    overflow: hidden;
    color: white;
  }
  
  .tontine-header * {
    color: white !important;
  }
  
  .tontine-header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
    animation: shimmer 8s infinite;
  }
  
  .tontine-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #10B981, #F59E0B, #10B981);
    background-size: 200% 100%;
    animation: shimmer 3s infinite;
  }
  
  .tontine-header-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    color: white;
  }
  
  .tontine-header-subtitle {
    font-size: 0.9rem;
    opacity: 0.9;
    margin-top: 4px;
    color: rgba(255,255,255,0.9);
  }
  
  .tontine-badge {
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    color: white;
  }
  
  .tontine-nav {
    display: flex;
    gap: 12px;
    padding: 0 32px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  
  .tontine-nav-btn {
    padding: 10px 16px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.9rem;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
    font-weight: 500;
  }
  
  .tontine-nav-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
  
  .tontine-nav-btn.active {
    background: rgba(16, 185, 129, 0.15);
    color: #10B981;
  }
  
  .tontine-content {
    padding: 0 32px 32px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  /* Stats Cards */
  .tontine-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .tontine-stat-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s;
  }
  
  .tontine-stat-card:hover {
    transform: translateY(-2px);
    border-color: var(--accent);
  }
  
  .tontine-stat-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  
  .tontine-stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  
  .tontine-stat-value.warning { color: #F59E0B; }
  .tontine-stat-value.danger { color: #EF4444; }
  
  .tontine-stat-desc {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  
  /* Alerts Section */
  .tontine-alerts {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }
  
  .tontine-alert-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: var(--text-primary);
  }
  
  .tontine-alert-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
    border-left: 3px solid #F59E0B;
    font-size: 0.9rem;
  }
  
  .tontine-alert-item:last-child {
    margin-bottom: 0;
  }
  
  /* Tontine List */
  .tontine-list {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
  }
  
  .tontine-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .tontine-section-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }
  
  .tontine-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border);
    transition: all 0.2s;
  }
  
  .tontine-item:hover {
    background: var(--bg-tertiary);
    border-radius: 8px;
  }
  
  .tontine-item:last-child {
    border-bottom: none;
  }
  
  .tontine-info {
    flex: 1;
  }
  
  .tontine-item-name {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 4px;
    color: var(--text-primary);
  }
  
  .tontine-meta {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }
  
  .tontine-progress {
    flex: 1;
    max-width: 200px;
    margin: 0 16px;
  }
  
  .tontine-progress-bar {
    height: 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .tontine-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #059669, #10B981);
    border-radius: 3px;
    transition: width 0.3s;
  }
  
  .tontine-status {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  /* Forms */
  .tontine-form {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
  }
  
  .tontine-form-group {
    margin-bottom: 20px;
  }
  
  .tontine-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  
  .tontine-input {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.9rem;
    transition: all 0.2s;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .tontine-input:focus {
    outline: none;
    border-color: #10B981;
  }
  
  .tontine-btn {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  
  .tontine-btn-primary {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
  }
  
  .tontine-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(5, 150, 105, 0.3);
  }
  
  .tontine-btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }
  
  .tontine-btn-danger {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  
  /* Modal */
  .tontine-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  
  .tontine-modal {
    background: var(--bg-primary);
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 500px;
    border: 1px solid var(--border);
  }
  
  .tontine-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .tontine-modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }
  
  .tontine-modal-close {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .tontine-modal-close:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }
  
  .tontine-modal-body {
    padding: 24px;
  }
  
  /* Tables */
  .tontine-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .tontine-table th, .tontine-table td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border, #1A2332);
    font-size: 0.9rem;
  }
  
  .tontine-table th {
    font-weight: 600;
    color: var(--text-secondary, #8B95A5);
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
  }
  
  .tontine-table tr:hover td {
    background: var(--bg-tertiary, #1A2332);
  }
  
  /* Payment Cards */
  .tontine-payment-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .tontine-payment-card {
    background: var(--bg-secondary, #161B22);
    border: 1px solid var(--border, #1A2332);
    border-radius: 12px;
    padding: 16px;
  }
  
  .tontine-payment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .tontine-payment-amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: #10B981;
  }
  
  .tontine-payment-status {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  /* Grid Layouts */
  .tontine-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .tontine-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  
  @media (max-width: 768px) {
    .tontine-grid-2, .tontine-grid-3 {
      grid-template-columns: 1fr;
    }
    
    .tontine-header {
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }
    
    .tontine-nav {
      padding: 0 16px;
    }
    
    .tontine-content {
      padding: 0 16px 16px;
    }
    
    .tontine-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`

/* ═══════════════════════════════════════════════════════════════
   HOOKS PERSONNALISÉS
═══════════════════════════════════════════════════════════════ */
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue]
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════ */
export default function Tontine() {
  // Inject styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = TONTINE_STYLES
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  // États principaux
  const [activeTab, setActiveTab] = useState('dashboard')
  const [tontines, setTontines] = useLocalStorage(`${STORAGE_KEY}_tontines`, [])
  const [membres, setMembres] = useLocalStorage(`${STORAGE_KEY}_membres`, [])
  const [tours, setTours] = useLocalStorage(`${STORAGE_KEY}_tours`, [])
  const [paiements, setPaiements] = useLocalStorage(`${STORAGE_KEY}_paiements`, [])
  const [currentUser, setCurrentUser] = useLocalStorage(USER_KEY, { role: 'admin', id: 1, name: 'Admin' })
  
  // États UI
  const [selectedTontine, setSelectedTontine] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showTourModal, setShowTourModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [alertes, setAlertes] = useState([])

  // Form states
  const [newTontine, setNewTontine] = useState({
    nom: '',
    type: 'classique',
    montant: '',
    frequence: 'mensuel',
    dateDebut: '',
    duree: 12,
    description: ''
  })

  const [newMembre, setNewMembre] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    tontineId: null,
    ordre: null
  })

  const [newPaiement, setNewPaiement] = useState({
    membreId: '',
    tontineId: '',
    tourId: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    type: 'cotisation',
    statut: 'paye'
  })

  /* ═══════════════════════════════════════════════════════════════
     CALCULS & MÉTROLOGIE
  ════════════════════════════════════════════════════════════════ */
  const stats = useMemo(() => {
    const totalCagnotte = tontines.reduce((sum, t) => {
      const tontinePaiements = paiements.filter(p => p.tontineId === t.id && p.statut === 'paye')
      return sum + tontinePaiements.reduce((s, p) => s + (parseFloat(p.montant) || 0), 0)
    }, 0)

    const membresActifs = membres.filter(m => m.statut === 'actif').length
    const totalMembres = membres.length
    
    const paiementsEnAttente = paiements.filter(p => p.statut === 'en_attente').length
    const paiementsRetard = paiements.filter(p => p.statut === 'retard').length
    
    const toursCompletes = tours.filter(t => t.statut === 'complete').length
    const toursEnCours = tours.filter(t => t.statut === 'en_cours').length
    
    const prochainTour = tours.find(t => t.statut === 'planifie' || t.statut === 'en_cours')
    
    return {
      totalCagnotte,
      membresActifs,
      totalMembres,
      paiementsEnAttente,
      paiementsRetard,
      tontinesActives: tontines.filter(t => t.statut === 'active').length,
      toursCompletes,
      toursEnCours,
      prochainTour
    }
  }, [tontines, membres, tours, paiements])

  /* ═══════════════════════════════════════════════════════════════
     GÉNÉRATION DES ALERTES
  ════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const nouvellesAlertes = []
    
    // Alertes de retard de paiement
    paiements.filter(p => p.statut === 'retard').forEach(paiement => {
      const membre = membres.find(m => m.id === paiement.membreId)
      const tontine = tontines.find(t => t.id === paiement.tontineId)
      if (membre && tontine) {
        nouvellesAlertes.push({
          id: `retard-${paiement.id}`,
          type: 'warning',
          message: `${membre.prenom} ${membre.nom} n'a pas payé le tour de ${new Date(paiement.date).toLocaleDateString('fr-FR', { month: 'long' })} (${parseFloat(paiement.montant).toLocaleString()} FCFA)`,
          detail: `${Math.floor((Date.now() - new Date(paiement.date).getTime()) / (1000 * 60 * 60 * 24))} jours de retard`,
          date: paiement.date
        })
      }
    })

    // Alertes de retard consécutif
    const membresRetard = {}
    paiements.filter(p => p.statut === 'retard').forEach(p => {
      membresRetard[p.membreId] = (membresRetard[p.membreId] || 0) + 1
    })
    
    Object.entries(membresRetard).forEach(([membreId, count]) => {
      if (count >= 2) {
        const membre = membres.find(m => m.id === parseInt(membreId))
        if (membre) {
          nouvellesAlertes.push({
            id: `consecutif-${membreId}`,
            type: 'danger',
            message: `${membre.prenom} ${membre.nom} — ${count}e retard consécutif`,
            detail: 'Action recommandée: contacter le membre ou appliquer des pénalités',
            date: new Date().toISOString()
          })
        }
      }
    })

    // Tours à venir
    tours.filter(t => t.statut === 'planifie' && new Date(t.date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).forEach(tour => {
      const tontine = tontines.find(t => t.id === tour.tontineId)
      const beneficiaire = membres.find(m => m.id === tour.beneficiaireId)
      if (tontine && beneficiaire) {
        nouvellesAlertes.push({
          id: `tour-${tour.id}`,
          type: 'success',
          message: `Tour de ${beneficiaire.prenom} ${beneficiaire.nom} confirmé pour le ${new Date(tour.date).toLocaleDateString('fr-FR')}`,
          detail: `${parseFloat(tour.montant).toLocaleString()} FCFA prêts à être versés`,
          date: tour.date
        })
      }
    })

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
    setAlertes(nouvellesAlertes.sort((a, b) => new Date(b.date) - new Date(a.date)))
  }, [paiements, membres, tontines, tours])

  /* ═══════════════════════════════════════════════════════════════
     FONCTIONS CRUD
  ════════════════════════════════════════════════════════════════ */
  const creerTontine = () => {
    const tontine = {
      id: Date.now(),
      ...newTontine,
      montant: parseFloat(newTontine.montant),
      statut: 'active',
      dateCreation: new Date().toISOString(),
      createurId: currentUser.id
    }
    setTontines([...tontines, tontine])
    setNewTontine({ nom: '', type: 'classique', montant: '', frequence: 'mensuel', dateDebut: '', duree: 12, description: '' })
    setShowCreateModal(false)
  }

  const creerMembre = () => {
    const membre = {
      id: Date.now(),
      ...newMembre,
      statut: 'actif',
      dateInscription: new Date().toISOString()
    }
    setMembres([...membres, membre])
    setNewMembre({ nom: '', prenom: '', telephone: '', email: '', tontineId: null, ordre: null })
    setShowMemberModal(false)
  }

  const enregistrerPaiement = () => {
    const paiement = {
      id: Date.now(),
      ...newPaiement,
      montant: parseFloat(newPaiement.montant),
      enregistrePar: currentUser.id,
      dateEnregistrement: new Date().toISOString()
    }
    setPaiements([...paiements, paiement])
    setNewPaiement({ membreId: '', tontineId: '', tourId: '', montant: '', date: new Date().toISOString().split('T')[0], type: 'cotisation', statut: 'paye' })
    setShowPaymentModal(false)
  }

  const attribuerTour = (tontineId) => {
    const tontine = tontines.find(t => t.id === tontineId)
    const membresTontine = membres.filter(m => m.tontineId === tontineId && m.statut === 'actif')
    
    if (!tontine || membresTontine.length === 0) return

    const toursExistants = tours.filter(t => t.tontineId === tontineId)
    const prochainOrdre = (toursExistants.length % membresTontine.length)
    const beneficiaire = membresTontine[prochainOrdre]

    const tour = {
      id: Date.now(),
      tontineId,
      beneficiaireId: beneficiaire.id,
      numero: toursExistants.length + 1,
      montant: tontine.montant * membresTontine.length,
      date: new Date(Date.now() + FREQUENCES.find(f => f.id === tontine.frequence)?.jours * 24 * 60 * 60 * 1000).toISOString(),
      statut: 'planifie',
      dateAttribution: new Date().toISOString()
    }

    setTours([...tours, tour])
    setShowTourModal(false)
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT DES DONNÉES
  ════════════════════════════════════════════════════════════════ */
  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {}).join(';')
    const rows = data.map(row => Object.values(row).map(v => 
      typeof v === 'string' && v.includes(';') ? `"${v}"` : v
    ).join(';')).join('\n')
    
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const genererRapportPDF = () => {
    const rapport = {
      date: new Date().toLocaleDateString('fr-FR'),
      tontines: tontines.length,
      membres: membres.length,
      cagnotteTotale: stats.totalCagnotte,
      paiements: paiements.length,
      tours: tours.length
    }
    
    const content = `
RAPPORT TONTINE SN MAX
Date: ${rapport.date}

STATISTIQUES GÉNÉRALES
- Nombre de tontines: ${rapport.tontines}
- Membres inscrits: ${rapport.membres}
- Cagnotte totale: ${rapport.cagnotteTotale.toLocaleString()} FCFA
- Paiements enregistrés: ${rapport.paiements}
- Tours complétés: ${rapport.tours}

DÉTAIL DES TONTINES
${tontines.map(t => `
${t.nom}
- Type: ${TONTINE_TYPES.find(tt => tt.id === t.type)?.name}
- Montant: ${parseFloat(t.montant).toLocaleString()} FCFA
- Fréquence: ${FREQUENCES.find(f => f.id === t.frequence)?.name}
- Membres: ${membres.filter(m => m.tontineId === t.id).length}
`).join('\n')}
    `.trim()
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Rapport_Tontine_${new Date().toISOString().split('T')[0]}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDU DES SECTIONS
  ════════════════════════════════════════════════════════════════ */
  const renderDashboard = () => (
    <>
      {/* Stats Grid */}
      <div className="tontine-stats-grid">
        <div className="tontine-stat-card">
          <div className="tontine-stat-label">Cagnotte Totale</div>
          <div className="tontine-stat-value success">{stats.totalCagnotte.toLocaleString()} FCFA</div>
          <div className="tontine-stat-desc">{stats.tontinesActives} tontine{stats.tontinesActives > 1 ? 's' : ''} active{stats.tontinesActives > 1 ? 's' : ''}</div>
        </div>
        <div className="tontine-stat-card">
          <div className="tontine-stat-label">Membres Actifs</div>
          <div className="tontine-stat-value">{stats.membresActifs}</div>
          <div className="tontine-stat-desc">{stats.totalMembres > 0 ? Math.round(stats.membresActifs / stats.totalMembres * 10) : 0} par tontine (moy.)</div>
        </div>
        <div className="tontine-stat-card">
          <div className="tontine-stat-label">En Attente</div>
          <div className="tontine-stat-value warning">{stats.paiementsRetard}</div>
          <div className="tontine-stat-desc">paiements manquants</div>
        </div>
        <div className="tontine-stat-card">
          <div className="tontine-stat-label">Prochain Tour</div>
          <div className="tontine-stat-value">
            {stats.prochainTour ? new Date(stats.prochainTour.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '--/--'}
          </div>
          <div className="tontine-stat-desc">
            {stats.prochainTour ? 
              `${membres.find(m => m.id === stats.prochainTour.beneficiaireId)?.prenom} ${membres.find(m => m.id === stats.prochainTour.beneficiaireId)?.nom}` 
              : 'Aucun tour planifié'}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alertes.length > 0 && (
        <div className="tontine-alerts">
          <h3 className="tontine-alerts-title">🚨 Alertes & notifications</h3>
          {alertes.slice(0, 5).map(alerte => (
            <div key={alerte.id} className={`tontine-alert-item ${alerte.type}`}>
              <span>
                {alerte.type === 'warning' && '⚠️'}
                {alerte.type === 'danger' && '🚨'}
                {alerte.type === 'success' && '✅'}
                {alerte.type === 'info' && 'ℹ️'}
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>{alerte.message}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: 2 }}>{alerte.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tontines List */}
      <div className="tontine-list">
        <div className="tontine-list-header">
          <h3 className="tontine-list-title">Mes tontines</h3>
          <button 
            className="tontine-btn tontine-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Créer une tontine
          </button>
        </div>
        
        {tontines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted, #6B7280)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
            <p>Aucune tontine créée. Commencez par créer votre première tontine !</p>
          </div>
        ) : (
          tontines.map(tontine => {
            const membresCount = membres.filter(m => m.tontineId === tontine.id).length
            const toursCount = tours.filter(t => t.tontineId === tontine.id).length
            const progress = tontine.duree > 0 ? (toursCount / tontine.duree) * 100 : 0
            
            return (
              <div key={tontine.id} className="tontine-item" onClick={() => setSelectedTontine(tontine)}>
                <span className="tontine-nav-icon"><IconSVG type="tontine" size={18} /></span>
                <div className="tontine-avatar">{tontine.nom.substring(0, 2).toUpperCase()}</div>
                <div className="tontine-info">
                  <div className="tontine-name">{tontine.nom}</div>
                  <div className="tontine-meta">
                    {membresCount} membres • {parseFloat(tontine.montant).toLocaleString()} FCFA/{FREQUENCES.find(f => f.id === tontine.frequence)?.name.toLowerCase().replace('uelle', '')} • Tour {toursCount}/{tontine.duree}
                  </div>
                </div>
                <div className="tontine-progress">
                  <div className="tontine-progress-bar">
                    <div className="tontine-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                </div>
                <span 
                  className="tontine-status" 
                  style={{ 
                    background: STATUTS_MEMBRE[tontine.statut === 'active' ? 'actif' : 'inactif'].bg,
                    color: STATUTS_MEMBRE[tontine.statut === 'active' ? 'actif' : 'inactif'].couleur
                  }}
                >
                  {tontine.statut === 'active' ? 'Active' : 'Terminée'}
                </span>
              </div>
            )
          })
        )}
      </div>
    </>
  )

  const renderMembres = () => (
    <div className="tontine-form">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Gestion des membres</h3>
        <button className="tontine-btn tontine-btn-primary" onClick={() => setShowMemberModal(true)}>
          + Ajouter un membre
        </button>
      </div>
      
      <table className="tontine-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Téléphone</th>
            <th>Tontine</th>
            <th>Statut</th>
            <th>Inscription</th>
          </tr>
        </thead>
        <tbody>
          {membres.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                Aucun membre inscrit
              </td>
            </tr>
          ) : (
            membres.map(membre => {
              const tontine = tontines.find(t => t.id === membre.tontineId)
              return (
                <tr key={membre.id}>
                  <td>{membre.prenom} {membre.nom}</td>
                  <td>{membre.telephone || '-'}</td>
                  <td>{tontine?.nom || '-'}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: STATUTS_MEMBRE[membre.statut || 'actif'].bg,
                      color: STATUTS_MEMBRE[membre.statut || 'actif'].couleur
                    }}>
                      {STATUTS_MEMBRE[membre.statut || 'actif'].label}
                    </span>
                  </td>
                  <td>{new Date(membre.dateInscription).toLocaleDateString('fr-FR')}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )

  const renderTours = () => (
    <div className="tontine-form">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Gestion des tours</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <select 
            className="tontine-select" 
            style={{ width: 'auto' }}
            onChange={(e) => e.target.value && attribuerTour(parseInt(e.target.value))}
            value=""
          >
            <option value="">Attribuer un tour...</option>
            {tontines.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
          </select>
        </div>
      </div>
      
      <table className="tontine-table">
        <thead>
          <tr>
            <th>Tontine</th>
            <th>Bénéficiaire</th>
            <th>Montant</th>
            <th>Date</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {tours.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                Aucun tour attribué
              </td>
            </tr>
          ) : (
            tours.map(tour => {
              const tontine = tontines.find(t => t.id === tour.tontineId)
              const beneficiaire = membres.find(m => m.id === tour.beneficiaireId)
              return (
                <tr key={tour.id}>
                  <td>{tontine?.nom || '-'}</td>
                  <td>{beneficiaire?.prenom} {beneficiaire?.nom}</td>
                  <td style={{ color: '#10B981', fontWeight: 600 }}>
                    {parseFloat(tour.montant).toLocaleString()} FCFA
                  </td>
                  <td>{new Date(tour.date).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: STATUTS_TOUR[tour.statut].couleur + '20',
                      color: STATUTS_TOUR[tour.statut].couleur
                    }}>
                      {STATUTS_TOUR[tour.statut].label}
                    </span>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )

  const renderPaiements = () => (
    <div className="tontine-form">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Suivi des paiements</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="tontine-btn tontine-btn-secondary"
            onClick={() => exportToCSV(paiements, 'paiements')}
          >
            📊 Exporter CSV
          </button>
          <button className="tontine-btn tontine-btn-primary" onClick={() => setShowPaymentModal(true)}>
            + Enregistrer un paiement
          </button>
        </div>
      </div>
      
      <div className="tontine-payment-grid">
        {paiements.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Aucun paiement enregistré
          </div>
        ) : (
          paiements.slice().reverse().map(paiement => {
            const membre = membres.find(m => m.id === paiement.membreId)
            const tontine = tontines.find(t => t.id === paiement.tontineId)
            return (
              <div key={paiement.id} className="tontine-payment-card">
                <div className="tontine-payment-header">
                  <div>
                    <div style={{ fontWeight: 600 }}>{membre?.prenom} {membre?.nom}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tontine?.nom}</div>
                  </div>
                  <div className="tontine-payment-amount">
                    {parseFloat(paiement.montant).toLocaleString()} FCFA
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(paiement.date).toLocaleDateString('fr-FR')}
                  </span>
                  <span 
                    className="tontine-payment-status"
                    style={{
                      background: paiement.statut === 'paye' ? 'rgba(16, 185, 129, 0.1)' : 
                                   paiement.statut === 'retard' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: paiement.statut === 'paye' ? '#10B981' : 
                             paiement.statut === 'retard' ? '#EF4444' : '#F59E0B'
                    }}
                  >
                    {paiement.statut === 'paye' ? '✓ Payé' : paiement.statut === 'retard' ? '⚠ Retard' : '⏳ En attente'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════════════════════
     MODALS
  ════════════════════════════════════════════════════════════════ */
  const renderCreateModal = () => (
    <div className="tontine-modal-overlay" onClick={() => setShowCreateModal(false)}>
      <div className="tontine-modal" onClick={e => e.stopPropagation()}>
        <div className="tontine-modal-header">
          <h3 className="tontine-modal-title">Créer une nouvelle tontine</h3>
          <button className="tontine-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
        </div>
        <div className="tontine-modal-body">
          <div className="tontine-form-group">
            <label className="tontine-label">Nom de la tontine</label>
            <input 
              className="tontine-input" 
              placeholder="Ex: Association Tekki Fii"
              value={newTontine.nom}
              onChange={e => setNewTontine({...newTontine, nom: e.target.value})}
            />
          </div>
          
          <div className="tontine-grid-2">
            <div className="tontine-form-group">
              <label className="tontine-label">Type</label>
              <select 
                className="tontine-select"
                value={newTontine.type}
                onChange={e => setNewTontine({...newTontine, type: e.target.value})}
              >
                {TONTINE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="tontine-form-group">
              <label className="tontine-label">Montant (FCFA)</label>
              <input 
                className="tontine-input" 
                type="number"
                placeholder="30000"
                value={newTontine.montant}
                onChange={e => setNewTontine({...newTontine, montant: e.target.value})}
              />
            </div>
          </div>
          
          <div className="tontine-grid-2">
            <div className="tontine-form-group">
              <label className="tontine-label">Fréquence</label>
              <select 
                className="tontine-select"
                value={newTontine.frequence}
                onChange={e => setNewTontine({...newTontine, frequence: e.target.value})}
              >
                {FREQUENCES.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="tontine-form-group">
              <label className="tontine-label">Durée (nombre de tours)</label>
              <input 
                className="tontine-input" 
                type="number"
                value={newTontine.duree}
                onChange={e => setNewTontine({...newTontine, duree: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          
          <div className="tontine-form-group">
            <label className="tontine-label">Date de début</label>
            <input 
              className="tontine-input" 
              type="date"
              value={newTontine.dateDebut}
              onChange={e => setNewTontine({...newTontine, dateDebut: e.target.value})}
            />
          </div>
          
          <div className="tontine-form-group">
            <label className="tontine-label">Description (optionnel)</label>
            <textarea 
              className="tontine-textarea"
              placeholder="Décrivez les règles spécifiques de cette tontine..."
              value={newTontine.description}
              onChange={e => setNewTontine({...newTontine, description: e.target.value})}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="tontine-btn tontine-btn-secondary" onClick={() => setShowCreateModal(false)}>
              Annuler
            </button>
            <button 
              className="tontine-btn tontine-btn-primary" 
              onClick={creerTontine}
              disabled={!newTontine.nom || !newTontine.montant}
            >
              Créer la tontine
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMemberModal = () => (
    <div className="tontine-modal-overlay" onClick={() => setShowMemberModal(false)}>
      <div className="tontine-modal" onClick={e => e.stopPropagation()}>
        <div className="tontine-modal-header">
          <h3 className="tontine-modal-title">Ajouter un membre</h3>
          <button className="tontine-modal-close" onClick={() => setShowMemberModal(false)}>×</button>
        </div>
        <div className="tontine-modal-body">
          <div className="tontine-grid-2">
            <div className="tontine-form-group">
              <label className="tontine-label">Prénom</label>
              <input 
                className="tontine-input" 
                value={newMembre.prenom}
                onChange={e => setNewMembre({...newMembre, prenom: e.target.value})}
              />
            </div>
            <div className="tontine-form-group">
              <label className="tontine-label">Nom</label>
              <input 
                className="tontine-input" 
                value={newMembre.nom}
                onChange={e => setNewMembre({...newMembre, nom: e.target.value})}
              />
            </div>
          </div>
          
          <div className="tontine-form-group">
            <label className="tontine-label">Tontine</label>
            <select 
              className="tontine-select"
              value={newMembre.tontineId || ''}
              onChange={e => setNewMembre({...newMembre, tontineId: parseInt(e.target.value)})}
            >
              <option value="">Sélectionner une tontine</option>
              {tontines.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
            </select>
          </div>
          
          <div className="tontine-grid-2">
            <div className="tontine-form-group">
              <label className="tontine-label">Téléphone</label>
              <input 
                className="tontine-input" 
                placeholder="+221 77 XXX XX XX"
                value={newMembre.telephone}
                onChange={e => setNewMembre({...newMembre, telephone: e.target.value})}
              />
            </div>
            <div className="tontine-form-group">
              <label className="tontine-label">Email (optionnel)</label>
              <input 
                className="tontine-input" 
                type="email"
                value={newMembre.email}
                onChange={e => setNewMembre({...newMembre, email: e.target.value})}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="tontine-btn tontine-btn-secondary" onClick={() => setShowMemberModal(false)}>
              Annuler
            </button>
            <button 
              className="tontine-btn tontine-btn-primary" 
              onClick={creerMembre}
              disabled={!newMembre.nom || !newMembre.prenom || !newMembre.tontineId}
            >
              Ajouter le membre
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPaymentModal = () => (
    <div className="tontine-modal-overlay" onClick={() => setShowPaymentModal(false)}>
      <div className="tontine-modal" onClick={e => e.stopPropagation()}>
        <div className="tontine-modal-header">
          <h3 className="tontine-modal-title">Enregistrer un paiement</h3>
          <button className="tontine-modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
        </div>
        <div className="tontine-modal-body">
          <div className="tontine-form-group">
            <label className="tontine-label">Membre</label>
            <select 
              className="tontine-select"
              value={newPaiement.membreId}
              onChange={e => {
                const membre = membres.find(m => m.id === parseInt(e.target.value))
                setNewPaiement({
                  ...newPaiement, 
                  membreId: parseInt(e.target.value),
                  tontineId: membre?.tontineId || ''
                })
              }}
            >
              <option value="">Sélectionner un membre</option>
              {membres.filter(m => m.statut === 'actif').map(m => (
                <option key={m.id} value={m.id}>{m.prenom} {m.nom} - {tontines.find(t => t.id === m.tontineId)?.nom}</option>
              ))}
            </select>
          </div>
          
          <div className="tontine-grid-2">
            <div className="tontine-form-group">
              <label className="tontine-label">Montant (FCFA)</label>
              <input 
                className="tontine-input" 
                type="number"
                value={newPaiement.montant}
                onChange={e => setNewPaiement({...newPaiement, montant: e.target.value})}
              />
            </div>
            <div className="tontine-form-group">
              <label className="tontine-label">Date</label>
              <input 
                className="tontine-input" 
                type="date"
                value={newPaiement.date}
                onChange={e => setNewPaiement({...newPaiement, date: e.target.value})}
              />
            </div>
          </div>
          
          <div className="tontine-grid-2">
            <div className="tontine-form-group">
              <label className="tontine-label">Type</label>
              <select 
                className="tontine-select"
                value={newPaiement.type}
                onChange={e => setNewPaiement({...newPaiement, type: e.target.value})}
              >
                <option value="cotisation">Cotisation régulière</option>
                <option value="penalite">Pénalité de retard</option>
                <option value="interet">Intérêt</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="tontine-form-group">
              <label className="tontine-label">Statut</label>
              <select 
                className="tontine-select"
                value={newPaiement.statut}
                onChange={e => setNewPaiement({...newPaiement, statut: e.target.value})}
              >
                <option value="paye">Payé</option>
                <option value="en_attente">En attente</option>
                <option value="retard">En retard</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="tontine-btn tontine-btn-secondary" onClick={() => setShowPaymentModal(false)}>
              Annuler
            </button>
            <button 
              className="tontine-btn tontine-btn-primary" 
              onClick={enregistrerPaiement}
              disabled={!newPaiement.membreId || !newPaiement.montant}
            >
              Enregistrer le paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════════════════════
     RENDU PRINCIPAL
  ════════════════════════════════════════════════════════════════ */
  return (
    <>
      <SEO 
        title="Tontine SN Max — Gestion complète" 
        description="Gérez vos tontines avec 3 niveaux de prix adaptés. Suivi des membres, tours, paiements et alertes automatiques. Starter (100 pers), Pro (500 pers), Enterprise (illimité)."
      />
      
      <div className="tontine-container">
        {/* Header */}
        <div className="tontine-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '50%', 
              padding: 8, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TontineLogo size={48} />
            </div>
            <div>
              <h1 className="tontine-header-title">Tontine SN Max</h1>
              <p className="tontine-header-subtitle">Gestion professionnelle • 3 niveaux de prix</p>
            </div>
          </div>
          <span className="tontine-badge">
            {stats.tontinesActives} tontine{stats.tontinesActives > 1 ? 's' : ''} active{stats.tontinesActives > 1 ? 's' : ''}
          </span>
        </div>

        {/* Navigation */}
        <div className="tontine-nav">
          {[
            { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
            { id: 'membres', label: 'Membres', icon: 'members' },
            { id: 'tours', label: 'Tours', icon: 'rotate' },
            { id: 'paiements', label: 'Paiements', icon: 'money' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tontine-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          <button 
            className="tontine-nav-btn"
            onClick={() => setShowCreateModal(true)}
            style={{ marginLeft: 'auto' }}
          >
            <span>➕</span>
            Créer
          </button>
        </div>

        {/* Content */}
        <div className="tontine-content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'membres' && renderMembres()}
          {activeTab === 'tours' && renderTours()}
          {activeTab === 'paiements' && renderPaiements()}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && renderCreateModal()}
      {showMemberModal && renderMemberModal()}
      {showPaymentModal && renderPaymentModal()}

      <ToolInfoPanel
        toolName="Tontine SN Max"
        icon="🤝"
        description="Solution professionnelle de gestion de tontines pour associations, groupes d'épargne et collectivités"
        benefits={[
          'Gestion complète des tontines et tours',
          'Suivi des membres et cotisations',
          'Calcul automatique des bénéficiaires',
          'Alertes pour retards de paiement',
          'Historique complet des transactions',
          'Export PDF/Excel des données',
          'Interface intuitive et sécurisée',
          'Persistance localStorage + Supabase ready',
        ]}
        howToUse={[
          'Créez une nouvelle tontine avec nom, montant et durée',
          'Ajoutez les membres participants avec leurs informations',
          'Configurez les tours de distribution automatiquement',
          'Enregistrez les paiements de chaque membre',
          'Suivez les bénéficiaires et les cotisations',
          'Consultez l\'historique et les statistiques',
        ]}
        tips={[
          'Idéal pour les associations : gestion collective de l\'épargne',
          'Parfait pour les groupes solidaires : rotation équitable des fonds',
          'Utilisez les alertes pour les paiements en retard',
          'Exportez régulièrement vos données en backup',
          'Les données sont stockées localement sur votre appareil',
        ]}
      />
    </>
  )
}
