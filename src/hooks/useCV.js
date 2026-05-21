import { useState, useEffect } from 'react';

const CV_SAVE_KEY = 'abawi-cv-save-30j';
const CV_SAVE_DURATION = 30 * 24 * 60 * 60 * 1000;

function saveCV30Days(data) {
  try { localStorage.setItem(CV_SAVE_KEY, JSON.stringify({ data, savedAt: Date.now() })); } catch { /* ignore */ }
}

function loadCV30Days() {
  try {
    const raw = localStorage.getItem(CV_SAVE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CV_SAVE_DURATION) { localStorage.removeItem(CV_SAVE_KEY); return null; }
    return data;
  } catch { return null; }
}

export function useCV() {
  const [info, setInfo] = useState({ prenom: '', nom: '', email: '', tel: '+221', ville: 'Dakar', pays: 'Sénégal', titre: '', resume: '' });
  const [photo, setPhoto] = useState(null);
  const [exps, setExps] = useState([]);
  const [formations, setFormations] = useState([]);
  const [skills, setSkills] = useState([]);
  const [langues, setLangues] = useState([{ langue: 'Français', niveau: 'Natif' }]);
  const [theme, setTheme] = useState('moderne');
  const [savedBanner, setSavedBanner] = useState(null);

  useEffect(() => {
    const saved30 = loadCV30Days();
    if (saved30) {
      Promise.resolve().then(() => setSavedBanner({ from: '30j', at: saved30.savedAt }));
      const d = saved30;
      if (d.info) Promise.resolve().then(() => setInfo(d.info));
      if (d.photo) Promise.resolve().then(() => setPhoto(d.photo));
      if (d.exps) Promise.resolve().then(() => setExps(d.exps));
      if (d.formations) Promise.resolve().then(() => setFormations(d.formations));
      if (d.skills) Promise.resolve().then(() => setSkills(d.skills));
      if (d.langues) Promise.resolve().then(() => setLangues(d.langues));
      if (d.theme) Promise.resolve().then(() => setTheme(d.theme));
    }
  }, []);

  const handleSave30Days = () => {
    const data = { info, photo, exps, formations, skills, langues, theme, savedAt: Date.now() };
    saveCV30Days(data);
  };

  return {
    info, setInfo,
    photo, setPhoto,
    exps, setExps,
    formations, setFormations,
    skills, setSkills,
    langues, setLangues,
    theme, setTheme,
    savedBanner, setSavedBanner,
    handleSave30Days,
  };
}
