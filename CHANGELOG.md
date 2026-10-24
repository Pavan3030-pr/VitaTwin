# Changelog

All notable changes to VitaTwin. Dates are 2026.

## [Unreleased]
### Added
- **Biggest levers** card on the dashboard: ranks single changes (stop smoking, HbA1c, LDL, weight, sleep, resting HR) by how much they lower combined risk, using the existing what-if models.
- Unit tests for sign-in, sign-up, password reset, e-mail callback, account deletion and the health probe; coverage reporting with a regression gate in CI.
- `/api/health` reports Supabase Auth reachability (`auth`); smoke test asserts it.
- `Cross-Origin-Opener-Policy: same-origin` header; CI fails on critical production advisories.
- Docs: `API.md`, `TROUBLESHOOTING.md`, `CONTRIBUTING.md`, PR template, security trade-offs.

## [2.1.0] — 21–24 Oct
### Added
- Account lifecycle: e-mail confirmation callback, forgot/reset password, resend confirmation, self-service account deletion.
- Saved twin snapshots (row-level security, 50 per user) and clinician panel CSV export plus print layout.
- Onboarding tour, empty and loading states, skip link, reduced-motion support, privacy and terms pages.
- Vercel Web Analytics (cookieless), scrubbed error tracking with optional webhook, shared Redis rate limiting.
- Share image, PNG app icons, robots, sitemap, manifest, `security.txt`.
- `npm run smoke`, `lighthouse`, `screenshots`, `backup`, `check:secrets`; Dependabot, CodeQL and E2E workflows.
- README screenshots, deployment runbook, submission checklist, extended demo script.

### Changed
- Upgraded Next.js to 15.5.28 (security advisories); lazy-loaded the vitals chart (first load 211 kB → 104 kB).
- Per-page titles, AA-contrast muted text, meta description rendered in `<head>`; Lighthouse 99–100 on landing and login.
- Validation page and README state clearly that the UCI Cleveland dataset is an offline public benchmark.

### Fixed
- Snapshot delete no longer reports success when the database removes nothing; timestamps render in the viewer's timezone.
- Welcome tour no longer reappears after a fast reload; what-if presets can no longer worsen a value or show as no-ops.
- Landing page pronoun, inaccurate "passwords never touch our servers" copy, and "+x SD" labels that read backwards.

## [2.0.0] — earlier
- Initial challenge build: explainable risk models, personal-baseline early warning, FHIR R4 import/export, wearable CSV import, clinician view, validation page, six synthetic personas.
