# IMPLEMENTATION_PROGRESS.md

## Phase 1 — Customer & Supplier Financial Records

Status at end of this phase: **COMPLETED AND VERIFIED** (with documented limitations).
No commit or push was performed for this phase. No Phase 2 work was started.

---

### 1. Scope

- Customer financial records: `orders`, `totalPurchases`, `outstanding`.
- Supplier financial records: `totalPurchases`, `outstanding`, `payableNote`, `payableTone`, `lastPurchaseAt`.
- Backend recalculation from authoritative SaleOrder / Purchase ledgers on create, edit, status change, cancel, receive, payment and delete.
- Consistency between backend responses, customer/supplier list pages and detail pages.
- Automated Jest + Supertest coverage for all required cases, edge cases, tenant isolation and regressions.

Explicitly out of scope (unchanged): payment gateways/providers, idempotency/concurrency systems, stock-management fixes, RBAC/auth architecture, tax policy, dashboard redesign, unrelated frontend redesign.

---

### 2. Root causes discovered

1. **`Customer.orders`, `Customer.totalPurchases` and `Customer.outstanding` were write-once fields.** They were initialized in `customer.controller.js` (`orders: 0, totalPurchases: 0, outstanding: openingBalance`) and explicitly deleted from update payloads. No SaleOrder code path ever wrote to them.
2. **`Supplier.totalPurchases`, `Supplier.outstanding`, `lastPurchaseAt`, `payableNote` and `payableTone` were also write-once fields**, initialized in `supplier.controller.js` and never touched by any Purchase code path. `lastPurchaseAt` defaulted to `null` forever.
3. **All displayed customer metrics were client-derived**, from at most 200 orders returned by `GET /api/sale-orders` (`limit(200)`), and included cancelled orders. This made list/profile values dependent on a truncated client-side query rather than backend data.
4. **Supplier list used stale stored values while supplier detail derived values from purchase documents**, and the detail derivation omitted `openingBalance`, so list and profile could disagree.
5. **No centralized financial helper existed.** Any naive `$inc` approach would double-count on edit, cancel, receive and repeated status updates. The existing codebase already contained a `roundMoney` helper in `src/utils/units.js` and a `runWithSession` transaction/compensation helper in `src/utils/db.js`; both were reused rather than replaced.

Documented pre-existing code facts (not changed in this phase): sale `financials.tax` is stored but excluded from `total`; purchase/sale payment endpoints remain non-ledgered for sales; purchase cancellation reverses stock but not payments.

---

### 3. Financial definitions adopted (from existing code)

- **Customer** (`backend/src/controllers/sale-order.controller.js`, `frontend/features/customers/utils.ts`):
  - `orders` = count of active (non-Cancelled) sale orders linked by `customer.customerId`.
  - `totalPurchases` = sum of `financials.total` of active sale orders.
  - `outstanding` = `openingBalance` + sum of `financials.outstanding` of active sale orders.
- **Supplier** (`backend/src/controllers/purchase.controller.js`, `frontend/features/suppliers/supplierProfile.ts`):
  - `totalPurchases` = sum of `financials.total` of active (non-Cancelled) purchases.
  - Purchase remaining = `max(financials.total - paidAmount, 0)` per purchase (goods received does **not** change money).
  - `outstanding` = `openingBalance` + sum of purchase remaining values.
  - `lastPurchaseAt` = latest `purchaseDate` among active purchases.
  - `payableNote` / `payableTone` follow the existing supplier-create rules.

All money is rounded with the existing `roundMoney()` helper before being stored.

**Field-name note:** the task description mentions `ordersCount` and customer `lastPurchaseAt`; those fields do not exist in the schema. The actual count field is `orders`, and only Supplier has `lastPurchaseAt`. No schema changes were made.

---

### 4. Files modified

Backend (source of truth):

| Path | Why |
|---|---|
| `backend/src/utils/financials.js` (new) | Centralized, idempotent, tenant-scoped recomputation of customer and supplier summaries from their authoritative ledgers. |
| `backend/src/controllers/sale-order.controller.js` | Calls the customer recomputation after create, edit, status/cancel, payment and delete; refreshes after compensation rollback on standalone Mongo. |
| `backend/src/controllers/purchase.controller.js` | Calls the supplier recomputation after create, edit, receive, status/cancel, payment and delete; refreshes after compensation rollback. |

Frontend (display consistency only):

