import crypto from 'crypto';
import { getTursoClient } from './client';
import { BriefingFormData } from '@/types/briefing';

export const ALLOWED_BRIEFING_STATUSES = [
  'novo',
  'em_analise',
  'proposta_enviada',
  'feito',
  'em_producao',
] as const;

export type BriefingStatus = (typeof ALLOWED_BRIEFING_STATUSES)[number];

const DB_ALLOWED_STATUSES = [
  'novo',
  'em_analise',
  'proposta_enviada',
  'feito',
  'em_producao',
  'fechado',
] as const;

export function isValidBriefingStatus(value: string): value is BriefingStatus {
  return (ALLOWED_BRIEFING_STATUSES as readonly string[]).includes(value);
}

export interface StoredBriefingRecord {
  id: string;
  client_name: string;
  client_whatsapp: string;
  client_email: string | null;
  project_type: string;
  business_goal: string;
  desired_features: string[];
  design_style: string;
  has_domain_or_brand: boolean;
  additional_notes: string | null;
  generated_gemini_prompt: string;
  status: BriefingStatus;
  agreed_amount_brl: number | null;
  commercial_notes: string | null;
  created_at: string;
}

export interface CommercialUpdateInput {
  status: BriefingStatus;
  agreedAmountBrl: number | null;
  commercialNotes: string | null;
}

let schemaChecked = false;

async function ensureCommercialColumns(client: NonNullable<ReturnType<typeof getTursoClient>>) {
  const columnsResult = await client.execute({
    sql: 'PRAGMA table_info(project_briefings)',
    args: [],
  });

  const existingColumns = new Set(
    columnsResult.rows.map((r) => String(r.name || '').toLowerCase())
  );

  if (!existingColumns.has('agreed_amount_brl')) {
    await client.execute({
      sql: 'ALTER TABLE project_briefings ADD COLUMN agreed_amount_brl REAL',
      args: [],
    });
  }

  if (!existingColumns.has('commercial_notes')) {
    await client.execute({
      sql: 'ALTER TABLE project_briefings ADD COLUMN commercial_notes TEXT',
      args: [],
    });
  }
}

async function ensureSchemaAndStatuses() {
  if (schemaChecked) return;
  const client = getTursoClient();
  if (!client) return;

  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS project_briefings (
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
      )`,
      `CREATE INDEX IF NOT EXISTS idx_project_briefings_status_created
        ON project_briefings (status, created_at DESC)`,
    ],
    'write'
  );

  await ensureCommercialColumns(client);

  const info = await client.execute({
    sql: "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'project_briefings'",
    args: [],
  });

  const tableSql = String(info.rows[0]?.sql || '');
  const needsMigration =
    tableSql.length > 0 &&
    (!tableSql.includes("'feito'") || !tableSql.includes("'em_producao'"));

  if (needsMigration) {
    await client.batch(
      [
        'PRAGMA foreign_keys = OFF',
        `CREATE TABLE project_briefings_next (
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
        )`,
        `INSERT INTO project_briefings_next (
          id,
          client_name,
          client_whatsapp,
          client_email,
          project_type,
          business_goal,
          desired_features,
          design_style,
          has_domain_or_brand,
          additional_notes,
          generated_gemini_prompt,
          status,
          agreed_amount_brl,
          commercial_notes,
          created_at
        )
        SELECT
          id,
          client_name,
          client_whatsapp,
          client_email,
          project_type,
          business_goal,
          desired_features,
          design_style,
          has_domain_or_brand,
          additional_notes,
          generated_gemini_prompt,
          CASE
            WHEN status IN ('novo', 'em_analise', 'proposta_enviada', 'feito', 'em_producao', 'fechado') THEN status
            ELSE 'novo'
          END,
          NULL,
          NULL,
          created_at
        FROM project_briefings`,
        'DROP TABLE project_briefings',
        'ALTER TABLE project_briefings_next RENAME TO project_briefings',
        `CREATE INDEX IF NOT EXISTS idx_project_briefings_status_created
          ON project_briefings (status, created_at DESC)`,
        'PRAGMA foreign_keys = ON',
      ],
      'write'
    );
  }

  schemaChecked = true;
}

export async function createPublicBriefing(
  data: BriefingFormData,
  generatedPrompt: string
): Promise<{ ok: boolean; id?: string; reason?: string }> {
  const client = getTursoClient();
  if (!client) {
    return { ok: false, reason: 'TURSO_ENV_NOT_CONFIGURED' };
  }

  try {
    await ensureSchemaAndStatuses();
    const id = crypto.randomUUID();

    await client.execute({
      sql: `INSERT INTO project_briefings (
        id,
        client_name,
        client_whatsapp,
        client_email,
        project_type,
        business_goal,
        desired_features,
        design_style,
        has_domain_or_brand,
        additional_notes,
        generated_gemini_prompt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.clientName,
        data.clientWhatsapp,
        data.clientEmail || null,
        data.projectType,
        data.businessGoal,
        JSON.stringify(data.desiredFeatures),
        data.designStyle,
        data.hasDomainOrBrand ? 1 : 0,
        data.additionalNotes || null,
        generatedPrompt,
      ],
    });

    return { ok: true, id };
  } catch {
    return { ok: false, reason: 'TURSO_WRITE_ERROR' };
  }
}

