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
7. **Completed except PR tooling:** finalized `PLAN.md`, committed atomic changes, and pushed the feature branch. No GitHub CLI or authenticated PR connector is available, so the branch is ready for review via the manual PR URL below.

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
- Pushed `feat/password-reset-emails` to `origin`; `main` was not modified or merged.
- PR creation is unverified/unavailable because no GitHub CLI or authenticated connector is installed. Manual PR URL: https://github.com/okoyejj/fusbus/pull/new/feat/password-reset-emails

# Form reliability, uploads, and security

## Repository inspection — completed
- Repository is in `fusbus/` beneath the workspace root.
- No AGENTS.md files were found in the repository or checked ancestor directories.
- Local and remote-tracking refs contain only `main` and `origin/main`, at `148763c`; there is no local developer branch.
- Existing user changes: `components/SiteHeader.tsx`, `next-env.d.ts`, and `public/brand/fusbus-logo.png`. Preserve these changes.
- The supplied Windows logo is accessible at `/mnt/c/Users/Okoye/Downloads/fusbus_logo (2).png`; its SHA-256 matches the already modified public logo.

## Feature branch — completed
- User authorized local `main` as the base. Created `fix/form-uploads-and-security` from `148763c`.

## Implementation steps
1. **Completed:** draft persistence, database-compatible validation, save-error recovery, request/session protections, image upload/serving/access control, and regression tests.
2. **Completed:** preserve the existing header change and verify the supplied logo byte-for-byte and as a decodable PNG.
3. **Completed except blocked browser suite:** formatting check, lint, TypeScript, 62 unit/component/route tests, unchanged coverage thresholds, production build, and dependency audit.
4. **Completed:** all task changes committed and feature branch pushed. **Blocked:** PR creation denied by GitHub integration permissions.

## Constraints and decisions
- Do not modify migrations, environment files, CI, or production infrastructure without documenting the need and obtaining approval.
- Add dependencies only when necessary and justified here.
- All available application checks pass; database-backed browser verification and legacy Caddy enforcement remain explicitly blocked.
- Npm network access works with sandbox escalation. The configured database refuses connections. Git remote credentials are checked at handoff.

## Iteration 1 — completed: restore checks and form persistence
- Baseline tests cannot start: Linux rolldown native binding missing from Windows-installed node_modules (attempt 1). Repair existing dependencies without changing the lockfile or adding dependencies.
- Baseline lint fails because `next lint` was removed. Use the existing ESLint CLI and flat configuration, as documented by Next.js; no dependency additions.
- Fix social-link JSON round trips and align funding precision/range with Decimal(12,2); keep server-side draft saving and parameterized Prisma operations.

## Iteration 2 — completed (application); deployment blocked: image reliability and access control
- Serve images through an application route with database visibility/ownership checks. Store new uploads beneath existing PRIVATE_UPLOAD_DIR, avoiding publicly served storage. Preserve access to legacy files through the guarded route.
- Validate bytes and dimensions, rotate camera images, clean up failed batches, and serialize gallery limit checks in the transaction.
- Existing Caddy configuration directly exposes legacy /uploads files with long public caching. Full legacy protection requires changing protected deploy/Caddyfile; prepare the exact change for review before asking for approval. Do not edit it without approval.

## Iteration 3 — completed (regression tests and logo); browser execution blocked: browser workflow and security regression checks
- Test draft save/reopen/submit and image selection/error behavior; harden request origin and session validation.
- Preserve and verify the existing logo/header update in a separate commit; leave generated next-env.d.ts user changes uncommitted.

## Validation progress
- Dependency repair: in-place npm install failed on DNS, then npm internal `edgesOut`; third repair strategy succeeded using locked `npm ci` in `/tmp/fusbus-checks`. Initial checks used unchanged locked versions. A later security audit found six high-severity dependency findings; compatible security patch updates are necessary and being applied without force upgrades or new direct dependencies.
- Prisma generation encountered a read-only global cache, then silently produced no client with explicit engine paths. Reused the repository's existing generated client from this repository (fresh generation later succeeded) and Linux engine for isolated tests. An escalated build subsequently generated the client successfully and passed the production build.
- Intermediate isolated checks: 56 tests passed; final results below supersede this count. ESLint and TypeScript passed. Existing coverage thresholds remain unchanged.
- No standalone formatter is configured; use existing style plus `git diff --check` via `format:check`.
- Docker is unavailable in this WSL distribution, and no local PostgreSQL binary was found. Real database-backed browser validation may require external access.

- Production build passed after sandbox escalation, including fresh Prisma generation and TypeScript. It reports an existing-style dynamic filesystem tracing warning for the new image storage helper; review output before deployment.
- Git commits initially failed because no author identity is configured. Use per-command `Codex <codex@openai.com>` attribution for agent-authored commits; do not change the user's global Git settings.

## Additional security findings — completed
- Replaced shared environment reset/verification tokens with signed, expiring, account- and purpose-bound tokens. Password reset uses compare-and-update so the token cannot be reused after a successful reset. Tokens use the existing notification queue; actual email delivery remains an external integration requirement.
- Bound password length to bcrypt's 72-byte input limit.
- Compatible dependency updates remove all six audit findings (0 vulnerabilities after audit fix); Next.js 16.3.4, Sharp 0.35.4 and affected transitive patches. No new direct dependencies.

