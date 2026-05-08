export const ELEVENLABS_VOICES = [
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    gender: 'Femme',
    language: 'Français',
    accent: 'Français',
    recommended: true,
    description: 'Voix chaleureuse et professionnelle, idéale pour les guides business',
    preview: null,
  },
  {
    id: 'ThT5KcBeYPX3keUQqHPh',
    name: 'Dorothy',
    gender: 'Femme',
    language: 'Français',
    accent: 'Britannique',
    recommended: true,
    description: 'Voix claire et articulée, parfaite pour les podcasts',
    preview: null,
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    gender: 'Femme',
    language: 'Français',
    accent: 'Français',
    recommended: true,
    description: 'Voix douce et naturelle, idéale pour les fascicules éducatifs',
    preview: null,
  },
  {
    id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    gender: 'Femme',
    language: 'Français',
    accent: 'Américain',
    recommended: false,
    description: 'Voix énergique et dynamique',
    preview: null,
  },
  {
    id: 'jBpfuIE2acCO8z3wKNLl',
    name: 'Gigi',
    gender: 'Femme',
    language: 'Français',
    accent: 'Américain',
    recommended: false,
    description: 'Voix jeune et vivante',
    preview: null,
  },
  {
    id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    gender: 'Homme',
    language: 'Français',
    accent: 'Américain',
    recommended: true,
    description: 'Voix masculine profonde et confiante',
    preview: null,
  },
  {
    id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    gender: 'Homme',
    language: 'Français',
    accent: 'Américain',
    recommended: false,
    description: 'Voix grave et autoritaire',
    preview: null,
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    gender: 'Homme',
    language: 'Français',
    accent: 'Américain',
    recommended: false,
    description: 'Voix naturelle et décontractée',
    preview: null,
  },
  {
    id: 'yoZ06aMxZJJ28mfd3POQ',
    name: 'Sam',
    gender: 'Homme',
    language: 'Français',
    accent: 'Américain',
    recommended: false,
    description: 'Voix jeune et neutre',
    preview: null,
  },
  {
    id: 'ZQe5CZNOzWyzPSCn5a3c',
    name: 'James',
    gender: 'Homme',
    language: 'Français',
    accent: 'Australien',
    recommended: false,
    description: 'Voix masculine calme et posée',
    preview: null,
  },
]

export const VOICE_SETTINGS_PRESETS = {
  professionnelle: {
    label: 'Professionnelle',
    icon: '💼',
    settings: { stability: 0.65, similarity_boost: 0.80, style: 0.30, use_speaker_boost: true, speed: 1.0 },
  },
  chaleureuse: {
    label: 'Chaleureuse',
    icon: '🤝',
    settings: { stability: 0.50, similarity_boost: 0.82, style: 0.55, use_speaker_boost: true, speed: 0.95 },
  },
  dynamique: {
    label: 'Dynamique',
    icon: '⚡',
    settings: { stability: 0.40, similarity_boost: 0.78, style: 0.70, use_speaker_boost: true, speed: 1.10 },
  },
  douce: {
    label: 'Douce',
    icon: '🌸',
    settings: { stability: 0.70, similarity_boost: 0.85, style: 0.20, use_speaker_boost: false, speed: 0.90 },
  },
  narrative: {
    label: 'Narrative',
    icon: '📖',
    settings: { stability: 0.55, similarity_boost: 0.80, style: 0.45, use_speaker_boost: true, speed: 1.0 },
  },
}

export const DEFAULT_VOICE_BY_TYPE = {
  guide: 'XB0fDUnXU5powFXDhCwa',      // Charlotte — guides business
  fascicule: 'EXAVITQu4vr4xnSDxMaL',  // Bella — éducatif
  podcast: 'ThT5KcBeYPX3keUQqHPh',    // Dorothy — podcasts
  news: 'XB0fDUnXU5powFXDhCwa',       // Charlotte — news
  default: 'XB0fDUnXU5powFXDhCwa',    // Charlotte par défaut
}

export const DEFAULT_PRESET_BY_TYPE = {
  guide: 'professionnelle',
  fascicule: 'douce',
  podcast: 'narrative',
  news: 'professionnelle',
  default: 'professionnelle',
}

/** Voix neurales Azure (fr-FR) — clés = voiceKey internes (charlotte, bella, dorothy) */
export const AZURE_VOICE_BY_KEY = {
  charlotte: 'fr-FR-DeniseNeural',
  bella: 'fr-FR-VivienneNeural',
  dorothy: 'fr-FR-BrigitteNeural',
}
