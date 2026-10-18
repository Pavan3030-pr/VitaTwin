# VitaTwin — Test Plan

## Definition of “working”

A feature is working only when:

1. Happy path succeeds.
2. Obvious failure paths are handled gracefully (empty data, network error, unauthorized).
3. Light theme is intact.
4. Relevant automated tests pass.
5. Manual check at 375 px, 768 px and 1440 px widths looks correct.

## Critical user journeys (must have Playwright coverage)

1. **New user → Dashboard**
   - Land on login / start
   - Authenticate (or use demo synthetic user)
   - Reach Twin Dashboard with visible risk summary and at least one insight

2. **View twin details**
   - Open vitals / streams
   - See charts render with synthetic data
   - Open an alert and see explanation + recommendation

3. **Authorization**
   - Unauthenticated user cannot reach protected twin routes
   - User A cannot load User B’s twin data

## Risk model tests (unit)

- Given known synthetic inputs, risk scores and contributing factors match expected ranges.
- Edge cases (missing wearable window, extreme values) do not crash and produce sensible fallbacks.

## Visual / theme tests

- No dark-mode classes or dark backgrounds appear in the built CSS.
- Primary actions use the defined teal.
- Risk badges use the correct semantic colors + text labels.

## Regression gate (run before every commit that changes behaviour)

```bash
npm run lint
npm run typecheck   # or tsc --noEmit
npm run test        # unit
npm run test:e2e    # Playwright (main journey)
npm run build
```

Last full run: lint ✅ · typecheck ✅ · 31 unit ✅ · 14 e2e ✅ · build ✅

## Current automated coverage (2026-10-18)

**Vitest — 31 tests**

| File | Covers |
|------|--------|
| `tests/unit/synthetic-data.test.ts` | Patient shape, deterministic output, UTC day alignment, sleep duration from night hours, lab flags |
| `tests/unit/twin-engine.test.ts` | Fusion fallbacks, every risk score's range + factor explanations, alert/recommendation generation |
| `tests/unit/demo-bundle.test.ts` | Contract that the rendered demo bundle is physiologically plausible (no 0-step day, no 130 % HbA1c, sleep inside 3–10 h) |

**Playwright — 14 specs** (`tests/e2e/journey.spec.ts`)

1. Landing states the synthetic-data notice.
2. Demo sign-in reaches a populated dashboard.
3. Dashboard values are physiologically plausible (asserted against the UI, not the module).
4. Insight page shows an alert explanation plus its risk drivers.
5. Vitals page renders charts from the wearable window.
6. Timeline, clinician and profile pages all render.
7. Sign-out returns to the landing page and re-locks the twin.
8. All six private routes redirect to `/login` when unauthenticated.
9. Login keeps the requested `?next=` return path.
10. The email form honestly reflects whether Supabase is configured (disabled + explanatory note when not, enabled + “Backed by Supabase Auth” when it is).
11. After sign-in: no `dark:` classes, a light body background, and no
    `prefers-color-scheme: dark` rules in the shipped CSS.
12. Dashboard has no horizontal overflow at 375 px, 768 px and 1440 px
    (three specs).

**Known flake:** running the e2e suite against the Next dev server can fail the
first journey spec while `/dashboard` compiles cold. Re-running passes; the
suite is planned to move to a production server (`next build && next start`).

**Not yet covered:** two-account data isolation against a live Supabase project
(needs resumed credentials), and Vercel/preview smoke tests.

## Manual demo script (for jury)

1. Open deployed URL.
2. Point out synthetic-data notice.
3. Show Twin Dashboard — current state + risk cards.
4. Drill into one alert — show explanation.
5. Show timeline of how the twin evolved.
6. (Optional) Switch to clinician framing.
7. Emphasize privacy posture and India-relevant focus (cardiometabolic).
