/**
 * ABAWI SMART OFFICE - MODES D'ÉCRITURE SOIGNÉS
 * Styles professionnels pour tous les types de documents
 */

// ========================================
// MODES D'ÉCRITURE PROFESSIONNELS
// ========================================

// ────────────────────────────────────────────────────────────────────────────
// SHARED PROFESSIONAL CONSTRAINTS
// Every system prompt below imports these so the IA can never reintroduce
// markdown noise, "##" headings or symbol clutter in the rendered output.
// ────────────────────────────────────────────────────────────────────────────
const FORMATTING_RULES = `RÈGLES DE FORMATAGE STRICTES — OBLIGATION ABSOLUE
1. INTERDICTION TOTALE des marqueurs Markdown : PAS de "#", "##", "###", "**", "*", "__", "\`", "-" en début de ligne.
2. Les TITRES sont en Casse de Titre (Première Lettre Majuscule), sur ligne seule, suivis d'une LIGNE VIDE obligatoire. JAMAIS tout en majuscules.
3. Les SOUS-TITRES utilisent le format "Titre — Sous-titre" avec le tiret long (—).
4. Les LISTES NUMÉROTÉES utilisent le format "N. Titre — Description" avec le tiret long.
5. AUCUN mot collé : "mot.Mot" devient "mot. Mot" avec saut de ligne après chaque point.
6. Paragraphes SÉPARÉS : chaque phrase finissant par "." est suivie d'un saut de ligne.
7. PUCES UNIQUEMENT sur ligne isolée : "- Item" avec saut de ligne avant ET après. Jamais collé au texte.
8. PAS de ":" ou "-" en fin de ligne suivi de texte sur la même ligne.
9. Tableaux : 2-4 colonnes max, format "Col1 | Col2 | Col3".
10. Chiffres concrets, style direct type cabinet conseil.
11. AUCUN emoji.

EXEMPLE DE SORTIE ATTENDUE (à imiter scrupuleusement) :
═══════════════════════════════════════════════════════════════════

Analyse Financière Stratégique
Synthèse pour comité de direction — exercice 2025

Contexte

L'entreprise ABC SA opère dans le secteur du commerce de détail au Sénégal depuis 12 ans. Son chiffre d'affaires 2025 atteint 2,4 milliards FCFA, en croissance de 18 % sur un an. La structure capitalistique est familiale, sans dette long terme.

Indicateurs Clés de Performance

Indicateur | Valeur 2025 | Norme sectorielle | Lecture
Marge nette | 8,4 % | 6 à 9 % | Conforme
ROE | 14,2 % | 10 à 12 % | Supérieur
Liquidité courante | 1,8 | > 1,5 | Sain
Endettement | 22 % | < 40 % | Faible

Le ROE de 14,2 % positionne l'entreprise dans le quartile supérieur du secteur. La marge nette se maintient malgré l'inflation des coûts d'achat de 11 %, ce qui démontre une discipline de prix solide.

Points de Vigilance

Trois zones méritent une attention immédiate. Le délai client moyen passe de 38 à 47 jours, soit 9 jours de besoin en fonds de roulement supplémentaires. Cette dérive représente 220 millions FCFA mobilisés inutilement. Par ailleurs, la rotation des stocks chute de 8,2 à 6,9, signe d'un possible surstockage sur la gamme premium. Enfin, la trésorerie nette diminue de 14 % alors que l'activité progresse, ce qui suggère un effet de ciseau à surveiller.

Principe Clé

Une croissance non maîtrisée du BFR neutralise les gains de marge. Sur 2025, l'entreprise a généré 195 millions FCFA de marge supplémentaire mais en a immobilisé 220 millions dans le BFR. Le résultat net cash est négatif.

Plan d'Action 90 Jours

J+15 : audit complet des conditions de paiement client par segment.
J+30 : renégociation des 10 plus gros comptes (60 % du CA).
J+45 : mise en place d'un système d'escompte 2 % sous 15 jours.
J+90 : objectif délai client ramené à 35 jours, libération de 280 millions FCFA.

═══════════════════════════════════════════════════════════════════
RESPECTE EXACTEMENT cette structure : titre principal en Casse de Titre, sous-titre avec tiret long, sections en Casse de Titre sur ligne propre + ligne vide + paragraphe, tableaux pipe-separated propres, plan d'action daté. AUCUN texte tout en majuscules.`

