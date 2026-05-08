-- ============================================
-- ABAVIE - Tables Supabase pour la messagerie
-- ============================================

-- 1. Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants JSONB NOT NULL DEFAULT '[]',
  last_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio', 'document')),
  file_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Index pour performances
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

-- 4. Activer Realtime sur les deux tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 5. Politiques RLS (Row Level Security)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient seulement leurs conversations
CREATE POLICY "users_own_conversations" ON conversations
  FOR ALL USING (participants ? auth.uid()::text);

-- Les utilisateurs voient seulement les messages de leurs conversations
CREATE POLICY "users_own_messages" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE participants ? auth.uid()::text
    )
  );

-- 6. Bucket Storage pour les fichiers
-- À créer manuellement dans l'interface Supabase :
--   Nom du bucket : messages
--   Public : OUI
--   Taille max : 50 MB
--   Types MIME autorisés : image/*, video/*, audio/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- Politique storage pour le bucket messages
-- CREATE POLICY "users_upload_messages" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'messages' AND auth.role() = 'authenticated');
-- CREATE POLICY "public_read_messages" ON storage.objects
--   FOR SELECT USING (bucket_id = 'messages');
