import { useState, useEffect, useRef } from 'react'

const PASSWORD = 'abawi2026'

function NewsAdmin() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem('abawi-admin') === '1')
  const containerRef = useRef(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!auth) {
      const pwd = prompt('Mot de passe admin ABAWI :')
      if (pwd === PASSWORD) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
        setAuth(true)
        sessionStorage.setItem('abawi-admin', '1')
      }
    }
  }, [auth])

  useEffect(() => {
    if (!auth || !containerRef.current || initialized.current) return
    initialized.current = true

    const container = containerRef.current

    // Inject the bot styles
    const style = document.createElement('style')
    style.textContent = `
.bot-wrap *{box-sizing:border-box}
.bot-wrap{background:#0A0A0A;color:#FFF;font-family:'DM Sans',system-ui,sans-serif;padding:20px;border-radius:12px}
.bot-wrap .ctn{max-width:1000px;margin:0 auto}
.bot-wrap h1{font-size:22px;font-weight:900;letter-spacing:2px;margin-bottom:4px}.bot-wrap h1 span{color:#34D399}
.bot-wrap .sub{color:#D4A843;font-size:9px;letter-spacing:3px;font-weight:700}
.bot-wrap .card{background:#1A1A1A;border:1px solid #222;border-radius:10px;padding:16px;margin-bottom:12px}
.bot-wrap .card h3{font-size:14px;font-weight:700;margin-bottom:8px}
.bot-wrap .btn{padding:10px 18px;border-radius:8px;border:none;font-weight:700;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.bot-wrap .btn-g{background:#047857;color:#FFF}.bot-wrap .btn-gd{background:#D4A843;color:#0A0A0A}.bot-wrap .btn-r{background:#7f1d1d;color:#FFF}.bot-wrap .btn-gr{background:#2D2D2D;color:#9CA3AF}
.bot-wrap .inp{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #2D2D2D;background:#222;color:#FFF;font-size:13px;outline:none;margin-bottom:8px;font-family:inherit}
.bot-wrap textarea.inp{resize:vertical;min-height:60px}
.bot-wrap .lb{color:#D4A843;font-size:11px;font-weight:700;margin-bottom:4px;display:block}
.bot-wrap .st{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
.bot-wrap .st-on{background:#34D399;animation:pu 2s infinite}.bot-wrap .st-off{background:#ef4444}.bot-wrap .st-w{background:#f59e0b;animation:pu 1s infinite}
@keyframes pu{0%,100%{opacity:1}50%{opacity:0.4}}
.bot-wrap .log{background:#111;border:1px solid #222;border-radius:8px;padding:12px;max-height:400px;overflow-y:auto;font-size:11px;font-family:monospace;line-height:1.8}
.bot-wrap .log-info{color:#34D399}.bot-wrap .log-warn{color:#f59e0b}.bot-wrap .log-err{color:#ef4444}.bot-wrap .log-pub{color:#D4A843}.bot-wrap .log-ai{color:#818cf8}
.bot-wrap .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.bot-wrap .si{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#222;border-radius:6px;margin-bottom:6px;gap:8px}
.bot-wrap .si-name{font-weight:600;color:#FFF;font-size:12px}
.bot-wrap .si-url{font-size:9px;color:#9CA3AF;word-break:break-all}
.bot-wrap .tag-on{background:#065F46;color:#34D399;display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer}
.bot-wrap .tag-off{background:#2D2D2D;color:#9CA3AF;display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer}
.bot-wrap .qi{padding:10px;background:#1A1A1A;border:1px solid #222;border-radius:8px;margin-bottom:8px}
.bot-wrap .qi h4{font-size:13px;font-weight:700;color:#FFF;margin-bottom:4px}
.bot-wrap .qi p{font-size:11px;color:#9CA3AF;line-height:1.5}
.bot-wrap .fx{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.bot-wrap .fb{display:flex;justify-content:space-between;align-items:center}
.bot-wrap .badge{font-size:10px;padding:3px 8px;border-radius:4px;font-weight:700;display:inline-block}
.bot-wrap .cat-eco{background:#065F46;color:#34D399}.bot-wrap .cat-tech{background:#1e1b4b;color:#818cf8}.bot-wrap .cat-mat{background:#78350f;color:#fbbf24}.bot-wrap .cat-geo{background:#7f1d1d;color:#fca5a5}.bot-wrap .cat-auto{background:#1e3a5f;color:#60a5fa}.bot-wrap .cat-ai{background:#4c1d95;color:#c4b5fd}.bot-wrap .cat-tel{background:#134e4a;color:#5eead4}.bot-wrap .cat-div{background:#2D2D2D;color:#9CA3AF}
.bot-wrap .stat-box{text-align:center;padding:12px;background:#111;border-radius:8px}
.bot-wrap .stat-num{font-size:32px;font-weight:900}
.bot-wrap .stat-label{font-size:10px;color:#9CA3AF;margin-top:4px}
`
    document.head.appendChild(style)

    // Load Supabase CDN
    const sbScript = document.createElement('script')
    sbScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
    sbScript.onload = () => injectBot(container)
    document.head.appendChild(sbScript)

    return () => {
      style.remove()
      // Don't remove sbScript — it's cached anyway
    }
  }, [auth])

  if (!auth) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: 12 }}>Accès refusé</p>
          <button onClick={() => { setAuth(false); sessionStorage.removeItem('abawi-admin') }}
            style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--green)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '24px 16px 80px' }}>
      <div ref={containerRef} className="bot-wrap" />
    </div>
  )
}

