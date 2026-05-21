-- ═══════════════════════════════════════════════════════════════
-- Migration : Création des tables manquantes + RLS pour AbSpace
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. RECRUTEMOI SN
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rm_offres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  entreprise text,
  localisation text,
  type_contrat text,
  salaire_min integer,
  salaire_max integer,
  description text,
  competences text[],
  statut text DEFAULT 'actif',
  views integer DEFAULT 0,
  membre_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.rm_candidatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offre_id uuid REFERENCES public.rm_offres(id) ON DELETE CASCADE,
  nom text NOT NULL,
  email text,
  telephone text,
  cv_url text,
  message text,
  statut text DEFAULT 'Envoyee',
  membre_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rm_networking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  email text,
  role text,
  entreprise text,
  ville text,
  bio text,
  linkedin text,
  statut text DEFAULT 'actif',
  membre_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  type text,
  date date,
  lieu text,
  description text,
  statut text DEFAULT 'actif',
  membre_id uuid,
  created_at timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────────
-- 2. ESPACE OUVRIER / PLACE OUVRIER
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ouvriers_profils (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text,
  telephone text,
  ville text,
  metier text,
  experience integer,
  disponible boolean DEFAULT true,
  tarif integer,
  photo_url text,
  membre_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ouvriers_besoins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  ville text,
  metier text,
  budget integer,
  statut text DEFAULT 'actif',
  membre_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ouvriers_avis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profil_id uuid REFERENCES public.ouvriers_profils(id) ON DELETE CASCADE,
  note integer CHECK (note >= 1 AND note <= 5),
  commentaire text,
  membre_id uuid,
  created_at timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────────
-- 3. MAXAVIS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.maxavis_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  questions jsonb DEFAULT '[]',
  statut text DEFAULT 'actif',
  membre_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maxavis_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES public.maxavis_surveys(id) ON DELETE CASCADE,
  reponses jsonb DEFAULT '{}',
  membre_id uuid,
  created_at timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────────
-- 4. TONTINES
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tontines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text,
  montant integer,
  frequence text,
  statut text DEFAULT 'actif',
  membre_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tontine_membres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id uuid REFERENCES public.tontines(id) ON DELETE CASCADE,
  membre_id uuid,
  role text DEFAULT 'membre',
  statut text DEFAULT 'actif',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tontine_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id uuid REFERENCES public.tontines(id) ON DELETE CASCADE,
  numero integer,
  beneficiaire_id uuid,
  statut text DEFAULT 'en_cours',
  date_tirage date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tontine_paiements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id uuid REFERENCES public.tontines(id) ON DELETE CASCADE,
  membre_id uuid,
  tour_id uuid REFERENCES public.tontine_tours(id) ON DELETE SET NULL,
  montant integer,
  statut text DEFAULT 'en_attente',
  created_at timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────────
-- 5. ABZONE (Communaute)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abzone_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  contenu text,
  categorie text,
  tags text[],
  statut text DEFAULT 'actif',
  views integer DEFAULT 0,
  membre_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.abzone_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES public.abzone_topics(id) ON DELETE CASCADE,
  contenu text NOT NULL,
  membre_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.abzone_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  url text,
  type text,
  topic_id uuid REFERENCES public.abzone_topics(id) ON DELETE SET NULL,
  membre_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.abzone_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES public.abzone_topics(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.abzone_comments(id) ON DELETE CASCADE,
  membre_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(topic_id, membre_id),
  UNIQUE(comment_id, membre_id)
);

-- ───────────────────────────────────────────────────────────────
-- 6. SUPPORT TICKETS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sujet text NOT NULL,
  description text,
  statut text DEFAULT 'ouvert',
  priorite text DEFAULT 'moyenne',
  membre_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- RLS — Lecture publique, ecriture ouverte (auth gerée cote app)
-- ═══════════════════════════════════════════════════════════════

alter table public.rm_offres          enable row level security;
alter table public.rm_candidatures    enable row level security;
alter table public.rm_networking      enable row level security;
alter table public.rm_events          enable row level security;
alter table public.ouvriers_profils   enable row level security;
alter table public.ouvriers_besoins   enable row level security;
alter table public.ouvriers_avis      enable row level security;
alter table public.maxavis_surveys    enable row level security;
alter table public.maxavis_responses  enable row level security;
alter table public.tontines           enable row level security;
alter table public.tontine_membres    enable row level security;
alter table public.tontine_tours      enable row level security;
alter table public.tontine_paiements  enable row level security;
alter table public.abzone_topics      enable row level security;
alter table public.abzone_comments    enable row level security;
alter table public.abzone_resources   enable row level security;
alter table public.abzone_likes       enable row level security;
alter table public.support_tickets    enable row level security;

-- rm_offres
create policy "rm_offres_select"  on public.rm_offres for select using (true);
create policy "rm_offres_insert"  on public.rm_offres for insert with check (true);
create policy "rm_offres_update"  on public.rm_offres for update using (true);
create policy "rm_offres_delete"  on public.rm_offres for delete using (true);

-- rm_candidatures
create policy "rm_cands_select"  on public.rm_candidatures for select using (true);
create policy "rm_cands_insert"  on public.rm_candidatures for insert with check (true);
create policy "rm_cands_update"  on public.rm_candidatures for update using (true);
create policy "rm_cands_delete"  on public.rm_candidatures for delete using (true);

-- rm_networking
create policy "rm_net_select"  on public.rm_networking for select using (true);
create policy "rm_net_insert"  on public.rm_networking for insert with check (true);
create policy "rm_net_delete"  on public.rm_networking for delete using (true);

-- rm_events
create policy "rm_evt_select"  on public.rm_events for select using (true);
create policy "rm_evt_insert"  on public.rm_events for insert with check (true);
create policy "rm_evt_delete"  on public.rm_events for delete using (true);

-- ouvriers_profils
create policy "ouv_profils_select"  on public.ouvriers_profils for select using (true);
create policy "ouv_profils_insert"  on public.ouvriers_profils for insert with check (true);
create policy "ouv_profils_update"  on public.ouvriers_profils for update using (true);
create policy "ouv_profils_delete"  on public.ouvriers_profils for delete using (true);

-- ouvriers_besoins
create policy "ouv_besoins_select"  on public.ouvriers_besoins for select using (true);
create policy "ouv_besoins_insert"  on public.ouvriers_besoins for insert with check (true);
create policy "ouv_besoins_delete"  on public.ouvriers_besoins for delete using (true);

-- ouvriers_avis
create policy "ouv_avis_select"  on public.ouvriers_avis for select using (true);
create policy "ouv_avis_insert"  on public.ouvriers_avis for insert with check (true);
create policy "ouv_avis_delete"  on public.ouvriers_avis for delete using (true);

-- maxavis_surveys
create policy "maxavis_s_select"  on public.maxavis_surveys for select using (true);
create policy "maxavis_s_insert"  on public.maxavis_surveys for insert with check (true);
create policy "maxavis_s_update"  on public.maxavis_surveys for update using (true);
create policy "maxavis_s_delete"  on public.maxavis_surveys for delete using (true);

-- maxavis_responses
create policy "maxavis_r_select"  on public.maxavis_responses for select using (true);
create policy "maxavis_r_insert"  on public.maxavis_responses for insert with check (true);

-- tontines
create policy "tontines_select"  on public.tontines for select using (true);
create policy "tontines_insert"  on public.tontines for insert with check (true);
create policy "tontines_update"  on public.tontines for update using (true);
create policy "tontines_delete"  on public.tontines for delete using (true);

-- tontine_membres
create policy "tont_m_select"  on public.tontine_membres for select using (true);
create policy "tont_m_insert"  on public.tontine_membres for insert with check (true);
create policy "tont_m_update"  on public.tontine_membres for update using (true);
create policy "tont_m_delete"  on public.tontine_membres for delete using (true);

-- tontine_tours
create policy "tont_t_select"  on public.tontine_tours for select using (true);
create policy "tont_t_insert"  on public.tontine_tours for insert with check (true);
create policy "tont_t_update"  on public.tontine_tours for update using (true);

-- tontine_paiements
create policy "tont_p_select"  on public.tontine_paiements for select using (true);
create policy "tont_p_insert"  on public.tontine_paiements for insert with check (true);
create policy "tont_p_update"  on public.tontine_paiements for update using (true);

-- abzone_topics
create policy "az_top_select"  on public.abzone_topics for select using (true);
create policy "az_top_insert"  on public.abzone_topics for insert with check (true);
create policy "az_top_update"  on public.abzone_topics for update using (true);
create policy "az_top_delete"  on public.abzone_topics for delete using (true);

-- abzone_comments
create policy "az_cmt_select"  on public.abzone_comments for select using (true);
create policy "az_cmt_insert"  on public.abzone_comments for insert with check (true);
create policy "az_cmt_delete"  on public.abzone_comments for delete using (true);

-- abzone_resources
create policy "az_res_select"  on public.abzone_resources for select using (true);
create policy "az_res_insert"  on public.abzone_resources for insert with check (true);
create policy "az_res_update"  on public.abzone_resources for update using (true);
create policy "az_res_delete"  on public.abzone_resources for delete using (true);

-- abzone_likes
create policy "az_lk_select"  on public.abzone_likes for select using (true);
create policy "az_lk_insert"  on public.abzone_likes for insert with check (true);
create policy "az_lk_delete"  on public.abzone_likes for delete using (true);

-- support_tickets
create policy "st_select"  on public.support_tickets for select using (true);
create policy "st_insert"  on public.support_tickets for insert with check (true);
create policy "st_update"  on public.support_tickets for update using (true);
