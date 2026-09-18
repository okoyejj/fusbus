# Forgotten password and account email delivery

## Repository state

- **Completed:** inspected repository instructions, Git state, authentication routes, notification model, existing tests, and bundled Next.js 16 documentation.
- **Completed:** created `feat/password-reset-emails` from local `main` at `148763c`.
- **Completed:** preserved the pre-existing unstaged `next-env.d.ts` change; it is unrelated and must not be committed.

## Assumptions and decisions

- Send registration and password-reset messages from `FusBus <info@fusbus.org>` using the already documented `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` server-only variables.
- Add `nodemailer` plus its TypeScript declarations. SMTP is necessary for real delivery, and a maintained transport library is safer and smaller in scope than implementing SMTP/TLS directly.
- Use signed, expiring, purpose- and account-bound tokens. Reset tokens are also bound to the current password hash, making a successful reset invalidate the link without a database migration.
- Do not reveal whether an email address exists in the forgot-password response.
- Branded welcome and reset templates will include the recipient name, polite plain-text and HTML content, and the FusBus logo.
- No migration is needed. Protected migrations, CI, and production infrastructure remain unchanged.
- `.env` is ignored but protected by the task rules. The supplied SMTP password must never be committed or printed; document and separately authorize any local edit after all independent work is complete.

## Implementation steps

1. **Completed:** established baseline checks; added unit tests for tokens, templates, SMTP delivery, and auth route behavior.
2. **Completed:** implemented email templates, SMTP delivery, and notification status recording.
3. **Completed:** implemented secure forgot/reset workflow and accessible pages; registration now sends a welcome email.
4. **Blocked at execution:** added Playwright coverage for the user-visible forgot/reset flow; browser execution requires unavailable PostgreSQL plus sudo-only Chromium system libraries.
5. **Completed except documented blockers:** formatting, lint, type checking, unit/integration tests, and build pass. E2E execution and a clean dependency audit are blocked as recorded below.
6. **Blocked pending explicit protected-path approval:** update the ignored local `.env` SMTP secret; never commit or print it.
7. **Active:** finalize `PLAN.md`, commit atomic changes, push the feature branch, and open a pull request if credentials permit.

## Validation log

- Baseline `npm test`: 22 tests passed; coverage thresholds passed.
- Baseline `npm run lint`: failed because local `main` used removed `next lint`; replace it with the installed ESLint 9 CLI and flat Next.js configuration.
- Baseline `npm run typecheck`: script missing; add the standard `tsc --noEmit` script.
- Focused email/token/auth route tests: 11 passed after correcting two test-harness assumptions (mocked `clientIp`, browser `Accept` header).
- Initial type check sees stale `.next/types` references from the branch that was active before this task; regenerate Next types before evaluating application TypeScript.
- Dependency installation required registry access after the sandboxed attempt failed with `EAI_AGAIN`. Nodemailer and its declarations were installed successfully; npm currently reports pre-existing/auditable dependency findings to inspect during final validation.
- Final application checks before the notification hardening pass: 33 tests passed; coverage measured 100% statements/lines/functions and 93.47% branches; lint passed with three pre-existing warnings; TypeScript and formatting passed.
- Production build passed on Next.js 16.3.5 after sandbox escalation. It retains three pre-existing dynamic filesystem tracing warnings in seller media/storage code.
- Browser suite attempt 1 could not bind port 3000 in the sandbox. Escalated attempt 2 started Next.js but timed out because the configured readiness/home route requires PostgreSQL at localhost:5432. A database-independent auth-only run then found Chromium missing; Chromium installed, but execution requires `libnspr4` and related OS libraries. Official dependency installation is blocked by sudo credentials. Docker is not integrated into this WSL environment. Do not report E2E as passing.
- Initial audit: 1 critical, 5 high, 3 moderate findings. A targeted compatible update removed the critical runtime finding and two high findings. Three security repair attempts are exhausted: `npm audit fix` twice crashed inside npm reading `edgesOut`; the targeted update between them succeeded but left 3 high and 3 moderate transitive tooling findings. Mark audit remediation blocked; do not retry in this task.
- Final `npm test`: **35 tests passed** across 9 files. Existing coverage scope/thresholds remain unchanged; measured statements, lines, and functions 100%, branches 93.47%.
- Final `npm run typecheck`: **passed**.
- Final `npm run format:check`: **passed**.
- Final `npm run lint`: **passed with zero errors** and three pre-existing warnings (carousel ARIA usage and two seller-media `<img>` warnings).
- Final `npm run build`: **passed** on Next.js 16.3.5 with the three pre-existing seller media/storage tracing warnings noted above.
- Registration email, SMTP transport, branded template, token expiry/account binding/password-hash invalidation, account-enumeration-safe response, successful password change, confirmation mismatch, atomic replay rejection, notification status, and token-free notification persistence are covered by unit/route integration tests.

## Commits and handoff

- `5e3b80a feat: add secure password reset emails`
- `f7fe21c test: cover password reset pages`
- The pre-existing `next-env.d.ts` modification remains unstaged and excluded from all commits.
- Push/PR status pending.
