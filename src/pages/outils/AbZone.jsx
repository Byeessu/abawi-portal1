import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/SEO'
import ToolHero from '../../components/ToolHero'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import TokenCounter from '../../components/TokenCounter'
import { callGroq } from '../../lib/groqClient'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// ─── SQL à exécuter dans Supabase SQL Editor (une seule fois) ─────────────────
export const ABZONE_SQL = `
create table if not exists public.abzone_topics (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  cat         text not null default 'strategie',
  membre_id   text not null,
  author_name text not null,
  title       text not null,
  views       int not null default 0,
  likes_count int not null default 0,
  pinned      bool not null default false
);
create table if not exists public.abzone_comments (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  topic_id    uuid references public.abzone_topics(id) on delete cascade,
  membre_id   text not null,
  author_name text not null,
  text        text not null
);
create table if not exists public.abzone_resources (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  cat         text,
  membre_id   text not null,
  author_name text not null,
  title       text not null,
  type        text,
  size        text,
  content     text,
  likes_count int not null default 0
);
create table if not exists public.abzone_likes (
  id          uuid primary key default gen_random_uuid(),
  membre_id   text not null,
  topic_id    uuid references public.abzone_topics(id) on delete cascade,
  resource_id uuid references public.abzone_resources(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint unique_topic_like    unique(membre_id, topic_id),
  constraint unique_resource_like unique(membre_id, resource_id)
);
alter table public.abzone_topics    enable row level security;
alter table public.abzone_comments  enable row level security;
alter table public.abzone_resources enable row level security;
alter table public.abzone_likes     enable row level security;
create policy "public_read_topics"    on public.abzone_topics    for select using (true);
create policy "public_read_comments"  on public.abzone_comments  for select using (true);
create policy "public_read_resources" on public.abzone_resources for select using (true);
create policy "public_read_likes"     on public.abzone_likes     for select using (true);
create policy "anyone_insert_topics"    on public.abzone_topics    for insert with check (true);
create policy "anyone_insert_comments"  on public.abzone_comments  for insert with check (true);
create policy "anyone_insert_resources" on public.abzone_resources for insert with check (true);
create policy "anyone_insert_likes"     on public.abzone_likes     for insert with check (true);
create policy "anyone_update_topics"    on public.abzone_topics    for update using (true);
create policy "anyone_update_resources" on public.abzone_resources for update using (true);
create policy "anyone_delete_topics"    on public.abzone_topics    for delete using (true);
create policy "anyone_delete_comments"  on public.abzone_comments  for delete using (true);
create policy "anyone_delete_resources" on public.abzone_resources for delete using (true);
create policy "anyone_delete_likes"     on public.abzone_likes     for delete using (true);
`

// ─── Données de démo (fallback quand la base est vide) ────────────────────────
const DEMO_TOPICS = [
  {
    id: 'demo-1', created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    cat: 'strategie', membre_id: 'demo', author_name: 'Awa D.', title: 'Comment structurer son business plan en 2026 ?',
    views: 124, likes_count: 18, pinned: true,
    replies: 3, comments: [
      { id: 'c1', created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(), topic_id: 'demo-1', membre_id: 'demo2', author_name: 'Khadim S.', text: 'Le modèle Canvas reste le plus efficace pour démarrer. J\'ai levé 15M FCFA avec ça.' },
      { id: 'c2', created_at: new Date(Date.now() - 86400000).toISOString(), topic_id: 'demo-1', membre_id: 'demo3', author_name: 'Fatou N.', text: 'N\'oubliez pas le marché cible. Les investisseurs dakarois aiment les chiffres réels.' },
      { id: 'c3', created_at: new Date(Date.now() - 43200000).toISOString(), topic_id: 'demo-1', membre_id: 'demo4', author_name: 'Moussa T.', text: 'Je viens de créer un template, je le partage dans Ressources.' },
    ]
  },
  {
    id: 'demo-2', created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    cat: 'technologie', membre_id: 'demo5', author_name: 'Ibrahima K.', title: 'L\'IA générative pour les PME africaines — retour d\'expérience',
    views: 89, likes_count: 12, pinned: false,
    replies: 2, comments: [
      { id: 'c4', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), topic_id: 'demo-2', membre_id: 'demo6', author_name: 'Marie L.', text: 'Nous utilisons Groq depuis 3 mois, gain de temps énorme sur la rédaction commerciale.' },
      { id: 'c5', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), topic_id: 'demo-2', membre_id: 'demo7', author_name: 'Ousmane B.', text: 'Attention au coût des tokens en production. Prévoyez un buffer de 30%.' },
    ]
  },
  {
    id: 'demo-3', created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    cat: 'finance', membre_id: 'demo8', author_name: 'Aminata F.', title: 'Levée de fonds : les erreurs à éviter avec les business angels au Sénégal',
    views: 203, likes_count: 34, pinned: true,
    replies: 4, comments: [
      { id: 'c6', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), topic_id: 'demo-3', membre_id: 'demo9', author_name: 'Cheikh D.', text: 'Ne jamais signer un term sheet sans avocat spécialisé en startups.' },
      { id: 'c7', created_at: new Date(Date.now() - 86400000 * 5 + 3600000).toISOString(), topic_id: 'demo-3', membre_id: 'demo10', author_name: 'Sophie M.', text: 'Le due diligence peut durer 3 mois. Préparez vos documents en avance.' },
      { id: 'c8', created_at: new Date(Date.now() - 86400000 * 4).toISOString(), topic_id: 'demo-3', membre_id: 'demo11', author_name: 'Alioune N.', text: 'Partagez votre traction. Même 100 utilisateurs actifs, c\'est mieux que zéro.' },
      { id: 'c9', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), topic_id: 'demo-3', membre_id: 'demo12', author_name: 'Rokhaya S.', text: 'Le storytelling compte autant que les chiffres. Racontez votre pourquoi.' },
    ]
  },
  {
    id: 'demo-4', created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    cat: 'marketing', membre_id: 'demo13', author_name: 'Pape D.', title: 'TikTok vs Instagram : quelle stratégie pour le marché ouest-africain ?',
    views: 156, likes_count: 21, pinned: false,
    replies: 2, comments: [
      { id: 'c10', created_at: new Date(Date.now() - 86400000 * 7).toISOString(), topic_id: 'demo-4', membre_id: 'demo14', author_name: 'Ndeye B.', text: 'TikTok explose au Sénégal. Les micro-influenceurs ont un ROI 3x supérieur.' },
      { id: 'c11', created_at: new Date(Date.now() - 86400000 * 6).toISOString(), topic_id: 'demo-4', membre_id: 'demo15', author_name: 'Youssef T.', text: 'Instagram reste king pour le B2B et le luxe. Ça dépend du secteur.' },
    ]
  },
  {
    id: 'demo-5', created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    cat: 'annonces', membre_id: 'demo16', author_name: 'Modou L.', title: 'Recherche co-fondateur tech — startup fintech à Dakar',
    views: 78, likes_count: 5, pinned: false,
    replies: 1, comments: [
      { id: 'c12', created_at: new Date(Date.now() - 86400000 * 9).toISOString(), topic_id: 'demo-5', membre_id: 'demo17', author_name: 'Saliou K.', text: 'Je suis fullstack React/Node.js, intéressé. Envoyez-moi un MP.' },
    ]
  },
]

