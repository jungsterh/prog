import type { Clock, ServerInfo } from '../server-info.js';
import { createGetCapabilitiesTool } from './get-capabilities.js';
import { createPingTool } from './ping.js';
import type { ToolRegistration } from './tool-definition.js';

export interface ToolCatalogDeps {
  readonly clock: Clock;
  readonly serverInfo: ServerInfo;
}

/** The single list of tools that the server exposes. */
export function createToolCatalog(deps: ToolCatalogDeps): readonly ToolRegistration[] {
  const catalog: readonly ToolRegistration[] = Object.freeze([
    createPingTool(deps.clock),
    // Lazy: reads the catalog at call time, so it includes itself.
    createGetCapabilitiesTool(deps.serverInfo, () => catalog.map((tool) => tool.summary)),
  ]);
  return catalog;
}
