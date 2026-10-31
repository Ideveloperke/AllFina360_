# Contributing to AllFina360

Thanks for your interest in improving AllFina360. Bug reports, feature ideas, docs fixes and code
are all welcome.

AllFina is an early MVP, so things move quickly. For anything larger than a small fix, please open
an issue first so we can agree on the approach before you spend time on it.

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold
it.

## Reporting bugs and requesting features

Open a [GitHub issue](https://github.com/Ideveloperke/AllFina360_/issues) and include:

- **Bugs:** what you did, what you expected, what happened instead, and your environment
  (OS, Node and Python versions). Logs or screenshots help.
- **Features:** the problem you want solved and who it helps (advisors, compliance staff,
  admins). A proposed solution is welcome but optional.

Never paste real client data, recordings, transcripts or API keys into an issue.

## Security issues

Do **not** open a public issue for security vulnerabilities. Follow the private reporting process
in [SECURITY.md](SECURITY.md).

## Development setup

Follow [Getting started](README.md#getting-started) in the README. In short:

```bash
cp .env.example .env
pnpm install
(cd apps/ai-service && uv sync)
pnpm infra:up        # or `pnpm services:up` on Windows without Docker
pnpm db:migrate
pnpm dev
```

You need Node.js 24 with pnpm 10 (`corepack enable`), [uv](https://docs.astral.sh/uv/), and
Docker or the locally installed services described in the README.

## Making changes

1. Fork the repo and create a branch from `main` with a short descriptive name, e.g.
   `fix/meeting-retry-status` or `feat/client-search`.
2. Keep each pull request focused on one change.
3. Follow the existing structure:
   - Shared request/response types go in `packages/shared` as Zod schemas, used by both the API
     and the web app.
   - Database changes go in `packages/db/src/schema`. Run `pnpm db:generate` to create a migration
     and commit the generated SQL alongside the schema change. Never edit an existing migration.
   - Every query must be scoped by `firm_id` so tenants stay isolated.
   - Actions on client data should write to the audit log.
4. Add or update tests:
   - `packages/shared`: Vitest
   - `apps/api`: Jest
   - `apps/ai-service`: pytest (tests must not call real Anthropic or Deepgram APIs)
5. New environment variables go in `.env.example` with a placeholder value and a comment. Never
   commit a real `.env` file or secrets.

## Before you open a pull request

Run the same checks CI runs:

```bash
pnpm format          # Prettier
pnpm lint            # ESLint, plus ruff for the AI service
pnpm typecheck       # tsc, plus mypy for the AI service
pnpm test
pnpm build
```

## Commit messages

Write short, imperative commit messages that explain what changed and why, e.g.
`Retry transcription when Deepgram times out`. Keep the first line under about 72 characters and add
detail in the body if needed.

## Pull requests

In the description, explain what changed, why, and how you tested it, and link any related issue
(`Closes #123`). Include screenshots for UI changes. CI must pass before a pull request is merged,
and a maintainer may ask for changes.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
