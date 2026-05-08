import { NIVEAUX_LANGUE } from '../../data/cv';

export default function Languages({ langues, setLangues }) {
  const addLangue = () => setLangues([...langues, { langue: '', niveau: 'B2' }]);

  return (
    <>
      <h2 className="cv-section-title">Langues</h2>
      {langues.map((l, i) => (
        <div key={i} className="cv-row">
          <input className="cv-input" placeholder="Langue" value={l.langue} onChange={(e) => { const n = [...langues]; n[i].langue = e.target.value; setLangues(n); }} />
          <select className="cv-input" value={l.niveau} onChange={(e) => { const n = [...langues]; n[i].niveau = e.target.value; setLangues(n); }}>
            {NIVEAUX_LANGUE.map((niv) => (
              <option key={niv.value} value={niv.value}>{niv.label}</option>
            ))}
          </select>
        </div>
      ))}
      <button className="cv-add-btn" onClick={addLangue}>+ Ajouter une langue</button>
    </>
  );
}
