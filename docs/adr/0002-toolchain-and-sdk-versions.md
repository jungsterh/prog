# ADR 0002: Toolchain and SDK versions (M0)

- Status: Accepted (M0)
- Date: 2026-11-17

## Context

Plan.md rule 11: check current official SDK documentation and pin a compatible set.
Versions were checked against the npm registry and official docs on 2026-11-17.

## Decisions

| Concern         | Choice                                                                                          | Reason                                                                                                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MCP SDK         | v2: `@modelcontextprotocol/server` 2.4.0, `node` 2.1.2, `express` 2.0.2, `client` 2.4.0 (tests) | v2 is the stable line (2026-07-28 spec). `@modelcontextprotocol/ext-apps` 2.x (needed in M2 for the ChatGPT widget) requires SDK v2. The OpenAI quickstart still shows v1 (`@modelcontextprotocol/sdk`); v2 replaces it. |
| HTTP            | Express 5.3.0 via `createMcpExpressApp`                                                         | Built-in Host/Origin validation and body limit; the same package has bearer-auth and protected-resource-metadata helpers for M5.                                                                                         |
| Validation      | Zod 4.6.7                                                                                       | Required by SDK v2 (`^4.2`) and implements Standard Schema.                                                                                                                                                              |
| TypeScript      | 6.0.3 (not 7.0.2)                                                                               | `typescript-eslint` 8.73 supports `typescript <6.1`. TypeScript 7 support needs a later typescript-eslint.                                                                                                               |
| Lint / format   | ESLint 10.15, typescript-eslint 8.73 (strictTypeChecked), Prettier 3.10                         |                                                                                                                                                                                                                          |
| Tests           | Vitest 5.1.0                                                                                    |                                                                                                                                                                                                                          |
| Package manager | pnpm 10.34.9 (`packageManager` field)                                                           | Latest 10.x; pnpm 12 is newer but not yet tried here. Upgrade is a one-line change.                                                                                                                                      |
| Node.js         | `>=22.12.0`; `.nvmrc` = 26; CI matrix 22, 24, 26                                                | 26 is Active LTS since 2026-10-28. 22 and 24 are Maintenance LTS.                                                                                                                                                        |
| Dev runner      | tsx 4.23 with custom condition `@ai-workspace/source`                                           | Runs workspace packages from TypeScript source without a prior build.                                                                                                                                                    |
| Inspector       | `@modelcontextprotocol/inspector` 2.15.0 via `pnpm dlx`                                         | Pinned version without adding it to the install.                                                                                                                                                                         |
| CI actions      | Pinned to commit SHAs (checkout v7.0.1, setup-node v7.1.0, pnpm/action-setup v6.1.1)            | Supply-chain hygiene.                                                                                                                                                                                                    |

## Consequences

- Re-check these versions at the start of each milestone.
- When typescript-eslint supports TypeScript 7, evaluate the upgrade in its own change.
