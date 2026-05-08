import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { abavieSettings } from '../../lib/abavieSettings';

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
  const [publishing, setPublishing] = useState(false);
  const [fileWarning, setFileWarning] = useState('');
  const fileRef = useRef(null);

  async function publish() {
    if (!membre) return;
    if (type === 'text' && !text.trim()) return;
    if ((type === 'image' || type === 'video') && !media) return;

    setPublishing(true);
    let mediaUrl = null;

    // Build status object (defined early for catch-block fallback)
    const displayName = membre.nom || membre.prenom || membre.email || 'Utilisateur';
    const initials = displayName.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || 'AB';
    const statusObj = {
      user_id: membre.id || 'local',
      user_name: displayName,
      user_initials: initials,
      type,
      content: text.trim() || null,
      color: type === 'text' ? bg : null,
      media_url: null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    function saveLocal(obj) {
      try {
        const key = 'abavie_statuses';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.unshift({ ...obj, id: `local-${Date.now()}` });
        localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)));
      } catch { /* storage full — ignore */ }
    }

    try {
      // Upload media if any
      if (media) {
        try {
          const safeName = media.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileName = `status_${membre.id}_${Date.now()}_${safeName}`;
          const { error: uploadError } = await supabase.storage.from('status-media').upload(fileName, media);
          if (!uploadError) {
            const { data } = supabase.storage.from('status-media').getPublicUrl(fileName);
            mediaUrl = data?.publicUrl || null;
          }
        } catch { /* media upload failed — continue without */ }
      }
      statusObj.media_url = mediaUrl;

      // Try Supabase insert
      const { error } = await supabase.from('statuses').insert(statusObj);
      // Always save locally too (backup / offline)
      saveLocal(statusObj);
      if (error) console.warn('[StatusCreator] Supabase insert:', error.message);
    } catch (e) {
      console.error('[StatusCreator] publish exception:', e);
      // Last-resort localStorage save so the status isn't lost
      saveLocal(statusObj);
    } finally {
      setPublishing(false);
      // Always notify parent — status is either in Supabase or localStorage
      onPublished?.();
      onClose?.();
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
    setMedia(f);
    const url = URL.createObjectURL(f);
    setMediaPreview(url);
    setType(f.type.startsWith('video') ? 'video' : 'image');
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
