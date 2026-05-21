import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Swiper } from 'swiper/react'
import { SwiperSlide } from 'swiper/react'
import { Link } from 'react-router-dom'

const FALLBACK_SLIDES = [
  {
    id: 'fallback-360',
    title: 'ABAWI 360 — Pilotage business tout-en-un',
    description: 'CRM, planification, statistiques, finance et execution pour accelerer votre croissance.',
    link: '/abawi360',
    img: '/slider/pexels-mikhail-nilov-6893835.avif',
  },
  {
    id: 'fallback-finance',
    title: 'Finance Elite — decisions basees sur des chiffres',
    description: 'DCF, score credit, projections et analyses OHADA pour mieux negocier avec banques et investisseurs.',
    link: '/outils/finance',
    img: '/slider/pexels-freestockpro-10925757.avif',
  },
  {
    id: 'fallback-juridique',
    title: 'Juridique Elite — conformite OHADA sans approximation',
    description: 'Contrats, statuts, clauses et documents legaux generes avec une structure professionnelle.',
    link: '/outils/juridique',
    img: '/slider/pexels-ekaterina-bolovtsova-6077870.avif',
  },
  {
    id: 'fallback-outils',
    title: 'Outils ABAWI — productivite immediate',
    description: 'CV Pro, Business Plan, Analyse CV IA et documents metier prets a etre utilises.',
    link: '/outils',
    img: '/slider/pexels-tima-miroshnichenko-5439136.avif',
  },
  {
    id: 'fallback-ia',
    title: 'ABAWI IA — votre copilote intelligent',
    description: 'Generation intelligente, assistant contextuel et automatisations pour gagner du temps chaque jour.',
    link: '/outils/abawi-ia',
    img: '/slider/pexels-dkomov-34804023.avif',
  },
  {
    id: 'fallback-podcast',
    title: 'Podcasts ABAWI — apprendre et agir en continu',
    description: 'Des episodes strategiques pour entrepreneurs, etudiants et professionnels en Afrique francophone.',
    link: '/podcasts',
    img: '/slider/pexels-orione-conceicao-1531154-8663192.avif',
  },
  {
    id: 'fallback-store',
    title: 'Store IT et équipements professionnels',
    description: 'Materiel et accessoires performants pour elever votre niveau de production digitale.',
    link: '/store',
    img: '/slider/Drop-Expression-Series-Mechtropolis-Keyboard-01.avif',
  },
]

function getPriority(slide) {
  const bag = `${slide?.title || ''} ${slide?.description || ''} ${slide?.link || ''}`.toLowerCase();
  if (bag.includes('/plans') || bag.includes('plus') || bag.includes('abonnement')) return 1;
  if (bag.includes('/abawi360') || bag.includes('360')) return 2;
  if (bag.includes('/outils') || bag.includes('ia')) return 3;
  if (bag.includes('/digital') || bag.includes('guide')) return 4;
  if (bag.includes('/podcasts') || bag.includes('podcast')) return 5;
  if (bag.includes('/store') || bag.includes('store')) return 6;
  return 9;
}

function getSlideMeta(slide) {
  const bag = `${slide?.title || ''} ${slide?.description || ''} ${slide?.link || ''}`.toLowerCase();
  if (bag.includes('/abawi360') || bag.includes('360')) return { badge: 'ABAWI 360', cta: 'Activer ABAWI 360' };
  if (bag.includes('/outils') || bag.includes('ia')) return { badge: 'OUTILS & IA', cta: 'Essayer les outils IA' };
  if (bag.includes('/digital') || bag.includes('guide')) return { badge: 'GUIDES PREMIUM', cta: 'Voir les guides premium' };
  if (bag.includes('/store') || bag.includes('store')) return { badge: 'STORE IT', cta: 'Voir le Store IT' };
  if (bag.includes('/plans') || bag.includes('plus')) return { badge: 'ABAWI PLUS', cta: 'Voir les plans' };
  return { badge: 'ABAWI', cta: 'Découvrir maintenant' };
}

function getTitleDensityClass(title = '') {
  const len = String(title).trim().length;
  if (len >= 52) return 'title-dense';
  if (len >= 34) return 'title-medium';
  return 'title-short';
}

