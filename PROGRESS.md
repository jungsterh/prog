# PROGRESS

Living record of completed tasks, decisions, blockers, and test evidence.
Rule (Plan.md section 0): a task is checked only after its acceptance criteria pass.

## Current status

**Milestone M0 — implementation done; acceptance is partial (2 of 4 criteria need owner action).**

| M0 acceptance criterion           | Result     | Evidence                                                     |
| --------------------------------- | ---------- | ------------------------------------------------------------ |
| Clean install                     | ✅ Pass    | Fresh `git clone` + `pnpm install --frozen-lockfile` (below) |
| CI green                          | ⏳ Blocked | Workflow exists; no GitHub repository yet, so no CI run      |
| MCP tool callable locally         | ✅ Pass    | MCP Inspector CLI 2.15.0 + automated protocol tests          |
| Architecture README reflects code | ✅ Pass    | `README.md`, `docs/architecture.md` describe only built code |

Do not start M1 until the blocked items are resolved or the owner accepts them as deferred.

## M0 task list

| Task (Plan.md §10 M0)                                                                                             | State      | Notes                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirm repo name, license, contributor rules                                                                     | ⏳ Owner   | Proposed defaults in use: name `ai-workspace`, Apache-2.0, `CONTRIBUTING.md`. Needs owner confirmation and a GitHub name availability check.      |
| Create GitHub monorepo; add PLAN, PROGRESS, README, LICENSE, SECURITY, CONTRIBUTING, `.gitignore`, `.env.example` | ⏳ Partial | All files exist in a local git repository (`main`, 5 commits). **No GitHub repository was created**: no GitHub account is linked to this session. |
| Initialize pnpm workspace, strict TypeScript, lint/format, Vitest, GitHub Actions                                 | ✅ Done    | `.github/workflows/ci.yml` written; first GitHub run pending (see blockers).                                                                      |
| Short ADR for key decisions                                                                                       | ✅ Done    | `docs/adr/0001-core-architecture-decisions.md`, `docs/adr/0002-toolchain-and-sdk-versions.md`                                                     |
| Minimal MCP `ping` / read-only `get_capabilities` with current official SDK                                       | ✅ Done    | `workspace_ping`, `workspace_get_capabilities` on MCP SDK v2.4.0                                                                                  |
| Start local MCP server and verify transport in MCP Inspector                                                      | ✅ Done    | Inspector CLI (not the web UI) against the built server; output below                                                                             |

## Decisions (M0)

| #   | Decision                                                                                  | Why                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Repository root is this folder (`prog`); package name `ai-workspace`                      | Owner said this folder is the project home. Name is a placeholder (Plan.md §13).                                                     |
| D2  | Kept the plan file as `Plan.md` (Plan.md calls it `PLAN.md`)                              | The owner created it with this name. Renaming is owner's choice; Windows file names are case-insensitive.                            |
| D3  | MCP SDK **v2** (`@modelcontextprotocol/server` 2.4.0), not v1 `@modelcontextprotocol/sdk` | v2 is the stable line; `@modelcontextprotocol/ext-apps` 2.x (M2 widget) requires v2. OpenAI quickstart still shows v1. See ADR 0002. |
| D4  | Stateless serving through `createMcpHandler`                                              | Serves 2026-07-28 clients and 2025-era clients (stateless fallback). Both verified by tests.                                         |
| D5  | TypeScript 6.0.3, not 7.0.2                                                               | typescript-eslint 8.73 requires `typescript <6.1`.                                                                                   |
| D6  | pnpm 10.34.9                                                                              | Latest 10.x, verified here. pnpm 12 not tried.                                                                                       |
| D7  | Tool names use the `workspace_` prefix                                                    | Matches Plan.md §6 naming; avoids confusion with the MCP protocol `ping` method.                                                     |
| D8  | Server refuses non-loopback `HOST`                                                        | No authentication in M0 (Plan.md §8). Extra Host names (tunnel) go in `MCP_ALLOWED_HOSTS`.                                           |
| D9  | Only `contracts` and `mcp-server` packages                                                | Plan.md §3: one package per actual concern. Others come with M1–M2.                                                                  |
| D10 | `runTool` re-validates input with the contract schema                                     | Typed input without casts; second check at the trust boundary.                                                                       |

