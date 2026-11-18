import { CapabilitiesOutputSchema, PingOutputSchema } from '@ai-workspace/contracts';
import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';

import { silentLogger } from '../src/logger.js';
import type { Logger } from '../src/logger.js';
import { createToolCatalog } from '../src/tools/catalog.js';
import { describeCapabilities, GET_CAPABILITIES_TOOL_NAME } from '../src/tools/get-capabilities.js';
import { ping, PING_TOOL_NAME } from '../src/tools/ping.js';
import {
  INTERNAL_ERROR_TEXT,
  INVALID_INPUT_TEXT,
  READ_ONLY_ANNOTATIONS,
  runTool,
} from '../src/tools/tool-definition.js';
import type { ToolSpec } from '../src/tools/tool-definition.js';

const FIXED_NOW = new Date('2026-11-18T03:00:00.000Z');
const SERVER_INFO = { name: 'test-server', version: '9.9.9' };

describe('ping', () => {
  it('returns ok and the supplied time', () => {
    expect(ping({}, FIXED_NOW)).toEqual({ status: 'ok', serverTime: '2026-11-18T03:00:00.000Z' });
  });

  it('echoes the message unchanged', () => {
    const output = ping({ message: 'hello' }, FIXED_NOW);
    expect(output.echo).toBe('hello');
    expect(PingOutputSchema.parse(output)).toEqual(output);
  });
});

describe('describeCapabilities', () => {
  it('reports server identity, transport, and M0 limits', () => {
    const output = describeCapabilities(SERVER_INFO, []);
    expect(output.server).toEqual(SERVER_INFO);
    expect(output.transport).toEqual({ kind: 'streamable-http', stateless: true });
    expect(output.persistence).toBe('none');
    expect(output.authentication).toBe('none-local-only');
    expect(CapabilitiesOutputSchema.parse(output)).toEqual(output);
  });
});

describe('createToolCatalog', () => {
  const catalog = createToolCatalog({ clock: () => FIXED_NOW, serverInfo: SERVER_INFO });

  it('contains exactly the two M0 tools, both read-only', () => {
    expect(catalog.map((tool) => tool.summary)).toEqual([
      { name: PING_TOOL_NAME, title: 'Ping workspace server', readOnly: true },
      {
        name: GET_CAPABILITIES_TOOL_NAME,
        title: 'Get workspace server capabilities',
        readOnly: true,
      },
    ]);
  });

  it('uses unique tool names', () => {
    const names = catalog.map((tool) => tool.summary.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('is immutable', () => {
    expect(Object.isFrozen(catalog)).toBe(true);
  });
});

describe('runTool', () => {
  const EchoSchema = z.object({ value: z.number() }).strict();
  const spec = (handler: ToolSpec<typeof EchoSchema, typeof EchoSchema>['handler']) => ({
    name: 'test_tool',
    title: 'Test',
    description: 'Test tool',
    inputSchema: EchoSchema,
    outputSchema: EchoSchema,
    annotations: READ_ONLY_ANNOTATIONS,
    handler,
  });

  it('returns structured content and a JSON text block', async () => {
    const result = await runTool(
      spec((input) => input),
      { value: 3 },
      silentLogger,
    );
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ value: 3 });
    expect(result.content).toEqual([{ type: 'text', text: '{"value":3}' }]);
  });

  it('rejects invalid input without calling the handler', async () => {
    const handler = vi.fn((input: { value: number }) => input);
    const result = await runTool(spec(handler), { value: 'three' }, silentLogger);
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: INVALID_INPUT_TEXT }],
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('hides internal error details from the client and logs only the error name', async () => {
    const errorLog = vi.fn();
    const logger: Logger = { ...silentLogger, error: errorLog };
    const failing = spec(() => {
      throw new TypeError('secret connection string postgres://user:pw@db');
    });
    const result = await runTool(failing, { value: 1 }, logger);
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: INTERNAL_ERROR_TEXT }],
    });
    expect(JSON.stringify(result)).not.toContain('postgres');
    expect(errorLog).toHaveBeenCalledWith('tool_failed', {
      tool: 'test_tool',
      errorName: 'TypeError',
    });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain('postgres');
  });
});
