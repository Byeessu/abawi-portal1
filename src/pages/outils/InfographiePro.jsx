import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SEO from '../../components/SEO'
import { useAuth } from '../../context/AuthContext'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import { useToolAccess } from '../../hooks/useToolAccess'
import { cleanIAText } from '../../lib/cleanText'
import { groqChatCompletion } from '../../lib/groqClient'
import { toUserFriendlyAIError } from '../../lib/aiErrorMessages'
import TokenCounter from '../../components/TokenCounter'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

const FORMATS=[
  {id:'sq_1080',label:'Instagram Post 1080×1080',w:1080,h:1080},{id:'story_916',label:'Story 1080×1920',w:1080,h:1920},
  {id:'land_169',label:'LinkedIn 16:9 1920×1080',w:1920,h:1080},{id:'port_45',label:'Portrait 4:5 1080×1350',w:1080,h:1350},
  {id:'fb_cover',label:'Facebook Cover 1640×924',w:1640,h:924},{id:'tw_header',label:'Twitter Header 1500×500',w:1500,h:500},
  {id:'pin_235',label:'Pinterest 1000×1500',w:1000,h:1500},{id:'yt_thumb',label:'YouTube Thumb 1280×720',w:1280,h:720},
  {id:'a4_v',label:'A4 Portrait 1240×1754',w:1240,h:1754},{id:'a4_l',label:'A4 Paysage 1754×1240',w:1754,h:1240},
  {id:'bn728',label:'Banner 728×90',w:728,h:90},{id:'bn300',label:'Banner 300×250',w:300,h:250},
  {id:'sl43',label:'Slide 4:3 1600×1200',w:1600,h:1200},{id:'sl169',label:'Slide 16:9 1920×1080',w:1920,h:1080},
]

const THEMES={
  abyss:{name:'Abysse',bg:'linear-gradient(160deg,#020617,#0f172a,#1e1b4b)',text:'#f8fafc',muted:'#94a3b8',accent:'#22d3ee'},
  paper:{name:'Studio Clair',bg:'linear-gradient(180deg,#f8fafc,#e2e8f0)',text:'#0f172a',muted:'#64748b',accent:'#2563eb'},
  gold:{name:'Or Prestige',bg:'linear-gradient(145deg,#1c1917,#292524,#422006)',text:'#fffbeb',muted:'#a8a29e',accent:'#f59e0b'},
  ocean:{name:'Signal Cyan',bg:'linear-gradient(135deg,#042f2e,#0c4a6e,#172554)',text:'#ecfeff',muted:'#5eead4',accent:'#22d3ee'},
  magma:{name:'Magma',bg:'linear-gradient(135deg,#280505,#7f1d1d,#451a03)',text:'#fef2f2',muted:'#fca5a5',accent:'#f87171'},
  forest:{name:'Forêt',bg:'linear-gradient(135deg,#022c22,#14532d,#064e3b)',text:'#ecfdf5',muted:'#6ee7b7',accent:'#34d399'},
  berry:{name:'Baie',bg:'linear-gradient(135deg,#2e1065,#6b21a8,#4c1d95)',text:'#faf5ff',muted:'#d8b4fe',accent:'#a855f7'},
  corporate:{name:'Corporate',bg:'#ffffff',text:'#111827',muted:'#6b7280',accent:'#1d4ed8'},
  midnight:{name:'Minuit',bg:'#0a0a0a',text:'#fafafa',muted:'#737373',accent:'#eab308'},
  sunset:{name:'Coucher',bg:'linear-gradient(135deg,#4c0519,#9f1239,#c2410c)',text:'#fff1f2',muted:'#fda4af',accent:'#fb7185'},
  neon:{name:'Néon',bg:'#050505',text:'#e0e7ff',muted:'#818cf8',accent:'#6366f1'},
  pastel:{name:'Pastel',bg:'linear-gradient(135deg,#fdf2f8,#e0e7ff,#ecfdf5)',text:'#4b5563',muted:'#9ca3af',accent:'#8b5cf6'},
}

const TYPES=[{t:'text',l:'Texte'},{t:'rect',l:'Rectangle'},{t:'circle',l:'Cercle'},{t:'line',l:'Ligne'},{t:'arrow',l:'Flèche'},{t:'star',l:'Étoile'},{t:'icon',l:'Icône'},{t:'image',l:'Image'},{t:'progress',l:'Barre'},{t:'badge',l:'Badge'},{t:'qr',l:'QR Code'},{t:'pie',l:'Camembert'},{t:'bar',l:'Barres'}]
const FONTS=['Outfit, sans-serif','Inter, sans-serif','Syne, sans-serif','Georgia, serif','monospace']

