import { groqChatCompletion } from './groqClient'

export const DESIGN_TYPES = {
  LOGO:          'logo',
  AFFICHE:       'affiche',
  VISUEL_RESEAU: 'visuel_reseau',
  MAQUETTE_WEB:  'maquette_web',
  CARTE_VISITE:  'carte_visite',
  BANNIERE:      'banniere',
  FLYER:         'flyer',
  BROCHURE:      'brochure',
  PRESENTATION:  'presentation',
  PACKAGING:     'packaging',
}

// Dimensions for HTML fallback
const DIMS = {
  affiche:       { w: 600, h: 850,  label: 'Affiche A3 portrait' },
  flyer:         { w: 600, h: 850,  label: 'Flyer A5 portrait' },
  visuel_reseau: { w: 600, h: 600,  label: 'Post carré' },
  carte_visite:  { w: 550, h: 320,  label: 'Carte de visite' },
  banniere:      { w: 728, h: 250,  label: 'Bannière web' },
  maquette_web:  { w: 600, h: 900,  label: 'Landing page mobile' },
  brochure:      { w: 600, h: 850,  label: 'Brochure' },
  presentation:  { w: 700, h: 420,  label: 'Slide 16:9' },
  packaging:     { w: 500, h: 700,  label: 'Packaging' },
  logo:          { w: 512, h: 512,  label: 'Logo' },
}

// Replicate model selection per design type
const REPLICATE_MODEL = {
  logo:          'recraft-ai/recraft-v3',
  affiche:       'black-forest-labs/flux-schnell',
  flyer:         'black-forest-labs/flux-schnell',
  visuel_reseau: 'black-forest-labs/flux-schnell',
  carte_visite:  'black-forest-labs/flux-schnell',
  banniere:      'black-forest-labs/flux-schnell',
  maquette_web:  'black-forest-labs/flux-schnell',
  brochure:      'black-forest-labs/flux-schnell',
  presentation:  'black-forest-labs/flux-schnell',
  packaging:     'black-forest-labs/flux-schnell',
}

// Aspect ratios for FLUX Schnell
const FLUX_ASPECT = {
  logo:          '1:1',
  affiche:       '2:3',
  flyer:         '2:3',
  visuel_reseau: '1:1',
  carte_visite:  '3:2',
  banniere:      '16:9',
  maquette_web:  '9:16',
  brochure:      '2:3',
  presentation:  '16:9',
  packaging:     '2:3',
}

// Recraft v3 sizes (width x height strings)
const RECRAFT_SIZE = {
  logo:          '1024x1024',
  affiche:       '683x1024',
  flyer:         '683x1024',
  visuel_reseau: '1024x1024',
  carte_visite:  '1365x1024',
  banniere:      '1365x1024',
  maquette_web:  '683x1024',
  brochure:      '683x1024',
  presentation:  '1365x1024',
  packaging:     '683x1024',
}

function buildPrompt(fd, type) {
  const company = fd.nomEntreprise || 'ENTREPRISE'
  const slogan  = fd.slogan ? `slogan "${fd.slogan}"` : ''
  const sector  = fd.secteur || 'services'
  const style   = fd.stylePrefere || 'professional modern'
  const p       = fd.couleurPrimaire || '#1E40AF'
  const s       = fd.couleurSecondaire || '#7C3AED'
  const values  = fd.valeurs ? `, values: ${fd.valeurs}` : ''

  const base = `${company}, ${slogan} ${sector} sector${values}, ${style} design, professional, high quality, commercial use`
  const colorHint = `primary color ${p}, accent color ${s}`

  const specific = {
    logo: `Minimalist professional logo for "${company}", vector art style, clean white background, simple iconic symbol, ${style}, ${colorHint}, brand identity, scalable, suitable for printing`,
    affiche: `Eye-catching advertising poster for "${company}" ${slogan}, ${sector}, ${colorHint}, bold typography, ${style}, professional print-ready A3 portrait poster, striking visual, marketing design`,
    flyer: `Promotional flyer for "${company}" ${slogan}, ${sector}, ${colorHint}, ${style}, modern layout, bold headline, call to action, professional print quality, portrait format`,
    visuel_reseau: `Social media post design for "${company}" ${slogan}, ${sector}, ${colorHint}, ${style}, square format, vibrant and bold, eye-catching, Instagram and Facebook ready`,
    carte_visite: `Professional business card design for "${company}", ${sector}, ${colorHint}, ${style}, elegant minimal layout, clean typography, landscape format, print-ready`,
    banniere: `Wide web banner for "${company}" ${slogan}, ${sector}, ${colorHint}, ${style}, horizontal format, digital advertising, modern and clean, call to action`,
    maquette_web: `Modern website landing page mockup for "${company}", ${sector}, ${colorHint}, ${style}, mobile-first UI design, clean layout, professional web design`,
    brochure: `Corporate brochure cover for "${company}", ${sector}, ${colorHint}, ${style}, premium print design, portrait format, professional brand communication`,
    presentation: `Professional presentation slide for "${company}", ${sector}, ${colorHint}, ${style}, widescreen 16:9 corporate slide template, dark premium background, bold typography`,
    packaging: `Product packaging label for "${company}", ${sector}, ${colorHint}, ${style}, premium retail packaging, professional product design, label artwork`,
  }

  return specific[type] || `${base}, ${colorHint}, ${type} design`
}

