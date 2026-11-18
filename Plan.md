# PLAN.md — Open-source AI-native Workspace

> Status: Proposed implementation plan (not an implementation)  
> Updated: 2026-11-17  
> Primary client: ChatGPT Apps SDK  
> Second client: Claude Code through MCP  
> Primary language: TypeScript  
> Audience: Codex, coding agents, maintainers, contributors

## 0. Agent instructions (read before editing code)

This is the source-of-truth implementation plan for the **workspace software project**, not the runtime source of truth for users' documents. Read it before beginning each coding session. Maintain `PROGRESS.md` with completed tasks, decisions, blockers, and test evidence. Check an item here only after its acceptance criteria pass. Do not claim code, hosting, GitHub repositories, or deployed services exist until actually created and verified.

**Engineering rules**

1. Use SOLID, cohesive OOP, small modules, and selective Gang of Four patterns **when they solve a real problem**. Prefer composition over inheritance. Avoid pattern-for-pattern's-sake designs.
2. Aim for functions of roughly 10–30 lines and classes with one responsibility. Exceptions are acceptable when splitting makes code harder to read. Separate validation, database access, policy checks, and transport serialization.
3. Use immutable data, pure transformations, explicit inputs/outputs, discriminated unions, and functional collection operations where these improve clarity. Keep I/O at the edges.
4. Strong typing is mandatory. TypeScript `strict` mode, runtime validation at trust boundaries, no unsafe casts to bypass errors.
5. Write tests for important behavior before or with each feature. Use small increments and meaningful commits. Do not implement an entire milestone without running tests.
6. **Do not use an LLM as the authoritative source for metrics, identity, authorization, timestamps, or task completion.** LLMs can propose changes; deterministic services validate and apply them.
7. Preserve user-authored formatting and data. Changes must be targeted, versioned, auditable, and reversible where practical.
8. Do not build an agent loop or autonomous scheduling service in MVP. ChatGPT is the initial conversational agent; this application supplies tools and durable state.
9. Keep independent boundaries for business domain, application services, persistence, and client adapters. Never import OpenAI SDK types into domain objects.
10. Never store user secrets in the repository, logs, or model-visible responses. Use environment variables and hosted secrets.
11. Re-check current official SDK documentation and use a compatible, pinned dependency set before scaffolding. APIs change.
12. Update the plan and ADRs when requirements change. Do not silently widen scope.

### Coding agent's session protocol

- **Before**: Read `PLAN.md`, `PROGRESS.md`, applicable ADRs, and existing code. Choose one unchecked, actionable task.
- **During**: Implement the smallest vertical change; add/update tests and docs; record design tradeoffs.
- **After**: Run lint, typecheck, unit tests, and relevant integration tests. Summarize files changed and results. Update `PROGRESS.md`; check a task only when verified.
- If a platform capability is uncertain, create a small spike and record the observed behavior. Avoid inventing SDK methods.

## 1. Product vision

Build an open-source, **AI-native persistent workspace**. Users work with ChatGPT while plans, notebook pages, conversations, tasks, metrics, and decisions remain organized in a durable workspace.

**User promise:** “Turn conversations into organized work that you can return to, measure, and continue.”

Primary initial use case: study and technical project planning. Later community modules can support workout tracking, work logs, project forecasts, and other domain-specific workflows.

### Design principles

- The **database is authoritative** for all project state; an AI response is never the database.
- Conversations are inputs and references, **not** the sole long-term memory.
- A project can contain nested pages/chapters, tasks, discussions, and attachments.
- Stable document structure: AI modifies particular blocks, never silently regenerates an entire page.
- Dashboard data comes from typed domain records, not text scraped from chat.
- Users can manually edit content and review AI-proposed changes.
- Provider-neutral core; ChatGPT is only the first client.
- User-controlled export and self-hosting are first-class goals.

### MVP user stories

1. A user connects the ChatGPT app and creates a workspace/project.
2. The user requests a study plan; ChatGPT invokes tools to create a plan with chapters and checklist tasks.
3. The app displays the persistent plan/dashboard as a ChatGPT widget; users can inspect chapters and toggle tasks.
4. The user returns in a **new supported app interaction**, opens the same project, and sees saved state.
5. A discussion can be deliberately saved to a chapter as a **summary and/or user-selected excerpt**; the app does not assume it can read every prior ChatGPT message.
6. The user records study time; metrics update from stored session records.
7. The AI suggests changes to a task or a chapter and the server applies them only with proper authority and revision checks.
8. The user can export the project as JSON/Markdown.

