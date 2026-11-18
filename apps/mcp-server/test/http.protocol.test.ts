/**
 * Protocol tests: a real MCP client talks to the real HTTP server on an
 * ephemeral loopback port. No mocks of the SDK or the transport.
 */
import { request } from 'node:http';

import { CapabilitiesOutputSchema, PingOutputSchema } from '@ai-workspace/contracts';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config/config.js';
import { createHttpApp, HEALTH_PATH, MCP_PATH } from '../src/http/create-http-app.js';
import type { HttpApp } from '../src/http/create-http-app.js';
import { listen } from '../src/http/listen.js';
import type { RunningHttpServer } from '../src/http/listen.js';
import { silentLogger } from '../src/logger.js';
import { createMcpServerFactory, SERVER_INSTRUCTIONS } from '../src/server/create-mcp-server.js';
import { SERVER_INFO } from '../src/server-info.js';
import { createToolCatalog } from '../src/tools/catalog.js';

const FIXED_NOW = new Date('2026-11-18T03:00:00.000Z');

let http: HttpApp;
let running: RunningHttpServer;
let mcpUrl: URL;

beforeAll(async () => {
  const config = loadConfig({ PORT: '0' });
  const tools = createToolCatalog({ clock: () => FIXED_NOW, serverInfo: SERVER_INFO });
  http = createHttpApp({
    config,
    logger: silentLogger,
    createServer: createMcpServerFactory(SERVER_INFO, tools, silentLogger),
  });
  running = await listen(http.app, config.host, config.port);
  mcpUrl = new URL(MCP_PATH, running.baseUrl);
});

afterAll(async () => {
  await http.close();
  await running.close();
});

async function connectClient(): Promise<Client> {
  const client = new Client({ name: 'protocol-test', version: '0.0.0' });
  await client.connect(new StreamableHTTPClientTransport(mcpUrl));
  return client;
}

/** Raw HTTP helper: lets tests set headers that fetch forbids (for example Host). */
function rawPost(
  path: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      new URL(path, running.baseUrl),
      { method: 'POST', headers: { 'content-type': 'application/json', ...headers } },
      (res) => {
        let text = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => (text += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, text });
        });
      },
    );
    req.on('error', reject);
    req.end(JSON.stringify(body));
  });
}

describe('MCP over Streamable HTTP (SDK v2 client)', () => {
  it('connects and reports server identity and instructions', async () => {
    const client = await connectClient();
    try {
      expect(client.getServerVersion()).toMatchObject(SERVER_INFO);
      expect(client.getInstructions()).toBe(SERVER_INSTRUCTIONS);
    } finally {
      await client.close();
    }
  });

  it('lists exactly the two read-only tools with input and output schemas', async () => {
    const client = await connectClient();
    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name).sort()).toEqual([
        'workspace_get_capabilities',
        'workspace_ping',
      ]);
      for (const tool of tools) {
        expect(tool.annotations?.readOnlyHint).toBe(true);
        expect(tool.annotations?.destructiveHint).toBe(false);
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.outputSchema).toMatchObject({ type: 'object' });
        expect(tool.description?.length).toBeGreaterThan(0);
      }
    } finally {
      await client.close();
    }
  });

  it('calls workspace_ping and returns validated structured content', async () => {
    const client = await connectClient();
    try {
      const result = await client.callTool({
        name: 'workspace_ping',
        arguments: { message: 'hello' },
      });
      expect(result.isError).not.toBe(true);
      expect(PingOutputSchema.parse(result.structuredContent)).toEqual({
        status: 'ok',
        serverTime: FIXED_NOW.toISOString(),
        echo: 'hello',
      });
    } finally {
      await client.close();
    }
  });

  it('calls workspace_get_capabilities and lists the real tool set', async () => {
    const client = await connectClient();
    try {
      const result = await client.callTool({ name: 'workspace_get_capabilities', arguments: {} });
      const caps = CapabilitiesOutputSchema.parse(result.structuredContent);
      expect(caps.server).toEqual(SERVER_INFO);
      expect(caps.persistence).toBe('none');
      expect(caps.tools.map((tool) => tool.name)).toEqual([
        'workspace_ping',
        'workspace_get_capabilities',
      ]);
    } finally {
      await client.close();
    }
  });

  it('rejects input over the length bound', async () => {
    const client = await connectClient();
    try {
      const outcome = await client
        .callTool({ name: 'workspace_ping', arguments: { message: 'x'.repeat(201) } })
        .then(
          (result) => ({ kind: 'result' as const, isError: result.isError === true }),
          () => ({ kind: 'thrown' as const, isError: true }),
        );
      expect(outcome.isError).toBe(true);
    } finally {
      await client.close();
    }
  });

  it('rejects an unknown tool', async () => {
    const client = await connectClient();
    try {
      const outcome = await client
        .callTool({ name: 'workspace_delete_everything', arguments: {} })
        .then(
          (result) => result.isError === true,
          () => true,
        );
      expect(outcome).toBe(true);
    } finally {
      await client.close();
    }
  });
});

describe('legacy (2025-era) stateless clients', () => {
  it('answers initialize and tools/list without a session', async () => {
    const headers = { accept: 'application/json, text/event-stream' };
    const init = await rawPost(
      MCP_PATH,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'legacy-test', version: '0.0.0' },
        },
      },
      headers,
    );
    expect(init.status).toBe(200);
    expect(init.text).toContain('ai-workspace-mcp');

    const list = await rawPost(
      MCP_PATH,
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
      { ...headers, 'mcp-protocol-version': '2025-06-18' },
    );
    expect(list.status).toBe(200);
    expect(list.text).toContain('workspace_ping');
  });
});

describe('HTTP edge', () => {
  it('serves a health check', async () => {
    const response = await fetch(new URL(HEALTH_PATH, running.baseUrl));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('rejects a foreign Host header (DNS rebinding protection)', async () => {
    const response = await rawPost(
      MCP_PATH,
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      { host: 'evil.example', accept: 'application/json, text/event-stream' },
    );
    expect(response.status).toBe(403);
  });

  it('rejects a foreign Origin header', async () => {
    const response = await rawPost(
      MCP_PATH,
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      { origin: 'https://evil.example', accept: 'application/json, text/event-stream' },
    );
    expect(response.status).toBe(403);
  });

  it('rejects a body over the size limit', async () => {
    const response = await rawPost(
      MCP_PATH,
      { jsonrpc: '2.0', id: 1, method: 'tools/list', params: { pad: 'x'.repeat(70_000) } },
      { accept: 'application/json, text/event-stream' },
    );
    expect(response.status).toBe(413);
  });
});
