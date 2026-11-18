import { PingInputSchema, PingOutputSchema } from '@ai-workspace/contracts';
import type { PingInput, PingOutput } from '@ai-workspace/contracts';

import type { Clock } from '../server-info.js';
import { defineTool, READ_ONLY_ANNOTATIONS } from './tool-definition.js';
import type { ToolRegistration } from './tool-definition.js';

export const PING_TOOL_NAME = 'workspace_ping';

/** Pure: the caller supplies the current time. */
export function ping(input: PingInput, now: Date): PingOutput {
  const base = { status: 'ok' as const, serverTime: now.toISOString() };
  return input.message === undefined ? base : { ...base, echo: input.message };
}

export function createPingTool(clock: Clock): ToolRegistration {
  return defineTool({
    name: PING_TOOL_NAME,
    title: 'Ping workspace server',
    description:
      'Checks that the workspace server is reachable. Returns the server time (UTC) ' +
      'and echoes an optional message. Reads nothing and changes nothing.',
    inputSchema: PingInputSchema,
    outputSchema: PingOutputSchema,
    annotations: READ_ONLY_ANNOTATIONS,
    handler: (input) => ping(input, clock()),
  });
}
