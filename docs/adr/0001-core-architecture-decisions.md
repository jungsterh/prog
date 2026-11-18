# ADR 0001: Core architecture decisions

- Status: Accepted (M0)
- Date: 2026-11-17

## Context

Plan.md defines an AI-native workspace with ChatGPT as the first client and Claude Code as
the second. M0 needs a small set of decisions that later milestones build on.

## Decisions

1. **App-first.** The first product surface is a ChatGPT app (Apps SDK / MCP Apps UI). The
   server supplies tools and durable state. Standards-based MCP tools carry all core
   behavior; ChatGPT-specific UI hooks live only in a later `apps/chatgpt` adapter.
2. **Provider-independent core.** Domain and application code never import OpenAI or
   Anthropic SDK types. MCP SDK types stay in `apps/mcp-server` (transport adapter).
   Tool handlers are plain functions over Zod-typed DTOs from `packages/contracts`.
3. **PostgreSQL is authoritative** for all project state (from M1). Widget state and model
   context are never the source of truth. Code targets generic PostgreSQL.
4. **Stable block IDs.** Page content is stored as blocks with stable UUIDs and a `version`
   for optimistic concurrency. The AI edits individual blocks; it never regenerates a page.
5. **No autonomous agent loop** and no scheduler in the MVP. ChatGPT (later Claude Code) is
   the conversational agent. The server validates and applies proposed changes.
6. **Stateless Streamable HTTP.** One `McpServer` per request through the SDK's
   `createMcpHandler`. It serves the 2026-07-28 protocol revision and falls back to
   stateless 2025-era serving. No server-side MCP sessions are needed, which keeps
   horizontal scaling simple.
7. **Packages are created when a milestone needs them.** M0 has `contracts` and
   `mcp-server` only; `domain`, `application`, `persistence`, and `ui` come in M1–M2.

## Consequences

- Swapping or adding a client means a new adapter, not a new backend.
- Every write path (M1+) needs explicit authorization and version checks in the
  application layer.
- Stateless serving rules out server-initiated streams per session; M0–M2 do not need them.