### Non-goals for v0.1

Full Notion parity; arbitrary public plugin execution; real-time multiplayer editing; autonomous ticket creation; Google/Claude native chat-history import; proprietary analytics; automated exercise prescriptions; predictive ML forecasting; global search across all ChatGPT conversations; GitHub/Jira/Linear integrations; native IDE extensions; commercial billing; complete page-database formulas.

## 2. Technical assumptions and platform boundaries

### Initial OpenAI integration

- Use the **ChatGPT Apps SDK / MCP Apps UI bridge** with a TypeScript MCP server and an interactive web widget.
- Serve MCP over an HTTPS-accessible endpoint such as `/mcp` for ChatGPT development and hosting. For local development, use a secure tunnel where required.
- Implement core functionality via standards-based MCP tools and resources. Add ChatGPT-specific UI hooks only in the `apps/chatgpt` adapter.
- Store durable state in PostgreSQL, not ephemeral widget state or model context.
- Test in ChatGPT Developer Mode where available; follow current account/client eligibility and publisher guidelines. Do **not** assume that the ChatGPT desktop app supports every widget flow identically to ChatGPT web.
- **Codex is a coding/testing assistant**, not proof that a ChatGPT Apps SDK widget has rendered successfully. Use protocol tests and direct ChatGPT testing for that.
- Do not assume access to whole ChatGPT histories, arbitrary threads, sidebar, native Projects, or other ChatGPT apps' private data.
- Do not assume user ChatGPT subscriptions can be used to pay for inference in a separate custom backend. MVP should avoid separate model calls; track hosting costs separately.

### Second integration: Claude Code

- Expose the **same server-side MCP tools** to Claude Code through an authenticated remote MCP endpoint, after v0.1 is stable.
- Add provider-specific setup instructions and optional helper prompts/skills, not a rewritten business backend.
- Claude Code can update shared plans, tasks, and work logs; its console cannot automatically display the ChatGPT-specific embedded widget. Offer a separate read-only web dashboard or simple text/tool responses.
- Do not expect native Claude conversations to transfer between clients; save explicit project summaries and artifacts instead.

### Canonical references (verify at implementation time)

- OpenAI Apps/MCP quickstart: https://developers.openai.com/plugins/build/app-quickstart
- Official examples: https://github.com/openai/openai-apps-sdk-examples
- OpenAI app building overview: https://developers.openai.com/apps-sdk
- Developer mode / custom MCP: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
- Claude Code MCP: https://code.claude.com/docs/en/mcp
- MCP protocol: https://modelcontextprotocol.io/

## 3. Repository strategy

**Start with one public monorepo.** Proposed working repository name: `ai-workspace` (placeholder; select/check availability when creating GitHub repository). Organization name and production domain are **TBD**. Do not claim any new repo already exists.

Use `pnpm` workspaces, TypeScript, one package boundary per actual concern. Add Turborepo only if build orchestration becomes painful; a plain pnpm workspace is sufficient initially.

```text
ai-workspace/
├── PLAN.md
├── PROGRESS.md
├── README.md
├── CONTRIBUTING.md
├── LICENSE
├── SECURITY.md
├── .github/workflows/ci.yml
├── docs/
│   ├── architecture.md
│   ├── operations.md
│   ├── tool-contracts.md
│   ├── deployment.md
│   ├── adr/
│   └── screenshots/
├── apps/
│   ├── chatgpt/                 # Apps SDK widget and host-specific bridge
│   ├── mcp-server/              # HTTP MCP transport, tool definitions, wiring
│   └── web/                     # Optional standalone dashboard (later)
├── packages/
│   ├── domain/                  # Types, invariants, pure rules
│   ├── application/             # Use cases, ports, transaction boundaries
│   ├── persistence/             # PostgreSQL repositories and migrations
│   ├── ui/                      # Reusable React view components
│   ├── contracts/               # Zod schemas / shared DTOs
│   └── module-sdk/              # Later: extension manifest and hooks
├── modules/
│   └── study/                   # First example, keep minimal initially
├── tests/
│   ├── e2e/
│   └── fixtures/
├── docker-compose.yml          # Local Postgres only initially
├── pnpm-workspace.yaml
└── package.json
```

