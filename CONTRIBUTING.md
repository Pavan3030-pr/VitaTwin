# Contributing to VitaTwin

VitaTwin is a proof of concept that uses **synthetic data only**. Please keep it that way.

## Ground rules
- Never commit real patient data, secrets, `.env*` files, database dumps or the Supabase service-role key.
- Keep health logic explainable and versioned (see `docs/MODEL_CARD.md`); decision support only, never a diagnosis.
- Private pages and routes check the session on the server; browser-only checks do not count.

## Set up
```bash
npm ci
cp .env.example .env.local      # optional: only needed for e-mail sign-in
npm run dev                     # http://localhost:3000, demo twin works with no configuration
```

## Before opening a pull request
```bash
npm run typecheck && npm run lint
npm run test:coverage           # unit tests + coverage gate
npm run build && npm run check:secrets
npm run test:e2e                # needs: npx playwright install chromium
```
CI runs the first four; the E2E workflow runs on pull requests.

## Conventions
- Small, focused commits in the form `type: summary` (`feat`, `fix`, `docs`, `test`, `chore`).
- New server logic gets a unit test; new pages get an e2e check or a smoke-test line.
- Database changes are new files in `supabase/migrations/` (idempotent where possible) plus a check in `supabase/tests/verify-rls.sql`.
- Update `CHANGELOG.md` and the relevant doc in `docs/` with the change.
