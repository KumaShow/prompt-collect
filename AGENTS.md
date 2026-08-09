# Repository Guidelines

## Project Structure & Module Organization

This pnpm workspace contains two applications under `apps/`: `api` is an Express 5/TypeScript service, and `web` is a Vue 3/Vite client. API code lives in `apps/api/src`; keep environment validation in `config/`, TypeORM entities and migrations in `database/`, and HTTP endpoints in `routes/`. Frontend components, stores, routing, and colocated unit tests live under `apps/web/src`. Product requirements and implementation notes belong in `docs/`. The workspace reserves `packages/` for shared libraries and `infra/` for infrastructure as those needs emerge.

## Build, Test, and Development Commands

Run commands from the repository root unless noted otherwise:

- `pnpm install` installs all workspace dependencies (Node 24.x, pnpm 10.32.1).
- `pnpm dev` starts API and web development servers in parallel; use `pnpm dev:api` or `pnpm dev:web` for one app.
- `pnpm build` builds every package that defines a build script.
- `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` perform static checks.
- `pnpm test` runs package `test` scripts; currently this covers the API.
- `pnpm --filter @prompt-collect/web test:unit --run` runs frontend Vitest tests once.
- `pnpm docker:up` starts PostgreSQL; `pnpm docker:down` stops it.

## Coding Style & Naming Conventions

Use strict TypeScript and two-space indentation. Follow each package's ESLint rules and the web Prettier configuration (single quotes, no semicolons, 100-column width). Use `PascalCase` for Vue components and TypeORM entity files/classes, `camelCase` for variables and functions, and descriptive kebab-case for multiword utility files such as `data-source.ts`. API relative ESM imports must include the compiled `.js` suffix. Read validated settings from `config/env.ts`, never directly from `process.env`.

## Testing Guidelines

Vitest is the test runner; Vue tests also use Vue Test Utils and jsdom. Put frontend tests in `src/__tests__/` and name them `*.spec.ts`. Use `*.test.ts` or `*.spec.ts` for API tests under `apps/api/tests/`. Add tests for changed behavior and run the relevant test command plus type checking before submitting.

## Commit & Pull Request Guidelines

Recent commits use concise Conventional Commit subjects, often scoped, such as `feat(api): ...` and `docs: ...`. Keep each commit focused. Pull requests should explain intent, summarize key changes, list verification commands, link relevant issues or TODO items, and include screenshots for visible UI changes. Call out migrations or environment-variable changes explicitly.

## Security & Configuration

Never commit `.env` files or secrets. Update the appropriate `.env.example` when configuration changes, use distinct JWT secrets of at least 32 characters, and keep Docker and API database settings synchronized.