| Path | Why |
|---|---|
| `frontend/features/customers/components/CustomersView.tsx` | List now displays backend `Customer` financial values instead of deriving from 200 truncated orders. |
| `frontend/features/customers/hooks/useCustomerProfile.ts` | Profile uses backend `Customer` financial values; order fetching remains only for the transaction ledger tabs. |
| `frontend/features/customers/profile.ts` | `totalPaid` derivation now excludes `openingBalance` from outstanding before subtracting. |
| `frontend/features/suppliers/supplierProfile.ts` | Supplier detail `remainingPayable` now includes `openingBalance`, matching the backend `outstanding` field and the supplier list. |

Tests (new):

| Path | Why |
|---|---|
| `backend/test/customer-financials.test.js` | 11 customer tests: create, partial payment, aggregation, edit replace, cancel, delete, repeated status, missing customer, tenant isolation, list/profile consistency, zero/decimal edge cases. |
| `backend/test/supplier-financials.test.js` | 12 supplier tests: create, partial payment, aggregation, edit replace, receiving idempotence, cancel/delete, repeated status, missing supplier, tenant isolation, list/profile consistency, zero/decimal edge cases. |

No model, schema, migration, route, service, auth or stock code was changed. No dependencies were added.

---

### 5. Customer fixes completed

- [x] Creating a sale updates the correct customer's `orders`, `totalPurchases`, `outstanding`.
- [x] Partial payment does not treat `financials.total` as money received.
- [x] Multiple sales aggregate correctly (verified against DB values).
- [x] Editing replaces the old contribution (both increase and decrease verified).
- [x] Cancelling removes the sale from active outstanding and is idempotent; historical sale document is preserved.
- [x] Deleting leaves no stale totals.
- [x] Repeated status changes never double-count.
- [x] Orphan sale (invalid customer reference) does not corrupt another customer.
- [x] Cross-tenant customer cannot be updated (API + direct helper check).
- [x] List and profile return the same values as the DB.
- [x] Decimal amounts (`30.75`) and rejected zero-value sales verified.

### 6. Supplier fixes completed

- [x] Creating a purchase updates the correct supplier's summary and `lastPurchaseAt`/payable fields.
- [x] Multiple purchases aggregate correctly.
- [x] Editing replaces the previous contribution (increase and decrease verified).
- [x] Receiving (including repeated idempotent receipt) does not change money totals.
- [x] Cancelling and deleting reverse the contribution; repeated cancellation is idempotent.
- [x] Reverting status does not leave stale totals.
- [x] Missing supplier reference does not corrupt another supplier.
- [x] Cross-tenant supplier cannot be updated (API + direct helper check).
- [x] List and profile return the same values as the DB (detail now includes opening balance).
- [x] Decimal amounts (`30.75`) and rejected zero-value purchases verified.

---

### 7. Commands executed and actual results

From `backend/`:

| Command | Result |
|---|---|
| `npm test` (baseline, before changes) | PASS — 20 suites / 139 tests |
| `npx jest --runInBand test/customer-financials.test.js test/supplier-financials.test.js` | PASS — 2 suites / 23 tests |
| `npm test` (after all changes) | PASS — 22 suites / 162 tests |
| `node --check src/utils/financials.js` | PASS |
| `node --check src/controllers/sale-order.controller.js` | PASS |
| `node --check src/controllers/purchase.controller.js` | PASS |

From `frontend/`:

| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS (no output) |
| `npm run lint` | PASS — 0 errors, 8 pre-existing unrelated warnings |
| `npm run build` | PASS — Next.js 16.4.6, 21 routes generated |

Test DB: the existing `MONGODB_TEST_URI` guard in `test/helpers/test-db.js` was used unchanged. The test DB name contains "test" and differs from the production DB name; no destructive command was run against development/production data.

**Transactions:** the test MongoDB is a standalone server (no replica set), and `runWithSession()` feature-detects this: it starts a client session but does **not** call `startTransaction`. Controller tests therefore exercise the existing **compensation/rollback path**, not real ACID transactions. No test in this phase claims that real MongoDB transactions were verified.

---

### 8. Regression coverage

Existing suites all passed after the changes, including:
- Sale order creation/edit/cancel (`pricing-contract.test.js`, `sale-order-cancellation.test.js`).
- Purchase creation/edit/receive/payment paths (`pricing-contract.test.js`, `actor-name.test.js`).
- Stock movement and unit conversion (`unit-conversion.test.js`, `actor-name.test.js`).
- Tenant isolation (`phase6b-tenant.test.js`, `product-inventory-tenant.test.js`, `tenant.test.js`).
- Authentication/session/authorization (`auth.test.js`, `session.service.test.js`, `user-management.test.js`, `invite.test.js`, `password-reset.test.js`).
- Test DB safety (`test-db.test.js`, `setup-dotenv.test.js`).

---

### 9. Existing failures remaining

