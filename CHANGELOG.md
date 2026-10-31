# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) once releases begin.

## [Unreleased]

### Added

- Monorepo scaffold: pnpm workspaces and Turborepo with a Next.js 15 web app, NestJS API, Python
  FastAPI AI service, and shared `db` and `shared` packages.
- Email and password authentication with Better Auth; each sign-up gets its own firm workspace.
- Multi-tenant client management, with every query scoped by `firm_id`.
- Meetings: upload a recording directly to S3-compatible storage with a presigned URL, or paste a
  transcript.
- Background meeting processing with BullMQ: Deepgram transcription with speaker labels, then Claude
  analysis producing a summary, key points, action items, a follow-up email draft and compliance
  flags. Failed jobs retry 3 times with exponential backoff.
- Append-only audit log, protected by a database trigger that blocks updates and deletes.
- PostgreSQL 16 with pgvector, using Drizzle ORM schema and migrations.
- Local development with Docker Compose (Postgres, Redis, MinIO), plus a Windows script for running
  without Docker.
- Dockerfiles for the web app, API and AI service.
- GitHub Actions CI: Prettier, ESLint, TypeScript, Vitest, Jest and builds, plus ruff, mypy and
  pytest for the AI service.
- Project documentation: README, MIT license, contributing guide, code of conduct, security policy,
  and issue and pull request templates.

[Unreleased]: https://github.com/Ideveloperke/AllFina360_/commits/main
