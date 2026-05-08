import './MentionsLegales.css'

function PolitiqueCookies() {
  const clearAllCookies = () => {
    try {
      localStorage.removeItem('abawi-cookie-consent')
      document.cookie.split(';').forEach(c => {
        const name = c.split('=')[0].trim()
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      })
      window.location.reload()
    } catch (e) {
      alert('Impossible de réinitialiser les préférences — ' + (e?.message || ''))
    }
  }

  return (
    <main className="ml-page">
      <h1 className="ml-title">Politique cookies</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Dernière mise à jour : avril 2026
      </p>

      <section className="ml-section">
        <h2>Qu'est-ce qu'un cookie ?</h2>
        <p>
          Un cookie est un petit fichier déposé par un site web dans votre navigateur. Il permet de reconnaître
          votre appareil lors de visites ultérieures, de mémoriser vos préférences et d'assurer certaines
          fonctionnalités essentielles.
        </p>
      </section>

      <section className="ml-section">
        <h2>Types de cookies utilisés</h2>

        <h3 style={{ marginTop: 16, marginBottom: 8 }}>✅ Cookies strictement nécessaires (toujours actifs)</h3>
        <p>Indispensables au fonctionnement du site. Ils ne peuvent pas être désactivés.</p>
        <ul>
          <li><strong>Session :</strong> maintien de votre connexion</li>
          <li><strong>Sécurité :</strong> protection contre les attaques CSRF</li>
          <li><strong>Panier :</strong> mémorisation de vos articles</li>
          <li><strong>Préférences :</strong> thème (clair/sombre), langue, cohérence d'affichage</li>
          <li><strong>Consentement :</strong> mémorisation de vos choix cookies (localStorage 12 mois)</li>
        </ul>

        <h3 style={{ marginTop: 20, marginBottom: 8 }}>📊 Cookies analytiques (optionnels)</h3>
        <p>Pour mesurer l'audience et améliorer le site. Désactivables sans impact sur l'usage.</p>
        <ul>
          <li>Statistiques de pages visitées et durée de session</li>
          <li>Parcours utilisateur anonymisé</li>
        </ul>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          <em>Actuellement, aucun cookie analytique tiers (Google Analytics, Facebook Pixel, etc.) n'est déployé.</em>
        </p>

        <h3 style={{ marginTop: 20, marginBottom: 8 }}>🎯 Cookies publicitaires (optionnels)</h3>
        <p>Non utilisés sur ce site.</p>
      </section>

      <section className="ml-section">
        <h2>Durée de conservation</h2>
        <ul>
          <li>Cookies de session : jusqu'à la fermeture du navigateur</li>
          <li>Cookies de préférences : 12 mois</li>
          <li>Cookies d'authentification : 30 jours (ou jusqu'à déconnexion)</li>
        </ul>
        <p>Aucun cookie n'est conservé plus de 13 mois, conformément aux recommandations CNIL/CDP.</p>
      </section>

      <section className="ml-section">
        <h2>Gérer vos préférences</h2>
        <p>Vous pouvez à tout moment :</p>
        <ul>
          <li>Modifier votre consentement via la bannière (au chargement du site ou ci-dessous)</li>
          <li>Configurer votre navigateur pour refuser tout ou partie des cookies</li>
          <li>Supprimer les cookies déjà présents dans votre navigateur</li>
        </ul>
        <p style={{ marginTop: 16 }}>
          <button onClick={clearAllCookies} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #F0B429, #F59E0B)',
            color: '#0a0a0a', fontWeight: 800, cursor: 'pointer',
            fontSize: '0.9rem',
          }}>
            🔄 Réinitialiser mes préférences cookies
          </button>
        </p>
      </section>

      <section className="ml-section">
        <h2>Cookies tiers (sous-traitants)</h2>
        <p>Les prestataires suivants peuvent déposer des cookies techniques lors de l'utilisation de certaines fonctionnalités :</p>
        <ul>
          <li><strong>PayDunya</strong> (paiement) — uniquement sur la page de paiement</li>
          <li><strong>Supabase</strong> (session authentification)</li>
        </ul>
      </section>

      <section className="ml-section">
        <h2>Vos droits</h2>
        <p>
          Vous disposez de droits d'accès, de rectification, de suppression, d'opposition et de portabilité
          sur vos données. Pour les exercer, consultez notre{' '}
          <a href="/politique-confidentialite">Politique de confidentialité</a> ou contactez-nous à{' '}
          <a href="mailto:contact@abawi.sn">contact@abawi.sn</a>.
        </p>
      </section>

      <p className="ml-footer">ABAWI SN — Dakar, Sénégal.</p>
    </main>
  )
}

export default PolitiqueCookies
