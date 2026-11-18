import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { createJsonLogger } from '../src/logger.js';
import { SERVER_INFO } from '../src/server-info.js';

describe('createJsonLogger', () => {
  const now = () => new Date('2026-11-18T03:00:00.000Z');

  it('writes one JSON line per entry at or above the minimum level', () => {
    const lines: string[] = [];
    const logger = createJsonLogger('warn', (line) => lines.push(line), now);
    logger.info('hidden');
    logger.warn('shown', { code: 7 });
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? '')).toEqual({
      time: '2026-11-18T03:00:00.000Z',
      level: 'warn',
      message: 'shown',
      code: 7,
    });
  });
});

describe('SERVER_INFO', () => {
  it('matches the package.json version', () => {
    const raw: unknown = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    );
    expect(raw).toMatchObject({ version: SERVER_INFO.version });
  });
});