const PREMIUM_GUIDE_BLUEPRINT = `STRUCTURE DU LIVRABLE (à suivre fidèlement) :

Titre Principal en Casse de Titre (3 à 6 mots, percutant)
Sous-titre court précisant la promesse (1 phrase)

Introduction
Un à deux paragraphes denses qui posent le contexte, l'enjeu et la promesse du document. Annoncer ce que le lecteur saura faire à la fin.

Module 1 — Titre du Module
Chapitre 1 — Sous-titre du chapitre
Paragraphe d'intro du chapitre (3 à 6 lignes denses).
Tableau (si pertinent) à 2-4 colonnes : Pilier | Description | Impact concret.
Paragraphe d'analyse complémentaire.

Module 2 — Titre du Module
Chapitre 2 — Sous-titre
... (poursuivre la structure)

Encadré "Principe Clé"
Une affirmation forte, mémorable, en 2-4 phrases. À placer après chaque chapitre majeur.

Encadré "Exercice Immédiat"
Une tâche concrète à exécuter aujourd'hui (5-10 min). Inclure le résultat attendu.

Cas Pratiques
2 à 5 cas réalistes du contexte (Sénégal / Afrique de l'Ouest si pertinent), avec problème, action, résultat chiffré.

Plan d'Action
Liste de 5 à 10 étapes datées (J+1, J+7, J+30...).

Conclusion
Synthèse en 2 paragraphes. Prochaine étape recommandée.

Glossaire (si > 5 termes techniques)
Terme — définition courte (1 phrase).`