async function generateViaReplicate(formData, designType) {
  const model   = REPLICATE_MODEL[designType] || 'black-forest-labs/flux-schnell'
  const prompt  = buildPrompt(formData, designType)
  const isRecraft = model.startsWith('recraft')

  const input = isRecraft
    ? {
        prompt,
        style: designType === 'logo' ? 'vector_illustration' : 'digital_illustration',
        size: RECRAFT_SIZE[designType] || '1024x1024',
      }
    : {
        prompt,
        aspect_ratio: FLUX_ASPECT[designType] || '1:1',
        output_format: 'png',
        num_outputs: 1,
        output_quality: 90,
      }

  const res = await fetch('/.netlify/functions/replicate-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `replicate-generate HTTP ${res.status}`)
  }

  const data = await res.json()
  if (!data.success || !data.output?.length) throw new Error('No image returned from Replicate')

  return data.output[0]
}

// ── Groq HTML fallback ──────────────────────────────────────────────────────

const GROQ_SYSTEM = "Tu es un Directeur Artistique senior. Génère UNIQUEMENT du HTML avec styles inline — un design visuel complet. Aucune explication, aucun markdown, aucune balise code. Uniquement le HTML du div racine."

function buildHtmlPrompt(formData, designType) {
  const d = DIMS[designType] || DIMS.affiche
  const p = formData.couleurPrimaire || '#1d4ed8'
  const s = formData.couleurSecondaire || '#7c3aed'
  const name = formData.nomEntreprise || 'ENTREPRISE'

  return `Génère un design ${d.label} HTML (${d.w}×${d.h}px).
Div racine: width:${d.w}px;height:${d.h}px;overflow:hidden;position:relative;font-family:Arial,Helvetica,sans-serif;
Styles inline uniquement. Couleurs ${p} et ${s}. Nom visible: "${name}". Slogan: "${formData.slogan || ''}".
Design professionnel, gradients, typographie lisible, impact visuel fort.
Réponds UNIQUEMENT avec le HTML du div racine.`
}

async function generateViaGroqHtml(formData, designType) {
  const data = await groqChatCompletion({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.6,
    max_tokens: 4000,
    messages: [
      { role: 'system', content: GROQ_SYSTEM },
      { role: 'user', content: buildHtmlPrompt(formData, designType) },
    ],
  })
  const raw = data?.choices?.[0]?.message?.content?.trim() || ''
  const match = raw.match(/<div[\s\S]*<\/div>/i)
  return match ? match[0] : raw
}

function fallbackHtml(fd, type, dim) {
  const p = fd.couleurPrimaire || '#1d4ed8'
  const s = fd.couleurSecondaire || '#7c3aed'
  const name = fd.nomEntreprise || 'ENTREPRISE'
  const slogan = fd.slogan || 'Excellence & Innovation'
  return `<div style="width:${dim.w}px;height:${dim.h}px;overflow:hidden;position:relative;font-family:Arial,Helvetica,sans-serif;background:linear-gradient(135deg,${p} 0%,${s} 100%);">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.35);"></div>
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#fff;">
    <div style="font-size:${Math.round(dim.w * 0.07)}px;font-weight:900;letter-spacing:-1px;margin-bottom:16px;">${name.toUpperCase()}</div>
    <div style="font-size:${Math.round(dim.w * 0.03)}px;opacity:.85;font-weight:300;letter-spacing:3px;">${slogan.toUpperCase()}</div>
    <div style="margin-top:32px;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.6);border-radius:40px;padding:12px 36px;font-size:${Math.round(dim.w * 0.026)}px;font-weight:700;display:inline-block;">Découvrir →</div>
  </div>
</div>`
}

