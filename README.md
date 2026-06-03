# Fire Extinguisher Management System (FEMS)

A RESTful, service-oriented fire-safety management system for **TZW Ltd** — manage fire
extinguishers, schedule inspections, log maintenance, monitor compliance, and generate
real-time reports with PDF/CSV export.

Built as a **modular monolith** on Next.js 16 (App Router + Route Handlers), with five
cleanly-separated REST service domains, JWT auth + RBAC, and a Supabase Postgres database.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 16 (App Router, Route Handlers), React 19, TypeScript |
| Database | Supabase PostgreSQL via Drizzle ORM (`postgres-js`) |
| Auth | JWT (`jose`, HS256) + `bcryptjs`, DB-backed sessions, RBAC |
| Validation | Zod |
| Logging | Pino + audit-log table |
| Reports | `pdfkit` (PDF), native CSV |
| API Docs | OpenAPI 3.1 + Swagger UI (`/api-docs`) |
| Styling | Tailwind CSS v4, Phosphor icons |

## Service domains (all under `/api/v1`)

1. **User Management** — register, login, logout, profile, password recovery, admin user CRUD.
2. **Fire Extinguisher Management** — register/list/update/delete, status tracking.
3. **Inspection Management** — schedule, track, notify personnel.
4. **Maintenance Management** — log activities, maintenance history.
5. **Reporting** — stock, inspection, expired, and maintenance reports + dashboard analytics, exportable as PDF/CSV.

## Roles (RBAC)

- **Admin** — full access incl. user management and deletes.
- **Inspector** — register/update extinguishers, complete inspections, log maintenance.
- **User** — view equipment, schedule inspections, manage own profile.

---

## Getting started

### 1. Prerequisites
- Node.js **20.9+**
- A Supabase project (or any PostgreSQL 14+)

### 2. Install
```bash
npm install
```

### 3. Configure environment
Copy `.env.example` to `.env.local` and fill in:
```bash
DATABASE_URL=   # Supabase POOLED transaction URL (port 6543)
DIRECT_URL=     # Supabase SESSION URL (port 5432) — used for migrations
JWT_SECRET=     # openssl rand -base64 32
```

### 4. Create schema + seed sample data
```bash
npm run db:migrate   # applies drizzle/0000_*.sql to the database
npm run db:seed      # inserts sample users, extinguishers, inspections, maintenance
```

Seeded logins (password `Password123`):
| Email | Role |
|---|---|
| admin@fems.local | admin |
| inspector@fems.local | inspector |
| user@fems.local | user |

### 5. Run
```bash
npm run dev          # http://localhost:3000
```

- App: http://localhost:3000
- API docs (Swagger): http://localhost:3000/api-docs
- OpenAPI JSON: http://localhost:3000/api/openapi.json
- Health: http://localhost:3000/api/v1/health

---

## NPM scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:generate` | Generate SQL migration from the Drizzle schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (dev) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Seed sample data |

---

## API conventions

- **Response envelope:** `{ "success": true, "data": ..., "meta": {...} }` or `{ "success": false, "error": { "code", "message", "details" } }`.
- **Auth:** send `Authorization: Bearer <jwt>` (API/Postman) or rely on the httpOnly `access_token` cookie (web UI). Login returns the token in the body.
- **Pagination:** all list endpoints accept `?page`, `?limit` (max 100), `?sort`, `?order`, `?q`; responses include `meta` with `total`, `totalPages`, `hasNext/hasPrev`.
- **Reports export:** append `?format=csv` or `?format=pdf` to any `/api/v1/reports/*` endpoint.

See **[Postman collection](postman/FEMS.postman_collection.json)** and **`/api-docs`** for the full contract.

---

## Security

- Passwords hashed with bcrypt (cost 12); JWT signed HS256; sessions revocable in DB (true logout invalidation).
- RBAC enforced in every protected route handler (401/403).
- Zod validation on all inputs; parameterized queries (no SQL injection).
- Security headers via `next.config.ts`: CSP, HSTS (prod), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Credential-aware CORS for `/api/*` (allow-list via `CORS_ALLOWED_ORIGINS`).
- `proxy.ts` provides optimistic UI route protection (not the security boundary).

---

## Project structure

```
app/
  (auth)/            login, register, forgot/reset password
  (dashboard)/       overview, extinguishers, inspections, maintenance, reports, users, profile
  api/v1/...         REST route handlers (the 5 service domains)
  api/openapi.json/  OpenAPI document
  api-docs/          Swagger UI
lib/
  db/                Drizzle schema + client
  auth/              jwt, password, session, rbac
  http/              handler (withApi), errors, responses, pagination
  services/          per-domain data access
  validation/        Zod schemas
  reports/           CSV + PDF renderers
components/           UI primitives + dashboard shell
drizzle/             generated SQL migrations (= schema export)
scripts/seed.ts      sample-data seeder
postman/             Postman collection
```

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for Vercel + Supabase deployment and database export instructions.