None in the executed suites. The 8 ESLint warnings are pre-existing and unrelated (inventory page, layout, purchase components, sales-orders utils).

---

### 10. Known limitations / follow-ups

1. **Legacy data was not reconciled.** Existing customers/suppliers whose stored summaries are already wrong keep those values until a new sale/purchase operation triggers a recalculation. Per instruction, no mass rewrite, migration or production data modification was performed. A separate, reversible reconciliation process should be approved before backfilling (e.g., a dry-run script that reports per-customer/per-supplier deltas, then an opt-in `--confirm` backfill with snapshot backups).
2. **Real MongoDB transaction atomicity is not verifiable on the current standalone test server.** The code follows the existing `runWithSession` strategy and refreshes summaries after compensation, but a replica-set test environment would be needed to assert true ACID behavior.
3. **Frontend has no automated test framework in this repository.** Financial display changes were validated with TypeScript, ESLint and a production build only; no browser-level assertions were performed.
4. **Sale order list endpoint still caps results at 200.** This no longer affects customer financial totals (they come from stored backend values), but the ledger tab itself still shows at most 200 linked orders — unchanged behavior.
5. **Cancelled sales keep their `financials` fields** (`paid`/`outstanding`) on the historical document by existing business rules; they are excluded from active customer financials. Refunds remain external/out of scope.

---

### 11. Database changes

- No schema changes, no migrations, no index changes.
- No production or development database records were reset, deleted or rewritten.
- Test database collections were cleared between tests by the existing `clearTestDB()` helper only.

---

### 12. Next phase

**Internal Payment Accounting** — do not start without explicit approval.

---

# Phase 1 — Final Code Review & Verification (2026-11-26)

## Review findings

### Confirmed bugs

1. **Concurrent recomputations could overwrite a newer ledger state.**
   - `recalculateCustomerFinancials()` / `recalculateSupplierFinancials()` read the ledger, then wrote a denormalized summary. Two concurrent calls could both read the old state and the later write could win.
   - Reproduced deterministically with two sale ledger documents but a stored customer summary of `orders: 1, totalPurchases: 20, outstanding: 20`. Expected was `2 / 40 / 40`.
   - Fixed with an in-process per-party serialization queue in `backend/src/utils/financials.js`.

2. **Plain status and manual-payment endpoints had no session/compensation around the summary write.**
   - A simulated failure in the summary write during `PATCH /api/sale-orders/:id/status` left the sale changed to `Processing` while its customer summary was stale. Reproduced: status became `Processing` despite a 500 response.
   - Fixed by wrapping plain sale status/payment and purchase status/payment mutations in `runWithSession()` with compensation on standalone MongoDB, using the same session for document and summary operations.

3. **Customer profile "Total Paid" was still derived from the client order list.**
   - `CustomerProfileSummary` summed `orders[].financials.paid` when any orders were loaded. That list is capped at 200 and could include cancelled orders, so it disagreed with the backend-authoritative values used by the customer list and stored record.
   - Fixed by always using `getCustomerFinancials(customer).totalPaid` and removing the `orders` prop from the summary component.

### Safe-by-design findings

- Every production caller of the recalculation helpers passes `businessId` from `tenantBusinessId(req)`, which is non-null only when tenant enforcement is active. The helper also scopes both the party lookup and ledger aggregation by that same `businessId`; cross-tenant direct calls return `null` without writing.
- `openingBalance` is immutable through both update APIs (`customer.controller.js` and `supplier.controller.js` delete it from update changes), so summary recalculation can safely treat it as a creation-time constant.
- Cancelled sales/purchases are excluded from active financials; historical documents are preserved.
- Goods receiving does not change supplier money totals; only `paidAmount` affects supplier outstanding.
- All stored money is rounded with the existing `roundMoney()` helper (binary JS `Number` fields in MongoDB) and clamped to zero where a negative contribution would be invalid. Decimal tests (`10.25 * 3`) pass.
- No payment gateway or new payment workflow was added. Only existing `paidAmount`, `financials.outstanding`, `paymentStatus`, and manual payment endpoints were inspected and preserved.

## Business decisions requiring clarification (not changed)

- Sale statuses other than `Cancelled` (`Pending Approval`, `Credit Hold`, etc.) count as active customer purchases. This matches the previous client-side rule of "all non-cancelled orders".
- Purchase statuses other than `Cancelled`, including `Draft`, count as active supplier purchases. This matches the previous supplier detail derivation.
- Supplier `lastPurchaseAt` is the maximum `purchaseDate`, not the receipt date.
- `openingBalance` remains editable only at creation time; if the business expects opening-balance corrections, that rule needs an explicit product decision plus a safe correction workflow.

## Fixes applied

