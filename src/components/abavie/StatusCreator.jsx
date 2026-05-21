import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { abTalkSettings as abavieSettings } from '../../lib/abTalkSettings';

const BG_COLORS = [
  '#18a84a', '#1e40af', '#dc2626', '#7c3aed', '#ea580c',
  '#0891b2', '#be123c', '#65a30d', '#4338ca', '#991b1b',
  '#451a03', '#083344', '#0f766e', '#a16207', '#9333ea',
];

export default function StatusCreator({ onClose, onPublished }) {
  const { membre } = useAuth();
  const [type, setType] = useState('text');
  const [text, setText] = useState('');
  const [bg, setBg] = useState(BG_COLORS[0]);
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaBase64, setMediaBase64] = useState(null);   // fallback local si Supabase absent
  const [publishing, setPublishing] = useState(false);
  const [fileWarning, setFileWarning] = useState('');
  const fileRef = useRef(null);

  async function publish() {
    if (!membre) return;
    if (type === 'text' && !text.trim()) return;
    if ((type === 'image' || type === 'video') && !media) return;

    setPublishing(true);

    // ── 1. Préparer les métadonnées ──────────────────────────────────────
    const displayName = membre.nom || membre.prenom || membre.email || 'Utilisateur';
    const initials = displayName.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || 'AB';
    const userId = membre.id || `local-${Date.now()}`;

    // ── 2. Résoudre l'URL média (fallback base64 si Supabase absent) ─────
    let mediaUrl = null;
    if (media) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const bucketOk = supabaseUrl && !supabaseUrl.includes('votre-projet') && !supabaseUrl.includes('your-project')
      if (bucketOk) {
        try {
          const safeName = media.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileName = `status_${userId}_${Date.now()}_${safeName}`;
          const { error: uploadError } = await supabase.storage.from('status-media').upload(fileName, media);
          if (!uploadError) {
            const { data } = supabase.storage.from('status-media').getPublicUrl(fileName);
            mediaUrl = data?.publicUrl || null;
          }
        } catch { /* upload failed — fallback ci-dessous */ }
      }
      // Fallback local : base64 pour images ≤ 2 MB, objectURL pour vidéos (session)
      if (!mediaUrl) {
        mediaUrl = mediaBase64 || mediaPreview || null;
      }
    }

    // ── 3. Construire l'objet statut ─────────────────────────────────────
    const statusObj = {
      id: `local-${Date.now()}`,
      user_id: userId,
      user_name: displayName,
      user_initials: initials,
      type,
      content: text.trim() || null,
      color: type === 'text' ? bg : null,
      media_url: mediaUrl,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    // ── 4. Sauvegarder en local EN PREMIER → affichage immédiat ──────────
    try {
      const arr = JSON.parse(localStorage.getItem('abtalk_statuses') || '[]');
      arr.unshift(statusObj);
      localStorage.setItem('abtalk_statuses', JSON.stringify(arr.slice(0, 50)));
    } catch { /* storage plein */ }

    // Notifier la sidebar immédiatement (pas besoin d'attendre Supabase)
    setPublishing(false);
    onPublished?.();
    onClose?.();

    // ── 5. Supabase en arrière-plan (non-bloquant) ────────────────────────
    try {
      const { id: _localId, ...forSupabase } = statusObj; // supprimer id local artificiel
      const { error } = await supabase.from('statuses').insert(forSupabase);
      if (error) console.warn('[StatusCreator] Supabase insert:', error.message);
    } catch (e) {
      console.warn('[StatusCreator] Supabase non disponible (hors-ligne OK):', e.message);
    }
  }

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const maxMB = abavieSettings.get('max_file_size_mb') || 5120;
    if (f.size > maxMB * 1024 * 1024) {
      setFileWarning(`Fichier trop lourd — limite : ${maxMB} Mo`);
      setTimeout(() => setFileWarning(''), 4000);
      e.target.value = '';
      return;
    }
    const isVideo = f.type.startsWith('video');
    setMedia(f);
    setMediaBase64(null);
    const url = URL.createObjectURL(f);
    setMediaPreview(url);
    setType(isVideo ? 'video' : 'image');

    // Fallback local : base64 pour images ≤ 2 MB (video trop lourd pour localStorage)
    if (!isVideo && f.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = ev => setMediaBase64(ev.target.result || null);
      reader.readAsDataURL(f);
    }
  }

  return (
    <div className="abv-status-creator-overlay" onClick={onClose}>
      <div className="abv-status-creator" onClick={e => e.stopPropagation()}>
        <div className="abv-status-creator-header">
          <h3>📢 Publier un statut</h3>
          <button className="abv-icon-btn" onClick={onClose}>✕</button>
        </div>

        {fileWarning && (
          <div className="abv-file-warning" style={{ position: 'relative', top: 0, left: 0, right: 0, margin: '0 16px 10px' }}>
            <span>⚠️</span> {fileWarning}
          </div>
        )}

        {/* Type tabs */}
        <div className="abv-status-creator-tabs">
          <button className={type === 'text' ? 'active' : ''} onClick={() => setType('text')}>✍️ Texte</button>
          <button className={type === 'image' ? 'active' : ''} onClick={() => { setType('image'); fileRef.current?.click(); }}>📷 Photo</button>
          <button className={type === 'video' ? 'active' : ''} onClick={() => { setType('video'); fileRef.current?.click(); }}>🎥 Vidéo</button>
        </div>

        <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFile} />

        {/* Preview */}
        {type === 'text' && (
          <div className="abv-status-preview" style={{ background: bg }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Quoi de neuf ?"
              maxLength={500}
              style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
            />
            <span className="abv-status-char-count">{text.length}/500</span>
          </div>
        )}

        {(type === 'image' || type === 'video') && mediaPreview && (
          <div className="abv-status-preview-media">
            {type === 'image' ? (
              <img src={mediaPreview} alt="preview" />
            ) : (
              <video src={mediaPreview} controls muted />
            )}
            <button className="abv-status-remove-media" onClick={() => { setMedia(null); setMediaPreview(null); }}>✕</button>
          </div>
        )}

        {/* Color picker for text */}
        {type === 'text' && (
          <div className="abv-status-colors">
            {BG_COLORS.map(c => (
              <button
                key={c}
                className={bg === c ? 'active' : ''}
                style={{ background: c }}
                onClick={() => setBg(c)}
              />
            ))}
          </div>
        )}

        {/* Privacy hint */}
        <p className="abv-status-privacy">
          🕐 Votre statut sera visible 24h par vos contacts. {type === 'text' && 'Chiffrement optionnel avec Abavie Pro.'}
        </p>

        {/* Actions */}
        <div className="abv-status-creator-actions">
          <button className="abv-modal-close" onClick={onClose}>Annuler</button>
          <button
            className="abv-btn-primary abv-status-publish-btn"
            onClick={publish}
            disabled={publishing || (type === 'text' && !text.trim()) || ((type === 'image' || type === 'video') && !media)}
          >
            {publishing ? 'Publication...' : '📢 Publier'}
          </button>
        </div>
      </div>
    </div>
  );
}
