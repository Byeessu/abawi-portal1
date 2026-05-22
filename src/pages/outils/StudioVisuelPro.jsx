import { useState, useRef, useEffect, useCallback } from 'react'
import SEO from '../../components/SEO'
import { callGroqJSON } from '../../lib/groqClient'
import { generateImage, pollPrediction } from '../../lib/replicateClient'

/* ─── Font loader ─── */
const GFONTS = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Playfair+Display:wght@400;700;900&family=Oswald:wght@400;600;700&family=Raleway:wght@400;700;900&family=Pacifico&family=Nunito:wght@400;700;900&display=swap'

const FONTS = [
  { value: 'Inter, sans-serif',              label: 'Inter' },
  { value: 'Montserrat, sans-serif',         label: 'Montserrat' },
  { value: 'Raleway, sans-serif',            label: 'Raleway' },
  { value: 'Oswald, sans-serif',             label: 'Oswald' },
  { value: 'Nunito, sans-serif',             label: 'Nunito' },
  { value: 'Georgia, serif',                 label: 'Georgia' },
  { value: '"Playfair Display", serif',      label: 'Playfair Display' },
  { value: 'Arial, sans-serif',              label: 'Arial' },
  { value: '"Courier New", monospace',       label: 'Courier' },
  { value: 'Pacifico, cursive',              label: 'Pacifico' },
]

const CATEGORIES = [
  { id: 'all',         label: 'Tous' },
  { id: 'instagram',   label: 'Instagram' },
  { id: 'tiktok',      label: 'TikTok' },
  { id: 'facebook',    label: 'Facebook' },
  { id: 'linkedin',    label: 'LinkedIn' },
  { id: 'twitter',     label: 'Twitter / X' },
  { id: 'youtube',     label: 'YouTube' },
  { id: 'flyer',       label: 'Flyers' },
  { id: 'menu',        label: 'Menus & Prix' },
  { id: 'quote',       label: 'Citations' },
  { id: 'certificate', label: 'Certificats' },
  { id: 'business',    label: 'Business' },
  { id: 'email',       label: 'E-mail' },
]

function grad(c1, c2, angle = 135) { return { type: 'gradient', color1: c1, color2: c2, angle } }
function solid(color) { return { type: 'solid', color } }

/* ── Background helpers ── */
function radial(cx, cy, r, c1, c2) { return { type: 'radial', cx, cy, r, color1: c1, color2: c2 } }

/* ══════════════════════════════════════════════════════════════════
   TEMPLATES  (46 templates — pro design)
══════════════════════════════════════════════════════════════════ */
const P = Math.PI  // shorthand for arc values