**Do not create separate repositories for every module yet.** After the extension API stabilizes, third-party modules can live in separate repos. Provide a minimal sample module and template when ready.

Recommended base toolchain: TypeScript strict, Node.js current LTS, React + Vite for widget bundle, Zod at boundaries, PostgreSQL/Supabase, Vitest, ESLint, Prettier, Playwright for appropriate browser smoke tests. Choose a single lightweight SQL layer (e.g., Drizzle) and migration workflow; do not add both Prisma and Drizzle. The widget is bundled and served as an MCP UI resource following current Apps SDK conventions.

## 4. System design

```text
ChatGPT conversation ─┐
                      │ MCP calls + widget resources
Claude Code (phase 2) ├──────▶ MCP HTTP server / adapter ──────▶ Application services
                      │                 │                             │
Standalone web (later)┘                 │                         Domain rules
                                        │                             │
                                 AuthN/AuthZ middleware         Repository ports
                                                                      │
                                                             PostgreSQL adapter
                                                                      │
                                                         Projects / pages / tasks /
                                                         sessions / links / events
```

- **Transport**: MCP HTTP server translates inputs into application commands, validates envelopes and errors, and returns structured results. No business decisions here.
- **Application**: `CreateProject`, `GetProject`, `AddPage`, `UpdateBlock`, `CreateTask`, `UpdateTask`, `RecordSession`, `LinkDiscussion`, `GetMetrics`, `ExportProject` use cases; consistent ownership checks and transactional writes.
- **Domain**: entities/value objects and invariants, independent of UI/database/provider.
- **Persistence**: SQL-backed repositories; migrations; indexes and transaction management.
- **UI**: notebook tree + page view + checklist + dashboard, using a client adapter for MCP invocation.
- **Analytics**: deterministic SQL aggregates / pure functions. No extra metrics streaming stack initially.

### Pragmatic SOLID / GoF map

| Requirement | Pattern/principle | Implementation guidance |
|---|---|---|
| Swap Postgres or test storage | Repository + DIP | Define interfaces in application layer; Postgres implements them |
| One entry point per action | Command / application use case | Small commands and handlers; avoid a giant `WorkspaceService` |
| Multiple UI transports | Adapter | ChatGPT bridge vs later standalone web/Claude adapter |
| Context-dependent permission | Policy / Strategy only if needed | Start with simple `AuthorizationPolicy` functions; extract strategies when they diverge |
| Atomic related writes | Unit of Work where warranted | Use one DB transaction to update blocks and event records |
| Analytics projections | Pure functions / queries | No LLM-based arithmetic; compute from persisted events |
| Change notifications | Observer, later | Only add for real consumers; no event bus in MVP |
| Module extensibility | Plugin/Factory, later | Stable typed module manifest and verified registration; defer runtime plugins |

Use domain exceptions mapped to sanitized MCP errors. Avoid overabstracted factories, DI containers, CQRS/event-sourcing frameworks, microservices, and generic workflow engines in v0.1.

## 5. Persistence design (first pass)

Use UUID identifiers, UTC timestamps, `created_at`/`updated_at`, and a monotonic integer `version` where edits require concurrency control. Include `owner_id` and/or `workspace_id` scopes. Explicit tenant authorization is required on **every** read/write query; never trust a user-supplied ID alone.

| Table | Key fields | Purpose |
|---|---|---|
| `users` | `id`, `external_identity`, timestamps | Map authenticated identity to internal user |
| `workspaces` | `id`, `owner_id`, `name` | Security and organizational boundary |
| `projects` | `id`, `workspace_id`, `title`, `description`, `version` | Parent container |
| `pages` | `id`, `project_id`, `parent_page_id`, `title`, `sort_key`, `version` | Nested chapters |
| `blocks` | `id`, `page_id`, `parent_block_id?`, `kind`, `data_json`, `sort_key`, `version` | Stable document contents |
| `tasks` | `id`, `project_id`, `page_id?`, `title`, `status`, `estimate_minutes?`, `version` | Progress tracking |
| `study_sessions` | `id`, `project_id`, `task_id?`, `duration_minutes`, `occurred_at`, `source` | Actual time data |
| `discussions` | `id`, `project_id`, `title`, `summary`, `source_client`, `external_ref?` | Explicitly saved summaries/metadata |
| `discussion_pages` | `discussion_id`, `page_id` | Many-to-many topic association |
| `activity_events` | `id`, `workspace_id`, `actor_id`, `action`, `entity_id`, `payload`, `created_at` | Audit/activity feed |
| `change_proposals` | `id`, `project_id`, `actor_id`, `proposal_json`, `status`, `created_at` | Reviewable AI suggestions (when needed) |

