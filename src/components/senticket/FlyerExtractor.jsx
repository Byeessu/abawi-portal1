import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { callGroqJSON } from '../../lib/groqClient';

const CATEGORIES = ['Concert', 'Festival', 'Conférence', 'Sport', 'Théâtre', 'Gala', 'Workshop', 'Culture', 'Business', 'Activité culturelle', 'Activité religieuse', "Activité d'Évangélisation"];
const VILLES = ['Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 'Touba', 'Mbour'];

const SYSTEM_PROMPT = `Tu es un expert en extraction d'informations événementielles à partir de textes OCR issus de flyers, affiches et documents.
Ta mission : analyser le texte brut extrait et produire UNIQUEMENT un objet JSON structuré avec les champs suivants (null si non trouvé) :
- titre : string — le titre principal de l'événement
- description : string — une courte description de l'événement (max 2 phrases)
- date : string au format YYYY-MM-DD — la date de l'événement
- heure : string au format HH:MM — l'heure de début
- ville : string — la ville (parmi : Dakar, Thiès, Saint-Louis, Kaolack, Ziguinchor, Touba, Mbour)
- lieu : string — le lieu précis (salle, stade, adresse...)
- categorie : string — la catégorie (parmi : Concert, Festival, Conférence, Sport, Théâtre, Gala, Workshop, Culture, Business, Activité culturelle, Activité religieuse, Activité d'Évangélisation)
- prix : number|null — le prix du billet standard en FCFA (null si gratuit ou non mentionné)
- gratuit : boolean — true si l'événement est gratuit
- artistes_ou_invites : string[] — liste des artistes, speakers, invités mentionnés
- contact : string|null — numéro WhatsApp ou téléphone de contact

RÈGLES STRICTES :
1. Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaires.
2. Si une information n'est pas trouvée, mets null (ou false pour gratuit).
3. Pour la date : convertis en YYYY-MM-DD. Si l'année est absente, suppose 2026. Si le mois est écrit en lettres (français), convertis-le.
4. Pour l'heure : normalise en HH:MM (24h). Si "à partir de 20h", mets 20:00.
5. Pour la ville : choisis la ville la plus proche parmi la liste fournie.
6. Pour le prix : extrais uniquement le nombre, ignore "FCFA", "francs", etc. Si plusieurs prix, prends le plus bas (standard).`;

export default function FlyerExtractor({ onExtracted, onOcrText, onClose }) {
  const [step, setStep] = useState('idle'); // idle | ocr | ai | done | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setPreview(URL.createObjectURL(file));
    setStep('ocr');
    setProgress(10);

    try {
      const worker = await createWorker('fra');
      setProgress(30);
      const result = await worker.recognize(file);
      setProgress(60);
      await worker.terminate();

      const rawText = result.data.text;
      if (onOcrText) onOcrText(rawText);
      if (!rawText || rawText.trim().length < 10) {
        setError('Peu de texte détecté sur l\'image. Essayez une image plus nette ou un document PDF.');
        setStep('error');
        return;
      }

      setStep('ai');
      setProgress(70);

      const extracted = await callGroqJSON([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Texte OCR extrait du flyer/affiche :\n\n---\n${rawText}\n---\n\nExtrais les informations structurées en JSON.` }
      ], { temperature: 0.1, maxTokens: 1200 });

      setProgress(100);

      if (!extracted || typeof extracted !== 'object') {
        setError('L\'IA n\'a pas réussi à structurer les données. Réessayez ou remplissez manuellement.');
        setStep('error');
        return;
      }

      const data = normalizeExtracted(extracted);
      onExtracted(data);
      setStep('done');
    } catch (err) {
      console.error('FlyerExtractor error:', err);
      setError(err.message || 'Erreur lors de l\'extraction.');
      setStep('error');
    }
  }

  function normalizeExtracted(raw) {
    const data = { ...raw };
    // Map categorie to known list
    const catMatch = CATEGORIES.find(c =>
      c.toLowerCase() === String(data.categorie || '').toLowerCase() ||
      String(data.categorie || '').toLowerCase().includes(c.toLowerCase())
    );
    if (catMatch) data.categorie = catMatch;
    else if (!data.categorie) data.categorie = 'Culture';

    // Map ville to known list
    const villeMatch = VILLES.find(v =>
      v.toLowerCase() === String(data.ville || '').toLowerCase() ||
      String(data.ville || '').toLowerCase().includes(v.toLowerCase())
    );
    if (villeMatch) data.ville = villeMatch;
    else if (!data.ville) data.ville = 'Dakar';

    // Ensure description is not too long
    if (data.description && data.description.length > 500) {
      data.description = data.description.slice(0, 500) + '…';
    }

    return data;
  }

  function reset() {
    setStep('idle');
    setProgress(0);
    setError('');
    setPreview('');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="stk-extractor">
      <div className="stk-extractor__header">
        <div className="stk-extractor__header-text">
          <div className="stk-extractor__title">📄 Extraction automatique depuis un flyer</div>
          <div className="stk-extractor__subtitle">Téléchargez une affiche, un flyer ou un document — l'IA extraira les infos.</div>
        </div>
        {onClose && (
          <button className="stk-extractor__close" onClick={onClose}>✕</button>
        )}
      </div>

      {step === 'idle' && (
        <>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          <button className="stk-extractor__upload-btn" type="button" onClick={() => fileRef.current?.click()}>
            📤 Cliquez pour choisir une image
          </button>
        </>
      )}

      {(step === 'ocr' || step === 'ai') && (
        <div className="stk-extractor__progress">
          {preview && (
            <img src={preview} alt="Aperçu" className="stk-extractor__preview-img" />
          )}
          <div className="stk-extractor__progress-label">
            {step === 'ocr' ? '🔍 Lecture du texte sur l\'image…' : '🤖 Analyse IA des informations…'}
          </div>
          <div className="stk-extractor__progress-bar">
            <div className="stk-extractor__progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="stk-extractor__result">
          <div className="stk-extractor__result-icon">✅</div>
          <div className="stk-extractor__result-title">Informations extraites avec succès !</div>
          <div className="stk-extractor__result-sub">Les champs du formulaire ont été pré-remplis. Vérifiez et complétez si besoin.</div>
          <button type="button" className="stk-extractor__retry-btn" onClick={reset}>
            🔄 Extraire un autre flyer
          </button>
        </div>
      )}

      {step === 'error' && (
        <div className="stk-extractor__error">
          <div className="stk-extractor__error-icon">⚠️</div>
          <div className="stk-extractor__error-text">{error}</div>
          <button type="button" className="stk-extractor__retry-btn" onClick={reset}>
            🔄 Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
