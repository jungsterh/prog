# Tool contracts

Schemas live in `packages/contracts`. JSON Schema is generated from them and served in
`tools/list`. All tools return `structuredContent` plus the same JSON as a text block.

## `workspace_ping` (read-only)

- Input: `{ message?: string }` — max 200 characters; no other properties.
- Output: `{ status: "ok", serverTime: string (ISO 8601 UTC), echo?: string }`
- Annotations: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`,
  `openWorldHint: false`.

## `workspace_get_capabilities` (read-only)

- Input: `{}` — no properties.
- Output:

  ```ts
  {
    server: {
      name: string;
      version: string;
    }
    transport: {
      kind: 'streamable-http';
      stateless: boolean;
    }
    persistence: 'none' | 'postgres';
    authentication: 'none-local-only' | 'oauth';
    tools: {
      name: string;
      title: string;
      readOnly: boolean;
    }
    [];
  }
  ```

- Annotations: same as `workspace_ping`.

## Errors

| Case                     | Result                                                                 |
| ------------------------ | ---------------------------------------------------------------------- |
| Input fails the schema   | Rejected by the SDK, or `isError: true` with a fixed text              |
| Unknown tool             | MCP error from the SDK                                                 |
| Unexpected handler error | `isError: true`, text: "The tool failed because of an internal error." |
