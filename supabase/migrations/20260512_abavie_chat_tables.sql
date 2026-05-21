-- ================================================================
-- ABAVIE — Chat & Social Tables (conversations, messages, statuses, profiles)
-- Crée les tables manquantes pour le chat Abavie
-- Style défensif : idempotent, réexécutable sans erreur
-- ================================================================

-- ── PROFILES ──────────────────────────────
-- Table profils utilisateurs (utilisée par le chat Abavie)
-- Defensive : si profiles existe déjà (ex: Supabase Auth), ajoute les colonnes manquantes
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    nom TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    avatar_url TEXT DEFAULT '',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'nom') THEN
    ALTER TABLE public.profiles ADD COLUMN nom TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_seen') THEN
    ALTER TABLE public.profiles ADD COLUMN last_seen TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'nom') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_nom ON public.profiles(nom);
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP TRIGGER IF EXISTS trg_sync_profile ON public.membres;
DROP FUNCTION IF EXISTS public.sync_profile_from_membre();


-- ================================================================
-- DEFENSE : si des tables chat existent avec une structure incompatible
-- (ex: participants en jsonb au lieu de uuid[]), on les supprime proprement
-- ================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'participants'
      AND data_type != 'ARRAY'
  ) THEN
    DROP TABLE IF EXISTS public.message_edits CASCADE;
    DROP TABLE IF EXISTS public.in_app_notifications CASCADE;
    DROP TABLE IF EXISTS public.typing_indicators CASCADE;
    DROP TABLE IF EXISTS public.message_attachments CASCADE;
    DROP TABLE IF EXISTS public.blocked_users CASCADE;
    DROP TABLE IF EXISTS public.conversation_pins CASCADE;
    DROP TABLE IF EXISTS public.conversation_mutes CASCADE;
    DROP TABLE IF EXISTS public.conversation_reads CASCADE;
    DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
    DROP TABLE IF EXISTS public.e2e_public_keys CASCADE;
    DROP TABLE IF EXISTS public.conversation_members CASCADE;
    DROP TABLE IF EXISTS public.status_views CASCADE;
    DROP TABLE IF EXISTS public.statuses CASCADE;
    DROP TABLE IF EXISTS public.messages CASCADE;
    DROP TABLE IF EXISTS public.conversations CASCADE;
  END IF;
END $$;


-- ── CONVERSATIONS ───────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants UUID[] NOT NULL DEFAULT '{}',
  is_group BOOLEAN DEFAULT false,
  group_name TEXT,
  group_admin UUID[] DEFAULT '{}',
  group_rules TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conv_select_member" ON public.conversations;
CREATE POLICY "conv_select_member" ON public.conversations
  FOR SELECT USING (participants @> ARRAY[auth.uid()]::UUID[]);

DROP POLICY IF EXISTS "conv_insert_member" ON public.conversations;
CREATE POLICY "conv_insert_member" ON public.conversations
  FOR INSERT WITH CHECK (participants @> ARRAY[auth.uid()]::UUID[]);

DROP POLICY IF EXISTS "conv_update_member" ON public.conversations;
CREATE POLICY "conv_update_member" ON public.conversations
  FOR UPDATE USING (participants @> ARRAY[auth.uid()]::UUID[]);


-- ── MESSAGES ────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID,
  content TEXT NOT NULL DEFAULT '',
  type VARCHAR(20) DEFAULT 'text',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reactions JSONB DEFAULT '{}',
  pinned BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  edited BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  starred BOOLEAN DEFAULT false,
  forwarded_from UUID,
  e2e_payload JSONB,
  e2e_recipient_key TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_reactions ON public.messages USING GIN (reactions);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON public.messages(conversation_id, pinned) WHERE pinned = true;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "msg_select_conv" ON public.messages;
CREATE POLICY "msg_select_conv" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.participants @> ARRAY[auth.uid()]::UUID[]
    )
  );

