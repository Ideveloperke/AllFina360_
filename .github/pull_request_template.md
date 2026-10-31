## Summary

<!-- What does this change, and why? -->

Closes #

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Docs
- [ ] Tooling / CI

## How was this tested?

<!-- Describe the tests you added or ran, and any manual testing. -->

## Screenshots

<!-- For UI changes. Use test data only. Delete this section otherwise. -->

## Checklist

- [ ] I've read [CONTRIBUTING.md](https://github.com/Ideveloperke/AllFina360_/blob/main/CONTRIBUTING.md)
- [ ] `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass locally
- [ ] Tests were added or updated where it makes sense
- [ ] New queries are scoped by `firm_id`, and actions on client data write to the audit log
- [ ] Schema changes include a generated migration (`pnpm db:generate`); no existing migration was edited
- [ ] New environment variables are added to `.env.example` with placeholder values
- [ ] No secrets, real client data, recordings or transcripts are included