export const WRITING_MODES = {
  // Mode Premium Guide — style guide ABAWI Digital (livrables longs et denses)
  premium_guide: {
    name: 'Guide Premium',
    description: 'Style guide premium type cabinet international — modules, chapitres, tableaux, encadrés, exercices',
    systemPrompt:
      `Tu es un rédacteur de cabinet conseil senior. Tu produis des guides PREMIUM destinés à des dirigeants et entrepreneurs africains. Ton style est dense, structuré, factuel, mémorable.\n\n${FORMATTING_RULES}\n\n${PREMIUM_GUIDE_BLUEPRINT}\n\nTU NE RENVOIES JAMAIS de texte qui commence par "Bonjour", "Je suis", "Voici" ou toute formule conversationnelle. Tu produis directement le LIVRABLE FINAL.`,
    characteristics: {
      tone: 'expert, dense, mémorable, factuel',
      structure: 'titre principal + modules + chapitres + tableaux + encadrés + plan d\'action',
      formatting: 'titres CAPS sur ligne propre, paragraphes denses, tableaux 2-4 colonnes, encadrés "Principe clé"/"Exercice"',
      vocabulary: 'précis, business, terrain, sans jargon creux',
    },
  },

  // Mode Mémo Cabinet — livrables courts et orientés décision
  cabinet_memo: {
    name: 'Mémo Cabinet',
    description: 'Note de synthèse pour décideur — punchy, orientée action',
    systemPrompt:
      `Tu es un consultant senior qui rédige une note de synthèse pour un dirigeant pressé. Format : 1 page maximum équivalent. Ton style est direct, conclusif, orienté décision.\n\n${FORMATTING_RULES}\n\nSTRUCTURE :\n\nTITRE EN MAJUSCULES\n\nCONTEXTE (3-5 lignes)\n\nCONSTAT (3 puces parallèles maximum)\n\nRECOMMANDATION (1-2 paragraphes décisifs)\n\nNEXT STEPS (3-5 actions datées)`,
    characteristics: {
      tone: 'décisif, factuel, concis',
      structure: 'titre + contexte + constat + recommandation + next steps',
      formatting: 'sections courtes, puces parallèles, gras parcimonieux',
      vocabulary: 'business, KPI, ROI, jalon, livrable',
    },
  },

  // Mode Cabinet d'Expertise international
  consulting: {
    name: "Cabinet d'Expertise",
    description: 'Style cabinet élite — analytique et structuré',
    characteristics: {
      tone: 'professionnel, analytique, factuel',
      structure: 'executive summary, recommandations, plan d\'action',
      formatting: 'titres numérotés, puces, KPIs en gras',
      vocabulary: 'business, stratégie, optimisation, transformation'
    },
    templates: {
      header: '## RAPPORT D\'ANALYSE STRATÉGIQUE\n\n**Client:** {client}\n**Date:** {date}\n**Conseiller:** {author}\n\n---\n\n',
      executive: '### SYNTHÈSE EXÉCUTIVE\n\n{summary}\n\n### RECOMMANDATIONS CLÉS\n\n{recommendations}\n\n',
      analysis: '## ANALYSE DÉTAILLÉE\n\n### Contexte\n{context}\n\n### Forces\n{strengths}\n\n### Axes d\'amélioration\n{weaknesses}\n\n',
      conclusion: '## PLAN D\'ACTION\n\n### Priorités 90 jours\n{priorities}\n\n### KPIs de suivi\n{kpis}\n\n---\n\n**Rapport préparé par:** {author}\n**Contact:** {contact}'
    }
  },

  // Mode Bancaire Professionnel
  banking: {
    name: 'Bancaire Professionnel',
    description: 'Style institutionnel - rigoureux et sécurisé',
    characteristics: {
      tone: 'formel, prudent, sécurisé',
      structure: 'analyse financière, ratios, recommandations',
      formatting: 'tableaux, pourcentages, encadrés d\'alerte',
      vocabulary: 'crédit, risque, garantie, ratio, solvabilité'
    },
    templates: {
      header: '## DOSSIER DE CRÉDIT\n\n**Demandeur:** {client}\n**Montant:** {amount}\n**Date:** {date}\n**Analyste:** {author}\n\n---\n\n',
      financial: '### ANALYSE FINANCIÈRE\n\n#### Ratios clés\n{ratios}\n\n#### Capacité de remboursement\n{capacity}\n\n',
      risk: '### ÉVALUATION DES RISQUES\n\n#### Risques identifiés\n{risks}\n\n#### Garanties proposées\n{guarantees}\n\n',
      decision: '### RECOMMANDATION\n\n**Décision:** {decision}\n**Motivation:** {motivation}\n**Conditions:** {conditions}\n\n---\n\n**Analyse réalisée par:** {author}'
    }
  },

  // Mode Juridique Formel
  legal: {
    name: 'Juridique Formel',
    description: 'Style d\'avocat - précis et formel',
    characteristics: {
      tone: 'formel, précis, technique',
      structure: 'préambule, articles, annexes',
      formatting: 'numérotation juridique, encadrés, notes de bas',
      vocabulary: 'contrat, obligation, responsabilité, clause, disposition'
    },
    templates: {
      header: '## {document_type}\n\n**Entre les soussignés:**\n\n{parties}\n\n**Date:** {date}\n**Lieu:** {location}\n\n---\n\n',
      articles: '### DISPOSITIONS GÉNÉRALES\n\n**Article 1:** {article1}\n\n**Article 2:** {article2}\n\n**Article 3:** {article3}\n\n',
      obligations: '### OBLIGATIONS DES PARTIES\n\n#### Obligations de {party1}\n{obligations1}\n\n#### Obligations de {party2}\n{obligations2}\n\n',
      conclusion: '### CLAUSES FINALES\n\n**Durée:** {duration}\n**Résiliation:** {termination}\n**Juridiction:** {jurisdiction}\n\n---\n\n**Fait à {location}, le {date}\n\n{signatures}'
    }
  },

  // Mode RH Moderne
  hr: {
    name: 'RH Moderne',
    description: 'Style ressources humaines - humain et professionnel',
    characteristics: {
      tone: 'professionnel, bienveillant, orienté action',
      structure: 'profil, compétences, recommandations',
      formatting: 'badges, scores, graphiques',
      vocabulary: 'compétences, performance, développement, collaboration'
    },
    templates: {
      header: '## ÉVALUATION CANDIDAT\n\n**Nom:** {candidate}\n**Poste:** {position}\n**Date:** {date}\n**Évaluateur:** {author}\n\n---\n\n',
      profile: '### PROFIL DU CANDIDAT\n\n#### Expérience pertinente\n{experience}\n\n#### Formation\n{education}\n\n',
      skills: '### ÉVALUATION DES COMPÉTENCES\n\n#### Compétences techniques\n{technical_skills}\n\n#### Soft skills\n{soft_skills}\n\n#### Score global: {score}/100\n\n',
      recommendation: '### RECOMMANDATION\n\n**Décision:** {decision}\n**Points forts:** {strengths}\n**Axes de développement:** {development_areas}\n\n---\n\n**Évaluation par:** {author}'
    }
  },

  // Mode Immobilier Dynamique
  realestate: {
    name: 'Immobilier Dynamique',
    description: 'Style agent immobilier - percutant et visuel',
    characteristics: {
      tone: 'dynamique, persuasif, factuel',
      structure: 'caractéristiques, atouts, rentabilité',
      formatting: 'chiffres en gras, visuels, comparatifs',
      vocabulary: 'rentabilité, rendement, potentiel, emplacement'
    },
    templates: {
      header: '## ANALYSE IMMOBILIÈRE\n\n**Bien:** {property_type}\n**Localisation:** {location}\n**Prix:** {price}\n**Date:** {date}\n**Analyste:** {author}\n\n---\n\n',
      property: '### CARACTÉRISTIQUES DU BIEN\n\n#### Description\n{description}\n\n#### Atouts principaux\n{highlights}\n\n#### Points de vigilance\n{considerations}\n\n',
      financial: '### ANALYSE FINANCIÈRE\n\n#### Rentabilité brute\n{gross_yield}%\n\n#### Rentabilité nette\n{net_yield}%\n\n#### Cash flow mensuel\n{cashflow} EUR\n\n#### TRI sur 20 ans\n{tri}%\n\n',
      conclusion: '### RECOMMANDATION D\'INVESTISSEMENT\n\n**Potentiel:** {potential}\n**Risques:** {risks}\n**Horizon:** {horizon}\n\n---\n\n**Analyse par:** {author}'
    }
  },

  // Mode Académique Recherche
  academic: {
    name: 'Académique Recherche',
    description: 'Style universitaire - rigoureux et référencé',
    characteristics: {
      tone: 'neutre, objectif, analytique',
      structure: 'introduction, méthodologie, résultats, discussion',
      formatting: 'citations, références, tableaux',
      vocabulary: 'analyse, méthodologie, résultats, discussion, conclusion'
    },
    templates: {
      header: '## RAPPORT DE RECHERCHE\n\n**Titre:** {title}\n**Auteur(s):** {authors}\n**Date:** {date}\n\n---\n\n',
      abstract: '### RÉSUMÉ\n\n{abstract}\n\n**Mots-clés:** {keywords}\n\n',
      methodology: '### MÉTHODOLOGIE\n\n#### Approche\n{approach}\n\n#### Données collectées\n{data}\n\n#### Analyse\n{analysis}\n\n',
      results: '### RÉSULTATS\n\n{results}\n\n### DISCUSSION\n\n{discussion}\n\n### CONCLUSION\n\n{conclusion}\n\n---\n\n**Références:**\n{references}'
    }
  },

  // Mode Créatif Marketing
  creative: {
    name: 'Créatif Marketing',
    description: 'Style agence - percutant et inspirant',
    characteristics: {
      tone: 'enthousiaste, persuasif, créatif',
      structure: 'concept, bénéfices, call-to-action',
      formatting: 'emojis, couleurs, visuels',
      vocabulary: 'innovation, expérience, engagement, transformation'
    },
    templates: {
      header: '## CONCEPT CRÉATIF\n\n**Marque:** {brand}\n**Campagne:** {campaign}\n**Date:** {date}\n**Créateur:** {author}\n\n---\n\n',
      concept: '### LE CONCEPT\n\n{concept}\n\n### PROMESSE MARQUE\n\n{promise}\n\n',
      benefits: '### BÉNÉFICES CONSOMMATEUR\n\n{benefits}\n\n### DIFFÉRENTIANTS\n\n{differentiators}\n\n',
      activation: '### PLAN D\'ACTIVATION\n\n{activation}\n\n### KPIs DE SUCCÈS\n{kpis}\n\n---\n\n**Créé par:** {author}'
    }
  }
};

