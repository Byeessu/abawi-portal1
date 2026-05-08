import { TIPS } from '../../data/cv';
import Tooltip from './Tooltip';

export default function Education({ formations, setFormations }) {
  const addForm = () => setFormations([...formations, { diplome: '', ecole: '', ville: '', annee: '' }]);
  const updForm = (i, k, v) => { const n = [...formations]; n[i][k] = v; setFormations(n); };

  return (
    <>
      <h2 className="cv-section-title">Formation</h2>
      {formations.map((f, i) => (
        <div key={i} className="cv-block">
          <div className="cv-row">
            <div className="cv-field-wrap">
              <input className="cv-input" placeholder="Diplôme" value={f.diplome} onChange={(e) => updForm(i, 'diplome', e.target.value)} />
              <Tooltip text={TIPS.diplome} />
            </div>
            <div className="cv-field-wrap">
              <input className="cv-input" placeholder="Établissement" value={f.ecole} onChange={(e) => updForm(i, 'ecole', e.target.value)} />
              <Tooltip text={TIPS.ecole} />
            </div>
          </div>
          <div className="cv-row">
            <input className="cv-input" placeholder="Ville" value={f.ville} onChange={(e) => updForm(i, 'ville', e.target.value)} />
            <input className="cv-input" placeholder="Année" value={f.annee} onChange={(e) => updForm(i, 'annee', e.target.value)} />
          </div>
        </div>
      ))}
      <button className="cv-add-btn" onClick={addForm}>+ Ajouter une formation</button>
    </>
  );
}
