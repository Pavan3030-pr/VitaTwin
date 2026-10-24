# VitaTwin — HTTP API reference

All routes are same-origin, return `Cache-Control: no-store` unless noted, and are
rate-limited per client address (shared Redis when `UPSTASH_*` is set, otherwise
per instance). `robots.txt` disallows `/api/`.

| Route | Method | Auth | Limit / min | Success response |
|---|---|---|---|---|
| `/api/health` | GET | none | 30 | JSON: `status`, `version`, `modelVersions`, `supabaseConfigured`, `auth` (`ok` · `unreachable` · `not-configured`), `rateLimiter` (`shared-redis` · `in-memory`), `timestamp` |
| `/api/twin/live` | GET | session | 60 | `{ "ticks": [24 simulated wearable readings, 5 s apart] }` |
| `/api/fhir/export` | GET | session | 10 | FHIR R4 Bundle (`Patient`, `Observation`, `RiskAssessment`), `application/fhir+json`, download |
| `/api/fhir/sample` | GET | none | 30 | Synthetic sample FHIR bundle to try the importer |
| `/api/wearable/sample` | GET | none | 30 | Sample wearable CSV (`public, max-age=3600`) |
| `/api/clinician/export` | GET | session | 10 | CSV of the clinician panel (synthetic cohort), formula-injection safe |
| `/api/log-error` | POST | none | 20 | `{ "ok": true }`. Body ≤ 2 000 bytes: `{ scope, digest?, message? }`; scrubbed before logging |
| `/auth/callback` | GET | none | — | Redirect after an e-mail link (`code` or `token_hash` + `type`, plus same-origin `next`) |

"session" means a demo session or a signed-in e-mail account.

## Errors

| Status | Body | When |
|---|---|---|
| 401 | `{ "error": "unauthorized" }` | No session on a protected route |
| 413 | `{ "ok": false }` | `/api/log-error` body too large |
| 429 | `{ "error": "rate_limited", "message": … }` + `Retry-After` header | Over the limit |

## Importing data

FHIR bundles and wearable CSVs are uploaded through the **Connect your data** page
(Server Actions), analysed in memory and discarded. They are not stored or logged.

## Examples

```bash
curl -s https://vita-twin-ten.vercel.app/api/health
curl -s -o sample.csv https://vita-twin-ten.vercel.app/api/wearable/sample
curl -s -o /dev/null -w "%{http_code}\n" https://vita-twin-ten.vercel.app/api/clinician/export   # 401 without a session
```