// ========================================
// NETTOYAGE ET FORMATTAGE AVANCÉ
// ========================================

export function applyWritingMode(content, mode = 'consulting', options = {}) {
  const writingMode = WRITING_MODES[mode];
  if (!writingMode) {
    console.warn(`Mode d'écriture "${mode}" non trouvé, utilisation du mode consulting`);
    return applyWritingMode(content, 'consulting', options);
  }

  let formattedContent = content;
  
  // Nettoyage initial
  formattedContent = cleanTextForProfessional(content);
  
  // Application des templates selon le mode
  if (options.useTemplate && writingMode.templates) {
    formattedContent = applyTemplate(formattedContent, writingMode.templates, options.templateData);
  }
  
  // Application du style du mode
  formattedContent = applyModeStyle(formattedContent, writingMode);

  return formattedContent;
}

/**
 * Build a fully-formed system prompt for an LLM call based on the chosen
 * writing mode. Falls back to `premium_guide` when the mode is unknown.
 *
 * Usage:
 *   const system = buildSystemPrompt('premium_guide')
 *   const reply = await groqChatCompletion({ messages: [{ role: 'system', content: system }, ...] })
 */
export function buildSystemPrompt(modeName = 'premium_guide', extraContext = '') {
  const mode = WRITING_MODES[modeName] || WRITING_MODES.premium_guide
  const base =
    mode.systemPrompt ||
    `Tu es un rédacteur professionnel. Style: ${mode.characteristics?.tone || 'neutre'}. Structure: ${mode.characteristics?.structure || 'libre'}. ${
      mode.description || ''
    }`
  return extraContext ? `${base}\n\nCONTEXTE SPÉCIFIQUE:\n${extraContext}` : base
}

