// netlify/functions/notify-application.js
// Transmet les candidatures au recruteur au nom d'ABAWI — Recrute-moi SN

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { offerId, candidate } = body;
  if (!offerId || !candidate?.name || !candidate?.email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase not configured' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Récupérer l'offre
  const { data: offer, error: offerErr } = await supabase
    .from('job_offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (offerErr || !offer) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Offer not found' }) };
  }

  const platformUrl = process.env.URL || 'https://abawi.com';
  const offerUrl = `${platformUrl}/recrutement`;

  // Construire le message au recruteur
  const emailSubject = `Nouvelle candidature — ${offer.title} via Recrute-moi SN (ABAWI)`;
  const emailText = `
Bonjour,

Vous avez reçu une nouvelle candidature via la plateforme Recrute-moi SN d'ABAWI-Portal.

Offre concernée : ${offer.title}
Entreprise : ${offer.company || 'Non précisé'}
Lieu : ${offer.location || 'Non précisé'}

Consultez l'annonce sur la plateforme : ${offerUrl}

---

Candidat :
• Nom : ${candidate.name}
• Email : ${candidate.email}
• Téléphone : ${candidate.phone || 'Non renseigné'}

Message :
${candidate.message || 'Aucun message'}

${candidate.cv_url ? `CV / Pièce jointe : ${candidate.cv_url}` : ''}

---

Cette candidature vous est transmise par Recrute-moi SN d'ABAWI-Portal.
Plateforme : ${platformUrl}
`.trim();

  const emailHtml = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a2e;">
  <div style="background:#047857;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:1.1rem;">Nouvelle candidature — Recrute-moi SN</h2>
  </div>
  <div style="background:#f8f9fa;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
    <p style="margin:0 0 16px;">Vous avez reçu une nouvelle candidature via <strong>Recrute-moi SN d'ABAWI-Portal</strong>.</p>
    <div style="background:#fff;padding:16px;border-radius:8px;margin-bottom:16px;border:1px solid #e5e7eb;">
      <h3 style="margin:0 0 8px;font-size:1rem;color:#047857;">${offer.title}</h3>
      <p style="margin:4px 0;font-size:0.9rem;">🏢 <strong>${offer.company || 'Non précisé'}</strong> &nbsp;|&nbsp; 📍 ${offer.location || 'Non précisé'}</p>
      <a href="${offerUrl}" style="color:#047857;font-weight:700;">Voir l'annonce sur la plateforme →</a>
    </div>
    <h4 style="margin:0 0 8px;font-size:0.95rem;">Candidat</h4>
    <ul style="margin:0 0 16px;padding-left:18px;font-size:0.9rem;">
      <li><strong>Nom :</strong> ${candidate.name}</li>
      <li><strong>Email :</strong> <a href="mailto:${candidate.email}">${candidate.email}</a></li>
      <li><strong>Téléphone :</strong> ${candidate.phone || 'Non renseigné'}</li>
    </ul>
    <h4 style="margin:0 0 8px;font-size:0.95rem;">Message</h4>
    <p style="background:#fff;padding:12px;border-radius:6px;border:1px solid #e5e7eb;font-size:0.9rem;">${candidate.message ? candidate.message.replace(/\n/g, '<br>') : 'Aucun message'}</p>
    ${candidate.cv_url ? `<p style="margin-top:12px;font-size:0.9rem;">📎 <a href="${candidate.cv_url}">Télécharger le CV</a></p>` : ''}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
    <p style="font-size:0.82rem;color:#6b7280;margin:0;">Cette candidature vous est transmise par <strong>Recrute-moi SN d'ABAWI-Portal</strong>.<br>Plateforme : <a href="${platformUrl}">${platformUrl}</a></p>
  </div>
</div>
`;

  // Si un contact_email est renseigné, tenter d'envoyer l'email
  let emailSent = false;
  if (offer.contact_email && RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Recrute-moi SN <recrutement@abawi.com>',
          to: offer.contact_email,
          subject: emailSubject,
          text: emailText,
          html: emailHtml,
        }),
      });
      if (res.ok) {
        emailSent = true;
      } else {
        const errText = await res.text();
        console.warn('[notify-application] Resend error:', res.status, errText);
      }
    } catch (e) {
      console.warn('[notify-application] Email send failed:', e.message);
    }
  } else {
    console.log('[notify-application] No contact_email or RESEND_API_KEY. Skipping email.');
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      emailSent,
      to: offer.contact_email || null,
      message: emailSent
        ? 'Candidature transmise au recruteur par email'
        : 'Candidature enregistrée. Email non envoyé (contact_email manquant ou service non configuré).',
    }),
  };
};