| Area | Fix |
|---|---|
| `backend/src/utils/financials.js` | Added serialized recomputation queue per `(customer|supplier, businessId, id)`; both helpers now run their read/write body inside that queue. |
| `backend/src/controllers/sale-order.controller.js` | Plain status and manual payment now use `runWithSession()` + same-session recalculation + standalone compensation; payment validation is rechecked on the fresh document and routed through `handleControllerError`. |
| `backend/src/controllers/purchase.controller.js` | Plain status and manual payment now use `runWithSession()` + same-session recalculation + standalone compensation; added `NotFoundError` handling used by the fresh-document check. |
| `backend/test/customer-financials.test.js` | Added deterministic concurrency test and failed-summary-write rollback test; both assert actual DB values. |
| `backend/test/supplier-financials.test.js` | Added deterministic concurrency test and failed-summary-write rollback test; both assert actual DB values. |
| `frontend/features/customers/components/CustomerProfileSummary.tsx` | Total Paid now comes from the backend-derived customer summary only. |
| `frontend/features/customers/components/CustomerProfile.tsx` | Removed the now-unused `orders` prop. |

## Exact files changed in this review

Modified tracked files:

- `backend/src/controllers/purchase.controller.js`
- `backend/src/controllers/sale-order.controller.js`
- `frontend/features/customers/components/CustomerProfile.tsx`
- `frontend/features/customers/components/CustomerProfileSummary.tsx`
- `frontend/features/customers/components/CustomersView.tsx`
- `frontend/features/customers/hooks/useCustomerProfile.ts`
- `frontend/features/customers/profile.ts`
- `frontend/features/suppliers/supplierProfile.ts`

New files:

- `IMPLEMENTATION_PROGRESS.md`
- `backend/src/utils/financials.js`
- `backend/test/customer-financials.test.js`
- `backend/test/supplier-financials.test.js`

Pre-existing untracked `.agents/` and `skills-lock.json` were left untouched. No commit or push was performed.

## Tests added

- Customer: concurrent recomputations cannot overwrite newer ledger state; failed summary write rolls back a plain status update.
- Supplier: concurrent recomputations cannot overwrite newer ledger state; failed summary write rolls back a plain status update.
- Both suites continue to cover create, edit, cancel, delete, repeated status changes, payments, opening balance, tenant isolation, decimal amounts, and list/detail consistency against MongoDB values.

## Commands executed and actual results

Backend (`backend/`):

| Command | Result |
|---|---|
| `npm test` (baseline before review changes) | PASS — 22 suites / 162 tests |
| `npx jest --runInBand test/customer-financials.test.js test/supplier-financials.test.js` (after fixes) | PASS — 2 suites / 27 tests |
| `npx jest --runInBand test/phase6b-tenant.test.js test/tenant.test.js test/product-inventory-tenant.test.js test/customer-financials.test.js test/supplier-financials.test.js` | PASS — 5 suites / 45 tests |
| `npm test` (after all review fixes) | PASS — 22 suites / 166 tests |
| `node --check src/utils/financials.js` | PASS |
| `node --check src/controllers/sale-order.controller.js` | PASS |
| `node --check src/controllers/purchase.controller.js` | PASS |

Frontend (`frontend/`):

| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS (no output) |
| `npm run lint` | PASS — 0 errors, 8 pre-existing unrelated warnings |
| `npm run build` | PASS — Next.js 16.4.6, 21 routes generated |

Repository:

| Command | Result |
|---|---|
| `git diff --check` | PASS — only pre-existing LF/CRLF notices |
| `git status --short` | Confirmed only the files listed above changed; no commit/push |

## Replica-set concurrency / transaction verification

Not possible in the available environment. A direct read-only `hello` command against `MONGODB_TEST_URI` returned `setName: null`, `msg: null`, `transactionsSupported: false`. Therefore `runWithSession()` uses its standalone session + compensation path; no ACID transaction claim is made. The new serialization fix is verified in-process only: multiple Node processes would still require database-level coordination.

## Remaining limitations

1. Legacy incorrect customer/supplier summaries were not backfilled; no production data was modified.
2. In-process serialization does not cover a multi-process deployment.
3. Real MongoDB transaction atomicity remains unverified without a replica-set test database.
4. Frontend has no automated browser test framework; changes were validated by TypeScript, ESLint, and production build only.
5. The sale-order list still caps results at 200; this affects only the visible ledger, not stored financial totals.

## No gateway / no new payment system

Confirmed: no Stripe, PayPal, JazzCash, Easypaisa, gateway API, payment collection, or new payment workflow was introduced. Existing manual payment fields and endpoints were preserved and only made session/compensation safe.
