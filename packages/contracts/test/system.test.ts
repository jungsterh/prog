import { describe, expect, it } from 'vitest';

import {
  CapabilitiesOutputSchema,
  PING_MESSAGE_MAX_LENGTH,
  PingInputSchema,
  PingOutputSchema,
} from '../src/index.js';

describe('PingInputSchema', () => {
  it('accepts an empty object and a bounded message', () => {
    expect(PingInputSchema.parse({})).toEqual({});
    expect(PingInputSchema.parse({ message: 'hi' })).toEqual({ message: 'hi' });
  });

  it('rejects a message over the length limit', () => {
    const tooLong = 'x'.repeat(PING_MESSAGE_MAX_LENGTH + 1);
    expect(PingInputSchema.safeParse({ message: tooLong }).success).toBe(false);
  });

  it('rejects unknown properties (strict boundary)', () => {
    expect(PingInputSchema.safeParse({ message: 'hi', extra: 1 }).success).toBe(false);
  });
});

describe('PingOutputSchema', () => {
  it('requires an ISO 8601 UTC server time', () => {
    expect(PingOutputSchema.safeParse({ status: 'ok', serverTime: 'yesterday' }).success).toBe(
      false,
    );
    expect(
      PingOutputSchema.safeParse({ status: 'ok', serverTime: '2026-11-18T03:00:00.000Z' }).success,
    ).toBe(true);
  });
});

describe('CapabilitiesOutputSchema', () => {
  it('accepts a valid capabilities document', () => {
    const doc = {
      server: { name: 'ai-workspace-mcp', version: '0.0.0' },
      transport: { kind: 'streamable-http', stateless: true },
      persistence: 'none',
      authentication: 'none-local-only',
      tools: [{ name: 'workspace_ping', title: 'Ping', readOnly: true }],
    };
    expect(CapabilitiesOutputSchema.parse(doc)).toEqual(doc);
  });

  it('rejects an unknown persistence mode', () => {
    const result = CapabilitiesOutputSchema.safeParse({
      server: { name: 'x', version: '1' },
      transport: { kind: 'streamable-http', stateless: true },
      persistence: 'llm-memory',
      authentication: 'none-local-only',
      tools: [],
    });
    expect(result.success).toBe(false);
  });
});
