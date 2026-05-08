import { TIPS } from '../../data/cv';
import Tooltip from './Tooltip';

export default function Experience({ exps, setExps, improving, improveDesc }) {
  const addExp = () => setExps([...exps, { poste: '', entreprise: '', ville: '', debut: '', fin: '', enCours: false, desc: '' }]);
  const updExp = (i, k, v) => { const n = [...exps]; n[i][k] = v; setExps(n); };
  const rmExp = (i) => setExps(exps.filter((_, j) => j !== i));

  return (
    <>
      <h2 className="cv-section-title">Expériences professionnelles</h2>
      {exps.map((exp, i) => (
        <div key={i} className="cv-block">
          <div className="cv-row">
            <div className="cv-field-wrap">
              <input className="cv-input" placeholder="Poste" value={exp.poste} onChange={(e) => updExp(i, 'poste', e.target.value)} />
              <Tooltip text={TIPS.poste} />
            </div>
            <div className="cv-field-wrap">
              <input className="cv-input" placeholder="Entreprise" value={exp.entreprise} onChange={(e) => updExp(i, 'entreprise', e.target.value)} />
              <Tooltip text={TIPS.entreprise} />
            </div>
          </div>
          <div className="cv-row">
            <input className="cv-input" placeholder="Début (ex: Jan 2022)" value={exp.debut} onChange={(e) => updExp(i, 'debut', e.target.value)} />
            <input className="cv-input" placeholder="Fin (ou En cours)" value={exp.fin} onChange={(e) => updExp(i, 'fin', e.target.value)} />
          </div>
          <div className="cv-field-wrap">
            <textarea className="cv-textarea" placeholder="Description des missions et résultats..." value={exp.desc} onChange={(e) => updExp(i, 'desc', e.target.value)} />
            <Tooltip text={TIPS.desc} />
          </div>
          <div className="cv-block-btns">
            <button className="cv-ai-btn" onClick={() => improveDesc(i)} disabled={improving}>✨ Améliorer avec l'IA</button>
            <button className="cv-rm-btn" onClick={() => rmExp(i)}>✕</button>
          </div>
        </div>
      ))}
      <button className="cv-add-btn" onClick={addExp}>+ Ajouter une expérience</button>
    </>
  );
}
