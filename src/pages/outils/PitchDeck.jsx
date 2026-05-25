import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { callGroq } from '../../lib/groqClient';
import { useDraftAutoSave } from '../../hooks/useDraftAutoSave';
import { exportToPDF } from '../../lib/generatePDF';
import SEO from '../../components/SEO';
import ToolInfoPanel from '../../components/ToolInfoPanel';
import TokenCounter from '../../components/TokenCounter';
import FileContextUpload from '../../components/FileContextUpload';
import './CVCreator.css';

function buildFallbackSlides(form) {
  const p = form.projet || 'Votre Startup'
  const s = form.secteur || 'Tech'
  const pays = form.pays || 'Sénégal'
  return [
    { title: p, subtitle: `${s} · ${pays}`, bullets: [form.mission || 'Vision innovante Africa-first', form.produit || 'Produit différenciant', form.cible || 'Marché ciblé', form.investissement ? `Levée: ${form.investissement}` : 'Levée de fonds en cours'], highlight: `${s} · Africa-first` },
    { title: 'Le Problème', subtitle: 'Un marché non adressé', bullets: ['Manque de solutions locales adaptées aux PME', 'Coûts élevés des solutions importées', 'Absence de support technique local', 'Opportunité de marché sous-exploitée'], highlight: 'Problème critique non résolu' },
    { title: 'Notre Solution', subtitle: form.produit || 'Innovation locale', bullets: ['Technologie adaptée au contexte africain', 'Intégration simple sans infrastructure lourde', 'Prix accessibles pour les PME', 'Déploiement rapide et support dédié'], highlight: 'Solution unique' },
    { title: 'Marché', subtitle: `TAM / SAM / SOM — ${pays}`, bullets: [form.marche || 'Marché en forte croissance', 'Croissance CAGR >20% (digital Afrique)', 'Segment PME : 2M+ entreprises cibles CEDEAO', 'Potentiel régional UEMOA non saturé'], highlight: 'Marché adressable ≥ 100 Mds FCFA' },
    { title: 'Produit', subtitle: 'Fonctionnalités clés', bullets: [form.produit || 'Plateforme tout-en-un', 'Interface mobile-first optimisée', 'Intégration Orange Money / Wave / CB', 'Analytics et reporting temps réel'], highlight: 'NPS > 60' },
    { title: 'Modèle Économique', subtitle: 'Revenus récurrents', bullets: ['Abonnement SaaS mensuel / annuel', 'Frais de mise en place par client', 'Services premium & customisation', 'Commissions sur transactions'], highlight: 'Revenus récurrents 70%+' },
    { title: 'Traction', subtitle: form.traction || 'Métriques clés', bullets: [form.traction || 'Clients pilotes actifs', 'Croissance MoM en hausse constante', 'Rétention clients > 80%', 'Partenariats stratégiques signés'], highlight: 'MoM Growth +18%' },
    { title: 'Équipe', subtitle: form.equipe || 'Fondateurs experts', bullets: [form.equipe || 'Profils tech & business complémentaires', 'Expertise sectorielle 5-10 ans', 'Réseau local et régional solide', 'Advisory board de haut niveau'], highlight: 'Dream Team Africa' },
    { title: 'Roadmap', subtitle: '18 mois · Jalons clés', bullets: ['T1: Lancement marché pilote + 50 clients', 'T2: Expansion Dakar & Abidjan', 'T3: Levée Series A', 'T4: Scale CEDEAO'], highlight: 'Rentabilité à 18 mois' },
    { title: "L'Ask", subtitle: form.besoin || 'Levée de fonds', bullets: [`Montant: ${form.montant || 'À préciser'}`, '40% Développement produit & tech', '35% Go-to-market & acquisition clients', '25% Infrastructure & recrutement équipe'], highlight: form.montant || 'Investissement recherché' },
  ]
}

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
    setErr(''); setLoading(true); setSlides([]);

    function parseSlides(text) {
      try {
        let s = String(text || '').trim().replace(/```json\s*/gi, '').replace(/```\s*$/g, '').replace(/```/g, '')
        const m = s.match(/(\[[\s\S]*\])/s)
        return JSON.parse(m ? m[0] : s)
      } catch { return null }
    }

    const ctx2 = uploadedContext ? `\n\nDocuments fournis:\n${uploadedContext.slice(0, 10000)}\n` : ''
    const basePrompt = `Pitch deck investisseur 10 slides pour "${form.projet || 'startup innovante'}" secteur "${form.secteur || 'tech / digital'}" pays "${form.pays || "Sénégal / Afrique de l'Ouest"}".
Données: marché=${form.marche || 'à définir'}, valeur unique=${form.valeur || 'innovation locale'}, traction=${form.traction || 'phase initiale'}, besoin=${form.besoin || 'financement'} montant=${form.montant || 'à préciser'}, équipe=${form.equipe || 'fondateurs experts'}${ctx2}.
Slides: 1.Couverture 2.Problème(chiffres) 3.Solution(différenciateurs) 4.Marché(TAM/SAM/SOM FCFA) 5.Produit 6.Modèle économique 7.Traction 8.Équipe 9.Roadmap 10.Ask(use of funds).
Africa-first, chiffres FCFA, ton VC Series A, 4-5 bullets substantiels par slide.
Reponds UNIQUEMENT avec un tableau json. Commence par [ et termine par ].
Format: [{"title":"","subtitle":"","bullets":["b1","b2","b3","b4"],"highlight":"KPI"}]`

    let parsed = null
    const attempts = [
      () => callGroq(basePrompt, { maxTokens: 4000, temperature: 0.3 }),
      () => callGroq(basePrompt + '\n\nIMPORTANT: réponds UNIQUEMENT avec le tableau json. Commence par [', { maxTokens: 4000, temperature: 0.2 }),
      () => callGroq(`Génère 10 slides pitch deck json pour "${form.projet || 'startup'}" secteur "${form.secteur || 'tech'}".\n[{"title":"...","subtitle":"...","bullets":["...","...","...","..."],"highlight":"..."}]\nTableau json uniquement, commence par [`, { maxTokens: 3000, temperature: 0.15 }),
    ]
    for (const attempt of attempts) {
      try {
        const raw = await attempt()
        parsed = parseSlides(raw)
        if (Array.isArray(parsed) && parsed.length >= 5) break
      } catch { /* try next */ }
    }

    if (!Array.isArray(parsed) || parsed.length < 3) parsed = buildFallbackSlides(form)

    const enriched = parsed.slice(0, 12).map((s, i) => ({
      title: String(s?.title || `Slide ${i + 1}`),
      subtitle: String(s?.subtitle || ''),
      bullets: Array.isArray(s?.bullets) ? s.bullets.slice(0, 5).map(b => String(b)) : [],
      highlight: String(s?.highlight || ''),
      theme: PITCH_THEMES[i % PITCH_THEMES.length] || PITCH_THEMES[0],
    }))
    setSlides(enriched); setActiveSlide(0); setShowAll(false)
    setLoading(false)
  };

  const active = slides[activeSlide];
  const fileSlug = `pitch-deck-${form.projet?.toLowerCase().replace(/\s+/g, '-') || 'abawi'}`;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px', color: 'var(--text-primary)' }}>
      <SEO title="Pitch Deck Pro IA" description="Générez un pitch deck investisseur de niveau VC avec IA." image="/og-tools/pitch.jpg"/>

      {/* ── Pitch Deck Hero ──────────────────────────────── */}
      <style>{`
        @keyframes pdOrbit1{from{transform:rotate(0deg) translateX(72px) rotate(0deg)}to{transform:rotate(-360deg) translateX(72px) rotate(360deg)}}
        @keyframes pdOrbit2{from{transform:rotate(0deg) translateX(118px) rotate(0deg)}to{transform:rotate(360deg) translateX(118px) rotate(-360deg)}}
        @keyframes pdOrbit3{from{transform:rotate(0deg) translateX(162px) rotate(0deg)}to{transform:rotate(-360deg) translateX(162px) rotate(360deg)}}
        @keyframes pdCardFloat{0%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-10px) rotate(1deg)}100%{transform:translateY(0) rotate(-2deg)}}
        @keyframes pdCardFloat2{0%{transform:translateY(0) rotate(3deg)}50%{transform:translateY(-8px) rotate(-1deg)}100%{transform:translateY(0) rotate(3deg)}}
        @keyframes pdCardFloat3{0%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-6px) rotate(-2deg)}100%{transform:translateY(0) rotate(-5deg)}}
        @keyframes pdPulse{0%,100%{box-shadow:0 0 0 6px rgba(124,58,237,0.25),0 0 0 18px rgba(124,58,237,0.1)}50%{box-shadow:0 0 0 12px rgba(124,58,237,0.3),0 0 0 28px rgba(124,58,237,0.06)}}
        @keyframes pdPing{0%{transform:scale(1);opacity:.65}100%{transform:scale(1.9);opacity:0}}
        @keyframes pdShimmer{0%{background-position:-250% center}100%{background-position:250% center}}
        @keyframes pdFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pdSpin{to{transform:rotate(360deg)}}
        @keyframes pdRingGlow{0%,100%{opacity:.25}50%{opacity:.6}}
        @keyframes pdBarGrow{from{width:0}to{width:var(--bar-w,60%)}}
        .pd-orb1{animation:pdOrbit1 12s linear infinite}
        .pd-orb1-d1{animation:pdOrbit1 12s -4s linear infinite}
        .pd-orb1-d2{animation:pdOrbit1 12s -8s linear infinite}
        .pd-orb2{animation:pdOrbit2 20s linear infinite}
        .pd-orb2-d1{animation:pdOrbit2 20s -5s linear infinite}
        .pd-orb2-d2{animation:pdOrbit2 20s -10s linear infinite}
        .pd-orb2-d3{animation:pdOrbit2 20s -15s linear infinite}
        .pd-orb3{animation:pdOrbit3 30s linear infinite}
        .pd-orb3-d1{animation:pdOrbit3 30s -10s linear infinite}
        .pd-orb3-d2{animation:pdOrbit3 30s -20s linear infinite}
        .pd-center{animation:pdPulse 3.2s ease-in-out infinite}
        .pd-ping{animation:pdPing 2.2s ease-out infinite}
        .pd-shimmer{background:linear-gradient(90deg,#fff 0%,#c4b5fd 35%,#818cf8 55%,#f0b429 75%,#fff 100%);background-size:260% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:pdShimmer 5s linear infinite}
        .pd-fade0{animation:pdFadeUp .5s ease both}
        .pd-fade1{animation:pdFadeUp .5s .12s ease both}
        .pd-fade2{animation:pdFadeUp .5s .24s ease both}
        .pd-fade3{animation:pdFadeUp .5s .36s ease both}
        .pd-ring{animation:pdRingGlow 3.5s ease-in-out infinite}
        .pd-card1{animation:pdCardFloat 5s ease-in-out infinite}
        .pd-card2{animation:pdCardFloat2 5.5s -1.5s ease-in-out infinite}
        .pd-card3{animation:pdCardFloat3 6s -3s ease-in-out infinite}
      `}</style>

      <div style={{ background:'linear-gradient(135deg,#06030f 0%,#120b2e 35%,#1e1060 65%,#2e1065 100%)', borderRadius:24, marginBottom:28, position:'relative', overflow:'hidden', minHeight:280, boxShadow:'0 24px 80px rgba(109,40,217,0.32),inset 0 1px 0 rgba(255,255,255,0.06)' }}>

        {/* Grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(139,92,246,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.07) 1px,transparent 1px)', backgroundSize:'42px 42px', WebkitMaskImage:'radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%)', maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%)' }} />

        {/* Glow blobs */}
        <div style={{ position:'absolute', top:-90, left:'20%', width:440, height:440, background:'radial-gradient(circle,rgba(109,40,217,0.35) 0%,transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, right:'5%', width:320, height:320, background:'radial-gradient(circle,rgba(240,180,41,0.09) 0%,transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'30%', left:'-5%', width:240, height:240, background:'radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 65%)', pointerEvents:'none' }} />

        {/* ── Left content */}
        <div style={{ position:'relative', zIndex:2, padding:'clamp(26px,4vw,46px) clamp(22px,4vw,50px)', maxWidth:500, paddingBottom:'clamp(60px,7vw,78px)' }}>
          <div className="pd-fade0" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', background:'rgba(139,92,246,0.18)', border:'1px solid rgba(139,92,246,0.45)', borderRadius:20, marginBottom:16 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#a78bfa', boxShadow:'0 0 8px #a78bfa', display:'inline-block' }} />
            <span style={{ fontSize:'0.68rem', fontWeight:800, color:'#c4b5fd', letterSpacing:'1.6px', textTransform:'uppercase' }}>Pitch Deck · VC Grade</span>
          </div>

          <h1 className="pd-shimmer pd-fade1" style={{ margin:'0 0 14px', fontSize:'clamp(1.7rem,3vw,2.7rem)', fontWeight:900, lineHeight:1.12, letterSpacing:'-0.5px' }}>
            Pitch Deck Pro
          </h1>

          <p className="pd-fade2" style={{ color:'rgba(255,255,255,0.65)', fontSize:'clamp(0.82rem,1.1vw,0.97rem)', lineHeight:1.7, margin:'0 0 22px', maxWidth:420 }}>
            10 slides VC-grade · Données Africa-first · Valorisation & DCF · Prêt à pitcher devant des investisseurs
          </p>

          <div className="pd-fade3" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[{t:'10 Slides VC',c:'#818cf8'},{t:'Africa-first',c:'#10b981'},{t:'Valorisation',c:'#f0b429'},{t:'CAC / LTV',c:'#38bdf8'},{t:'Export PDF',c:'#c4b5fd'}].map(({t,c})=>(
              <span key={t} style={{ padding:'5px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, color:c, background:`${c}18`, border:`1px solid ${c}38`, whiteSpace:'nowrap' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── Orbital diagram */}
        <div style={{ position:'absolute', right:'clamp(-20px,3vw,60px)', top:'50%', transform:'translateY(-52%)', width:260, height:260, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
          {/* Rings */}
          <div className="pd-ring" style={{ position:'absolute', width:144, height:144, borderRadius:'50%', border:'1px dashed rgba(139,92,246,0.45)' }} />
          <div className="pd-ring" style={{ position:'absolute', width:236, height:236, borderRadius:'50%', border:'1px dashed rgba(99,102,241,0.28)', animationDelay:'-1.2s' }} />
          <div className="pd-ring" style={{ position:'absolute', width:324, height:324, borderRadius:'50%', border:'1px dashed rgba(99,102,241,0.14)', animationDelay:'-2.4s' }} />

          {/* Center */}
          <div className="pd-center" style={{ width:62, height:62, borderRadius:'50%', background:'linear-gradient(135deg,#4c1d95,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.75rem', position:'relative', zIndex:4 }}>
            <div className="pd-ping" style={{ position:'absolute', inset:-4, borderRadius:'50%', border:'2px solid rgba(139,92,246,0.6)' }} />
            🎯
          </div>

          {/* Orbit 1 — 3 VC icons */}
          {[{cls:'pd-orb1',i:'💡'},{cls:'pd-orb1-d1',i:'💰'},{cls:'pd-orb1-d2',i:'🚀'}].map(({cls,i})=>(
            <div key={cls} className={cls} style={{ position:'absolute', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(15,8,32,0.9)', border:'1px solid rgba(139,92,246,0.6)', boxShadow:'0 2px 14px rgba(109,40,217,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem' }}>{i}</div>
            </div>
          ))}

          {/* Orbit 2 — 4 metric badges */}
          {[{cls:'pd-orb2',t:'TAM',c:'#10b981'},{cls:'pd-orb2-d1',t:'Series A',c:'#818cf8'},{cls:'pd-orb2-d2',t:'ARR',c:'#f0b429'},{cls:'pd-orb2-d3',t:'Exit',c:'#38bdf8'}].map(({cls,t,c})=>(
            <div key={cls} className={cls} style={{ position:'absolute', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ padding:'3px 9px', borderRadius:20, background:`${c}22`, border:`1px solid ${c}55`, fontSize:'0.62rem', fontWeight:800, color:c, whiteSpace:'nowrap' }}>{t}</div>
            </div>
          ))}

          {/* Orbit 3 — 3 mini cards */}
          {[{cls:'pd-orb3',a:'Seed',b:'500K–2M$'},{cls:'pd-orb3-d1',a:'Traction',b:'MoM +18%'},{cls:'pd-orb3-d2',a:'Valuation',b:'Pre-money'}].map(({cls,a,b})=>(
            <div key={cls} className={cls} style={{ position:'absolute', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ padding:'4px 9px', borderRadius:8, background:'rgba(10,5,25,0.9)', border:'1px solid rgba(139,92,246,0.28)', backdropFilter:'blur(6px)', fontSize:'0.58rem', lineHeight:1.45, whiteSpace:'nowrap', textAlign:'center' }}>
                <div style={{ fontWeight:700, color:'#c4b5fd' }}>{a}</div>
                <div style={{ color:'rgba(255,255,255,0.4)' }}>{b}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom stat bar */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:2, display:'flex', borderTop:'1px solid rgba(255,255,255,0.07)', background:'rgba(8,4,20,0.65)', backdropFilter:'blur(8px)' }}>
          {[{n:'10',l:'Slides VC-grade'},{n:'12',l:'Thèmes graphiques'},{n:'100%',l:'Africa-first'},{n:'PDF',l:'Export premium'}].map(({n,l},i)=>(
            <div key={i} style={{ flex:1, padding:'11px 8px', borderRight:i<3?'1px solid rgba(255,255,255,0.07)':'none', textAlign:'center' }}>
              <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#c4b5fd', lineHeight:1 }}>{n}</div>
              <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', marginTop:3, fontWeight:500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <TokenCounter />
      </div>
      <ToolInfoPanel
        toolName="Pitch Deck Pro"
        icon="🎯"
        description="Générez un pitch deck investisseur de niveau VC en quelques minutes"
        benefits={[
          'Pitch deck structuré en 10 slides standard VC : problème, solution, marché, traction, équipe, finances',
          '10 thèmes graphiques professionnels avec accents colorés distincts',
          'Données adaptées au marché africain (FCFA, UEMOA, Afrique de l\'Ouest)',
          'Navigation entre slides avec aperçu en temps réel',
          'Export PDF haute qualité prêt à présenter en réunion investisseur',
        ]}
        howToUse={[
          'Renseignez votre projet : nom, secteur, pays, proposition de valeur',
          'Ajoutez vos données de marché, traction et besoin de financement',
          'Optionnel : importez un business plan ou étude de marché pour enrichir les slides',
          'Cliquez "Générer mon Pitch Deck" — 10 slides VC créées en quelques secondes',
          'Naviguez entre les slides, choisissez un thème graphique et exportez en PDF',
        ]}
        tips={[
          'Plus votre traction est précise (chiffres réels), plus le pitch sera crédible',
          'Utilisez "Voir tout" pour exporter toutes les slides d\'un coup en PDF',
          'Chaque slide a un thème coloré différent — sélectionnez via les miniatures',
        ]}
      />

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
        {err && <p style={{ color:'#f87171', fontSize:'0.85rem', margin:0 }}>⚠️ {err}</p>}
        {loading && (
          <div style={{ marginTop:12, padding:'14px 18px', borderRadius:12, background:'rgba(109,40,217,0.08)', border:'1px solid rgba(139,92,246,0.3)', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:20, height:20, border:'2px solid rgba(139,92,246,0.3)', borderTopColor:'#a78bfa', borderRadius:'50%', animation:'pdSpin 0.7s linear infinite', flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'0.82rem', color:'#c4b5fd', fontWeight:600, marginBottom:5 }}>Génération des 10 slides VC…</div>
              <div style={{ height:3, background:'rgba(139,92,246,0.15)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg,#7c3aed,#a78bfa,#f0b429)', backgroundSize:'200% 100%', animation:'pdShimmer 1.5s linear infinite', borderRadius:2 }} />
              </div>
            </div>
          </div>
        )}

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
