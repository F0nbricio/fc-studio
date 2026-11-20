import { getTursoClient } from './client';

export interface TursoSchemaAuditResult {
  configured: boolean;
  columnsOk: boolean;
  statusConstraintOk: boolean;
  indexOk: boolean;
  totalRows: number;
  missingColumns: string[];
}

const EXPECTED_COLUMNS = ["id","client_name","client_whatsapp","client_email","project_type","business_goal","desired_features","design_style","has_domain_or_brand","additional_notes","generated_gemini_prompt","status","agreed_amount_brl","commercial_notes","created_at"];

const CREATE_BRIEFINGS_SQL = "CREATE TABLE IF NOT EXISTS project_briefings (\n  id TEXT PRIMARY KEY,\n  client_name TEXT NOT NULL CHECK (length(trim(client_name)) >= 2),\n  client_whatsapp TEXT NOT NULL CHECK (length(trim(client_whatsapp)) >= 8),\n  client_email TEXT,\n  project_type TEXT NOT NULL,\n  business_goal TEXT NOT NULL CHECK (length(trim(business_goal)) >= 5),\n  desired_features TEXT NOT NULL DEFAULT '[]',\n  design_style TEXT NOT NULL DEFAULT 'Moderno e Minimalista',\n  has_domain_or_brand INTEGER NOT NULL DEFAULT 0 CHECK (has_domain_or_brand IN (0, 1)),\n  additional_notes TEXT,\n  generated_gemini_prompt TEXT NOT NULL CHECK (length(trim(generated_gemini_prompt)) >= 20),\n  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_analise', 'proposta_enviada', 'feito', 'em_producao', 'fechado')),\n  agreed_amount_brl REAL CHECK (agreed_amount_brl IS NULL OR agreed_amount_brl >= 0),\n  commercial_notes TEXT,\n  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))\n)";

const CREATE_TMP_BRIEFINGS_SQL = "CREATE TABLE project_briefings_sync_tmp (\n  id TEXT PRIMARY KEY,\n  client_name TEXT NOT NULL CHECK (length(trim(client_name)) >= 2),\n  client_whatsapp TEXT NOT NULL CHECK (length(trim(client_whatsapp)) >= 8),\n  client_email TEXT,\n  project_type TEXT NOT NULL,\n  business_goal TEXT NOT NULL CHECK (length(trim(business_goal)) >= 5),\n  desired_features TEXT NOT NULL DEFAULT '[]',\n  design_style TEXT NOT NULL DEFAULT 'Moderno e Minimalista',\n  has_domain_or_brand INTEGER NOT NULL DEFAULT 0 CHECK (has_domain_or_brand IN (0, 1)),\n  additional_notes TEXT,\n  generated_gemini_prompt TEXT NOT NULL CHECK (length(trim(generated_gemini_prompt)) >= 20),\n  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_analise', 'proposta_enviada', 'feito', 'em_producao', 'fechado')),\n  agreed_amount_brl REAL CHECK (agreed_amount_brl IS NULL OR agreed_amount_brl >= 0),\n  commercial_notes TEXT,\n  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))\n)";

const COPY_BRIEFINGS_SQL = "INSERT INTO project_briefings_sync_tmp (\n  id, client_name, client_whatsapp, client_email, project_type, business_goal,\n  desired_features, design_style, has_domain_or_brand, additional_notes,\n  generated_gemini_prompt, status, agreed_amount_brl, commercial_notes, created_at\n)\nSELECT\n  id, client_name, client_whatsapp, client_email, project_type, business_goal,\n  desired_features, design_style, has_domain_or_brand, additional_notes,\n  generated_gemini_prompt,\n  CASE WHEN status IN ('novo', 'em_analise', 'proposta_enviada', 'feito', 'em_producao', 'fechado') THEN status ELSE 'novo' END,\n  agreed_amount_brl, commercial_notes, created_at\nFROM project_briefings";

const CREATE_INDEX_SQL = "CREATE INDEX IF NOT EXISTS idx_project_briefings_status_created ON project_briefings (status, created_at DESC)";

export async function auditAndSyncProjectBriefingsSchema(): Promise<TursoSchemaAuditResult> {
  const client = getTursoClient();
  if (!client) {
    return {
      configured: false,
      columnsOk: false,
      statusConstraintOk: false,
      indexOk: false,
      totalRows: 0,
      missingColumns: EXPECTED_COLUMNS,
    };
  }

  await client.execute({ sql: CREATE_BRIEFINGS_SQL, args: [] });

  const infoResult = await client.execute({
    sql: "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'project_briefings'",
    args: [],
  });
  const tableSql = String(infoResult.rows[0]?.sql || '');
  const statusConstraintOk = tableSql.includes("'feito'") && tableSql.includes("'em_producao'");

  if (!statusConstraintOk && tableSql.length > 0) {
    await client.batch(
      [
        "PRAGMA foreign_keys = OFF",
        CREATE_TMP_BRIEFINGS_SQL,
        COPY_BRIEFINGS_SQL,
        "DROP TABLE project_briefings",
        "ALTER TABLE project_briefings_sync_tmp RENAME TO project_briefings",
        "PRAGMA foreign_keys = ON",
      ],
      'write'
    );
  }

  const colsRes = await client.execute({
    sql: "PRAGMA table_info(project_briefings)",
    args: [],
  });
  const colSet = new Set(colsRes.rows.map((r) => String(r.name || '').toLowerCase()));

  if (!colSet.has('agreed_amount_brl')) {
    await client.execute({
      sql: "ALTER TABLE project_briefings ADD COLUMN agreed_amount_brl REAL",
      args: [],
    });
    colSet.add('agreed_amount_brl');
  }

  if (!colSet.has('commercial_notes')) {
    await client.execute({
      sql: "ALTER TABLE project_briefings ADD COLUMN commercial_notes TEXT",
      args: [],
    });
    colSet.add('commercial_notes');
  }

  await client.execute({ sql: CREATE_INDEX_SQL, args: [] });

  const idxRes = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_project_briefings_status_created'",
    args: [],
  });

  const countRes = await client.execute({
    sql: "SELECT COUNT(*) AS total FROM project_briefings",
    args: [],
  });

  const missingColumns = EXPECTED_COLUMNS.filter((col) => !colSet.has(col));
  const finalInfo = await client.execute({
    sql: "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'project_briefings'",
    args: [],
  });
  const finalSql = String(finalInfo.rows[0]?.sql || '');

  return {
    configured: true,
    columnsOk: missingColumns.length === 0,
    statusConstraintOk: finalSql.includes("'feito'") && finalSql.includes("'em_producao'"),
    indexOk: idxRes.rows.length > 0,
    totalRows: Number(countRes.rows[0]?.total || 0),
    missingColumns,
  };
}
