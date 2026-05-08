import { cleanIAText } from './cleanText';
import { groqChatCompletion, getProviderInfo } from './groqClient';

export async function callGroq(messages, maxTokens = 2000, jsonMode = false) {
  const { model } = getProviderInfo();   // modèle auto-détecté selon la clé API
  const data = await groqChatCompletion({
    model,
    max_tokens: maxTokens,
    temperature: jsonMode ? 0.1 : 0.7,
    messages,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  });
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export const DOMAINES = [
  '🌍 Histoire Afrique', '💰 Finance & Économie', '⚖️ Droit OHADA',
  '💻 Technologie & IA', '🏥 Santé & Médecine', '📊 Marketing',
  '🎓 Culture Générale', '🗣️ Français & Littérature', '🔢 Mathématiques',
  '🌱 Agriculture', '🏗️ BTP & Architecture', '🎯 Entrepreneuriat',
  '🌐 Géopolitique', '🧬 Sciences', '📱 Digital & Réseaux',
  '🎵 Musique & Art', '⚽ Sport', '🍳 Cuisine & Restauration',
];

export async function extractTextFromAnyFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.html') || name.endsWith('.json') || name.endsWith('.csv')) {
    return await file.text();
  }
  if (name.endsWith('.pdf')) {
    const arr = await file.arrayBuffer();
    const text = new TextDecoder('utf-8', { fatal: false }).decode(arr);
    const chunks = text.match(/\(([^)]{5,200})\)/g) || [];
    return chunks.map(c => c.slice(1, -1)).join(' ').slice(0, 10000);
  }
  const buf = await file.arrayBuffer();
  return new TextDecoder('utf-8', { fatal: false }).decode(buf).replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, ' ').slice(0, 8000);
}

export { cleanIATextLight } from './cleanText';