function injectBot(container) {
  // HTML structure
  container.innerHTML = `
<div class="ctn">
<div class="fb" style="margin-bottom:8px">
  <div><h1>ABAWI <span>NEWS</span></h1><div class="sub">ROBOT V3 — BEAST MODE — 30+ SOURCES</div></div>
  <div class="fx"><span class="st st-off" id="sDot"></span><span style="color:#9CA3AF;font-size:11px" id="sTxt">Arrete</span></div>
</div>
<div class="card">
  <h3>1. Configuration</h3>
  <div class="g2">
    <div><label class="lb">Supabase URL</label><input class="inp" id="supaUrl" value="https://nqpfmnsecjhqxuvfkqhi.supabase.co"/></div>
    <div><label class="lb">Supabase Anon Key</label><input class="inp" id="supaKey" value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGZtbnNlY2pocXh1dmZrcWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODI0MDgsImV4cCI6MjA4OTk1ODQwOH0.BCSmlEUmieRHFzT9AfIpSbauOCd2whl-NqQW-W0HIno"/></div>
  </div>
  <label class="lb">Cle API IA (Gemini, Claude ou Groq)</label>
  <input class="inp" id="claudeKey" value="AIzaSyCmgKQie6wZ2W2NHpq46Y-ycMrdKxF4cjU" placeholder="AIzaSy... ou sk-ant-... ou gsk_..."/>
  <label class="lb">Fournisseur IA</label>
  <select class="inp" id="iaProvider" style="margin-bottom:8px"><option value="gemini" selected>Google Gemini 2.5 Flash (GRATUIT)</option><option value="claude">Anthropic Claude Sonnet</option><option value="groq">Groq Llama 3.3 (GRATUIT)</option></select>
  <div class="fx"><button class="btn btn-g" id="btnConnect">Connecter</button><button class="btn btn-gr" id="btnSave">Sauvegarder</button></div>
</div>
<div class="card">
  <div class="fb" style="margin-bottom:8px">
    <h3>2. Sources RSS — <span id="srcCount">0</span> actives</h3>
    <div class="fx"><button class="btn btn-gr" id="btnAddSrc" style="font-size:11px;padding:6px 12px">+ Ajouter</button>
    <button class="btn btn-gr" id="btnAllOn" style="font-size:11px;padding:6px 12px">Tout activer</button>
    <button class="btn btn-gr" id="btnAllOff" style="font-size:11px;padding:6px 12px">Tout pauser</button></div>
  </div>
  <div class="fx" style="margin-bottom:8px" id="catBtns"></div>
  <div id="srcList" style="max-height:400px;overflow-y:auto"></div>
</div>
<div class="card">
  <div class="fb" style="margin-bottom:8px"><h3>3. Robot</h3><span style="color:#9CA3AF;font-size:11px" id="nextRun">--</span></div>
  <div class="fx">
    <button class="btn btn-g" id="btnOn">Demarrer</button>
    <button class="btn btn-r" id="btnOff" style="display:none">Arreter</button>
    <button class="btn btn-gd" id="btnScan">Scanner maintenant</button>
    <span style="color:#818cf8;font-size:10px;font-weight:600">Auto-enrichissement IA actif</span>
    <select class="inp" id="intv" style="width:auto;margin:0"><option value="15">15 min</option><option value="30" selected>30 min</option><option value="60">1 heure</option></select>
    <label class="fx" style="gap:4px"><input type="checkbox" id="autoP" checked/><span style="color:#9CA3AF;font-size:11px">Auto-publier</span></label>
  </div>
</div>
<div class="card">
  <div class="fb" style="margin-bottom:8px"><h3>4. File (<span id="qCnt">0</span>)</h3>
  <div class="fx"><button class="btn btn-g" id="btnPub" style="font-size:11px;padding:6px 12px">Publier tout</button><button class="btn btn-gr" id="btnClr" style="font-size:11px;padding:6px 12px">Vider</button></div></div>
  <div id="qList"><p style="color:#9CA3AF;font-size:12px">Aucun article.</p></div>
</div>
<div class="card">
  <div class="fb" style="margin-bottom:8px"><h3>5. Journal</h3><button class="btn btn-gr" id="btnClearLog" style="font-size:11px;padding:6px 12px">Effacer</button></div>
  <div class="log" id="logBox"></div>
</div>
<div class="card">
  <h3>Stats du jour</h3>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px">
    <div class="stat-box"><div class="stat-num" style="color:#34D399" id="stP">0</div><div class="stat-label">Publies</div></div>
    <div class="stat-box"><div class="stat-num" style="color:#D4A843" id="stS">0</div><div class="stat-label">Scans</div></div>
    <div class="stat-box"><div class="stat-num" style="color:#818cf8" id="stAI">0</div><div class="stat-label">IA reecritures</div></div>
    <div class="stat-box"><div class="stat-num" style="color:#60a5fa" id="stSrc">0</div><div class="stat-label">Sources OK</div></div>
  </div>
</div>
</div>`

  // Inject the full bot engine as a script
  const script = document.createElement('script')
  script.textContent = BOT_ENGINE
  document.body.appendChild(script)
}

