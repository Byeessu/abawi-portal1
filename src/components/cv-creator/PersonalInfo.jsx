import { TIPS } from '../../data/cv';
import Tooltip from './Tooltip';

export default function PersonalInfo({ info, setInfo, photo, setPhoto, photoInputRef }) {
  const upd = (k, v) => setInfo((p) => ({ ...p, [k]: v }));

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <>
      <h2 className="cv-section-title">Informations personnelles</h2>
      <div className="cv-photo-upload">
        <div className="cv-photo-preview" onClick={() => photoInputRef.current?.click()}>
          {photo
            ? <img src={photo} alt="Photo profil" />
            : <span>📷 Ajouter une photo <Tooltip text={TIPS.photo} /></span>
          }
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        {photo && <button className="cv-rm-btn" onClick={() => setPhoto(null)}>✕ Supprimer</button>}
      </div>
      <div className="cv-row">
        <div className="cv-field-wrap">
          <input className="cv-input" placeholder="Prénom" value={info.prenom} onChange={(e) => upd('prenom', e.target.value)} />
          <Tooltip text={TIPS.prenom} />
        </div>
        <div className="cv-field-wrap">
          <input className="cv-input" placeholder="Nom" value={info.nom} onChange={(e) => upd('nom', e.target.value)} />
          <Tooltip text={TIPS.nom} />
        </div>
      </div>
      <div className="cv-row">
        <div className="cv-field-wrap">
          <input className="cv-input" placeholder="Email" value={info.email} onChange={(e) => upd('email', e.target.value)} />
          <Tooltip text={TIPS.email} />
        </div>
        <div className="cv-field-wrap">
          <input className="cv-input" placeholder="Téléphone" value={info.tel} onChange={(e) => upd('tel', e.target.value)} />
          <Tooltip text={TIPS.tel} />
        </div>
      </div>
      <div className="cv-row">
        <div className="cv-field-wrap">
          <input className="cv-input" placeholder="Ville" value={info.ville} onChange={(e) => upd('ville', e.target.value)} />
          <Tooltip text={TIPS.ville} />
        </div>
        <input className="cv-input" placeholder="Pays" value={info.pays} onChange={(e) => upd('pays', e.target.value)} />
      </div>
      <div className="cv-field-wrap">
        <input className="cv-input" placeholder="Titre professionnel (ex: Développeur Web Senior)" value={info.titre} onChange={(e) => upd('titre', e.target.value)} />
        <Tooltip text={TIPS.titre} />
      </div>
      <div className="cv-field-wrap">
        <textarea className="cv-textarea" placeholder="Résumé professionnel — 3-4 lignes qui résument votre profil" value={info.resume} onChange={(e) => upd('resume', e.target.value)} />
        <Tooltip text={TIPS.resume} />
      </div>
    </>
  );
}
