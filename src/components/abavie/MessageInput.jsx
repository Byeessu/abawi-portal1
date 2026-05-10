import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { abavieSettings } from '../../lib/abavieSettings';

const EMOJIS = ['😀','😂','🥰','😎','🤔','👍','❤️','🔥','🎉','👏','😮','😢','🙏','🚀','💡','⚡','🎵','📎','🤝','✅'];

export default function MessageInput({ onSend, replyTo, editMessage, onCancelReply, onCancelEdit, scheduledSend, disappearingTimer }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [formatMode, setFormatMode] = useState(false);
  const [fileWarning, setFileWarning] = useState('');
  const fileRef = useRef(null);
  const textareaRef = useRef(null);
  const recordingInterval = useRef(null);
  const typingTimeout = useRef(null);

  // Pre-fill text when editing
  useEffect(() => {
    if (editMessage?.content) {
      setText(editMessage.content);
      textareaRef.current?.focus();
    }
  }, [editMessage]);

  // Clear text when reply is set
  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);

  async function uploadFile(file) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `abavie/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('messages').upload(path, file);
    setUploading(false);
    if (error) return null;
    return supabase.storage.from('messages').getPublicUrl(path).data.publicUrl;
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const maxMB = abavieSettings.get('max_file_size_mb') || 5120;
    if (file.size > maxMB * 1024 * 1024) {
      setFileWarning(`Fichier trop lourd — limite : ${maxMB} Mo`);
      setTimeout(() => setFileWarning(''), 4000);
      e.target.value = '';
      return;
    }
    const type = file.type.startsWith('image/') ? 'image'
      : file.type.startsWith('video/') ? 'video'
      : file.type.startsWith('audio/') ? 'audio'
      : 'document';
    const url = await uploadFile(file);
    if (url) onSend(file.name, type, url);
    e.target.value = '';
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const opts = {};
    if (scheduledSend) {
      opts.scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1h default
    }
    if (disappearingTimer) {
      opts.expiresAt = new Date(Date.now() + disappearingTimer * 1000).toISOString();
    }
    onSend(trimmed, 'text', null, opts);
    setText('');
    setShowEmoji(false);
    setFormatMode(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function autoResize(e) {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    setText(el.value);

    // Typing indicator simulation
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      // Typing stopped
    }, 2000);
  }

  function insertEmoji(emoji) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + emoji.length;
      el.focus();
    }, 0);
  }

  function wrapSelection(wrap) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end);
    if (!selected) return;
    const newText = text.slice(0, start) + wrap + selected + wrap + text.slice(end);
    setText(newText);
    setTimeout(() => {
      el.selectionStart = start + wrap.length;
      el.selectionEnd = end + wrap.length;
      el.focus();
    }, 0);
  }

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        const secs = recordingTime;
        if (secs > 0) {
          const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
          const url = await uploadFile(file);
          if (url) {
            onSend(formatDuration(secs), 'audio', url, { metadata: { isVoice: true, duration: secs } });
          }
        }
        stream.getTracks().forEach(t => t.stop());
        setRecordingTime(0);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingInterval.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (e) {
      console.error('Mic access denied', e);
      alert('Accès au micro refusé ou indisponible.');
    }
  }

  function stopRecording() {
    setIsRecording(false);
    if (recordingInterval.current) clearInterval(recordingInterval.current);
    mediaRecorderRef.current?.stop();
  }

  async function sendLocation() {
    if (!navigator.geolocation) {
      alert('Géolocalisation non supportée.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onSend('📍 Localisation partagée', 'location', null, { metadata: { lat: latitude, lng: longitude } });
      },
      () => alert('Impossible de récupérer la position.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const formatDuration = formatTime;

  return (
    <div className="abv-input-wrapper">
      {fileWarning && (
        <div className="abv-file-warning">
          <span>⚠️</span> {fileWarning}
        </div>
      )}
      {/* Format toolbar */}
      {formatMode && (
        <div className="abv-format-bar">
          <button onClick={() => wrapSelection('**')} title="Gras"><b>B</b></button>
          <button onClick={() => wrapSelection('*')} title="Italique"><i>I</i></button>
          <button onClick={() => wrapSelection('`')} title="Code"><code>&lt;/&gt;</code></button>
          <button onClick={() => wrapSelection('~~')} title="Barré"><s>S</s></button>
          <button onClick={() => setFormatMode(false)}>✕</button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="abv-emoji-picker">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => insertEmoji(e)}>{e}</button>
          ))}
        </div>
      )}

      <div className="abv-input-bar">
        <input type="file" ref={fileRef} onChange={handleFile} style={{ display: 'none' }} multiple />
        <button className="abv-attach-btn" onClick={() => fileRef.current?.click()} disabled={uploading || isRecording} title="Joindre un fichier">
          {uploading
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          }
        </button>

        <button className="abv-attach-btn" onClick={() => setFormatMode(v => !v)} disabled={isRecording} title="Formatage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
        </button>
        <button className={`abv-attach-btn${scheduledSend ? ' abv-icon-btn--active' : ''}`} onClick={() => {}} disabled={isRecording} title="Programmer (+1h)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>
        <button className="abv-attach-btn" onClick={sendLocation} disabled={isRecording} title="Partager la localisation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </button>

        <div className="abv-input-wrap">
          {isRecording ? (
            <div className="abv-recording-indicator">
              <span className="abv-recording-dot" />
              <span>Enregistrement… {formatTime(recordingTime)}</span>
              <button onClick={stopRecording} className="abv-recording-stop">Arrêter</button>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={autoResize}
              onKeyDown={handleKey}
              placeholder={replyTo ? "Répondre…" : editMessage ? "Modifier le message…" : "Message…"}
              rows={1}
            />
          )}
        </div>

        <button className="abv-attach-btn" onClick={() => setShowEmoji(v => !v)} disabled={isRecording} title="Emoji">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        </button>

        {text.trim() ? (
          <button className="abv-send-btn" onClick={send} aria-label="Envoyer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        ) : (
          <button
            className={`abv-send-btn abv-mic-btn${isRecording ? ' abv-mic-btn--recording' : ''}`}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={isRecording ? stopRecording : undefined}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            aria-label="Message vocal"
            title="Maintenez pour enregistrer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
