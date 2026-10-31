# AllFina360

[![CI](https://github.com/Ideveloperke/AllFina360_/actions/workflows/ci.yml/badge.svg)](https://github.com/Ideveloperke/AllFina360_/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-24-339933?logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/python-3.12-3776AB?logo=python&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An AI meeting assistant for financial advisors. Advisors upload a client meeting recording (or paste
a transcript), and AllFina produces a summary, action items, a follow-up email draft and compliance
flags. Every step is recorded in an append-only audit log.

> **Status:** early MVP, under active development. Expect breaking changes; not yet production-ready.

## Features

- **Meeting capture:** upload an audio/video recording or paste a transcript
- **Transcription:** speaker-labelled transcripts via Deepgram
- **AI analysis (Claude):** summary, key points, action items, a follow-up email draft and
  compliance flags, validated against a schema
- **Client management:** multi-tenant firm workspaces with clients and meeting history
- **Compliance-minded:** append-only audit log, tenant-scoped queries, short-lived presigned URLs
  for recordings

## Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Common commands](#common-commands)
- [Security and compliance](#security-and-compliance)
- [Docker images](#docker-images)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Architecture

```
            browser
               │  (same origin: cookies stay first-party)
               ▼
   apps/web  Next.js 15 ──/api/* proxy──▶  apps/api  NestJS 11 ──▶ PostgreSQL 16 + pgvector
                                              │   Better Auth          (Drizzle ORM)
     presigned PUT ──▶ S3 / MinIO ◀───────────┤
                                              │ BullMQ (Redis)
                                              ▼
                                         meeting worker ──HTTP──▶ apps/ai-service  FastAPI
                                                                    ├─ Deepgram (transcription)
                                                                    └─ Claude Opus 5.5 (analysis)
```

| Path              | What it is                                                                      |
| ----------------- | ------------------------------------------------------------------------------- |
| `apps/web`        | Next.js 15 + React 19 + Tailwind v4 + TanStack Query advisor dashboard          |
| `apps/api`        | NestJS core API: auth, multi-tenant clients & meetings, audit log, job queue    |
| `apps/ai-service` | Python 3.12 FastAPI internal service: transcription and Claude meeting analysis |
| `packages/db`     | Drizzle schema + SQL migrations (single source of truth for the database)       |
| `packages/shared` | Zod schemas and DTO types shared by the API and web app                         |
| `infra/`          | Local Postgres init script                                                      |

### How a meeting is processed

1. The web app creates a meeting (`POST /api/meetings`).
2. For recordings, it asks for a presigned URL and uploads the file **directly** to object storage.
3. `POST /api/meetings/:id/process` sets the meeting to `processing` and queues a BullMQ job.
4. The worker calls the AI service: Deepgram transcribes with speaker labels, then Claude returns a
   schema-validated analysis (summary, key points, action items, follow-up email, compliance flags).
5. Results are saved in one transaction; the web page polls until the status is `completed`.

Failed jobs retry 3 times with exponential backoff before the meeting is marked `failed`.

## Prerequisites

- Node.js 24 (see `.nvmrc`) and pnpm 10: `corepack enable`
- [uv](https://docs.astral.sh/uv/) for the Python service
- Docker (for Postgres, Redis and MinIO)
- API keys: [Anthropic](https://console.anthropic.com/) and [Deepgram](https://deepgram.com/)
  (Deepgram is only needed for recordings; pasted transcripts work without it)

## Getting started

```bash
cp .env.example .env            # then set BETTER_AUTH_SECRET, AI_SERVICE_API_KEY, ANTHROPIC_API_KEY, DEEPGRAM_API_KEY
pnpm install
(cd apps/ai-service && uv sync)
pnpm infra:up                   # Postgres (pgvector), Redis, MinIO + bucket
pnpm db:migrate                 # apply packages/db/drizzle migrations
pnpm dev                        # web :3000, api :4000, ai-service :8000
```

Open http://localhost:3000, create an account (each sign-up gets its own firm workspace), add a
client and create a meeting.

Local services: MinIO console http://localhost:9001 (`allfina` / `allfina-secret`), Drizzle Studio
via `pnpm db:studio`.

### Windows without Docker

Use locally installed services instead of Docker Compose:

- **Postgres:** an installed PostgreSQL with [pgvector](https://github.com/pgvector/pgvector#windows).
  Create the database once, as a superuser:
  `psql -U postgres -h localhost -f infra/postgres/create-local-db.sql`
- **Redis:** `choco install redis`
- **S3 storage:** [SeaweedFS](https://github.com/seaweedfs/seaweedfs/releases) (`windows_amd64.zip`).
  Put `weed.exe` and an `s3.json` with the `allfina` / `allfina-secret` credentials in
  `~\.allfina-dev\seaweedfs`.

Then, each time you start working:

```powershell
pnpm services:up      # starts Postgres service, Redis, SeaweedFS (S3 :9000) + bucket; skips anything already running
pnpm dev              # web :3000, api :4000, ai-service :8000
pnpm services:down    # stop Redis and SeaweedFS when you're done
```

`pnpm services:up -- -Apps` does both steps in one terminal. Service logs are in
`~\.allfina-dev\logs`. Override paths with `ALLFINA_DEV_HOME`, `ALLFINA_REDIS_EXE` or
`ALLFINA_SEAWEEDFS_DIR`.

## Common commands

| Command                   | Does                                                      |
| ------------------------- | --------------------------------------------------------- |
| `pnpm dev`                | Run every app in watch mode                               |
| `pnpm build`              | Build all TypeScript packages and apps                    |
| `pnpm lint` / `typecheck` | ESLint + tsc (and ruff + mypy for the AI service)         |
| `pnpm test`               | Vitest (shared), Jest (api), pytest (ai-service)          |
| `pnpm format`             | Prettier                                                  |
| `pnpm db:generate`        | Create a migration after editing `packages/db/src/schema` |
| `pnpm db:migrate`         | Apply migrations                                          |

## Security and compliance

- **Tenant isolation:** every query is scoped by `firm_id` from the authenticated session.
  Postgres row-level security is the planned next layer.
- **Audit log:** `audit_logs` is append-only. A database trigger blocks `UPDATE`/`DELETE`,
  in support of SEC 17a-4 / FINRA recordkeeping.
- **Sessions:** 12-hour sessions via Better Auth, httpOnly cookies served first-party via the Next.js proxy.
- **Recordings:** never pass through the API; uploaded and read with short-lived presigned URLs.
  Enable bucket default encryption (SSE-KMS) in production.
- **AI service:** internal-only, protected by a shared key (`AI_SERVICE_API_KEY`). The prompt tells
  Claude to treat transcript content as data, and the model used for each summary is stored.
- **Claude refusals:** analysis requests opt into server-side fallback (`fallbacks: "default"`), so a
  request declined by a safety classifier is retried on Anthropic's recommended fallback model.

## Docker images

```bash
docker build -f apps/api/Dockerfile -t allfina-api .
docker build -f apps/web/Dockerfile --build-arg API_URL=https://api.example.com -t allfina-web .
docker build -t allfina-ai-service apps/ai-service
```

`API_URL` is read when the web app is **built** (Next.js bakes rewrites into the build).

## Roadmap

- Meeting bot (Recall.ai) to join Zoom / Teams / Meet automatically
- CRM sync (Salesforce, Wealthbox, Redtail) and calendar integration (Google, Microsoft 365)
- Semantic search across meetings with pgvector (`document_chunks` table is ready)
- Team invitations and role-based permissions (owner, advisor, assistant, compliance)
- SSO/SAML, MFA, Postgres row-level security, Sentry + OpenTelemetry + Langfuse

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, coding
conventions and the pull request checklist, and our [Code of Conduct](CODE_OF_CONDUCT.md). Please
report security issues privately, not as public issues.

## License

[MIT](LICENSE) © 2026 David Mule
