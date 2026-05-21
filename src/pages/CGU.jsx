import './MentionsLegales.css'
import SEO from '../components/SEO'

function CGU() {
  return (
    <main className="ml-page">
      <div className="ml-inner">
      <SEO
        title="Conditions Générales d'Utilisation — ABAWI"
        description="Conditions générales d'utilisation du portail ABAWI. Règles d'accès, propriété intellectuelle, responsabilités et modalités de service."
        noindex={false}
      />
      <h1 className="ml-title">Conditions générales d'utilisation</h1>
      <p className="ml-subtitle">Dernière mise à jour : mai 2026</p>

      <section className="ml-section">
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions générales régissent l'utilisation du portail <strong>ABAWI</strong>,
          édité par ABAWI SN (VDN Liberté 6 Extension, Dakar, Sénégal), proposant des contenus numériques
          (guides, fascicules, podcasts), des outils IA, une boutique et un espace membre.
        </p>
        <p>
          L'utilisation du site implique l'acceptation pleine et entière des présentes conditions.
          Si vous n'êtes pas d'accord, vous devez cesser d'utiliser le site.
        </p>
      </section>

      <section className="ml-section">
        <h2>2. Compte membre</h2>
        <p>
          L'inscription est gratuite. Vous êtes responsable de la confidentialité de votre mot de passe et
          de toutes les activités effectuées depuis votre compte. Informez-nous immédiatement de toute
          utilisation non autorisée à <a href="mailto:contact@abawi.sn">contact@abawi.sn</a>.
        </p>
        <p>Un seul compte par personne. Les comptes multiples ou frauduleux pourront être suspendus.</p>
      </section>

      <section className="ml-section">
        <h2>3. Produits et services</h2>
        <ul>
          <li><strong>Guides et fascicules</strong> : contenus numériques téléchargeables (PDF + audio)</li>
          <li><strong>Podcasts</strong> : audios streaming et téléchargement selon abonnement</li>
          <li><strong>Outils IA</strong> : CV, business plan, analyse, etc. — usage personnel uniquement</li>
          <li><strong>Abonnement ABAWI+</strong> : accès illimité aux contenus digitaux, reconductible mensuellement</li>
          <li><strong>Packs</strong> : regroupements de contenus à prix réduit</li>
          <li><strong>Store IT</strong> : produits physiques et numériques tiers</li>
        </ul>
      </section>

      <section className="ml-section">
        <h2>4. Prix et paiement</h2>
        <p>
          Les prix sont affichés en <strong>Francs CFA (FCFA / XOF)</strong>, TTC. Nous pouvons les modifier
          à tout moment ; les commandes en cours restent au tarif initial.
        </p>
        <p>Moyens de paiement acceptés via PayDunya : Wave, Orange Money, Free Money, Carte bancaire (Visa, Mastercard).</p>
        <p>
          La livraison des produits numériques est immédiate après confirmation du paiement par PayDunya.
          Une facture électronique est envoyée à l'email du compte.
        </p>
      </section>

      <section className="ml-section">
        <h2>5. Rétractation et remboursement</h2>
        <p>
          <strong>Guides et fascicules :</strong> les contenus numériques ne sont <strong>pas remboursables une fois téléchargés</strong> — un fichier téléchargé peut être copié ou transféré, ce qui rend la rétractation impossible à vérifier. En dehors de tout téléchargement, nous appliquons à titre commercial une garantie <strong>« satisfait ou remboursé » sous 7 jours</strong> après l'achat. Envoyez votre demande à <strong>contact@abawi.sn</strong> ou sur WhatsApp.
        </p>
        <p>
          <strong>Abonnement ABAWI+ :</strong> annulable à tout moment depuis l'espace membre. Le mois en cours n'est pas remboursé ; l'annulation prend effet à la fin de la période payée.
        </p>
        <p>
          <strong>Packs de contenus :</strong> mêmes conditions que les guides individuels — remboursement possible sous 7 jours après l'achat, uniquement si aucun contenu du pack n'a été téléchargé.
        </p>
        <p>
          <strong>Outils et crédits :</strong> les crédits consommés ne sont pas remboursables. En cas de dysfonctionnement avéré d'un outil, les crédits utilisés peuvent être restitués sur justification, à la discrétion d'ABAWI SN.
        </p>
      </section>

      <section className="ml-section">
        <h2>6. Propriété intellectuelle</h2>
        <p>
          Tous les contenus (textes, images, audio, code, logos) sont protégés par le droit d'auteur.
          L'achat donne droit à un <strong>usage personnel et non commercial</strong>. Toute reproduction,
          diffusion publique, revente ou modification est strictement interdite sans autorisation écrite
          préalable d'ABAWI SN.
        </p>
        <p>
          Les documents générés par les outils IA (CV, business plan, contrats) appartiennent à l'utilisateur
          qui les génère, à l'exception de toute marque ou logo ABAWI qui y figurerait.
        </p>
      </section>

      <section className="ml-section">
        <h2>7. Utilisation des outils IA</h2>
        <p>
          Les outils IA sont des assistants — ils <strong>ne remplacent pas un conseil professionnel</strong>
          (avocat, expert-comptable, banquier, médecin). ABAWI SN ne saurait être tenue responsable des décisions
          prises sur la seule base d'un document généré.
        </p>
        <p>
          L'utilisateur s'engage à ne pas soumettre de contenus illégaux, haineux, diffamatoires, ou portant
          atteinte à la vie privée de tiers. ABAWI SN se réserve le droit de suspendre tout compte en cas d'abus.
        </p>
      </section>

      <section className="ml-section">
        <h2>8. Disponibilité</h2>
        <p>
          Nous visons une disponibilité 24/7 mais pouvons interrompre le service pour maintenance,
          mise à jour ou cas de force majeure (panne hébergeur, coupure Internet, attaque cyber).
          Aucune indemnité n'est due pour de telles interruptions, sauf obligation légale.
        </p>
      </section>

      <section className="ml-section">
        <h2>9. Responsabilité</h2>
        <p>
          ABAWI SN s'engage à une obligation de moyens. Notre responsabilité est limitée au montant
          effectivement payé pour le service concerné au cours des 12 derniers mois. Sont exclus les
          dommages indirects (perte d'exploitation, de chance, d'image).
        </p>
      </section>

      <section className="ml-section">
        <h2>10. Données personnelles</h2>
        <p>
          Le traitement des données est régi par notre{' '}
          <a href="/politique-confidentialite">Politique de confidentialité</a>, partie intégrante des présentes CGU.
        </p>
      </section>

      <section className="ml-section">
        <h2>11. Modifications</h2>
        <p>
          ABAWI SN peut modifier ces CGU à tout moment. Les utilisateurs sont informés par email ou via
          le site. L'utilisation continue du service après modification vaut acceptation.
        </p>
      </section>

      <section className="ml-section">
        <h2>12. Droit applicable et litiges</h2>
        <p>
          Les présentes CGU sont régies par le <strong>droit sénégalais</strong>. En cas de litige, les parties
          s'efforceront de trouver une solution amiable. À défaut, les tribunaux de <strong>Dakar</strong> seront
          seuls compétents, sauf disposition légale impérative contraire.
        </p>
      </section>

      <p className="ml-footer">ABAWI SN — Dakar, Sénégal. Contact : <a href="mailto:contact@abawi.sn">contact@abawi.sn</a></p>
      </div>
    </main>
  )
}

export default CGU
