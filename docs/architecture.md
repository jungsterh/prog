# Architecture (as built in M0)

This file describes the code that exists now. The target design is in `Plan.md` section 4.

## Request flow

```text
MCP client (Inspector, ChatGPT later)
   │  HTTP POST /mcp
   ▼
createMcpExpressApp            Host/Origin checks (DNS rebinding), JSON body limit 64 KB
   ▼
toNodeHandler(createMcpHandler(factory))
   │  classifies the request: 2026-07-28 envelope → modern path,
   │  otherwise → stateless 2025-era fallback
   ▼
factory() → new McpServer per request    (src/server/create-mcp-server.ts)
   ▼
ToolRegistration.register → runTool      (src/tools/tool-definition.ts)
   │  re-validates input with the contract schema, runs the pure handler,
   │  maps unexpected errors to a generic error result
   ▼
pure handler: ping(input, now) / describeCapabilities(info, tools)
```

## Modules

| Module                                 | Responsibility                                              |
| -------------------------------------- | ----------------------------------------------------------- |
| `packages/contracts/src/system.ts`     | Zod schemas and types for M0 tool input/output              |
| `apps/mcp-server/src/config/config.ts` | Validate env vars; refuse non-loopback bind (no auth in M0) |
| `apps/mcp-server/src/logger.ts`        | `Logger` port and JSON-lines implementation (stderr)        |
| `apps/mcp-server/src/server-info.ts`   | Server identity and `Clock` port                            |
| `apps/mcp-server/src/tools/*`          | Tool specs, pure handlers, catalog (single tool list)       |
| `apps/mcp-server/src/server/*`         | Per-request `McpServer` factory                             |
| `apps/mcp-server/src/http/*`           | Express transport adapter and listener                      |
| `apps/mcp-server/src/main.ts`          | Composition root; the only module that reads `process.env`  |

## Design notes

- **Adapter boundary.** Handlers do not import MCP types. `defineTool` is the one place
  that adapts a transport-neutral `ToolSpec` to `McpServer.registerTool`.
- **Single source of truth for the tool list.** `workspace_get_capabilities` reads the
  catalog at call time, so it cannot list a tool that does not exist.
- **Server owns time.** `workspace_ping` takes the time from an injected `Clock`.
- **Stateless.** No MCP sessions. Each request builds a fresh server from the immutable
  catalog. This also gives isolation between requests.
- **Errors.** Invalid input and handler failures return `isError: true` with fixed text.
  Logs hold the tool name and error class only.

## Tests

| File                                           | Level                                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `packages/contracts/test/system.test.ts`       | Schema bounds, strictness, formats                                                 |
| `apps/mcp-server/test/config.test.ts`          | Env validation, loopback guard                                                     |
| `apps/mcp-server/test/tools.test.ts`           | Pure handlers, catalog, error sanitization                                         |
| `apps/mcp-server/test/logger-and-info.test.ts` | Log levels, version consistency                                                    |
| `apps/mcp-server/test/http.protocol.test.ts`   | Real SDK client ↔ real HTTP server; legacy client; Host/Origin/body-size rejection |
