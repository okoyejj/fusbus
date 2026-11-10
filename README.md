# FusBus Cameroon Entrepreneur Platform

Production-oriented onboarding, review, approval, investor-tracking, and investor-introduction platform for Cameroonian entrepreneurs.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- PostgreSQL with Prisma ORM
- Custom HTTP-only cookie sessions with bcrypt password hashing
- Zod validation
- Sharp image processing for resized WebP uploads and thumbnails
- Vitest and Playwright test scaffolding

## Local Setup

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL: `docker compose up -d db`
3. Install dependencies: `npm install`
4. Generate Prisma client: `npm run db:generate`
5. Run migrations: `npm run db:migrate`
6. Seed development data: `npm run db:seed`
7. Start the app: `npm run dev`

Development credentials from seed data:

- Admin: `admin@fusbus.test` / `AdminPass123!`
- Entrepreneur: `approved@fusbus.test` / `SellerPass123!`

Never enable seed credentials in production.

## Environment Variables

`DATABASE_URL`, `SESSION_SECRET`, `APP_URL`, email SMTP settings, `UPLOAD_DIR`, and `MAX_UPLOAD_MB` are documented in `.env.example`. Secrets must be set through the hosting provider and must not be committed.

## Data Model

The Prisma schema defines `User`, `SellerProfile`, `SellerMedia`, `Investor`, `InvestorEnquiry`, `InvestorTransactionReceipt`, `AdminNote`, `AuditLog`, and `Notification`. Entrepreneur application statuses are `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `MORE_INFORMATION_REQUIRED`, `APPROVED`, `REJECTED`, `SUSPENDED`, and `ARCHIVED`.

## Security Notes

The app validates server-side input, uses role checks on entrepreneur/admin routes, stores sessions in HTTP-only cookies, hashes passwords with bcrypt, soft-deletes user/profile records, keeps private entrepreneur contact data out of public selectors, applies security headers, limits upload MIME types and sizes, sanitizes filenames, generates unique stored names, and records administrative audit actions.

Add a production malware scanning provider at the upload boundary before external launch. Use managed object storage such as S3, Cloudinary, or Google Cloud Storage instead of local disk in horizontally scaled production.

## Deployment

Use hosting that supports a persistent Next.js server, PostgreSQL, secure environment variables, and image storage. Vercel with managed Postgres/object storage, Render, Fly.io, Railway, Google Cloud Run, AWS ECS, or Azure Container Apps are suitable.

Standard shared GoDaddy hosting is generally not suitable for this full server-rendered Next.js and PostgreSQL architecture. For GoDaddy, deploy a static marketing site only and host the application/API/database on a compatible platform.

## Tests

- Unit/API validation: `npm test`
- End to end: `npm run test:e2e`
- Production build: `npm run build`

## Operations

Back up PostgreSQL daily with point-in-time recovery where available. Store uploaded media in versioned object storage. Maintain a data access/correction/export/deletion workflow through admin operations and audit logs.

## Application and image recovery

Use **Save Draft** to store an incomplete application in your account. Sign in later and reopen the application to finish it. Failed saves keep entries on screen; after a session expires, sign in in another tab and retry saving.

Seller images are converted to WebP under `PRIVATE_UPLOAD_DIR/seller-images` (default `storage/private/seller-images`) and served by `/api/media/:id`. Keep this directory persistent and writable by the app. Owners and admins can view private images; public access requires approved status, publication consent, and public media. Legacy files remain readable from `UPLOAD_DIR` through the same endpoint. Image responses bypass optimization and public caching so access checks run for every request.

**Legacy deployment prerequisite:** remove the direct `/uploads/*` file-server handler from `deploy/Caddyfile`, forwarding requests to the app instead. The application blocks direct legacy URLs. Until that protected configuration change is approved and deployed, the old Caddy handler bypasses application privacy checks. Previously cached public responses cannot be recalled; clear managed proxy/CDN caches during rollout.

Set `APP_URL` to the exact browser-facing origin for request validation. Shared reset and verification environment tokens are no longer accepted. Account-specific tokens expire after 30 minutes and are queued in notifications; configure a secure notification email worker for delivery. Password-reset tokens stop working once the password changes.

Quality checks: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e`. Browser tests require a running test PostgreSQL database.
