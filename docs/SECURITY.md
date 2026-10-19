# VitaTwin — Security & Privacy

## Non-negotiable principles

1. **Synthetic data only** in this PoC. No real patient identifiable information ever enters the system.
2. **Secrets stay on the server.** Service-role keys, model keys, and database credentials never reach the browser.
3. **Authorization on every sensitive path.** Route guards + object-level checks.
4. **Validate all input.** Never trust client-supplied data.
5. **Least privilege.** Supabase RLS (or equivalent) must enforce that a user can only see their own twin data.

## Concrete rules

- Private routes require authentication.
- A user can only access their own patient twin, alerts, and recommendations.
- `.env.local` (or platform secrets) holds real values; only `.env.example` is committed.
- No logging of health data in plain text to third-party services without explicit anonymization.
- File uploads (if any) are size-capped, content-type sniffed, and stored privately.
- Rate-limit auth endpoints.
- HTTPS only in production.
- Clear UI banners stating “All patient data in this demonstration is synthetic”.

## Threat model (simplified for PoC)

| Threat | Mitigation |
|--------|------------|
| Stolen session | Short-lived tokens, secure cookies, logout |
| IDOR (accessing another user’s twin) | Server-side ownership checks + RLS |
| Secret leakage | Never expose service keys; audit client bundles |
| Prompt / data injection into models | Structured inputs, validation, no free-form PHI |
| Brute-force login | Rate limiting |

## Checklist before any public deployment

- [ ] No secrets in client code or Git history
- [ ] RLS (or equivalent) enabled and tested
- [ ] Synthetic-data notice visible on every authenticated page
- [ ] Auth rate limiting active
- [ ] HTTPS enforced
- [ ] Error messages do not leak internal details

## Added 2026-10-19

- Auth rate limit (8 attempts / 10 min / client, in-memory) and email/password length validation.
- Security headers (CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy) in `next.config.ts`.
- What-if action needs a session and clamps every input; error reports are scrubbed of emails, tokens and long numbers.
