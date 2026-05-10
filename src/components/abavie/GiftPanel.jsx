import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function GiftPanel({ recipientId, onClose }) {
  const { membre } = useAuth();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function sendGift() {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Veuillez entrer un montant valide.');
      return;
    }
    if (!recipientId || recipientId === membre?.id) {
      setError('Destinataire invalide.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const { error: dbErr } = await supabase.from('user_gifts').insert({
        sender_id: membre.id,
        recipient_id: recipientId,
        amount: val,
        currency: 'XOF',
        message: message.trim() || null,
        status: 'pending',
      });
      if (dbErr) throw new Error(dbErr.message);
      setSent(true);
      setAmount('');
      setMessage('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="abv-gift-overlay" onClick={onClose}>
      <div className="abv-gift-modal" onClick={e => e.stopPropagation()}>
        <div className="abv-gift-header">
          <h3>🎁 Envoyer un cadeau</h3>
          <button className="abv-icon-btn" onClick={onClose}>✕</button>
        </div>

        {sent ? (
          <div className="abv-gift-sent">
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎉</div>
            <p>Cadeau envoyé avec succès !</p>
            <button className="abv-btn-primary" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <>
            <div className="abv-gift-body">
              <label>Montant (XOF)</label>
              <input
                type="number"
                min="100"
                step="100"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Ex: 5000"
              />
              <label>Message (optionnel)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Un petit mot..."
                rows={3}
              />
              {error && <div className="abv-gift-error">{error}</div>}
            </div>
            <div className="abv-gift-actions">
              <button className="abv-modal-close" onClick={onClose}>Annuler</button>
              <button className="abv-btn-primary" onClick={sendGift} disabled={sending || !amount}>
                {sending ? 'Envoi...' : '🎁 Envoyer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
