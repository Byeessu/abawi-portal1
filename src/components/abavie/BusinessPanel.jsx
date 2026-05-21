import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

const ProductCatalog = lazy(() => import('./ProductCatalog'));
const GoMeetPanel    = lazy(() => import('./GoMeetPanel'));

const QUICK_LINKS = [
  { path: '/outils/facture', label: 'Facture', icon: '🧾' },
  { path: '/outils/business-plan', label: 'Business Plan', icon: '📊' },
  { path: '/outils/cv', label: 'CV', icon: '📄' },
  { path: '/outils/photo-studio-pro', label: 'Studio Photo', icon: '📸' },
  { path: '/business', label: 'Business Pro', icon: '💼' },
];

const PRO_STATUS = [
  { id: 'available',  label: 'Disponible',      emoji: '🟢', color: '#22c55e' },
  { id: 'meeting',    label: 'En réunion',      emoji: '🔴', color: '#ef4444' },
  { id: 'away',       label: 'En déplacement',  emoji: '🟡', color: '#eab308' },
  { id: 'dnd',        label: 'Ne pas déranger', emoji: '🔕', color: '#94a3b8' },
];

const TEMPLATES = [
  { id: 't1', label: 'Je suis en réunion, je vous rappelle.', icon: '📞' },
  { id: 't2', label: 'Appelons-nous à 14h ?', icon: '📅' },
  { id: 't3', label: 'Document envoyé, merci de vérifier.', icon: '📎' },
  { id: 't4', label: 'Paiement reçu, facture en cours.', icon: '💳' },
  { id: 't5', label: 'Disponible pour un brief maintenant.', icon: '✅' },
  { id: 't6', label: 'Je reviens vers vous d\'ici 30 min.', icon: '⏱️' },
];

const TABS = [
  { id: 'dashboard', label: 'Tableau',     emoji: '📊' },
  { id: 'catalog',   label: 'Catalogue',   emoji: '📦' },
  { id: 'gomeet',    label: 'Go Meet',     emoji: '🎥' },
];

export default function BusinessPanel({ onInsertTemplate }) {
  const [tab, setTab] = useState('dashboard');

  const [proStatus, setProStatus] = useState(() => {
    try { return localStorage.getItem('abtalk_pro_status') || 'available' } catch { return 'available' }
  });
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abtalk_tasks') || '[]') } catch { return [] }
  });
  const [newTask, setNewTask] = useState('');
  const [reminders, setReminders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abtalk_reminders') || '[]') } catch { return [] }
  });
  const [newReminder, setNewReminder] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  useEffect(() => {
    localStorage.setItem('abtalk_pro_status', proStatus);
  }, [proStatus]);
  useEffect(() => {
    localStorage.setItem('abtalk_tasks', JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem('abtalk_reminders', JSON.stringify(reminders));
  }, [reminders]);

  function addTask() {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: newTask.trim(), done: false }]);
    setNewTask('');
  }
  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }
  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }
  function addReminder() {
    if (!newReminder.trim() || !reminderTime) return;
    setReminders(prev => [...prev, { id: Date.now(), text: newReminder.trim(), time: reminderTime }].sort((a, b) => new Date(a.time) - new Date(b.time)));
    setNewReminder(''); setReminderTime('');
  }
  function deleteReminder(id) {
    setReminders(prev => prev.filter(r => r.id !== id));
  }
  function copyTemplate(text) {
    navigator.clipboard?.writeText(text);
    window.dispatchEvent(new CustomEvent('abtalk-insert-template', { detail: text }));
  }

  const activeStatus = PRO_STATUS.find(s => s.id === proStatus);

  return (
    <div className="abv-business-panel">
      {/* Tabs */}
      <div className="abv-biz-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`abv-biz-tab${tab === t.id ? ' is-active' : ''}`} onClick={() => setTab(t.id)}>
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <>
          {/* Pro Status */}
          <div className="abv-biz-section">
            <div className="abv-biz-label">Statut pro</div>
            <div className="abv-biz-status-row">
              {activeStatus && (
                <span className="abv-biz-current-status" style={{ color: activeStatus.color }}>
                  {activeStatus.emoji} {activeStatus.label}
                </span>
              )}
            </div>
            <div className="abv-biz-status-choices">
              {PRO_STATUS.map(s => (
                <button key={s.id} className={`abv-biz-status-btn${proStatus === s.id ? ' is-active' : ''}`} onClick={() => setProStatus(s.id)} style={{ '--status-color': s.color }}>
                  {s.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="abv-biz-section">
            <div className="abv-biz-label">Tâches rapides</div>
            <div className="abv-biz-task-input">
              <input type="text" placeholder="Nouvelle tâche…" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
              <button onClick={addTask}>+</button>
            </div>
            <div className="abv-biz-task-list">
              {tasks.map(t => (
                <div key={t.id} className={`abv-biz-task${t.done ? ' is-done' : ''}`}>
                  <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                  <span>{t.text}</span>
                  <button onClick={() => deleteTask(t.id)} title="Supprimer">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div className="abv-biz-section">
            <div className="abv-biz-label">Réponses rapides</div>
            <div className="abv-biz-templates">
              {TEMPLATES.map(t => (
                <button key={t.id} className="abv-biz-template" onClick={() => copyTemplate(t.label)}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div className="abv-biz-section">
            <div className="abv-biz-label">Rappels</div>
            <div className="abv-biz-reminder-input">
              <input type="text" placeholder="Titre du rappel…" value={newReminder} onChange={e => setNewReminder(e.target.value)} />
              <input type="datetime-local" value={reminderTime} onChange={e => setReminderTime(e.target.value)} />
              <button onClick={addReminder}>+</button>
            </div>
            <div className="abv-biz-reminder-list">
              {reminders.map(r => (
                <div key={r.id} className="abv-biz-reminder">
                  <span>{new Date(r.time).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} — {r.text}</span>
                  <button onClick={() => deleteReminder(r.id)}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="abv-biz-section">
            <div className="abv-biz-label">Outils ABAWI</div>
            <div className="abv-biz-links">
              {QUICK_LINKS.map(l => (
                <Link key={l.path} to={l.path} className="abv-biz-link">
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── CATALOGUE ── */}
      {tab === 'catalog' && (
        <Suspense fallback={<div className="abv-biz-loading">Chargement du catalogue…</div>}>
          <ProductCatalog />
        </Suspense>
      )}

      {/* ── GO MEET ── */}
      {tab === 'gomeet' && (
        <Suspense fallback={<div className="abv-biz-loading">Chargement Go Meet…</div>}>
          <GoMeetPanel />
        </Suspense>
      )}
    </div>
  );
}
