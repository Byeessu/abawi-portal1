-- ============================================================
--  SUPPORT TICKETS — Système de contact utilisateur → admin
-- ============================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,           -- email de l'utilisateur
  nom           text,                    -- nom/prénom
  telephone     text,                    -- téléphone (optionnel)
  sujet         text NOT NULL,           -- sujet du ticket
  message       text NOT NULL,           -- contenu
  categorie     text NOT NULL DEFAULT 'general',
                                         -- general, bug, facturation, outil, compte, suggestion
  statut        text NOT NULL DEFAULT 'nouveau',
                                         -- nouveau, en_cours, resolu, ferme
  priorite      text NOT NULL DEFAULT 'normal',
                                         -- basse, normal, haute, urgente
  reponse_admin text,                    -- réponse de l'admin
  admin_email   text,                    -- email de l'admin qui a répondu
  repondu_at    timestamptz,             -- date de réponse
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_statut ON support_tickets(statut);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_tickets_updated ON support_tickets;
CREATE TRIGGER trg_support_tickets_updated
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can read only their own tickets
CREATE POLICY "Users read own tickets"
  ON support_tickets FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::jsonb->>'email' OR
         current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- Users can insert their own tickets (anonymous allowed)
CREATE POLICY "Users insert own tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (true);

-- Admin can update any ticket
CREATE POLICY "Admin update tickets"
  ON support_tickets FOR UPDATE
  USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

COMMENT ON TABLE support_tickets IS 'Tickets de support utilisateur → admin';