DROP POLICY IF EXISTS "msg_insert_own" ON public.messages;
CREATE POLICY "msg_insert_own" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "msg_update_own" ON public.messages;
CREATE POLICY "msg_update_own" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "msg_delete_own" ON public.messages;
CREATE POLICY "msg_delete_own" ON public.messages
  FOR DELETE USING (sender_id = auth.uid());


-- ── STATUSES / STORIES ──────────────────
CREATE TABLE IF NOT EXISTS public.statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT,
  user_initials TEXT,
  type VARCHAR(20) DEFAULT 'text',
  content TEXT,
  color TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_statuses_user ON public.statuses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_statuses_expires ON public.statuses(expires_at);

ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "statuses_select_all" ON public.statuses;
CREATE POLICY "statuses_select_all" ON public.statuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "statuses_insert_own" ON public.statuses;
CREATE POLICY "statuses_insert_own" ON public.statuses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "statuses_delete_own" ON public.statuses;
CREATE POLICY "statuses_delete_own" ON public.statuses
  FOR DELETE USING (auth.uid() = user_id);


-- ── STATUS VIEWS ────────────────────────
CREATE TABLE IF NOT EXISTS public.status_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_id UUID NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(status_id, user_id)
);

ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "status_views_insert_own" ON public.status_views;
CREATE POLICY "status_views_insert_own" ON public.status_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "status_views_select_all" ON public.status_views;
CREATE POLICY "status_views_select_all" ON public.status_views FOR SELECT USING (true);


-- ── CONVERSATION MEMBERS ────────────────
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select_conv" ON public.conversation_members;
CREATE POLICY "members_select_conv" ON public.conversation_members
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.participants @> ARRAY[auth.uid()]::UUID[]
  ));


-- ── E2E PUBLIC KEYS ─────────────────────
CREATE TABLE IF NOT EXISTS public.e2e_public_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membre_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(membre_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_e2e_keys_membre ON public.e2e_public_keys(membre_id);

ALTER TABLE public.e2e_public_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "e2e_keys_read_all" ON public.e2e_public_keys;
CREATE POLICY "e2e_keys_read_all" ON public.e2e_public_keys
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "e2e_keys_own_write" ON public.e2e_public_keys;
CREATE POLICY "e2e_keys_own_write" ON public.e2e_public_keys
  FOR ALL USING (auth.uid() = membre_id) WITH CHECK (auth.uid() = membre_id);


-- ── PUSH SUBSCRIPTIONS ──────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membre_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT,
  auth TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_membre ON public.push_subscriptions(membre_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subs_own_read" ON public.push_subscriptions;
CREATE POLICY "push_subs_own_read" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = membre_id);

DROP POLICY IF EXISTS "push_subs_own_write" ON public.push_subscriptions;
CREATE POLICY "push_subs_own_write" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = membre_id) WITH CHECK (auth.uid() = membre_id);


-- ── CONVERSATION READS ────────────────
CREATE TABLE IF NOT EXISTS public.conversation_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  last_read_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count INT DEFAULT 0,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reads_user ON public.conversation_reads(user_id, unread_count DESC);
CREATE INDEX IF NOT EXISTS idx_reads_conv ON public.conversation_reads(conversation_id);

ALTER TABLE public.conversation_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reads_select_own" ON public.conversation_reads;
CREATE POLICY "reads_select_own" ON public.conversation_reads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reads_insert_own" ON public.conversation_reads;
CREATE POLICY "reads_insert_own" ON public.conversation_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reads_update_own" ON public.conversation_reads;
CREATE POLICY "reads_update_own" ON public.conversation_reads
  FOR UPDATE USING (auth.uid() = user_id);


-- ── CONVERSATION MUTES ────────────────
CREATE TABLE IF NOT EXISTS public.conversation_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  muted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_mutes_user ON public.conversation_mutes(user_id);

