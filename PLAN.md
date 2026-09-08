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
4. **Active:** commit final changes and attempt feature-branch push; open a PR only if credentials/tooling allow it.

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
- Current isolated checks: 56 tests pass, ESLint passes without warnings, TypeScript passes. Existing coverage thresholds remain unchanged.
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

## Protected deployment change — blocked pending approval
`deploy/Caddyfile` must remove its `handle_path /uploads/*` block (lines 4–9), leaving this complete configuration:

```caddyfile
{$CADDY_SITE_ADDRESS} {
  encode gzip zstd
  handle {
    reverse_proxy app:3000
  }
}
```

The app now blocks direct legacy upload paths and rewrites media URLs to the guarded endpoint. This protected-file edit is the remaining prerequisite to enforce that boundary behind Caddy. Existing browser/CDN copies of formerly public uploads cannot be revoked by application code. No protected files have been edited.

- Final patched build passed. Addressing its dynamic-filesystem tracing warnings by marking runtime storage roots as excluded from Turbopack asset tracing; uploaded/private files must not be bundled into deployment artifacts.

## Final validation
- Validation ran against a synchronized source copy in `/tmp/fusbus-checks` using Linux dependencies installed from the committed lockfile. The workspace's pre-existing Windows node_modules was preserved; run npm ci on the target OS before using the updated lockfile.
- `npm test`: **62 tests passed**, 11 files. Existing four-file coverage scope and 80% thresholds unchanged; measured lines/statements/functions 100%, branches 94.54%. New route/security/component tests also run, but are outside that pre-existing percentage scope.
- `npm run lint`: **passed**, no warnings.
- `npm run typecheck`: **passed**.
- `npm run format:check` / `git diff --check`: **passed** in the Git workspace.
- `npm run build`: **passed**, fresh Prisma generation, Next.js 16.3.4, no remaining build warnings after runtime-storage tracing fix.
- Dependency audit after compatible patches: **0 vulnerabilities**.
- `npm run test:e2e`: **blocked**, configured PostgreSQL connection refused; new full workflow test has not executed. No tests weakened or removed.
- Notification email delivery and deployed reverse-proxy behavior: **unverified**, require external integration/deployment. In-process rate limits remain per server instance, as in the existing architecture.
- Protected paths unchanged. Original `next-env.d.ts` user modification remains unstaged and uncommitted.
