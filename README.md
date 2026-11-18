# AI Workspace (working name: `ai-workspace`)

An open-source, AI-native persistent workspace. You work with ChatGPT (and later Claude Code);
plans, pages, tasks, metrics, and decisions stay in a durable workspace that the server owns.

> **Status: milestone M0 (scaffold).** The server exposes two read-only diagnostic MCP tools.
> It stores no data and has no authentication. Run it on localhost only.
> See [`Plan.md`](Plan.md) for the full plan and [`PROGRESS.md`](PROGRESS.md) for verified status.

## What works now

| Part                              | State                                                         |
| --------------------------------- | ------------------------------------------------------------- |
| `apps/mcp-server`                 | Streamable HTTP MCP server at `/mcp`, health check `/healthz` |
| `packages/contracts`              | Zod schemas for tool input and output                         |
| Tool `workspace_ping`             | Returns server time (UTC) and an optional echo. Read-only.    |
| Tool `workspace_get_capabilities` | Returns server identity, modes, and the tool list. Read-only. |

Not yet built (later milestones): database, projects, tasks, pages, ChatGPT widget, auth.

## Requirements

- Node.js 22.12 or later (CI tests 22, 24, and 26; 26 is the Active LTS line).
- pnpm 10.34.9. With Corepack: `corepack enable`. Without Corepack: `npm i -g pnpm@10.34.9`.

## Quick start

```sh
pnpm install
pnpm run check        # format, lint, typecheck, test, build
pnpm run dev:mcp      # http://127.0.0.1:8787/mcp (reloads on change)
```

Production-style start from the build output:

```sh
pnpm run build
pnpm run start:mcp
```

Configuration comes from environment variables. See [`.env.example`](.env.example).
The server does not read `.env` files itself; export the variables or use your shell tool.

## Test with MCP Inspector

Start the server, then in a second terminal:

```sh
# Web UI: select "Streamable HTTP" and enter http://127.0.0.1:8787/mcp
pnpm run inspect

# CLI
pnpm dlx @modelcontextprotocol/inspector@2.15.0 --cli --transport http \
  --server-url http://127.0.0.1:8787/mcp --method tools/list
pnpm dlx @modelcontextprotocol/inspector@2.15.0 --cli --transport http \
  --server-url http://127.0.0.1:8787/mcp --method tools/call \
  --tool-name workspace_ping --tool-arg message=hello
```

## Repository layout

```text
apps/mcp-server/     HTTP transport, MCP wiring, tool adapters
  src/config/        Environment validation (loopback-only in M0)
  src/http/          Express app (Host/Origin checks, body limit) and listener
  src/server/        Per-request McpServer factory
  src/tools/         Tool definitions; pure handlers + one registration adapter
packages/contracts/  Zod schemas and DTOs shared by server and future clients
docs/                Architecture, tool contracts, ADRs
```

More packages (`domain`, `application`, `persistence`, `ui`) come with the milestones that
need them. See [`docs/architecture.md`](docs/architecture.md).

## Scripts

| Script               | Does                                       |
| -------------------- | ------------------------------------------ |
| `pnpm run check`     | All CI checks in CI order                  |
| `pnpm run lint`      | ESLint (type-aware, zero warnings allowed) |
| `pnpm run typecheck` | `tsc` in strict mode, all packages         |
| `pnpm test`          | Vitest: unit + MCP protocol tests          |
| `pnpm run format`    | Prettier write                             |
| `pnpm run dev:mcp`   | Dev server with reload (TypeScript source) |
| `pnpm run inspect`   | MCP Inspector web UI                       |

## License

[Apache-2.0](LICENSE) (proposed; see `PROGRESS.md` for open decisions).
