import { useState } from 'react';
import { callGroq } from '../../lib/groqClient';

const SYSTEM_PROMPT = `Tu es un rédacteur expert en communication événementielle au Sénégal.
Ta mission : rédiger UNIQUEMENT le texte d'annonce percutant et engageant pour un événement, en français.

RÈGLES :
- Commence directement par le texte, sans titre "Annonce" ni introduction.
- Utilise un ton dynamique, chaleureux et professionnel adapté au public sénégalais.
- Inclus naturellement les infos clés : titre, date, heure, lieu, ville, prix/catégories.
- Ajoute un appel à l'action en fin de texte ("Réservez vite", "Ne manquez pas", etc.).
- Longueur : 3 à 6 phrases courtes et punchy.
- Utilise des emojis pertinents (🎉, 📅, 📍, 🎤, 🎫, ✨) avec parcimonie.
- Ne mentionne jamais "SenTicket" ou "ABAWI" — l'organisateur publiera lui-même.`;

export default function AiAnnouncer({ eventData, flyerText, onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState('');
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true);
    setError('');
    setGenerated('');
    try {
      const { titre, description, date, heure, ville, lieu, categorie, billets, sansBillet } = eventData;
      const prixInfo = !sansBillet && billets?.length
        ? billets.map(b => `${b.nom} : ${Number(b.prix).toLocaleString('fr-FR')} FCFA`).join(', ')
        : 'Gratuit';

      const flyerSection = flyerText
        ? `\n--- Texte brut extrait du flyer/affiche (OCR) ---\n${flyerText.slice(0, 2000)}\n---\n\nUtilise ce texte OCR comme source d'inspiration et d'informations supplémentaires pour enrichir l'annonce. Extrais les détails clés (artistes, thème, ambiance, couleurs, slogans) pour la rendre plus percutante.`
        : '';

      const userPrompt = `Rédige une annonce événementielle pour :
- Titre : ${titre || 'Événement à venir'}
- Catégorie : ${categorie || 'Événement'}
- Date : ${date || 'à préciser'} à ${heure || 'à préciser'}
- Lieu : ${lieu || 'à préciser'}, ${ville || 'Dakar'}
- Description existante : ${description || 'Aucune'}
- Tarifs : ${prixInfo}${flyerSection}
`;

      const text = await callGroq([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ], { temperature: 0.75, maxTokens: 800 });

      if (!text) {
        setError('L\'IA n\'a pas généré de texte. Réessayez.');
        return;
      }
      setGenerated(text);
      if (onGenerated) onGenerated(text);
    } catch (err) {
      console.error('AiAnnouncer error:', err);
      setError(err.message || 'Erreur de génération IA.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stk-announcer">
      <div className="stk-announcer__header">
        <div className="stk-announcer__header-text">
          <div className="stk-announcer__title">✨ Générateur d'annonce ABAWI IA</div>
          <div className="stk-announcer__subtitle">L'IA rédige un texte d'annonce engageant à partir des infos de l'événement.</div>
        </div>
      </div>

      {!generated && !loading && (
        <button
          type="button"
          className="stk-announcer__generate-btn"
          onClick={generate}
          disabled={!eventData.titre || !eventData.date}
        >
          🤖 Générer le texte d'annonce
        </button>
      )}

      {(!eventData.titre || !eventData.date) && !generated && !loading && (
        <p className="stk-announcer__hint">
          Remplissez au minimum le titre et la date pour activer le générateur.
        </p>
      )}

      {loading && (
        <div className="stk-announcer__loading">
          <div className="stk-announcer__loading-text">✨ L'IA rédige votre annonce…</div>
          <div className="stk-announcer__loading-dots">
            <span className="stk-announcer__loading-dot" />
            <span className="stk-announcer__loading-dot" />
            <span className="stk-announcer__loading-dot" />
          </div>
        </div>
      )}

      {error && (
        <div className="stk-announcer__error">
          ⚠️ {error}
        </div>
      )}

      {generated && (
        <div className="stk-announcer__output">
          <div className="stk-announcer__text">
            {generated}
          </div>
          <div className="stk-announcer__actions">
            <button
              type="button"
              className="stk-announcer__use-btn"
              onClick={() => { if (onGenerated) onGenerated(generated); }}
            >
              📋 Utiliser comme description
            </button>
            <button type="button" className="stk-announcer__regen-btn" onClick={generate}>
              🔄 Regénérer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
