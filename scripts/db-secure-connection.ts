/**
 * Secure DB helpers for release runners — DATABASE_URL from process env only.
 * Never loads .env.local. Never logs connection strings or credentials.
 */

import { maskSecret } from "./load-env-local";

export interface PgConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: false | { rejectUnauthorized: boolean };
}

const PG_ENV_KEYS = [
  "PGHOST",
  "PGPORT",
  "PGDATABASE",
  "PGUSER",
  "PGPASSWORD",
  "PGSSLMODE",
] as const;

export function requireDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DIRECT_URL?.trim() ||
    "";
  if (!url) {
    console.error("FAIL  DATABASE_URL not set in process environment.");
    process.exit(1);
  }
  return url;
}

export function parseDatabaseUrl(connectionString: string): PgConnectionConfig {
  const u = new URL(connectionString);
  const host = u.hostname;
  const port = u.port ? Number(u.port) : 5432;
  const database = u.pathname.replace(/^\//, "") || "postgres";
  const user = decodeURIComponent(u.username || "postgres");
  const password = decodeURIComponent(u.password || "");
  const ssl =
    host === "localhost" || host === "127.0.0.1"
      ? false
      : { rejectUnauthorized: false };
  return { host, port, database, user, password, ssl };
}

/** Set PG* env vars from parsed URL — never logs values. */
export function applyPgEnvFromUrl(connectionString: string): void {
  const cfg = parseDatabaseUrl(connectionString);
  process.env.PGHOST = cfg.host;
  process.env.PGPORT = String(cfg.port);
  process.env.PGDATABASE = cfg.database;
  process.env.PGUSER = cfg.user;
  process.env.PGPASSWORD = cfg.password;
  process.env.PGSSLMODE = cfg.ssl ? "require" : "disable";
}

export function clearPgEnv(): void {
  for (const key of PG_ENV_KEYS) {
    delete process.env[key];
  }
}

export function pgConfigFromEnv(): PgConnectionConfig {
  const host = process.env.PGHOST?.trim();
  const database = process.env.PGDATABASE?.trim();
  const user = process.env.PGUSER?.trim();
  const password = process.env.PGPASSWORD ?? "";
  if (!host || !database || !user) {
    throw new Error("PG connection env incomplete (PGHOST/PGDATABASE/PGUSER required).");
  }
  const port = Number(process.env.PGPORT?.trim() || "5432");
  const sslMode = process.env.PGSSLMODE?.trim() ?? "require";
  const ssl =
    sslMode === "disable" || host === "localhost" || host === "127.0.0.1"
      ? false
      : { rejectUnauthorized: false };
  return { host, port, database, user, password, ssl };
}

export function maskDatabaseUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const maskedHost =
      host.length <= 8 ? "****" : `${host.slice(0, 4)}...${host.slice(-4)}`;
    return `${u.protocol}//${maskedHost}:${u.port || "5432"}/${u.pathname.replace(/^\//, "")}`;
  } catch {
    return maskSecret(url);
  }
}

export function redactSecrets(message: string): string {
  return message
    .replace(/postgresql:\/\/[^\s]+/gi, "[redacted]")
    .replace(/postgres:\/\/[^\s]+/gi, "[redacted]");
}

export function isLocalDatabaseUrl(connectionString: string): boolean {
  try {
    const host = new URL(connectionString).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

export type PgClient = import("pg").Client;

export async function withPg<T>(
  connectionString: string,
  fn: (client: PgClient) => Promise<T>
): Promise<T> {
  applyPgEnvFromUrl(connectionString);
  try {
    return await withPgEnv(fn);
  } finally {
    clearPgEnv();
  }
}

/** Connect via PG* env vars only — credentials never passed on command line. */
export async function withPgEnv<T>(fn: (client: PgClient) => Promise<T>): Promise<T> {
  const { default: pg } = await import("pg");
  const cfg = pgConfigFromEnv();
  const client = new pg.Client({
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    ...(cfg.ssl ? { ssl: cfg.ssl } : {}),
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