The `blocks.data_json` field must be validated by a **discriminated union schema per block type**. Never permit unvalidated arbitrary HTML or script. Start with heading, paragraph, checklist, and chart-reference blocks; add rich text later with a tested editor framework (BlockNote or Tiptap evaluation). Store chart *definitions* or metric query/view IDs, not rendered image binaries as authoritative state.

**Ordering**: use stable sort keys with defined insertion/rebalance behavior. **Edits**: `UPDATE ... WHERE id = ? AND version = ?` and increment version; return conflict on stale edits. **Deletion**: begin with confirmed soft-delete or a controlled transactional delete and log it. **Undo**: defer full arbitrary undo; keep sufficient history/restore snapshots for MVP edits.

### Metric definitions

- `topic_count`: count of active tasks/topics.
- `completed_count`: count with `status=completed`.
- `completion_rate`: completed / total (define empty denominator behavior explicitly).
- `planned_minutes`: sum of estimates.
- `recorded_minutes`: sum of validated study session durations.
- `remaining_estimated_minutes`: sum of estimates for unfinished tasks, **not** necessarily planned minus actual.
- `weekly_activity_minutes`: sessions grouped by user-local reporting week, with timezone stored or supplied consistently.
- **Do not label time in a conversation as study time without a session log/user confirmation.**

## 6. MCP tool surface (v0.1)

Prefer a small, typed, discoverable tool set. All mutating tools require authentication, authorization, bounded input, idempotency strategy where applicable, and clear result/error types. Protect destructive/high-impact changes with user confirmation or preview/commit flow. Only mark tool annotations `readOnlyHint` when truly read-only.

| Tool | Purpose | Write? |
|---|---|---|
| `workspace_list_projects` | List projects visible to caller | No |
| `workspace_create_project` | Create initial project | Yes |
| `workspace_get_project` | Return project tree, tasks, basic metrics | No |
| `workspace_create_page` | Create a child chapter/page | Yes |
| `workspace_get_page` | Read page and blocks | No |
| `workspace_update_block` | Edit one block with `expectedVersion` | Yes |
| `workspace_create_task` | Add a trackable task | Yes |
| `workspace_update_task` | Update task with version check | Yes |
| `workspace_record_session` | Record verified/confirmed study minutes | Yes |
| `workspace_link_discussion` | Save explicit summary/ref and link to chapters | Yes |
| `workspace_get_metrics` | Deterministic aggregates | No |
| `workspace_export_project` | Export authorized project data | No |

Limit initial exposed tools to the few needed by the first scenario, then expand only after integration tests. A tool result must return stable IDs and normalized state; it must not depend on the LLM remembering names.

### Example validated command shapes (illustrative, not SDK code)

```ts
interface UpdateTaskCommand {
  taskId: string;
  expectedVersion: number;
  status: 'todo' | 'in_progress' | 'completed';
}

interface RecordStudySessionCommand {
  projectId: string;
  taskId?: string;
  durationMinutes: number; // positive, bounded and user-confirmed
  occurredAt: string;       // ISO 8601; server checks range
  idempotencyKey: string;
}
```

## 7. User interface (v0.1)

**MVP layout**: project selector, navigation tree, current page, checklist, dashboard summary, related-discussion links. Design for ChatGPT's embedded widget first; use full-screen where supported, with a compact inline fallback.

**UI components**

- `ProjectSwitcher`: choose one saved project.
- `ProjectTree`: nested chapters with keyboard navigation; manual reorder later.
- `PageView`: render validated blocks; stable IDs; empty states.
- `TaskList`: check/uncheck tasks with optimistic state **and rollback on error**.
- `Dashboard`: completion and logged study minutes, with accessible numeric labels alongside charts.
- `DiscussionLinks`: saved discussion summaries associated with a chapter, not a fabricated history importer.
- `ProposalReview`: review AI changes before high-impact updates; initially simple confirmation controls.
- `HostBridge`: wrapper around MCP Apps UI bridge, with ChatGPT-specific optional extensions isolated.

