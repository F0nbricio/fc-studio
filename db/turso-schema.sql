CREATE TABLE IF NOT EXISTS project_briefings (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL CHECK (length(trim(client_name)) >= 2),
  client_whatsapp TEXT NOT NULL CHECK (length(trim(client_whatsapp)) >= 8),
  client_email TEXT,
  project_type TEXT NOT NULL,
  business_goal TEXT NOT NULL CHECK (length(trim(business_goal)) >= 5),
  desired_features TEXT NOT NULL DEFAULT '[]',
  design_style TEXT NOT NULL DEFAULT 'Moderno e Minimalista',
  has_domain_or_brand INTEGER NOT NULL DEFAULT 0 CHECK (has_domain_or_brand IN (0, 1)),
  additional_notes TEXT,
  generated_gemini_prompt TEXT NOT NULL CHECK (length(trim(generated_gemini_prompt)) >= 20),
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_analise', 'proposta_enviada', 'feito', 'em_producao', 'fechado')),
  agreed_amount_brl REAL CHECK (agreed_amount_brl IS NULL OR agreed_amount_brl >= 0),
  commercial_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_project_briefings_status_created
  ON project_briefings (status, created_at DESC);
