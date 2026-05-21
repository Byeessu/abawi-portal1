import { useState, useRef, useEffect, useCallback } from 'react'
import SEO from '../../components/SEO'

const CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'flyer', label: 'Flyers' },
  { id: 'certificate', label: 'Certificats' },
  { id: 'business', label: 'Business' },
  { id: 'video', label: 'Vidéo' },
]

const FONTS = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Courier New", monospace', label: 'Courier' },
]

function grad(c1, c2, angle = 135) {
  return { type: 'gradient', color1: c1, color2: c2, angle }
}
function solid(color) {
  return { type: 'solid', color }
}

const TEMPLATES = [
  {
    id: 'ig-bold', name: 'Bold Statement', category: 'instagram', w: 1080, h: 1080,
    bg: grad('#0F172A', '#1E293B'),
    layers: [
      { id: 'l1', type: 'text', text: 'VOTRE MESSAGE', x: 0.1, y: 0.38, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 88, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: 'Sous-titre accrocheur ici', x: 0.1, y: 0.54, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 34, weight: 400, color: '#94A3B8' },
      { id: 'l3', type: 'text', text: '● @votrecompte', x: 0.1, y: 0.88, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 26, weight: 600, color: '#38BDF8' },
    ],
  },
  {
    id: 'ig-gradient', name: 'Gradient Vif', category: 'instagram', w: 1080, h: 1080,
    bg: grad('#7C3AED', '#EC4899'),
    layers: [
      { id: 'l1', type: 'text', text: 'TITRE PRINCIPAL', x: 0.08, y: 0.38, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 92, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: 'Une description courte et percutante', x: 0.1, y: 0.56, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 32, weight: 400, color: 'rgba(255,255,255,0.85)' },
      { id: 'l3', type: 'text', text: 'www.votresite.com', x: 0.1, y: 0.9, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 24, weight: 700, color: 'rgba(255,255,255,0.65)' },
    ],
  },
  {
    id: 'ig-minimal', name: 'Minimaliste', category: 'instagram', w: 1080, h: 1080,
    bg: solid('#FAFAF9'),
    layers: [
      { id: 'l1', type: 'text', text: 'Titre élégant', x: 0.08, y: 0.42, w: 0.84, align: 'center', font: 'Georgia, serif', size: 72, weight: 700, color: '#1C1917' },
      { id: 'l2', type: 'text', text: '──────────────────', x: 0.08, y: 0.52, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 22, weight: 400, color: '#D4B896' },
      { id: 'l3', type: 'text', text: 'Votre description ici', x: 0.1, y: 0.6, w: 0.8, align: 'center', font: 'Georgia, serif', size: 30, weight: 400, color: '#78716C' },
    ],
  },
  {
    id: 'ig-story', name: 'Story Annonce', category: 'instagram', w: 1080, h: 1920,
    bg: grad('#0EA5E9', '#0284C7'),
    layers: [
      { id: 'l1', type: 'text', text: 'ANNONCE', x: 0.1, y: 0.22, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 48, weight: 900, color: 'rgba(255,255,255,0.7)' },
      { id: 'l2', type: 'text', text: "Titre de\nl'événement", x: 0.08, y: 0.32, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 88, weight: 900, color: '#FFFFFF' },
      { id: 'l3', type: 'text', text: '📅 Date · Lieu · Heure', x: 0.1, y: 0.54, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 34, weight: 500, color: 'rgba(255,255,255,0.9)' },
      { id: 'l4', type: 'text', text: 'Swipe up pour en savoir plus ↑', x: 0.1, y: 0.88, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 26, weight: 600, color: 'rgba(255,255,255,0.75)' },
    ],
  },
  {
    id: 'ig-promo', name: 'Promo Produit', category: 'instagram', w: 1080, h: 1080,
    bg: grad('#F59E0B', '#D97706'),
    layers: [
      { id: 'l1', type: 'text', text: '🔥 PROMO', x: 0.1, y: 0.16, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 50, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: '-50%', x: 0.05, y: 0.28, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 200, weight: 900, color: '#FFFFFF' },
      { id: 'l3', type: 'text', text: 'Sur tous les articles', x: 0.1, y: 0.68, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 42, weight: 700, color: 'rgba(0,0,0,0.55)' },
      { id: 'l4', type: 'text', text: "Offre valable jusqu'au JJ/MM", x: 0.1, y: 0.8, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 28, weight: 500, color: 'rgba(0,0,0,0.45)' },
    ],
  },
  {
    id: 'sn-annonce', name: '🇸🇳 Annonce Sénégal', category: 'instagram', w: 1080, h: 1080,
    bg: grad('#006B3F', '#03784A'),
    layers: [
      { id: 'l1', type: 'text', text: '🇸🇳 SÉNÉGAL', x: 0.06, y: 0.1, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 42, weight: 900, color: '#FFCD00' },
      { id: 'l2', type: 'text', text: 'TITRE\nPRINCIPAL', x: 0.06, y: 0.2, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 96, weight: 900, color: '#FFFFFF' },
      { id: 'l3', type: 'text', text: 'Votre message ou description ici', x: 0.08, y: 0.56, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 34, weight: 500, color: 'rgba(255,255,255,0.9)' },
      { id: 'l4', type: 'text', text: '📍 Dakar · Sénégal', x: 0.08, y: 0.72, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 28, weight: 600, color: '#FFCD00' },
      { id: 'l5', type: 'text', text: '@votrecompte', x: 0.08, y: 0.88, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 24, weight: 500, color: 'rgba(255,255,255,0.55)' },
    ],
  },
  {
    id: 'sn-fete', name: '🇸🇳 Fête Religieuse', category: 'instagram', w: 1080, h: 1080,
    bg: grad('#1A0A00', '#2D1600'),
    layers: [
      { id: 'l1', type: 'text', text: '☪ عيد مبارك', x: 0.06, y: 0.12, w: 0.88, align: 'center', font: 'Georgia, serif', size: 50, weight: 700, color: '#C9A84C' },
      { id: 'l2', type: 'text', text: 'Aïd Moubarak', x: 0.06, y: 0.3, w: 0.88, align: 'center', font: 'Georgia, serif', size: 80, weight: 900, color: '#FFFFFF' },
      { id: 'l3', type: 'text', text: 'Que cette fête vous apporte\njoie et bénédictions', x: 0.08, y: 0.52, w: 0.84, align: 'center', font: 'Georgia, serif', size: 30, weight: 400, color: '#D4B896' },
      { id: 'l4', type: 'text', text: '✨ Votre Famille / Organisation ✨', x: 0.08, y: 0.82, w: 0.84, align: 'center', font: 'Georgia, serif', size: 26, weight: 600, color: '#C9A84C' },
    ],
  },
  {
    id: 'fb-post', name: 'Post Facebook', category: 'facebook', w: 1200, h: 628,
    bg: grad('#1D4ED8', '#2563EB'),
    layers: [
      { id: 'l1', type: 'text', text: 'Titre de votre publication', x: 0.06, y: 0.25, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 68, weight: 800, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: 'Décrivez votre message en quelques mots percutants', x: 0.08, y: 0.52, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 30, weight: 400, color: 'rgba(255,255,255,0.85)' },
      { id: 'l3', type: 'text', text: '👉 En savoir plus · votresite.com', x: 0.08, y: 0.74, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 24, weight: 600, color: '#93C5FD' },
    ],
  },
  {
    id: 'fb-cover', name: 'Couverture Facebook', category: 'facebook', w: 820, h: 312,
    bg: grad('#111827', '#1F2937'),
    layers: [
      { id: 'l1', type: 'text', text: 'Votre Nom / Marque', x: 0.05, y: 0.28, w: 0.6, align: 'left', font: 'Inter, sans-serif', size: 52, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: 'Votre slogan ou description', x: 0.05, y: 0.56, w: 0.6, align: 'left', font: 'Inter, sans-serif', size: 24, weight: 400, color: '#9CA3AF' },
      { id: 'l3', type: 'text', text: 'www.votresite.com', x: 0.05, y: 0.76, w: 0.6, align: 'left', font: 'Inter, sans-serif', size: 20, weight: 600, color: '#38BDF8' },
    ],
  },
  {
    id: 'fb-event', name: 'Événement Facebook', category: 'facebook', w: 1200, h: 628,
    bg: grad('#4F46E5', '#7C3AED'),
    layers: [
      { id: 'l1', type: 'text', text: '📣 ÉVÉNEMENT', x: 0.06, y: 0.14, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 34, weight: 700, color: 'rgba(255,255,255,0.7)' },
      { id: 'l2', type: 'text', text: "Nom de l'événement", x: 0.06, y: 0.28, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 72, weight: 900, color: '#FFFFFF' },
      { id: 'l3', type: 'text', text: '📅 Samedi 14 Juin 2025 · 18h00', x: 0.08, y: 0.6, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 30, weight: 500, color: '#C4B5FD' },
      { id: 'l4', type: 'text', text: "📍 Adresse ou lieu de l'événement", x: 0.08, y: 0.76, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 26, weight: 400, color: 'rgba(255,255,255,0.7)' },
    ],
  },
  {
    id: 'li-post', name: 'Post LinkedIn', category: 'linkedin', w: 1200, h: 627,
    bg: solid('#FFFFFF'),
    layers: [
      { id: 'l1', type: 'text', text: 'Titre professionnel accrocheur', x: 0.06, y: 0.22, w: 0.88, align: 'left', font: 'Inter, sans-serif', size: 54, weight: 800, color: '#0F172A' },
      { id: 'l2', type: 'text', text: 'Votre insight ou apprentissage clé ici.', x: 0.06, y: 0.48, w: 0.88, align: 'left', font: 'Georgia, serif', size: 30, weight: 400, color: '#334155' },
      { id: 'l3', type: 'text', text: '— Votre Nom · Titre/Poste', x: 0.06, y: 0.74, w: 0.88, align: 'left', font: 'Inter, sans-serif', size: 22, weight: 600, color: '#0284C7' },
    ],
  },
  {
    id: 'li-banner', name: 'Bannière LinkedIn', category: 'linkedin', w: 1584, h: 396,
    bg: grad('#0F172A', '#1E3A5F'),
    layers: [
      { id: 'l1', type: 'text', text: 'Votre Nom Complet', x: 0.04, y: 0.24, w: 0.55, align: 'left', font: 'Inter, sans-serif', size: 62, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: 'Poste · Entreprise · Ville', x: 0.04, y: 0.54, w: 0.55, align: 'left', font: 'Inter, sans-serif', size: 26, weight: 400, color: '#94A3B8' },
      { id: 'l3', type: 'text', text: '✉ email@exemple.com', x: 0.04, y: 0.74, w: 0.55, align: 'left', font: 'Inter, sans-serif', size: 22, weight: 600, color: '#38BDF8' },
    ],
  },
  {
    id: 'li-tips', name: 'Conseils Pro', category: 'linkedin', w: 1200, h: 627,
    bg: grad('#065F46', '#047857'),
    layers: [
      { id: 'l1', type: 'text', text: '5 conseils pour', x: 0.06, y: 0.17, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 40, weight: 500, color: 'rgba(255,255,255,0.8)' },
      { id: 'l2', type: 'text', text: 'Votre Sujet\nProfessionnel', x: 0.06, y: 0.3, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 68, weight: 900, color: '#FFFFFF' },
      { id: 'l3', type: 'text', text: '1. Premier conseil important', x: 0.08, y: 0.64, w: 0.84, align: 'left', font: 'Inter, sans-serif', size: 26, weight: 500, color: '#A7F3D0' },
      { id: 'l4', type: 'text', text: '2. Deuxième conseil clé', x: 0.08, y: 0.78, w: 0.84, align: 'left', font: 'Inter, sans-serif', size: 26, weight: 500, color: '#A7F3D0' },
    ],
  },
  {
    id: 'flyer-event', name: 'Flyer Événement', category: 'flyer', w: 794, h: 1123,
    bg: grad('#1A1A2E', '#16213E'),
    layers: [
      { id: 'l1', type: 'text', text: 'VOUS ÊTES INVITÉ', x: 0.08, y: 0.1, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 34, weight: 700, color: '#F59E0B' },
      { id: 'l2', type: 'text', text: "NOM DE\nL'ÉVÉNEMENT", x: 0.06, y: 0.18, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 76, weight: 900, color: '#FFFFFF' },
      { id: 'l3', type: 'text', text: '────────────────────', x: 0.06, y: 0.44, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 20, weight: 400, color: '#F59E0B' },
      { id: 'l4', type: 'text', text: '📅 Samedi 14 Juin 2025\n⏰ 18h00 – 23h00\n📍 Votre adresse ici', x: 0.1, y: 0.49, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 30, weight: 500, color: '#E2E8F0' },
      { id: 'l5', type: 'text', text: 'Réservation : +221 XX XXX XX XX', x: 0.08, y: 0.79, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 26, weight: 600, color: '#F59E0B' },
      { id: 'l6', type: 'text', text: 'www.votresite.com · @votrecompte', x: 0.08, y: 0.88, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 20, weight: 400, color: '#64748B' },
    ],
  },
  {
    id: 'flyer-job', name: "Offre d'Emploi", category: 'flyer', w: 794, h: 1123,
    bg: solid('#FFFFFF'),
    layers: [
      { id: 'bar', type: 'rect', x: 0, y: 0, w: 1, h: 0.14, color: '#1D4ED8' },
      { id: 'l1', type: 'text', text: "OFFRE D'EMPLOI", x: 0.06, y: 0.04, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 42, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: 'Nom du Poste', x: 0.06, y: 0.21, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 60, weight: 800, color: '#1E293B' },
      { id: 'l3', type: 'text', text: 'Entreprise · Ville · Type de contrat', x: 0.06, y: 0.35, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 26, weight: 500, color: '#475569' },
      { id: 'l4', type: 'text', text: 'Missions :', x: 0.08, y: 0.46, w: 0.84, align: 'left', font: 'Inter, sans-serif', size: 24, weight: 700, color: '#1D4ED8' },
      { id: 'l5', type: 'text', text: '▸ Mission principale 1\n▸ Mission principale 2\n▸ Mission principale 3', x: 0.08, y: 0.52, w: 0.84, align: 'left', font: 'Inter, sans-serif', size: 22, weight: 400, color: '#334155' },
      { id: 'l6', type: 'text', text: '📩 Candidature : recrutement@email.com', x: 0.08, y: 0.82, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 24, weight: 600, color: '#1D4ED8' },
    ],
  },
  {
    id: 'flyer-promo', name: 'Flyer Promo', category: 'flyer', w: 794, h: 1123,
    bg: grad('#DC2626', '#B91C1C'),
    layers: [
      { id: 'l1', type: 'text', text: 'SUPER\nSOLDES', x: 0.05, y: 0.06, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 130, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: "JUSQU'À", x: 0.05, y: 0.42, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 38, weight: 500, color: 'rgba(255,255,255,0.8)' },
      { id: 'l3', type: 'text', text: '70%', x: 0.05, y: 0.48, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 190, weight: 900, color: '#FEF08A' },
      { id: 'l4', type: 'text', text: 'DE RÉDUCTION', x: 0.05, y: 0.78, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 38, weight: 800, color: '#FFFFFF' },
      { id: 'l5', type: 'text', text: "Offre valable jusqu'au 30 juin 2025", x: 0.05, y: 0.88, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 22, weight: 400, color: 'rgba(255,255,255,0.7)' },
    ],
  },
  {
    id: 'flyer-service', name: 'Présentation Service', category: 'flyer', w: 794, h: 1123,
    bg: solid('#F8FAFC'),
    layers: [
      { id: 'bar', type: 'rect', x: 0, y: 0, w: 1, h: 0.09, color: '#0F172A' },
      { id: 'l1', type: 'text', text: 'VOTRE ENTREPRISE', x: 0.05, y: 0.02, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 26, weight: 700, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: 'NOS SERVICES', x: 0.05, y: 0.13, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 52, weight: 900, color: '#0F172A' },
      { id: 'l3', type: 'text', text: '⭐ Service Premium 1\nDescription courte du service proposé', x: 0.06, y: 0.26, w: 0.88, align: 'left', font: 'Inter, sans-serif', size: 24, weight: 500, color: '#334155' },
      { id: 'l4', type: 'text', text: '⭐ Service Premium 2\nDescription courte du service proposé', x: 0.06, y: 0.42, w: 0.88, align: 'left', font: 'Inter, sans-serif', size: 24, weight: 500, color: '#334155' },
      { id: 'l5', type: 'text', text: '⭐ Service Premium 3\nDescription courte du service proposé', x: 0.06, y: 0.58, w: 0.88, align: 'left', font: 'Inter, sans-serif', size: 24, weight: 500, color: '#334155' },
      { id: 'l6', type: 'text', text: '📞 +221 XX XXX XX XX\n✉ contact@email.com\n🌐 www.votresite.com', x: 0.06, y: 0.8, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 22, weight: 600, color: '#0284C7' },
    ],
  },
  {
    id: 'cert-formation', name: 'Certificat Formation', category: 'certificate', w: 1123, h: 794,
    bg: solid('#FFFDF7'),
    layers: [
      { id: 'border', type: 'rect', x: 0.025, y: 0.035, w: 0.95, h: 0.93, color: '#C9A84C', outline: true },
      { id: 'l1', type: 'text', text: 'CERTIFICAT DE FORMATION', x: 0.05, y: 0.1, w: 0.9, align: 'center', font: 'Georgia, serif', size: 34, weight: 700, color: '#78350F' },
      { id: 'l2', type: 'text', text: 'Décerné à', x: 0.05, y: 0.26, w: 0.9, align: 'center', font: 'Georgia, serif', size: 20, weight: 400, color: '#92400E' },
      { id: 'l3', type: 'text', text: 'Prénom NOM du Bénéficiaire', x: 0.05, y: 0.36, w: 0.9, align: 'center', font: 'Georgia, serif', size: 46, weight: 700, color: '#1C1917' },
      { id: 'l4', type: 'text', text: 'Pour avoir complété avec succès la formation :', x: 0.05, y: 0.54, w: 0.9, align: 'center', font: 'Georgia, serif', size: 19, weight: 400, color: '#57534E' },
      { id: 'l5', type: 'text', text: '"Titre de la Formation Complète"', x: 0.05, y: 0.63, w: 0.9, align: 'center', font: 'Georgia, serif', size: 30, weight: 700, color: '#C9A84C' },
      { id: 'l6', type: 'text', text: 'Dakar, le 14 Juin 2025', x: 0.05, y: 0.83, w: 0.9, align: 'center', font: 'Georgia, serif', size: 16, weight: 400, color: '#78716C' },
    ],
  },
  {
    id: 'cert-participation', name: 'Attestation', category: 'certificate', w: 1123, h: 794,
    bg: grad('#EFF6FF', '#DBEAFE'),
    layers: [
      { id: 'l1', type: 'text', text: 'ATTESTATION DE PARTICIPATION', x: 0.05, y: 0.09, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 30, weight: 900, color: '#1E40AF' },
      { id: 'l2', type: 'text', text: 'Nous certifions que', x: 0.05, y: 0.26, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 19, weight: 400, color: '#3B82F6' },
      { id: 'l3', type: 'text', text: 'Prénom NOM', x: 0.05, y: 0.36, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 50, weight: 800, color: '#1E3A8A' },
      { id: 'l4', type: 'text', text: "a participé à l'événement / conférence / atelier :", x: 0.05, y: 0.55, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 18, weight: 400, color: '#475569' },
      { id: 'l5', type: 'text', text: '"Nom de l\'Événement"', x: 0.05, y: 0.64, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 28, weight: 700, color: '#2563EB' },
      { id: 'l6', type: 'text', text: 'Organisé par : Votre Organisation · Date : JJ/MM/AAAA', x: 0.05, y: 0.83, w: 0.9, align: 'center', font: 'Inter, sans-serif', size: 17, weight: 500, color: '#64748B' },
    ],
  },
  {
    id: 'biz-card', name: 'Carte de Visite', category: 'business', w: 1050, h: 600,
    bg: grad('#0F172A', '#1E293B'),
    layers: [
      { id: 'l1', type: 'text', text: 'Prénom NOM', x: 0.06, y: 0.2, w: 0.6, align: 'left', font: 'Inter, sans-serif', size: 52, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: 'Titre / Poste professionnel', x: 0.06, y: 0.42, w: 0.6, align: 'left', font: 'Inter, sans-serif', size: 22, weight: 400, color: '#94A3B8' },
      { id: 'l3', type: 'text', text: '──────────────', x: 0.06, y: 0.54, w: 0.6, align: 'left', font: 'Inter, sans-serif', size: 16, weight: 400, color: '#334155' },
      { id: 'l4', type: 'text', text: '📞 +221 XX XXX XX XX\n✉ email@exemple.com\n🌐 www.votresite.com', x: 0.06, y: 0.62, w: 0.6, align: 'left', font: 'Inter, sans-serif', size: 18, weight: 500, color: '#CBD5E1' },
    ],
  },
  {
    id: 'biz-slide', name: 'Slide Présentation', category: 'business', w: 1280, h: 720,
    bg: grad('#0F0F23', '#1A1A3E'),
    layers: [
      { id: 'l1', type: 'text', text: 'Titre de la Présentation', x: 0.06, y: 0.26, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 70, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: 'Sous-titre ou accroche principale', x: 0.06, y: 0.48, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 30, weight: 400, color: '#94A3B8' },
      { id: 'l3', type: 'text', text: 'Votre Nom · Organisation · Date', x: 0.06, y: 0.76, w: 0.88, align: 'center', font: 'Inter, sans-serif', size: 20, weight: 600, color: '#38BDF8' },
    ],
  },
  {
    id: 'biz-banner', name: 'Bannière Web', category: 'business', w: 1200, h: 300,
    bg: grad('#7C3AED', '#4F46E5'),
    layers: [
      { id: 'l1', type: 'text', text: 'Votre Offre Principale Ici', x: 0.04, y: 0.22, w: 0.65, align: 'left', font: 'Inter, sans-serif', size: 54, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: 'Description brève et percutante', x: 0.04, y: 0.56, w: 0.65, align: 'left', font: 'Inter, sans-serif', size: 24, weight: 400, color: '#C4B5FD' },
      { id: 'cta', type: 'rect', x: 0.72, y: 0.24, w: 0.22, h: 0.52, color: '#FFFFFF', radius: 14 },
      { id: 'cta_txt', type: 'text', text: 'En savoir\nplus →', x: 0.72, y: 0.36, w: 0.22, align: 'center', font: 'Inter, sans-serif', size: 22, weight: 800, color: '#4F46E5' },
    ],
  },
  {
    id: 'yt-thumb', name: 'Miniature YouTube', category: 'video', w: 1280, h: 720,
    bg: grad('#DC2626', '#991B1B'),
    layers: [
      { id: 'l1', type: 'text', text: 'TITRE DE\nVOTRE VIDÉO', x: 0.04, y: 0.1, w: 0.7, align: 'left', font: 'Inter, sans-serif', size: 100, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: '▶ REGARDER MAINTENANT', x: 0.04, y: 0.78, w: 0.7, align: 'left', font: 'Inter, sans-serif', size: 28, weight: 700, color: '#FEF08A' },
    ],
  },
  {
    id: 'wa-status', name: 'Statut WhatsApp', category: 'video', w: 1080, h: 1920,
    bg: grad('#10B981', '#059669'),
    layers: [
      { id: 'l1', type: 'text', text: 'BONNE\nNOUVELLE !', x: 0.08, y: 0.28, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 96, weight: 900, color: '#FFFFFF' },
      { id: 'l2', type: 'text', text: 'Partagez votre message\npositif ici', x: 0.08, y: 0.54, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 38, weight: 400, color: 'rgba(255,255,255,0.9)' },
      { id: 'l3', type: 'text', text: '🌟', x: 0.08, y: 0.78, w: 0.84, align: 'center', font: 'Inter, sans-serif', size: 64, weight: 400, color: '#FFFFFF' },
    ],
  },
]

