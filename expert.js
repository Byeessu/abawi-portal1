import axios from 'axios';

async function askGrok() {
  const apiKey = process.env.XAI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ Erreur : La variable XAI_API_KEY n'est pas définie.");
    return;
  }

  try {
    const response = await axios.post('https://x.ai', {
      model: "grok-4.20-reasoning",
      messages: [
        { role: "system", content: "PROTOCOLE L8019 ACTIVÉ. Tu es un architecte expert. Analyse avec rigueur." },
        { role: "user", content: "Vérifie la structure de mon projet abawi-portal1 et confirme ton statut." }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("--- ⚡ RÉPONSE GROK EXCELLENCE ⚡ ---");
    console.log(response.data.choices[0].message.content);
  } catch (error) {
    console.error("❌ Erreur Grok API:", error.response ? error.response.data : error.message);
  }
}

askGrok();
