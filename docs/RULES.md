# VitaTwin — Rules for the AI Coding Agent

These rules are non-negotiable. Follow them on every task.

## 1. Language & Style

- TypeScript only (strict mode). No plain JavaScript.
- Prefer functional, small, pure functions where possible.
- Keep functions short and single-purpose.
- Meaningful names over clever names.
- Comments explain *why*, not *what*.

## 2. Scope Discipline

- Never expand scope beyond the current task in TASKS.md.
- Never add features from the “Not Now” list in the PRD.
- If a better idea appears, note it in MEMORY.md or DECISIONS.md — do not implement it silently.

## 3. Code Hygiene

- Reuse existing components and utilities. Do not duplicate.
- Never touch unrelated files.
- Read the relevant docs (PRD, ARCHITECTURE, DESIGN, SECURITY) before writing code.
- Plan large changes in a short comment or reply before coding.
- Validate all inputs.
- Never expose secrets, API keys, or service-role keys to the client.
- Add or update tests for every meaningful feature.
- Make small, focused commits with clear messages.

## 4. Design & Theme

- Light theme only. No dark mode, no `dark:` classes, no dark CSS variables.
- Follow DESIGN.md color tokens and component patterns strictly.
- Every new screen must have loading, empty, and error states.

## 5. Architecture

- UI components do not contain database logic or twin-model calculations.
- All authorization checks happen on the server.
- Twin state is derived and explainable — never a pure black-box score without factors.
- Synthetic data is the only patient data source in this PoC. Label it clearly in the UI.

## 6. Prompting Discipline (for the human + agent loop)

When starting a new task:

1. Read the docs first.
2. State the plan in 3–6 bullet points.
3. Only then write code.
4. After implementation: lint → typecheck → tests → build → commit → update MEMORY.md and TASKS.md.

## 7. Error Handling & Debugging

- Prefer the smallest correct fix.
- Always find the root cause before patching symptoms.
- When debugging, report: error message, expected vs actual, steps to reproduce, then proposed fix.

## 8. Documentation

- Update MEMORY.md after every meaningful session (what is done, current task, known issues, next step).
- Record permanent choices in DECISIONS.md with the reason.
- Keep TASKS.md as the single source of “what is next”.

## 9. Security & Privacy

- Follow SECURITY.md strictly.
- Never log or display real personal health information.
- All demo data is synthetic and labelled as such.

## 10. Quality Gate (before marking a task done)

- [ ] Types pass
- [ ] Lint passes
- [ ] Relevant tests pass
- [ ] Light theme still intact
- [ ] No secrets in client code
- [ ] Docs updated if behaviour changed
