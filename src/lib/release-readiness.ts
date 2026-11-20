export interface ReleaseReadinessReport {
  readyForProduction: boolean;
  missingEnvKeys: string[];
  weakAdminSecret: boolean;
}

const REQUIRED_SERVER_KEYS = [
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN',
  'ADMIN_API_SECRET',
  'NEXT_PUBLIC_OWNER_WHATSAPP',
];

export function evaluateReleaseReadiness(
  envSource: Record<string, string | undefined> = process.env
): ReleaseReadinessReport {
  const missingEnvKeys = REQUIRED_SERVER_KEYS.filter(
    (key) => !envSource[key] || String(envSource[key]).trim().length === 0
  );

  const adminSecret = String(envSource.ADMIN_API_SECRET || '').trim();
  const weakAdminSecret = adminSecret.length > 0 && adminSecret.length < 8;

  return {
    readyForProduction: missingEnvKeys.length === 0 && !weakAdminSecret,
    missingEnvKeys,
    weakAdminSecret,
  };
}
