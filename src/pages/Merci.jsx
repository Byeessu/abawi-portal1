import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { trackEvent } from '../lib/observability'
import './Merci.css'
import { Link } from 'react-router-dom'

const WA_NUMBER = '221775185050'

// Types de page /merci
const TYPES = {
  guide: {
    icon: '📚',
    title: 'Merci pour votre achat !',
    sub: (titre) => decodeURIComponent(titre),
    text: 'Vous recevrez votre guide en PDF sur WhatsApp dans les minutes qui suivent. Si vous ne recevez rien sous 15 minutes, contactez-nous directement.',
    waText: (titre) => `Bonjour, j'ai payé pour : ${decodeURIComponent(titre)}. Merci de m'envoyer le fichier.`,
    cta: 'Recevoir sur WhatsApp',
    back: '/digital',
    backLabel: 'Retour aux guides',
  },
  abonnement: {
    icon: '👑',
    title: 'Bienvenue dans ABAWI+ !',
    sub: () => 'Votre abonnement VIP est actif',
    text: 'Vous allez recevoir votre accès complet sur WhatsApp dans les prochaines minutes : tous les guides PDF, l\'accès au groupe VIP, et les liens vers les podcasts premium.',
    waText: () => 'Bonjour, je viens de m\'abonner à ABAWI+. Merci de m\'envoyer l\'accès complet.',
    cta: 'Recevoir mon accès',
    back: '/digital',
    backLabel: 'Explorer les guides',
  },
  outil: {
    icon: '🛠️',
    title: 'Document prêt !',
    sub: (titre) => decodeURIComponent(titre),
    text: 'Votre document a été généré. Vous allez recevoir votre PDF sur WhatsApp, ou retrouvez le lien de téléchargement dans votre email.',
    waText: (titre) => `Bonjour, j'ai commandé l'outil : ${decodeURIComponent(titre)}. Merci de m'envoyer le document.`,
    cta: 'Confirmer sur WhatsApp',
    back: '/outils',
    backLabel: 'Retour aux outils',
  },
  fascicule: {
    icon: '🎓',
    title: 'Fascicule commandé !',
    sub: (titre) => decodeURIComponent(titre),
    text: 'Votre fascicule sera livré sur WhatsApp dans les minutes qui suivent. Si vous ne recevez rien sous 15 minutes, contactez-nous.',
    waText: (titre) => `Bonjour, j'ai commandé le fascicule : ${decodeURIComponent(titre)}. Merci de me l'envoyer.`,
    cta: 'Recevoir sur WhatsApp',
    back: '/academy',
    backLabel: 'Retour à l\'Academy',
  },
  default: {
    icon: '✅',
    title: 'Merci pour votre commande !',
    sub: (titre) => decodeURIComponent(titre),
    text: 'Vous recevrez votre produit sur WhatsApp dans les minutes qui suivent. Si vous ne recevez rien sous 15 minutes, contactez-nous directement.',
    waText: (titre) => `Bonjour, j'ai payé pour : ${decodeURIComponent(titre)}. Merci de m'envoyer le fichier.`,
    cta: 'Confirmer sur WhatsApp',
    back: '/',
    backLabel: 'Retour à l\'accueil',
  },
}

function Merci() {
  const [params] = useSearchParams()
  const titre = params.get('titre') || 'votre produit'
  const type = params.get('type') || 'default'
  const { membre, refreshMembre } = useAuth()

  useEffect(() => {
    trackEvent('purchase_success', {
      type,
      productId: params.get('product') || null,
      hasMembre: !!membre,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [])

  useEffect(() => {
    if (type === 'abonnement' && membre?.email) {
      const timer = setTimeout(async () => {
        try {
          const { data } = await supabase
            .from('membres')
            .select('*')
            .eq('email', membre.email)
            .single()
          if (data) {
            localStorage.setItem('abawi_membre', JSON.stringify(data))
          }
        // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
        } catch {}
        await refreshMembre()
      }, 2000)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [])

  const cfg = TYPES[type] || TYPES.default
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(cfg.waText(titre))}`

  return (
    <main className="merci-page">
      <div className="merci-card">
        <div className="merci-icon">
          {type === 'abonnement' || type === 'outil'
            ? <span style={{ fontSize: '3.5rem' }}>{cfg.icon}</span>
            : (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )
          }
        </div>

        <h1 className="merci-title">{cfg.title}</h1>
        <p className="merci-product">{cfg.sub(titre)}</p>

        <p className="merci-text">{cfg.text}</p>

        <div className="merci-actions">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="merci-btn merci-btn--wa"
          >
            💬 {cfg.cta}
          </a>
          <Link to={cfg.back} className="merci-btn merci-btn--back">
            {cfg.backLabel}
          </Link>
        </div>

        <p className="merci-support">
          Support : <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer">+221 77 518 50 50</a>
        </p>
      </div>
    </main>
  )
}

export default Merci
