import { CapabilitiesOutputSchema, GetCapabilitiesInputSchema } from '@ai-workspace/contracts';
import type { CapabilitiesOutput, ToolSummary } from '@ai-workspace/contracts';

import type { ServerInfo } from '../server-info.js';
import { defineTool, READ_ONLY_ANNOTATIONS } from './tool-definition.js';
import type { ToolRegistration } from './tool-definition.js';

export const GET_CAPABILITIES_TOOL_NAME = 'workspace_get_capabilities';

/**
 * Pure: describes what this server can do now. The tool list comes from the
 * registered catalog, so the answer cannot drift from the real tool set.
 */
export function describeCapabilities(
  serverInfo: ServerInfo,
  tools: readonly ToolSummary[],
): CapabilitiesOutput {
  return {
    server: { name: serverInfo.name, version: serverInfo.version },
    transport: { kind: 'streamable-http', stateless: true },
    persistence: 'none',
    authentication: 'none-local-only',
    tools: tools.map((tool) => ({ ...tool })),
  };
}

export function createGetCapabilitiesTool(
  serverInfo: ServerInfo,
  listTools: () => readonly ToolSummary[],
): ToolRegistration {
  return defineTool({
    name: GET_CAPABILITIES_TOOL_NAME,
    title: 'Get workspace server capabilities',
    description:
      'Returns the server name and version, transport, persistence and authentication ' +
      'mode, and the list of available tools. Reads nothing and changes nothing.',
    inputSchema: GetCapabilitiesInputSchema,
    outputSchema: CapabilitiesOutputSchema,
    annotations: READ_ONLY_ANNOTATIONS,
    handler: () => describeCapabilities(serverInfo, listTools()),
  });
}
