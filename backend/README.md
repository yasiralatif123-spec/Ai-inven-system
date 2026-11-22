# Backend (Express + MongoDB)

StockFlow inventory API. Auth foundation (Phase 2) is implemented; business
routes remain public behind rollout flags until Phase 5.

## Stack
- Express.js
- MongoDB + Mongoose
- JWT access tokens + DB-backed, rotating refresh sessions (HTTP-only cookies)
- bcryptjs, helmet, zod, express-rate-limit, Resend (email, Phase 3)

## Setup
1. Copy `.env.example` to `.env` and update values. `JWT_ACCESS_SECRET`,
   `JWT_REFRESH_SECRET` and `TOKEN_PEPPER` are required; the server exits at
   startup if they are missing, too short (< 32 chars), or placeholders.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create the first owner (no credentials are hardcoded):
   ```bash
   npm run create-owner -- --email owner@example.com --password '<12+ chars>' --name 'Owner Name' --business 'StockFlow'
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

## Structure
```text
src/
  config/        # DB and startup configuration
  controllers/   # Request handlers
  middlewares/   # Auth, validation, rate-limit, origin and error middlewares
  models/        # Mongoose models
  routes/        # API route definitions
  services/      # Token and refresh-session services
  utils/         # DTO and flavor helpers
  validators/    # zod request schemas
  app.js         # Express app setup
  server.js      # Server bootstrap
scripts/
  create-owner.js  # Idempotent first-owner bootstrap
docs/
  auth-api.md      # Auth contract and operational notes
  openapi-auth.yaml
```

## Auth (Phase 2)
- `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`,
  `GET /api/auth/me`. Public `/api/auth/register` is removed; invite acceptance
  is Phase 3.
- Cookies are HTTP-only, `SameSite=Lax` (`Strict` where compatible in production)
  and `Secure` in production. Tokens are never returned in JSON.
- `AUTH_ENFORCEMENT=false` and `TENANT_ENFORCEMENT=false` are rollout flags.
  TODO: enable both in staging immediately after Phase 5, then remove the flags.

## Tests
```bash
npm test
```
Jest + supertest load `backend/.env` by absolute path in `test/setup.js`, so
`MONGODB_TEST_URI` does not need to be exported in the shell. Its database name
must contain `test` and differ from `MONGODB_URI`; connection attempts time out
after 3 seconds with a credential-safe error message. No test touches the real
database. Auth secrets and rollout flags are forced to test-only values after
`.env` is loaded, so tests stay deterministic.

## Notes
- Resend credentials stay backend-only. Development uses `onboarding@resend.dev`;
  production requires a verified sender domain.
- Deferred to Phase 8: audit log, logout-all endpoint, refresh family reuse
  detection, and a shared rate-limit store.