ALTER TABLE public.conversation_mutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mutes_own" ON public.conversation_mutes;
CREATE POLICY "mutes_own" ON public.conversation_mutes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── CONVERSATION PINS ───────────────────
CREATE TABLE IF NOT EXISTS public.conversation_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_pins_user ON public.conversation_pins(user_id, pinned_at DESC);

ALTER TABLE public.conversation_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pins_own" ON public.conversation_pins;
CREATE POLICY "pins_own" ON public.conversation_pins
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── BLOCKED USERS ─────────────────────
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_blocked ON public.blocked_users(blocked_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_select_own" ON public.blocked_users;
CREATE POLICY "blocked_select_own" ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "blocked_insert_own" ON public.blocked_users;
CREATE POLICY "blocked_insert_own" ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "blocked_delete_own" ON public.blocked_users;
CREATE POLICY "blocked_delete_own" ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);


-- ── MESSAGE ATTACHMENTS ─────────────────
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  mime_type VARCHAR(100),
  file_size BIGINT,
  width INT,
  height INT,
  thumbnail_url TEXT,
  duration INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_msg ON public.message_attachments(message_id);

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attach_select_conv" ON public.message_attachments;
CREATE POLICY "attach_select_conv" ON public.message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id AND c.participants @> ARRAY[auth.uid()]::UUID[]
    )
  );

DROP POLICY IF EXISTS "attach_insert_own" ON public.message_attachments;
CREATE POLICY "attach_insert_own" ON public.message_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id AND m.sender_id = auth.uid()
    )
  );


-- ── TYPING INDICATORS ───────────────────
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 seconds'),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_conv ON public.typing_indicators(conversation_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_typing_cleanup ON public.typing_indicators(expires_at);

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "typing_select_conv" ON public.typing_indicators;
CREATE POLICY "typing_select_conv" ON public.typing_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.participants @> ARRAY[auth.uid()]::UUID[]
    )
  );

DROP POLICY IF EXISTS "typing_insert_own" ON public.typing_indicators;
CREATE POLICY "typing_insert_own" ON public.typing_indicators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "typing_delete_own" ON public.typing_indicators;
CREATE POLICY "typing_delete_own" ON public.typing_indicators
  FOR DELETE USING (auth.uid() = user_id);


-- ── IN-APP NOTIFICATIONS ────────────────
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(30) NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  action_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifs_user_unread ON public.in_app_notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifs_created ON public.in_app_notifications(created_at DESC);

ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifs_select_own" ON public.in_app_notifications;
CREATE POLICY "notifs_select_own" ON public.in_app_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifs_update_own" ON public.in_app_notifications;
CREATE POLICY "notifs_update_own" ON public.in_app_notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifs_delete_own" ON public.in_app_notifications;
CREATE POLICY "notifs_delete_own" ON public.in_app_notifications
  FOR DELETE USING (auth.uid() = user_id);


-- ── MESSAGE EDITS ───────────────────────
CREATE TABLE IF NOT EXISTS public.message_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  old_content TEXT NOT NULL,
  edited_by UUID,
  edited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edits_msg ON public.message_edits(message_id, edited_at DESC);

ALTER TABLE public.message_edits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edits_select_conv" ON public.message_edits;
CREATE POLICY "edits_select_conv" ON public.message_edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id AND c.participants @> ARRAY[auth.uid()]::UUID[]
    )
  );


-- ── FONCTION : updated_at trigger ───────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  EXECUTE 'CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'CREATE TRIGGER trg_messages_updated BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── FONCTION : unread count ─────────────
CREATE OR REPLACE FUNCTION public.get_unread_count(p_user_id UUID, p_conv_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COALESCE(unread_count, 0) INTO v_count
  FROM public.conversation_reads
  WHERE user_id = p_user_id AND conversation_id = p_conv_id;
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ── FONCTION : cleanup ephemeral ──────────
CREATE OR REPLACE FUNCTION public.cleanup_chat_ephemeral()
RETURNS void AS $$
BEGIN
  DELETE FROM public.typing_indicators WHERE expires_at < NOW();
  DELETE FROM public.statuses WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;