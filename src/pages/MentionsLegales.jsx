import './MentionsLegales.css'

function MentionsLegales() {
  return (
    <main className="ml-page">
      <h1 className="ml-title">Mentions legales</h1>

      <section className="ml-section">
        <h2>Éditeur du site</h2>
        <p><strong>Raison sociale :</strong> ABAWI SN</p>
        <p><strong>Siège social :</strong> VDN Liberte 6 Extension, Dakar, Sénégal</p>
        <p><strong>Responsable :</strong> ABAWI SN</p>
        <p><strong>Telephone :</strong> +221 77 518 50 50</p>
        <p><strong>Email :</strong> contact@abawi.sn</p>
      </section>

      <section className="ml-section">
        <h2>Hébergement</h2>
        <p><strong>Site web :</strong> Netlify, Inc. — San Francisco, USA</p>
        <p><strong>Base de donnees :</strong> Supabase — Union Europeenne</p>
      </section>

      <section className="ml-section">
        <h2>Paiements</h2>
        <p>Les paiements sont traites par <strong>PayDunya</strong> (Dakar, Sénégal), plateforme de paiement agréée.</p>
        <p>Moyens de paiement acceptes : Wave, Orange Money, Free Money, Carte bancaire (Visa, Mastercard).</p>
        <p>Toutes les transactions sont sécurisées et chiffrées.</p>
      </section>

      <section className="ml-section">
        <h2>Conditions d'utilisation</h2>
        <p>En accédant au site abawi.app, vous acceptez les presentes conditions.</p>
        <p>Les contenus proposes (guides PDF, fascicules, podcasts) sont protégés par le droit d'auteur. Toute reproduction non autorisee est interdite.</p>
        <p>Les prix affiches sont en Francs CFA (FCFA/XOF) et peuvent etre modifiés sans préavis.</p>
      </section>

      <section className="ml-section">
        <h2>Politique de remboursement</h2>
        <p><strong>Guides et fascicules :</strong> Satisfait ou remboursé sous 7 jours apres l'achat. Envoyez votre demande a contact@abawi.sn ou sur WhatsApp.</p>
        <p><strong>Abonnement ABAWI+ :</strong> Annulable a tout moment. Le mois en cours n'est pas remboursé. L'annulation prend effet a la fin du mois paye.</p>
        <p><strong>Packs :</strong> Memes conditions que les guides individuels — remboursement sous 7 jours.</p>
      </section>

      <section className="ml-section">
        <h2>Protection des donnees</h2>
        <p>ABAWI SN s'engage à protéger vos données personnelles conformément à la loi sénégalaise sur la protection des donnees.</p>
        <p>Les donnees collectées (email, telephone, historique d'achat) sont utilisées exclusivement pour le traitement de vos commandes et l'envoi de vos produits.</p>
        <p>Aucune donnee personnelle n'est vendue ou partagée avec des tiers a des fins commerciales.</p>
        <p>Vous pouvez demander la suppression de vos données à tout moment en contactant contact@abawi.sn.</p>
      </section>

      <section className="ml-section">
        <h2>Cookies</h2>
        <p>Le site utilise des cookies techniques nécessaires à son fonctionnement (thème, préférences, session). Aucun cookie publicitaire n'est utilisé.</p>
      </section>

      <p className="ml-footer">Dernière mise à jour : mai 2026 — ABAWI SN, Dakar, Sénégal</p>
    </main>
  )
}

export default MentionsLegales