const DEMO_RESOURCES = [
  {
    id: 'dr1', created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    cat: 'strategie', membre_id: 'demo', author_name: 'Awa D.',
    title: 'Template Business Plan ABAWI 2026', type: 'Template', size: 'TXT · 12 Ko',
    downloadUrl: '/resources/business-plan-template.txt',
    content: 'Structure complète et prête à l\'emploi pour les entrepreneurs de la zone UEMOA. Ce template a été validé par 3 business angels actifs à Dakar et à Abidjan.',
    likes_count: 24,
    views: 412,
    sections: [
      { title: '📋 Executive Summary', body: 'Modèle de pitch en 1 page avec les 5 éléments clés : problème, solution, marché, traction, équipe. Format slide + version texte.' },
      { title: '📊 Analyse de marché WAEMU', body: 'Données 2025-2026 sur le marché sénégalais, ivoirien et béninois. Sources : ANSD, BCEAO, Banque Mondiale. Modèles TAM/SAM/SOM pré-remplis.' },
      { title: '💰 Modèle financier 3 ans', body: 'Tableaux Excel avec projections de revenus, coûts, burn rate et break-even. Formules dynamiques et scénarios optimiste/pessimiste.' },
      { title: '👥 Équipe & Roadmap', body: 'Template organigramme, fiches de poste types, et roadmap trimestrielle avec jalons clairs pour les investisseurs.' },
    ]
  },
  {
    id: 'dr2', created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    cat: 'technologie', membre_id: 'demo5', author_name: 'Ibrahima K.',
    title: 'Guide No-Code pour entrepreneurs africains', type: 'Guide', size: 'TXT · 8 Ko',
    downloadUrl: '/resources/guide-no-code.txt',
    content: 'Comparatif approfondi des outils no-code adaptés au contexte africain : connexion internet intermittente, paiement mobile (Wave, Orange Money), et francisation.',
    likes_count: 17,
    views: 289,
    sections: [
      { title: '⚡ Outils recommandés', body: 'Bubble (apps web complexes), FlutterFlow (apps mobiles natives), Webflow (sites vitrines premium). Tableau comparatif des prix, limites et forces.' },
      { title: '💳 Intégration paiements', body: 'Comment connecter PayDunya, Wave et Orange Money à vos apps no-code. Webhooks, API REST et tutoriels étape par étape.' },
      { title: '🌍 Francisation & UX locale', body: 'Bonnes pratiques pour adapter l\'UX aux habitudes des utilisateurs ouest-africains : fontes avec accents, formats de date, numéros de téléphone.' },
      { title: '📱 Performance offline', body: 'Techniques pour que votre app fonctionne même avec 2G/3G : caching, PWA, lazy loading, et optimisation des images.' },
    ]
  },
  {
    id: 'dr3', created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    cat: 'marketing', membre_id: 'demo13', author_name: 'Pape D.',
    title: 'Calendrier éditorial Ramadan 2026 — Sénégal', type: 'Template', size: 'CSV · 4 Ko',
    downloadUrl: '/resources/calendrier-ramadan-2026.csv',
    content: 'Stratégie de contenu complète pour le Ramadan 2026 au Sénégal. Basée sur les données d\'engagement de 2024 et 2025 sur Instagram, TikTok et WhatsApp Business.',
    likes_count: 31,
    views: 567,
    sections: [
      { title: '🕐 Horaires de publication', body: 'Calendrier précis avec les 3 pics d\'engagement journaliers : avant Fadjr, après Dhuhr, et après Tarawih. Adapté aux horaires de Dakar 2026.' },
      { title: '🎯 Hooks culturels par semaine', body: 'Semaine 1 : spiritualité & partage. Semaine 2 : recettes & family. Semaine 3 : shopping & cadeaux. Semaine 4 : Eid & célébration.' },
      { title: '📈 Templates de posts', body: '30 templates Canva prêts à personnaliser : stories, carrousels, reels, et posts carrés. Tendances couleurs 2026 incluses.' },
      { title: '📊 KPIs & suivi', body: 'Tableau de bord avec les métriques clés à suivre : reach, engagement rate, conversions, et ROI par type de contenu.' },
    ]
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'forum',     label: 'Forum',          icon: '💬' },
  { id: 'ressources',label: 'Ressources',     icon: '📚' },
  { id: 'defis',     label: 'Défis Business', icon: '🏆' },
  { id: 'membres',   label: 'Membres',        icon: '👥' },
]

const CATEGORIES = [
  { id: 'strategie', label: 'Stratégie',      color: '#8B5CF6' },
  { id: 'marketing', label: 'Marketing',      color: '#F97316' },
  { id: 'finance',   label: 'Finance',        color: '#10B981' },
  { id: 'tech',      label: 'Tech & IA',      color: '#3B82F6' },
  { id: 'juridique', label: 'Juridique',      color: '#EF4444' },
  { id: 'rh',        label: 'RH & Management',color: '#F59E0B' },
  { id: 'entraide',  label: 'Entraide',       color: '#14B8A6' },
  { id: 'annonces',  label: 'Annonces',       color: '#6366F1' },
]

const DEFIS = [
  { id: 1, titre: 'Pitch Elevator Pro', desc: 'Enregistrez un pitch vidéo de 60 secondes pour votre projet. Structure : accroche (10s), problème (15s), solution (20s), CTA (15s).', livrables: ['Vidéo 60s (MP4 ou lien)', 'Fiche projet 1 page'], critere: 'Clarté du message, énergie, proposition de valeur', pts: 500, participants: 47, deadline: '5 jours restants', recompense: 'Badge Pitch Master + 500 pts + Mise en avant AbZone' },
  { id: 2, titre: 'Plan d\'action SMART 30 jours', desc: 'Construisez un plan mensuel avec objectifs SMART et au moins 5 KPIs trackables.', livrables: ['Plan PDF ou Notion', 'Tableau de bord KPI'], critere: 'Spécificité, mesurabilité, réalisme du calendrier', pts: 350, participants: 63, deadline: '12 jours restants', recompense: 'Badge Stratège + 350 pts + Session coaching 1h' },
  { id: 3, titre: 'Analyse de marché terrain', desc: 'Réalisez une étude complète d\'un marché cible au Sénégal : taille, concurrents, comportement client, SWOT.', livrables: ['Rapport 5-10 pages', 'Matrice SWOT', 'Fiches concurrents'], critere: 'Profondeur, sources citées, recommandations actionnables', pts: 600, participants: 29, deadline: '18 jours restants', recompense: 'Badge Analyste + 600 pts + Publication newsletter ABAWI' },
  { id: 4, titre: 'Landing Page Express', desc: 'Créez et publiez une landing page en 24h. Outils : Carrd, Framer, Notion ou code. Critères : responsive, CTA clair, chargement <3s.', livrables: ['URL de la landing page', 'Screenshot mobile + desktop', 'Brief copywriting'], critere: 'Design, clarté, CTA, performance mobile', pts: 450, participants: 54, deadline: '2 jours restants', recompense: 'Badge Builder + 450 pts + Audit UX offert' },
  { id: 5, titre: 'Campagne WhatsApp Business', desc: 'Concevez une campagne de prospection via WhatsApp Business avec séquence de 3 messages et stratégie de segmentation.', livrables: ['Script des 3 messages', 'Stratégie segmentation', 'Résultats prévisionnels'], critere: 'Personnalisation, conformité RGPD, taux d\'engagement prévisionnel', pts: 400, participants: 38, deadline: '9 jours restants', recompense: 'Badge Growth + 400 pts + Feedback expert' },
]

const ANNAH_WELCOME = `Bonjour et bienvenue sur **AbZone**, l'espace communautaire d'ABAWI ! 🚀

Je suis **Annah**, votre Community Manager IA. Je suis ici pour vous aider à :
• Trouver les bonnes ressources pour votre projet
• Vous orienter vers les bons experts de la communauté
• Répondre à vos questions business et entrepreneuriales

Comment puis-je vous aider aujourd'hui ?`

