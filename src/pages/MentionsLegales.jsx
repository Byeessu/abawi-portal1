import './MentionsLegales.css'

function MentionsLegales() {
  return (
    <main className="ml-page">
      <div className="ml-inner">

        {/* ── Sidebar ── */}
        <aside className="ml-sidebar">
          <p className="ml-sidebar-title">Sur cette page</p>
          <nav className="ml-sidebar-nav">
            <a href="#editeur">Éditeur du site</a>
            <a href="#hebergement">Hébergement</a>
            <a href="#paiements">Paiements</a>
            <a href="#conditions">Conditions d'utilisation</a>
            <a href="#remboursement">Remboursement</a>
            <a href="#donnees">Protection des données</a>
            <a href="#cookies">Cookies</a>
          </nav>
        </aside>

        {/* ── Content ── */}
        <div className="ml-content">
        <h1 className="ml-title">Mentions légales</h1>
        <p className="ml-subtitle">Dernière mise à jour : mai 2026 — ABAWI SN, Dakar, Sénégal</p>

        <section className="ml-section" id="editeur">
          <h2>Éditeur du site</h2>
          <p><strong>Raison sociale :</strong> ABAWI SN</p>
          <p><strong>Siège social :</strong> VDN Liberté 6 Extension, Dakar, Sénégal</p>
          <p><strong>Responsable de publication :</strong> ABAWI SN</p>
          <p><strong>Téléphone :</strong> +221 77 518 50 50</p>
          <p><strong>Email :</strong> contact@abawi.sn</p>
        </section>

        <section className="ml-section" id="hebergement">
          <h2>Hébergement</h2>
          <p><strong>Site web :</strong> Netlify, Inc. — San Francisco, USA</p>
          <p><strong>Base de données :</strong> Supabase — Union Européenne</p>
        </section>

        <section className="ml-section">
          <h2>Paiements</h2>
          <p>Les paiements sont traités par <strong>PayDunya</strong> (Dakar, Sénégal), plateforme de paiement agréée.</p>
          <p>Moyens de paiement acceptés : Wave, Orange Money, Free Money, Carte bancaire (Visa, Mastercard).</p>
          <p>Toutes les transactions sont sécurisées et chiffrées.</p>
        </section>

        <section className="ml-section">
          <h2>Conditions d'utilisation</h2>
          <p>En accédant au site abawi.app, vous acceptez les présentes conditions.</p>
          <p>Les contenus proposés (guides PDF, fascicules, podcasts) sont protégés par le droit d'auteur. Toute reproduction non autorisée est interdite.</p>
          <p>Les prix affichés sont en Francs CFA (FCFA/XOF) et peuvent être modifiés sans préavis.</p>
        </section>

        <section className="ml-section">
          <h2>Politique de remboursement</h2>
          <div className="ml-infobox">
            <p><strong>Guides et fascicules :</strong> les contenus numériques ne sont <strong>pas remboursables une fois téléchargés</strong> — un fichier téléchargé peut être copié ou transféré. En dehors de tout téléchargement, une garantie <strong>« satisfait ou remboursé » sous 7 jours</strong> s'applique sur demande à contact@abawi.sn ou sur WhatsApp.</p>
          </div>
          <p><strong>Abonnement ABAWI+ :</strong> annulable à tout moment. Le mois en cours n'est pas remboursé. L'annulation prend effet à la fin du mois payé.</p>
          <p><strong>Packs :</strong> mêmes conditions que les guides individuels — remboursement possible sous 7 jours si aucun contenu n'a été téléchargé.</p>
          <p><strong>Crédits :</strong> les crédits consommés ne sont pas remboursables. En cas de dysfonctionnement avéré, ils peuvent être restitués à la discrétion d'ABAWI SN.</p>
        </section>

        <section className="ml-section">
          <h2>Protection des données</h2>
          <p>ABAWI SN s'engage à protéger vos données personnelles conformément à la loi sénégalaise sur la protection des données.</p>
          <p>Les données collectées (email, téléphone, historique d'achat) sont utilisées exclusivement pour le traitement de vos commandes et l'envoi de vos produits.</p>
          <p>Aucune donnée personnelle n'est vendue ou partagée avec des tiers à des fins commerciales.</p>
          <p>Vous pouvez demander la suppression de vos données à tout moment en contactant contact@abawi.sn.</p>
        </section>

        <section className="ml-section">
          <h2>Cookies</h2>
          <p>Le site utilise des cookies techniques nécessaires à son fonctionnement (thème, préférences, session). Aucun cookie publicitaire n'est utilisé.</p>
        </section>

        <p className="ml-footer">ABAWI SN · VDN Liberté 6 Extension, Dakar, Sénégal · contact@abawi.sn</p>
      </div>
    </main>
  )
}

export default MentionsLegales