const TEMPLATES = [
  /* ── INSTAGRAM ── */
  { id:'ig-bold', name:'Bold Statement', category:'instagram', w:1080, h:1080,
    bg: grad('#0F172A','#1E293B'),
    layers:[
      {id:'l1',type:'text',text:'VOTRE MESSAGE',x:0.1,y:0.36,w:0.8,align:'center',font:'Montserrat, sans-serif',size:88,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Sous-titre accrocheur ici',x:0.1,y:0.52,w:0.8,align:'center',font:'Inter, sans-serif',size:34,weight:400,color:'#94A3B8'},
      {id:'l3',type:'text',text:'● @votrecompte',x:0.1,y:0.87,w:0.8,align:'center',font:'Inter, sans-serif',size:26,weight:600,color:'#38BDF8'},
    ]},
  { id:'ig-gradient', name:'Gradient Vif', category:'instagram', w:1080, h:1080,
    bg: grad('#7C3AED','#EC4899'),
    layers:[
      {id:'l1',type:'text',text:'TITRE PRINCIPAL',x:0.08,y:0.36,w:0.84,align:'center',font:'Montserrat, sans-serif',size:92,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Une description courte et percutante',x:0.1,y:0.54,w:0.8,align:'center',font:'Inter, sans-serif',size:32,weight:400,color:'rgba(255,255,255,0.85)'},
      {id:'l3',type:'text',text:'www.votresite.com',x:0.1,y:0.89,w:0.8,align:'center',font:'Inter, sans-serif',size:24,weight:700,color:'rgba(255,255,255,0.65)'},
    ]},
  { id:'ig-minimal', name:'Minimaliste', category:'instagram', w:1080, h:1080,
    bg: solid('#FAFAF9'),
    layers:[
      {id:'l1',type:'text',text:'Titre élégant',x:0.08,y:0.4,w:0.84,align:'center',font:'"Playfair Display", serif',size:72,weight:700,color:'#1C1917'},
      {id:'l2',type:'text',text:'──────────────────',x:0.08,y:0.52,w:0.84,align:'center',font:'Inter, sans-serif',size:22,weight:400,color:'#D4B896'},
      {id:'l3',type:'text',text:'Votre description ici',x:0.1,y:0.6,w:0.8,align:'center',font:'"Playfair Display", serif',size:30,weight:400,color:'#78716C'},
    ]},
  { id:'ig-story', name:'Story Annonce', category:'instagram', w:1080, h:1920,
    bg: grad('#0EA5E9','#0284C7'),
    layers:[
      {id:'l1',type:'text',text:'ANNONCE',x:0.1,y:0.22,w:0.8,align:'center',font:'Montserrat, sans-serif',size:48,weight:900,color:'rgba(255,255,255,0.7)'},
      {id:'l2',type:'text',text:"Titre de\nl'événement",x:0.08,y:0.3,w:0.84,align:'center',font:'Montserrat, sans-serif',size:88,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'📅 Date · Lieu · Heure',x:0.1,y:0.54,w:0.8,align:'center',font:'Inter, sans-serif',size:34,weight:500,color:'rgba(255,255,255,0.9)'},
      {id:'l4',type:'text',text:'Swipe up pour en savoir plus ↑',x:0.1,y:0.88,w:0.8,align:'center',font:'Inter, sans-serif',size:26,weight:600,color:'rgba(255,255,255,0.75)'},
    ]},
  { id:'ig-promo', name:'Promo Produit', category:'instagram', w:1080, h:1080,
    bg: grad('#F59E0B','#D97706'),
    layers:[
      {id:'l1',type:'text',text:'🔥 PROMO',x:0.1,y:0.14,w:0.8,align:'center',font:'Montserrat, sans-serif',size:50,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'-50%',x:0.05,y:0.26,w:0.9,align:'center',font:'Montserrat, sans-serif',size:200,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'Sur tous les articles',x:0.1,y:0.68,w:0.8,align:'center',font:'Inter, sans-serif',size:42,weight:700,color:'rgba(0,0,0,0.55)'},
      {id:'l4',type:'text',text:"Offre valable jusqu'au JJ/MM",x:0.1,y:0.8,w:0.8,align:'center',font:'Inter, sans-serif',size:28,weight:500,color:'rgba(0,0,0,0.45)'},
    ]},
  { id:'sn-annonce', name:'🇸🇳 Annonce Sénégal', category:'instagram', w:1080, h:1080,
    bg: grad('#006B3F','#03784A'),
    layers:[
      {id:'l1',type:'text',text:'🇸🇳 SÉNÉGAL',x:0.06,y:0.1,w:0.88,align:'center',font:'Montserrat, sans-serif',size:42,weight:900,color:'#FFCD00'},
      {id:'l2',type:'text',text:'TITRE\nPRINCIPAL',x:0.06,y:0.2,w:0.88,align:'center',font:'Montserrat, sans-serif',size:96,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'Votre message ou description ici',x:0.08,y:0.56,w:0.84,align:'center',font:'Inter, sans-serif',size:34,weight:500,color:'rgba(255,255,255,0.9)'},
      {id:'l4',type:'text',text:'📍 Dakar · Sénégal',x:0.08,y:0.72,w:0.84,align:'center',font:'Inter, sans-serif',size:28,weight:600,color:'#FFCD00'},
      {id:'l5',type:'text',text:'@votrecompte',x:0.08,y:0.88,w:0.84,align:'center',font:'Inter, sans-serif',size:24,weight:500,color:'rgba(255,255,255,0.55)'},
    ]},
  { id:'sn-fete', name:'🇸🇳 Fête Religieuse', category:'instagram', w:1080, h:1080,
    bg: grad('#1A0A00','#2D1600'),
    layers:[
      {id:'l1',type:'text',text:'☪ عيد مبارك',x:0.06,y:0.12,w:0.88,align:'center',font:'Georgia, serif',size:50,weight:700,color:'#C9A84C'},
      {id:'l2',type:'text',text:'Aïd Moubarak',x:0.06,y:0.3,w:0.88,align:'center',font:'"Playfair Display", serif',size:80,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'Que cette fête vous apporte\njoie et bénédictions',x:0.08,y:0.52,w:0.84,align:'center',font:'Georgia, serif',size:30,weight:400,color:'#D4B896'},
      {id:'l4',type:'text',text:'✨ Votre Famille / Organisation ✨',x:0.08,y:0.82,w:0.84,align:'center',font:'Georgia, serif',size:26,weight:600,color:'#C9A84C'},
    ]},
  { id:'ig-reel', name:'Reels Thumbnail', category:'instagram', w:1080, h:1920,
    bg: grad('#18181B','#27272A'),
    layers:[
      {id:'l1',type:'text',text:'▶',x:0.06,y:0.38,w:0.88,align:'center',font:'Inter, sans-serif',size:120,weight:900,color:'rgba(255,255,255,0.15)'},
      {id:'l2',type:'text',text:'NOUVEAU\nREEL',x:0.06,y:0.44,w:0.88,align:'center',font:'Montserrat, sans-serif',size:100,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'Sujet de la vidéo en quelques mots',x:0.08,y:0.68,w:0.84,align:'center',font:'Inter, sans-serif',size:38,weight:500,color:'#A1A1AA'},
      {id:'l4',type:'text',text:'@votrecompte',x:0.08,y:0.88,w:0.84,align:'center',font:'Inter, sans-serif',size:28,weight:700,color:'#22D3EE'},
    ]},

  /* ── TIKTOK ── */
  { id:'tiktok-hook', name:'Hook TikTok', category:'tiktok', w:1080, h:1920,
    bg: solid('#000000'),
    layers:[
      {id:'l1',type:'rect',x:0,y:0,w:1,h:0.08,color:'#FF0050'},
      {id:'l2',type:'text',text:'POV :',x:0.06,y:0.01,w:0.88,align:'left',font:'Montserrat, sans-serif',size:44,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'Tu découvres\ncette astuce\npour la première\nfois',x:0.06,y:0.16,w:0.88,align:'left',font:'Montserrat, sans-serif',size:82,weight:900,color:'#FFFFFF'},
      {id:'l4',type:'text',text:'🎵 Son original · @votrecompte',x:0.06,y:0.88,w:0.88,align:'left',font:'Inter, sans-serif',size:28,weight:500,color:'rgba(255,255,255,0.7)'},
    ]},
  { id:'tiktok-challenge', name:'Challenge', category:'tiktok', w:1080, h:1920,
    bg: grad('#FF0080','#FF6B00'),
    layers:[
      {id:'l1',type:'text',text:'#CHALLENGE',x:0.06,y:0.1,w:0.88,align:'center',font:'Montserrat, sans-serif',size:64,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'PARTICIPE\nMAINTENANT !',x:0.06,y:0.24,w:0.88,align:'center',font:'Montserrat, sans-serif',size:96,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'Tag 3 amis ⬇',x:0.06,y:0.56,w:0.88,align:'center',font:'Inter, sans-serif',size:44,weight:700,color:'rgba(255,255,255,0.9)'},
      {id:'l4',type:'text',text:'@votrecompte',x:0.06,y:0.88,w:0.88,align:'center',font:'Inter, sans-serif',size:30,weight:600,color:'rgba(255,255,255,0.65)'},
    ]},
  { id:'tiktok-product', name:'Produit TikTok', category:'tiktok', w:1080, h:1920,
    bg: grad('#0F0F0F','#1A1A1A'),
    layers:[
      {id:'l1',type:'text',text:'🔥 NOUVEAU',x:0.06,y:0.08,w:0.88,align:'center',font:'Montserrat, sans-serif',size:46,weight:900,color:'#FF0050'},
      {id:'l2',type:'text',text:'Nom du\nProduit',x:0.06,y:0.18,w:0.88,align:'center',font:'Montserrat, sans-serif',size:96,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'Prix : 25 000 FCFA',x:0.06,y:0.52,w:0.88,align:'center',font:'Oswald, sans-serif',size:60,weight:700,color:'#FF0050'},
      {id:'l4',type:'text',text:'Lien en bio ☝️',x:0.06,y:0.66,w:0.88,align:'center',font:'Inter, sans-serif',size:40,weight:600,color:'#FFFFFF'},
      {id:'l5',type:'text',text:'@votrecompte · TikTok',x:0.06,y:0.88,w:0.88,align:'center',font:'Inter, sans-serif',size:28,weight:400,color:'rgba(255,255,255,0.5)'},
    ]},
  { id:'tiktok-tips', name:'Conseils TikTok', category:'tiktok', w:1080, h:1920,
    bg: grad('#1E1B4B','#312E81'),
    layers:[
      {id:'l1',type:'text',text:'3 astuces que\ntu ne connais\npas encore 🤫',x:0.06,y:0.1,w:0.88,align:'center',font:'Montserrat, sans-serif',size:76,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'1️⃣ Astuce numéro un ici',x:0.06,y:0.48,w:0.88,align:'left',font:'Inter, sans-serif',size:38,weight:600,color:'#A5B4FC'},
      {id:'l3',type:'text',text:'2️⃣ Deuxième astuce clé',x:0.06,y:0.58,w:0.88,align:'left',font:'Inter, sans-serif',size:38,weight:600,color:'#A5B4FC'},
      {id:'l4',type:'text',text:'3️⃣ Troisième conseil pro',x:0.06,y:0.68,w:0.88,align:'left',font:'Inter, sans-serif',size:38,weight:600,color:'#A5B4FC'},
      {id:'l5',type:'text',text:'Sauvegarde ce post 📌 @votrecompte',x:0.06,y:0.88,w:0.88,align:'center',font:'Inter, sans-serif',size:26,weight:500,color:'rgba(255,255,255,0.55)'},
    ]},

  /* ── FACEBOOK ── */
  { id:'fb-post', name:'Post Facebook', category:'facebook', w:1200, h:628,
    bg: grad('#1D4ED8','#2563EB'),
    layers:[
      {id:'l1',type:'text',text:'Titre de votre publication',x:0.06,y:0.22,w:0.88,align:'center',font:'Montserrat, sans-serif',size:68,weight:800,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Décrivez votre message en quelques mots percutants',x:0.08,y:0.52,w:0.84,align:'center',font:'Inter, sans-serif',size:30,weight:400,color:'rgba(255,255,255,0.85)'},
      {id:'l3',type:'text',text:'👉 En savoir plus · votresite.com',x:0.08,y:0.76,w:0.84,align:'center',font:'Inter, sans-serif',size:24,weight:600,color:'#93C5FD'},
    ]},
  { id:'fb-cover', name:'Couverture Facebook', category:'facebook', w:820, h:312,
    bg: grad('#111827','#1F2937'),
    layers:[
      {id:'l1',type:'text',text:'Votre Nom / Marque',x:0.05,y:0.26,w:0.6,align:'left',font:'Montserrat, sans-serif',size:52,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Votre slogan ou description',x:0.05,y:0.56,w:0.6,align:'left',font:'Inter, sans-serif',size:24,weight:400,color:'#9CA3AF'},
      {id:'l3',type:'text',text:'www.votresite.com',x:0.05,y:0.76,w:0.6,align:'left',font:'Inter, sans-serif',size:20,weight:600,color:'#38BDF8'},
    ]},
  { id:'fb-event', name:'Événement Facebook', category:'facebook', w:1200, h:628,
    bg: grad('#4F46E5','#7C3AED'),
    layers:[
      {id:'l1',type:'text',text:'📣 ÉVÉNEMENT',x:0.06,y:0.12,w:0.88,align:'center',font:'Inter, sans-serif',size:34,weight:700,color:'rgba(255,255,255,0.7)'},
      {id:'l2',type:'text',text:"Nom de l'événement",x:0.06,y:0.26,w:0.88,align:'center',font:'Montserrat, sans-serif',size:72,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'📅 Samedi 14 Juin 2026 · 18h00',x:0.08,y:0.6,w:0.84,align:'center',font:'Inter, sans-serif',size:30,weight:500,color:'#C4B5FD'},
      {id:'l4',type:'text',text:"📍 Adresse ou lieu de l'événement",x:0.08,y:0.76,w:0.84,align:'center',font:'Inter, sans-serif',size:26,weight:400,color:'rgba(255,255,255,0.7)'},
    ]},

  /* ── LINKEDIN ── */
  { id:'li-post', name:'Post LinkedIn', category:'linkedin', w:1200, h:627,
    bg: solid('#FFFFFF'),
    layers:[
      {id:'l1',type:'text',text:'Titre professionnel accrocheur',x:0.06,y:0.2,w:0.88,align:'left',font:'Montserrat, sans-serif',size:54,weight:800,color:'#0F172A'},
      {id:'l2',type:'text',text:'Votre insight ou apprentissage clé ici.',x:0.06,y:0.46,w:0.88,align:'left',font:'"Playfair Display", serif',size:30,weight:400,color:'#334155'},
      {id:'l3',type:'text',text:'— Votre Nom · Titre/Poste',x:0.06,y:0.74,w:0.88,align:'left',font:'Inter, sans-serif',size:22,weight:600,color:'#0284C7'},
    ]},
  { id:'li-banner', name:'Bannière LinkedIn', category:'linkedin', w:1584, h:396,
    bg: grad('#0F172A','#1E3A5F'),
    layers:[
      {id:'l1',type:'text',text:'Votre Nom Complet',x:0.04,y:0.22,w:0.55,align:'left',font:'Montserrat, sans-serif',size:62,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Poste · Entreprise · Ville',x:0.04,y:0.52,w:0.55,align:'left',font:'Inter, sans-serif',size:26,weight:400,color:'#94A3B8'},
      {id:'l3',type:'text',text:'✉ email@exemple.com',x:0.04,y:0.72,w:0.55,align:'left',font:'Inter, sans-serif',size:22,weight:600,color:'#38BDF8'},
    ]},
  { id:'li-tips', name:'Conseils Pro LinkedIn', category:'linkedin', w:1200, h:627,
    bg: grad('#065F46','#047857'),
    layers:[
      {id:'l1',type:'text',text:'5 conseils pour',x:0.06,y:0.14,w:0.88,align:'center',font:'Inter, sans-serif',size:40,weight:500,color:'rgba(255,255,255,0.8)'},
      {id:'l2',type:'text',text:'Votre Sujet\nProfessionnel',x:0.06,y:0.26,w:0.88,align:'center',font:'Montserrat, sans-serif',size:68,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'1. Premier conseil important',x:0.08,y:0.63,w:0.84,align:'left',font:'Inter, sans-serif',size:26,weight:500,color:'#A7F3D0'},
      {id:'l4',type:'text',text:'2. Deuxième conseil clé',x:0.08,y:0.78,w:0.84,align:'left',font:'Inter, sans-serif',size:26,weight:500,color:'#A7F3D0'},
    ]},

  /* ── TWITTER / X ── */
  { id:'tw-post', name:'Post X / Twitter', category:'twitter', w:1200, h:675,
    bg: solid('#000000'),
    layers:[
      {id:'l1',type:'text',text:'Votre tweet ou actu\nen image',x:0.06,y:0.24,w:0.88,align:'left',font:'Inter, sans-serif',size:64,weight:800,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'@votrecompte · twitter.com',x:0.06,y:0.74,w:0.88,align:'left',font:'Inter, sans-serif',size:24,weight:500,color:'#71717A'},
      {id:'logo',type:'text',text:'𝕏',x:0.84,y:0.72,w:0.12,align:'center',font:'Inter, sans-serif',size:50,weight:900,color:'#FFFFFF'},
    ]},
  { id:'tw-header', name:'Header Twitter / X', category:'twitter', w:1500, h:500,
    bg: grad('#0F172A','#1E293B'),
    layers:[
      {id:'l1',type:'text',text:'Votre Nom / Marque',x:0.05,y:0.28,w:0.65,align:'left',font:'Montserrat, sans-serif',size:72,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Bio courte · Domaine · Localisation',x:0.05,y:0.56,w:0.65,align:'left',font:'Inter, sans-serif',size:28,weight:400,color:'#94A3B8'},
      {id:'l3',type:'text',text:'votresite.com',x:0.05,y:0.74,w:0.65,align:'left',font:'Inter, sans-serif',size:24,weight:600,color:'#38BDF8'},
    ]},
  { id:'tw-quote', name:'Citation Twitter', category:'twitter', w:1200, h:675,
    bg: grad('#1C1917','#292524'),
    layers:[
      {id:'l1',type:'text',text:'"',x:0.04,y:0.06,w:0.2,align:'left',font:'Georgia, serif',size:120,weight:700,color:'rgba(255,255,255,0.15)'},
      {id:'l2',type:'text',text:'Votre citation ou pensée\nforte ici',x:0.06,y:0.24,w:0.88,align:'center',font:'"Playfair Display", serif',size:50,weight:700,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'— Auteur ou Votre Nom',x:0.06,y:0.72,w:0.88,align:'center',font:'Inter, sans-serif',size:24,weight:500,color:'#D6D3D1'},
    ]},

  /* ── YOUTUBE ── */
  { id:'yt-thumb', name:'Miniature YouTube', category:'youtube', w:1280, h:720,
    bg: grad('#DC2626','#991B1B'),
    layers:[
      {id:'l1',type:'text',text:'TITRE DE\nVOTRE VIDÉO',x:0.04,y:0.1,w:0.7,align:'left',font:'Montserrat, sans-serif',size:100,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'▶ REGARDER MAINTENANT',x:0.04,y:0.78,w:0.7,align:'left',font:'Inter, sans-serif',size:28,weight:700,color:'#FEF08A'},
    ]},
  { id:'yt-banner', name:'Bannière YouTube', category:'youtube', w:2560, h:1440,
    bg: grad('#111827','#1E3A5F'),
    layers:[
      {id:'l1',type:'text',text:'Nom de votre chaîne',x:0.1,y:0.34,w:0.8,align:'center',font:'Montserrat, sans-serif',size:130,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Nouvelle vidéo chaque semaine · Abonnez-vous !',x:0.1,y:0.54,w:0.8,align:'center',font:'Inter, sans-serif',size:56,weight:500,color:'#94A3B8'},
    ]},
  { id:'yt-short', name:'YouTube Shorts', category:'youtube', w:1080, h:1920,
    bg: grad('#FF0000','#CC0000'),
    layers:[
      {id:'l1',type:'text',text:'#SHORTS',x:0.06,y:0.06,w:0.88,align:'center',font:'Montserrat, sans-serif',size:50,weight:900,color:'rgba(255,255,255,0.6)'},
      {id:'l2',type:'text',text:'TITRE DE\nVOTRE\nSHORT',x:0.06,y:0.18,w:0.88,align:'center',font:'Montserrat, sans-serif',size:96,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'▶ REGARDER',x:0.06,y:0.62,w:0.88,align:'center',font:'Oswald, sans-serif',size:56,weight:700,color:'#FEF08A'},
      {id:'l4',type:'text',text:'@votrecompte',x:0.06,y:0.88,w:0.88,align:'center',font:'Inter, sans-serif',size:30,weight:600,color:'rgba(255,255,255,0.65)'},
    ]},
  { id:'wa-status', name:'Statut WhatsApp', category:'youtube', w:1080, h:1920,
    bg: grad('#10B981','#059669'),
    layers:[
      {id:'l1',type:'text',text:'BONNE\nNOUVELLE !',x:0.08,y:0.28,w:0.84,align:'center',font:'Montserrat, sans-serif',size:96,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Partagez votre message\npositif ici',x:0.08,y:0.54,w:0.84,align:'center',font:'Inter, sans-serif',size:38,weight:400,color:'rgba(255,255,255,0.9)'},
      {id:'l3',type:'text',text:'🌟',x:0.08,y:0.78,w:0.84,align:'center',font:'Inter, sans-serif',size:64,weight:400,color:'#FFFFFF'},
    ]},

  /* ── FLYERS ── */
  { id:'flyer-event', name:'Flyer Événement', category:'flyer', w:794, h:1123,
    bg: grad('#1A1A2E','#16213E'),
    layers:[
      {id:'l1',type:'text',text:'VOUS ÊTES INVITÉ',x:0.08,y:0.1,w:0.84,align:'center',font:'Raleway, sans-serif',size:34,weight:700,color:'#F59E0B'},
      {id:'l2',type:'text',text:"NOM DE\nL'ÉVÉNEMENT",x:0.06,y:0.18,w:0.88,align:'center',font:'Montserrat, sans-serif',size:76,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'────────────────────',x:0.06,y:0.44,w:0.88,align:'center',font:'Inter, sans-serif',size:20,weight:400,color:'#F59E0B'},
      {id:'l4',type:'text',text:'📅 Samedi 14 Juin 2026\n⏰ 18h00 – 23h00\n📍 Votre adresse ici',x:0.1,y:0.49,w:0.8,align:'center',font:'Inter, sans-serif',size:30,weight:500,color:'#E2E8F0'},
      {id:'l5',type:'text',text:'Réservation : +221 XX XXX XX XX',x:0.08,y:0.79,w:0.84,align:'center',font:'Inter, sans-serif',size:26,weight:600,color:'#F59E0B'},
      {id:'l6',type:'text',text:'www.votresite.com · @votrecompte',x:0.08,y:0.88,w:0.84,align:'center',font:'Inter, sans-serif',size:20,weight:400,color:'#64748B'},
    ]},
  { id:'flyer-job', name:"Offre d'Emploi", category:'flyer', w:794, h:1123,
    bg: solid('#FFFFFF'),
    layers:[
      {id:'bar',type:'rect',x:0,y:0,w:1,h:0.14,color:'#1D4ED8'},
      {id:'l1',type:'text',text:"OFFRE D'EMPLOI",x:0.06,y:0.04,w:0.88,align:'center',font:'Montserrat, sans-serif',size:42,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Nom du Poste',x:0.06,y:0.21,w:0.88,align:'center',font:'Montserrat, sans-serif',size:60,weight:800,color:'#1E293B'},
      {id:'l3',type:'text',text:'Entreprise · Ville · Type de contrat',x:0.06,y:0.35,w:0.88,align:'center',font:'Inter, sans-serif',size:26,weight:500,color:'#475569'},
      {id:'l4',type:'text',text:'▸ Mission principale 1\n▸ Mission principale 2\n▸ Mission principale 3',x:0.08,y:0.52,w:0.84,align:'left',font:'Inter, sans-serif',size:22,weight:400,color:'#334155'},
      {id:'l5',type:'text',text:'📩 recrutement@email.com',x:0.08,y:0.82,w:0.84,align:'center',font:'Inter, sans-serif',size:24,weight:600,color:'#1D4ED8'},
    ]},
  { id:'flyer-conference', name:'Conférence / Séminaire', category:'flyer', w:794, h:1123,
    bg: grad('#0C4A6E','#075985'),
    layers:[
      {id:'l1',type:'text',text:'CONFÉRENCE',x:0.06,y:0.07,w:0.88,align:'center',font:'Raleway, sans-serif',size:40,weight:900,color:'rgba(255,255,255,0.6)'},
      {id:'l2',type:'text',text:'Titre de la\nConférence',x:0.06,y:0.16,w:0.88,align:'center',font:'Montserrat, sans-serif',size:74,weight:900,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'Conférencier Principal\nExpert · Domaine',x:0.06,y:0.44,w:0.88,align:'center',font:'Inter, sans-serif',size:30,weight:500,color:'#BAE6FD'},
      {id:'l4',type:'text',text:'📅 Date · ⏰ Heure\n📍 Lieu de la conférence',x:0.08,y:0.62,w:0.84,align:'center',font:'Inter, sans-serif',size:28,weight:500,color:'#E0F2FE'},
      {id:'l5',type:'text',text:'Entrée libre · Places limitées',x:0.08,y:0.8,w:0.84,align:'center',font:'Inter, sans-serif',size:24,weight:600,color:'#FEF08A'},
      {id:'l6',type:'text',text:'Inscription : +221 XX XXX XX XX',x:0.08,y:0.88,w:0.84,align:'center',font:'Inter, sans-serif',size:20,weight:400,color:'rgba(255,255,255,0.55)'},
    ]},
  { id:'flyer-formation', name:'Formation / Atelier', category:'flyer', w:794, h:1123,
    bg: solid('#F8FAFC'),
    layers:[
      {id:'bar',type:'rect',x:0,y:0,w:1,h:0.12,color:'#059669'},
      {id:'l1',type:'text',text:'FORMATION',x:0.06,y:0.02,w:0.88,align:'center',font:'Montserrat, sans-serif',size:38,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Titre de la\nFormation',x:0.06,y:0.18,w:0.88,align:'center',font:'Montserrat, sans-serif',size:64,weight:900,color:'#1E293B'},
      {id:'l3',type:'text',text:'Ce que vous apprendrez :',x:0.06,y:0.38,w:0.88,align:'left',font:'Inter, sans-serif',size:22,weight:700,color:'#059669'},
      {id:'l4',type:'text',text:'✅ Module 1 — Description\n✅ Module 2 — Description\n✅ Module 3 — Description\n✅ Certificat de formation offert',x:0.06,y:0.44,w:0.88,align:'left',font:'Inter, sans-serif',size:22,weight:400,color:'#334155'},
      {id:'l5',type:'text',text:'Prix : 50 000 FCFA',x:0.06,y:0.72,w:0.88,align:'center',font:'Oswald, sans-serif',size:42,weight:700,color:'#059669'},
      {id:'l6',type:'text',text:'📞 +221 XX XXX XX XX\n✉ contact@email.com',x:0.06,y:0.84,w:0.88,align:'center',font:'Inter, sans-serif',size:22,weight:500,color:'#0284C7'},
    ]},
  { id:'flyer-promo', name:'Flyer Promo', category:'flyer', w:794, h:1123,
    bg: grad('#DC2626','#B91C1C'),
    layers:[
      {id:'l1',type:'text',text:'SUPER\nSOLDES',x:0.05,y:0.06,w:0.9,align:'center',font:'Montserrat, sans-serif',size:130,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:"JUSQU'À",x:0.05,y:0.42,w:0.9,align:'center',font:'Inter, sans-serif',size:38,weight:500,color:'rgba(255,255,255,0.8)'},
      {id:'l3',type:'text',text:'70%',x:0.05,y:0.48,w:0.9,align:'center',font:'Montserrat, sans-serif',size:190,weight:900,color:'#FEF08A'},
      {id:'l4',type:'text',text:'DE RÉDUCTION',x:0.05,y:0.78,w:0.9,align:'center',font:'Montserrat, sans-serif',size:38,weight:800,color:'#FFFFFF'},
    ]},
  { id:'flyer-mariage', name:'Mariage / Cérémonie', category:'flyer', w:794, h:1123,
    bg: grad('#FDF2F8','#FCE7F3'),
    layers:[
      {id:'bar',type:'rect',x:0.05,y:0.04,w:0.9,h:0.92,color:'#F9A8D4',outline:true},
      {id:'l1',type:'text',text:'Vous êtes cordialement invités',x:0.08,y:0.1,w:0.84,align:'center',font:'"Playfair Display", serif',size:24,weight:400,color:'#9D174D'},
      {id:'l2',type:'text',text:'Prénom & Prénom',x:0.08,y:0.24,w:0.84,align:'center',font:'Pacifico, cursive',size:60,weight:400,color:'#831843'},
      {id:'l3',type:'text',text:'❧ Célèbrent leur union ❧',x:0.08,y:0.46,w:0.84,align:'center',font:'"Playfair Display", serif',size:20,weight:400,color:'#BE185D'},
      {id:'l4',type:'text',text:'Samedi 14 Juin 2026',x:0.08,y:0.58,w:0.84,align:'center',font:'"Playfair Display", serif',size:32,weight:700,color:'#831843'},
      {id:'l5',type:'text',text:'18h00 · Salle des Fêtes, Dakar',x:0.08,y:0.68,w:0.84,align:'center',font:'Inter, sans-serif',size:24,weight:400,color:'#9D174D'},
      {id:'l6',type:'text',text:'RSVP avant le 01 Juin · +221 XX XXX XX XX',x:0.08,y:0.84,w:0.84,align:'center',font:'Inter, sans-serif',size:18,weight:500,color:'#BE185D'},
    ]},

  /* ── MENUS & PRIX ── */
  { id:'menu-resto', name:'Menu Restaurant', category:'menu', w:1080, h:1080,
    bg: grad('#1C0A00','#2D1600'),
    layers:[
      {id:'l1',type:'text',text:'🍽️ MENU DU JOUR',x:0.06,y:0.06,w:0.88,align:'center',font:'"Playfair Display", serif',size:44,weight:700,color:'#C9A84C'},
      {id:'sep1',type:'rect',x:0.3,y:0.17,w:0.4,h:0.004,color:'#C9A84C'},
      {id:'l2',type:'text',text:'Entrée',x:0.06,y:0.21,w:0.88,align:'center',font:'Georgia, serif',size:22,weight:400,color:'rgba(255,255,255,0.5)'},
      {id:'l3',type:'text',text:'Salade de Thiéboudienne Royale',x:0.06,y:0.28,w:0.7,align:'left',font:'Georgia, serif',size:28,weight:500,color:'#FFFFFF'},
      {id:'l4',type:'text',text:'2 500 F',x:0.76,y:0.28,w:0.2,align:'right',font:'Georgia, serif',size:28,weight:700,color:'#C9A84C'},
      {id:'sep2',type:'rect',x:0.06,y:0.39,w:0.88,h:0.002,color:'rgba(201,168,76,0.3)'},
      {id:'l5',type:'text',text:'Plat Principal',x:0.06,y:0.43,w:0.88,align:'center',font:'Georgia, serif',size:22,weight:400,color:'rgba(255,255,255,0.5)'},
      {id:'l6',type:'text',text:'Poulet Yassa & Riz Parfumé',x:0.06,y:0.5,w:0.7,align:'left',font:'Georgia, serif',size:28,weight:500,color:'#FFFFFF'},
      {id:'l7',type:'text',text:'5 500 F',x:0.76,y:0.5,w:0.2,align:'right',font:'Georgia, serif',size:28,weight:700,color:'#C9A84C'},
      {id:'l8',type:'text',text:'Votre Restaurant · Dakar, Sénégal',x:0.06,y:0.88,w:0.88,align:'center',font:'Georgia, serif',size:20,weight:400,color:'rgba(255,255,255,0.4)'},
    ]},
  { id:'tarif-services', name:'Carte des Prix', category:'menu', w:794, h:1123,
    bg: solid('#0F172A'),
    layers:[
      {id:'l1',type:'text',text:'NOS TARIFS',x:0.06,y:0.06,w:0.88,align:'center',font:'Montserrat, sans-serif',size:52,weight:900,color:'#FFFFFF'},
      {id:'sep',type:'rect',x:0.3,y:0.16,w:0.4,h:0.004,color:'#22D3EE'},
      {id:'l2',type:'text',text:'Offre Starter',x:0.06,y:0.22,w:0.6,align:'left',font:'Inter, sans-serif',size:30,weight:700,color:'#FFFFFF'},
      {id:'p1',type:'text',text:'25 000 FCFA',x:0.58,y:0.22,w:0.36,align:'right',font:'Oswald, sans-serif',size:32,weight:700,color:'#22D3EE'},
      {id:'l3',type:'text',text:'Description de l\'offre de base ici',x:0.06,y:0.3,w:0.88,align:'left',font:'Inter, sans-serif',size:20,weight:400,color:'#94A3B8'},
      {id:'l4',type:'text',text:'Offre Pro',x:0.06,y:0.44,w:0.6,align:'left',font:'Inter, sans-serif',size:30,weight:700,color:'#FFFFFF'},
      {id:'p2',type:'text',text:'75 000 FCFA',x:0.58,y:0.44,w:0.36,align:'right',font:'Oswald, sans-serif',size:32,weight:700,color:'#22D3EE'},
      {id:'l5',type:'text',text:'Description de l\'offre intermédiaire',x:0.06,y:0.52,w:0.88,align:'left',font:'Inter, sans-serif',size:20,weight:400,color:'#94A3B8'},
      {id:'l6',type:'text',text:'Offre Elite',x:0.06,y:0.66,w:0.6,align:'left',font:'Inter, sans-serif',size:30,weight:700,color:'#FFFFFF'},
      {id:'p3',type:'text',text:'200 000 FCFA',x:0.52,y:0.66,w:0.42,align:'right',font:'Oswald, sans-serif',size:32,weight:700,color:'#F59E0B'},
      {id:'l7',type:'text',text:'Solution complète tout inclus',x:0.06,y:0.74,w:0.88,align:'left',font:'Inter, sans-serif',size:20,weight:400,color:'#94A3B8'},
      {id:'l8',type:'text',text:'contact@email.com · +221 XX XXX XX XX',x:0.06,y:0.9,w:0.88,align:'center',font:'Inter, sans-serif',size:20,weight:500,color:'#22D3EE'},
    ]},
  { id:'menu-digital', name:'Menu Digital Story', category:'menu', w:1080, h:1920,
    bg: grad('#0F172A','#1E293B'),
    layers:[
      {id:'l1',type:'text',text:'🍽️',x:0.06,y:0.08,w:0.88,align:'center',font:'Inter, sans-serif',size:80,weight:400,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Spécialités\ndu Jour',x:0.06,y:0.18,w:0.88,align:'center',font:'"Playfair Display", serif',size:80,weight:700,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'Thiéboudienne Royale ............... 5 000 F',x:0.06,y:0.38,w:0.88,align:'center',font:'Georgia, serif',size:32,weight:500,color:'#F1F5F9'},
      {id:'l4',type:'text',text:'Poulet Yassa .......................... 4 500 F',x:0.06,y:0.48,w:0.88,align:'center',font:'Georgia, serif',size:32,weight:500,color:'#F1F5F9'},
      {id:'l5',type:'text',text:'Mafé Bœuf ........................... 4 000 F',x:0.06,y:0.58,w:0.88,align:'center',font:'Georgia, serif',size:32,weight:500,color:'#F1F5F9'},
      {id:'l6',type:'text',text:'📍 Votre Restaurant · Dakar',x:0.06,y:0.78,w:0.88,align:'center',font:'Inter, sans-serif',size:30,weight:600,color:'#F59E0B'},
      {id:'l7',type:'text',text:'📞 +221 XX XXX XX XX',x:0.06,y:0.87,w:0.88,align:'center',font:'Inter, sans-serif',size:28,weight:500,color:'#94A3B8'},
    ]},

  /* ── CITATIONS ── */
  { id:'citation-motivation', name:'Motivation', category:'quote', w:1080, h:1080,
    bg: grad('#0F172A','#1E293B'),
    layers:[
      {id:'l1',type:'text',text:'"',x:0.04,y:0.04,w:0.25,align:'left',font:'Georgia, serif',size:180,weight:700,color:'rgba(255,255,255,0.08)'},
      {id:'l2',type:'text',text:'Le succès\nn\'est pas une\ndestination,\nc\'est un voyage.',x:0.08,y:0.22,w:0.84,align:'center',font:'"Playfair Display", serif',size:52,weight:700,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'— Auteur',x:0.08,y:0.72,w:0.84,align:'center',font:'Inter, sans-serif',size:24,weight:500,color:'#94A3B8'},
      {id:'line',type:'rect',x:0.35,y:0.82,w:0.3,h:0.004,color:'#38BDF8'},
      {id:'l4',type:'text',text:'@votrecompte',x:0.08,y:0.86,w:0.84,align:'center',font:'Inter, sans-serif',size:22,weight:600,color:'#38BDF8'},
    ]},
  { id:'citation-africaine', name:'Sagesse Africaine', category:'quote', w:1080, h:1080,
    bg: grad('#78350F','#92400E'),
    layers:[
      {id:'l1',type:'text',text:'🌍',x:0.06,y:0.09,w:0.88,align:'center',font:'Inter, sans-serif',size:70,weight:400,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'« Seul on va plus vite,\nensemble on va\nplus loin. »',x:0.06,y:0.24,w:0.88,align:'center',font:'"Playfair Display", serif',size:52,weight:700,color:'#FEFCE8'},
      {id:'l3',type:'text',text:'Proverbe africain',x:0.06,y:0.66,w:0.88,align:'center',font:'Georgia, serif',size:28,weight:400,color:'#FDE68A'},
      {id:'sep',type:'rect',x:0.3,y:0.76,w:0.4,h:0.004,color:'#FFCD00'},
      {id:'l4',type:'text',text:'@votrecompte',x:0.06,y:0.82,w:0.88,align:'center',font:'Inter, sans-serif',size:22,weight:600,color:'rgba(255,255,255,0.5)'},
    ]},
  { id:'citation-business', name:'Citation Business', category:'quote', w:1200, h:627,
    bg: solid('#FFFFFF'),
    layers:[
      {id:'bar',type:'rect',x:0,y:0,w:0.008,h:1,color:'#2563EB'},
      {id:'l1',type:'text',text:'"La meilleure\npublicité est\nun client satisfait."',x:0.05,y:0.14,w:0.9,align:'left',font:'"Playfair Display", serif',size:52,weight:700,color:'#1E293B'},
      {id:'l2',type:'text',text:'— Philip Kotler',x:0.05,y:0.72,w:0.9,align:'left',font:'Inter, sans-serif',size:24,weight:500,color:'#64748B'},
      {id:'l3',type:'text',text:'Votre Marque',x:0.05,y:0.84,w:0.9,align:'left',font:'Inter, sans-serif',size:22,weight:700,color:'#2563EB'},
    ]},
  { id:'citation-islamic', name:'Citation Islamique', category:'quote', w:1080, h:1080,
    bg: grad('#052e16','#14532d'),
    layers:[
      {id:'l1',type:'text',text:'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',x:0.06,y:0.08,w:0.88,align:'center',font:'Georgia, serif',size:36,weight:400,color:'#C9A84C'},
      {id:'sep',type:'rect',x:0.25,y:0.22,w:0.5,h:0.004,color:'rgba(201,168,76,0.4)'},
      {id:'l2',type:'text',text:'"Certes, après\nla difficulté\nvient la facilité."',x:0.06,y:0.28,w:0.88,align:'center',font:'"Playfair Display", serif',size:56,weight:700,color:'#FFFFFF'},
      {id:'l3',type:'text',text:'Coran, Sourate 94 — v.5',x:0.06,y:0.66,w:0.88,align:'center',font:'Georgia, serif',size:24,weight:400,color:'#C9A84C'},
      {id:'l4',type:'text',text:'☪ @votrecompte',x:0.06,y:0.85,w:0.88,align:'center',font:'Inter, sans-serif',size:22,weight:500,color:'rgba(255,255,255,0.45)'},
    ]},

  /* ── CERTIFICATES ── */
  { id:'cert-formation', name:'Certificat Formation', category:'certificate', w:1123, h:794,
    bg: solid('#FFFDF7'),
    layers:[
      {id:'border',type:'rect',x:0.025,y:0.035,w:0.95,h:0.93,color:'#C9A84C',outline:true},
      {id:'l1',type:'text',text:'CERTIFICAT DE FORMATION',x:0.05,y:0.1,w:0.9,align:'center',font:'"Playfair Display", serif',size:34,weight:700,color:'#78350F'},
      {id:'l2',type:'text',text:'Décerné à',x:0.05,y:0.26,w:0.9,align:'center',font:'Georgia, serif',size:20,weight:400,color:'#92400E'},
      {id:'l3',type:'text',text:'Prénom NOM',x:0.05,y:0.36,w:0.9,align:'center',font:'"Playfair Display", serif',size:46,weight:700,color:'#1C1917'},
      {id:'l4',type:'text',text:'"Titre de la Formation Complète"',x:0.05,y:0.63,w:0.9,align:'center',font:'Georgia, serif',size:30,weight:700,color:'#C9A84C'},
      {id:'l5',type:'text',text:'Dakar, le 14 Juin 2026',x:0.05,y:0.83,w:0.9,align:'center',font:'Georgia, serif',size:16,weight:400,color:'#78716C'},
    ]},
  { id:'cert-excellence', name:"Prix d'Excellence", category:'certificate', w:1123, h:794,
    bg: grad('#0F172A','#1E293B'),
    layers:[
      {id:'border',type:'rect',x:0.025,y:0.035,w:0.95,h:0.93,color:'#C9A84C',outline:true},
      {id:'l1',type:'text',text:'🏆',x:0.05,y:0.08,w:0.9,align:'center',font:'Inter, sans-serif',size:60,weight:400,color:'#C9A84C'},
      {id:'l2',type:'text',text:"PRIX D'EXCELLENCE",x:0.05,y:0.24,w:0.9,align:'center',font:'Montserrat, sans-serif',size:38,weight:900,color:'#C9A84C'},
      {id:'l3',type:'text',text:'Remis à',x:0.05,y:0.42,w:0.9,align:'center',font:'Inter, sans-serif',size:20,weight:400,color:'#94A3B8'},
      {id:'l4',type:'text',text:'Prénom NOM',x:0.05,y:0.52,w:0.9,align:'center',font:'"Playfair Display", serif',size:50,weight:700,color:'#FFFFFF'},
      {id:'l5',type:'text',text:'Pour ses performances exceptionnelles',x:0.05,y:0.7,w:0.9,align:'center',font:'Inter, sans-serif',size:22,weight:400,color:'#CBD5E1'},
      {id:'l6',type:'text',text:'Votre Organisation · 2026',x:0.05,y:0.84,w:0.9,align:'center',font:'Inter, sans-serif',size:18,weight:600,color:'#C9A84C'},
    ]},
  { id:'cert-participation', name:'Attestation', category:'certificate', w:1123, h:794,
    bg: grad('#EFF6FF','#DBEAFE'),
    layers:[
      {id:'l1',type:'text',text:'ATTESTATION DE PARTICIPATION',x:0.05,y:0.09,w:0.9,align:'center',font:'Montserrat, sans-serif',size:30,weight:900,color:'#1E40AF'},
      {id:'l2',type:'text',text:'Nous certifions que',x:0.05,y:0.26,w:0.9,align:'center',font:'Inter, sans-serif',size:19,weight:400,color:'#3B82F6'},
      {id:'l3',type:'text',text:'Prénom NOM',x:0.05,y:0.36,w:0.9,align:'center',font:'Montserrat, sans-serif',size:50,weight:800,color:'#1E3A8A'},
      {id:'l4',type:'text',text:'"Nom de l\'Événement"',x:0.05,y:0.64,w:0.9,align:'center',font:'Inter, sans-serif',size:28,weight:700,color:'#2563EB'},
      {id:'l5',type:'text',text:'Organisé par : Votre Organisation · Date : JJ/MM/AAAA',x:0.05,y:0.83,w:0.9,align:'center',font:'Inter, sans-serif',size:17,weight:500,color:'#64748B'},
    ]},

  /* ── BUSINESS ── */
  { id:'biz-card', name:'Carte de Visite', category:'business', w:1050, h:600,
    bg: grad('#0F172A','#1E293B'),
    layers:[
      {id:'l1',type:'text',text:'Prénom NOM',x:0.06,y:0.18,w:0.6,align:'left',font:'Montserrat, sans-serif',size:52,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Titre / Poste professionnel',x:0.06,y:0.4,w:0.6,align:'left',font:'Inter, sans-serif',size:22,weight:400,color:'#94A3B8'},
      {id:'sep',type:'rect',x:0.06,y:0.53,w:0.4,h:0.003,color:'#334155'},
      {id:'l3',type:'text',text:'📞 +221 XX XXX XX XX\n✉ email@exemple.com\n🌐 www.votresite.com',x:0.06,y:0.6,w:0.6,align:'left',font:'Inter, sans-serif',size:18,weight:500,color:'#CBD5E1'},
    ]},
  { id:'biz-slide', name:'Slide Présentation', category:'business', w:1280, h:720,
    bg: grad('#0F0F23','#1A1A3E'),
    layers:[
      {id:'l1',type:'text',text:'Titre de la Présentation',x:0.06,y:0.26,w:0.88,align:'center',font:'Montserrat, sans-serif',size:70,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Sous-titre ou accroche principale',x:0.06,y:0.48,w:0.88,align:'center',font:'Inter, sans-serif',size:30,weight:400,color:'#94A3B8'},
      {id:'l3',type:'text',text:'Votre Nom · Organisation · Date',x:0.06,y:0.76,w:0.88,align:'center',font:'Inter, sans-serif',size:20,weight:600,color:'#38BDF8'},
    ]},
  { id:'biz-banner', name:'Bannière Web', category:'business', w:1200, h:300,
    bg: grad('#7C3AED','#4F46E5'),
    layers:[
      {id:'l1',type:'text',text:'Votre Offre Principale Ici',x:0.04,y:0.2,w:0.65,align:'left',font:'Montserrat, sans-serif',size:54,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Description brève et percutante',x:0.04,y:0.56,w:0.65,align:'left',font:'Inter, sans-serif',size:24,weight:400,color:'#C4B5FD'},
      {id:'cta',type:'rect',x:0.72,y:0.22,w:0.22,h:0.52,color:'#FFFFFF',radius:14},
      {id:'cta_txt',type:'text',text:'En savoir\nplus →',x:0.72,y:0.34,w:0.22,align:'center',font:'Montserrat, sans-serif',size:22,weight:800,color:'#4F46E5'},
    ]},
  { id:'pitch-data', name:'Slide Données / Stats', category:'business', w:1280, h:720,
    bg: grad('#0F172A','#1E293B'),
    layers:[
      {id:'l1',type:'text',text:'RÉSULTATS 2025',x:0.06,y:0.07,w:0.88,align:'center',font:'Montserrat, sans-serif',size:30,weight:700,color:'#64748B'},
      {id:'v1',type:'text',text:'12 000',x:0.05,y:0.22,w:0.28,align:'center',font:'Montserrat, sans-serif',size:72,weight:900,color:'#22D3EE'},
      {id:'u1',type:'text',text:'Clients actifs',x:0.05,y:0.46,w:0.28,align:'center',font:'Inter, sans-serif',size:22,weight:500,color:'#94A3B8'},
      {id:'v2',type:'text',text:'+45%',x:0.36,y:0.22,w:0.28,align:'center',font:'Montserrat, sans-serif',size:72,weight:900,color:'#4ADE80'},
      {id:'u2',type:'text',text:'Croissance CA',x:0.36,y:0.46,w:0.28,align:'center',font:'Inter, sans-serif',size:22,weight:500,color:'#94A3B8'},
      {id:'v3',type:'text',text:'98%',x:0.67,y:0.22,w:0.28,align:'center',font:'Montserrat, sans-serif',size:72,weight:900,color:'#F59E0B'},
      {id:'u3',type:'text',text:'Satisfaction',x:0.67,y:0.46,w:0.28,align:'center',font:'Inter, sans-serif',size:22,weight:500,color:'#94A3B8'},
      {id:'l2',type:'text',text:'Votre Entreprise · Rapport Annuel 2025',x:0.06,y:0.82,w:0.88,align:'center',font:'Inter, sans-serif',size:18,weight:500,color:'#475569'},
    ]},

  /* ── EMAIL ── */
  { id:'email-header', name:'En-tête Newsletter', category:'email', w:600, h:200,
    bg: grad('#0F172A','#1E293B'),
    layers:[
      {id:'l1',type:'text',text:'Votre Marque',x:0.06,y:0.26,w:0.88,align:'center',font:'Montserrat, sans-serif',size:48,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'Newsletter · Mai 2026',x:0.06,y:0.62,w:0.88,align:'center',font:'Inter, sans-serif',size:20,weight:400,color:'#94A3B8'},
    ]},
  { id:'email-promo', name:'Bloc Promo Email', category:'email', w:600, h:400,
    bg: grad('#7C3AED','#4F46E5'),
    layers:[
      {id:'l1',type:'text',text:'🎁 OFFRE SPÉCIALE',x:0.06,y:0.1,w:0.88,align:'center',font:'Montserrat, sans-serif',size:34,weight:900,color:'#FFFFFF'},
      {id:'l2',type:'text',text:'-30% ce week-end',x:0.06,y:0.3,w:0.88,align:'center',font:'Montserrat, sans-serif',size:56,weight:900,color:'#FEF08A'},
      {id:'cta',type:'rect',x:0.2,y:0.64,w:0.6,h:0.2,color:'#FFFFFF',radius:12},
      {id:'cta_t',type:'text',text:'Je profite de l\'offre →',x:0.2,y:0.69,w:0.6,align:'center',font:'Montserrat, sans-serif',size:22,weight:800,color:'#4F46E5'},
    ]},
  { id:'email-footer', name:'Pied de mail', category:'email', w:600, h:150,
    bg: solid('#F1F5F9'),
    layers:[
      {id:'l1',type:'text',text:'Votre Entreprise · contact@email.com',x:0.06,y:0.2,w:0.88,align:'center',font:'Inter, sans-serif',size:18,weight:600,color:'#334155'},
      {id:'l2',type:'text',text:'www.votresite.com · @votrecompte',x:0.06,y:0.5,w:0.88,align:'center',font:'Inter, sans-serif',size:16,weight:400,color:'#64748B'},
      {id:'l3',type:'text',text:'Se désabonner · Politique de confidentialité',x:0.06,y:0.74,w:0.88,align:'center',font:'Inter, sans-serif',size:13,weight:400,color:'#94A3B8'},
    ]},
]

/* ══════════════════════════════════════════════════════════════════
   DRAWING ENGINE
══════════════════════════════════════════════════════════════════ */
function drawTemplate(canvas, { layers, bg, w, h, imgCache = {} }) {
  const ctx = canvas.getContext('2d')
  canvas.width = w
  canvas.height = h

  if (bg.type === 'gradient') {
    const rad = (bg.angle * Math.PI) / 180
    const grd = ctx.createLinearGradient(
      w / 2 - Math.cos(rad) * w / 2, h / 2 - Math.sin(rad) * h / 2,
      w / 2 + Math.cos(rad) * w / 2, h / 2 + Math.sin(rad) * h / 2,
    )
    grd.addColorStop(0, bg.color1)
    grd.addColorStop(1, bg.color2)
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, w, h)
  } else if (bg.type === 'image') {
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, w, h)
    const img = imgCache['__bg__']
    if (img?.complete && img.naturalWidth > 0) {
      // object-fit: cover
      const ca = w / h, ia = img.naturalWidth / img.naturalHeight
      let sx, sy, sw, sh
      if (ia > ca) { sh = img.naturalHeight; sw = sh * ca; sx = (img.naturalWidth - sw) / 2; sy = 0 }
      else { sw = img.naturalWidth; sh = sw / ca; sx = 0; sy = (img.naturalHeight - sh) / 2 }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
    }
  } else {
    ctx.fillStyle = bg.color
    ctx.fillRect(0, 0, w, h)
  }

  for (const layer of layers) {
    if (layer.hidden) continue
    ctx.save()
    if (layer.opacity !== undefined) ctx.globalAlpha = layer.opacity

    if (layer.type === 'rect') {
      const lx = layer.x * w, ly = layer.y * h, lw = layer.w * w, lh = layer.h * h
      if (layer.outline) {
        ctx.strokeStyle = layer.color
        ctx.lineWidth = Math.max(3, w * 0.004)
        ctx.strokeRect(lx + ctx.lineWidth / 2, ly + ctx.lineWidth / 2, lw - ctx.lineWidth, lh - ctx.lineWidth)
      } else if (layer.radius) {
        ctx.fillStyle = layer.color
        ctx.beginPath(); ctx.roundRect(lx, ly, lw, lh, layer.radius); ctx.fill()
      } else {
        ctx.fillStyle = layer.color
        ctx.fillRect(lx, ly, lw, lh)
      }
    } else if (layer.type === 'image') {
      const img = imgCache[layer.id]
      if (img?.complete) ctx.drawImage(img, layer.x * w, layer.y * h, layer.w * w, layer.h * h)
    } else if (layer.type === 'text') {
      ctx.font = `${layer.weight || 400} ${layer.size}px ${layer.font || 'Inter, sans-serif'}`
      ctx.fillStyle = layer.color
      ctx.textAlign = layer.align || 'left'
      ctx.textBaseline = 'top'
      if (layer.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3
      }
      const x = layer.align === 'center' ? (layer.x + layer.w / 2) * w
        : layer.align === 'right' ? (layer.x + layer.w) * w : layer.x * w
      const lineH = layer.size * 1.32
      ;(layer.text || '').split('\n').forEach((line, i) => ctx.fillText(line, x, layer.y * h + i * lineH))
    }
    ctx.restore()
  }
}

function scaledSize(w, h, maxW, maxH) {
  const r = Math.min(maxW / w, maxH / h, 1)
  return { dw: Math.round(w * r), dh: Math.round(h * r) }
}

/* ── Thumbnail ── */
function TemplateThumbnail({ tpl, isSelected, onSelect }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const { dw, dh } = scaledSize(tpl.w, tpl.h, 220, 145)
    const off = document.createElement('canvas')
    drawTemplate(off, { layers: tpl.layers, bg: tpl.bg, w: tpl.w, h: tpl.h })
    c.width = dw; c.height = dh
    c.getContext('2d').drawImage(off, 0, 0, dw, dh)
  }, [tpl])
  return (
    <div onClick={onSelect} style={{ marginBottom: 8, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${isSelected ? '#22D3EE' : 'transparent'}`, background: '#0f172a', transition: 'border-color .12s' }}>
      <canvas ref={ref} style={{ display: 'block', width: '100%' }} />
      <div style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, color: isSelected ? '#22D3EE' : '#64748b', background: isSelected ? 'rgba(34,211,238,.1)' : 'transparent', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.name}</div>
    </div>
  )
}

/* ── UI helpers ── */
function Sec({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: '1px solid #1e293b' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
        <span style={{ color: '#475569', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={{ padding: '0 14px 12px' }}>{children}</div>}
    </div>
  )
}

const lbl = { display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }
const inp = { width: '100%', padding: '7px 9px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }
const col = { width: '100%', height: 34, borderRadius: 8, border: '1px solid #334155', cursor: 'pointer', padding: 2, background: '#0f172a' }

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function StudioVisuelPro() {
  const [category, setCategory]       = useState('all')
  const [selectedId, setSelectedId]   = useState(null)
  const [layers, setLayers]           = useState([])
  const [bg, setBg]                   = useState(null)
  const [dims, setDims]               = useState({ w: 1080, h: 1080 })
  const [activeId, setActiveId]       = useState(null)
  const [fmt, setFmt]                 = useState('png')
  const [exporting, setExporting]     = useState(false)
  const [userZoom, setUserZoom]       = useState(1)       // 1 = fit
  const [fitScale, setFitScale]       = useState(0.5)
  const [dragging, setDragging]       = useState(null)    // { id, startPx, startPy, origX, origY }
  const [history, setHistory]         = useState([])
  const [historyIdx, setHistoryIdx]   = useState(-1)
  const [showGrid, setShowGrid]       = useState(false)
  const [leftOpen, setLeftOpen]       = useState(true)
  const [rightOpen, setRightOpen]     = useState(true)

  /* ── AI states ── */
  const [aiTab, setAiTab]             = useState('text')  // 'text' | 'image'
  const [aiTextPrompt, setAiTextPrompt] = useState('')
  const [aiTextLoading, setAiTextLoading] = useState(false)
  const [aiTextMsg, setAiTextMsg]     = useState('')
  const [aiImgPrompt, setAiImgPrompt] = useState('')
  const [aiImgModel, setAiImgModel]   = useState('black-forest-labs/flux-schnell')
  const [aiImgDest, setAiImgDest]     = useState('bg')   // 'bg' | 'layer'
  const [aiImgLoading, setAiImgLoading] = useState(false)
  const [aiImgProgress, setAiImgProgress] = useState('')

  const previewRef  = useRef(null)
  const wrapperRef  = useRef(null)
  const imgCache    = useRef({})
  const roRef       = useRef(null)

  const filtered    = category === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === category)
  const activeLayer = layers.find(l => l.id === activeId)
  const displayScale = fitScale * userZoom

  /* ── Load Google Fonts ── */
  useEffect(() => {
    if (document.querySelector('link[data-studio-fonts]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'; link.href = GFONTS; link.setAttribute('data-studio-fonts', '1')
    document.head.appendChild(link)
  }, [])

  /* ── History ── */
  const pushHistory = useCallback((ls, b) => {
    setHistory(h => {
      const trimmed = h.slice(0, historyIdx + 1)
      return [...trimmed, { layers: ls, bg: b }].slice(-40)
    })
    setHistoryIdx(i => Math.min(i + 1, 39))
  }, [historyIdx])

  function undo() {
    if (historyIdx <= 0) return
    const entry = history[historyIdx - 1]
    setLayers(entry.layers); setBg(entry.bg); setHistoryIdx(i => i - 1)
  }
  function redo() {
    if (historyIdx >= history.length - 1) return
    const entry = history[historyIdx + 1]
    setLayers(entry.layers); setBg(entry.bg); setHistoryIdx(i => i + 1)
  }

  /* ── Load template ── */
  const loadTemplate = useCallback((tpl) => {
    const ls = tpl.layers.map(l => ({ ...l }))
    const b = { ...tpl.bg }
    setSelectedId(tpl.id); setLayers(ls); setBg(b)
    setDims({ w: tpl.w, h: tpl.h }); setActiveId(null)
    imgCache.current = {}
    setHistory([{ layers: ls, bg: b }]); setHistoryIdx(0)
  }, [])

  /* ── ResizeObserver → fitScale ── */
  useEffect(() => {
    const el = wrapperRef.current; if (!el) return
    roRef.current?.disconnect()
    roRef.current = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const s = Math.min((width - 40) / dims.w, (height - 40) / dims.h)
      setFitScale(Math.max(0.05, s))
    })
    roRef.current.observe(el)
    return () => roRef.current?.disconnect()
  }, [dims])

  /* ── Render canvas ── */
  useEffect(() => {
    const canvas = previewRef.current; if (!canvas || !bg) return
    // Full-res draw
    drawTemplate(canvas, { layers, bg, w: dims.w, h: dims.h, imgCache: imgCache.current })
    // CSS scale for display
    const dW = Math.round(dims.w * displayScale)
    const dH = Math.round(dims.h * displayScale)
    canvas.style.width = dW + 'px'
    canvas.style.height = dH + 'px'
    // Grid overlay
    if (showGrid && dW > 0) {
      const ctx = canvas.getContext('2d')
      const step = Math.round(dims.w / 6)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
      for (let x = step; x < dims.w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, dims.h); ctx.stroke() }
      for (let y = step; y < dims.h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dims.w, y); ctx.stroke() }
    }
  }, [layers, bg, dims, displayScale, showGrid])

  /* ── Layer helpers ── */
  function updateLayer(id, patch) {
    setLayers(prev => {
      const next = prev.map(l => l.id === id ? { ...l, ...patch } : l)
      return next
    })
  }
  function commitEdit() {
    pushHistory(layers, bg)
  }

  function deleteLayer(id) {
    const next = layers.filter(l => l.id !== id)
    setLayers(next); setActiveId(null); pushHistory(next, bg)
  }
  function duplicateLayer(id) {
    const src = layers.find(l => l.id === id); if (!src) return
    const dup = { ...src, id: 'l_' + Date.now(), x: src.x + 0.02, y: src.y + 0.02 }
    const next = [...layers, dup]
    setLayers(next); setActiveId(dup.id); pushHistory(next, bg)
  }
  function moveLayerUp(id) {
    const i = layers.findIndex(l => l.id === id); if (i >= layers.length - 1) return
    const next = [...layers]; [next[i], next[i + 1]] = [next[i + 1], next[i]]
    setLayers(next); pushHistory(next, bg)
  }
  function moveLayerDown(id) {
    const i = layers.findIndex(l => l.id === id); if (i <= 0) return
    const next = [...layers]; [next[i], next[i - 1]] = [next[i - 1], next[i]]
    setLayers(next); pushHistory(next, bg)
  }
  function addTextLayer() {
    const id = 'txt_' + Date.now()
    const next = [...layers, { id, type: 'text', text: 'Nouveau texte', x: 0.1, y: 0.45, w: 0.8, align: 'center', font: 'Montserrat, sans-serif', size: 60, weight: 700, color: '#FFFFFF', opacity: 1, shadow: false }]
    setLayers(next); setActiveId(id); pushHistory(next, bg)
  }

  /* ── Image upload ── */
  function addImageLayer(file) {
    const url = URL.createObjectURL(file)
    const id = 'img_' + Date.now()
    const img = new Image()
    img.onload = () => {
      imgCache.current[id] = img
      const ratio = img.naturalHeight / img.naturalWidth
      const next = [...layers, { id, type: 'image', src: url, x: 0.1, y: 0.1, w: 0.8, h: 0.8 * ratio }]
      setLayers(next); setActiveId(id); pushHistory(next, bg)
    }
    img.src = url
  }

  /* ── Canvas pointer events (drag to move) ── */
  function getCursorNorm(e) {
    const canvas = previewRef.current; if (!canvas) return { px: 0, py: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      px: (e.clientX - rect.left) / rect.width,
      py: (e.clientY - rect.top) / rect.height,
    }
  }
  function findHit(px, py) {
    return [...layers].reverse().find(l => {
      if (l.type === 'rect') return px >= l.x && px <= l.x + l.w && py >= l.y && py <= l.y + l.h
      if (l.type === 'text') return px >= l.x && px <= l.x + l.w && py >= l.y - 0.01 && py <= l.y + (l.size / dims.h) * (l.text?.split('\n').length || 1) * 1.35
      if (l.type === 'image') return px >= l.x && px <= l.x + l.w && py >= l.y && py <= l.y + l.h
      return false
    })
  }
  function onPointerDown(e) {
    const { px, py } = getCursorNorm(e)
    const hit = findHit(px, py)
    if (hit) {
      setActiveId(hit.id)
      setDragging({ id: hit.id, startPx: px, startPy: py, origX: hit.x, origY: hit.y })
      e.currentTarget.setPointerCapture(e.pointerId)
    } else {
      setActiveId(null)
    }
  }
  function onPointerMove(e) {
    if (!dragging) return
    const { px, py } = getCursorNorm(e)
    const dx = px - dragging.startPx, dy = py - dragging.startPy
    updateLayer(dragging.id, { x: Math.max(0, dragging.origX + dx), y: Math.max(0, dragging.origY + dy) })
  }
  function onPointerUp() {
    if (dragging) { commitEdit(); setDragging(null) }
  }

  /* ── Export ── */
  function handleExport() {
    if (!bg) return
    setExporting(true)
    const off = document.createElement('canvas')
    drawTemplate(off, { layers, bg, w: dims.w, h: dims.h, imgCache: imgCache.current })
    const mime = fmt === 'jpg' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/png'
    off.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `studio-visuel.${fmt}`; a.click()
      URL.revokeObjectURL(url); setExporting(false)
    }, mime, 0.95)
  }

  /* ── AI: Générer les textes (Groq) ── */
  async function generateTextsAI() {
    const textLayers = layers.filter(l => l.type === 'text')
    if (!aiTextPrompt.trim() || textLayers.length === 0) return
    setAiTextLoading(true); setAiTextMsg('✨ Génération...')
    const tplName = TEMPLATES.find(t => t.id === selectedId)?.name || 'visuel'
    const prompt = `Tu es un expert en design et marketing digital africain.
Visuel : "${tplName}" (${dims.w}×${dims.h}px)
Description : "${aiTextPrompt}"

Calques texte à remplir :
${textLayers.map(l => `- id:"${l.id}" actuel:"${(l.text || '').replace(/\n/g, '\\n')}"`).join('\n')}

Génère des textes percutants, concis et adaptés. Réponds UNIQUEMENT en JSON: {"layers":{"id":"texte",...}}
Utilise \\n pour les sauts de ligne. Max 3 lignes par calque. Texte adapté au marché sénégalais/africain si pertinent.`
    try {
      const data = await callGroqJSON(prompt, { maxTokens: 800, temperature: 0.75 })
      if (data?.layers) {
        const next = layers.map(l =>
          data.layers[l.id] !== undefined ? { ...l, text: String(data.layers[l.id]).replace(/\\n/g, '\n') } : l
        )
        setLayers(next); pushHistory(next, bg)
        setAiTextMsg('✅ Textes générés !')
      } else { setAiTextMsg('⚠️ Réponse invalide, réessayez') }
    } catch (e) { setAiTextMsg('❌ ' + (e.message || 'Erreur')) }
    setAiTextLoading(false)
  }

  /* ── AI: Générer une image (FLUX via Replicate) ── */
  async function generateImageAI() {
    if (!aiImgPrompt.trim()) return
    setAiImgLoading(true); setAiImgProgress('🚀 Initialisation...')
    try {
      const styleHint = ', professional graphic design, vibrant, high quality, sharp details'
      const prediction = await generateImage({
        prompt: aiImgPrompt + styleHint,
        model: aiImgModel,
        width: Math.min(1024, Math.round(dims.w / Math.max(1, dims.w / 1024))),
        height: Math.min(1024, Math.round(dims.h / Math.max(1, dims.h / 1024))),
        numOutputs: 1,
      })
      setAiImgProgress('⏳ Génération en cours...')
      const result = await pollPrediction(prediction.id, (status, attempt) => {
        setAiImgProgress(`⏳ En cours... (${attempt}/60)`)
      })
      const imgUrl = result.output?.[0]
      if (!imgUrl) throw new Error('Aucune image retournée')

      // Fetch as blob → objectURL to avoid canvas taint on export
      setAiImgProgress('⬇ Chargement de l\'image...')
      const resp = await fetch(imgUrl)
      const blob = await resp.blob()
      const objectUrl = URL.createObjectURL(blob)

      await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          if (aiImgDest === 'bg') {
            imgCache.current['__bg__'] = img
            const nb = { type: 'image', src: objectUrl }
            setBg(nb); pushHistory(layers, nb)
          } else {
            const id = 'ai_' + Date.now()
            imgCache.current[id] = img
            const next = [...layers, { id, type: 'image', src: objectUrl, x: 0, y: 0, w: 1, h: img.naturalHeight / img.naturalWidth }]
            setLayers(next); setActiveId(id); pushHistory(next, bg)
          }
          setAiImgProgress('✅ Image ajoutée !')
          resolve()
        }
        img.onerror = () => reject(new Error('Impossible de charger l\'image'))
        img.src = objectUrl
      })
    } catch (e) { setAiImgProgress('❌ ' + (e.message || 'Erreur')) }
    setAiImgLoading(false)
  }

  /* ── Zoom helpers ── */
  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.5, 2]
  function zoomIn() { setUserZoom(z => Math.min(4, +(z + 0.25).toFixed(2))) }
  function zoomOut() { setUserZoom(z => Math.max(0.1, +(z - 0.25).toFixed(2))) }
  function zoomFit() { setUserZoom(1) }

  /* ─── RENDER ─── */
  const sideW = 248
  const propW = 280

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0f1e', overflow: 'hidden', fontFamily: 'Inter, sans-serif', color: '#f8fafc' }}>
      <SEO title="Studio Visuel Pro — Créateur de visuels HD" description="Créez des posts, affiches, bannières et flyers professionnels. 50 templates. Export HD." />

      {/* ══ HEADER ══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid #1e293b', background: '#1e293b', flexShrink: 0, flexWrap: 'wrap', minHeight: 52 }}>
        <button onClick={() => setLeftOpen(o => !o)} title="Galerie" style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 6px', borderRadius: 6 }}>☰</button>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>Studio Visuel Pro</span>
        <span style={{ fontSize: '0.68rem', color: '#475569', background: '#0f172a', borderRadius: 20, padding: '2px 8px' }}>{TEMPLATES.length} templates</span>
        <div style={{ flex: 1 }} />

        {/* Undo / Redo */}
        {selectedId && <>
          <button onClick={undo} disabled={historyIdx <= 0} title="Annuler (Ctrl+Z)" style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 7, color: historyIdx <= 0 ? '#334155' : '#94a3b8', cursor: historyIdx <= 0 ? 'default' : 'pointer', padding: '4px 9px', fontSize: '0.8rem' }}>↩</button>
          <button onClick={redo} disabled={historyIdx >= history.length - 1} title="Refaire" style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 7, color: historyIdx >= history.length - 1 ? '#334155' : '#94a3b8', cursor: historyIdx >= history.length - 1 ? 'default' : 'pointer', padding: '4px 9px', fontSize: '0.8rem' }}>↪</button>
          <div style={{ width: 1, height: 22, background: '#334155' }} />

          {/* Zoom controls */}
          <button onClick={zoomOut} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 7, color: '#94a3b8', cursor: 'pointer', padding: '4px 9px', fontSize: '0.9rem', fontWeight: 700 }}>−</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="range" min={10} max={300} step={5} value={Math.round(userZoom * 100)} onChange={e => setUserZoom(+e.target.value / 100)}
              style={{ width: 80, accentColor: '#22D3EE', cursor: 'pointer' }} />
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', width: 40, textAlign: 'center' }}>{Math.round(userZoom * 100)}%</span>
          </div>
          <button onClick={zoomIn} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 7, color: '#94a3b8', cursor: 'pointer', padding: '4px 9px', fontSize: '0.9rem', fontWeight: 700 }}>+</button>
          <button onClick={zoomFit} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 7, color: '#22D3EE', cursor: 'pointer', padding: '4px 9px', fontSize: '0.72rem', fontWeight: 700 }}>Ajuster</button>
          <div style={{ width: 1, height: 22, background: '#334155' }} />

          {/* Grid */}
          <button onClick={() => setShowGrid(g => !g)} title="Grille" style={{ background: showGrid ? 'rgba(34,211,238,.15)' : 'transparent', border: `1px solid ${showGrid ? '#22D3EE' : '#334155'}`, borderRadius: 7, color: showGrid ? '#22D3EE' : '#64748b', cursor: 'pointer', padding: '4px 9px', fontSize: '0.75rem' }}>⊞</button>

          {/* Export */}
          <select value={fmt} onChange={e => setFmt(e.target.value)} style={{ ...inp, width: 'auto', padding: '5px 8px', fontSize: '0.78rem' }}>
            <option value="png">PNG</option>
            <option value="jpg">JPEG</option>
            <option value="webp">WebP</option>
          </select>
          <button onClick={handleExport} disabled={exporting} style={{ padding: '7px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#22D3EE,#0891B2)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: exporting ? 'default' : 'pointer', opacity: exporting ? 0.6 : 1, whiteSpace: 'nowrap' }}>
            {exporting ? '⏳…' : '⬇ Exporter HD'}
          </button>
        </>}
        <button onClick={() => setRightOpen(o => !o)} title="Propriétés" style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 6px', borderRadius: 6 }}>⚙</button>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT: Gallery ── */}
        {leftOpen && (
          <div style={{ width: sideW, borderRight: '1px solid #1e293b', background: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '8px', borderBottom: '1px solid #1e293b', overflowX: 'hidden' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setCategory(c.id)} style={{
                    padding: '3px 7px', borderRadius: 20, border: '1px solid',
                    borderColor: category === c.id ? '#22D3EE' : '#1e293b',
                    background: category === c.id ? 'rgba(34,211,238,.12)' : '#1e293b',
                    color: category === c.id ? '#22D3EE' : '#64748b',
                    fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>{c.label}</button>
                ))}
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
              {filtered.map(tpl => (
                <TemplateThumbnail key={tpl.id} tpl={tpl} isSelected={selectedId === tpl.id} onSelect={() => loadTemplate(tpl)} />
              ))}
            </div>
          </div>
        )}

        {/* ── CENTER: Canvas ── */}
        <div ref={wrapperRef} style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'repeating-conic-gradient(#111827 0% 25%, #0f172a 0% 50%) 0 0 / 24px 24px', padding: 20, boxSizing: 'border-box' }}>
          {selectedId ? (
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <canvas
                ref={previewRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                style={{
                  cursor: dragging ? 'grabbing' : 'crosshair',
                  border: `2px solid ${activeId ? '#22D3EE' : '#1e293b'}`,
                  borderRadius: 4,
                  boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                  touchAction: 'none',
                  display: 'block',
                }}
              />
              <div style={{ fontSize: '0.68rem', color: '#334155', userSelect: 'none' }}>
                {dims.w} × {dims.h} px · cliquez pour sélectionner · glissez pour déplacer
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300, color: '#334155', gap: 8, textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: '3rem' }}>🎨</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>Choisissez un template</div>
              <div style={{ fontSize: '0.82rem' }}>{TEMPLATES.length} modèles disponibles dans la galerie</div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Properties ── */}
        {rightOpen && selectedId && (
          <div style={{ width: propW, borderLeft: '1px solid #1e293b', background: '#0f172a', overflowY: 'auto', flexShrink: 0 }}>

            {/* ══ AI PANEL ══ */}
            <div style={{ borderBottom: '1px solid #1e293b' }}>
              {/* Header */}
              <div style={{ padding: '10px 14px 8px', background: 'linear-gradient(135deg,rgba(168,85,247,.12),rgba(34,211,238,.08))' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#A855F7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>🤖 Assistant IA</div>
                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {[['text','✏️ Textes'],['image','🖼 Image']].map(([t, lbl]) => (
                    <button key={t} onClick={() => setAiTab(t)} style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: `1px solid ${aiTab === t ? '#A855F7' : '#334155'}`, background: aiTab === t ? 'rgba(168,85,247,.18)' : 'transparent', color: aiTab === t ? '#C084FC' : '#64748b', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab: Textes */}
              {aiTab === 'text' && (
                <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.5 }}>
                    Décrivez votre visuel et l'IA réécrira tous les calques texte.
                  </div>
                  <textarea
                    value={aiTextPrompt}
                    onChange={e => setAiTextPrompt(e.target.value)}
                    placeholder="Ex: promo pour un restaurant sénégalais, clientèle jeune, ambiance festive, vendredi soir..."
                    rows={4}
                    style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
                  />
                  <button
                    onClick={generateTextsAI}
                    disabled={aiTextLoading || !aiTextPrompt.trim()}
                    style={{ padding: '9px', borderRadius: 9, border: 'none', background: aiTextLoading || !aiTextPrompt.trim() ? '#1e293b' : 'linear-gradient(135deg,#7C3AED,#A855F7)', color: aiTextLoading || !aiTextPrompt.trim() ? '#475569' : '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: aiTextLoading || !aiTextPrompt.trim() ? 'default' : 'pointer' }}
                  >
                    {aiTextLoading ? '⏳ Génération...' : '✨ Générer les textes'}
                  </button>
                  {aiTextMsg && (
                    <div style={{ fontSize: '0.72rem', color: aiTextMsg.startsWith('✅') ? '#4ADE80' : aiTextMsg.startsWith('❌') ? '#F87171' : '#94A3B8', textAlign: 'center' }}>
                      {aiTextMsg}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Image */}
              {aiTab === 'image' && (
                <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.5 }}>
                    Générez une image IA (FLUX) comme fond ou calque.
                  </div>
                  <textarea
                    value={aiImgPrompt}
                    onChange={e => setAiImgPrompt(e.target.value)}
                    placeholder="Ex: coucher de soleil sur Dakar, baobab, couleurs chaudes, style photo..."
                    rows={4}
                    style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
                  />
                  <div>
                    <div style={{ ...lbl, marginBottom: 6 }}>Modèle</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[['black-forest-labs/flux-schnell','⚡ Rapide'],['black-forest-labs/flux-dev','💎 Qualité']].map(([m, ml]) => (
                        <button key={m} onClick={() => setAiImgModel(m)} style={{ flex: 1, padding: '5px 6px', borderRadius: 7, border: `1px solid ${aiImgModel === m ? '#22D3EE' : '#334155'}`, background: aiImgModel === m ? 'rgba(34,211,238,.12)' : 'transparent', color: aiImgModel === m ? '#22D3EE' : '#64748b', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}>
                          {ml}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ ...lbl, marginBottom: 6 }}>Destination</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[['bg','🖼 Fond'],['layer','📌 Calque']].map(([d, dl]) => (
                        <button key={d} onClick={() => setAiImgDest(d)} style={{ flex: 1, padding: '5px 6px', borderRadius: 7, border: `1px solid ${aiImgDest === d ? '#22D3EE' : '#334155'}`, background: aiImgDest === d ? 'rgba(34,211,238,.12)' : 'transparent', color: aiImgDest === d ? '#22D3EE' : '#64748b', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}>
                          {dl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={generateImageAI}
                    disabled={aiImgLoading || !aiImgPrompt.trim()}
                    style={{ padding: '9px', borderRadius: 9, border: 'none', background: aiImgLoading || !aiImgPrompt.trim() ? '#1e293b' : 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: aiImgLoading || !aiImgPrompt.trim() ? '#475569' : '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: aiImgLoading || !aiImgPrompt.trim() ? 'default' : 'pointer' }}
                  >
                    {aiImgLoading ? '⏳ Génération...' : '🎨 Générer l\'image'}
                  </button>
                  {aiImgProgress && (
                    <div style={{ fontSize: '0.72rem', color: aiImgProgress.startsWith('✅') ? '#4ADE80' : aiImgProgress.startsWith('❌') ? '#F87171' : '#94A3B8', textAlign: 'center', lineHeight: 1.5 }}>
                      {aiImgProgress}
                    </div>
                  )}
                  {aiImgLoading && (
                    <div style={{ height: 3, borderRadius: 2, background: '#1e293b', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg,#7C3AED,#22D3EE)', animation: 'pulse 1.5s ease-in-out infinite', width: '60%' }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <Sec title="Arrière-plan">
              {/* Type switcher */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {[['solid','Uni'],['gradient','Dégradé'],['image','Image']].map(([t, lbTxt]) => (
                  <button key={t} onClick={() => {
                    let nb
                    if (t === 'solid') nb = { type: 'solid', color: bg?.color1 || bg?.color || '#0F172A' }
                    else if (t === 'gradient') nb = { type: 'gradient', color1: bg?.color || '#0F172A', color2: '#1E293B', angle: 135 }
                    else nb = { type: 'image' }
                    setBg(nb); pushHistory(layers, nb)
                  }} style={{ flex: 1, padding: '4px 6px', borderRadius: 7, border: `1px solid ${bg?.type === t ? '#22D3EE' : '#334155'}`, background: bg?.type === t ? 'rgba(34,211,238,.12)' : 'transparent', color: bg?.type === t ? '#22D3EE' : '#64748b', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}>
                    {lbTxt}
                  </button>
                ))}
              </div>

              {bg?.type === 'gradient' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>Couleur 1</label>
                  <input type="color" value={bg.color1} onChange={e => { setBg(b => ({ ...b, color1: e.target.value })); commitEdit() }} style={col} />
                  <label style={lbl}>Couleur 2</label>
                  <input type="color" value={bg.color2} onChange={e => { setBg(b => ({ ...b, color2: e.target.value })); commitEdit() }} style={col} />
                  <label style={lbl}>Angle : {bg.angle}°</label>
                  <input type="range" min="0" max="360" value={bg.angle} onChange={e => setBg(b => ({ ...b, angle: +e.target.value }))} onMouseUp={commitEdit} style={{ width: '100%', accentColor: '#22D3EE' }} />
                </div>
              )}
              {bg?.type === 'solid' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbl}>Couleur de fond</label>
                  <input type="color" value={bg?.color || '#ffffff'} onChange={e => { setBg(b => ({ ...b, color: e.target.value })); commitEdit() }} style={col} />
                </div>
              )}
              {bg?.type === 'image' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'block', padding: '10px', borderRadius: 8, border: '1px dashed #22D3EE', textAlign: 'center', cursor: 'pointer', color: '#22D3EE', fontSize: '0.78rem', fontWeight: 600 }}>
                    🖼 {bg.src ? 'Changer l\'image' : 'Choisir une image de fond'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      const file = e.target.files?.[0]; if (!file) return
                      const url = URL.createObjectURL(file)
                      const img = new Image()
                      img.onload = () => { imgCache.current['__bg__'] = img; const nb = { type: 'image', src: url }; setBg(nb); pushHistory(layers, nb) }
                      img.src = url
                    }} />
                  </label>
                  {bg.src && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>
                      ✅ Image chargée — couvre toute la toile
                    </div>
                  )}
                  <button onClick={() => { const nb = { type: 'solid', color: '#0F172A' }; setBg(nb); delete imgCache.current['__bg__']; pushHistory(layers, nb) }} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer' }}>
                    ✕ Retirer l'image
                  </button>
                </div>
              )}
            </Sec>

            <Sec title="Image">
              <label style={{ display: 'block', padding: '8px', borderRadius: 8, border: '1px dashed #334155', textAlign: 'center', cursor: 'pointer', color: '#64748b', fontSize: '0.78rem' }}>
                📷 Ajouter une image
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) addImageLayer(f) }} />
              </label>
            </Sec>

            <Sec title="Calques">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[...layers].reverse().map(l => (
                  <div key={l.id} onClick={() => setActiveId(l.id === activeId ? null : l.id)} style={{
                    padding: '6px 8px', borderRadius: 7, cursor: 'pointer', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: 6,
                    color: activeId === l.id ? '#22D3EE' : '#94a3b8',
                    border: `1px solid ${activeId === l.id ? '#22D3EE' : '#1e293b'}`,
                    background: activeId === l.id ? 'rgba(34,211,238,.08)' : 'transparent',
                  }}>
                    <span>{l.type === 'text' ? '𝙏' : l.type === 'image' ? '🖼' : '▬'}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.type === 'text' ? (l.text || '').replace(/\n/g, ' ') : l.type === 'image' ? 'Image' : 'Forme'}</span>
                    <button onClick={e => { e.stopPropagation(); moveLayerUp(l.id) }} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '0 2px', fontSize: '0.7rem' }}>▲</button>
                    <button onClick={e => { e.stopPropagation(); moveLayerDown(l.id) }} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '0 2px', fontSize: '0.7rem' }}>▼</button>
                  </div>
                ))}
                <button onClick={addTextLayer} style={{ marginTop: 4, padding: '6px', borderRadius: 8, border: '1px dashed #334155', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem' }}>+ Texte</button>
              </div>
            </Sec>

            {activeLayer?.type === 'text' && (
              <Sec title="Modifier le texte">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={lbl}>Contenu</label>
                    <textarea value={activeLayer.text} onChange={e => updateLayer(activeLayer.id, { text: e.target.value })} onBlur={commitEdit} style={{ ...inp, minHeight: 64, resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={lbl}>Police</label>
                    <select value={activeLayer.font} onChange={e => { updateLayer(activeLayer.id, { font: e.target.value }); commitEdit() }} style={inp}>
                      {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Taille : {activeLayer.size}px</label>
                    <input type="range" min="8" max="300" value={activeLayer.size} onChange={e => updateLayer(activeLayer.id, { size: +e.target.value })} onMouseUp={commitEdit} style={{ width: '100%', accentColor: '#22D3EE' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={lbl}>Couleur</label>
                      <input type="color" value={/^#[0-9a-f]{3,8}$/i.test(activeLayer.color) ? activeLayer.color : '#ffffff'} onChange={e => { updateLayer(activeLayer.id, { color: e.target.value }); commitEdit() }} style={col} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={lbl}>Graisse</label>
                      <select value={activeLayer.weight} onChange={e => { updateLayer(activeLayer.id, { weight: +e.target.value }); commitEdit() }} style={inp}>
                        {[300, 400, 500, 600, 700, 800, 900].map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Alignement</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['left', 'center', 'right'].map(a => (
                        <button key={a} onClick={() => { updateLayer(activeLayer.id, { align: a }); commitEdit() }} style={{ flex: 1, padding: '5px', borderRadius: 7, border: '1px solid', borderColor: activeLayer.align === a ? '#22D3EE' : '#334155', background: activeLayer.align === a ? 'rgba(34,211,238,.15)' : 'transparent', color: activeLayer.align === a ? '#22D3EE' : '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
                          {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Position Y : {Math.round(activeLayer.y * 100)}%</label>
                    <input type="range" min="0" max="98" value={Math.round(activeLayer.y * 100)} onChange={e => updateLayer(activeLayer.id, { y: +e.target.value / 100 })} onMouseUp={commitEdit} style={{ width: '100%', accentColor: '#22D3EE' }} />
                  </div>
                  <div>
                    <label style={lbl}>Position X : {Math.round(activeLayer.x * 100)}%</label>
                    <input type="range" min="0" max="90" value={Math.round(activeLayer.x * 100)} onChange={e => updateLayer(activeLayer.id, { x: +e.target.value / 100 })} onMouseUp={commitEdit} style={{ width: '100%', accentColor: '#22D3EE' }} />
                  </div>
                  <div>
                    <label style={lbl}>Opacité : {Math.round((activeLayer.opacity ?? 1) * 100)}%</label>
                    <input type="range" min="0" max="100" value={Math.round((activeLayer.opacity ?? 1) * 100)} onChange={e => updateLayer(activeLayer.id, { opacity: +e.target.value / 100 })} onMouseUp={commitEdit} style={{ width: '100%', accentColor: '#22D3EE' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={lbl}>Ombre</span>
                    <button onClick={() => { updateLayer(activeLayer.id, { shadow: !activeLayer.shadow }); commitEdit() }} style={{ padding: '3px 10px', borderRadius: 7, border: '1px solid', borderColor: activeLayer.shadow ? '#22D3EE' : '#334155', background: activeLayer.shadow ? 'rgba(34,211,238,.15)' : 'transparent', color: activeLayer.shadow ? '#22D3EE' : '#64748b', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                      {activeLayer.shadow ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => duplicateLayer(activeLayer.id)} style={{ flex: 1, padding: '6px', borderRadius: 7, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.73rem' }}>⧉ Dupliquer</button>
                    <button onClick={() => deleteLayer(activeLayer.id)} style={{ flex: 1, padding: '6px', borderRadius: 7, border: '1px solid #7f1d1d', background: 'rgba(220,38,38,.1)', color: '#f87171', cursor: 'pointer', fontSize: '0.73rem' }}>🗑 Supprimer</button>
                  </div>
                </div>
              </Sec>
            )}

            {activeLayer?.type === 'image' && (
              <Sec title="Image sélectionnée">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={lbl}>Largeur : {Math.round(activeLayer.w * 100)}%</label>
                    <input type="range" min="5" max="100" value={Math.round(activeLayer.w * 100)} onChange={e => updateLayer(activeLayer.id, { w: +e.target.value / 100 })} onMouseUp={commitEdit} style={{ width: '100%', accentColor: '#22D3EE' }} />
                  </div>
                  <div>
                    <label style={lbl}>Hauteur : {Math.round(activeLayer.h * 100)}%</label>
                    <input type="range" min="5" max="100" value={Math.round(activeLayer.h * 100)} onChange={e => updateLayer(activeLayer.id, { h: +e.target.value / 100 })} onMouseUp={commitEdit} style={{ width: '100%', accentColor: '#22D3EE' }} />
                  </div>
                  <div>
                    <label style={lbl}>Position X : {Math.round(activeLayer.x * 100)}%</label>
                    <input type="range" min="0" max="90" value={Math.round(activeLayer.x * 100)} onChange={e => updateLayer(activeLayer.id, { x: +e.target.value / 100 })} onMouseUp={commitEdit} style={{ width: '100%', accentColor: '#22D3EE' }} />
                  </div>
                  <div>
                    <label style={lbl}>Position Y : {Math.round(activeLayer.y * 100)}%</label>
                    <input type="range" min="0" max="90" value={Math.round(activeLayer.y * 100)} onChange={e => updateLayer(activeLayer.id, { y: +e.target.value / 100 })} onMouseUp={commitEdit} style={{ width: '100%', accentColor: '#22D3EE' }} />
                  </div>
                  <div>
                    <label style={lbl}>Opacité : {Math.round((activeLayer.opacity ?? 1) * 100)}%</label>
                    <input type="range" min="0" max="100" value={Math.round((activeLayer.opacity ?? 1) * 100)} onChange={e => updateLayer(activeLayer.id, { opacity: +e.target.value / 100 })} onMouseUp={commitEdit} style={{ width: '100%', accentColor: '#22D3EE' }} />
                  </div>
                  <button onClick={() => {
                    const img = imgCache.current[activeLayer.id]; if (!img) return
                    imgCache.current['__bg__'] = img
                    const nb = { type: 'image', src: activeLayer.src }
                    setBg(nb); pushHistory(layers, nb)
                  }} style={{ width: '100%', padding: '7px', borderRadius: 8, border: '1px solid #22D3EE', background: 'rgba(34,211,238,.1)', color: '#22D3EE', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                    🖼 Définir comme arrière-plan
                  </button>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => duplicateLayer(activeLayer.id)} style={{ flex: 1, padding: '6px', borderRadius: 7, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.73rem' }}>⧉ Dupliquer</button>
                    <button onClick={() => deleteLayer(activeLayer.id)} style={{ flex: 1, padding: '6px', borderRadius: 7, border: '1px solid #7f1d1d', background: 'rgba(220,38,38,.1)', color: '#f87171', cursor: 'pointer', fontSize: '0.73rem' }}>🗑 Supprimer</button>
                  </div>
                </div>
              </Sec>
            )}

            <Sec title="Format de la toile" defaultOpen={false}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Largeur px</label>
                  <input type="number" value={dims.w} min={100} max={5000} onChange={e => setDims(d => ({ ...d, w: +e.target.value || d.w }))} onBlur={commitEdit} style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Hauteur px</label>
                  <input type="number" value={dims.h} min={100} max={5000} onChange={e => setDims(d => ({ ...d, h: +e.target.value || d.h }))} onBlur={commitEdit} style={inp} />
                </div>
              </div>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {[['Carré 1:1', 1080, 1080], ['Story 9:16', 1080, 1920], ['Paysage 16:9', 1280, 720], ['A4', 2480, 3508]].map(([n, w, h]) => (
                  <button key={n} onClick={() => { setDims({ w, h }); commitEdit() }} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '0.68rem' }}>{n}</button>
                ))}
              </div>
            </Sec>

          </div>
        )}
      </div>
    </div>
  )
}
