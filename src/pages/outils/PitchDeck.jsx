import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { callGroq } from '../../lib/groqClient';
import { useDraftAutoSave } from '../../hooks/useDraftAutoSave';
import { exportToPDF } from '../../lib/generatePDF';
import SEO from '../../components/SEO';
import ToolInfoPanel from '../../components/ToolInfoPanel';
import FileContextUpload from '../../components/FileContextUpload';

const PITCH_THEMES = [
  { grad: 'linear-gradient(135deg, #0F172A, #1E3A5F)', accent: '#38BDF8', icon: '🚀' },
  { grad: 'linear-gradient(135deg, #1A1A2E, #16213E)', accent: '#E94560', icon: '🎯' },
  { grad: 'linear-gradient(135deg, #0D1B2A, #1B263B)', accent: '#F0B429', icon: '💡' },
  { grad: 'linear-gradient(135deg, #1B1B2F, #2D2D44)', accent: '#A78BFA', icon: '📈' },
  { grad: 'linear-gradient(135deg, #0C1E2E, #1C3A4F)', accent: '#22C55E', icon: '🌍' },
  { grad: 'linear-gradient(135deg, #1E1E2E, #2E2E3E)', accent: '#FB923C', icon: '⚙️' },
  { grad: 'linear-gradient(135deg, #0A1628, #1A2B4A)', accent: '#60A5FA', icon: '💰' },
  { grad: 'linear-gradient(135deg, #1A1A1A, #2D2D2D)', accent: '#F472B6', icon: '👥' },
  { grad: 'linear-gradient(135deg, #0F2027, #203A43)', accent: '#34D399', icon: '📅' },
  { grad: 'linear-gradient(135deg, #1B1B1B, #2C2C2C)', accent: '#FBBF24', icon: '🤝' },
];

