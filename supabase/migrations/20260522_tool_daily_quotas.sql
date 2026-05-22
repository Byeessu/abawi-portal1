-- ═══════════════════════════════════════════════════════════
-- DAILY FREE TOOL QUOTAS — Limites gratuites quotidiennes
-- ═══════════════════════════════════════════════════════════

-- Outils gratuits
INSERT INTO tool_quotas (tool_key, plan_id, limit_count, window_type, action_type, cooldown_min, cost_override, tool_name, category)
VALUES
  ('facture',        'all', 1, 'day', 'block', 0, 0, 'Facture / Devis', 'Essentiel'),
  ('pro_card_elite', 'all', 2, 'day', 'block', 0, 0, 'Pro Card Élite', 'Essentiel'),
  ('qr_code_pro',    'all', 1, 'day', 'block', 0, 0, 'QR Code Pro', 'Essentiel'),
  ('format_converter','all', 2, 'day', 'block', 0, 0, 'Format Converter Pro', 'Essentiel')
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  limit_count = EXCLUDED.limit_count,
  window_type = EXCLUDED.window_type,
  action_type = EXCLUDED.action_type,
  cost_override = EXCLUDED.cost_override;

-- Outils élite : 2 gratuits/jour puis coût normal
INSERT INTO tool_quotas (tool_key, plan_id, limit_count, window_type, action_type, cooldown_min, cost_override, tool_name, category)
VALUES
  ('business_plan',    'all', 2, 'day', 'premium_cost', 0, 8,  'Business Plan Élite', 'Élite'),
  ('pitch',            'all', 2, 'day', 'premium_cost', 0, 6,  'Pitch Deck', 'Élite'),
  ('finance_elite',    'all', 2, 'day', 'premium_cost', 0, 15, 'Finance Élite', 'Élite'),
  ('juridique_elite',  'all', 2, 'day', 'premium_cost', 0, 12, 'Juridique Élite', 'Élite'),
  ('comptable_elite',  'all', 2, 'day', 'premium_cost', 0, 12, 'Comptable Élite', 'Élite'),
  ('rh_elite',         'all', 2, 'day', 'premium_cost', 0, 8,  'RH Élite', 'Élite'),
  ('immobilier_elite', 'all', 2, 'day', 'premium_cost', 0, 8,  'Immobilier Élite', 'Élite'),
  ('consultant_elite', 'all', 2, 'day', 'premium_cost', 0, 8,  'Consultant Élite', 'Élite'),
  ('smart_office',     'all', 2, 'day', 'premium_cost', 0, 5,  'Smart Office Pro', 'Élite'),
  ('infographie',      'all', 2, 'day', 'premium_cost', 0, 4,  'Infographie Pro', 'Élite'),
  ('studio_photo',     'all', 2, 'day', 'premium_cost', 0, 3,  'Studio Photo Pro', 'Élite'),
  ('audio_studio',     'all', 2, 'day', 'premium_cost', 0, 8,  'Audio Studio Élite', 'Élite'),
  ('image_pro',        'all', 2, 'day', 'premium_cost', 0, 3,  'Image Pro', 'Élite')
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  limit_count = EXCLUDED.limit_count,
  window_type = EXCLUDED.window_type,
  action_type = EXCLUDED.action_type,
  cost_override = EXCLUDED.cost_override;
