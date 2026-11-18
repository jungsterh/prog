import { loadConfig } from './config/config.js';
import { createHttpApp, MCP_PATH } from './http/create-http-app.js';
import { listen } from './http/listen.js';
import { createJsonLogger } from './logger.js';
import type { Logger } from './logger.js';
import { createMcpServerFactory } from './server/create-mcp-server.js';
import { SERVER_INFO, systemClock } from './server-info.js';
import { createToolCatalog } from './tools/catalog.js';

/** Composition root: the only place that reads process state. */
async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const logger = createJsonLogger(config.logLevel);
  const tools = createToolCatalog({ clock: systemClock, serverInfo: SERVER_INFO });
  const http = createHttpApp({
    config,
    logger,
    createServer: createMcpServerFactory(SERVER_INFO, tools, logger),
  });
  const running = await listen(http.app, config.host, config.port);
  logger.info('mcp_server_listening', { url: new URL(MCP_PATH, running.baseUrl).href });
  onShutdownSignal(logger, async () => {
    await http.close();
    await running.close();
  });
}

function onShutdownSignal(logger: Logger, shutdown: () => Promise<void>): void {
  const handle = (signal: NodeJS.Signals): void => {
    logger.info('mcp_server_stopping', { signal });
    shutdown().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  };
  process.once('SIGINT', handle);
  process.once('SIGTERM', handle);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `${JSON.stringify({ level: 'error', message: 'startup_failed', detail: message })}\n`,
  );
  process.exit(1);
});
