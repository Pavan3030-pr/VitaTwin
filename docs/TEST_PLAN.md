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

## Manual demo script (for jury)

1. Open deployed URL.
2. Point out synthetic-data notice.
3. Show Twin Dashboard — current state + risk cards.
4. Drill into one alert — show explanation.
5. Show timeline of how the twin evolved.
6. (Optional) Switch to clinician framing.
7. Emphasize privacy posture and India-relevant focus (cardiometabolic).