export async function listAdminBriefings(limit = 50): Promise<StoredBriefingRecord[]> {
  const client = getTursoClient();
  if (!client) return [];

  await ensureSchemaAndStatuses();
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const result = await client.execute({
    sql: `SELECT
      id,
      client_name,
      client_whatsapp,
      client_email,
      project_type,
      business_goal,
      desired_features,
      design_style,
      has_domain_or_brand,
      additional_notes,
      generated_gemini_prompt,
      status,
      agreed_amount_brl,
      commercial_notes,
      created_at
    FROM project_briefings
    ORDER BY created_at DESC
    LIMIT ?`,
    args: [safeLimit],
  });

  return result.rows.map((row) => {
    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = JSON.parse(String(row.desired_features || '[]'));
    } catch {
      parsedFeatures = [];
    }

    const rawStatus = String(row.status || 'novo');
    const normalizedStatus: BriefingStatus = isValidBriefingStatus(rawStatus)
      ? rawStatus
      : 'novo';

    const rawAmount = row.agreed_amount_brl;
    const numericAmount =
      rawAmount === null || rawAmount === undefined || rawAmount === ''
        ? null
        : Number(rawAmount);

    return {
      id: String(row.id),
      client_name: String(row.client_name),
      client_whatsapp: String(row.client_whatsapp),
      client_email: row.client_email ? String(row.client_email) : null,
      project_type: String(row.project_type),
      business_goal: String(row.business_goal),
      desired_features: Array.isArray(parsedFeatures) ? parsedFeatures : [],
      design_style: String(row.design_style),
      has_domain_or_brand: Number(row.has_domain_or_brand) === 1,
      additional_notes: row.additional_notes ? String(row.additional_notes) : null,
      generated_gemini_prompt: String(row.generated_gemini_prompt),
      status: normalizedStatus,
      agreed_amount_brl:
        numericAmount !== null && Number.isFinite(numericAmount) && numericAmount >= 0
          ? numericAmount
          : null,
      commercial_notes: row.commercial_notes ? String(row.commercial_notes) : null,
      created_at: String(row.created_at),
    };
  });
}

export async function updateBriefingStatus(
  id: string,
  status: BriefingStatus
): Promise<{ ok: boolean; reason?: string }> {
  const client = getTursoClient();
  if (!client) {
    return { ok: false, reason: 'TURSO_ENV_NOT_CONFIGURED' };
  }

  if (!(DB_ALLOWED_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, reason: 'INVALID_STATUS' };
  }

  try {
    await ensureSchemaAndStatuses();
    const res = await client.execute({
      sql: 'UPDATE project_briefings SET status = ? WHERE id = ?',
      args: [status, id],
    });

    if ((res.rowsAffected ?? 0) === 0) {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    return { ok: true };
  } catch {
    schemaChecked = false;
    try {
      await ensureSchemaAndStatuses();
      const retry = await client.execute({
        sql: 'UPDATE project_briefings SET status = ? WHERE id = ?',
        args: [status, id],
      });
      return (retry.rowsAffected ?? 0) > 0
        ? { ok: true }
        : { ok: false, reason: 'NOT_FOUND' };
    } catch {
      return { ok: false, reason: 'TURSO_UPDATE_ERROR' };
    }
  }
}

export async function updateBriefingCommercialDetails(
  id: string,
  input: CommercialUpdateInput
): Promise<{ ok: boolean; reason?: string }> {
  const client = getTursoClient();
  if (!client) {
    return { ok: false, reason: 'TURSO_ENV_NOT_CONFIGURED' };
  }

  if (!(DB_ALLOWED_STATUSES as readonly string[]).includes(input.status)) {
    return { ok: false, reason: 'INVALID_STATUS' };
  }

  try {
    await ensureSchemaAndStatuses();
    const res = await client.execute({
      sql: `UPDATE project_briefings
        SET status = ?, agreed_amount_brl = ?, commercial_notes = ?
        WHERE id = ?`,
      args: [input.status, input.agreedAmountBrl, input.commercialNotes, id],
    });

    if ((res.rowsAffected ?? 0) === 0) {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    return { ok: true };
  } catch {
    schemaChecked = false;
    try {
      await ensureSchemaAndStatuses();
      const retry = await client.execute({
        sql: `UPDATE project_briefings
          SET status = ?, agreed_amount_brl = ?, commercial_notes = ?
          WHERE id = ?`,
        args: [input.status, input.agreedAmountBrl, input.commercialNotes, id],
      });
      return (retry.rowsAffected ?? 0) > 0
        ? { ok: true }
        : { ok: false, reason: 'NOT_FOUND' };
    } catch {
      return { ok: false, reason: 'TURSO_UPDATE_ERROR' };
    }
  }
}