function drawTemplate(canvas, { layers, bg, w, h }) {
  const ctx = canvas.getContext('2d')
  canvas.width = w
  canvas.height = h

  if (bg.type === 'gradient') {
    const rad = (bg.angle * Math.PI) / 180
    const grd = ctx.createLinearGradient(
      w / 2 - Math.cos(rad) * w / 2,
      h / 2 - Math.sin(rad) * h / 2,
      w / 2 + Math.cos(rad) * w / 2,
      h / 2 + Math.sin(rad) * h / 2,
    )
    grd.addColorStop(0, bg.color1)
    grd.addColorStop(1, bg.color2)
    ctx.fillStyle = grd
  } else {
    ctx.fillStyle = bg.color
  }
  ctx.fillRect(0, 0, w, h)

  for (const layer of layers) {
    if (layer.type === 'rect') {
      const lx = layer.x * w, ly = layer.y * h, lw = layer.w * w, lh = layer.h * h
      if (layer.outline) {
        ctx.strokeStyle = layer.color
        ctx.lineWidth = Math.max(3, w * 0.004)
        ctx.strokeRect(lx + ctx.lineWidth / 2, ly + ctx.lineWidth / 2, lw - ctx.lineWidth, lh - ctx.lineWidth)
      } else if (layer.radius) {
        ctx.fillStyle = layer.color
        ctx.beginPath()
        ctx.roundRect(lx, ly, lw, lh, layer.radius)
        ctx.fill()
      } else {
        ctx.fillStyle = layer.color
        ctx.fillRect(lx, ly, lw, lh)
      }
    } else if (layer.type === 'text') {
      ctx.font = `${layer.weight || 400} ${layer.size}px ${layer.font || 'Inter, sans-serif'}`
      ctx.fillStyle = layer.color
      ctx.textAlign = layer.align || 'left'
      ctx.textBaseline = 'top'

      const x = layer.align === 'center'
        ? (layer.x + layer.w / 2) * w
        : layer.align === 'right'
          ? (layer.x + layer.w) * w
          : layer.x * w
      const lineH = layer.size * 1.32
      const lines = (layer.text || '').split('\n')
      lines.forEach((line, i) => {
        ctx.fillText(line, x, layer.y * h + i * lineH)
      })
    }
  }
}

