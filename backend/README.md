# TrashVault — Backend

Elysia + Bun REST API. See the [root README](../README.md) for full documentation.

## Quick start

```bash
bun install
bunx drizzle-kit migrate
bun run dev   # http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Dev server with hot reload |
| `bun run test` | Unit tests |
| `bun run test:integration` | Integration tests (needs DB + R2 env) |
| `bun run lint` | oxlint |
| `bun run typecheck` | tsc |
| `bunx drizzle-kit generate` | Generate migrations |
| `bunx drizzle-kit migrate` | Apply migrations |