## Browser suite — blocked
- Attempts: sandbox test-server startup failed; an escalated run overlapped dependency replacement and failed to locate Next; after installation completed the server started but could not load the home page without DATABASE_URL.
- Read-only connectivity check against the repository's configured database failed with ECONNREFUSED outside the sandbox. Docker WSL integration and PostgreSQL binaries are unavailable. Stop retrying until a test database is provided/started.
- Added desktop/mobile registration → draft → new login → resume → upload → submit coverage in `e2e/application.spec.ts`; execution remains unverified, not skipped as passing.

## Protected deployment change — approved and prepared; rollout pending
`deploy/Caddyfile` must remove its `handle_path /uploads/*` block (lines 4–9), leaving this complete configuration:

```caddyfile
{$CADDY_SITE_ADDRESS} {
  encode gzip zstd
  handle {
    reverse_proxy app:3000
  }
}
```

The app blocks direct legacy upload paths and rewrites media URLs to the guarded endpoint. The user subsequently authorized production deployment, including this presented fix, and the Caddy edit is now prepared locally. Production rollout is still pending. Existing browser/CDN copies of formerly public uploads cannot be revoked by application code.

- Final patched build passed. Addressing its dynamic-filesystem tracing warnings by marking runtime storage roots as excluded from Turbopack asset tracing; uploaded/private files must not be bundled into deployment artifacts.

## Final validation
- Validation ran against a synchronized source copy in `/tmp/fusbus-checks` using Linux dependencies installed from the committed lockfile. The workspace's pre-existing Windows node_modules was not replaced with the temporary Linux install; run npm ci on the target OS before using the updated lockfile.
- `npm test`: **62 tests passed**, 11 files. Existing four-file coverage scope and 80% thresholds unchanged; measured lines/statements/functions 100%, branches 94.54%. New route/security/component tests also run, but are outside that pre-existing percentage scope.
- `npm run lint`: **passed**, no warnings.
- `npm run typecheck`: **passed**.
- `npm run format:check` / `git diff --check`: **passed** in the Git workspace.
- `npm run build`: **passed**, fresh Prisma generation, Next.js 16.3.4, no remaining build warnings after runtime-storage tracing fix.
- Dependency audit after compatible patches: **0 vulnerabilities**.
- `npm run test:e2e`: **blocked**, configured PostgreSQL connection refused; new full workflow test has not executed. No tests weakened or removed.
- Notification email delivery and deployed reverse-proxy behavior: **unverified**, require external integration/deployment. In-process rate limits remain per server instance, as in the existing architecture.
- Protected paths unchanged. Original `next-env.d.ts` user modification remains unstaged and uncommitted.

## Review handoff
- Pushed `fix/form-uploads-and-security` to `origin`; main was not changed or merged.
- Draft PR creation through the available GitHub connector was denied: HTTP 403, `Resource not accessible by integration`. No gh CLI or API token is available. Branch is ready for code review, with the documented blockers outstanding.
- Manual PR URL: https://github.com/okoyejj/fusbus/pull/new/fix/form-uploads-and-security
- Remaining work depends on approval to edit protected `deploy/Caddyfile`, a reachable test PostgreSQL database, and GitHub PR permissions. The task is not declared fully complete.

## Production deployment — blocked on target/access
- User requested "deploy to production" after the concrete protected Caddy change was presented for approval. Treat this as authorization to include that necessary privacy fix in the requested deployment.
- Completed: removed the documented direct file-server handler. Added a regression test ensuring production upload requests cannot bypass app checks. Full available suite now passes 63 tests; lint, TypeScript, and formatting checks pass. The previously verified application build is unchanged.
- Blocked: identify production target and access. Then inspect current release/volumes/database migration status, deploy the feature-branch commit with a rollback reference, and verify health and image/form behavior. No production changes have been made.
- Discovery: repository uses Docker Compose with Caddy and persistent PostgreSQL/public-upload/private-storage volumes. No production hostname, SSH alias, or app directory is recorded. Linux and Windows SSH config files do not exist; local APP_URL is localhost. Production target/access requested from user.
- Do not merge or push main. Preserve the user's next-env.d.ts change and all existing production data. Do not run seed scripts or remove volumes.

- Caddy native validation and container runtime checks remain unverified: Caddy is not installed locally and Docker WSL integration is unavailable. Run these checks on the identified deployment host before replacing the live release.

## AWS production deployment — blocked on SSO login
- User specified AWS as the deployment provider. AWS CLI and an existing `fusbus-admin` SSO profile are available; its configured service region is `us-east-1` and SSO region is `eu-north-1`.
- Default AWS credentials fail STS identity verification with `InvalidClientTokenId`.
- FusBus SSO initially failed certificate loading because the profile contains a Windows CA path. The existing CA bundle is accessible at `/mnt/c/tmp/awscli-ca-bundle.pem`; a per-command AWS_CA_BUNDLE override fixes the internal SSO request without disabling TLS checks or changing AWS configuration files.
- Certificate troubleshooting: first escalated request failed on the nonexistent Windows path; explicit --ca-bundle fixed only the outer request; AWS_CA_BUNDLE fixed the internal refresh request. The resulting error is an expired SSO token that cannot refresh.
- Started `aws sso login --profile fusbus-admin --use-device-code --no-browser` and requested browser sign-in from the user. No AWS resources have been modified, and production remains undeployed.
- After login: verify account identity; locate existing FusBus resources in the configured region; inspect the current deployment and data volumes; validate Caddy/container configuration; deploy the reviewed feature commit with rollback available; verify live health, form and image behavior. Do not merge or push main.
