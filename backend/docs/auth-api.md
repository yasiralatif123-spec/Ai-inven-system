# Auth API contract (invite-only)

Base path: `/api/auth`

Authoritative machine-readable contract: [`openapi-auth.yaml`](./openapi-auth.yaml).
This document explains behavior and operational details that the spec does not
encode. Business APIs remain public in this phase (`AUTH_ENFORCEMENT=false`).

## Scope of the current implementation (Phase 3)

| Endpoint | Status |
|---|---|
| `POST /api/auth/login` | Implemented |
| `POST /api/auth/refresh` | Implemented |
| `POST /api/auth/logout` | Implemented |
| `GET /api/auth/me` | Implemented |
| `POST /api/auth/register` | **Removed** - registration is invite-only |
| `POST /api/auth/invites` | Implemented (owner/admin) |
| `GET /api/auth/invites` | Implemented (owner/admin) |
| `POST /api/auth/invites/validate` | Implemented (public, token proof) |
| `POST /api/auth/invites/accept` | Implemented (public, token + exact email) |
| `POST /api/auth/invites/:id/revoke` | Implemented (owner/admin) |
| `POST /api/auth/forgot-password` | Implemented (public, anti-enumeration 202) |
| `POST /api/auth/reset-password` | Implemented (public, single-use token) |
| `GET /api/auth/users` | Implemented (owner/admin) |
| `PATCH /api/auth/users/:id/role` | Implemented (owner/admin, guarded) |
| `PATCH /api/auth/users/:id/deactivate` | Implemented (owner/admin, guarded) |

## Identity model

- `owner`, `admin`, `user`. Every user belongs to a `Business` via `businessId`.
- Invited users join the owner's business and share its data. `businessId` will
  become the enforcement boundary in Phase 5.
- `role` is **never** accepted from a request body. It comes from the invite and
  from server-side role checks. An owner can invite admins and users; an admin
  can invite users only; nobody can invite an owner.
- Deferred to Phase 8: `AuditLog`, a logout-all endpoint, and refresh-token
  family reuse detection. Session revocation on password reset, deactivation
  and role change is still part of the core design.

## Session lifecycle

1. `POST /api/auth/login` with `{ email, password }`.
2. Server verifies the password hash (bcryptjs), then checks the user is active.
3. Server issues:
   - an access JWT (`JWT_ACCESS_SECRET`, ~15m) containing `sub`, `role`,
     `businessId`, `sid` and `ver` (token version);
   - an opaque-to-the-client refresh JWT (`JWT_REFRESH_SECRET`, ~7d) containing
     `sub`, `sid`, `jti`;
   - a `RefreshSession` document keyed by an HMAC-SHA256 hash of the refresh JWT
     using `TOKEN_PEPPER`.
4. Both tokens are set as HTTP-only cookies (`accessToken`, `refreshToken`).
   They are never returned in the response body and must never be put into
   `localStorage`.
5. Every authenticated request verifies the access JWT, loads the `RefreshSession`
   by `sid`, and checks that the session is not revoked/expired, the user is
   active, and `ver` still matches `tokenVersion`.
6. `POST /api/auth/refresh` verifies and rotates the refresh token: the old hash
   is replaced, old cookies are overwritten, and a new access token is issued.
7. `POST /api/auth/logout` marks that single session revoked and clears cookies.
   Other sessions for the same user are unaffected (logout-all is Phase 8).

### Response shape

Every auth response uses `{ "message": string, "user": UserDto? }`. `UserDto`
contains `id`, `name`, `email`, `role`, `businessId`, `businessName`,
`emailVerified`, `lastLoginAt`. It never contains `password`, `tokenVersion`,
or token hashes.

### Errors

All errors use `{ "message": string, "errors"?: [{ path, message }] }`.

| Status | Meaning |
|---|---|
| 400 | Body failed validation (zod). |
| 401 | Invalid/expired/revoked session, or bad credentials. Login deliberately returns one generic message for unknown email and wrong password. |
| 403 | Unsafe method rejected by the Origin/Referer check, or role not allowed. |
| 429 | Rate limit exceeded. |
| 500 | Unexpected server error; stack included only outside production. |

## Transport security

