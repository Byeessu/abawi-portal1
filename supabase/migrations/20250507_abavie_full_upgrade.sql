-- ================================================================
-- ABAVIE — Full Backend Upgrade Migration
-- Execute in Supabase SQL Editor (all at once)
-- ================================================================

-- 1. Extend messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS forwarded_from UUID,
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text';

CREATE INDEX IF NOT EXISTS idx_messages_reactions ON messages USING GIN (reactions);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages (conversation_id, pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_messages_scheduled ON messages (scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_expires ON messages (expires_at) WHERE expires_at IS NOT NULL;

-- 2. Statuses / Stories
CREATE TABLE IF NOT EXISTS statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_initials TEXT,
  type VARCHAR(20) DEFAULT 'text', -- text | image | video
  content TEXT,
  color TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_statuses_user ON statuses (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_statuses_expires ON statuses (expires_at);

-- 3. Status views
CREATE TABLE IF NOT EXISTS status_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_id UUID NOT NULL REFERENCES statuses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(status_id, user_id)
);

-- 4. User presence / online
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'offline', -- online | offline | away
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  device_info JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_json JSONB NOT NULL,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_name)
);

-- 6. E2E public keys
CREATE TABLE IF NOT EXISTS e2e_public_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Extend conversations for groups
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_admin UUID[],
  ADD COLUMN IF NOT EXISTS group_rules TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_channel BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_link TEXT,
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'; -- who_can_post, who_can_add, etc.

-- 8. Conversation members with roles
CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- member | admin | owner
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  banned_at TIMESTAMPTZ,
  banned_by UUID,
  UNIQUE(conversation_id, user_id)
);

-- 9. Scheduled messages
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  file_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_pending ON scheduled_messages (scheduled_at) WHERE sent_at IS NULL;

-- 10. Polls
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- [{id, text, count}]
  is_anonymous BOOLEAN DEFAULT true,
  allows_multiple BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Poll votes
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- 12. Blocked users
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 13. Starred messages
CREATE TABLE IF NOT EXISTS starred_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- 14. Mentions
CREATE TABLE IF NOT EXISTS mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2e_public_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE starred_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- RLS policies (simple: owner sees own, conversation members see conv data)
CREATE POLICY "statuses_select_all" ON statuses FOR SELECT USING (true);
CREATE POLICY "statuses_insert_own" ON statuses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "statuses_delete_own" ON statuses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "status_views_insert_own" ON status_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "status_views_select_all" ON status_views FOR SELECT USING (true);

CREATE POLICY "presence_select_all" ON user_presence FOR SELECT USING (true);
CREATE POLICY "presence_update_own" ON user_presence FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "presence_insert_own" ON user_presence FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_select_own" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_insert_own" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_delete_own" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "e2e_select_all" ON e2e_public_keys FOR SELECT USING (true);
CREATE POLICY "e2e_insert_own" ON e2e_public_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "e2e_update_own" ON e2e_public_keys FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "members_select_conv" ON conversation_members FOR SELECT USING (EXISTS (
  SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.participants @> ARRAY[auth.uid()]::UUID[]
));
CREATE POLICY "members_admin" ON conversation_members FOR ALL USING (EXISTS (
  SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.group_admin @> ARRAY[auth.uid()]::UUID[] OR c.participants @> ARRAY[auth.uid()]::UUID[])
));

CREATE POLICY "polls_select_conv" ON polls FOR SELECT USING (EXISTS (
  SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.participants @> ARRAY[auth.uid()]::UUID[]
));
CREATE POLICY "polls_insert_conv" ON polls FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.participants @> ARRAY[auth.uid()]::UUID[]
));

CREATE POLICY "poll_votes_select_poll" ON poll_votes FOR SELECT USING (EXISTS (
  SELECT 1 FROM polls p WHERE p.id = poll_id AND EXISTS (
    SELECT 1 FROM conversations c WHERE c.id = p.conversation_id AND c.participants @> ARRAY[auth.uid()]::UUID[]
  )
));
CREATE POLICY "poll_votes_insert_own" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "blocked_select_own" ON blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "blocked_insert_own" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocked_delete_own" ON blocked_users FOR DELETE USING (auth.uid() = blocker_id);

CREATE POLICY "starred_select_own" ON starred_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "starred_insert_own" ON starred_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "starred_delete_own" ON starred_messages FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "mentions_select_mentioned" ON mentions FOR SELECT USING (auth.uid() = mentioned_user_id);
CREATE POLICY "mentions_insert_conv" ON mentions FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM messages m WHERE m.id = message_id
));

CREATE POLICY "scheduled_select_own" ON scheduled_messages FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "scheduled_insert_own" ON scheduled_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "scheduled_delete_own" ON scheduled_messages FOR DELETE USING (auth.uid() = sender_id);

-- Meeting participants
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  is_muted BOOLEAN DEFAULT false,
  is_video_off BOOLEAN DEFAULT false,
  is_screen_sharing BOOLEAN DEFAULT false,
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_room ON meeting_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_meeting_last_seen ON meeting_participants(last_seen);

CREATE POLICY "meeting_select_room" ON meeting_participants FOR SELECT USING (true);
CREATE POLICY "meeting_insert_own" ON meeting_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meeting_update_own" ON meeting_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "meeting_delete_own" ON meeting_participants FOR DELETE USING (auth.uid() = user_id);

-- Realtime for new tables
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE
    messages, conversations, statuses, user_presence,
    polls, poll_votes, mentions, scheduled_messages, meeting_participants;
COMMIT;

-- Function to auto-delete expired statuses/messages
CREATE OR REPLACE FUNCTION delete_expired_content()
RETURNS void AS $$
BEGIN
  DELETE FROM statuses WHERE expires_at < NOW();
  DELETE FROM messages WHERE expires_at IS NOT NULL AND expires_at < NOW();
  DELETE FROM polls WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- (Optional) Schedule with pg_cron if available:
-- SELECT cron.schedule('delete-expired-content', '0 * * * *', 'SELECT delete_expired_content();');