## Test evidence (2026-11-17, cloud workspace, Linux x64)

Environment: Node.js v22.23.5, pnpm 10.34.9. Node 26 could not be installed in this
workspace, so 24 and 26 are covered only by the CI matrix (not run yet).

### Clean install and CI steps (fresh `git clone` of the local repository)

```text
$ pnpm install --frozen-lockfile   exit=0
$ pnpm run format:check            exit=0  All matched files use Prettier code style!
$ pnpm run lint                    exit=0  (zero warnings allowed)
$ pnpm run typecheck               exit=0
$ pnpm run test                    exit=0  Test Files 5 passed (5), Tests 39 passed (39)
$ pnpm run build                   exit=0
```

### Test checks

- Mutation check: setting `destructiveHint: true` and adding `evil.example` to allowed hosts
  made 2 protocol tests fail as expected; restoring the code made all 39 pass.
- Protocol tests use the real SDK v2 client against the real HTTP server (no mocks):
  tool list and annotations, both tool calls, input bound rejection, unknown tool,
  legacy 2025-06-18 `initialize` + `tools/list` without a session, `/healthz`,
  Host header 403, Origin header 403, body over 64 KB 413.

### MCP Inspector (CLI, `@modelcontextprotocol/inspector@2.15.0`) against `node apps/mcp-server/dist/main.js`

```text
$ inspector --cli --transport http --server-url http://127.0.0.1:8787/mcp --method tools/list
→ 2 tools: workspace_ping, workspace_get_capabilities; both readOnlyHint=true; exit=0
$ ... --method tools/call --tool-name workspace_ping --tool-arg message=hello
→ structuredContent {"status":"ok","serverTime":"2026-11-18T03:18:24.843Z","echo":"hello"}; exit=0
$ ... --method tools/call --tool-name workspace_get_capabilities
→ server ai-workspace-mcp 0.0.0, streamable-http stateless, persistence none,
  authentication none-local-only, 2 tools; exit=0
$ ... --method tools/list --strict
→ no schema portability problems; exit=0
```

### Second machine (owner's device, Linux VM, Node.js v22.23.4, pnpm 10.34.9)

Scratch copy of the delivered folder, history restored from `m0-history.bundle`:

```text
$ pnpm install --frozen-lockfile   exit=0
$ pnpm run check                   exit=0  (format, lint, typecheck, 39/39 tests, build)
```

### Runtime checks

- `GET /healthz` → `{"status":"ok"}`.
- SIGTERM → log `mcp_server_stopping`, clean exit.
- `HOST=0.0.0.0` → startup refused, exit 1, message names the loopback rule.
- `pnpm dev:mcp` (tsx, TypeScript source) answers `initialize`.

## Blockers and open decisions (owner action needed)

0. **Restore git history and 2 protected files.** Remote tools may not write `.git/`,
   `.github/workflows/`, or `.npmrc` on the owner's device. They are in
   `m0-history.bundle`. In the `prog` folder run:
   `git init -b main`, `git fetch ./m0-history.bundle main`, `git reset --mixed FETCH_HEAD`,
   `git checkout -- .github/workflows/ci.yml .npmrc`. Then delete `m0-history.bundle`.

1. **GitHub repository.** Create it (name and organization: Plan.md §13), push `main`, and
   confirm that the CI workflow is green on Node 22, 24, and 26. This completes the
   "CI green" criterion.
2. **Confirm** repository name, Apache-2.0 license, and contributor rules
   (`CONTRIBUTING.md`: Conventional Commits, inbound = outbound licensing; no CLA or DCO).
3. **Security contact** for `SECURITY.md` (not set).
4. Optional: MCP Inspector **web UI** check (`pnpm run inspect`); only the CLI was used here.
5. Optional: rename `Plan.md` to `PLAN.md` to match the plan's own references.

## Next (after M0 sign-off)

M1 — durable project/task vertical slice (Plan.md §10). Re-check SDK and tool versions first.

## Session log

- 2026-11-17 — M0 scaffold, MCP server, tests, docs, CI workflow. Local commits on `main`.