function scaledSize(w, h, maxW, maxH) {
  const ratio = Math.min(maxW / w, maxH / h)
  return { dw: Math.round(w * ratio), dh: Math.round(h * ratio) }
}

function TemplateThumbnail({ tpl, isSelected, onSelect }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { dw, dh } = scaledSize(tpl.w, tpl.h, 224, 150)
    const off = document.createElement('canvas')
    drawTemplate(off, { layers: tpl.layers, bg: tpl.bg, w: tpl.w, h: tpl.h })
    canvas.width = dw
    canvas.height = dh
    canvas.getContext('2d').drawImage(off, 0, 0, dw, dh)
  }, [tpl])

  return (
    <div onClick={onSelect} style={{
      marginBottom: 8, borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
      border: `2px solid ${isSelected ? '#0EA5E9' : 'transparent'}`,
      background: '#0f172a', transition: 'border-color 0.12s',
    }}>
      <SEO title="Studio Visuel Pro — Création visuelle complète" description="Studio de création visuelle : affiches, bannières, posts réseaux sociaux. Export multi-formats HD." image="/og-tools/studio-visuel-pro.jpg" />
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
      <div style={{
        padding: '5px 8px', fontSize: '0.73rem', fontWeight: 600,
        color: isSelected ? '#38BDF8' : '#94a3b8',
        background: isSelected ? 'rgba(14,165,233,0.1)' : 'transparent',
      }}>{tpl.name}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ borderBottom: '1px solid #1e293b', padding: '12px 14px' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 9 }}>{title}</div>
      {children}
    </div>
  )
}

const lblStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }
const inputStyle = { width: '100%', padding: '7px 9px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '0.82rem', boxSizing: 'border-box' }
const colorStyle = { width: '100%', height: 34, borderRadius: 8, border: '1px solid #334155', cursor: 'pointer', padding: 2 }

export default function StudioVisuelPro() {
  const [category, setCategory] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [layers, setLayers] = useState([])
  const [bg, setBg] = useState(null)
  const [dims, setDims] = useState({ w: 1080, h: 1080 })
  const [activeLayerId, setActiveLayerId] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [fmt, setFmt] = useState('png')

  const previewRef = useRef(null)

  const filtered = category === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === category)

  const loadTemplate = useCallback((tpl) => {
    setSelectedId(tpl.id)
    setLayers(tpl.layers.map(l => ({ ...l })))
    setBg({ ...tpl.bg })
    setDims({ w: tpl.w, h: tpl.h })
    setActiveLayerId(null)
  }, [])

  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas || !bg) return
    const parent = canvas.parentElement
    if (!parent) return
    const maxW = parent.clientWidth - 40
    const maxH = Math.min(window.innerHeight * 0.7, 600)
    const { dw, dh } = scaledSize(dims.w, dims.h, maxW, maxH)
    const off = document.createElement('canvas')
    drawTemplate(off, { layers, bg, w: dims.w, h: dims.h })
    canvas.width = dw
    canvas.height = dh
    canvas.getContext('2d').drawImage(off, 0, 0, dw, dh)
  }, [layers, bg, dims])

  function updateLayer(id, patch) {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  function handleExport() {
    setExporting(true)
    const off = document.createElement('canvas')
    drawTemplate(off, { layers, bg, w: dims.w, h: dims.h })
    const mime = fmt === 'jpg' ? 'image/jpeg' : 'image/png'
    off.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `studio-visuel.${fmt}`
      a.click()
      URL.revokeObjectURL(url)
      setExporting(false)
    }, mime, 0.95)
  }

  const activeLayer = layers.find(l => l.id === activeLayerId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid #1e293b', background: '#1e293b', flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1.3rem' }}>🎨</span>
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>Studio Visuel Pro</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{TEMPLATES.length} templates · Export HD</div>
        </div>
        <div style={{ flex: 1 }} />
        {selectedId && (
          <>
            <select value={fmt} onChange={e => setFmt(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '6px 10px' }}>
              <option value="png">PNG haute qualité</option>
              <option value="jpg">JPEG léger</option>
            </select>
            <button onClick={handleExport} disabled={exporting} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: exporting ? 'default' : 'pointer', opacity: exporting ? 0.6 : 1 }}>
              {exporting ? '⏳ Export…' : '⬇ Exporter HD'}
            </button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar — gallery */}
        <div style={{ width: 252, borderRight: '1px solid #1e293b', background: '#1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} style={{
                  padding: '3px 9px', borderRadius: 20, border: '1px solid',
                  borderColor: category === c.id ? '#0EA5E9' : '#334155',
                  background: category === c.id ? 'rgba(14,165,233,0.18)' : 'transparent',
                  color: category === c.id ? '#38BDF8' : '#94a3b8',
                  fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
            {filtered.map(tpl => (
              <TemplateThumbnail key={tpl.id} tpl={tpl} isSelected={selectedId === tpl.id} onSelect={() => loadTemplate(tpl)} />
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'auto' }}>
          {selectedId ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <canvas
                ref={previewRef}
                onClick={e => {
                  if (!previewRef.current) return
                  const rect = previewRef.current.getBoundingClientRect()
                  const px = (e.clientX - rect.left) / rect.width
                  const py = (e.clientY - rect.top) / rect.height
                  const hit = [...layers].reverse().find(l => {
                    if (l.type !== 'text') return false
                    return px >= l.x && px <= l.x + l.w && py >= l.y - 0.01 && py <= l.y + (l.size / dims.h) * 2.5
                  })
                  setActiveLayerId(hit?.id ?? null)
                }}
                style={{
                  cursor: 'crosshair', maxWidth: '100%',
                  border: `2px solid ${activeLayerId ? '#0EA5E9' : '#1e293b'}`,
                  borderRadius: 6, boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                }}
              />
              <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                {dims.w} × {dims.h}px · Cliquez sur un texte pour le modifier
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#475569' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 10 }}>🎨</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>Choisissez un template</div>
              <div style={{ fontSize: '0.82rem' }}>Sélectionnez un modèle dans la galerie pour commencer</div>
            </div>
          )}
        </div>

        {/* Properties panel */}
        {selectedId && (
          <div style={{ width: 272, borderLeft: '1px solid #1e293b', background: '#1e293b', overflowY: 'auto', flexShrink: 0 }}>

            <Section title="Arrière-plan">
              {bg?.type === 'gradient' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label style={lblStyle}>Couleur 1</label>
                  <input type="color" value={bg.color1} onChange={e => setBg(b => ({ ...b, color1: e.target.value }))} style={colorStyle} />
                  <label style={lblStyle}>Couleur 2</label>
                  <input type="color" value={bg.color2} onChange={e => setBg(b => ({ ...b, color2: e.target.value }))} style={colorStyle} />
                  <label style={lblStyle}>Angle : {bg.angle}°</label>
                  <input type="range" min="0" max="360" value={bg.angle} onChange={e => setBg(b => ({ ...b, angle: +e.target.value }))} style={{ width: '100%' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label style={lblStyle}>Couleur de fond</label>
                  <input type="color" value={bg?.color || '#ffffff'} onChange={e => setBg(b => ({ ...b, color: e.target.value }))} style={colorStyle} />
                </div>
              )}
              <button onClick={() => {
                if (bg?.type === 'gradient') setBg({ type: 'solid', color: bg.color1 })
                else setBg(b => ({ type: 'gradient', color1: b.color || '#0F172A', color2: '#1E293B', angle: 135 }))
              }} style={{ marginTop: 8, padding: '4px 10px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}>
                {bg?.type === 'gradient' ? '→ Couleur unie' : '→ Dégradé'}
              </button>
            </Section>

            <Section title="Éléments texte">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {layers.filter(l => l.type === 'text').map(l => (
                  <div key={l.id} onClick={() => setActiveLayerId(l.id === activeLayerId ? null : l.id)} style={{
                    padding: '7px 9px', borderRadius: 8, cursor: 'pointer', fontSize: '0.76rem',
                    color: activeLayerId === l.id ? '#38BDF8' : '#94a3b8',
                    border: `1px solid ${activeLayerId === l.id ? '#0EA5E9' : '#334155'}`,
                    background: activeLayerId === l.id ? 'rgba(14,165,233,0.1)' : 'transparent',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {l.text?.replace(/\n/g, ' ') || '(vide)'}
                  </div>
                ))}
                <button onClick={() => {
                  const id = 'txt_' + Date.now()
                  setLayers(p => [...p, { id, type: 'text', text: 'Nouveau texte', x: 0.1, y: 0.5, w: 0.8, align: 'center', font: 'Inter, sans-serif', size: 48, weight: 700, color: '#FFFFFF' }])
                  setActiveLayerId(id)
                }} style={{ marginTop: 4, padding: '6px', borderRadius: 8, border: '1px dashed #334155', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '0.78rem' }}>
                  + Ajouter un texte
                </button>
              </div>
            </Section>

            {activeLayer?.type === 'text' && (
              <Section title="Modifier le texte">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div>
                    <label style={lblStyle}>Contenu</label>
                    <textarea value={activeLayer.text} onChange={e => updateLayer(activeLayer.id, { text: e.target.value })} style={{ ...inputStyle, minHeight: 68, resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={lblStyle}>Police</label>
                    <select value={activeLayer.font} onChange={e => updateLayer(activeLayer.id, { font: e.target.value })} style={inputStyle}>
                      {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lblStyle}>Taille : {activeLayer.size}px</label>
                    <input type="range" min="10" max="250" value={activeLayer.size} onChange={e => updateLayer(activeLayer.id, { size: +e.target.value })} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={lblStyle}>Couleur</label>
                    <input type="color" value={/^#[0-9a-f]{3,6}$/i.test(activeLayer.color) ? activeLayer.color : '#ffffff'} onChange={e => updateLayer(activeLayer.id, { color: e.target.value })} style={colorStyle} />
                  </div>
                  <div>
                    <label style={lblStyle}>Graisse</label>
                    <select value={activeLayer.weight} onChange={e => updateLayer(activeLayer.id, { weight: +e.target.value })} style={inputStyle}>
                      {[400, 500, 600, 700, 800, 900].map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lblStyle}>Alignement</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['left', 'center', 'right'].map(a => (
                        <button key={a} onClick={() => updateLayer(activeLayer.id, { align: a })} style={{
                          flex: 1, padding: '5px', borderRadius: 8, border: '1px solid',
                          borderColor: activeLayer.align === a ? '#0EA5E9' : '#334155',
                          background: activeLayer.align === a ? 'rgba(14,165,233,0.18)' : 'transparent',
                          color: activeLayer.align === a ? '#38BDF8' : '#94a3b8', cursor: 'pointer', fontSize: '0.8rem',
                        }}>
                          {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={lblStyle}>Position Y : {Math.round(activeLayer.y * 100)}%</label>
                    <input type="range" min="0" max="95" value={Math.round(activeLayer.y * 100)} onChange={e => updateLayer(activeLayer.id, { y: +e.target.value / 100 })} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={lblStyle}>Position X : {Math.round(activeLayer.x * 100)}%</label>
                    <input type="range" min="0" max="90" value={Math.round(activeLayer.x * 100)} onChange={e => updateLayer(activeLayer.id, { x: +e.target.value / 100 })} style={{ width: '100%' }} />
                  </div>
                  <button onClick={() => {
                    setLayers(p => p.filter(l => l.id !== activeLayer.id))
                    setActiveLayerId(null)
                  }} style={{ padding: '6px', borderRadius: 8, border: '1px solid #7f1d1d', background: 'rgba(220,38,38,0.1)', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem' }}>
                    🗑 Supprimer ce texte
                  </button>
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
