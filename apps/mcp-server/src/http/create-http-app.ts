import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';
import type { Express } from 'express';

import type { ServerConfig } from '../config/config.js';
import type { Logger } from '../logger.js';
import type { McpServerFactory } from '../server/create-mcp-server.js';

export const MCP_PATH = '/mcp';
export const HEALTH_PATH = '/healthz';
/** Upper bound for JSON request bodies. M0 tools take tiny inputs. */
export const MAX_JSON_BODY = '64kb';

export interface HttpAppDeps {
  readonly config: ServerConfig;
  readonly createServer: McpServerFactory;
  readonly logger: Logger;
}

export interface HttpApp {
  readonly app: Express;
  close(): Promise<void>;
}

/**
 * HTTP transport adapter. It only routes requests: no business decisions here.
 * createMcpExpressApp adds Host/Origin validation (DNS rebinding protection).
 */
export function createHttpApp(deps: HttpAppDeps): HttpApp {
  const { config, logger } = deps;
  const app = createMcpExpressApp({
    host: config.host,
    allowedHosts: [...config.allowedHosts],
    jsonLimit: MAX_JSON_BODY,
  });
  const logError = (error: Error): void => {
    logger.error('mcp_transport_error', { errorName: error.name });
  };
  const handler = createMcpHandler(() => deps.createServer(), { onerror: logError });
  const handleMcp = toNodeHandler(handler, { onerror: logError });

  app.get(HEALTH_PATH, (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.all(MCP_PATH, (req, res) => handleMcp(req, res, req.body));

  return { app, close: () => handler.close() };
}