Use React component composition. Prefer plain state + query/refetch over complex global state management in the first release. Preserve page ordering and block format after writes. Do not render model-provided HTML. Include loading, empty, conflict, auth error, and retry states.

## 8. Security, privacy, and auth

**Milestone gate:** No public release and no personal-data persistence without a verified end-to-end identity model.

- Local proof-of-concept may use a single developer identity **only on localhost/private tunnel**; never expose an unauthenticated writable production endpoint.
- Choose a supported ChatGPT app authentication mechanism from current documentation; validate bearer tokens/claims server-side. Identity and account linking cannot be inferred from prompt text.
- Plan for OAuth 2.1/resource-server guidance where required for remote MCP and cross-client authorization. Validate issuer, audience, signature, expiry, and scopes; apply CSRF protections and proper redirect validation as applicable.
- Map client identity to internal `user_id` and enforce workspace access server-side on every action. If sharing is added, introduce membership roles and a consistent permission policy, not ad-hoc client checks.
- Avoid passing private project data to the model unless required for the user request. Minimize tool output and redact sensitive fields.
- Use HTTPS, secret storage, payload limits, input validation, output encoding, CSP appropriate to widget hosting, safe logs, rate limits, and audit trails.
- Third-party modules do not receive raw DB access or arbitrary code execution permissions. Design a permission manifest **before** a community module marketplace.
- Add export/delete semantics and a privacy policy before directory submission. Record data retention and subprocessors. Follow OpenAI app review policies.

## 9. Hosting and environments

### Local development (no production hosting required)

- Node.js current LTS + pnpm.
- Local PostgreSQL via Docker Compose **or** Supabase development DB.
- MCP HTTP server on localhost (`/mcp`), with a secure HTTPS tunnel for ChatGPT testing if required.
- Static bundled widget served by the MCP server/resource according to current SDK integration.
- `MCP_PUBLIC_BASE_URL`, `DATABASE_URL`, `AUTH_*`, `LOG_LEVEL`, allowed origins, and other secrets in `.env` (gitignored). Commit `.env.example` with placeholders.
- Run MCP Inspector or protocol tests first, then ChatGPT Developer Mode; use Codex for repo work and automated tests.

### Production minimal stack

1. **GitHub:** One public source repository; CI and security reporting.
2. **MCP backend:** One Node.js service on a provider supporting persistent HTTPS and modern MCP transport (e.g., Fly.io, Render, Railway, or equivalent). Verify streaming/HTTP handling and request timeouts before selection.
3. **Database:** Managed PostgreSQL (Supabase or other vendor); migrations and backups.
4. **Public endpoint:** Domain/subdomain such as `mcp.<your-domain>/mcp` (placeholder) with TLS, configured allowed origins, and auth metadata if required.
5. **Widget assets:** Bundled into MCP app resources or securely hosted with approved CSP; separate CDN is optional.
6. **Identity:** Supported OAuth/auth provider and configuration, verified across ChatGPT and Claude Code clients when added.
7. **Monitoring:** Structured logs, service health, error reporting, database availability, simple usage counters. Avoid heavy telemetry infrastructure for v0.1.
8. **Policy pages:** README, privacy policy, terms as needed, security contact, support URL, and app directory submission assets.

**Expected ongoing cost:** hosting/database/domain may incur fees. ChatGPT user subscription access does not automatically pay infrastructure costs or grant an independent model API budget. No paid LLM backend is required for initial tool+widget workflows.

### Deployment process

- Staging endpoint first; separate staging and production database credentials.
- CI: install, lint, typecheck, unit/integration tests, build; optionally run migration verification.
- Deploy staged MCP service and test a real tool call and widget render in supported ChatGPT client.
- Confirm auth, CSP/allowed origins, proxy settings, back-up restore, logs, and rate limits.
- Only then submit a production ChatGPT app for review. Directory listing is conditional on approval; do not treat it as automatic.

## 10. Implementation milestones and acceptance gates

### M0 — Project scaffold and architecture

- [ ] Confirm repo name, license choice (Apache-2.0 recommended for broad contributions), and contributor rules.
- [ ] Create public/private-initial GitHub monorepo; add `PLAN.md`, `PROGRESS.md`, README, license, SECURITY, CONTRIBUTING, `.gitignore`, `.env.example`.
- [ ] Initialize pnpm workspace, strict TypeScript, lint/format, Vitest, GitHub Actions.
- [ ] Add a short ADR for key decisions: app-first, provider-independent core, Postgres, block IDs, no autonomous agent loop.
- [ ] Scaffold a minimal MCP `ping`/read-only `get_capabilities` tool using current official SDK example.
- [ ] Start local MCP server and verify transport in MCP Inspector.

