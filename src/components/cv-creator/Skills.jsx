import { useState } from 'react';
import { TIPS } from '../../data/cv';
import Tooltip from './Tooltip';

export default function Skills({ skills, setSkills, improving, suggestSkills }) {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, { name: newSkill.trim(), level: 'Intermédiaire' }]);
      setNewSkill('');
    }
  };

  const updSkillLevel = (i, l) => { const n = [...skills]; n[i].level = l; setSkills(n); };
  const rmSkill = (i) => setSkills(skills.filter((_, j) => j !== i));

  return (
    <>
      <h2 className="cv-section-title">Compétences</h2>
      <div className="cv-row">
        <div className="cv-field-wrap">
          <input className="cv-input" placeholder="Ajouter une compétence" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSkill()} />
          <Tooltip text={TIPS.skill} />
        </div>
        <button className="cv-add-btn" onClick={addSkill}>+</button>
      </div>
      <div className="cv-skills">
        {skills.map((s, i) => (
          <div key={i} className="cv-skill-chip">
            <span>{s.name}</span>
            <select value={s.level} onChange={(e) => updSkillLevel(i, e.target.value)}>
              <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option><option>Expert</option>
            </select>
            <button onClick={() => rmSkill(i)}>✕</button>
          </div>
        ))}
      </div>
      <button className="cv-ai-btn" onClick={suggestSkills} disabled={improving}>✨ Suggérer des compétences</button>
    </>
  );
}