// ── Main export ─────────────────────────────────────────────────────────────

export async function generateDesign(formData, designType) {
  const start = Date.now()
  const dim = DIMS[designType] || DIMS.affiche

  // 1. Try Replicate image generation
  try {
    const imageUrl = await generateViaReplicate(formData, designType)
    return {
      success: true,
      imageUrl,
      designType,
      dim,
      provider: 'replicate',
      model: REPLICATE_MODEL[designType] || 'flux-schnell',
      duration: Date.now() - start,
    }
  } catch (replicateErr) {
    console.warn('[designStudio] Replicate failed, falling back to Groq HTML:', replicateErr.message)
  }

  // 2. Fallback: Groq-generated HTML visual
  try {
    const html = await generateViaGroqHtml(formData, designType)
    return {
      success: true,
      html,
      designType,
      dim,
      provider: 'groq',
      duration: Date.now() - start,
    }
  } catch {
    // 3. Last resort: static gradient
    return {
      success: true,
      html: fallbackHtml(formData, designType, dim),
      designType,
      dim,
      provider: 'fallback',
      duration: Date.now() - start,
    }
  }
}

export function getDesignTypeName(type) {
  return {
    [DESIGN_TYPES.LOGO]:          'Logo',
    [DESIGN_TYPES.AFFICHE]:       'Affiche Publicitaire',
    [DESIGN_TYPES.VISUEL_RESEAU]: 'Visuel Réseaux Sociaux',
    [DESIGN_TYPES.MAQUETTE_WEB]:  'Maquette Web',
    [DESIGN_TYPES.CARTE_VISITE]:  'Carte de Visite',
    [DESIGN_TYPES.BANNIERE]:      'Bannière Web',
    [DESIGN_TYPES.FLYER]:         'Flyer Promotionnel',
    [DESIGN_TYPES.BROCHURE]:      'Brochure',
    [DESIGN_TYPES.PRESENTATION]:  'Présentation',
    [DESIGN_TYPES.PACKAGING]:     'Packaging Produit',
  }[type] || 'Design'
}

export function getAvailableDesignTypes() {
  return [
    { id: DESIGN_TYPES.LOGO,          name: 'Logo',                    icon: '🎯', description: 'Logo vectoriel professionnel (Recraft AI)' },
    { id: DESIGN_TYPES.AFFICHE,       name: 'Affiche Publicitaire',    icon: '📢', description: 'Affiches A3 portrait impact maximal' },
    { id: DESIGN_TYPES.FLYER,         name: 'Flyer Promotionnel',      icon: '📄', description: 'Flyers A5 et documents promotionnels' },
    { id: DESIGN_TYPES.VISUEL_RESEAU, name: 'Visuel Réseaux Sociaux',  icon: '📱', description: 'Posts carré pour Instagram, Facebook…' },
    { id: DESIGN_TYPES.CARTE_VISITE,  name: 'Carte de Visite',         icon: '💳', description: 'Cartes pro prêtes à imprimer' },
    { id: DESIGN_TYPES.BANNIERE,      name: 'Bannière Web',            icon: '🖥',  description: 'Bannières publicitaires horizontales' },
    { id: DESIGN_TYPES.MAQUETTE_WEB,  name: 'Maquette Web / App',      icon: '🌐', description: 'Landing page et maquette mobile' },
    { id: DESIGN_TYPES.BROCHURE,      name: 'Brochure',                icon: '📖', description: 'Brochures et documents premium' },
    { id: DESIGN_TYPES.PRESENTATION,  name: 'Slide Présentation',      icon: '📊', description: 'Slides professionnelles 16:9' },
    { id: DESIGN_TYPES.PACKAGING,     name: 'Packaging Produit',       icon: '📦', description: "Design d'étiquette et emballage" },
  ]
}
