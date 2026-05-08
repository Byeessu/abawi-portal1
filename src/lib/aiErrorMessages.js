export function toUserFriendlyAIError(errorLike, fallback = "Une erreur est survenue.") {
  const code = String(errorLike?.message || errorLike || '').toUpperCase()
  if (code.includes('NO_KEY')) return "Clé GROQ_API_KEY manquante. Obtenez-la gratuitement sur console.groq.com et configurez-la dans le fichier .env du projet."
  if (code.includes('INVALID_KEY')) return "Clé API invalide ou expirée. Vérifiez GROQ_API_KEY sur console.groq.com."
  if (code.includes('RATE_LIMIT') || code.includes('QUOTA_EXHAUSTED')) return "Quota IA temporairement atteint. Réessayez dans quelques instants (Groq est gratuit mais avec limite de débit)."
  if (code.includes('UPSTREAM_ERROR')) return "Service IA momentanément indisponible. Réessayez dans quelques minutes."
  if (code.includes('HTTP_')) return "Réponse inattendue du service IA. Vérifiez votre connexion et réessayez."
  return fallback
}