- Deploy behind the Next.js same-origin `/api` rewrite; call relative `/api` paths.
- Cookies: `HttpOnly`, `SameSite=Lax` (`Strict` in production where compatible),
  `Secure` in production.
- All `POST`/`PUT`/`PATCH`/`DELETE` requests are checked against `CLIENT_URL`
  using `Origin`, falling back to `Referer`. Requests with neither header are
  allowed so non-browser clients (curl, Postman, monitoring) still work; modern
  browsers send `Origin` for unsafe methods, which is what protects the cookie
  session from cross-site form posts.
- `helmet()` is enabled. `TRUST_PROXY` must be a numeric hop count (not `true`)
  so rate limits key on the real client IP behind the proxy.

## Rate limits

| Endpoint | Limit | Key |
|---|---|---|
| `POST /auth/login` | 10 / 15 min | client IP + normalized email |
| `POST /auth/forgot-password` | 3 / hour | client IP |
| `POST /auth/invites/validate` | 20 / hour | client IP |
| `POST /auth/refresh` | 60 / hour | client IP |

Limits are in-memory and per process; a shared store is a Phase 8 hardening item.

## Configuration

See backend `.env.example`. Required at startup (server exits when missing or
shorter than 32 characters): `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`TOKEN_PEPPER`. Email is Resend, backend-only; development uses the
`onboarding@resend.dev` test sender and production requires a verified domain.
`RESEND_API_KEY` and `EMAIL_FROM` are never exposed to the frontend.

`AUTH_ENFORCEMENT` and `TENANT_ENFORCEMENT` are rollout flags kept for the staged
migration. TODO: enable both in staging immediately after Phase 5, then remove
the flags and their conditionals entirely.

## Phase 3 endpoints

### Invites

- `POST /api/auth/invites` (owner/admin): creates a pending invite for `admin`
  or `user` in the caller's business, stores only `tokenHash`, emails the raw
  token, and returns an `InviteDto`. If email delivery fails, the invite is
  deleted and the endpoint returns `502`.
- `GET /api/auth/invites` (owner/admin): lists invites for the current business.
- `POST /api/auth/invites/validate` (public, rate-limited): validates a token
  without revealing account existence; returns invite details when valid.
- `POST /api/auth/invites/accept` (public): requires token + exact email match,
  atomically consumes the pending invite, creates the user with
  `emailVerified: true`, and returns a safe `UserDto`. Reuse/expired/invalid
  invites return `409`.
- `POST /api/auth/invites/:id/revoke` (owner/admin): revokes a pending invite.

Invite rules: owner can invite admin/user; admin can invite user only; no one
can invite owner. Duplicate active user or pending invite for the same email is
rejected with `409`.

### Password reset

- `POST /api/auth/forgot-password` (public, rate-limited): always returns `202`
  with the same message to avoid account enumeration. For an active user, it
  invalidates previous unused reset tokens, creates a new single-use
  `AuthToken(type=password_reset)`, and attempts email delivery.
- `POST /api/auth/reset-password` (public): consumes the token atomically,
  updates the password hash, sets `passwordChangedAt`, increments
  `tokenVersion`, revokes all refresh sessions, and returns a sign-in-again
  message. Invalid/expired/used tokens return `400`.

### Workspace user management

- `GET /api/auth/users` (owner/admin): lists users in the current business.
- `PATCH /api/auth/users/:id/role` (owner/admin): changes `admin`/`user` role.
  Admin cannot grant admin or manage admins/owner; self-change is blocked.
  Successful role change increments `tokenVersion` and revokes sessions.
- `PATCH /api/auth/users/:id/deactivate` (owner/admin): sets `isActive=false`,
  increments `tokenVersion`, and revokes sessions. Owner account cannot be
  changed here; self-deactivation is blocked.

## First-owner bootstrap

`npm run create-owner` accepts `--email`, `--password`, `--name` and
`--business` (or the matching `OWNER_*` / `BUSINESS_NAME` env vars). It is
idempotent for an existing owner in the same business and never hardcodes
credentials. It creates the `Business` and the first `owner` user only; it does
not seed or modify any inventory data.

## Testing

Jest + supertest run only against `MONGODB_TEST_URI`, whose database name must
contain `test` and must differ from `MONGODB_URI`. Run `npm test` from
`backend/`. No test connects to the real database.
