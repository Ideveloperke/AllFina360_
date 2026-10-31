# Security Policy

AllFina360 handles sensitive financial-advisor and client data, so we take security reports
seriously. Thank you for helping keep the project and its users safe.

## Supported versions

AllFina360 is an early MVP with no tagged releases yet. Only the latest code on the `main` branch
receives security fixes.

| Version         | Supported |
| --------------- | --------- |
| `main` (latest) | Yes       |
| Older commits   | No        |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions or pull
requests.**

Report them privately using GitHub's
[private vulnerability reporting](https://github.com/Ideveloperke/AllFina360_/security/advisories/new)
(the **Report a vulnerability** button on the repo's **Security** tab). If that isn't available,
contact the maintainer privately through their [GitHub profile](https://github.com/Ideveloperke).

Please include as much of the following as you can:

- The type of issue (for example, tenant isolation bypass, authentication flaw, injection, exposed
  secrets, prompt injection that leaks data)
- The affected file paths, endpoints or components (`apps/web`, `apps/api`, `apps/ai-service`,
  `packages/db`)
- Step-by-step instructions to reproduce, and the configuration needed
- Proof-of-concept code, if possible
- The impact, and how an attacker could exploit it

Never include real client data, recordings, transcripts or live API keys in a report. Use test data.

## What to expect

- **Acknowledgement:** we aim to confirm receipt within 3 business days.
- **Assessment:** we aim to give an initial assessment within 10 business days, including whether
  we accept the report and its severity.
- **Fix and disclosure:** we will keep you updated, work on a fix, and agree on a disclosure date
  with you. We ask that you do not disclose the issue publicly until a fix is available.
- **Credit:** with your permission, we will credit you in the security advisory.

This is a small project maintained in spare time, so timelines are goals rather than guarantees.

## Scope

**In scope:** code in this repository, including:

- Cross-tenant data access (one firm reading or changing another firm's clients, meetings or
  recordings)
- Authentication, session and authorization flaws
- Ways to modify or delete entries in the append-only audit log
- Exposure of recordings, transcripts or presigned storage URLs
- Bypassing the shared-key protection on the internal AI service
- Prompt injection through transcript content that leaks data or changes behaviour across tenants

**Out of scope:**

- Vulnerabilities in third-party services (Anthropic, Deepgram, GitHub) or in dependencies, unless
  this project uses them in an insecure way. Please report those upstream.
- The placeholder credentials in `.env.example` and `docker-compose.yml`, which are for local
  development only
- Denial-of-service and volumetric attacks, spam, and social engineering
- Issues that need physical access to a device or an already-compromised machine

## Safe harbor

We will not pursue action against anyone who researches and reports in good faith under this
policy: avoid privacy violations, data destruction and service disruption; only test against your
own local instance; and give us reasonable time to fix the issue before disclosure.

## Security design

See [Security and compliance](README.md#security-and-compliance) in the README for how the project
handles tenant isolation, audit logging, sessions, recordings and the AI service.
