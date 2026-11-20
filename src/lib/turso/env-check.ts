export interface TursoEnvStatus {
  hasUrl: boolean;
  hasToken: boolean;
  ready: boolean;
}

export function getTursoEnvStatus(): TursoEnvStatus {
  const url = process.env.TURSO_DATABASE_URL?.trim() || '';
  const token = process.env.TURSO_AUTH_TOKEN?.trim() || '';
  const hasUrl = url.startsWith('libsql://') || url.startsWith('https://');
  const hasToken = token.length > 10;

  return {
    hasUrl,
    hasToken,
    ready: hasUrl && hasToken,
  };
}
