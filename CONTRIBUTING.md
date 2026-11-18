# Contributing

Thank you for your help. This project is in an early stage (milestone M0).

## Before you start

1. Read [`Plan.md`](Plan.md) (section 0 has the engineering rules) and [`PROGRESS.md`](PROGRESS.md).
2. Read the ADRs in [`docs/adr/`](docs/adr/).
3. Pick one unchecked, actionable task. Do not widen scope without a plan or ADR change.

## Development rules (summary of Plan.md section 0)

- TypeScript `strict`. No `any`, no type assertions to hide errors (`as const` is allowed).
- Validate at trust boundaries with Zod. Keep I/O at the edges; keep handlers pure.
- Small modules: functions of about 10–30 lines, one responsibility per class or module.
- Composition over inheritance. Use a design pattern only when it solves a real problem.
- Never let an LLM be the authority for metrics, identity, authorization, timestamps,
  or task completion.
- Never commit secrets. Use `.env` (ignored) and update `.env.example` with placeholders.
- Never log request bodies, tokens, or other secrets.

## Workflow

```sh
pnpm install
pnpm run check   # must pass before you open a pull request
```

- Write tests with the change. Protocol-level behavior needs a test in
  `apps/mcp-server/test/http.protocol.test.ts` or a similar file.
- Use small commits. Commit messages: [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Update `PROGRESS.md` when you complete a plan task, with the test evidence.
- Add an ADR in `docs/adr/` for each decision that is hard to change later.

## Licensing of contributions

The project license is Apache-2.0 (proposed). By submitting a contribution, you agree that
it is licensed under the same license (Apache-2.0 section 5, "inbound = outbound").
