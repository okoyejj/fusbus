# Form reliability, uploads, and security

## Repository inspection — completed
- Repository is in `fusbus/` beneath the workspace root.
- No AGENTS.md files were found in the repository or checked ancestor directories.
- Local and remote-tracking refs contain only `main` and `origin/main`, at `148763c`; there is no local developer branch.
- Existing user changes: `components/SiteHeader.tsx`, `next-env.d.ts`, and `public/brand/fusbus-logo.png`. Preserve these changes.
- The supplied Windows logo is accessible at `/mnt/c/Users/Okoye/Downloads/fusbus_logo (2).png`; its SHA-256 matches the already modified public logo.

## Feature branch — completed
- User authorized local `main` as the base. Created `fix/form-uploads-and-security` from `148763c`.

## Implementation steps — pending
1. Trace form submission, draft persistence, image upload/display, validation, authorization, and database input handling; add regression tests and implement minimal fixes in atomic commits.
2. Verify the existing logo replacement and preserve the user's header changes; add relevant checks.
3. Run formatting, lint, TypeScript, unit coverage, end-to-end tests, and production build using available project tooling. Record failures accurately and limit each failure to three informed attempts.
4. Review final diff, update this plan, commit changes on the feature branch, and push/open a PR if credentials and tools are available.

## Constraints and decisions
- Do not modify migrations, environment files, CI, or production infrastructure without documenting the need and obtaining approval.
- Add dependencies only when necessary and justified here.
- Tests and quality checks have not yet run; acceptance criteria remain unverified.
- No network access or credentials have been tested.

## Iteration 1 — completed: restore checks and form persistence
- Baseline tests cannot start: Linux rolldown native binding missing from Windows-installed node_modules (attempt 1). Repair existing dependencies without changing the lockfile or adding dependencies.
- Baseline lint fails because `next lint` was removed. Use the existing ESLint CLI and flat configuration, as documented by Next.js; no dependency additions.
- Fix social-link JSON round trips and align funding precision/range with Decimal(12,2); keep server-side draft saving and parameterized Prisma operations.

## Iteration 2 — active: image reliability and access control
- Serve images through an application route with database visibility/ownership checks. Store new uploads beneath existing PRIVATE_UPLOAD_DIR, avoiding publicly served storage. Preserve access to legacy files through the guarded route.
- Validate bytes and dimensions, rotate camera images, clean up failed batches, and serialize gallery limit checks in the transaction.
- Existing Caddy configuration directly exposes legacy /uploads files with long public caching. Full legacy protection requires changing protected deploy/Caddyfile; prepare the exact change for review before asking for approval. Do not edit it without approval.

## Iteration 3 — pending: browser workflow and security regression checks
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