**Acceptance:** clean install; CI green; MCP tool callable locally; architecture README reflects actual code.

### M1 — Durable project/task vertical slice

- [ ] Create Postgres migrations for users, workspaces, projects, tasks, activity events.
- [ ] Implement repository ports and database adapters, with seeded test database.
- [ ] Implement create/list/get project and create/update task use cases.
- [ ] Enforce ownership in application/repositories and optimistic version checks.
- [ ] Expose MCP project/task tools and test failure paths.
- [ ] Define a secure development identity approach, explicitly limited to private local testing.

**Acceptance:** Project created via MCP survives process restart; updates persist; unauthorized access denied; stale version rejected; integration tests pass.

### M2 — First ChatGPT UI widget

- [ ] Adapt the current official Apps SDK / MCP Apps example into React widget scaffold.
- [ ] Display project title, task checklist, completion counter, and loading/error states.
- [ ] Wire widget actions to server tools; do not mutate persistent state only in React.
- [ ] Expose server through a secure development tunnel and connect in ChatGPT Developer Mode where supported.
- [ ] Test both model-initiated tool calls and widget-initiated actions; capture screenshots/manual notes in `docs/screenshots`.

**Acceptance:** In a supported ChatGPT client, create/open a project, toggle a task, refresh/reopen, see persisted result. Record which client and configuration passed. A Codex-only test does not satisfy widget acceptance.

### M3 — Persistent notebook/chapters

- [ ] Add page/block migrations and discriminated block schemas.
- [ ] Implement nested page create/read, stable block IDs, targeted block edits.
- [ ] Render navigation tree and heading/paragraph/checklist blocks.
- [ ] Add server-side edit version checks and basic conflict UI.
- [ ] Test page re-open/restart, nested content order, unauthorized writes, and corrupted JSON handling.

**Acceptance:** A user adds chapters and edits one block without losing or reformatting unrelated blocks.

### M4 — Study metrics and discussion references

- [ ] Add study session records and linkable discussion summaries.
- [ ] Implement `record_session`, `get_metrics`, and `link_discussion` tools.
- [ ] Render planned hours, recorded hours, task completion, and a simple chart.
- [ ] Ensure manual approval for inferred completion or time logging; log source of records.
- [ ] Export project to JSON and a readable Markdown representation.

**Acceptance:** Metrics derive from database, remain correct after restart, support zero data, and never invent activity. Saved discussion summaries appear in selected chapters. Export/import round-trip fidelity is tested for supported block types (import can land in later milestone if explicitly documented).

### M5 — Secure hosted beta / open-source readiness

- [ ] Implement full supported identity/auth flow for ChatGPT.
- [ ] Deploy staging backend and managed database with migrations/backups.
- [ ] Set CSP, allowed origins, secrets, request limits, logging/monitoring.
- [ ] Publish architecture/hosting docs and self-hosting path.
- [ ] Security review, privacy policy, contributor onboarding, issue templates.
- [ ] Test ChatGPT connection and submission requirements against current docs.

**Acceptance:** Two unrelated test users cannot read/write each other's projects; staging recovers from restart; basic backups are tested; no secrets in logs; submission checklist prepared.

### M6 — Claude Code integration (after first beta)

- [ ] Verify the same authenticated remote MCP endpoint with current Claude Code MCP client.
- [ ] Provide sample CLI setup command and OAuth flow (do not commit tokens).
- [ ] Test get project, create task, update task, save work summary, version conflict.
- [ ] Add markdown/text-friendly tool results and optional reusable Claude skill instructions.
- [ ] Document cross-client limitations and security considerations.

**Acceptance:** A project created via ChatGPT can be read/updated by Claude Code under the same authorized user identity; updates appear in ChatGPT on reopen. No database/business logic fork.

### M7 — Community module framework (later, not before MVP)

- [ ] Extract minimal documented `WorkspaceModule` manifest for namespaced schemas, views, actions, permissions, and metrics.
- [ ] Publish `modules/study` as sample; create module integration test contract.
- [ ] Review module trust, sandboxing, versioning, and security before allowing third-party modules in hosted environment.
- [ ] Add optional fitness/work-log modules only after extension contracts prove stable.

