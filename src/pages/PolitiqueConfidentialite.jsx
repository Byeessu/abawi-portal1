import './MentionsLegales.css'
import SEO from '../components/SEO'

function PolitiqueConfidentialite() {
  return (
    <main className="ml-page">
      <div className="ml-inner">
      <SEO
        title="Politique de Confidentialité — ABAWI"
        description="Politique de confidentialité d'ABAWI : collecte, utilisation et protection de vos données personnelles. Conforme à la loi sénégalaise et au RGPD."
        noindex={false}
      />
      <h1 className="ml-title">Politique de confidentialité</h1>
      <p className="ml-subtitle">Dernière mise à jour : mai 2026</p>

      <section className="ml-section">
        <h2>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données personnelles est <strong>ABAWI SN</strong>,
          VDN Liberté 6 Extension, Dakar, Sénégal. Contact : <a href="mailto:contact@abawi.sn">contact@abawi.sn</a>.
        </p>
        <p>
          Le traitement est conforme à la <strong>loi n° 2008-12 du 25 janvier 2008 sur la protection
          des données à caractère personnel</strong> (Commission de protection des données personnelles — CDP Sénégal)
          et aux principes du Règlement général sur la protection des données (RGPD, UE 2016/679) pour les
          utilisateurs résidant dans l'Union européenne.
        </p>
      </section>

      <section className="ml-section">
        <h2>2. Données collectées</h2>
        <p>Nous collectons uniquement les données strictement nécessaires :</p>
        <ul>
          <li><strong>Compte membre :</strong> nom, prénom, email, téléphone, mot de passe haché</li>
          <li><strong>Paiement :</strong> montant, moyen de paiement (via PayDunya), historique d'achats</li>
          <li><strong>Usage :</strong> adresse IP, navigateur, pages visitées, date/heure (logs serveur 30 jours)</li>
          <li><strong>Outils IA :</strong> texte saisi dans les outils (transmis à ABAWI AI pour traitement, non stocké)</li>
          <li><strong>Cookies techniques :</strong> session, préférences thème, panier</li>
        </ul>
        <p>Aucune donnée de santé, religion, opinion politique ou orientation sexuelle n'est collectée.</p>
      </section>

      <section className="ml-section">
        <h2>3. Finalités du traitement</h2>
        <ul>
          <li>Créer et gérer votre compte membre</li>
          <li>Traiter vos commandes et livrer vos produits numériques</li>
          <li>Facturer et respecter nos obligations comptables et fiscales</li>
          <li>Fournir un support client</li>
          <li>Envoyer des notifications transactionnelles (confirmation commande, facture)</li>
          <li>Améliorer les outils IA et la sécurité du site</li>
          <li>Envoyer, avec votre consentement, des newsletters ou promotions</li>
        </ul>
      </section>

      <section className="ml-section">
        <h2>4. Base légale</h2>
        <ul>
          <li><strong>Exécution du contrat :</strong> compte, commandes, livraison</li>
          <li><strong>Obligation légale :</strong> facturation, fiscalité, lutte contre la fraude</li>
          <li><strong>Intérêt légitime :</strong> sécurité, journalisation, amélioration continue</li>
          <li><strong>Consentement :</strong> newsletter, cookies non essentiels</li>
        </ul>
      </section>

      <section className="ml-section">
        <h2>5. Destinataires et sous-traitants</h2>
        <p>Vos données peuvent être transmises à nos sous-traitants techniques, uniquement dans la mesure nécessaire à leur mission :</p>
        <ul>
          <li><strong>Netlify, Inc.</strong> (hébergement) — USA, clauses contractuelles types</li>
          <li><strong>Supabase</strong> (base de données) — Union européenne</li>
          <li><strong>PayDunya</strong> (paiements) — Sénégal</li>
          <li><strong>ABAWI AI</strong> (traitement IA) — infrastructure sécurisée, sans stockage persistant</li>
          <li><strong>ElevenLabs</strong> (synthèse vocale) — USA, si vous utilisez les fonctions audio</li>
        </ul>
        <p>Aucune donnée n'est vendue, louée ou cédée à des tiers à des fins commerciales.</p>
      </section>

      <section className="ml-section">
        <h2>6. Durée de conservation</h2>
        <ul>
          <li>Compte actif : durée de la relation contractuelle</li>
          <li>Après suppression du compte : 3 ans (obligations comptables : 10 ans pour les factures)</li>
          <li>Logs de connexion : 12 mois</li>
          <li>Cookies : 13 mois maximum</li>
        </ul>
      </section>

      <section className="ml-section">
        <h2>7. Vos droits</h2>
        <p>Conformément à la loi, vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Accès :</strong> obtenir une copie de vos données</li>
          <li><strong>Rectification :</strong> corriger vos informations</li>
          <li><strong>Effacement :</strong> demander la suppression de vos données (« droit à l'oubli »)</li>
          <li><strong>Opposition :</strong> refuser un traitement (prospection commerciale notamment)</li>
          <li><strong>Limitation :</strong> restreindre l'usage de vos données</li>
          <li><strong>Portabilité :</strong> récupérer vos données dans un format structuré</li>
          <li><strong>Retrait du consentement</strong> à tout moment pour les traitements basés dessus</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à <a href="mailto:contact@abawi.sn">contact@abawi.sn</a>.
          Réponse sous 30 jours maximum. En cas de difficulté, vous pouvez saisir la <strong>CDP du Sénégal</strong>
          (<a href="https://www.cdp.sn" target="_blank" rel="noopener noreferrer">cdp.sn</a>) ou l'autorité de
          protection de votre pays de résidence.
        </p>
      </section>

      <section className="ml-section">
        <h2>8. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles adaptées : chiffrement TLS des échanges,
          hachage des mots de passe (bcrypt/argon2), isolation des environnements, accès restreint aux données,
          journalisation des accès admin et sauvegardes régulières.
        </p>
      </section>

      <section className="ml-section">
        <h2>9. Mineurs</h2>
        <p>
          Le service n'est pas destiné aux personnes de moins de 16 ans. Si vous êtes mineur, vous devez obtenir
          le consentement de votre représentant légal avant toute inscription ou achat.
        </p>
      </section>

      <section className="ml-section">
        <h2>10. Modifications</h2>
        <p>
          Cette politique peut être mise à jour. Toute modification substantielle sera notifiée par email ou via
          une bannière sur le site. La version en vigueur est toujours disponible sur cette page.
        </p>
      </section>

      <p className="ml-footer">
        ABAWI SN — Dakar, Sénégal. Contact DPO : <a href="mailto:contact@abawi.sn">contact@abawi.sn</a>
      </p>
      </div>
    </main>
  )
}

export default PolitiqueConfidentialite
