# Deployment & Database Export

## Architecture
- **App** (Next.js) → Vercel
- **Database** → Supabase Postgres
- App connects to Supabase via the **pooled transaction URL** (`DATABASE_URL`, port 6543, `prepare:false`).
- Migrations run against the **session URL** (`DIRECT_URL`, port 5432).

---

## A. Database (Supabase)

1. Create a Supabase project. In **Project Settings → Database → Connection string**, copy:
   - **Transaction pooler** (port 6543) → `DATABASE_URL`
   - **Session pooler** (port 5432) → `DIRECT_URL`
2. Locally, set both in `.env.local`, then apply schema + seed:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

---

## B. Deploy the app to Vercel

1. Push this repo to GitHub.
2. In Vercel, **New Project → import the repo** (framework auto-detected: Next.js).
3. Add Environment Variables (Production + Preview):
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Supabase transaction pooler URL (6543) |
   | `DIRECT_URL` | Supabase session URL (5432) |
   | `JWT_SECRET` | a strong random secret (`openssl rand -base64 32`) |
   | `APP_URL` | your Vercel URL, e.g. `https://fems.vercel.app` |
   | `CORS_ALLOWED_ORIGINS` | same as `APP_URL` |
4. **Deploy.** Migrations are not run automatically — run `npm run db:migrate` locally against the same `DIRECT_URL`, or add it to a CI step.
5. Verify:
   - `https://<app>/api/v1/health` → `{ "database": "up" }`
   - `https://<app>/api-docs` → Swagger UI renders
   - Log in and download a PDF/CSV report

> Node runtime: the API routes use Node APIs (`pdfkit`, `postgres-js`); they run on Vercel's Node.js serverless runtime (default). `pdfkit` is listed in `serverExternalPackages`.

---

## C. Database export (deliverable)

**Schema** is captured as a committed SQL migration: [`drizzle/0000_*.sql`](drizzle/). It fully recreates all tables, enums, indexes, and foreign keys.

**Schema + sample data dump** (requires `pg_dump`, using the session/`DIRECT_URL`):
```bash
# Full dump (schema + data)
pg_dump "$DIRECT_URL" --no-owner --no-privileges -f fems_export.sql

# Schema only
pg_dump "$DIRECT_URL" --schema-only --no-owner -f fems_schema.sql

# Data only
pg_dump "$DIRECT_URL" --data-only --no-owner -f fems_data.sql
```
Alternatively, reproduce the exact dataset anywhere with `npm run db:migrate && npm run db:seed`.

You can also export from the **Supabase dashboard → Database → Backups / SQL Editor**.

---

## D. Report export samples (deliverable)

With the app running and authenticated, fetch:
```bash
curl -b cookies.txt "http://localhost:3000/api/v1/reports/expired?format=pdf"   -o expired.pdf
curl -b cookies.txt "http://localhost:3000/api/v1/reports/stock?period=yearly&format=csv" -o stock.csv
```
Or use the **Reports** page in the UI → CSV / PDF buttons. Save the downloaded files as the sample deliverables.
