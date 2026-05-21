/**
 * Nettoyage ULTRA-AGRESSIF des textes IA - Format Professionnel Strict
 * 
 * RÈGLES STRICTES:
 * - AUCUN texte en majuscules (convertir en Title Case)
 * - AUCUN symbole # (supprimer complètement)
 * - AUCUN mot collé (corriger agressivement)
 * - PUCES sur ligne isolée (jamais collées au texte)
 * - Paragraphes bien séparés
 */

function toTitleCase(str) {
  // Convert ALL CAPS to Title Case (First Letter Of Each Word)
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())
}

function fixStuckWords(text) {
  // Fix various patterns of stuck words
  let cleaned = text
  
  // Pattern 1: lowercase followed by uppercase (wordWord -> word Word)
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2')
  
  // Pattern 2: punctuation stuck to word (word.Word -> word. Word)
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, '$1 $2')
  cleaned = cleaned.replace(/([.!?])([a-z])/g, '$1 $2')
  
  // Pattern 3: dash stuck to words (word-word -> word - word)
  cleaned = cleaned.replace(/([a-zA-Z])-([a-zA-Z])/g, '$1 - $2')
  
  // Pattern 4: colon stuck to words (word:word -> word: word)
  cleaned = cleaned.replace(/([a-zA-Z]):([a-zA-Z])/g, '$1: $2')
  
  // Pattern 5: semicolon stuck to words
  cleaned = cleaned.replace(/([a-zA-Z]);([a-zA-Z])/g, '$1; $2')
  
  return cleaned
}

export function cleanIAText(text) {
  if (!text || typeof text !== 'string') return ''
  
  let cleaned = text
  
  // === ÉTAPE 1: SUPPRESSION TOTALE MARKDOWN ET SYMBOLES ===
  
  // Supprimer code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '')
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')
  
  // Supprimer TOUS les # de titres markdown (même au milieu du texte)
  cleaned = cleaned.replace(/#{1,6}\s*/g, '')
  cleaned = cleaned.replace(/#/g, '')  // Supprimer tous les # restants
  
  // Supprimer les astérisques de mise en forme
  cleaned = cleaned.replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1')
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1')
  
  // === ÉTAPE 1.5: GESTION DES PUCES ET LISTES ===
  // Mettre les puces (•, -, *) au début de ligne sur une ligne isolée
  cleaned = cleaned.replace(/([a-zA-Z])\s*[-*•]\s+([a-zA-Z])/g, '$1\n\n• $2')
  // Assurer que les puces markdown sont bien formatées
  cleaned = cleaned.replace(/^\s*[-*•]\s*/gm, '• ')
  
  // === ÉTAPE 2: CORRECTION AGRESSIVE DES MOTS COLLÉS ===
  
  cleaned = fixStuckWords(cleaned)
  
  // Supprimer espaces multiples
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ')
  
  // Supprimer espaces en début/fin de ligne
  cleaned = cleaned.replace(/^[ \t]+/gm, '')
  cleaned = cleaned.replace(/[ \t]+$/gm, '')
  
  // === ÉTAPE 3: STRUCTURATION DES PARAGRAPHES ===
  
  // Saut de ligne après chaque phrase
  cleaned = cleaned.replace(/([.!?])(\s+)(?=[A-Z])/g, '$1\n\n')
  
  // Supprimer lignes vides multiples
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  
  // === ÉTAPE 4: CONVERSION MAJUSCULES ET FORMATAGE ===
  
  const lines = cleaned.split('\n')
  const result = []
  let i = 0
  
  while (i < lines.length) {
    let line = lines[i].trim()
    
    if (!line) {
      i++
      continue
    }
    
    // Convertir TOUTES les lignes entièrement en MAJUSCULES (même longues) sauf si c'est clairement un titre court
    if (line === line.toUpperCase() && line.length > 3) {
      // Si c'est une phrase (contient un point), convertir en phrase normale (première lettre majuscule, reste minuscule)
      // Si c'est un titre court sans point, convertir en Title Case
      const hasSentence = line.includes('.') || line.includes('!') || line.includes('?')
      const isShortTitle = line.length < 60 && !hasSentence
      
      if (isShortTitle) {
        // C'est un titre court - Title Case
        result.push('')
        result.push(toTitleCase(line))
        result.push('')
      } else {
        // C'est une phrase ou texte long - Sentence case (première lettre majuscule, reste normal)
        const sentenceCase = line.charAt(0) + line.slice(1).toLowerCase()
        result.push(sentenceCase)
      }
      i++
      continue
    }
    
    // Détecter les phrases avec em-dash (sous-titres)
    if ((line.includes(' — ') || line.includes(' – ')) && !line.match(/^\d+[.)]/)) {
      const separator = line.includes(' — ') ? ' — ' : ' – '
      const parts = line.split(separator)
      if (parts.length === 2) {
        const title = parts[0].trim()
        const subtitle = parts[1].trim()
        result.push('')
        result.push(title)
        result.push(subtitle)
        result.push('')
        i++
        continue
      }
    }
    
    // Détecter les listes numérotées
    const numMatch = line.match(/^(\d+)[.)]?\s+(.+)$/)
    if (numMatch) {
      const num = numMatch[1]
      let content = numMatch[2]
      
      // Chercher séparateur titre/description
      let title = content
      let description = ''
      
      const separators = [' — ', ' – ', ': ', ' - ', '. ']
      for (const sep of separators) {
        const idx = content.indexOf(sep)
        if (idx > 5 && idx < 100) {
          title = content.substring(0, idx).trim()
          description = content.substring(idx + sep.length).trim()
          break
        }
      }
      
      // Si pas de séparateur, première phrase = titre
      if (!description && content.length > 40) {
        const firstSentence = content.match(/^[^.!?]+[.!?]/)
        if (firstSentence) {
          title = firstSentence[0].replace(/[.!?]$/, '').trim()
          description = content.substring(firstSentence[0].length).trim()
        }
      }
      
      result.push('')
      result.push(`${num}. ${title}`)
      if (description) {
        result.push(description)
      }
      result.push('')
      i++
      continue
    }
    
    // Détecter les lignes courtes sans point qui pourraient être des titres
    if (line.length < 60 && !line.includes('.') && line.length > 5) {
      if (i + 1 < lines.length && lines[i + 1].trim().length > line.length) {
        result.push('')
        result.push(line)
        result.push('')
        i++
        continue
      }
    }
    
    // Texte normal - appliquer correction mots collés
    result.push(fixStuckWords(line))
    i++
  }
  
  // === ÉTAPE 5: NETTOYAGE FINAL ===
  
  cleaned = result.join('\n')
  
  // Dernière passe de correction des mots collés
  cleaned = fixStuckWords(cleaned)
  
  // Supprimer lignes vides au début
  cleaned = cleaned.replace(/^\n+/, '')
  
  // Supprimer lignes vides multiples
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n')
  
  return cleaned.trim()
}