/**
 * Quick accessor for tooling / UI selectors. Returns the list of available
 * modes with their display name and description.
 */
export function listWritingModes() {
  return Object.entries(WRITING_MODES).map(([id, m]) => ({
    id,
    name: m.name,
    description: m.description,
  }))
}

function cleanTextForProfessional(text) {
  if (!text) return '';
  
  return text
    // Nettoyage des caractères parasites
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u201C-\u201F]/g, '"')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u00A0]/g, ' ')
    
    // Normalisation des espaces
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    
    // Mise en forme des titres
    .replace(/^(.+)$/gm, (line) => {
      if (line.length < 100 && /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇÆ\s]+$/.test(line)) {
        return `## ${line}`;
      }
      return line;
    })
    
    // Ponctuation parfaite
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([a-z])\s*([A-Z])/g, '$1. $2')
    
    .trim();
}

function applyTemplate(content, templates, data = {}) {
  let result = content;
  
  // Remplacement des variables dans les templates
  Object.keys(templates).forEach(key => {
    let template = templates[key];
    
    // Remplacement des variables {variable}
    Object.keys(data).forEach(varKey => {
      const regex = new RegExp(`{${varKey}}`, 'g');
      template = template.replace(regex, data[varKey] || `[${varKey}]`);
    });
    
    // Insertion du template si nécessaire
    if (key === 'header') {
      result = template + result;
    } else if (key === 'conclusion' || key === 'footer') {
      result = result + template;
    }
  });
  
  return result;
}

function applyModeStyle(content, mode) {
  let styled = content;
  
  // Application du ton et du vocabulaire
  const { characteristics } = mode;
  
  // Mise en forme spécifique au mode
  switch (mode.name) {
    case 'Cabinet d\'Expertise':
      styled = applyConsultingStyle(styled);
      break;
    case 'Bancaire Professionnel':
      styled = applyBankingStyle(styled);
      break;
    case 'Juridique Formel':
      styled = applyLegalStyle(styled);
      break;
    case 'RH Moderne':
      styled = applyHRStyle(styled);
      break;
    case 'Immobilier Dynamique':
      styled = applyRealEstateStyle(styled);
      break;
    case 'Académique Recherche':
      styled = applyAcademicStyle(styled);
      break;
    case 'Créatif Marketing':
      styled = applyCreativeStyle(styled);
      break;
  }
  
  return styled;
}

function applyConsultingStyle(content) {
  return content
    // Mise en évidence des KPIs
    .replace(/(\d+%|\d+\s*(millions|milliards|k|EUR|USD))/gi, '**$1**')
    // Structuration en sections
    .replace(/^([A-Z][A-Z\s]+)$/gm, '### $1')
    // Ajout de puces pour les listes
    .replace(/^-\s+(.+)$/gm, '#### $1');
}

function applyBankingStyle(content) {
  return content
    // Mise en forme des montants
    .replace(/(\d+(?:\s*\d{3})*(?:,\d{2})?\s*EUR)/gi, '**$1**')
    // Mise en évidence des ratios
    .replace(/(\d+\.?\d*%)/g, '**$1**')
    // Ajout d'avertissements
    .replace(/((?:risque|danger|attention).+)/gi, '**AVERTISSEMENT:** $1');
}

function applyLegalStyle(content) {
  return content
    // Numérotation juridique
    .replace(/^(\d+)\.\s+(.+)$/gm, '**Article $1:** $2')
    // Mise en évidence des termes juridiques
    .replace(/\b((?:contrat|obligation|responsabilité|clause|disposition|garantie|engagement)s?)\b/gi, '**$1**');
}