// ─── Helpers ──────────────────────────────────────────────────────────────────
function authorName(membre) {
  if (!membre) return 'Anonyme'
  return `${membre.prenom || ''} ${(membre.nom || '').charAt(0)}.`.trim()
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function catColor(catId) {
  return CATEGORIES.find(c => c.id === catId)?.color || '#8B5CF6'
}

function fmt(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function AvatarBubble({ name, size = 36, color }) {
  const bg = color || '#4c1d95'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${bg}, color-mix(in srgb, ${bg} 70%, #000))`,
      color: '#fff', fontWeight: 900, fontSize: size * 0.36,
      fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px',
      boxShadow: `0 2px 8px ${bg}55`,
    }}>
      {initials(name)}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AbZone() {
  const { membre, isAdmin } = useAuth()

  // Data
  const [topics,          setTopics]         = useState([])
  const [resources,       setResources]      = useState([])
  const [likedTopics,     setLikedTopics]    = useState([]) // topic IDs
  const [likedResources,  setLikedResources] = useState([]) // resource IDs
  const [leaderboard,     setLeaderboard]    = useState([])
  const [dbError,         setDbError]        = useState(null) // tables missing

  // UI
  const [tab,             setTab]            = useState('forum')
  const [forumCat,        setForumCat]       = useState('all')
  const [loading,         setLoading]        = useState(true)
  const [notif,           setNotif]          = useState('')
  const [notifType,       setNotifType]      = useState('ok') // ok | error
  const [selectedTopic,   setSelectedTopic]  = useState(null)
  const [selectedResource,setSelectedResource] = useState(null)
  const [activeDefi,      setActiveDefi]     = useState(null)

  // New topic form
  const [showNewTopic, setShowNewTopic] = useState(false)
  const [newTitle,     setNewTitle]     = useState('')
  const [newCat,       setNewCat]       = useState('strategie')
  const [posting,      setPosting]      = useState(false)

  // New resource form
  const [showNewRes,   setShowNewRes]   = useState(false)
  const [resTitle,     setResTitle]     = useState('')
  const [resCat,       setResCat]       = useState('strategie')
  const [resType,      setResType]      = useState('Guide')
  const [resContent,   setResContent]   = useState('')
  const [postingRes,   setPostingRes]   = useState(false)

  // Comment inputs per topic
  const [commentInputs, setCommentInputs] = useState({})

  // Annah
  const [annahOpen,     setAnnahOpen]    = useState(false)
  const [annahMessages, setAnnahMessages]= useState([{ id: '0', role: 'annah', text: ANNAH_WELCOME, time: new Date().toISOString() }])
  const [annahInput,    setAnnahInput]   = useState('')
  const [annahLoading,  setAnnahLoading] = useState(false)

  const annahRef = useRef(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    setDbError(null)

    const [topicsRes, resourcesRes] = await Promise.all([
      supabase.from('abzone_topics')
        .select('*, abzone_comments(*)')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('abzone_resources')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    if (topicsRes.error) {
      setDbError(topicsRes.error.message)
      setLoading(false)
      return
    }

    // Fallback données de démo si la base est vide
    const rawTopics = (topicsRes.data || []).length > 0 ? topicsRes.data : DEMO_TOPICS
    const rawResources = (resourcesRes.data || []).length > 0 ? resourcesRes.data : DEMO_RESOURCES

    const enriched = rawTopics.map(t => ({
      ...t,
      replies: t.abzone_comments?.length || t.comments?.length || 0,
      comments: (t.abzone_comments || t.comments || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    }))
    setTopics(enriched)
    setResources(rawResources)
    computeLeaderboard(enriched, rawResources)

    if (membre) {
      const { data: likes } = await supabase
        .from('abzone_likes')
        .select('topic_id, resource_id')
        .eq('membre_id', membre.id)
      if (likes) {
        setLikedTopics(likes.filter(l => l.topic_id).map(l => l.topic_id))
        setLikedResources(likes.filter(l => l.resource_id).map(l => l.resource_id))
      }
    }
    setLoading(false)
  }, [membre])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Real-time subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel('abzone-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'abzone_topics' }, ({ new: row }) => {
        setTopics(prev => [{ ...row, replies: 0, comments: [] }, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'abzone_topics' }, ({ new: row }) => {
        setTopics(prev => prev.map(t => t.id === row.id ? { ...t, ...row } : t))
        setSelectedTopic(prev => prev?.id === row.id ? { ...prev, ...row } : prev)
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'abzone_topics' }, ({ old: row }) => {
        setTopics(prev => prev.filter(t => t.id !== row.id))
        setSelectedTopic(prev => prev?.id === row.id ? null : prev)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'abzone_comments' }, ({ new: row }) => {
        setTopics(prev => prev.map(t =>
          t.id === row.topic_id
            ? { ...t, replies: t.replies + 1, comments: [...(t.comments || []), row] }
            : t
        ))
        setSelectedTopic(prev =>
          prev?.id === row.topic_id
            ? { ...prev, replies: prev.replies + 1, comments: [...(prev.comments || []), row] }
            : prev
        )
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'abzone_comments' }, ({ old: row }) => {
        setTopics(prev => prev.map(t =>
          t.id === row.topic_id
            ? { ...t, replies: Math.max(0, t.replies - 1), comments: (t.comments || []).filter(c => c.id !== row.id) }
            : t
        ))
        setSelectedTopic(prev =>
          prev?.id === row.topic_id
            ? { ...prev, replies: Math.max(0, prev.replies - 1), comments: (prev.comments || []).filter(c => c.id !== row.id) }
            : prev
        )
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'abzone_resources' }, ({ new: row }) => {
        setResources(prev => [row, ...prev])
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'abzone_resources' }, ({ old: row }) => {
        setResources(prev => prev.filter(r => r.id !== row.id))
        if (selectedResource?.id === row.id) setSelectedResource(null)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedResource])

  // ── Notif auto-dismiss ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!notif) return
    const t = setTimeout(() => setNotif(''), 3500)
    return () => clearTimeout(t)
  }, [notif])

  function toast(msg, type = 'ok') { setNotif(msg); setNotifType(type) }

  // ── Leaderboard ────────────────────────────────────────────────────────────
  function computeLeaderboard(topicList, resourceList) {
    const scores = {}
    topicList.forEach(t => {
      const key = t.membre_id
      if (!scores[key]) scores[key] = { name: t.author_name, pts: 0, topics: 0, comments: 0, resources: 0 }
      scores[key].pts += 10 + (t.likes_count || 0) * 2
      scores[key].topics++
      ;(t.comments || []).forEach(c => {
        const ck = c.membre_id
        if (!scores[ck]) scores[ck] = { name: c.author_name, pts: 0, topics: 0, comments: 0, resources: 0 }
        scores[ck].pts += 5
        scores[ck].comments++
      })
    })
    resourceList.forEach(r => {
      const key = r.membre_id
      if (!scores[key]) scores[key] = { name: r.author_name, pts: 0, topics: 0, comments: 0, resources: 0 }
      scores[key].pts += 20 + (r.likes_count || 0) * 2
      scores[key].resources++
    })
    setLeaderboard(Object.values(scores).sort((a, b) => b.pts - a.pts).slice(0, 10))
  }

  // ── Forum actions ──────────────────────────────────────────────────────────
  async function addTopic() {
    if (!membre) { toast('Connectez-vous pour publier', 'error'); return }
    if (!newTitle.trim()) return
    setPosting(true)
    const { error } = await supabase.from('abzone_topics').insert({
      cat: newCat,
      membre_id: membre.id,
      author_name: authorName(membre),
      title: newTitle.trim(),
    })
    setPosting(false)
    if (error) { toast('❌ ' + error.message, 'error'); return }
    setNewTitle(''); setShowNewTopic(false)
    toast('✅ Sujet publié')
  }

  async function deleteTopic(topicId) {
    if (!isAdmin) return
    await supabase.from('abzone_topics').delete().eq('id', topicId)
    toast('🗑️ Sujet supprimé')
  }

  async function pinTopic(topic) {
    if (!isAdmin) return
    await supabase.from('abzone_topics').update({ pinned: !topic.pinned }).eq('id', topic.id)
    toast(topic.pinned ? '📌 Désépinglé' : '📌 Épinglé')
  }

  async function incrementView(topicId, currentViews) {
    await supabase.from('abzone_topics').update({ views: currentViews + 1 }).eq('id', topicId)
  }

  async function toggleTopicLike(topic) {
    if (!membre) { toast('Connectez-vous pour liker', 'error'); return }
    const liked = likedTopics.includes(topic.id)
    if (liked) {
      await supabase.from('abzone_likes').delete().match({ membre_id: membre.id, topic_id: topic.id })
      await supabase.from('abzone_topics').update({ likes_count: Math.max(0, topic.likes_count - 1) }).eq('id', topic.id)
      setLikedTopics(prev => prev.filter(id => id !== topic.id))
    } else {
      const { error } = await supabase.from('abzone_likes').insert({ membre_id: membre.id, topic_id: topic.id })
      if (!error) {
        await supabase.from('abzone_topics').update({ likes_count: topic.likes_count + 1 }).eq('id', topic.id)
        setLikedTopics(prev => [...prev, topic.id])
      }
    }
  }

  async function addComment(topicId, text) {
    if (!membre) { toast('Connectez-vous pour commenter', 'error'); return }
    if (!text.trim()) return
    await supabase.from('abzone_comments').insert({
      topic_id: topicId,
      membre_id: membre.id,
      author_name: authorName(membre),
      text: text.trim(),
    })
    setCommentInputs(prev => ({ ...prev, [topicId]: '' }))
  }

  async function deleteComment(comment) {
    if (!isAdmin && comment.membre_id !== membre?.id) return
    await supabase.from('abzone_comments').delete().eq('id', comment.id)
  }

  // ── Resources actions ──────────────────────────────────────────────────────
  async function addResource() {
    if (!membre) { toast('Connectez-vous pour partager', 'error'); return }
    if (!resTitle.trim()) return
    setPostingRes(true)
    const { error } = await supabase.from('abzone_resources').insert({
      cat: resCat,
      membre_id: membre.id,
      author_name: authorName(membre),
      title: resTitle.trim(),
      type: resType,
      size: resContent.length > 500 ? `${Math.round(resContent.length / 100) / 10}KB` : 'Résumé',
      content: resContent.trim(),
    })
    setPostingRes(false)
    if (error) { toast('❌ ' + error.message, 'error'); return }
    setResTitle(''); setResContent(''); setShowNewRes(false)
    toast('✅ Ressource partagée')
  }

  async function deleteResource(resourceId) {
    if (!isAdmin) return
    await supabase.from('abzone_resources').delete().eq('id', resourceId)
    toast('🗑️ Ressource supprimée')
  }

  async function toggleResourceLike(resource) {
    if (!membre) { toast('Connectez-vous pour liker', 'error'); return }
    const liked = likedResources.includes(resource.id)
    if (liked) {
      await supabase.from('abzone_likes').delete().match({ membre_id: membre.id, resource_id: resource.id })
      await supabase.from('abzone_resources').update({ likes_count: Math.max(0, resource.likes_count - 1) }).eq('id', resource.id)
      setLikedResources(prev => prev.filter(id => id !== resource.id))
    } else {
      const { error } = await supabase.from('abzone_likes').insert({ membre_id: membre.id, resource_id: resource.id })
      if (!error) {
        await supabase.from('abzone_resources').update({ likes_count: resource.likes_count + 1 }).eq('id', resource.id)
        setLikedResources(prev => [...prev, resource.id])
      }
    }
  }

  // ── Annah AI ───────────────────────────────────────────────────────────────
  async function sendToAnnah() {
    const text = annahInput.trim()
    if (!text || annahLoading) return
    const userMsg = { id: String(Date.now()), role: 'user', text, time: new Date().toISOString() }
    setAnnahMessages(prev => [...prev, userMsg])
    setAnnahInput('')
    setAnnahLoading(true)
    try {
      const history = annahMessages.slice(-6).map(m => `${m.role === 'annah' ? 'Annah' : 'Membre'}: ${m.text}`).join('\n')
      const prompt = `Tu es Annah, community manager IA professionnelle de la communauté AbZone (ABAWI). Tu conseilles et motives les entrepreneurs africains.

Contexte:\n${history}\n\nMembre: ${text}

Réponds en français, chaleureuse, concise (max 150 mots), avec émojis. Conseils actionnables. Si question juridique/financière, précise que c'est une information générale.`
      const result = await callGroq(prompt, { maxTokens: 400, temperature: 0.8 })
      setAnnahMessages(prev => [...prev, { id: String(Date.now()), role: 'annah', text: result || 'Je suis là pour vous aider ! Reformulez votre question 🙏', time: new Date().toISOString() }])
    } catch {
      setAnnahMessages(prev => [...prev, { id: String(Date.now()), role: 'annah', text: 'Petite interruption de connexion. Pouvez-vous reformuler ? 🙏', time: new Date().toISOString() }])
    }
    setAnnahLoading(false)
  }

  useEffect(() => {
    if (annahRef.current) annahRef.current.scrollTop = annahRef.current.scrollHeight
  }, [annahMessages, annahOpen])

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredTopics = forumCat === 'all' ? topics : topics.filter(t => t.cat === forumCat)

  const communityMembers = leaderboard.map((m, i) => ({
    name: m.name,
    pts: m.pts,
    topics: m.topics,
    comments: m.comments,
    resources: m.resources,
    rank: i + 1,
    badge: i === 0 ? 'Expert' : i === 1 ? 'Mentor' : i < 4 ? 'Contributeur' : 'Membre',
    badgeColor: i === 0 ? '#F59E0B' : i === 1 ? '#10B981' : i < 4 ? '#3B82F6' : '#64748B',
  }))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <SEO
        title="AbZone — Forum, ressources & défis business ABAWI"
        description="Espace communautaire ABAWI : forum premium pour entrepreneurs, partage de ressources, défis avec récompenses, entraide et networking. Animé par Annah, la CM IA."
      />
      <style>{CSS}</style>

      {notif && (
        <div className="az-toast" style={notifType === 'error' ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444' } : {}}>
          {notif}
        </div>
      )}

      <ToolHero
        icon="🌐"
        badge="Communauté · ABAWI"
        title="Ab"
        titleAccent="Zone"
        subtitle="Votre espace communautaire d'entrepreneurs africains — forum, ressources, défis et networking animés par l'IA."
        gradient="linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #4c1d95 100%)"
        glowColor="rgba(76,29,149,0.45)"
        accentColor="#C4B5FD"
        stats={[['💬', 'Forum partagé'], ['🔴', 'Temps réel'], ['🏆', 'Défis & Points'], ['🤖', 'IA Annah']]}
      />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(16px,3vw,32px) 100px' }}>
        <ToolInfoPanel
          toolName="AbZone"
          icon="🌐"
          description="Plateforme communautaire ABAWI en temps réel — vos posts sont visibles par tous les membres, vos likes sont comptés, vos contributions construisent votre classement."
          benefits={[
            'Forum partagé entre tous les membres ABAWI — chaque post est visible en temps réel',
            'Système de points : 10 pts/sujet, 5 pts/commentaire, 20 pts/ressource, 2 pts/like reçu',
            'Ressources business partagées : guides, templates, outils — par les membres, pour les membres',
            'Défis mensuels avec récompenses et badges pour les meilleurs contributeurs',
            'Annah IA — Community Manager IA disponible 24h/24 pour vous orienter',
          ]}
          howToUse={[
            'Connectez-vous à votre compte ABAWI pour pouvoir poster et interagir',
            'Créez un sujet de forum dans la catégorie appropriée',
            'Likez et commentez les sujets qui vous intéressent — chaque interaction compte',
            'Partagez vos ressources (guides, templates) pour gagner des points',
            'Participez aux défis mensuels pour décrocher des badges et récompenses',
          ]}
          tips={[
            'Votre identité réelle (nom ABAWI) s\'affiche sur tous vos posts — la qualité prime',
            'Posez des questions précises pour obtenir de meilleures réponses de la communauté',
            'En cas de question urgente, utilisez Annah IA en bas à droite — réponse instantanée',
          ]}
        />

        {/* Token counter */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <TokenCounter />
        </div>

        {/* Non connecté — bannière discrète */}
        {!membre && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.1rem' }}>🔐</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flex: 1 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Mode lecture</strong> — Connectez-vous pour poster, commenter et participer aux défis.
            </span>
            <Link to="/login" style={{ padding: '6px 16px', borderRadius: 8, background: 'linear-gradient(135deg,#4c1d95,#2e1065)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
              Se connecter →
            </Link>
          </div>
        )}

        {/* DB Error — tables manquantes */}
        {dbError && (
          <div style={{ borderRadius: 14, padding: '16px 18px', marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div style={{ fontWeight: 800, color: '#EF4444', fontSize: '0.85rem', marginBottom: 8 }}>❌ Tables Supabase manquantes — exécutez ce SQL dans Supabase → SQL Editor</div>
            <pre style={{ fontSize: '0.68rem', color: '#a3e635', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 8, overflow: 'auto', maxHeight: 200, whiteSpace: 'pre', lineHeight: 1.5 }}>{ABZONE_SQL}</pre>
            <button onClick={loadAll} style={{ marginTop: 10, padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>↻ Réessayer</button>
          </div>
        )}

        {/* Tabs */}
        <div className="az-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`az-tab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ══ FORUM ══════════════════════════════════════════════════════════ */}
        {tab === 'forum' && (
          <div className="az-tab-panel">
            <div className="az-forum-header">
              <div className="az-cat-pills">
                <button className={`az-cat-pill${forumCat === 'all' ? ' on' : ''}`} onClick={() => setForumCat('all')}>Tous</button>
                {CATEGORIES.map(c => (
                  <button key={c.id} className={`az-cat-pill${forumCat === c.id ? ' on' : ''}`} onClick={() => setForumCat(c.id)} style={forumCat === c.id ? { borderColor: c.color, background: c.color + '18', color: c.color } : {}}>{c.label}</button>
                ))}
              </div>
              <button className="az-btn-primary" onClick={() => membre ? setShowNewTopic(true) : toast('Connectez-vous pour poster', 'error')}>✏️ Nouveau sujet</button>
            </div>

            {/* New topic form */}
            {showNewTopic && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16, padding: 18, marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 12 }}>✏️ Nouveau sujet</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setNewCat(c.id)} style={{ padding: '4px 12px', borderRadius: 999, border: `1.5px solid ${newCat === c.id ? c.color : 'var(--border)'}`, background: newCat === c.id ? c.color + '18' : 'transparent', color: newCat === c.id ? c.color : 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}>{c.label}</button>
                  ))}
                </div>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTopic()}
                  placeholder="Titre de votre sujet (soyez précis)..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="az-btn-primary" onClick={addTopic} disabled={posting || !newTitle.trim()}>{posting ? '⏳ Publication...' : '✅ Publier'}</button>
                  <button className="az-btn-ghost" onClick={() => setShowNewTopic(false)}>Annuler</button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="az-empty"><span>⏳</span><p>Chargement du forum...</p></div>
            ) : filteredTopics.length === 0 ? (
              <div className="az-empty"><span>💬</span><p>Aucun sujet dans cette catégorie.<br />Soyez le premier à lancer la discussion !</p></div>
            ) : (
              <div className="az-topic-list">
                {filteredTopics.map(topic => {
                  const color = catColor(topic.cat)
                  const isLiked = likedTopics.includes(topic.id)
                  const expanded = selectedTopic?.id === topic.id
                  return (
                    <div key={topic.id} className={`az-topic${topic.pinned ? ' pinned' : ''}`}>
                      <div className="az-topic-main">
                        <AvatarBubble name={topic.author_name} size={40} color={color} />
                        <div className="az-topic-body">
                          <div className="az-topic-meta">
                            <span className="az-topic-author">{topic.author_name}</span>
                            <span className="az-topic-badge" style={{ background: color + '18', color }}>{CATEGORIES.find(c => c.id === topic.cat)?.label || topic.cat}</span>
                            {topic.pinned && <span className="az-topic-pin">📌 Épinglé</span>}
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{fmt(topic.created_at)}</span>
                          </div>
                          <button
                            style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}
                            onClick={() => {
                              if (!expanded) incrementView(topic.id, topic.views)
                              setSelectedTopic(expanded ? null : topic)
                            }}
                          >
                            <div className="az-topic-title">{topic.title}</div>
                          </button>
                          <div className="az-topic-stats">
                            <span>💬 {topic.replies} réponses</span>
                            <span>👁️ {topic.views} vues</span>
                            <span style={{ color: isLiked ? '#EF4444' : undefined }}>❤️ {topic.likes_count}</span>
                            {isAdmin && (
                              <>
                                <button onClick={() => pinTopic(topic)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: '#F59E0B', fontWeight: 700, padding: 0 }}>{topic.pinned ? '✕ Désépingler' : '📌 Épingler'}</button>
                                <button onClick={() => deleteTopic(topic.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: '#EF4444', fontWeight: 700, padding: 0 }}>🗑️ Supprimer</button>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          className={`az-like-btn${isLiked ? '' : ''}`}
                          style={isLiked ? { borderColor: '#EF4444', color: '#EF4444', background: 'rgba(239,68,68,0.08)' } : {}}
                          onClick={() => toggleTopicLike(topic)}
                        >
                          {isLiked ? '❤️' : '🤍'}
                          <span>{topic.likes_count}</span>
                        </button>
                      </div>

                      {/* Comments expanded */}
                      {expanded && (
                        <div className="az-comments">
                          {(topic.comments || []).map(c => (
                            <div key={c.id} className="az-comment">
                              <AvatarBubble name={c.author_name} size={30} color={catColor(topic.cat)} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span className="az-comment-author">{c.author_name}</span>
                                  <span className="az-comment-time">{fmt(c.created_at)}</span>
                                  {(isAdmin || c.membre_id === membre?.id) && (
                                    <button onClick={() => deleteComment(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', color: '#EF4444', padding: 0, marginLeft: 'auto' }}>✕</button>
                                  )}
                                </div>
                                <div className="az-comment-text">{c.text}</div>
                              </div>
                            </div>
                          ))}
                          <div className="az-comment-input-row">
                            <AvatarBubble name={membre ? authorName(membre) : '?'} size={30} />
                            <input
                              className="az-comment-input"
                              placeholder={membre ? 'Votre réponse...' : 'Connectez-vous pour commenter'}
                              disabled={!membre}
                              value={commentInputs[topic.id] || ''}
                              onChange={e => setCommentInputs(prev => ({ ...prev, [topic.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(topic.id, commentInputs[topic.id] || '') } }}
                            />
                            <button className="az-btn-primary" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => addComment(topic.id, commentInputs[topic.id] || '')} disabled={!membre}>→</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ RESSOURCES ═════════════════════════════════════════════════════ */}
        {tab === 'ressources' && (
          <div className="az-tab-panel">
            <div className="az-forum-header" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{resources.length}</strong> ressources partagées par la communauté
              </div>
              <button className="az-btn-primary" onClick={() => membre ? setShowNewRes(true) : toast('Connectez-vous pour partager', 'error')}>+ Partager une ressource</button>
            </div>

            {/* New resource form */}
            {showNewRes && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16, padding: 18, marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 12 }}>📚 Partager une ressource</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <select value={resCat} onChange={e => setResCat(e.target.value)} style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <select value={resType} onChange={e => setResType(e.target.value)} style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                    {['Guide', 'Template', 'Outil', 'Vidéo', 'Article', 'Checklist', 'Formation'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <input value={resTitle} onChange={e => setResTitle(e.target.value)} placeholder="Titre de la ressource..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
                <textarea value={resContent} onChange={e => setResContent(e.target.value)} placeholder="Contenu, lien ou description de la ressource..." rows={4} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="az-btn-primary" onClick={addResource} disabled={postingRes || !resTitle.trim()}>{postingRes ? '⏳...' : '✅ Partager'}</button>
                  <button className="az-btn-ghost" onClick={() => setShowNewRes(false)}>Annuler</button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="az-empty"><span>⏳</span><p>Chargement...</p></div>
            ) : resources.length === 0 ? (
              <div className="az-empty"><span>📚</span><p>Aucune ressource encore.<br />Soyez le premier à partager vos outils et guides !</p></div>
            ) : (
              <div className="az-resource-grid">
                {resources.map(r => {
                  const isLiked = likedResources.includes(r.id)
                  const color = catColor(r.cat)
                  return (
                    <div key={r.id} className="az-resource-card">
                      <div className="az-resource-top">
                        <span className="az-resource-type" style={{ background: color + '18', color }}>{r.type || 'Ressource'}</span>
                        <span className="az-resource-size">{r.size || '—'}</span>
                      </div>
                      <div className="az-resource-title">{r.title}</div>
                      {r.content && <div className="az-resource-desc">{r.content}</div>}
                      <div className="az-resource-footer">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AvatarBubble name={r.author_name} size={22} color={color} />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{r.author_name} · {fmt(r.created_at)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="az-btn-ghost small" style={isLiked ? { borderColor: '#EF4444', color: '#EF4444' } : {}} onClick={() => toggleResourceLike(r)}>
                            {isLiked ? '❤️' : '🤍'} {r.likes_count}
                          </button>
                          {r.content && <button className="az-btn-ghost small" onClick={() => setSelectedResource(r)}>Voir</button>}
                          {isAdmin && <button className="az-btn-ghost small" style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => deleteResource(r.id)}>🗑️</button>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ DÉFIS ══════════════════════════════════════════════════════════ */}
        {tab === 'defis' && (
          <div className="az-tab-panel">
            <div className="az-defi-header">
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 4 }}>🏆 Défis Business du mois</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Participez, gagnez des points et des badges. Les meilleurs sont mis en avant dans la newsletter ABAWI.</div>
              </div>
              <div className="az-leaderboard-mini">
                <div className="az-lb-title">🏅 Classement</div>
                {leaderboard.slice(0, 5).map((m, i) => (
                  <div key={i} className="az-lb-row">
                    <span className="az-lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                    <AvatarBubble name={m.name} size={24} />
                    <span className="az-lb-name">{m.name}</span>
                    <span className="az-lb-pts">{m.pts} pts</span>
                  </div>
                ))}
                {leaderboard.length === 0 && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Soyez le premier contributeur !</div>}
              </div>
            </div>

            <div className="az-defi-grid">
              {DEFIS.map(d => (
                <div key={d.id} className="az-defi-card">
                  <span className="az-defi-pts">🏆 {d.pts} pts</span>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>En cours · {d.deadline}</div>
                  <div className="az-defi-title">{d.titre}</div>
                  <div className="az-defi-desc">{d.desc}</div>
                  <div className="az-defi-meta">
                    <span>👥 {d.participants} participants</span>
                  </div>
                  <div className="az-defi-reward">🎁 {d.recompense}</div>
                  <div className="az-defi-actions">
                    <button className="az-btn-primary" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => membre ? setActiveDefi(d) : toast('Connectez-vous pour participer', 'error')}>Participer →</button>
                    <button className="az-btn-ghost small" onClick={() => setActiveDefi(d)}>Voir les détails</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ MEMBRES ════════════════════════════════════════════════════════ */}
        {tab === 'membres' && (
          <div className="az-tab-panel">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 4 }}>👥 Contributeurs de la communauté</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Classés par points de contribution — topics, commentaires, ressources partagées.</div>
            </div>

            {loading ? (
              <div className="az-empty"><span>⏳</span><p>Chargement...</p></div>
            ) : communityMembers.length === 0 ? (
              <div className="az-empty"><span>👥</span><p>Aucun contributeur encore.<br />Postez un sujet pour apparaître dans le classement !</p></div>
            ) : (
              <div className="az-member-grid">
                {communityMembers.map((m, i) => (
                  <div key={i} className="az-member-card">
                    <AvatarBubble name={m.name} size={56} color={m.badgeColor} />
                    <div className="az-member-name" style={{ marginTop: 10 }}>{m.name}</div>
                    <div className="az-member-role" style={{ color: m.badgeColor }}>{m.badge}</div>
                    <div className="az-member-bio">{m.topics} sujet{m.topics !== 1 ? 's' : ''} · {m.comments} commentaire{m.comments !== 1 ? 's' : ''} · {m.resources} ressource{m.resources !== 1 ? 's' : ''}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: m.badgeColor }}>{m.pts}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>points</span>
                    </div>
                    {i === 0 && <div style={{ marginTop: 8, fontSize: '0.7rem', fontWeight: 800, color: '#F59E0B' }}>🏅 Meilleur contributeur</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ Défi modal ═══════════════════════════════════════════════════════ */}
      {activeDefi && (
        <div className="az-modal-overlay" onClick={() => setActiveDefi(null)}>
          <div className="az-modal" onClick={e => e.stopPropagation()}>
            <div className="az-modal-header">
              <div>
                <div className="az-modal-title">🏆 {activeDefi.titre}</div>
                <div className="az-modal-sub">{activeDefi.pts} pts · {activeDefi.deadline}</div>
              </div>
              <button className="az-annah-close" onClick={() => setActiveDefi(null)}>✕</button>
            </div>
            <div className="az-modal-body">
              <div className="az-md-h2">Description</div>
              <div className="az-md-p">{activeDefi.desc}</div>
              <div className="az-md-h2">Livrables à fournir</div>
              {activeDefi.livrables.map((l, i) => <div key={i} className="az-md-p">• {l}</div>)}
              <div className="az-md-h2">Critères d'évaluation</div>
              <div className="az-md-p">{activeDefi.critere}</div>
              <div className="az-md-h2">Récompenses</div>
              <div className="az-md-action">🎁 {activeDefi.recompense}</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {membre ? (
                  <button className="az-btn-primary" onClick={() => { setActiveDefi(null); setTab('forum'); toast('✅ Postez votre participation dans le forum — catégorie Annonces') }}>
                    ✅ Soumettre via le Forum
                  </button>
                ) : (
                  <Link to="/login" className="az-btn-primary" style={{ textDecoration: 'none' }}>Se connecter pour participer →</Link>
                )}
                <button className="az-btn-ghost" onClick={() => setActiveDefi(null)}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Resource modal ═══════════════════════════════════════════════════ */}
      {selectedResource && (
        <div className="az-modal-overlay" onClick={() => setSelectedResource(null)}>
          <div className="az-modal az-resource-modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="az-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div className="az-res-modal-icon" style={{ background: catColor(selectedResource.cat) + '22', color: catColor(selectedResource.cat) }}>
                  {selectedResource.type === 'Template' ? '📄' : selectedResource.type === 'Guide' ? '📖' : selectedResource.type === 'Outil' ? '🔧' : selectedResource.type === 'Vidéo' ? '🎬' : selectedResource.type === 'Audio' ? '🎧' : '📎'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="az-modal-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedResource.title}</div>
                  <div className="az-modal-sub">{selectedResource.type} · {selectedResource.size || '—'} · par {selectedResource.author_name}</div>
                </div>
              </div>
              <button className="az-annah-close" onClick={() => setSelectedResource(null)}>✕</button>
            </div>

            {/* Body */}
            <div className="az-modal-body">
              {/* Meta bar */}
              <div className="az-res-meta-bar">
                <span className="az-res-meta-pill" style={{ background: catColor(selectedResource.cat) + '18', color: catColor(selectedResource.cat) }}>
                  {CATEGORIES.find(c => c.id === selectedResource.cat)?.label || selectedResource.cat}
                </span>
                <span className="az-res-meta-pill">🕒 {fmt(selectedResource.created_at)}</span>
                <span className="az-res-meta-pill">👁️ {(selectedResource.views || 0) + (selectedResource.likes_count || 0) * 3} vues</span>
                <span className="az-res-meta-pill">❤️ {selectedResource.likes_count || 0} likes</span>
              </div>

              {/* Description */}
              <div className="az-res-content">
                <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>Description</h4>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {selectedResource.content || 'Aucune description fournie.'}
                </div>
              </div>

              {/* Contenu détaillé / Sections */}
              {selectedResource.sections && (
                <div className="az-res-sections">
                  {selectedResource.sections.map((sec, i) => (
                    <div key={i} className="az-res-section">
                      <div className="az-res-section-title">{sec.title}</div>
                      <div className="az-res-section-body">{sec.body}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action bar */}
              <div className="az-res-actions">
                <button
                  className="az-btn-primary az-res-dl-btn"
                  onClick={async () => {
                    const r = selectedResource
                    if (r.downloadUrl) {
                      // Télécharger le vrai fichier statique
                      try {
                        const res = await fetch(r.downloadUrl)
                        if (!res.ok) throw new Error('Fichier non trouvé')
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        const ext = r.downloadUrl.split('.').pop()
                        a.download = `${r.title.replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '_')}.${ext}`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                        toast(`📥 ${r.title} téléchargé`, 'ok')
                      } catch {
                        toast('❌ Erreur de téléchargement', 'error')
                      }
                      return
                    }
                    // Fallback : générer un markdown pour les ressources sans fichier
                    const md = [`# ${r.title}`, ``, `**Type :** ${r.type || 'Ressource'}`, `**Catégorie :** ${CATEGORIES.find(c => c.id === r.cat)?.label || r.cat}`, `**Auteur :** ${r.author_name}`, `**Date :** ${fmt(r.created_at)}`, ``, `---`, ``, r.content || 'Aucune description.', ...(r.sections ? ['', '---', ...r.sections.flatMap(s => [`## ${s.title}`, '', s.body, ''])] : []), '', '---', '', '*Partagé depuis AbZone — Communauté ABAWI*'].join('\n')
                    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${r.title.replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '_')}.md`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                    toast(`📥 ${r.title} téléchargé`, 'ok')
                  }}
                >
                  <span>⬇️</span> Télécharger {selectedResource.size ? `(${selectedResource.size})` : ''}
                </button>
                <button
                  className="az-btn-ghost"
                  style={likedResources.includes(selectedResource.id) ? { borderColor: '#EF4444', color: '#EF4444' } : {}}
                  onClick={() => toggleResourceLike(selectedResource)}
                >
                  {likedResources.includes(selectedResource.id) ? '❤️' : '🤍'} {selectedResource.likes_count || 0}
                </button>
                <button className="az-btn-ghost" onClick={() => { navigator.clipboard?.writeText(`${selectedResource.title} — Partagé depuis AbZone ABAWI`); toast('🔗 Lien copié dans le presse-papiers', 'ok') }}>
                  🔗 Partager
                </button>
              </div>

              {/* Auteur card */}
              <div className="az-res-author-card">
                <AvatarBubble name={selectedResource.author_name} size={36} color={catColor(selectedResource.cat)} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedResource.author_name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Contributeur AbZone · {fmt(selectedResource.created_at)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Annah AI ═════════════════════════════════════════════════════════ */}
      <div className="az-annah-wrap">
        {annahOpen && (
          <div className="az-annah-card">
            <div className="az-annah-header">
              <div className="az-annah-avatar">🤖<div className="az-annah-status" /></div>
              <div><div className="az-annah-name">Annah IA</div><div className="az-annah-sub">Community Manager · En ligne</div></div>
              <button className="az-annah-close" onClick={() => setAnnahOpen(false)}>✕</button>
            </div>
            <div className="az-annah-body" ref={annahRef}>
              {annahMessages.map(m => (
                <div key={m.id} className={`az-msg ${m.role}`}>
                  <div className="az-msg-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  <span className="az-msg-time">{fmt(m.time)}</span>
                </div>
              ))}
              {annahLoading && (
                <div className="az-msg annah">
                  <div className="az-msg-bubble"><div className="az-typing"><span /><span /><span /></div></div>
                </div>
              )}
            </div>
            <div className="az-annah-footer">
              <input
                className="az-annah-input"
                value={annahInput}
                onChange={e => setAnnahInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendToAnnah()}
                placeholder="Posez votre question..."
              />
              <button className="az-annah-send" onClick={sendToAnnah} disabled={annahLoading || !annahInput.trim()}>→</button>
            </div>
          </div>
        )}
        <button className="az-annah-trigger" onClick={() => setAnnahOpen(v => !v)}>
          <span>🤖</span>
          <span className="az-annah-trigger-label">Annah IA</span>
          <span className="az-annah-trigger-pulse" />
        </button>
      </div>
    </div>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
/* Toast */
.az-toast {
  position:fixed; top:calc(var(--navbar-total-h,60px)+16px); right:20px; z-index:9999;
  padding:10px 18px; border-radius:12px; backdrop-filter:blur(12px);
  background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.35); color:#10B981;
  font-weight:600; font-size:0.85rem; max-width:320px;
  box-shadow:0 8px 24px rgba(0,0,0,0.15); animation:azFadeIn 0.3s ease;
}
@keyframes azFadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

/* Tabs */
.az-tabs {
  display:flex; gap:8px; flex-wrap:wrap; margin: 24px 0 16px;
  padding: 6px; border-radius: 14px;
  background: color-mix(in srgb, var(--bg-card) 80%, transparent);
  border: 1px solid var(--border);
  backdrop-filter: blur(12px);
}
.az-tab {
  display:inline-flex; align-items:center; gap:8px;
  padding: 10px 18px; border-radius: 10px; border: none;
  background: transparent; cursor:pointer; font-family:inherit;
  font-size:0.82rem; font-weight:700; color: var(--text-secondary);
  transition: all 0.2s ease;
}
.az-tab:hover { color: var(--text-primary); }
.az-tab.on {
  background: linear-gradient(135deg, #2e1065, #4c1d95);
  color: #fff;
  box-shadow: 0 4px 14px rgba(76,29,149,0.35);
}
.az-tab-panel { animation: azFadeIn 0.3s ease; }

/* Forum header */
.az-forum-header {
  display:flex; align-items:center; justify-content:space-between;
  gap:12px; flex-wrap:wrap; margin-bottom: 16px;
}
.az-cat-pills { display:flex; gap:6px; flex-wrap:wrap; }
.az-cat-pill {
  padding: 5px 12px; border-radius: 999px; border: 1.5px solid var(--border);
  background: transparent; cursor:pointer; font-family:inherit;
  font-size:0.72rem; font-weight:700; color: var(--text-secondary);
  transition: all 0.18s;
}
.az-cat-pill:hover { border-color: var(--accent); color: var(--accent); }
.az-cat-pill.on { border-color: #8B5CF6; background: #8B5CF612; color: #8B5CF6; }

/* Topic list */
.az-topic-list { display:flex; flex-direction:column; gap:10px; }
.az-topic {
  background: color-mix(in srgb, var(--bg-card) 92%, transparent);
  border: 1px solid var(--border); border-radius: 16px;
  padding: 16px 18px; transition: all 0.2s;
}
.az-topic:hover { border-color: color-mix(in srgb, var(--accent) 30%, transparent); transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.az-topic.pinned { border-color: rgba(245,158,11,0.35); background: rgba(245,158,11,0.04); }
.az-topic-main { display:flex; gap:12px; align-items:flex-start; }
.az-topic-body { flex:1; min-width:0; }
.az-topic-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px; }
.az-topic-author { font-size:0.78rem; font-weight:700; color: var(--text-primary); }
.az-topic-badge { padding: 2px 8px; border-radius: 999px; font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; }
.az-topic-pin { font-size:0.68rem; font-weight:700; color: #F59E0B; }
.az-topic-title { font-size:0.92rem; font-weight:800; color: var(--text-primary); line-height:1.35; margin: 4px 0 6px; }
.az-topic-stats { display:flex; gap:12px; font-size:0.72rem; color: var(--text-muted); font-weight:600; flex-wrap:wrap; align-items:center; }
.az-like-btn {
  display:flex; flex-direction:column; align-items:center; gap:3px;
  padding: 8px 10px; border-radius: 10px; border: 1.5px solid var(--border);
  background: transparent; cursor:pointer; font-family:inherit;
  font-size:0.72rem; color: var(--text-muted); transition: all 0.2s; flex-shrink:0;
}
.az-like-btn:hover { border-color: #EF4444; color: #EF4444; background: rgba(239,68,68,0.06); }
.az-like-btn.small { flex-direction:row; gap:5px; padding: 5px 10px; font-size:0.72rem; }

/* Comments */
.az-comments { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); display:flex; flex-direction:column; gap:10px; }
.az-comment { display:flex; gap:10px; align-items:flex-start; }
.az-comment-author { font-size:0.75rem; font-weight:700; color: var(--text-primary); }
.az-comment-time { font-size:0.7rem; color: var(--text-muted); font-weight:500; }
.az-comment-text { font-size:0.82rem; color: var(--text-secondary); line-height:1.55; margin-top:2px; }
.az-comment-input-row { display:flex; gap:8px; margin-top:6px; align-items:center; }
.az-comment-input { flex:1; padding: 8px 12px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--bg-primary); color: var(--text-primary); font-size:0.82rem; font-family:inherit; outline:none; }
.az-comment-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb,var(--accent) 10%,transparent); }

/* Empty */
.az-empty { text-align:center; padding: 40px 20px; color: var(--text-muted); }
.az-empty span { font-size:2.5rem; display:block; margin-bottom:8px; }
.az-empty p { font-size:0.9rem; margin: 0 0 12px; }

/* Resources */
.az-resource-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:14px; }
.az-resource-card {
  background: color-mix(in srgb, var(--bg-card) 92%, transparent);
  border: 1px solid var(--border); border-radius: 16px; padding: 16px;
  transition: all 0.2s;
}
.az-resource-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); border-color: color-mix(in srgb, var(--accent) 25%, transparent); }
.az-resource-top { display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px; }
.az-resource-type { padding: 3px 10px; border-radius: 999px; font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; }
.az-resource-size { font-size:0.72rem; color: var(--text-muted); font-weight:600; }
.az-resource-title { font-size:0.88rem; font-weight:800; color: var(--text-primary); line-height:1.35; margin-bottom: 10px; }
.az-resource-footer { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; }
.az-resource-desc { font-size:0.78rem; color: var(--text-secondary); line-height:1.5; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

/* Défis */
.az-defi-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom: 20px; }
.az-defi-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:14px; }
.az-defi-card {
  background: color-mix(in srgb, var(--bg-card) 92%, transparent);
  border: 1px solid var(--border); border-radius: 18px; padding: 18px;
  position:relative; overflow:hidden; transition: all 0.25s;
}
.az-defi-card:hover { border-color: rgba(139,92,246,0.3); box-shadow: 0 8px 28px rgba(76,29,149,0.1); transform: translateY(-2px); }
.az-defi-pts { position:absolute; top:12px; right:12px; padding: 4px 10px; border-radius: 999px; background: linear-gradient(135deg, #F59E0B, #D97706); color: #fff; font-size:0.72rem; font-weight:800; }
.az-defi-title { font-size:1rem; font-weight:800; color: var(--text-primary); margin: 6px 0 8px; line-height:1.3; padding-right: 50px; }
.az-defi-desc { font-size:0.82rem; color: var(--text-secondary); line-height:1.55; margin-bottom: 12px; }
.az-defi-meta { display:flex; gap:12px; font-size:0.72rem; color: var(--text-muted); font-weight:600; flex-wrap:wrap; }
.az-defi-reward { font-size:0.75rem; color: #F59E0B; font-weight:700; margin-top: 8px; padding: 6px 10px; border-radius: 8px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); }
.az-defi-actions { display:flex; gap:8px; margin-top: 12px; flex-wrap:wrap; }

/* Leaderboard mini */
.az-leaderboard-mini { background: color-mix(in srgb, var(--bg-card) 90%, transparent); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; min-width: 220px; }
.az-lb-title { font-size:0.75rem; font-weight:800; color: var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom: 10px; }
.az-lb-row { display:flex; align-items:center; gap:8px; padding: 5px 0; }
.az-lb-rank { font-size:0.75rem; font-weight:900; color: var(--text-muted); width:22px; }
.az-lb-name { flex:1; font-size:0.8rem; font-weight:700; color: var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.az-lb-pts { font-size:0.72rem; font-weight:800; color: var(--accent); }

/* Members */
.az-member-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:14px; }
.az-member-card { background: color-mix(in srgb, var(--bg-card) 92%, transparent); border: 1px solid var(--border); border-radius: 16px; padding: 20px 16px; text-align:center; transition: all 0.2s; }
.az-member-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
.az-member-name { font-size:0.9rem; font-weight:800; color: var(--text-primary); margin-top:10px; }
.az-member-role { font-size:0.72rem; font-weight:800; color: var(--accent); margin: 4px 0 8px; text-transform:uppercase; letter-spacing:0.5px; }
.az-member-bio { font-size:0.78rem; color: var(--text-secondary); line-height:1.5; margin-bottom: 8px; }

/* Buttons */
.az-btn-primary {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding: 10px 18px; border-radius: 10px; border:none;
  background: linear-gradient(135deg, #4c1d95, #2e1065);
  color: #fff; font-size:0.82rem; font-weight:700; cursor:pointer; font-family:inherit;
  transition: all 0.2s; box-shadow: 0 4px 14px rgba(76,29,149,0.28);
  text-decoration:none;
}
.az-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow: 0 6px 20px rgba(76,29,149,0.4); }
.az-btn-primary:disabled { opacity:0.45; cursor:not-allowed; }
.az-btn-ghost {
  display:inline-flex; align-items:center; gap:6px; padding: 8px 14px;
  border-radius: 10px; border: 1.5px solid var(--border); background: transparent;
  color: var(--text-secondary); font-size:0.82rem; font-weight:600; cursor:pointer;
  font-family:inherit; transition: all 0.2s; text-decoration:none;
}
.az-btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
.az-btn-ghost.small { padding: 5px 10px; font-size:0.72rem; }

/* Annah */
.az-annah-wrap { position: fixed; bottom: 24px; right: 24px; z-index: 9998; display:flex; flex-direction:column; align-items:flex-end; gap: 12px; }
.az-annah-trigger {
  display:flex; align-items:center; gap: 10px; padding: 14px 20px; border-radius: 999px; border: none;
  background: linear-gradient(135deg, #4c1d95, #2e1065); color: #fff; font-size:0.9rem; font-weight:800;
  cursor:pointer; font-family:inherit; box-shadow: 0 6px 24px rgba(76,29,149,0.4);
  transition: all 0.3s ease; position:relative;
}
.az-annah-trigger:hover { transform: scale(1.05); }
.az-annah-trigger-pulse { position:absolute; top:-2px; right:-2px; width:12px; height:12px; border-radius:50%; background:#10B981; border:2px solid var(--bg-primary); animation: azPulse 2s infinite; }
@keyframes azPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.3);opacity:0.7} }
.az-annah-card { width: 380px; max-width: calc(100vw - 32px); height: 520px; max-height: calc(100vh - 140px); background: color-mix(in srgb, var(--bg-card) 95%, transparent); border: 1px solid var(--border); border-radius: 20px; backdrop-filter: blur(20px); box-shadow: 0 20px 60px rgba(0,0,0,0.25); display:flex; flex-direction:column; overflow:hidden; animation: azSlideUp 0.3s ease; }
@keyframes azSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.az-annah-header { display:flex; align-items:center; gap:12px; padding: 14px 16px; border-bottom: 1px solid var(--border); background: linear-gradient(135deg, #2e1065, #4c1d95); }
.az-annah-avatar { position:relative; font-size:1.8rem; }
.az-annah-status { position:absolute; bottom:2px; right:2px; width:10px; height:10px; border-radius:50%; background:#10B981; border:2px solid #2e1065; }
.az-annah-name { font-size:0.9rem; font-weight:800; color: #fff; }
.az-annah-sub { font-size:0.72rem; color: rgba(255,255,255,0.75); font-weight:600; }
.az-annah-close { margin-left:auto; width:30px; height:30px; border-radius:8px; border:none; background: rgba(255,255,255,0.12); color:#fff; cursor:pointer; font-size:0.9rem; display:flex; align-items:center; justify-content:center; transition: all 0.2s; }
.az-annah-close:hover { background: rgba(255,255,255,0.22); }
.az-annah-body { flex:1; overflow-y:auto; padding: 14px; display:flex; flex-direction:column; gap:10px; }
.az-msg { display:flex; flex-direction:column; gap:3px; }
.az-msg.annah { align-self:flex-start; }
.az-msg.user { align-self:flex-end; align-items:flex-end; }
.az-msg-bubble { max-width: 280px; padding: 10px 14px; border-radius: 14px; font-size:0.82rem; line-height:1.55; word-wrap:break-word; white-space:pre-wrap; }
.az-msg.annah .az-msg-bubble { background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
.az-msg.user .az-msg-bubble { background: linear-gradient(135deg, #4c1d95, #2e1065); color: #fff; border-bottom-right-radius: 4px; }
.az-msg-time { font-size:0.65rem; color: var(--text-muted); }
.az-typing { display:flex; align-items:center; gap:5px; padding: 12px 14px; }
.az-typing span { width:7px; height:7px; border-radius:50%; background:var(--text-muted); animation: azBounce 1.4s infinite ease-in-out both; }
.az-typing span:nth-child(1) { animation-delay: -0.32s; }
.az-typing span:nth-child(2) { animation-delay: -0.16s; }
@keyframes azBounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
.az-annah-footer { display:flex; gap:8px; padding: 10px 14px; border-top: 1px solid var(--border); }
.az-annah-input { flex:1; padding: 10px 14px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--bg-primary); color: var(--text-primary); font-size:0.85rem; font-family:inherit; outline:none; }
.az-annah-input:focus { border-color: #8B5CF6; box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }
.az-annah-send { width: 40px; height: 40px; border-radius: 12px; border:none; background: linear-gradient(135deg, #4c1d95, #2e1065); color: #fff; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; transition: all 0.2s; flex-shrink:0; }
.az-annah-send:hover:not(:disabled) { transform: scale(1.08); }
.az-annah-send:disabled { opacity:0.4; cursor:not-allowed; }

/* Modals */
.az-modal-overlay { position:fixed; inset:0; z-index:9990; background:rgba(0,0,0,0.55); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:20px; animation:azFadeIn 0.2s ease; }
.az-modal { width:760px; max-width:100%; max-height: calc(100vh - 40px); background: color-mix(in srgb, var(--bg-card) 95%, transparent); border: 1px solid var(--border); border-radius: 20px; display:flex; flex-direction:column; overflow:hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.35); }
.az-modal-header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding: 16px 20px; border-bottom: 1px solid var(--border); background: linear-gradient(135deg, #2e1065, #4c1d95); }
.az-modal-title { font-size:1.05rem; font-weight:800; color:#fff; line-height:1.3; }
.az-modal-sub { font-size:0.72rem; color:rgba(255,255,255,0.75); font-weight:600; margin-top:2px; }
.az-modal-body { flex:1; overflow-y:auto; padding: 20px 22px; }

/* Resource modal */
.az-resource-modal { width: 640px; }
.az-res-modal-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
.az-res-meta-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.az-res-meta-pill { padding: 5px 12px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: var(--bg-primary); color: var(--text-secondary); border: 1px solid var(--border); }
.az-res-content { background: var(--bg-primary); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; margin-bottom: 18px; }
.az-res-sections { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; }
.az-res-section { background: var(--bg-primary); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
.az-res-section-title { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.az-res-section-body { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; }
.az-res-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
.az-res-dl-btn { flex: 1; min-width: 180px; }
.az-res-author-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 14px; }

/* Responsive */
@media(max-width:640px) {
  .az-annah-wrap { bottom:16px; right:16px; }
  .az-annah-card { width: calc(100vw - 32px); height: calc(100vh - 100px); }
  .az-annah-trigger { padding: 12px 16px; font-size:0.82rem; }
  .az-resource-grid { grid-template-columns: 1fr; }
  .az-resource-modal { width: 100%; }
  .az-res-actions { flex-direction: column; }
  .az-res-dl-btn { width: 100%; }
  .az-res-meta-bar { gap: 6px; }
  .az-defi-grid { grid-template-columns: 1fr; }
  .az-member-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  .az-defi-header { flex-direction:column; }
  .az-leaderboard-mini { width:100%; }
  .az-tabs { gap:4px; padding: 4px; }
  .az-tab { padding: 8px 12px; font-size:0.75rem; gap:5px; }
  .az-forum-header { gap:8px; }
  .az-cat-pills { gap:4px; }
  .az-cat-pill { padding: 4px 9px; font-size:0.68rem; }
}
`