export function cleanIATextLight(text) {
  if (!text || typeof text !== 'string') return ''
  let cleaned = text
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '')
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, '')
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1')
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1')
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ')
  cleaned = cleaned.replace(/^[ \t]+/gm, '')
  cleaned = cleaned.replace(/[ \t]+$/gm, '')
  cleaned = fixStuckWords(cleaned)
  cleaned = cleaned.replace(/([.!?])(\s+)(?=[A-Z])/g, '$1\n\n')
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  return cleaned.trim()
}

/**
 * Style CABINET DE CONSEIL ÉLITE (McKinsey/BCG style)
 * - Numérotation stratégique au lieu de puces
 * - Titres de section en GRAS et MAJUSCULES
 * - Ton direct, action-oriented, explicite
 * - Structure hiérarchique claire
 */
export function cleanIATextElite(text) {
  if (!text || typeof text !== 'string') return ''
  
  let cleaned = text
  
  // === ÉTAPE 1: PRÉSERVER ET TRANSFORMER LA STRUCTURE ===
  
  // Supprimer code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '')
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')
  
  // Transformer les # de markdown en titres majuscules
  cleaned = cleaned.replace(/^#{1,2}\s*(.+)$/gm, (match, title) => {
    return '\n\n' + title.toUpperCase() + '\n'
  })
  cleaned = cleaned.replace(/^#{3,6}\s*(.+)$/gm, (match, title) => {
    return '\n' + title.toUpperCase() + '\n'
  })
  
  // Supprimer les # restants au milieu du texte
  cleaned = cleaned.replace(/#/g, '')
  
  // === ÉTAPE 2: PRÉSERVER LES PUCES, NUMÉROTER SEULEMENT L'EXISTANT ===
  // Règle cabinet conseil : les puces restent des puces, les numéros restent des numéros.
  // La numérotation n'est ajoutée que si elle était déjà présente dans le texte source.

  const lines = cleaned.split('\n')
  const result = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line) {
      result.push('')
      continue
    }

    // Détecter ligne avec puce — conserver comme puce (pas de conversion en numéro)
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/)
    if (bulletMatch) {
      const content = bulletMatch[1]
      result.push(`• ${content}`)
      continue
    }

    // Détecter liste déjà numérotée — conserver
    const numMatch = line.match(/^(\d+)[.)]\s+(.+)$/)
    if (numMatch) {
      result.push(`${numMatch[1]}. ${numMatch[2]}`)
      continue
    }
    
    // Détecter les titres potentiels (courts, sans ponctuation finale)
    if (line.length < 50 && !line.match(/[.!?]$/) && line.length > 5) {
      // Vérifier si la ligne suivante est plus longue (indicateur de titre)
      const nextLine = lines[i + 1] || ''
      if (nextLine.trim().length > line.length || line === line.toUpperCase()) {
        // C'est un titre - le mettre en majuscules
        result.push('')
        result.push(line.toUpperCase())
        result.push('')
        continue
      }
    }
    
    result.push(fixStuckWords(line))
  }
  
  cleaned = result.join('\n')
  
  // === ÉTAPE 3: FORMATAGE CABINET CONSEIL ===
  
  // Séparer les phrases par doubles sauts de ligne pour aérer
  cleaned = cleaned.replace(/([.!?])(\s+)(?=[A-Z])/g, '$1\n\n')
  
  // Supprimer les lignes vides multiples
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  
  // Supprimer espaces multiples
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ')
  
  // Dernière passe correction mots collés
  cleaned = fixStuckWords(cleaned)
  
  // Supprimer lignes vides au début et à la fin
  cleaned = cleaned.replace(/^\n+/, '').replace(/\n+$/, '')
  
  return cleaned.trim()
}
