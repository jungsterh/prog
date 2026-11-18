import { describe, expect, it } from 'vitest';

import {
  ConfigError,
  LOOPBACK_HOSTNAMES,
  loadConfig,
  parseHostnameList,
} from '../src/config/config.js';

describe('loadConfig', () => {
  it('uses safe defaults: loopback bind, port 8787, info logs', () => {
    const config = loadConfig({});
    expect(config).toEqual({
      host: '127.0.0.1',
      port: 8787,
      logLevel: 'info',
      allowedHosts: LOOPBACK_HOSTNAMES,
    });
  });

  it('parses PORT and LOG_LEVEL', () => {
    const config = loadConfig({ PORT: '9000', LOG_LEVEL: 'debug' });
    expect(config.port).toBe(9000);
    expect(config.logLevel).toBe('debug');
  });

  it('refuses a non-loopback bind address while there is no authentication', () => {
    expect(() => loadConfig({ HOST: '0.0.0.0' })).toThrow(ConfigError);
  });

  it.each(['-1', '65536', 'abc', '1.5'])('rejects invalid PORT %s', (port) => {
    expect(() => loadConfig({ PORT: port })).toThrow(ConfigError);
  });

  it('rejects an unknown LOG_LEVEL', () => {
    expect(() => loadConfig({ LOG_LEVEL: 'verbose' })).toThrow(ConfigError);
  });

  it('adds extra allowed hosts without duplicates', () => {
    const config = loadConfig({ MCP_ALLOWED_HOSTS: 'Dev.Tunnel.example, localhost,,' });
    expect(config.allowedHosts).toEqual([...LOOPBACK_HOSTNAMES, 'dev.tunnel.example']);
  });

  it('returns a frozen object', () => {
    expect(Object.isFrozen(loadConfig({}))).toBe(true);
  });
});

describe('parseHostnameList', () => {
  it('returns an empty list for undefined or blank input', () => {
    expect(parseHostnameList(undefined)).toEqual([]);
    expect(parseHostnameList(' , ')).toEqual([]);
  });
});