function PitchSlideCard({ slide, index, total, compact }) {
  const t = slide.theme || PITCH_THEMES[0];
  return (
    <div style={{
      background: t.grad,
      borderRadius: compact ? 12 : 16,
      padding: compact ? '20px 24px' : '36px 44px',
      minHeight: compact ? 180 : 420,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      border: `1px solid ${t.accent}30`,
      boxShadow: `0 8px 32px ${t.accent}15`,
    }}>
      <div style={{ position: 'absolute', top: 14, right: 18, fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
      <div style={{ fontSize: compact ? '1.1rem' : '1.7rem', fontWeight: 800, color: 'white', marginBottom: compact ? 6 : 12, lineHeight: 1.25 }}>
        {slide.title}
      </div>
      {slide.subtitle && (
        <div style={{ fontSize: compact ? '0.78rem' : '1rem', color: t.accent, fontWeight: 700, marginBottom: compact ? 8 : 14 }}>
          {slide.subtitle}
        </div>
      )}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: compact ? 4 : 8 }}>
        {(slide.bullets || []).map((b, i) => (
          <li key={i} style={{ fontSize: compact ? '0.75rem' : '0.92rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, paddingLeft: 14, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: t.accent }}>◆</span>
            {b}
          </li>
        ))}
      </ul>
      {slide.highlight && (
        <div style={{ marginTop: 'auto', paddingTop: compact ? 10 : 18 }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', background: `${t.accent}20`, border: `1px solid ${t.accent}50`, borderRadius: 20, color: t.accent, fontSize: compact ? '0.75rem' : '0.88rem', fontWeight: 800 }}>
            ★ {slide.highlight}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PitchDeck() {
  const { membre } = useAuth();
  const [form, setForm] = useState({ projet: '', secteur: '', pays: 'Sénégal', marche: '', valeur: '', traction: '', besoin: '', montant: '', equipe: '' });
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [err, setErr] = useState('');
  const [uploadedContext, setUploadedContext] = useState('');
  const [showAll, setShowAll] = useState(false);

  const { lastSavedAt, clearDraft } = useDraftAutoSave(
    'abawi-pitchdeck-draft',
    { form, slides },
    { onRestore: (d) => { if (d?.form) setForm(d.form); if (d?.slides?.length) setSlides(d.slides) } }
  );

  function patch(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  const generate = async () => {
    const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
    if (!GROQ_KEY) { alert('VITE_GROQ_API_KEY manquant'); return; }
    setErr(''); setLoading(true);
    try {
      const ctx2 = uploadedContext ? `\n\nDocuments fournis:\n${uploadedContext.slice(0, 6000)}\n` : '';
      const raw = await callGroq(`Tu es un associé senior dans un fonds VC tier-1 (Sequoia, Y Combinator, Africa-focused). Génère EXACTEMENT 10 slides de pitch deck investisseur professionnel en français pour "${form.projet || 'une startup innovante'}" dans le secteur "${form.secteur || 'digital / tech'}" opérant au "${form.pays || 'Sénégal / Afrique\' de l\'Ouest'}".

DONNÉES DU PORTEUR:
- Marché visé: ${form.marche || 'à contextualiser selon le secteur'}
- Proposition de valeur: ${form.valeur || 'à formuler'}
- Traction / preuves: ${form.traction || 'phase initiale'}
- Besoin: ${form.besoin || 'financement & partenariats'} — Montant: ${form.montant || 'à préciser'}
- Équipe: ${form.equipe || 'fondateurs passionnés et experts'}
${ctx2}

ORDRE DES 10 SLIDES (STRICT, NE PAS MODIFIER):
1. COUVERTURE — tagline impactante ≤12 mots, secteur, pays, mission 1 phrase
2. LE PROBLÈME — 4 points douloureux mesurables, données marché africain
3. NOTRE SOLUTION — réponse précise, différentiel vs. concurrents, pourquoi maintenant
4. TAILLE DU MARCHÉ — TAM/SAM/SOM chiffrés réalistes (BCEAO, IFC, World Bank)
5. PRODUIT & EXPÉRIENCE — fonctionnalités clés, UX, tech différenciatrice
6. MODÈLE ÉCONOMIQUE — sources revenus, pricing, unit economics, LTV/CAC
7. TRACTION & MÉTRIQUES — chiffres clients, revenus, partenaires, KPIs prouvés
8. ÉQUIPE & GOUVERNANCE — fondateurs, advisors, pourquoi eux, track record
9. ROADMAP & JALONS — milestones N+6/N+12/N+24 mois, go-to-market
10. L'APPEL À L'INVESTISSEUR — montant, use of funds %, valorisation, retour attendu

Règles:
- Données et chiffres contextualisés Afrique de l'Ouest / UEMOA
- Chiffres cohérents entre slides et réalistes pour le marché
- Ton VC-grade, sans généralités
- highlight = le KPI / chiffre le plus percutant de chaque slide

Réponds UNIQUEMENT avec un tableau JSON valide de 10 objets:
[{"title":"≤55 car","subtitle":"sous-titre chiffré ≤90 car","bullets":["point précis chiffré","point 2","point 3","point 4"],"highlight":"stat / KPI clé"}]`, 5000);
      const match = raw.match(/\[[\s\S]*\]/);
      const parsed = match ? JSON.parse(match[0]) : [];
      if (!Array.isArray(parsed) || !parsed.length) { setErr('Réponse IA illisible — réessayez.'); return; }
      const enriched = parsed.slice(0, 10).map((s, i) => ({
        title: String(s?.title || `Slide ${i+1}`),
        subtitle: String(s?.subtitle || ''),
        bullets: Array.isArray(s?.bullets) ? s.bullets.slice(0, 5).map(b => String(b)) : [],
        highlight: String(s?.highlight || ''),
        theme: PITCH_THEMES[i] || PITCH_THEMES[0],
      }));
      setSlides(enriched); setActiveSlide(0); setShowAll(false);
    } catch(e) {
      setErr('Erreur: ' + (e?.message || 'réessayez'));
    } finally {
      setLoading(false);
    }
  };

  const active = slides[activeSlide];
  const fileSlug = `pitch-deck-${form.projet?.toLowerCase().replace(/\s+/g, '-') || 'abawi'}`;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', color: 'var(--text-primary)' }}>
      <SEO title="Pitch Deck Pro IA" description="Générez un pitch deck investisseur de niveau VC avec IA." />
      <ToolInfoPanel toolName="Pitch Deck" icon="🎯" description="Générez un pitch deck investisseur de niveau VC" benefits={[]} howToUse={[]} tips={[]} />

      <div className="cv-form">
        <span className="cv-section-title">🚀 Votre projet</span>
        <input className="cv-input" value={form.projet} onChange={e=>patch('projet',e.target.value)} placeholder="Nom du projet / startup" />
        <div className="cv-row">
          <input className="cv-input" value={form.secteur} onChange={e=>patch('secteur',e.target.value)} placeholder="Secteur (Fintech, Agri, Santé…)" />
          <input className="cv-input" value={form.pays} onChange={e=>patch('pays',e.target.value)} placeholder="Pays / région" />
        </div>

        <span className="cv-section-title">📊 Marché & valeur</span>
        <textarea className="cv-textarea" rows={2} value={form.marche} onChange={e=>patch('marche',e.target.value)} placeholder="Marché cible, segment client, taille estimée" />
        <textarea className="cv-textarea" rows={2} value={form.valeur} onChange={e=>patch('valeur',e.target.value)} placeholder="Proposition de valeur — problème → votre solution unique" />

        <span className="cv-section-title">📈 Traction & financement</span>
        <textarea className="cv-textarea" rows={2} value={form.traction} onChange={e=>patch('traction',e.target.value)} placeholder="Chiffres traction : clients, CA, pilotes, partenaires signés" />
        <div className="cv-row">
          <input className="cv-input" value={form.besoin} onChange={e=>patch('besoin',e.target.value)} placeholder="Type de besoin (levée, dette…)" />
          <input className="cv-input" value={form.montant} onChange={e=>patch('montant',e.target.value)} placeholder="Montant (ex: 200M XOF)" />
        </div>
        <textarea className="cv-textarea" rows={2} value={form.equipe} onChange={e=>patch('equipe',e.target.value)} placeholder="Équipe : rôles, background, atouts différenciateurs" />

        <FileContextUpload onExtracted={setUploadedContext} label="Documents de référence (optionnel)" hint="BP, études de marché, comptes — l'IA utilise vos vrais chiffres" />

        <div className="cv-block-btns" style={{ marginTop:16 }}>
          <button type="button" className="cv-ai-btn" onClick={generate} disabled={loading}>
            {loading ? '⚡ Génération en cours…' : '✨ Générer mon Pitch Deck'}
          </button>
          {slides.length > 0 && (
            <>
              <button type="button" className="cv-add-btn" onClick={() => { setShowAll(true); setTimeout(() => exportToPDF('pitch-deck-export', fileSlug, { includeHeader:false, includeFooter:false }).then(() => setShowAll(false)), 200) }}>
                📥 PDF
              </button>
              <button type="button" className="cv-add-btn" onClick={() => setShowAll(v=>!v)}>
                {showAll ? '🔎 Slide active' : '🗂 Voir tout'}
              </button>
            </>
          )}
        </div>
        {err && <p style={{ color:'#f87171', fontSize:'0.85rem', margin:0 }}>{err}</p>}

        {slides.length > 0 && !showAll && (
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:700, marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>Naviguer entre les slides</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
              {slides.map((s, i) => (
                <button key={i} onClick={()=>setActiveSlide(i)} style={{
                  padding:'8px 4px', borderRadius:8,
                  border:`2px solid ${activeSlide===i ? s.theme.accent : 'var(--border)'}`,
                  background: activeSlide===i ? `${s.theme.accent}18` : 'var(--bg-card)',
                  cursor:'pointer', textAlign:'center', transition:'all 0.2s',
                }}>
                  <div style={{ fontSize:14, marginBottom:2 }}>{s.theme.icon}</div>
                  <div style={{ fontSize:'0.55rem', color:activeSlide===i ? s.theme.accent : 'var(--text-muted)', fontWeight:700 }}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="cv-preview-wrap">
        {!slides.length ? (
          <div className="cv-preview" style={{ minHeight:420, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, textAlign:'center', background:'linear-gradient(135deg,#0F172A,#1E3A5F)', borderRadius:16 }}>
            <div style={{ fontSize:56, opacity:0.25 }}>🎯</div>
            <div style={{ fontSize:'0.88rem', color:'rgba(255,255,255,0.4)', maxWidth:240, lineHeight:1.5 }}>
              Complétez le formulaire et cliquez sur<br/><strong style={{ color:'rgba(255,255,255,0.6)' }}>"Générer mon Pitch Deck"</strong>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
              {PITCH_THEMES.map((t,i) => (
                <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:t.grad, border:`1px solid ${t.accent}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>{t.icon}</div>
              ))}
            </div>
          </div>
        ) : showAll ? (
          <div id="pitch-deck-export" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {slides.map((s, i) => <PitchSlideCard key={i} slide={s} index={i} total={slides.length} compact={true} />)}
          </div>
        ) : (
          <>
            <div id="pitch-deck-export">
              {active && <PitchSlideCard slide={active} index={activeSlide} total={slides.length} />}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginTop:14 }}>
              <button onClick={()=>setActiveSlide(i=>Math.max(0,i-1))} disabled={activeSlide===0} style={{
                padding:'9px 22px', borderRadius:8, border:'1px solid var(--border)',
                background:'var(--bg-card)', color:'var(--text-primary)', cursor:'pointer', fontSize:'0.82rem', fontWeight:700,
                opacity:activeSlide===0?0.35:1, transition:'opacity 0.2s',
              }}>← Précédente</button>
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600 }}>
                {activeSlide+1} / {slides.length}
              </span>
              <button onClick={()=>setActiveSlide(i=>Math.min(slides.length-1,i+1))} disabled={activeSlide===slides.length-1} style={{
                padding:'9px 22px', borderRadius:8, border:'1px solid var(--border)',
                background:'var(--bg-card)', color:'var(--text-primary)', cursor:'pointer', fontSize:'0.82rem', fontWeight:700,
                opacity:activeSlide===slides.length-1?0.35:1, transition:'opacity 0.2s',
              }}>Suivante →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
