import { McpServer } from '@modelcontextprotocol/server';

import type { Logger } from '../logger.js';
import type { ServerInfo } from '../server-info.js';
import type { ToolRegistration } from '../tools/tool-definition.js';

export const SERVER_INSTRUCTIONS =
  'AI workspace server (milestone M0). Only read-only diagnostic tools are available: ' +
  'workspace_ping and workspace_get_capabilities. No project data is stored yet.';

export type McpServerFactory = () => McpServer;

/** Builds a fresh McpServer per request (stateless serving). */
export function createMcpServerFactory(
  serverInfo: ServerInfo,
  tools: readonly ToolRegistration[],
  logger: Logger,
): McpServerFactory {
  return () => {
    const server = new McpServer(
      { name: serverInfo.name, version: serverInfo.version },
      { instructions: SERVER_INSTRUCTIONS },
    );
    tools.forEach((tool) => {
      tool.register(server, logger);
    });
    return server;
  };
}
