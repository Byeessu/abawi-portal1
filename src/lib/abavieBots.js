/* ================================================================
   ABAVIE — Bot & Webhook API
   Lightweight bot framework + outgoing webhook dispatcher
   ================================================================ */

import { supabase } from './supabase'

// ── Built-in bot commands ───────────────────────────────────────

const BOTS = {
  weather: {
    id: 'weather',
    name: 'Météo Bot',
    avatar: '🌤️',
    description: 'Donne la météo d\'une ville. Usage: /weather Dakar',
    handler: async (args) => {
      const city = args[0] || 'Dakar'
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=demo&units=metric`)
        if (!res.ok) throw new Error('API indisponible')
        const data = await res.json()
        return `🌤️ ${data.name}: ${data.main.temp}°C, ${data.weather[0].description}`
      } catch {
        return `🌤️ Météo pour ${city}: 28°C, ensoleillé (demo)`
      }
    },
  },
  translate: {
    id: 'translate',
    name: 'Translate Bot',
    avatar: '🌐',
    description: 'Traduit un texte. Usage: /translate fr Bonjour',
    handler: async (args) => {
      const lang = args[0] || 'en'
      const text = args.slice(1).join(' ') || 'Hello'
      return `🌐 [${lang.toUpperCase()}] ${text} (traduction demo — intégrer LibreTranslate ou DeepL)`
    },
  },
  remind: {
    id: 'remind',
    name: 'Reminder Bot',
    avatar: '⏰',
    description: 'Rappel. Usage: /remind 30m Appeler Jean',
    handler: async (args) => {
      const time = args[0] || '10m'
      const text = args.slice(1).join(' ') || 'Rappel'
      const ms = time.endsWith('h') ? parseInt(time) * 3600000
        : time.endsWith('d') ? parseInt(time) * 86400000
        : parseInt(time) * 60000
      setTimeout(() => {
        // In a real app this would push a notification
        console.log(`[REMINDER] ${text}`)
      }, ms)
      return `⏰ Rappel programmé dans ${time}: « ${text} »`
    },
  },
  poll: {
    id: 'poll',
    name: 'Poll Bot',
    avatar: '📊',
    description: 'Crée un sondage. Usage: /poll "Question" Oui Non Peut-être',
    handler: async (args) => {
      const question = args[0]?.replace(/^["']|["']$/g, '') || 'Sondage'
      const options = args.slice(1).length > 0 ? args.slice(1) : ['Oui', 'Non']
      return `📊 **${question}**\n${options.map((o, i) => `${i + 1}. ${o} (0 vote)`).join('\n')}\n\nRéagissez avec 👍, 👎, etc.`
    },
  },
  help: {
    id: 'help',
    name: 'Aide Bot',
    avatar: '❓',
    description: 'Liste les commandes disponibles',
    handler: async () => {
      return `🤖 **Bots Abavie**\n${Object.values(BOTS).filter(b => b.id !== 'help').map(b => `/${b.id} — ${b.description}`).join('\n')}`
    },
  },
}

// ── Parse message for bot commands ──────────────────────────────

export function parseBotCommand(text) {
  const match = text.trim().match(/^\/([a-zA-Z0-9_]+)(?:\s+(.*))?$/)
  if (!match) return null
  const [, cmd, rest] = match
  const args = rest ? rest.match(/(?:"[^"]*"|\S+)/g)?.map(a => a.replace(/^"|"$/g, '')) || [] : []
  return { command: cmd.toLowerCase(), args }
}

export async function runBotCommand(text) {
  const parsed = parseBotCommand(text)
  if (!parsed) return null
  const bot = BOTS[parsed.command]
  if (!bot) return `❓ Commande inconnue. Tapez /help pour la liste.`
  try {
    const reply = await bot.handler(parsed.args)
    return { botId: bot.id, botName: bot.name, botAvatar: bot.avatar, content: reply }
  } catch (e) {
    return { botId: bot.id, botName: bot.name, botAvatar: bot.avatar, content: `❌ Erreur: ${e.message}` }
  }
}

export function getAvailableBots() {
  return Object.values(BOTS)
}

// ── Webhook dispatcher ─────────────────────────────────────────

export async function dispatchWebhook(url, payload) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'abavie',
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    })
    return { success: res.ok, status: res.status }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ── Bot message injection into conversation ─────────────────────

export async function sendBotReply(conversationId, botReply, senderId = 'bot') {
  if (!botReply) return
  const content = typeof botReply === 'string' ? botReply : botReply.content
  const botId = typeof botReply === 'string' ? 'bot' : botReply.botId
  const botName = typeof botReply === 'string' ? 'Bot' : botReply.botName
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    type: 'bot',
    content,
    metadata: { botId, botName },
    created_at: new Date().toISOString(),
    read: false,
  })
  if (error) console.error('Bot reply error:', error)
}