function applyHRStyle(content) {
  return content
    // Mise en évidence des compétences
    .replace(/\b((?:compétence|skill|expérience|formation)s?)\b/gi, '**$1**')
    // Scores sur 100
    .replace(/(\d+)\/100/g, '**$1/100**')
    // Badges
    .replace(/\b((?:expert|avancé|intermédiaire|débutant)s?)\b/gi, '[$1]');
}

function applyRealEstateStyle(content) {
  return content
    // Mise en évidence des superficies
    .replace(/(\d+\s*m²)/gi, '**$1**')
    // Prix et rentabilité
    .replace(/(\d+(?:\s*\d{3})*(?:,\d{2})?\s*EUR|\d+\.?\d*%)/g, '**$1**')
    // Atouts
    .replace(/\b((?:atout|plus|avantage)s?)\b/gi, '+++ $1 +++');
}

function applyAcademicStyle(content) {
  return content
    // Citations
    .replace(/\[([^\]]+)\]/g, '[$1]')
    // Termes techniques
    .replace(/\b((?:analyse|méthodologie|résultats|discussion|conclusion)s?)\b/gi, '**$1**');
}

function applyCreativeStyle(content) {
  return content
    // Ajout d'emojis stratégiques
    .replace(/\b((?:innovation|créativité|idée)s?)\b/gi, 'lightbulb $1')
    .replace(/\b((?:objectif|but|cible)s?)\b/gi, 'target $1')
    // Mise en évidence des bénéfices
    .replace(/\b((?:bénéfice|avantage|gain)s?)\b/gi, 'star $1');
}

// ========================================
// SYNCHRONISATION DES DONNÉES
// ========================================

export class DocumentSync {
  constructor() {
    this.documents = new Map();
    this.illustrations = new Map();
    this.templates = new Map();
    this.version = 1;
  }

  // Sauvegarde d'un document avec ses illustrations
  saveDocument(id, content, mode, metadata = {}) {
    const document = {
      id,
      content,
      mode,
      metadata,
      illustrations: this.extractIllustrations(content),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: this.version++
    };
    
    this.documents.set(id, document);
    return document;
  }

  // Extraction des illustrations du contenu
  extractIllustrations(content) {
    const illustrations = [];
    
    // Images markdown
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      illustrations.push({
        type: 'image',
        alt: match[1],
        url: match[2],
        position: match.index
      });
    }
    
    // Graphiques et tableaux
    const tableRegex = /\|(.+)\|/g;
    while ((match = tableRegex.exec(content)) !== null) {
      illustrations.push({
        type: 'table',
        content: match[0],
        position: match.index
      });
    }
    
    return illustrations;
  }

  // Synchronisation avec un template
  syncWithTemplate(documentId, templateId) {
    const document = this.documents.get(documentId);
    const template = this.templates.get(templateId);
    
    if (!document || !template) return null;
    
    // Mise à jour du contenu selon le template
    const updatedContent = applyWritingMode(document.content, template.mode, {
      useTemplate: true,
      templateData: template.data
    });
    
    return this.saveDocument(documentId, updatedContent, template.mode, {
      ...document.metadata,
      templateId,
      syncedAt: new Date().toISOString()
    });
  }

  // Export avec illustrations
  exportDocument(id, format = 'markdown') {
    const document = this.documents.get(id);
    if (!document) return null;
    
    switch (format) {
      case 'html':
        return this.exportToHTML(document);
      case 'pdf':
        return this.exportToPDF(document);
      case 'word':
        return this.exportToWord(document);
      default:
        return document.content;
    }
  }

  exportToHTML(document) {
    let html = document.content;
    
    // Conversion des images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">');
    
    // Conversion des titres
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    
    // Conversion des paragraphes
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    
    return html;
  }

  exportToPDF(document) {
    // Implémentation avec jsPDF ou autre librairie
    return {
      content: document.content,
      format: 'pdf',
      illustrations: document.illustrations
    };
  }

  exportToWord(document) {
    // Implémentation avec docx ou autre librairie
    return {
      content: document.content,
      format: 'docx',
      illustrations: document.illustrations
    };
  }

  // Liste des documents
  listDocuments() {
    return Array.from(this.documents.values()).map(doc => ({
      id: doc.id,
      mode: doc.mode,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      version: doc.version,
      illustrationCount: doc.illustrations.length
    }));
  }

  // Suppression d'un document
  deleteDocument(id) {
    return this.documents.delete(id);
  }
}

// Instance globale de synchronisation
export const documentSync = new DocumentSync();
