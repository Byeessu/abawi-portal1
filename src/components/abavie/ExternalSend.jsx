import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

const CH = [
  { id: "email", label: "Email", icon: "📧", ph: "email@exemple.com" },
  { id: "sms", label: "SMS", icon: "📱", ph: "+221 77 000 00 00" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", ph: "+221 77 000 00 00" },
];

export default function ExternalSend({ body: initialBody = "", onClose }) {
  const { membre } = useAuth();
  const [ch, setCh] = useState("email");
  const [to, setTo] = useState("");
  const [subj, setSubj] = useState("");
  const [body, setBody] = useState(initialBody);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const c = CH.find((x) => x.id === ch);

  async function send() {
    if (!to.trim() || !body.trim()) return;
    setSending(true);
    setErr("");
    try {
      const fn = ch === "email" ? "abavie-send-email" : ch === "sms" ? "abavie-send-sms" : "abavie-send-whatsapp";
      const { error } = await supabase.functions.invoke(fn, {
        body: { to: to.trim(), subject: subj.trim(), body: body.trim(), from: membre?.nom || "Abavie" }
      });
      if (error) throw new Error(error.message);
      setSent(true);
      setTo("");
      setSubj("");
      setBody("");
      onClose?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  }

  const disabled = sending || !to.trim() || !body.trim();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: 400, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>📨 Message externe</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>
        {sent && <div style={{ padding: 12, background: '#d4edda', color: '#155724', borderRadius: 8, marginBottom: 16 }}>✅ Message envoyé avec succès !</div>}
        {err && <div style={{ padding: 12, background: '#f8d7da', color: '#721c24', borderRadius: 8, marginBottom: 16 }}>❌ {err}</div>}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {CH.map((x) => (
            <button
              key={x.id}
              onClick={() => setCh(x.id)}
              style={{
                padding: "6px 14px", borderRadius: 8,
                border: "1px solid var(--border)",
                background: ch === x.id ? "var(--accent)" : "var(--bg-primary)",
                color: ch === x.id ? "white" : "var(--text-primary)",
                fontWeight: 700, cursor: "pointer", fontSize: "0.82rem",
              }}
            >
              {x.icon} {x.label}
            </button>
          ))}
        </div>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder={c?.ph || "Destinataire"}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--bg-primary)", color: "var(--text-primary)",
            fontSize: "0.85rem", outline: "none", marginBottom: 10, boxSizing: "border-box",
          }}
        />
        {ch === "email" && (
          <input
            value={subj}
            onChange={(e) => setSubj(e.target.value)}
            placeholder="Objet"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg-primary)", color: "var(--text-primary)",
              fontSize: "0.85rem", outline: "none", marginBottom: 10, boxSizing: "border-box",
            }}
          />
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Votre message..."
          rows={5}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--bg-primary)", color: "var(--text-primary)",
            fontSize: "0.85rem", outline: "none", marginBottom: 16, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit",
          }}
        />
        <button
          onClick={send}
          disabled={disabled}
          style={{
            width: "100%", padding: "12px", borderRadius: 10, border: "none",
            background: disabled ? "var(--border)" : "var(--accent)",
            color: "white",
            cursor: disabled ? "default" : "pointer",
            fontSize: "0.9rem", fontWeight: 700,
          }}
        >
          {sending ? "⏳ Envoi..." : "🚀 Envoyer"}
        </button>
      </div>
    </div>
  );
}