function getVisualVariant(slide) {
  const bag = `${slide?.title || ''} ${slide?.description || ''} ${slide?.link || ''}`.toLowerCase();
  if (
    bag.includes('finance') ||
    bag.includes('juridique') ||
    bag.includes('ohada') ||
    bag.includes('/store') ||
    bag.includes('store')
  ) {
    return 'variant-finance';
  }
  return 'variant-stellar';
}

function withThemeImage(slide) {
  const bag = `${slide?.title || ''} ${slide?.description || ''} ${slide?.link || ''}`.toLowerCase()
  const current = String(slide?.img || '').trim().toLowerCase()
  const hasUsableImage = current && !current.includes('logo-abawi')
  if (hasUsableImage) return slide
  if (bag.includes('/abawi360') || bag.includes('360') || bag.includes('pilotage business')) {
    return { ...slide, img: '/slider/pexels-mikhail-nilov-6893835.jpg' }
  }
  if (bag.includes('/academy') || bag.includes('academy')) return { ...slide, img: '/slider/academy-elite.jpg' }
  if (bag.includes('productivite immediate') || bag.includes('productivité immédiate')) {
    return { ...slide, img: '/slider/pexels-tima-miroshnichenko-5439136.jpg' }
  }
  if (bag.includes('finance')) return { ...slide, img: '/slider/pexels-freestockpro-10925757.jpg' }
  if (bag.includes('podcast')) return { ...slide, img: '/slider/pexels-orione-conceicao-1531154-8663192.jpg' }
  if (bag.includes('juridique') || bag.includes('contrat') || bag.includes('ohada')) return { ...slide, img: '/slider/pexels-ekaterina-bolovtsova-6077870.jpg' }
  if (bag.includes('/store') || bag.includes('store it')) return { ...slide, img: '/slider/Drop-Expression-Series-Mechtropolis-Keyboard-01.jpeg' }
  if (bag.includes('/outils/abawi-ia') || bag.includes('abawi ia') || bag.includes('intelligence')) return { ...slide, img: '/slider/pexels-dkomov-34804023.jpg' }
  if (bag.includes('/outils')) return { ...slide, img: '/slider/pexels-fauxels-3184451.jpg' }
  return slide
}

// Pre-computed fallback so the slider renders synchronously on first paint —
// the Supabase fetch only swaps it out if the DB has custom slides.
const DEFAULT_SLIDES = FALLBACK_SLIDES.map(withThemeImage).sort(
  (a, b) => getPriority(a) - getPriority(b),
);