**Acceptance:** A separate example module can be added without modifying core domain behavior or ChatGPT transport code, and failed module validation is safely rejected.

## 11. Testing matrix

| Layer | Tests | Tool |
|---|---|---|
| Domain | task transitions, version rules, metrics math | Vitest |
| Application | use cases with in-memory fakes, permission checks | Vitest |
| Database | migrations, scoped queries, transaction rollback, optimistic conflicts | Postgres integration tests |
| MCP | schema validation, tool discoverability, errors, read-only annotations | MCP Inspector + automated protocol tests |
| Widget | components, keyboard/a11y, optimistic rollback, errors | React Testing Library / Playwright |
| Real ChatGPT | dev connection, tool invocation, widget rendering, refresh and resume | Manual E2E in supported ChatGPT client |
| Claude Code | authenticated MCP connection, cross-client edits | Manual + CLI protocol tests |
| Security | cross-tenant isolation, invalid tokens, payload limits, secret scanning | Automated and manual review |
| Operations | restart, migration, restore, log redaction | Staging drill |

**Critical scenarios:** cross-workspace access denied; duplicate session command does not double-count; stale page update returns conflict; external client cannot forge identity; changing one block does not reorder others; app works after a new conversation; no ChatGPT-history access is assumed.

## 12. Example user flows / acceptance scripts

**Flow A — Study-plan creation**

1. User opens ChatGPT app and asks to create `Distributed Systems Preparation`.
2. ChatGPT invokes project creation, adds `Kafka`, `Transactions`, and `Data Modeling` pages, and adds tasks.
3. UI shows the tree and tasks with stable IDs.
4. User closes and later reopens the app; same project and tasks appear.

**Flow B — Update via discussion**

1. User discusses a Kafka concept in ChatGPT.
2. User explicitly requests: “Save a summary to the Kafka chapter and mark the consumer lag task complete.”
3. Client calls the saving/linking and task-update tools with user-authorized identity.
4. Server validates, versions, writes, and returns state; widget refreshes.
5. A future conversation retrieves summary and current task state without needing the full original conversation.

**Flow C — Time logging**

1. User records a confirmed 45-minute study session.
2. Server writes an idempotent session event.
3. Metrics update recorded minutes from 0 to 45, without claiming knowledge mastery.
4. Retried request does not create a duplicate.

**Flow D — Claude Code (M6)**

1. Claude Code connects via authenticated MCP.
2. It reads the `Data Modeling` tasks and saves an explicit implementation summary after code work.
3. ChatGPT reopens the project and displays the updated summary and task state.

## 13. Open decisions (make before relevant milestone)

- **Repository name and GitHub organization:** placeholder `ai-workspace`; verify availability and owner preference.
- **License:** Apache-2.0 proposed; confirm before publication.
- **DB:** Supabase managed PostgreSQL vs local/other Postgres for production; support generic Postgres in code.
- **Auth:** select documented ChatGPT app OAuth connection flow; design account linking to share identity with Claude Code.
- **Editor:** block JSON renderer first, evaluate Tiptap/BlockNote when rich editing is required.
- **Widget host:** test current ChatGPT web and desktop supported environments; record actual supported full-screen behavior.
- **Hosting provider and domain:** decide after local integration and latency/transport testing.
- **Conversation persistence:** store user-authorized summary/metadata and links first; no automatic comprehensive ChatGPT transcript capture.
- **Page/plan review:** choose which writes require explicit review beyond normal ChatGPT tool permission flow.

## 14. Completion definition for v0.1

v0.1 is ready for an initial private tester when:

- One user can create a project, add pages/tasks, record time, and view accurate metrics via ChatGPT.
- Changes persist across sessions; dashboard formatting remains stable.
- The app can link explicitly saved discussion summaries to chapters.
- The backend enforces authenticated authorization; no user can access another's project.
- CI is green; E2E evidence demonstrates actual ChatGPT widget operation.
- A developer can follow the README to run locally with Postgres and test MCP.
- Source code, contribution instructions, security/privacy documents, and hosting plan are published or ready for publication.

**First action for coding agent:** Execute **M0 only**. Generate the repo scaffold, working local MCP health/read-only tool, tests, and `PROGRESS.md`. Do not implement M1–M7 without successfully finishing M0 and recording the results.
