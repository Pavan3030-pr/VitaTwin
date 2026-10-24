# VitaTwin — Submission checklist

Tick each item before sending the entry.

## Must have
- [ ] Demo video uploaded (Unlisted) and the link pasted in `README.md` under *Demo video*
- [ ] Repository is public and `main` is the final branch (`git log origin/main -1` matches what you expect)
- [ ] Live site passes: `npm run smoke -- https://vita-twin-ten.vercel.app` → `ALL CHECKS PASSED`
- [ ] README screenshots render on GitHub (open the README in a private window)
- [ ] GitHub **Actions** tab is green for CI, CodeQL and E2E on the latest commit
- [ ] Presentation deck (`docs/VitaTwin_Presentation.pptx`) matches the final features and numbers

## Should have
- [ ] `npm run lighthouse -- https://vita-twin-ten.vercel.app` ≥ 95 in all four categories
- [ ] Supabase: Site URL and redirect URLs set, "Confirm email" on, migrations `0001`–`0003` applied, `supabase/tests/verify-rls.sql` clean
- [ ] Vercel: Analytics enabled; `/api/health` shows `"rateLimiter":"shared-redis"`
- [ ] One full real-email cycle tested: sign up → confirm → reset password → save snapshot → delete account
- [ ] `npm run backup` taken once and stored off the laptop
- [ ] Link preview checked: paste the live URL into a chat app and confirm the VitaTwin card appears

## Say it plainly in the write-up
- All patients are synthetic; nothing real is ever uploaded or stored beyond a sign-in profile and compact snapshots.
- The Cleveland dataset is a public benchmark used only offline to sanity-check the equations.
- The early-warning backtest is on synthetic data; there is no prospective clinical study.
- VitaTwin is decision support, not a medical device or a diagnosis.
