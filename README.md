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
