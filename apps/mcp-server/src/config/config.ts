import { z } from 'zod';

/** Hostnames that are always allowed in the Host header (DNS rebinding protection). */
export const LOOPBACK_HOSTNAMES: readonly string[] = ['localhost', '127.0.0.1', '[::1]'];

const LOOPBACK_BIND_ADDRESSES: readonly string[] = ['127.0.0.1', 'localhost', '::1'];

const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

const HostnameListSchema = z
  .string()
  .optional()
  .transform((raw) => parseHostnameList(raw));

const EnvSchema = z.object({
  HOST: z
    .string()
    .default('127.0.0.1')
    .refine((host) => LOOPBACK_BIND_ADDRESSES.includes(host), {
      message:
        'M0 has no authentication: HOST must be a loopback address (127.0.0.1, localhost, ::1). ' +
        'Use a tunnel and MCP_ALLOWED_HOSTS for remote testing.',
    }),
  PORT: z.coerce.number().int().min(0).max(65_535).default(8787),
  LOG_LEVEL: LogLevelSchema.default('info'),
  MCP_ALLOWED_HOSTS: HostnameListSchema,
});

export type LogLevel = z.infer<typeof LogLevelSchema>;

export interface ServerConfig {
  readonly host: string;
  readonly port: number;
  readonly logLevel: LogLevel;
  /** Host header allow-list: loopback names plus any extra names (for example a tunnel). */
  readonly allowedHosts: readonly string[];
}

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

export function parseHostnameList(raw: string | undefined): readonly string[] {
  if (raw === undefined) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

/** Validates environment variables at the process boundary. Pure: takes env as input. */
export function loadConfig(env: Readonly<Record<string, string | undefined>>): ServerConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigError(`Invalid configuration: ${z.prettifyError(parsed.error)}`);
  }
  const { HOST, PORT, LOG_LEVEL, MCP_ALLOWED_HOSTS } = parsed.data;
  return Object.freeze({
    host: HOST,
    port: PORT,
    logLevel: LOG_LEVEL,
    allowedHosts: Object.freeze([...new Set([...LOOPBACK_HOSTNAMES, ...MCP_ALLOWED_HOSTS])]),
  });
}
