import { createClient, Client } from '@libsql/client';

let cachedClient: Client | null = null;

export function getTursoClient(): Client | null {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!url) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient({
      url,
      authToken: authToken || undefined,
    });
  }

  return cachedClient;
}