export default function HomeSlider() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);

  // Récupération des données en temps réel depuis Supabase
  useEffect(() => {
    async function fetchSlides() {
      const { data } = await supabase
        .from('site_slider')
        .select('*')
        .order('created_at', { ascending: false });

      if (data?.length > 0) {
        const normalized = data
          .map((row, index) => {
            const image = row?.img || row?.image || row?.image_url || row?.cover || row?.cover_url || '';
            const title = row?.title || row?.titre || row?.name || '';
            const description = row?.description || row?.subtitle || row?.text || '';
            const link = row?.link || row?.url || row?.button_link || '/plans';
            return {
              id: row?.id || `db-slide-${index}`,
              title,
              description,
              link,
              img: image,
            };
          })
          .filter((s) => s.img && !String(s.img).toLowerCase().includes('logo-abawi'));

        const ordered = normalized.map(withThemeImage).sort((a, b) => getPriority(a) - getPriority(b));
        if (ordered.length) setSlides(ordered);
      }
    }
    fetchSlides();
  }, []);

  return (
    <div className="home-slider-wrapper" style={{ 
      margin: '10px 0 0', borderRadius: '28px', overflow: 'hidden',
      height: 'clamp(420px, 72vh, 760px)', background: '#000', position: 'relative'
    }}>
      
      <style>{`
        .home-slider-wrapper {
          --slider-panel-bg: #04070f;
          --slider-title-color: #f0b429;
          --slider-body-color: #f4f7ff;
          --slider-badge-bg: rgba(240,180,41,0.12);
          --slider-badge-border: rgba(240,180,41,0.45);
          --slider-badge-color: #f0b429;
          --slider-grid-line: rgba(148,163,184,0.06);
          position: relative;
        }
        .home-slider-wrapper::before,
        .home-slider-wrapper::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(60px);
        }
        .home-slider-wrapper::before {
          top: -8%;
          left: -6%;
          width: 380px;
          height: 320px;
          background: radial-gradient(circle, rgba(240,180,41,0.18) 0%, transparent 70%);
          animation: sliderGlow1 8s ease-in-out infinite;
        }
        .home-slider-wrapper::after {
          bottom: -10%;
          right: -4%;
          width: 300px;
          height: 260px;
          background: radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%);
          animation: sliderGlow2 10s ease-in-out infinite;
        }
        @keyframes sliderGlow1 {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes sliderGlow2 {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.06); }
        }
        [data-mode="light"] .home-slider-wrapper,
        html.light .home-slider-wrapper {
          --slider-panel-bg: #f6f8fc;
          --slider-title-color: #6b3f00;
          --slider-body-color: #1f2937;
          --slider-badge-bg: rgba(212,161,23,0.14);
          --slider-badge-border: rgba(212,161,23,0.34);
          --slider-badge-color: #6b3f00;
          --slider-grid-line: rgba(71,85,105,0.08);
        }
        [data-mode="light"] .home-slider-wrapper::before,
        html.light .home-slider-wrapper::before {
          background: radial-gradient(circle, rgba(240,180,41,0.10) 0%, transparent 70%);
        }
        [data-mode="light"] .home-slider-wrapper::after,
        html.light .home-slider-wrapper::after {
          background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
        }
        .swiper { width: 100%; height: 100%; }
        .swiper-slide { overflow: hidden; }
        .swiper-wrapper { transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1); }
        .swiper-button-next, .swiper-button-prev {
          color: #F0B429 !important;
          transform: scale(0.72);
          z-index: 40 !important;
          pointer-events: auto !important;
        }
        .swiper-pagination-bullet { background: #fff !important; }
        .swiper-pagination-bullet-active { background: #F0B429 !important; width: 35px !important; border-radius: 5px !important; }
        
        .btn-elite-gold {
          display: inline-block; padding: 14px 34px; background: #F0B429;
          color: #000 !important; font-weight: 900; border-radius: 60px; 
          text-decoration: none; text-transform: uppercase; transition: all 0.3s; 
          letter-spacing: 0.5px;
          box-shadow: 0 8px 22px rgba(240,180,41,0.3);
        }
        .btn-elite-gold:hover { background: #fff; transform: translateY(-3px) scale(1.01); }

        .slider-copy {
          animation: sliderEnter 0.7s ease both;
        }
        @keyframes sliderEnter {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .slide-badge {
          display: inline-flex;
          width: fit-content;
          margin-bottom: 14px;
          padding: 4px 12px;
          border-radius: 999px;
          border: 1px solid var(--slider-badge-border);
          background: var(--slider-badge-bg);
          color: var(--slider-badge-color);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .slider-image-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 72% 50%, rgba(2,6,15,0.12) 0%, rgba(2,6,15,0.34) 52%, rgba(2,6,15,0.56) 100%),
            linear-gradient(90deg, rgba(2,6,15,0.98) 0%, rgba(2,6,15,0.9) 28%, rgba(2,6,15,0.6) 52%, rgba(2,6,15,0.24) 74%, rgba(2,6,15,0.08) 100%);
          z-index: 1;
          pointer-events: none;
        }
        .slider-seam-blend {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -8%;
          width: 34%;
          z-index: 4;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 14% 50%, rgba(2,6,15,0.94) 0%, rgba(2,6,15,0.78) 28%, rgba(2,6,15,0.42) 56%, rgba(2,6,15,0.06) 88%, rgba(2,6,15,0) 100%),
            linear-gradient(90deg, rgba(2,6,15,0.88) 0%, rgba(2,6,15,0.62) 32%, rgba(2,6,15,0.22) 70%, rgba(2,6,15,0) 100%);
          filter: blur(1.2px);
          opacity: 0.95;
        }
        .slider-seam-veil {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -20%;
          width: 52%;
          z-index: 3;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 20% 52%, rgba(124, 58, 237, 0.28) 0%, rgba(59, 130, 246, 0.14) 34%, rgba(2,6,15,0) 66%),
            radial-gradient(ellipse at 28% 45%, rgba(240,180,41,0.18) 0%, rgba(240,180,41,0.06) 26%, rgba(2,6,15,0) 54%),
            linear-gradient(90deg, rgba(2,6,15,0.88) 0%, rgba(2,6,15,0.54) 36%, rgba(2,6,15,0.14) 72%, rgba(2,6,15,0) 100%);
          filter: blur(2.4px);
          mix-blend-mode: plus-lighter;
          opacity: 0.88;
        }
        .slider-slide-shell.variant-stellar .slider-seam-veil {
          background:
            radial-gradient(ellipse at 20% 52%, rgba(124, 58, 237, 0.28) 0%, rgba(59, 130, 246, 0.14) 34%, rgba(2,6,15,0) 66%),
            radial-gradient(ellipse at 28% 45%, rgba(240,180,41,0.18) 0%, rgba(240,180,41,0.06) 26%, rgba(2,6,15,0) 54%),
            linear-gradient(90deg, rgba(2,6,15,0.88) 0%, rgba(2,6,15,0.54) 36%, rgba(2,6,15,0.14) 72%, rgba(2,6,15,0) 100%);
          mix-blend-mode: plus-lighter;
          opacity: 0.88;
        }
        .slider-slide-shell.variant-finance .slider-seam-veil {
          background:
            radial-gradient(ellipse at 18% 50%, rgba(240,180,41,0.2) 0%, rgba(240,180,41,0.08) 24%, rgba(2,6,15,0) 58%),
            linear-gradient(90deg, rgba(2,6,15,0.94) 0%, rgba(2,6,15,0.66) 32%, rgba(2,6,15,0.2) 72%, rgba(2,6,15,0) 100%);
          mix-blend-mode: screen;
          opacity: 0.84;
        }
        .slider-slide-shell {
          height: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.4fr);
          background: var(--slider-panel-bg);
          position: relative;
        }
        .slider-image-pane {
          background: #0a0f1d;
          position: relative;
          min-width: 0;
          min-height: 100%;
        }
        .slider-copy-pane {
          min-width: 0;
          padding: 0 clamp(18px, 2.4vw, 34px) 0 clamp(18px, 2.4vw, 34px);
          overflow: visible;
          position: relative;
          z-index: 12;
          isolation: isolate;
        }
        .slider-copy-pane::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(120% 85% at 12% 18%, rgba(124,58,237,0.2) 0%, rgba(59,130,246,0.08) 28%, rgba(2,6,15,0) 58%),
            radial-gradient(95% 75% at 86% 82%, rgba(240,180,41,0.14) 0%, rgba(240,180,41,0.04) 24%, rgba(2,6,15,0) 56%),
            repeating-linear-gradient(90deg, var(--slider-grid-line) 0 1px, transparent 1px 13px),
            repeating-linear-gradient(0deg, color-mix(in srgb, var(--slider-grid-line) 60%, transparent) 0 1px, transparent 1px 16px),
            radial-gradient(circle at 14% 30%, rgba(255,255,255,0.18) 0 1px, transparent 1px),
            radial-gradient(circle at 72% 22%, rgba(255,255,255,0.12) 0 1px, transparent 1px),
            radial-gradient(circle at 84% 70%, rgba(255,255,255,0.1) 0 1px, transparent 1px);
          opacity: 0.72;
        }
        .slider-slide-shell.variant-stellar .slider-copy-pane::before {
          background:
            radial-gradient(120% 85% at 12% 18%, rgba(124,58,237,0.24) 0%, rgba(59,130,246,0.1) 30%, rgba(2,6,15,0) 60%),
            radial-gradient(95% 75% at 86% 82%, rgba(240,180,41,0.16) 0%, rgba(240,180,41,0.06) 24%, rgba(2,6,15,0) 56%),
            repeating-linear-gradient(90deg, rgba(148,163,184,0.06) 0 1px, transparent 1px 13px),
            repeating-linear-gradient(0deg, rgba(148,163,184,0.035) 0 1px, transparent 1px 16px),
            radial-gradient(circle at 14% 30%, rgba(255,255,255,0.18) 0 1px, transparent 1px),
            radial-gradient(circle at 72% 22%, rgba(255,255,255,0.12) 0 1px, transparent 1px),
            radial-gradient(circle at 84% 70%, rgba(255,255,255,0.1) 0 1px, transparent 1px);
          opacity: 0.76;
        }
        .slider-slide-shell.variant-finance .slider-copy-pane::before {
          background:
            linear-gradient(130deg, rgba(240,180,41,0.08) 0%, rgba(240,180,41,0.02) 36%, rgba(2,6,15,0) 70%),
            linear-gradient(180deg, rgba(15,23,42,0.7) 0%, rgba(2,6,15,0.2) 100%),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 11px),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 18px);
          opacity: 0.66;
        }
        .slider-copy-pane > * {
          position: relative;
          z-index: 1;
        }
        .slide-copy-inner {
          width: 100%;
          max-height: 100%;
          overflow: hidden;
          display: grid;
          gap: 10px;
        }
        .slide-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          filter: saturate(1.05) contrast(1.05);
          transform: scale(1.13);
          transform-origin: center;
        }
        .slide-title {
          text-wrap: balance;
          text-shadow: 0 0 28px rgba(240,180,41,0.35), 0 2px 8px rgba(0,0,0,0.45);
        }
        .slide-title.title-short {
          font-size: clamp(1.52rem, 2.38vw, 2.26rem) !important;
          line-height: 1.16 !important;
        }
        .slide-title.title-medium {
          font-size: clamp(1.4rem, 2.15vw, 2rem) !important;
          line-height: 1.17 !important;
        }
        .slide-title.title-dense {
          font-size: clamp(1.24rem, 1.88vw, 1.72rem) !important;
          line-height: 1.22 !important;
          letter-spacing: 0.25px !important;
        }
        .slide-badge {
          box-shadow: 0 0 12px rgba(240,180,41,0.15);
        }

        .ia-code-stream {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 10%;
          z-index: 7;
          overflow: hidden;
          pointer-events: none;
          font-family: "Courier New", monospace;
          color: rgba(240,180,41,0.92);
          font-size: clamp(0.7rem, 1.2vw, 0.95rem);
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .ia-code-stream > span {
          display: inline-block;
          padding-left: 100%;
          animation: streamX 13s linear infinite;
        }
        @keyframes streamX {
          0% { transform: translateX(0); }
          100% { transform: translateX(-118%); }
        }
        .ia-bubble {
          position: absolute;
          right: 6%;
          bottom: 10%;
          z-index: 6;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
          background: rgba(8,12,24,0.75);
          color: var(--accent) !important;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 8px 12px;
          backdrop-filter: blur(4px);
          animation: bubbleFloat 3.2s ease-in-out infinite;
        }
        @keyframes bubbleFloat {
          0% { transform: translateY(0); opacity: 0.85; }
          50% { transform: translateY(-8px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.85; }
        }

        @media (max-width: 1400px) {
          .home-slider-wrapper {
            height: 620px !important;
          }
        }
        @media (max-width: 980px) {
          .home-slider-wrapper {
            height: 560px !important;
          }
        }
        @media (max-width: 860px) {
          .home-slider-wrapper {
            border-radius: 18px !important;
            height: clamp(440px, 74vh, 580px) !important;
          }
          .slider-slide-shell {
            grid-template-columns: 1fr !important;
          }
          .slider-copy-pane {
            width: 100% !important;
            padding: 0 18px !important;
            position: relative;
            z-index: 9;
          }
          .slider-image-pane { min-height: 54%; }
          .slider-seam-blend { display: none; }
          .slider-seam-veil { display: none; }
          .slider-copy-pane h1 {
            font-size: clamp(1.12rem, 4.6vw, 1.5rem) !important;
            line-height: 1.16 !important;
            letter-spacing: 0.2px !important;
          }
          .slider-copy-pane p {
            font-size: 0.75rem !important;
            line-height: 1.5 !important;
            margin-bottom: 10px !important;
          }
          .slider-copy-pane .slide-title {
            font-size: clamp(1.1rem, 4.3vw, 1.42rem) !important;
            margin-bottom: 8px !important;
          }
          .btn-elite-gold {
            padding: 8px 14px !important;
            font-size: 0.75rem !important;
            letter-spacing: 0 !important;
          }
          .swiper-button-next, .swiper-button-prev { display: none !important; }
          .ia-bubble { display: none; }
          .ia-code-stream { font-size: 0.75rem; bottom: 14%; }
        }
        @media (max-width: 640px) {
          .home-slider-wrapper {
            height: clamp(320px, 80vw, 440px) !important;
            border-radius: 14px !important;
          }
          .slider-copy-pane {
            padding: 0 14px !important;
          }
          .slider-copy-pane h1 {
            font-size: clamp(1rem, 4.2vw, 1.3rem) !important;
            letter-spacing: 0 !important;
          }
          .slider-copy-pane p { display: none !important; }
          .slider-copy-pane .slide-title {
            font-size: clamp(0.95rem, 3.8vw, 1.2rem) !important;
            margin-bottom: 6px !important;
          }
          .btn-elite-gold {
            padding: 7px 12px !important;
            font-size: 0.65rem !important;
          }
          .ia-code-stream { display: none !important; }
          .swiper-pagination-bullet { width: 6px !important; height: 6px !important; }
        }
        @media (max-width: 390px) {
          .home-slider-wrapper { height: clamp(280px, 82vw, 360px) !important; }
        }
      `}</style>

      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        autoplay={{ delay: 5500, disableOnInteraction: false }}
        speed={1100}
        slidesPerView={1}
        spaceBetween={0}
        navigation={true}
        pagination={{ clickable: true, dynamicBullets: true }}
        breakpoints={{
          0: { navigation: false },
          861: { navigation: true },
        }}
        loop={true}
      >
        {slides.map((slide, slideIdx) => {
          const meta = getSlideMeta(slide);
          const titleDensityClass = getTitleDensityClass(slide.title);
          const visualVariant = getVisualVariant(slide);
          const isFirst = slideIdx === 0;
          return (
          <SwiperSlide key={slide.id}>
            <div className={`slider-slide-shell ${visualVariant}`}>
              <div className="slider-copy slider-copy-pane" style={{
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'left',
              }}>
                <div className="slide-copy-inner">
                <span className="slide-badge">{meta.badge}</span>
                <h1 className={`slide-title ${titleDensityClass}`} style={{
                  color: 'var(--slider-title-color)', fontSize: 'clamp(1.45rem, 2.25vw, 2.1rem)', fontWeight: 900,
                  lineHeight: 1.14,
                  marginBottom: '8px',
                  letterSpacing: '0.2px',
                  paddingLeft: '10px',
                  maxWidth: '100%',
                  width: '100%',
                  boxSizing: 'border-box',
                  whiteSpace: 'normal',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                  textIndent: 0,
                }}>
                  {slide.title || 'ABAWI'}
                </h1>
                <p style={{
                  color: 'var(--slider-body-color)', fontSize: '0.8rem', marginBottom: '10px',
                  maxWidth: '100%', width: '100%', boxSizing: 'border-box', lineHeight: 1.52, opacity: 0.9,
                  whiteSpace: 'normal',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                  paddingLeft: '10px',
                }}>
                  {slide.description || 'Excellence africaine, outils intelligents et contenus premium.'}
                </p>
                <div>
                  <Link to={slide.link || '/plans'} className="btn-elite-gold">{meta.cta} →</Link>
                </div>
                </div>
              </div>

              <div className="slider-image-pane" style={{
                overflow: 'hidden',
              }}>
                <img
                  className="slide-image"
                  src={slide.img || '/slider/pexels-fauxels-3184451.avif'}
                  alt={slide.title || 'ABAWI slide'}
                  loading={isFirst ? 'eager' : 'lazy'}
                  fetchpriority={isFirst ? 'high' : undefined}
                  decoding={isFirst ? 'async' : 'async'}
                  style={{
                    objectPosition: 'center',
                  }}
                />
                <div className="slider-image-overlay" />
                <div className="slider-seam-veil" />
                <div className="slider-seam-blend" />
              </div>
              {/* Animation Matrix si le titre contient "IA" */}
              {(String(slide.title).includes('IA') || String(slide.title).includes('Intelligence')) && (
                <>
                  <div className="ia-code-stream">
                    <span>{'simulation ia pro :: vision strategique :: code intelligence :: moteur analytique :: prediction business :: assistant decisionnel :: data fusion en temps reel :: '}</span>
                  </div>
                  <div className="ia-bubble">IA en reflexion strategique...</div>
                </>
              )}
              
            </div>
          </SwiperSlide>
        )})}
      </Swiper>
    </div>
  );
}