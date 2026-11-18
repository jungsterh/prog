/** Server identity reported over MCP. Keep `version` equal to package.json (checked by a test). */
export const SERVER_INFO = Object.freeze({
  name: 'ai-workspace-mcp',
  version: '0.0.0',
});

export type ServerInfo = Readonly<{ name: string; version: string }>;

/** Clock port: the server, not the model, is the authority for timestamps. */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();