function uid(p='el'){return p+'_'+Math.random().toString(36).slice(2,8)}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function snap(n,g=10){return Math.round(n/g)*g}
function dl(b,n){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),600)}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function qrData(d,s=120){const c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,s,s);x.fillStyle='#000';const cell=Math.floor(s/25);const h=d.split('').reduce((a,b)=>a+b.charCodeAt(0),0);for(let y=0;y<25;y++)for(let x1=0;x1<25;x1++){const bit=((h+x1*7+y*13)%17)>4;const f=(x1<7&&y<7)||(x1>17&&y<7)||(x1<7&&y>17);if(f){const fx=x1<7?x1:x1-18,fy=y<7?y:y-17;const inf=(fx>=2&&fx<=4&&fy>=2&&fy<=4)||(fx===0||fx===6||fy===0||fy===6)||(fx>=1&&fx<=5&&fy>=1&&fy<=5);x.fillStyle=inf?'#000':'#fff';x.fillRect(x1*cell,y*cell,cell,cell);x.fillStyle='#000'}else if(bit)x.fillRect(x1*cell,y*cell,cell,cell)}return c.toDataURL('image/png')}

export default function InfographiePro(){
  const {membre}=useAuth(); const tool=useToolAccess('infographie','infographie'); const [showPayment,setShowPayment]=useState(false)
  const [formatId,setFormatId]=useState('sq_1080'); const fmt=FORMATS.find(f=>f.id===formatId)||FORMATS[0]
  const [themeKey,setThemeKey]=useState('abyss'); const theme=THEMES[themeKey]||THEMES.abyss
  const [els,setEls]=useState([
    {id:uid(),t:'text',x:40,y:40,w:fmt.w-80,h:80,content:'TITRE',s:{fontSize:52,fontWeight:800,color:theme.text,fontFamily:'Outfit, sans-serif',textAlign:'center'},z:1,r:0},
    {id:uid(),t:'text',x:40,y:130,w:fmt.w-80,h:40,content:'Sous-titre',s:{fontSize:24,color:theme.muted,fontFamily:'Outfit, sans-serif',textAlign:'center'},z:2,r:0},
    {id:uid(),t:'rect',x:50,y:200,w:(fmt.w-120)/2,h:180,content:'',s:{fill:theme.accent,opacity:0.15,borderRadius:16},z:0,r:0},
    {id:uid(),t:'text',x:70,y:220,w:(fmt.w-160)/2,h:140,content:'Pilier A\nDonnées clés',s:{fontSize:18,color:theme.text,fontFamily:'Outfit, sans-serif',textAlign:'left'},z:3,r:0},
    {id:uid(),t:'rect',x:(fmt.w/2)+20,y:200,w:(fmt.w-120)/2,h:180,content:'',s:{fill:'#3b82f6',opacity:0.15,borderRadius:16},z:0,r:0},
    {id:uid(),t:'text',x:(fmt.w/2)+40,y:220,w:(fmt.w-160)/2,h:140,content:'Pilier B\nKPI',s:{fontSize:18,color:theme.text,fontFamily:'Outfit, sans-serif',textAlign:'left'},z:3,r:0},
    {id:uid(),t:'badge',x:40,y:fmt.h-70,w:180,h:40,content:'ABAWI',s:{fill:theme.accent,color:'#fff',fontSize:14,borderRadius:100},z:4,r:0},
  ])
  const [selId,setSelId]=useState(null); const [hist,setHist]=useState([]); const [hIdx,setHIdx]=useState(-1)
  const [grid,setGrid]=useState(true); const [gSize,setGSize]=useState(20); const [snapTo,setSnapTo]=useState(true)
  const [tab,setTab]=useState('library'); const [aiBrief,setAiBrief]=useState(''); const [aiLoad,setAiLoad]=useState(false); const [aiErr,setAiErr]=useState(''); const [exp,setExp]=useState('')
  const cv=useRef(null); const dg=useRef(null); const ds=useMemo(()=>Math.min(620/fmt.w,740/fmt.h,1),[fmt.w,fmt.h])
  function push(n){const h=hist.slice(0,hIdx+1);h.push(JSON.stringify(n));if(h.length>40)h.shift();setHist(h);setHIdx(h.length-1)}
  function upd(fn){const n=fn(els);setEls(n);push(n)}
  function s(){return els.find(e=>e.id===selId)}
  function undo(){if(hIdx>0){setHIdx(hIdx-1);setEls(JSON.parse(hist[hIdx-1]))}}
  function redo(){if(hIdx<hist.length-1){setHIdx(hIdx+1);setEls(JSON.parse(hist[hIdx+1]))}}

  function add(t,ex={}){
    const d={text:{x:40,y:40,w:300,h:60,content:'Texte',s:{fontSize:24,color:theme.text,fontFamily:'Outfit, sans-serif',textAlign:'left'},z:els.length+1,r:0},
      rect:{x:40,y:40,w:200,h:120,content:'',s:{fill:theme.accent,opacity:0.2,borderRadius:12},z:els.length+1,r:0},
      circle:{x:40,y:40,w:120,h:120,content:'',s:{fill:theme.accent,opacity:0.2},z:els.length+1,r:0},
      line:{x:40,y:fmt.h/2,w:fmt.w-80,h:4,content:'',s:{fill:theme.accent,opacity:1},z:els.length+1,r:0},
      arrow:{x:40,y:fmt.h/2,w:200,h:6,content:'',s:{fill:theme.accent,opacity:1},z:els.length+1,r:0},
      star:{x:40,y:40,w:100,h:100,content:'',s:{fill:theme.accent,opacity:0.3},z:els.length+1,r:0},
      icon:{x:40,y:40,w:80,h:80,content:'🚀',s:{fontSize:48,color:theme.accent,textAlign:'center'},z:els.length+1,r:0},
      image:{x:40,y:40,w:240,h:160,content:'',s:{borderRadius:0,opacity:1},z:els.length+1,r:0},
      progress:{x:40,y:40,w:300,h:28,content:'65',s:{fill:theme.accent,bg:'rgba(255,255,255,0.1)',borderRadius:14},z:els.length+1,r:0},
      badge:{x:40,y:40,w:160,h:36,content:'BADGE',s:{fill:theme.accent,color:'#fff',fontSize:14,borderRadius:100},z:els.length+1,r:0},
      qr:{x:40,y:40,w:120,h:120,content:'https://abawi.app',s:{bg:'#fff',borderRadius:8,padding:6},z:els.length+1,r:0},
      pie:{x:40,y:40,w:180,h:180,content:'30,45,25',s:{colors:['#22d3ee','#3b82f6','#a855f7']},z:els.length+1,r:0},
      bar:{x:40,y:40,w:260,h:180,content:'45,70,30,90',s:{colors:['#22d3ee','#3b82f6','#a855f7','#34d399']},z:els.length+1,r:0},
    }
    const el={id:uid(),t,...d[t],...ex}; upd(p=>[...p,el]); setSelId(el.id)
  }
  function del(){if(!selId)return;upd(p=>p.filter(e=>e.id!==selId));setSelId(null)}
  function dup(){const e=s();if(!e)return;const c={...e,id:uid(),x:e.x+20,y:e.y+20,z:e.z+1};upd(p=>[...p,c]);setSelId(c.id)}
  function front(){const e=s();if(!e)return;const m=Math.max(...els.map(z=>z.z));upd(p=>p.map(x=>x.id===e.id?{...x,z:m+1}:x))}
  function back(){const e=s();if(!e)return;const m=Math.min(...els.map(z=>z.z));upd(p=>p.map(x=>x.id===e.id?{...x,z:m-1}:x))}

  function onDown(ev,id,act='move'){ev.stopPropagation();setSelId(id);const el=els.find(x=>x.id===id);if(!el)return;const rect=cv.current.getBoundingClientRect();const sx=(ev.clientX-rect.left)/ds,sy=(ev.clientY-rect.top)/ds;dg.current={id,act,sx,sy,orig:el,rect};window.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onUp)}
  const onMove=useCallback((e)=>{if(!dg.current)return;const {id,act,sx,sy,orig,rect}=dg.current;const mx=(e.clientX-rect.left)/ds,my=(e.clientY-rect.top)/ds;const dx=mx-sx,dy=my-sy;upd(p=>p.map(el=>{if(el.id!==id)return el;if(act==='move'){let nx=orig.x+dx,ny=orig.y+dy;if(snapTo){nx=snap(nx,gSize);ny=snap(ny,gSize)}return{...el,x:clamp(nx,0,fmt.w-el.w),y:clamp(ny,0,fmt.h-el.h)}}if(act==='resize'){let nw=orig.w+dx,nh=orig.h+dy;if(snapTo){nw=snap(nw,gSize);nh=snap(nh,gSize)}return{...el,w:Math.max(20,nw),h:Math.max(20,nh)}}return el}))},[ds,fmt,gSize,snapTo])
  const onUp=useCallback(()=>{dg.current=null;window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)},[onMove])
  function onClickCanvas(e){if(e.target===cv.current||e.target.dataset.bg)setSelId(null)}
  function patch(v){if(!selId)return;upd(p=>p.map(e=>e.id===selId?{...e,...v}:e))}
  function patchS(v){if(!selId)return;upd(p=>p.map(e=>e.id===selId?{...e,s:{...e.s,...v}}:e))}
  function addImg(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>add('image',{content:r.result,w:280,h:180});r.readAsDataURL(f)}
  function replaceImg(e){const f=e.target.files?.[0];if(!f||!selId)return;const el=s();if(!el||el.t!=='image')return;const r=new FileReader();r.onload=()=>patch({content:r.result});r.readAsDataURL(f)}

  async function doExport(type){
    if(!tool.allowed){setShowPayment(true);return}
    setExp(type)
    try{if(type==='svg'){exportSVG();setExp('');if(!tool.unlimited){const r=await tool.debit();if(!r.ok)setShowPayment(true)}return}
      const {default:html2canvas}=await import('html2canvas')
      const c=await html2canvas(cv.current,{scale:type==='pdf'?2:3,useCORS:true,allowTaint:true,backgroundColor:null,logging:false})
      if(type==='png')c.toBlob(b=>b&&dl(b,`infographie-${Date.now()}.png`),'image/png',0.96)
      if(type==='jpeg')c.toBlob(b=>b&&dl(b,`infographie-${Date.now()}.jpg`),'image/jpeg',0.93)
      if(type==='webp')c.toBlob(b=>b&&dl(b,`infographie-${Date.now()}.webp`),'image/webp',0.9)
      if(type==='pdf'){const {default:jsPDF}=await import('jspdf');const pdf=new jsPDF({orientation:fmt.w>fmt.h?'l':'p',unit:'px',format:[fmt.w,fmt.h]});pdf.addImage(c.toDataURL('image/jpeg',0.92),'JPEG',0,0,fmt.w,fmt.h);pdf.save(`infographie-${Date.now()}.pdf`)}
      if(!tool.unlimited){const r=await tool.debit();if(!r.ok)setShowPayment(true)}
    }catch(err){setAiErr('Export échoué : '+err.message)}
    setExp('')
  }
  function exportSVG(){
    const shapes=els.map(el=>{const s=el.s||{};const rot=`rotate(${el.r||0},${el.x+el.w/2},${el.y+el.h/2})`
      if(el.t==='text')return`<text x="${el.x+el.w/2}" y="${el.y+el.h/2}" font-family="${s.fontFamily||'Outfit'}" font-size="${s.fontSize||24}" fill="${s.color||'#fff'}" text-anchor="middle" dominant-baseline="middle" transform="${rot}">${esc(el.content)}</text>`
      if(el.t==='rect')return`<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="${s.borderRadius||0}" fill="${s.fill||'#3b82f6'}" opacity="${s.opacity??1}" stroke="${s.borderColor||'none'}" stroke-width="${s.borderWidth||0}" transform="${rot}"/>`
      if(el.t==='circle')return`<ellipse cx="${el.x+el.w/2}" cy="${el.y+el.h/2}" rx="${el.w/2}" ry="${el.h/2}" fill="${s.fill||'#3b82f6'}" opacity="${s.opacity??1}" transform="${rot}"/>`
      if(el.t==='line')return`<line x1="${el.x}" y1="${el.y+el.h/2}" x2="${el.x+el.w}" y2="${el.y+el.h/2}" stroke="${s.fill||'#3b82f6'}" stroke-width="${el.h}" transform="${rot}"/>`
      return ''}).join('')
    const bg=theme.bg.startsWith('#')?theme.bg:'#0a0a0a'
    dl(new Blob([`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="${fmt.w}" height="${fmt.h}" viewBox="0 0 ${fmt.w} ${fmt.h}"><rect width="100%" height="100%" fill="${bg}"/>${shapes}</svg>`],{type:'image/svg+xml'}),`infographie-${Date.now()}.svg`)
  }

  async function genAI(){
    if(!tool.allowed){setShowPayment(true);return}
    if(!aiBrief.trim())return
    setAiLoad(true);setAiErr('')
    try{
      const prompt=`Designer UI senior. Crée un layout infographie pour : "${aiBrief}". Format ${fmt.w}×${fmt.h}. Thème ${theme.name}. Retourne UNIQUEMENT JSON strict sans markdown : {"elements":[{"t":"text|rect|circle|icon|progress|badge","x":num,"y":num,"w":num,"h":num,"content":"...","s":{"fontSize":num,"color":"#hex","fill":"#hex","opacity":0-1,"borderRadius":num},"z":num}]}`
      const data=await groqChatCompletion({model:GROQ_MODEL,max_tokens:1800,temperature:0.35,messages:[{role:'user',content:prompt}]},GROQ_KEY)
      const raw=cleanIAText(data?.choices?.[0]?.message?.content||'')
      const json=JSON.parse(raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```$/i,'').trim())
      const ne=(json.elements||[]).map((el,i)=>({...el,id:uid(),z:i+1,r:el.r||0}))
      setEls(ne);push(ne);setSelId(null)
      if(!tool.unlimited){const r=await tool.debit();if(!r.ok)setShowPayment(true)}
    }catch(e){setAiErr(toUserFriendlyAIError(e,'Impossible de générer. Reformulez le brief.'))}
    setAiLoad(false)
  }

  useEffect(()=>{function k(e){if(e.key==='Delete'||e.key==='Backspace'){if(!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))del()}if((e.metaKey||e.ctrlKey)&&e.key==='d'){e.preventDefault();dup()}if((e.metaKey||e.ctrlKey)&&e.key==='z'){e.preventDefault();e.shiftKey?redo():undo()}}window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k)},[selId,els,hist,hIdx])

  function renderEl(el){
    const s=el.s||{};const b={position:'absolute',left:el.x,top:el.y,width:el.w,height:el.h,zIndex:el.z,transform:`rotate(${el.r||0}deg)`,cursor:'move',userSelect:'none'}
    const sl=selId===el.id;const o={outline:sl?`2px dashed ${theme.accent}`:'none',outlineOffset:-1}
    const mr=(e)=>onDown(e,el.id,'move');const hr=(e)=>onDown(e,el.id,'resize')
    switch(el.t){
      case 'text':return<div key={el.id} onMouseDown={mr} style={{...b,...o,display:'flex',alignItems:s.textAlign==='center'?'center':'flex-start',justifyContent:s.textAlign==='center'?'center':'flex-start',padding:8}}><span style={{fontSize:s.fontSize||24,fontWeight:s.fontWeight||600,color:s.color||theme.text,fontFamily:s.fontFamily||'Outfit, sans-serif',textAlign:s.textAlign||'left',lineHeight:1.3,textShadow:s.textShadow||'none',whiteSpace:'pre-wrap',wordWrap:'break-word',maxWidth:'100%'}}>{el.content}</span>{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>
      case 'rect':return<div key={el.id} onMouseDown={mr} style={{...b,...o,background:s.fill||theme.accent,opacity:s.opacity??0.2,borderRadius:s.borderRadius||0,border:`${s.borderWidth||0}px solid ${s.borderColor||'transparent'}`}}>{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>
      case 'circle':return<div key={el.id} onMouseDown={mr} style={{...b,...o,background:s.fill||theme.accent,opacity:s.opacity??0.2,borderRadius:'50%',border:`${s.borderWidth||0}px solid ${s.borderColor||'transparent'}`}}>{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>
      case 'line':return<div key={el.id} onMouseDown={mr} style={{...b,...o,background:s.fill||theme.accent,opacity:s.opacity??1,borderRadius:99}}>{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>
      case 'arrow':return<div key={el.id} onMouseDown={mr} style={{...b,...o,display:'flex',alignItems:'center'}}><div style={{flex:1,height:Math.max(2,el.h*0.5),background:s.fill||theme.accent,opacity:s.opacity??1}}/><div style={{width:0,height:0,borderTop:`${el.h}px solid transparent`,borderBottom:`${el.h}px solid transparent`,borderLeft:`${el.h*1.4}px solid ${s.fill||theme.accent}`,opacity:s.opacity??1}}/>{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>
      case 'star':return<div key={el.id} onMouseDown={mr} style={{...b,...o,display:'flex',alignItems:'center',justifyContent:'center'}}><svg width={el.w} height={el.h} viewBox="0 0 24 24" fill={s.fill||theme.accent} opacity={s.opacity??0.5}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>
      case 'icon':return<div key={el.id} onMouseDown={mr} style={{...b,...o,display:'flex',alignItems:'center',justifyContent:'center',fontSize:s.fontSize||48}}><span style={{opacity:s.opacity??1}}>{el.content}</span>{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>
      case 'image':return<div key={el.id} onMouseDown={mr} style={{...b,...o,overflow:'hidden',borderRadius:s.borderRadius||0,opacity:s.opacity??1}}>{el.content?<img src={el.content} alt="" style={{width:'100%',height:'100%',objectFit:s.objectFit||'cover',pointerEvents:'none'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)'}}>Image</div>}{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>
      case 'progress':{const v=clamp(parseInt(el.content)||0,0,100);return<div key={el.id} onMouseDown={mr} style={{...b,...o,background:s.bg||'rgba(255,255,255,0.1)',borderRadius:s.borderRadius||14,overflow:'hidden',display:'flex',alignItems:'center'}}><div style={{width:`${v}%`,height:'100%',background:s.fill||theme.accent,borderRadius:s.borderRadius||14,transition:'width 0.4s ease'}}/><span style={{position:'absolute',right:10,fontSize:Math.max(10,el.h*0.5),fontWeight:700,color:'#fff'}}>{v}%</span>{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>}
      case 'badge':return<div key={el.id} onMouseDown={mr} style={{...b,...o,background:s.fill||theme.accent,borderRadius:s.borderRadius||100,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 14px'}}><span style={{color:s.color||'#fff',fontSize:s.fontSize||14,fontWeight:700,whiteSpace:'nowrap'}}>{el.content}</span>{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>
      case 'qr':return<div key={el.id} onMouseDown={mr} style={{...b,...o,background:s.bg||'#fff',borderRadius:s.borderRadius||8,padding:s.padding||6,display:'flex',alignItems:'center',justifyContent:'center'}}><img src={qrData(el.content||'https://abawi.app',Math.min(el.w,el.h)-12)} alt="QR" style={{width:'100%',height:'100%',imageRendering:'pixelated'}}/>{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>
      case 'pie':{const vals=(el.content||'').split(',').map(v=>parseFloat(v)||0);const sum=vals.reduce((a,b)=>a+b,0)||1;let start=0;return<div key={el.id} onMouseDown={mr} style={{...b,...o}}><svg width={el.w} height={el.h} viewBox="0 0 100 100">{vals.map((v,i)=>{const pct=v/sum;const end=start+pct*360;const d=arcPath(50,50,45,start,end);const c=(s.colors||[])[i%((s.colors||[]).length||1)]||theme.accent;start=end;return<path key={i} d={d} fill={c} stroke={theme.bg.startsWith('#')?theme.bg:'#0a0a0a'} strokeWidth="2"/>})}</svg>{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>}
      case 'bar':{const vals=(el.content||'').split(',').map(v=>parseFloat(v)||0);const max=Math.max(...vals,1);return<div key={el.id} onMouseDown={mr} style={{...b,...o,display:'flex',alignItems:'flex-end',justifyContent:'space-around',padding:6,gap:4}}>{vals.map((v,i)=>{const h=(v/max)*100;const c=(s.colors||[])[i%((s.colors||[]).length||1)]||theme.accent;return<div key={i} style={{flex:1,height:`${h}%`,background:c,borderRadius:6,minWidth:8,position:'relative'}}><span style={{position:'absolute',top:-16,left:'50%',transform:'translateX(-50%)',fontSize:10,fontWeight:700,color:theme.text}}>{v}</span></div>})}{sl&&<div onMouseDown={hr} style={{position:'absolute',right:-6,bottom:-6,width:12,height:12,background:theme.accent,borderRadius:2,cursor:'se-resize',zIndex:10}}/>}</div>}
      default:return null
    }
  }
  function arcPath(cx,cy,r,startAngle,endAngle){const rad=deg=>deg*Math.PI/180;const x1=cx+r*Math.cos(rad(startAngle)),y1=cy+r*Math.sin(rad(startAngle)),x2=cx+r*Math.cos(rad(endAngle)),y2=cy+r*Math.sin(rad(endAngle));const largeArc=endAngle-startAngle<=180?0:1;return`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
  function renderGrid(){if(!grid)return null;const cols=Math.ceil(fmt.w/gSize),rows=Math.ceil(fmt.h/gSize);return<svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0,opacity:0.12}}>{Array.from({length:cols+1}).map((_,i)=><line key={'v'+i} x1={i*gSize} y1={0} x2={i*gSize} y2={fmt.h} stroke={theme.muted} strokeWidth={0.5}/>)}{Array.from({length:rows+1}).map((_,i)=><line key={'h'+i} x1={0} y1={i*gSize} x2={fmt.w} y2={i*gSize} stroke={theme.muted} strokeWidth={0.5}/>)}</svg>}

  const e=s()
  return(
    <main style={{maxWidth:1400,margin:'0 auto',padding:'24px 18px 80px',fontFamily:'Outfit, sans-serif'}}>
      <SEO title="Infographie Pro — Studio Visuel IA" description="Studio d'infographie avec calques, formes, charts, IA et exports HD." image="/og-tools/infographie-pro.jpg"/>
      <style>{`@media(max-width:900px){.ip-grid{grid-template-columns:1fr!important}}`}</style>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}><TokenCounter/></div>
      <ToolInfoPanel toolName="Infographie Pro IA" icon="🎨" description="Studio visuel professionnel avec calques, formes, charts, alignement intelligent et génération IA. Export PNG, JPEG, SVG, PDF."
        benefits={['Canvas interactif drag & drop + redimensionnement','14 formats sociaux & print','12 thèmes premium','13 types d\'éléments : textes, formes, icônes, images, charts, QR, badges','Génération IA de layouts complets','Export PNG HD, JPEG, SVG, PDF','Undo/Redo, grille, snap-to-grid, calques']}
        howToUse={['Choisissez format et thème','Ajoutez éléments depuis la bibliothèque','Glissez-déposez et redimensionnez','Modifiez styles dans le panneau droit','Générez avec l\'IA puis affinez','Exportez en PNG HD / PDF']}
        tips={['Ctrl+D dupliquer','Ctrl+Z undo / Ctrl+Shift+Z redo','Activez grille + snap pour alignements parfaits']}
      />

      {/* Toolbar */}
      <div style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'center',marginTop:20,marginBottom:14,padding:'12px 14px',background:'var(--bg-card)',borderRadius:14,border:'1px solid var(--border)'}}>
        <select value={formatId} onChange={ev=>setFormatId(ev.target.value)} style={ss}>{FORMATS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
        <select value={themeKey} onChange={ev=>setThemeKey(ev.target.value)} style={ss}>{Object.entries(THEMES).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}</select>
        <button onClick={()=>setGrid(v=>!v)} style={tb(grid)}>Grille</button>
        <button onClick={()=>setSnapTo(v=>!v)} style={tb(snapTo)}>Snap</button>
        <button onClick={undo} style={tb(false)} disabled={hIdx<=0}>↩ Undo</button>
        <button onClick={redo} style={tb(false)} disabled={hIdx>=hist.length-1}>↪ Redo</button>
        <div style={{marginLeft:'auto',display:'flex',gap:8,flexWrap:'wrap'}}>
          {['png','jpeg','webp','svg','pdf'].map(t=><button key={t} onClick={()=>doExport(t)} disabled={!!exp} style={tb(false)}>{exp===t?'…':t.toUpperCase()}</button>)}
        </div>
      </div>

      {/* Workspace */}
      <div className="ip-grid" style={{display:'grid',gridTemplateColumns:'200px 1fr 250px',gap:14}}>
        {/* Library */}
        <div style={{background:'var(--bg-card)',borderRadius:14,border:'1px solid var(--border)',padding:12,display:'flex',flexDirection:'column',gap:6}}>
          <div style={{fontSize:'0.7rem',fontWeight:800,color:'var(--text-muted)',letterSpacing:1,textTransform:'uppercase'}}>Bibliothèque</div>
          {TYPES.map(t=><button key={t.t} onClick={()=>add(t.t)} style={lb}>{t.l}</button>)}
          <label style={{...lb,cursor:'pointer'}}>Image locale <input type="file" accept="image/*" onChange={addImg} style={{display:'none'}}/></label>
        </div>

        {/* Canvas */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
          <div style={{color:'var(--text-secondary)',fontSize:'0.82rem'}}>Aperçu — export à {fmt.w}×{fmt.h}px</div>
          <div style={{width:Math.round(fmt.w*ds),height:Math.round(fmt.h*ds),margin:'0 auto',overflow:'hidden',borderRadius:12,boxShadow:'0 12px 40px rgba(0,0,0,0.45)',border:'1px solid #1e293b'}}>
            <div ref={cv} onClick={onClickCanvas} data-bg="1" style={{width:fmt.w,height:fmt.h,transform:`scale(${ds})`,transformOrigin:'top left',background:theme.bg,position:'relative',overflow:'hidden'}}>
              {renderGrid()}
              {els.map(el=>renderEl(el))}
            </div>
          </div>
        </div>

        {/* Properties */}
        <div style={{background:'var(--bg-card)',borderRadius:14,border:'1px solid var(--border)',padding:12,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',gap:4,borderBottom:'1px solid var(--border)',paddingBottom:8}}>
            {['library','props','ai'].map(t=><button key={t} onClick={()=>setTab(t)} style={{...tb(tab===t),flex:1,padding:'6px 0',fontSize:'0.78rem'}}>{t==='library'?'Lib':t==='props'?'Props':'IA'}</button>)}
          </div>

          {tab==='library'&&<div style={{display:'flex',flexDirection:'column',gap:6}}>{TYPES.map(t=><button key={t.t} onClick={()=>add(t.t)} style={lb}>{t.l}</button>)}</div>}

          {tab==='props'&&e&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={ph}>Position & Taille</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              <input type="number" value={e.x} onChange={ev=>patch({x:parseInt(ev.target.value)||0})} style={inp} placeholder="X"/>
              <input type="number" value={e.y} onChange={ev=>patch({y:parseInt(ev.target.value)||0})} style={inp} placeholder="Y"/>
              <input type="number" value={e.w} onChange={ev=>patch({w:parseInt(ev.target.value)||20})} style={inp} placeholder="W"/>
              <input type="number" value={e.h} onChange={ev=>patch({h:parseInt(ev.target.value)||20})} style={inp} placeholder="H"/>
            </div>
            <input type="range" min="-180" max="180" value={e.r||0} onChange={ev=>patch({r:parseInt(ev.target.value)})} style={{width:'100%'}}/>{e.r||0}°
            <div style={ph}>Contenu</div>
            {e.t==='text'&&<textarea value={e.content} onChange={ev=>patch({content:ev.target.value})} style={{...inp,minHeight:60,resize:'vertical'}}/>}
            {(e.t==='icon'||e.t==='badge'||e.t==='progress'||e.t==='qr'||e.t==='pie'||e.t==='bar')&&<input value={e.content} onChange={ev=>patch({content:ev.target.value})} style={inp}/>}
            {e.t==='image'&&<><input value={e.content} onChange={ev=>patchS({content:ev.target.value})} style={inp} placeholder="URL image"/><label style={{...lb,cursor:'pointer'}}>Remplacer <input type="file" accept="image/*" onChange={replaceImg} style={{display:'none'}}/></label></>}
            <div style={ph}>Style</div>
            {e.s?.fontSize!==undefined&&<><label style={pl}>Taille police</label><input type="number" value={e.s.fontSize} onChange={ev=>patchS({fontSize:parseInt(ev.target.value)||12})} style={inp}/></>}
            {e.s?.fontWeight!==undefined&&<><label style={pl}>Graisse</label><select value={e.s.fontWeight} onChange={ev=>patchS({fontWeight:parseInt(ev.target.value)})} style={ss}>{[300,400,500,600,700,800,900].map(w=><option key={w} value={w}>{w}</option>)}</select></>}
            {e.s?.fontFamily!==undefined&&<><label style={pl}>Police</label><select value={e.s.fontFamily} onChange={ev=>patchS({fontFamily:ev.target.value})} style={ss}>{FONTS.map(f=><option key={f} value={f}>{f.split(',')[0]}</option>)}</select></>}
            {e.s?.textAlign!==undefined&&<><label style={pl}>Alignement</label><select value={e.s.textAlign} onChange={ev=>patchS({textAlign:ev.target.value})} style={ss}>{['left','center','right'].map(a=><option key={a} value={a}>{a}</option>)}</select></>}
            {e.s?.color!==undefined&&<><label style={pl}>Couleur texte</label><input type="color" value={e.s.color} onChange={ev=>patchS({color:ev.target.value})} style={{...inp,padding:2,height:32}}/></>}
            {e.s?.fill!==undefined&&<><label style={pl}>Remplissage</label><input type="color" value={e.s.fill} onChange={ev=>patchS({fill:ev.target.value})} style={{...inp,padding:2,height:32}}/></>}
            {e.s?.opacity!==undefined&&<><label style={pl}>Opacité {e.s.opacity}</label><input type="range" min="0" max="1" step="0.05" value={e.s.opacity} onChange={ev=>patchS({opacity:parseFloat(ev.target.value)})} style={{width:'100%'}}/></>}
            {e.s?.borderRadius!==undefined&&<><label style={pl}>Arrondi</label><input type="number" value={e.s.borderRadius} onChange={ev=>patchS({borderRadius:parseInt(ev.target.value)||0})} style={inp}/></>}
            {e.s?.borderWidth!==undefined&&<><label style={pl}>Bordure px</label><input type="number" value={e.s.borderWidth} onChange={ev=>patchS({borderWidth:parseInt(ev.target.value)||0})} style={inp}/></>}
            {e.s?.borderColor!==undefined&&<><label style={pl}>Couleur bordure</label><input type="color" value={e.s.borderColor} onChange={ev=>patchS({borderColor:ev.target.value})} style={{...inp,padding:2,height:32}}/></>}
            {e.s?.textShadow!==undefined&&<><label style={pl}>Ombre texte</label><input value={e.s.textShadow} onChange={ev=>patchS({textShadow:ev.target.value})} style={inp} placeholder="0 2px 4px rgba(0,0,0,0.3)"/></>}
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:6}}>
              <button onClick={dup} style={tb(false)}>Dupliquer</button>
              <button onClick={front} style={tb(false)}>Avancer</button>
              <button onClick={back} style={tb(false)}>Reculer</button>
              <button onClick={del} style={{...tb(false),background:'#ef4444'}}>Supprimer</button>
            </div>
          </div>}

          {tab==='props'&&!e&&<div style={{color:'var(--text-muted)',fontSize:'0.85rem',textAlign:'center',padding:20}}>Sélectionnez un élément pour modifier ses propriétés</div>}

          {tab==='ai'&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={ph}>IA — Génération layout</div>
            <textarea value={aiBrief} onChange={ev=>setAiBrief(ev.target.value)} style={{...inp,minHeight:80,resize:'vertical'}} placeholder="Décrivez votre visuel : campagne fintech Afrique, ton sobre, 4 piliers..."/>
            <button onClick={genAI} disabled={aiLoad} style={{...tb(false),width:'100%',padding:10}}>{aiLoad?'Génération…':'✨ Générer avec IA'}</button>
            {aiErr&&<div style={{color:'#fca5a5',fontSize:'0.82rem'}}>{aiErr}</div>}
            <div style={{fontSize:'0.72rem',color:'var(--text-muted)',marginTop:4}}>L'IA génère un layout complet avec positions, tailles et couleurs.</div>
          </div>}
        </div>
      </div>
    </main>
  )
}

const ss={padding:'7px 10px',borderRadius:9,border:'1px solid var(--border)',background:'var(--bg-card)',color:'var(--text-primary)',fontSize:'0.82rem',fontFamily:'inherit'}
const inp={width:'100%',padding:'7px 9px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg-primary)',color:'var(--text-primary)',fontSize:'0.82rem',fontFamily:'inherit',boxSizing:'border-box'}
const tb=(on)=>({padding:'6px 10px',borderRadius:8,border:'1px solid var(--border)',background:on?'rgba(59,130,246,0.15)':'var(--bg-card)',color:on?'#60a5fa':'var(--text-secondary)',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',fontFamily:'inherit'})
const lb={padding:'8px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg-primary)',color:'var(--text-secondary)',fontSize:'0.82rem',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}
const ph={fontSize:'0.72rem',fontWeight:800,color:'var(--text-muted)',letterSpacing:1,textTransform:'uppercase'}
const pl={fontSize:'0.75rem',color:'var(--text-secondary)',marginBottom:2}