// The entire bot engine from abawi-bot, adapted to not use inline onclick
const BOT_ENGINE = `
(function(){
var sb=null,claudeKey="",timer=null,queue=[],nScan=0,nPub=0,nAI=0,nSrcOk=0;
var publishedTitles=new Set();
var catFilter="all";

var sources=[
  {name:"Google News - Economie Senegal",url:"https://news.google.com/rss/search?q=economie+senegal+2026&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"eco"},
  {name:"Google News - Senegal Finance Dette",url:"https://news.google.com/rss/search?q=senegal+finance+dette+budget&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"eco"},
  {name:"Google News - BRVM Bourse Afrique",url:"https://news.google.com/rss/search?q=BRVM+bourse+afrique+UEMOA&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"eco"},
  {name:"Google News - BCEAO Politique Monetaire",url:"https://news.google.com/rss/search?q=BCEAO+taux+politique+monetaire&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"eco"},
  {name:"Google News - Senegal Investissement",url:"https://news.google.com/rss/search?q=senegal+investissement+entreprise&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"eco"},
  {name:"Agence Ecofin - Finance",url:"https://www.agenceecofin.com/finances-publiques/feed",on:true,cat:"eco"},
  {name:"Agence Ecofin - Gestion publique",url:"https://www.agenceecofin.com/gestion-publique/feed",on:true,cat:"eco"},
  {name:"Agence Ecofin - Banques",url:"https://www.agenceecofin.com/banques/feed",on:true,cat:"eco"},
  {name:"Google News - IA Intelligence Artificielle",url:"https://news.google.com/rss/search?q=intelligence+artificielle+IA+2026&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"ai"},
  {name:"Google News - IA Afrique",url:"https://news.google.com/rss/search?q=intelligence+artificielle+afrique+senegal&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"ai"},
  {name:"Google News - OpenAI ChatGPT Claude",url:"https://news.google.com/rss/search?q=OpenAI+ChatGPT+Claude+Anthropic+2026&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"ai"},
  {name:"Google News - Tech Afrique Startup",url:"https://news.google.com/rss/search?q=tech+afrique+startup+fintech&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"tech"},
  {name:"Google News - Tech Mondiale",url:"https://news.google.com/rss/search?q=technologie+innovation+mondiale+2026&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"tech"},
  {name:"Agence Ecofin - Telecom",url:"https://www.agenceecofin.com/telecom/feed",on:true,cat:"tel"},
  {name:"Google News - Telecom Senegal Orange Free",url:"https://news.google.com/rss/search?q=telecom+senegal+orange+free+starlink&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"tel"},
  {name:"Google News - Mobile Money Afrique",url:"https://news.google.com/rss/search?q=mobile+money+wave+orange+money+afrique&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"tel"},
  {name:"Google News - 5G Afrique Telecom",url:"https://news.google.com/rss/search?q=5G+telecom+afrique+reseau&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"tel"},
  {name:"Google News - Cours Or Gold",url:"https://news.google.com/rss/search?q=cours+or+gold+prix+once&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"mat"},
  {name:"Google News - Or Mine Afrique Senegal",url:"https://news.google.com/rss/search?q=or+mine+afrique+senegal+kedougou&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"mat"},
  {name:"Google News - Petrole Gaz Brent",url:"https://news.google.com/rss/search?q=petrole+gaz+brent+cours+2026&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"mat"},
  {name:"Google News - Cacao Cafe Matieres",url:"https://news.google.com/rss/search?q=cacao+cafe+matieres+premieres+afrique&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"mat"},
  {name:"Google News - Phosphates Engrais Senegal",url:"https://news.google.com/rss/search?q=phosphates+engrais+senegal+ICS&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"mat"},
  {name:"Google News - Automobile Afrique",url:"https://news.google.com/rss/search?q=automobile+afrique+voiture+electrique&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"auto"},
  {name:"Google News - Vehicule Electrique Tesla",url:"https://news.google.com/rss/search?q=vehicule+electrique+tesla+BYD+2026&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"auto"},
  {name:"Google News - Automobile Senegal Import",url:"https://news.google.com/rss/search?q=automobile+senegal+import+vehicule&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"auto"},
  {name:"Google News - Geopolitique Afrique",url:"https://news.google.com/rss/search?q=geopolitique+afrique+CEDEAO+UEMOA&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"geo"},
  {name:"Google News - Guerre Moyen Orient Iran",url:"https://news.google.com/rss/search?q=guerre+moyen+orient+iran+israel&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"geo"},
  {name:"Google News - Chine Afrique Commerce",url:"https://news.google.com/rss/search?q=chine+afrique+commerce+cooperation&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"geo"},
  {name:"Google News - USA Trump Afrique",url:"https://news.google.com/rss/search?q=USA+trump+afrique+commerce+tarifs&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"geo"},
  {name:"Google News - FMI Banque Mondiale Afrique",url:"https://news.google.com/rss/search?q=FMI+banque+mondiale+afrique+2026&hl=fr&gl=FR&ceid=FR:fr",on:true,cat:"geo"},
  {name:"Google News - Diomaye Faye Sonko",url:"https://news.google.com/rss/search?q=diomaye+faye+sonko+senegal+2026&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"eco"},
  {name:"Google News - Senegal Agriculture Export",url:"https://news.google.com/rss/search?q=senegal+agriculture+arachide+export&hl=fr&gl=SN&ceid=SN:fr",on:true,cat:"eco"},
];

var CATS={eco:"Economie",tech:"Tech",ai:"IA",mat:"Matieres",auto:"Automobile",tel:"Telecom",geo:"Geopolitique",div:"Divers"};
var CAT_CSS={eco:"cat-eco",tech:"cat-tech",ai:"cat-ai",mat:"cat-mat",auto:"cat-auto",tel:"cat-tel",geo:"cat-geo",div:"cat-div"};

var SEC_RULES=[{keys:["dette","budget","deficit","fmi","banque mondiale","fiscal","impot","tresor","eurobond","obligation","emprunt","inflation","pib","croissance"],sec:"ma"},{keys:["bceao","monetaire","taux directeur","liquidite","reserve"],sec:"ma"},{keys:["brvm","bourse","action","indice","capitalisation","cour","dividende","obligation","marche financier"],sec:"mk"},{keys:["petrole","gaz","sangomar","yakaar","raffin","hydrocarbure","brent","barrel"],sec:"se"},{keys:["mine","or ","gold","kedougou","saraya","orpaillage","once"],sec:"se"},{keys:["phosphate","ics","engrais","chimie"],sec:"se"},{keys:["transport","greve","route","autoroute","btp","ciment","fer ","infrastructure","chantier","ter "],sec:"se"},{keys:["agriculture","arachide","peche","halieutique","elevage","riz ","mil ","fonio","karite","cacao","cafe"],sec:"se"},{keys:["energie","solaire","eolien","electri","renouvelable","senelec"],sec:"se"},{keys:["tech","startup","fintech","digital","numerique","innovation","app ","plateforme"],sec:"en"},{keys:["telecom","orange","free ","starlink","5g","4g","mobile money","wave","fibre"],sec:"en"},{keys:["intelligence artificielle","ia ","chatgpt","openai","claude","anthropic","machine learning","deepfake","llm"],sec:"en"},{keys:["automobile","voiture","vehicule","tesla","byd","electrique","moto"],sec:"en"},{keys:["entrepreneur","pme","startup","incubateur","accelerateur","diaspora","formation"],sec:"en"},{keys:["guerre","conflit","iran","israel","golfe","armee","missile","frappe","geopolitique"],sec:"wo"},{keys:["chine","usa","trump","europe","russie","onu","otan","cedeao","ua ","union africaine"],sec:"wo"},{keys:["export","import","commerce","douane","tarif","balance commerciale"],sec:"ma"}];
var SCENE_RULES=[{keys:["dette","fmi","eurobond","emprunt","tresor","deficit"],sc:"debt"},{keys:["petrole","gaz","sangomar","brent","barrel","hydrocarbure"],sc:"brvm"},{keys:["brvm","bourse","action","indice","capitalisation"],sc:"brvm"},{keys:["chine","china","beijing","pekin","focac"],sc:"china"},{keys:["guerre","iran","israel","conflit","missile","frappe"],sc:"war"},{keys:["transport","greve","paralysie","arret"],sc:"strike"},{keys:["export","import","commerce","balance","douane"],sc:"exp"},{keys:["tech","startup","digital","starlink","5g","telecom","ia ","intelligence artificielle"],sc:"star"},{keys:["europe","wallonie","ue ","france","espagne"],sc:"wallonie"},{keys:["or ","gold","mine","once","kedougou"],sc:"label"},{keys:["agriculture","arachide","karite","fonio","peche"],sc:"label"},{keys:["bceao","monetaire","taux directeur"],sc:"bceao"},{keys:["automobile","voiture","tesla","vehicule"],sc:"star"}];

function guessSec(ti,su){var c=(ti+" "+(su||"")).toLowerCase();for(var i=0;i<SEC_RULES.length;i++){for(var j=0;j<SEC_RULES[i].keys.length;j++){if(c.indexOf(SEC_RULES[i].keys[j])>=0)return SEC_RULES[i].sec}}return"ma"}
function guessSc(ti,su){var c=(ti+" "+(su||"")).toLowerCase();for(var i=0;i<SCENE_RULES.length;i++){for(var j=0;j<SCENE_RULES[i].keys.length;j++){if(c.indexOf(SCENE_RULES[i].keys[j])>=0)return SCENE_RULES[i].sc}}return"def"}
function guessTag(ti){var t=ti.toLowerCase();if(t.indexOf("dette")>=0||t.indexOf("budget")>=0||t.indexOf("fmi")>=0)return"DETTE & FINANCES";if(t.indexOf("brvm")>=0||t.indexOf("bourse")>=0)return"BRVM & MARCHES";if(t.indexOf("petrole")>=0||t.indexOf("gaz")>=0||t.indexOf("brent")>=0)return"ENERGIE";if(t.indexOf("or ")>=0||t.indexOf("gold")>=0||t.indexOf("mine")>=0)return"OR & MINES";if(t.indexOf("banque")>=0||t.indexOf("bceao")>=0)return"BANQUE & CREDIT";if(t.indexOf("export")>=0||t.indexOf("import")>=0||t.indexOf("commerce")>=0)return"COMMERCE";if(t.indexOf("chine")>=0||t.indexOf("china")>=0)return"CHINE-AFRIQUE";if(t.indexOf("guerre")>=0||t.indexOf("iran")>=0||t.indexOf("israel")>=0)return"GEOPOLITIQUE";if(t.indexOf("telecom")>=0||t.indexOf("orange")>=0||t.indexOf("starlink")>=0||t.indexOf("5g")>=0)return"TELECOM";if(t.indexOf("ia ")>=0||t.indexOf("intelligence artificielle")>=0||t.indexOf("chatgpt")>=0||t.indexOf("openai")>=0)return"IA & TECH";if(t.indexOf("tech")>=0||t.indexOf("digital")>=0||t.indexOf("startup")>=0||t.indexOf("fintech")>=0)return"TECH & STARTUP";if(t.indexOf("automobile")>=0||t.indexOf("voiture")>=0||t.indexOf("tesla")>=0||t.indexOf("vehicule")>=0)return"AUTOMOBILE";if(t.indexOf("cacao")>=0||t.indexOf("cafe")>=0||t.indexOf("phosphate")>=0)return"MATIERES PREMIERES";if(t.indexOf("agriculture")>=0||t.indexOf("arachide")>=0||t.indexOf("peche")>=0)return"AGRICULTURE";if(t.indexOf("diaspora")>=0)return"DIASPORA";if(t.indexOf("faye")>=0||t.indexOf("sonko")>=0)return"POLITIQUE ECONOMIQUE";return"ECONOMIE"}

function log(m,c){var b=document.getElementById("logBox");if(!b)return;var t=new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit",second:"2-digit"});b.innerHTML='<div class="log-'+(c||"info")+'">['+t+'] '+m+'</div>'+b.innerHTML}

// Hallucinated AI sometimes returns a title that itself contains a JSON
// object, producing the nested JSON artefact in the news UI.
// Unwrap up to 4 levels and strip stray JSON markers before persisting.
function sanitizeText(raw,maxLen){
  if(raw===null||raw===undefined)return"";
  var s=String(raw).trim();
  for(var depth=0;depth<4;depth++){
    if(s.charAt(0)!=="{"&&s.charAt(0)!=="[")break;
    try{
      var obj=JSON.parse(s);
      var next=obj.ti||obj.su||obj.title||obj.text||null;
      if(next==null)break;
      s=String(next).trim();
    }catch(_e){break}
  }
  // Strip control chars + leading/trailing JSON delimiters. Unicode
  // escapes keep the source ASCII so Rolldown doesn't choke on raw
  // control bytes inside regex literals.
  // eslint-disable-next-line no-control-regex -- Sanitization is intentional
  s=s.replace(/[ -]/g,"")
     .replace(/^[{[\s"']+|[}\]\s"']+$/g,"")
     .replace(/\s+/g," ")
     .trim();
  if(maxLen&&s.length>maxLen)s=s.slice(0,maxLen).replace(/\s\S*$/,"")+"…";
  return s;
}

function sanitizeBlocks(bd){
  if(!Array.isArray(bd))return [];
  return bd.map(function(b){
    if(!b||typeof b!=="object")return null;
    var v=sanitizeText(b.v,4000);
    if(!v)return null;
    return{t:b.t||"p",v:v};
  }).filter(Boolean);
}
function setSt(s){var d=document.getElementById("sDot"),t=document.getElementById("sTxt");if(!d||!t)return;if(s==="on"){d.className="st st-on";t.textContent="Robot actif"}else if(s==="wait"){d.className="st st-w";t.textContent="Scan..."}else{d.className="st st-off";t.textContent="Arrete"}}

function saveConfig(){localStorage.setItem("aw3_su",document.getElementById("supaUrl").value);localStorage.setItem("aw3_sk",document.getElementById("supaKey").value);localStorage.setItem("aw3_ck",document.getElementById("claudeKey").value);localStorage.setItem("aw3_iap",document.getElementById("iaProvider").value);localStorage.setItem("aw3_src",JSON.stringify(sources));localStorage.setItem("aw3_pub",JSON.stringify([...publishedTitles]));log("Config sauvegardee")}
function loadConfig(){var u=localStorage.getItem("aw3_su");if(u)document.getElementById("supaUrl").value=u;var k=localStorage.getItem("aw3_sk");if(k)document.getElementById("supaKey").value=k;var c=localStorage.getItem("aw3_ck");if(c)document.getElementById("claudeKey").value=c;var iap=localStorage.getItem("aw3_iap");if(iap)document.getElementById("iaProvider").value=iap;var s=localStorage.getItem("aw3_src");if(s)try{sources=JSON.parse(s)}catch(e){}var p=localStorage.getItem("aw3_pub");if(p)try{JSON.parse(p).forEach(function(t){publishedTitles.add(t)})}catch(e){}renderSrc()}

function connectAll(){var url=document.getElementById("supaUrl").value.trim();var key=document.getElementById("supaKey").value.trim();claudeKey=document.getElementById("claudeKey").value.trim();if(url&&key){try{sb=supabase.createClient(url,key);log("Supabase OK : "+url);sb.from("articles").select("ti").then(function(r){if(r.data)r.data.forEach(function(a){publishedTitles.add(a.ti.substring(0,40).toLowerCase())});log("Anti-doublon : "+publishedTitles.size+" titres connus")})}catch(e){log("Erreur Supabase : "+e.message,"err")}}else log("Supabase non configure","warn");var prov=document.getElementById("iaProvider").value;if(claudeKey)log("IA "+prov.toUpperCase()+" ON","ai");else log("Pas de cle IA - publication brute","warn");saveConfig()}

function renderSrc(){var shown=catFilter==="all"?sources:sources.filter(function(s){return s.cat===catFilter});document.getElementById("srcCount").textContent=sources.filter(function(s){return s.on}).length;var el=document.getElementById("srcList");el.innerHTML=shown.map(function(s,i){var realIdx=sources.indexOf(s);return'<div class="si"><div style="flex:1;min-width:0"><div class="fx" style="gap:6px;margin-bottom:2px"><span class="si-name">'+s.name+'</span><span class="badge '+(CAT_CSS[s.cat]||"cat-div")+'">'+(CATS[s.cat]||s.cat)+'</span></div><div class="si-url">'+s.url+'</div></div><div class="fx" style="flex-shrink:0"><span class="'+(s.on?"tag-on":"tag-off")+'" data-idx="'+realIdx+'">'+( s.on?"ON":"OFF")+'</span></div></div>'}).join("");el.querySelectorAll(".tag-on,.tag-off").forEach(function(el){el.onclick=function(){var idx=parseInt(this.getAttribute("data-idx"));sources[idx].on=!sources[idx].on;renderSrc();saveConfig()}})}

function filterCat(c){catFilter=c;renderSrc()}

async function fetchRSS(source){var proxies=[function(u){return"https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(u)},function(u){return"https://corsproxy.io/?"+encodeURIComponent(u)},function(u){return"https://api.allorigins.win/get?url="+encodeURIComponent(u)}];for(var p=0;p<proxies.length;p++){try{var res=await fetch(proxies[p](source.url));var data=await res.json();if(data.items&&data.items.length>0){return data.items.slice(0,5).map(function(item){var desc=(item.description||"").replace(/<[^>]*>/g,"").replace(/&[^;]+;/g," ").trim().substring(0,1500);return{title:item.title||"",desc:desc,link:item.link||"",source:source.name,cat:source.cat}}).filter(function(i){return i.title.length>10})}if(data.contents){var parser=new DOMParser();var xml=parser.parseFromString(data.contents,"text/xml");var items=xml.querySelectorAll("item");var results=[];items.forEach(function(item,idx){if(idx>=5)return;var ti=(item.querySelector("title")||{}).textContent||"";var desc=((item.querySelector("description")||{}).textContent||"").replace(/<[^>]*>/g,"").trim().substring(0,1500);var link=(item.querySelector("link")||{}).textContent||"";if(ti.length>10)results.push({title:ti.trim(),desc:desc,link:link.trim(),source:source.name,cat:source.cat})});if(results.length>0)return results}}catch(e){}}return[]}

async function fetchFullArticle(url){if(!url)return"";var proxies=[function(u){return"https://api.allorigins.win/get?url="+encodeURIComponent(u)},function(u){return"https://corsproxy.io/?"+encodeURIComponent(u)}];for(var p=0;p<proxies.length;p++){try{var res=await fetch(proxies[p](url),{signal:AbortSignal.timeout(8000)});var data;var ct=res.headers.get("content-type")||"";if(ct.includes("json")){data=await res.json();data=data.contents||data.body||JSON.stringify(data)}else{data=await res.text()}if(typeof data!=="string"||data.length<100)continue;data=data.replace(/<script[\\s\\S]*?<\\/script>/gi,"").replace(/<style[\\s\\S]*?<\\/style>/gi,"").replace(/<nav[\\s\\S]*?<\\/nav>/gi,"").replace(/<footer[\\s\\S]*?<\\/footer>/gi,"");var paras=[];var m,rx=/<p[^>]*>(.*?)<\\/p>/gis;while((m=rx.exec(data))!==null){var t=m[1].replace(/<[^>]*>/g,"").replace(/&[^;]+;/g," ").trim();if(t.length>40)paras.push(t)}if(paras.length>=2){var fullText=paras.slice(0,20).join("\\n\\n");log("Source recuperee ("+paras.length+" blocs)","info");return fullText.substring(0,4000)}}catch(e){}}return""}

async function rewrite(item){var fullContent=await fetchFullArticle(item.link);var extraSources="";var articleText=[fullContent,item.desc,extraSources].filter(function(s){return s&&s.length>10}).join("\\n\\n---\\n\\n");if(!articleText||articleText.length<50)articleText=item.title+" "+item.desc;if(!claudeKey){var desc=articleText;var paras=desc.split(/[.!?]\\s+|\\n\\n/).filter(function(s){return s.trim().length>30});var bd=[];if(paras.length>=3){bd.push({t:"p",v:paras.slice(0,2).join(". ")+"."});bd.push({t:"p",v:paras.slice(2,4).join(". ")+"."});if(paras.length>4)bd.push({t:"p",v:paras.slice(4).join(". ")+"."});}else{bd.push({t:"p",v:desc})}bd.push({t:"v",v:"Suivez ABAWI NEWS pour l analyse complete."});return{ti:item.title,su:desc.substring(0,200),tag:guessTag(item.title),bd:bd,au:item.source}}try{var prompt="Tu es le redacteur en chef d ABAWI NEWS. Produis un article COMPLET en JSON.\\nREGLES: 5-8 paragraphes, chiffres FCFA/USD, contexte, impact Senegal, tableau donnees, citation expert, impact business.\\nJSON: {ti,su,tag,bd:[{t:p/q/d/v,v:...}]}\\nSOURCE: "+item.source+"\\nTITRE: "+item.title+"\\nCONTENU:\\n"+articleText.substring(0,3000)+"\\nReponds UNIQUEMENT en JSON valide.";var provider=document.getElementById("iaProvider").value;var res,d,txt;if(provider==="gemini"){res=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+claudeKey,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:2500,temperature:0.7}})});if(!res.ok)throw new Error("Gemini HTTP "+res.status);d=await res.json();txt=(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts&&d.candidates[0].content.parts[0]&&d.candidates[0].content.parts[0].text)||""}else if(provider==="groq"){var groqBase=(window.__ABAWI_GROQ_BASE_URL__||"https://api.groq.com/openai/v1").replace(/[/]$/,"");var groqModel=window.__ABAWI_GROQ_MODEL__||"llama-3.3-70b-versatile";res=await fetch(groqBase+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+claudeKey},body:JSON.stringify({model:groqModel,max_tokens:2500,temperature:0.7,messages:[{role:"user",content:prompt}]})});if(!res.ok)throw new Error("Groq HTTP "+res.status);d=await res.json();txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||""}else{res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":claudeKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2500,messages:[{role:"user",content:prompt}]})});if(!res.ok)throw new Error("Claude HTTP "+res.status);d=await res.json();txt=(d.content&&d.content[0]&&d.content[0].text)||""}if(!txt)throw new Error("Reponse vide");var clean=txt.replace(/\`\`\`json\\n?/g,"").replace(/\`\`\`\\n?/g,"").trim();var parsed=JSON.parse(clean);parsed.au="ABAWI NEWS";nAI++;var stAI=document.getElementById("stAI");if(stAI)stAI.textContent=nAI;log("IA OK : "+parsed.ti.substring(0,50),"ai");return parsed}catch(e){log("Erreur IA: "+e.message+" - publication brute","warn");return{ti:item.title,su:(item.desc||item.title).substring(0,200),tag:guessTag(item.title),bd:[{t:"p",v:item.desc||item.title}],au:item.source}}}

async function runOnce(){log("========== SCAN V3 DEMARRE ==========","info");setSt("wait");nScan++;var stS=document.getElementById("stS");if(stS)stS.textContent=nScan;var active=sources.filter(function(s){return s.on});if(active.length===0){log("Aucune source active !","warn");setSt(timer?"on":"off");return}log(active.length+" sources actives","info");var all=[];var okSrc=0;for(var i=0;i<active.length;i++){var items=await fetchRSS(active[i]);if(items.length>0){log(active[i].name+" : "+items.length+" articles","info");okSrc++;all=all.concat(items)}else log(active[i].name+" : 0","warn")}nSrcOk=okSrc;var stSrc=document.getElementById("stSrc");if(stSrc)stSrc.textContent=nSrcOk;var seen={};var uniq=all.filter(function(item){var key=item.title.substring(0,40).toLowerCase();if(seen[key])return false;if(publishedTitles.has(key))return false;seen[key]=true;return true});log(all.length+" bruts -> "+uniq.length+" uniques","info");var toProcess=uniq.slice(0,10);for(var j=0;j<toProcess.length;j++){log("["+(j+1)+"/"+toProcess.length+"] "+toProcess[j].title.substring(0,50)+"...","info");if(j>0)await new Promise(function(r){setTimeout(r,2000)});var rw=await rewrite(toProcess[j]);queue.push({id:Date.now()+Math.floor(Math.random()*10000),s:guessSec(rw.ti||toProcess[j].title,rw.su||toProcess[j].desc),pr:false,tag:rw.tag||guessTag(toProcess[j].title),dt:new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),tm:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),rt:Math.max(3,Math.ceil((rw.bd||[]).length*1.5))+" min",au:rw.au||toProcess[j].source,sc:guessSc(rw.ti||toProcess[j].title,rw.su||toProcess[j].desc),ti:rw.ti||toProcess[j].title,su:rw.su||(toProcess[j].desc||"").substring(0,200),bd:rw.bd||[{t:"p",v:toProcess[j].desc}],sourceUrl:toProcess[j].link})}renderQ();log("========== SCAN TERMINE : "+queue.length+" en file ==========","info");if(sb&&queue.length>0&&document.getElementById("autoP").checked){log("Auto-publication...","pub");await pubAll()}setSt(timer?"on":"off");updNext()}

async function pubAll(){
  if(queue.length===0){log("File vide","warn");return}
  var ok=0,err=0;
  for(var i=0;i<queue.length;i++){
    var a=queue[i];
    // Sanitize at the boundary: nothing dirty enters Supabase. Drop articles
    // that come out empty after cleaning so we never persist garbage.
    var cleanTi=sanitizeText(a.ti,180);
    var cleanSu=sanitizeText(a.su,400);
    var cleanBd=sanitizeBlocks(a.bd);
    if(!cleanTi||cleanBd.length===0){log("Article ignore (titre/contenu invalide)","warn");continue}
    var titleKey=cleanTi.substring(0,40).toLowerCase();
    if(publishedTitles.has(titleKey)){log("DOUBLON ignore","warn");continue}
    if(sb){
      try{
        var res=await sb.from("articles").insert({id:a.id,s:a.s,pr:a.pr,tag:a.tag,dt:a.dt,tm:a.tm,rt:a.rt,au:a.au,sc:a.sc,ti:cleanTi,su:cleanSu,bd:JSON.stringify(cleanBd),created_at:new Date().toISOString()});
        if(res.error){log("Erreur DB : "+res.error.message,"err");err++}
        else{log("PUBLIE : "+cleanTi.substring(0,60),"pub");publishedTitles.add(titleKey);ok++;nPub++}
      }catch(e){log("Erreur : "+e.message,"err");err++}
    }else{
      log("DEMO : "+cleanTi.substring(0,60),"pub");publishedTitles.add(titleKey);ok++;nPub++;
    }
  }
  var stP=document.getElementById("stP");if(stP)stP.textContent=nPub;
  log(ok+" publies, "+err+" erreurs","info");
  queue=[];renderQ();saveConfig();
}

function renderQ(){var qCnt=document.getElementById("qCnt");if(qCnt)qCnt.textContent=queue.length;var el=document.getElementById("qList");if(!el)return;if(queue.length===0){el.innerHTML='<p style="color:#9CA3AF;font-size:12px">Aucun article.</p>';return}el.innerHTML=queue.map(function(a){return'<div class="qi"><div class="fb"><span style="color:#34D399;font-size:9px;font-weight:800">'+a.tag+'</span></div><h4>'+a.ti+'</h4><p>'+a.su+'</p></div>'}).join("")}

function startBot(){var m=parseInt(document.getElementById("intv").value);timer=setInterval(runOnce,m*60*1000);setSt("on");document.getElementById("btnOn").style.display="none";document.getElementById("btnOff").style.display="";log("ROBOT V3 ON - "+sources.filter(function(s){return s.on}).length+" sources - scan /"+m+" min","info");updNext();runOnce();try{localStorage.setItem("aw3_bot_on","1")}catch(e){}}
function stopBot(){clearInterval(timer);timer=null;setSt("off");document.getElementById("btnOn").style.display="";document.getElementById("btnOff").style.display="none";document.getElementById("nextRun").textContent="--";log("Robot OFF","warn");try{localStorage.setItem("aw3_bot_on","0")}catch(e){}}
function updNext(){if(!timer)return;var m=parseInt(document.getElementById("intv").value);document.getElementById("nextRun").textContent="Prochain : "+new Date(Date.now()+m*60000).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}

// Wire up buttons
document.getElementById("btnConnect").onclick=connectAll;
document.getElementById("btnSave").onclick=saveConfig;
document.getElementById("btnOn").onclick=startBot;
document.getElementById("btnOff").onclick=stopBot;
document.getElementById("btnScan").onclick=runOnce;
document.getElementById("btnPub").onclick=pubAll;
document.getElementById("btnClr").onclick=function(){queue=[];renderQ();log("File videe")};
document.getElementById("btnClearLog").onclick=function(){document.getElementById("logBox").innerHTML=""};
document.getElementById("btnAddSrc").onclick=function(){var n=prompt("Nom :");if(!n)return;var u=prompt("URL RSS :");if(!u)return;var c=prompt("Categorie (eco/tech/ai/mat/auto/tel/geo) :")||"div";sources.push({name:n,url:u,on:true,cat:c});renderSrc();saveConfig()};
document.getElementById("btnAllOn").onclick=function(){sources.forEach(function(s){s.on=true});renderSrc();saveConfig()};
document.getElementById("btnAllOff").onclick=function(){sources.forEach(function(s){s.on=false});renderSrc();saveConfig()};

// Category filter buttons
var catBtns=document.getElementById("catBtns");
["all","eco","tech","ai","mat","auto","tel","geo"].forEach(function(c){var b=document.createElement("button");b.className="btn btn-gr";b.style.cssText="font-size:10px;padding:4px 10px";b.textContent=c==="all"?"Toutes":(CATS[c]||c);b.onclick=function(){filterCat(c)};catBtns.appendChild(b)});

loadConfig();renderSrc();
setTimeout(function(){var u=document.getElementById("supaUrl").value;var k=document.getElementById("supaKey").value;if(u&&k&&!u.includes("XXXXXX")){connectAll();log("Auto-connecte","info");try{if(localStorage.getItem("aw3_bot_on")==="1"){startBot()}}catch(e){}}else{try{if(localStorage.getItem("aw3_bot_on")==="1"){startBot()}}catch(e){}}},500);
log("ROBOT V3 BEAST MODE pret - "+sources.length+" sources","info");
})();
`

export default NewsAdmin
