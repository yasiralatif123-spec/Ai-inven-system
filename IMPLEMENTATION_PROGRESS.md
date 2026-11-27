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

---

# Phase 2 — Internal Payment Accounting & Payment Integrity

## Step 1 — Inspection (before changes)

### Existing payment architecture

- **Sale orders** (`backend/src/models/SaleOrder.js`, `backend/src/controllers/sale-order.controller.js`):
  - `financials.paid`, `financials.outstanding`, `paymentStatus` (`paid` / `partial` / `unpaid`), `paymentLabel`, and `paymentMethod` exist.
  - There is **no sale `payments` array** and no payment record schema.
  - `POST /api/sale-orders/:id/payment` updates the financial fields in place and calls `recalculateCustomerFinancials()`.
  - Create/edit derive `paid` from `paymentStatus` and `amountReceived` in `buildOrderChanges()`.
- **Purchases** (`backend/src/models/Purchase.js`, `backend/src/controllers/purchase.controller.js`):
  - `paidAmount` and an embedded `payments` array (`amount`, `method`, `reference`, `paidAt`, `createdBy`, `_id`) already exist.
  - `POST /api/purchases/:id/payment` pushes a payment record, increments `paidAmount`, and calls `recalculateSupplierFinancials()`.
  - Create accepts `paymentAmount`; edit preserves `paidAmount` / `payments` by overriding the generated changes.
  - There is no stored purchase payment-status field; list filters are derived in the frontend.
- Both routers apply `enforceTenantAuth`, and both controllers scope reads/writes with `scopedFilter(req, ...)` / `tenantFilter`.
- Both use `runWithSession()`; the available test MongoDB is standalone, so the exercised behavior is compensation, not ACID transactions.
- Frontend payment services simply forward `{ amount, method }` for sales and `{ amount, method, reference }` for purchases.

## Step 2 — Audit

### Confirmed bugs and root causes

1. **Sale payments leave no record.** Root cause: `SaleOrder` has no `payments` schema and `recordSaleOrderPayment()` only mutates `financials`. This makes payment history unauditable and impossible to reconcile.
2. **No idempotency on either payment endpoint.** Root cause: neither endpoint accepts or stores an idempotency key, and purchase records have no uniqueness constraint. A double click or retry can create two purchase records or apply two sale increments.
3. **Concurrent payments can lose updates.** Root cause: both endpoints read the document, validate against stale `outstanding` / `paidAmount`, then save. Two concurrent requests can both pass validation and the later write can overwrite the earlier one.
4. **Invalid numeric payment values are not strictly parsed.** Root cause: `toNumber()` coerces malformed strings to the fallback `0`, producing a generic “greater than zero” error instead of rejecting the value as invalid.
5. **Sale edit can silently reclassify or erase payment accounting.** Root cause: `buildOrderChanges()` recomputes `paid` from the submitted `paymentStatus`/`amountReceived` without referencing existing records. A later edit can set paid back to zero without changing any payment record.
6. **Purchase edit can leave an overpaid document.** Root cause: `updatePurchase()` preserves `paidAmount` even when the edited total is reduced below the recorded payments; no edit-time guard exists.
7. **Cancelled purchases can still receive payments.** Root cause: `recordPurchasePayment()` checks only that the purchase exists, unlike the sale endpoint which rejects cancelled documents.
8. **Payment records carry no idempotency key and no in-document uniqueness validation.** Root cause: schema gap on both sale and purchase payment subdocuments.
9. **Initial payments are inconsistent.** Purchase create stores an initial payment record, but sale create/edit with `paid`/`partial` stores only derived totals and no record.

### Proposed fixes

- Add a consistent embedded payment-record schema to both sale and purchase documents, including `idempotencyKey`, `amount`, `method`, `reference`, `paidAt`, and `createdBy`, plus in-document uniqueness validation for non-empty keys.
- Add a shared payment utility for strict amount parsing, idempotency-key resolution, record construction, and derived paid/outstanding/status calculations. Backend remains authoritative; no frontend-supplied paid amount is trusted.
- Replace read-then-save payment writes with conditional atomic updates using an optimistic `__v` guard, a `payments.idempotencyKey != key` guard, and a balance guard. Retry on version conflicts; replay the stored result on duplicate keys.
- Preserve `runWithSession()` and add standalone compensation for summary-recalculation failures.
- On sale/purchase edits, derive paid amounts from immutable records, reject reductions through edit, reject overpayment, and append a record only when an edit explicitly increases paid through the existing status/amount fields.
- Reject payments against cancelled purchases as well as cancelled sales.
- Generate a stable idempotency key per payment-dialog submission in the frontend and forward it to the backend. Backend still accepts explicit keys from any client; a deterministic fallback preserves compatibility with existing callers/tests.

## Step 3 — Implementation

### New files

| Path | Why |
|---|---|
| `backend/src/utils/payment-accounting.js` | Shared strict money parsing, idempotency-key resolution, immutable payment-record construction, ledger sums, legacy-balance migration, and sale payment-state derivation. |
| `backend/src/models/PaymentRecord.js` | Shared embedded payment subdocument schema (`amount`, `method`, `reference`, `paidAt`, `createdBy`, `idempotencyKey`) with in-document duplicate-key validation. |
| `backend/test/payment-integrity.test.js` | 33 deterministic MongoDB-backed payment-integrity tests. |

### Modified files

| Path | Why |
|---|---|
| `backend/src/models/SaleOrder.js` | Adds `payments: paymentRecordsField`; sale payments are now recorded on the same document as the order. |
| `backend/src/models/Purchase.js` | Replaces the old purchase-only payment subdocument with the shared `paymentRecordsField`, adding idempotency keys and uniqueness validation. |
| `backend/src/controllers/sale-order.controller.js` | Creates immutable records for initial/edit payments; sale edit derives paid state from records, rejects paid reductions and overpayment; payment endpoint uses strict parsing, conditional `__v` + idempotency-key updates, replay/conflict handling, fresh reads, and standalone compensation. |
| `backend/src/controllers/purchase.controller.js` | Stores an idempotency key on initial payments; rejects cancelled-document payments; enforces ledger-based overpayment guard on edit; makes payment writes conditional and replayable with compensation. |
| `frontend/features/sales-orders/types.ts` | Adds optional `idempotencyKey` to `PaymentInput`. |
| `frontend/features/sales-orders/components/RecordPaymentDialog.tsx` | Generates one stable key per mounted dialog and forwards it with each payment submission; existing submit button already blocks repeat clicks while saving. |
| `frontend/features/purchases/types.ts` | Adds optional `idempotencyKey` to `PurchasePaymentInput`. |
| `frontend/features/purchases/components/RecordPurchasePaymentDialog.tsx` | Generates one stable key per mounted dialog and forwards it with each payment submission. |
| `frontend/features/purchases/components/PurchasesView.tsx` | Mounts the payment dialog only while a purchase is selected, so each new dialog gets a fresh key while retries of the same submission keep the same key. |

No payment gateway/provider was added. No `businessId`, tenant middleware, route, auth, role, status enum, stock rule, snapshot, or Phase 1 recalculation behavior was removed or weakened.

## Step 4 — Payment behavior after the fix

- Every recorded manual sale and purchase payment now has an embedded immutable record with amount, method, reference, timestamp, actor, and idempotency key.
- `financials.paid` (sale) and `paidAmount` (purchase) are recomputed from the recorded ledger on each payment and on edit; status remains an input/workflow field for sales but is authoritative-derived on payment completion instead of being trusted as proof of money received.
- Explicit `Idempotency-Key` headers and `idempotencyKey` bodies are supported. A deterministic legacy fallback keeps unchanged existing clients safe from identical retries.
- Duplicate keys replay the original result without adding a record; a reused key with a different amount returns 409.
- Conditional writes guard on `__v` + absence of the payment key; retries re-read and revalidate. Concurrent different-key payments both record; concurrent overpayments cannot both pass the balance check.
- Edits restore a snapshot only when their own conditional write succeeded, so a losing edit cannot overwrite a payment that landed concurrently.
- Standalone MongoDB failures in party-summary recalculation are compensated by restoring the payment document and refreshing the summary. Legacy documents with paid totals but no ledger are migrated with one `legacy_balance_<documentId>` carried-forward record on the first new payment.

## Step 5 — Tests executed and exact results

From `backend/`:

| Command | Result |
|---|---|
| `npx jest test/payment-integrity.test.js --runInBand` | PASS — 1 suite / 33 tests |
| `npx jest test/payment-integrity.test.js test/customer-financials.test.js test/supplier-financials.test.js test/phase6b-tenant.test.js test/tenant.test.js test/product-inventory-tenant.test.js --runInBand` | PASS — 6 suites / 78 tests |
| `npm test -- --runInBand` | PASS — 23 suites / 199 tests |
| `node --check src/controllers/sale-order.controller.js` | PASS |
| `node --check src/controllers/purchase.controller.js` | PASS |
| `node --check src/utils/payment-accounting.js` | PASS |
| `node --check src/models/PaymentRecord.js` | PASS |

The 33 new tests assert actual MongoDB document values with `findById(...).lean()` after each API call: full/partial/multiple sale and purchase payments, initial payment records, legacy paid balance migration, malformed/zero/negative/scientific-notation amounts, overpayment, duplicate replay, key-with-different-amount conflict, deterministic concurrent payments, concurrent balance enforcement, edit history preservation, edit reduction rejection, purchase edit overpayment guard, cancelled sale/purchase rejection, failed-summary rollback, Phase 1 party-summary recalculation, and cross-tenant payment rejection with enforcement explicitly enabled.

From `frontend/`:

| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS (no output) |
| `npm run lint` | PASS — 0 errors, 8 pre-existing unrelated warnings |
| `npm run build` | PASS — Next.js 16.4.6, 21 routes generated |

Repository:

| Command | Result |
|---|---|
| `git diff --check` | PASS — only pre-existing LF/CRLF notices |
| `git status --short` | Only Phase 1/Phase 2 intended files changed; pre-existing untracked `.agents/` and `skills-lock.json` untouched; no commit/push |

## Step 6 — Review, risks, and final status

### Verified

- Tenant enforcement was explicitly enabled for cross-tenant payment tests; foreign-tenant requests returned 404 and left both ledger and party summary unchanged.
- Existing Paid/Unpaid/Pending dropdown/status behavior and all prior suites remain intact.
- `businessId` and `scopedFilter(req, ...)`/`tenantFilter` remain on every new read and write path.
- No production/development database was reset or modified; only the test DB was cleared by the existing helper.

### Remaining risks / limitations

1. Test MongoDB is standalone (`transactionsSupported: false`); real ACID transaction behavior is not verifiable here. Standalone compensation is tested, not replica-set atomicity.
2. Optimistic concurrency retries are in-process; a multi-process deployment still benefits from the conditional database guards but does not have a distributed lock or real transactions on standalone Mongo.
3. Legacy deterministic fallback dedupes identical requests from unchanged clients, so two genuinely identical sequential payments from an old client require an explicit key to be recorded separately.
4. Frontend has no browser test framework; dialog key wiring was validated by TypeScript, ESLint, and a production build only.
5. No refunds, credit transfers, or allocation of payments across documents were introduced; those remain external business decisions.

Final Phase 2 status: **COMPLETED (with the documented standalone-MongoDB and legacy-client limitations above).**

---

# Phase 3 — Stock Integrity, Inventory Movements & Quantity Validation

## Step 1 — Mandatory initial inspection (before changes)

### Repository state

- Current commit: `c8ea6f0 fix: enforce manual payment integrity`.
- Working tree before Phase 3 changes: only pre-existing untracked `.agents/` and `skills-lock.json`; no tracked modifications. Both paths are preserved.
- No database reset, production data change, commit, or push has been performed.

### Schemas and utilities inspected

- `backend/src/models/Product.js`: `openingStock` is an unvalidated Number and is the canonical stock field (base Pieces). `businessId` and `createdByUserId` are present.
- `backend/src/models/StockMovement.js`: immutable-by-convention fields already exist (`product`, `sku`, `productTitle`, `type`, `direction`, `quantity`, `originalQuantity`, `originalUnit`, `baseQuantity`, `previousStock`, `newStock`, `unit`, `reason`, `reference`, `notes`, `performedBy`, `partyName`, `businessId`, `createdByUserId`, timestamps). Normal users have no explicit immutability guard on the existing DELETE endpoint.
- `backend/src/models/SaleOrder.js`: item quantities use `quantity`, `baseQuantity`, `unitLabel`, and `stockDeducted`; sale payments were already added in Phase 2.
- `backend/src/models/Purchase.js`: item quantities use `quantity`, `baseQuantity`, `receivedQuantity`, `receivedBaseQuantity`, `receipts`, and `unit`; purchase payments were already added in Phase 2.
- `backend/src/utils/units.js`: Piece=1, Box=12, Carton=24. `toBasePieces()` rounds and accepts fractional numbers; canonical prices stay per Piece. `parseMoneyInput()` is strict for money but there is no strict whole-quantity parser.
- `backend/src/utils/db.js`: `runWithSession()` uses a real transaction only when MongoDB reports replica-set/sharded support; standalone mode relies on caller compensation.
- `backend/src/utils/tenant.js`: `tenantFilter()`, `findOwned()`, and `resolveBusinessId()` are the existing tenant boundary.
- `backend/src/utils/financials.js`: Phase 1 customer/supplier recalculation is unchanged by this audit.
- `backend/src/utils/payment-accounting.js`: Phase 2 payment ledger behavior is unchanged by this audit.
- Routes inspected: `product.routes.js`, `inventory.routes.js`, `sale-order.routes.js`, `purchase.routes.js`. All apply `enforceTenantAuth`.
- Existing tests inspected: `unit-conversion.test.js`, `product-inventory-tenant.test.js`, `pricing-contract.test.js`, `sale-order-cancellation.test.js`, `actor-name.test.js`, `customer-financials.test.js`, `supplier-financials.test.js`, `payment-integrity.test.js`, `phase6b-tenant.test.js`, `tenant.test.js`.

### Existing business rules confirmed from code/history

- Piece is the only stock unit; Box and Carton are display/input units converted to 12 and 24 base Pieces.
- Product prices remain canonical per Piece; `priceUnit` and `uom` are input/display preferences only.
- Sales deduct stock at order creation, including `Pending Approval` and `Credit Hold`; cancellation restores stock only when the sale was not `Delivered`.
- Purchases add stock only when `Received` or when a GRN records a positive received delta; `Draft` and `Ordered` do not add stock.
- Delivered sales are not restocked on cancellation.
- No reserved-stock model exists; the frontend’s `reserved: 0` is display-only. Deduction at sale creation is the current internally consistent rule and is not being redesigned in Phase 3.

## Step 2 — Stock mutation audit and root causes

### Every backend stock mutation path inspected

| Operation | Current implementation | Stock effect | Movement | Risk / root cause |
|---|---|---|---|---|
| Product create | `product.controller.js::createProduct`, line 228: `openingStock: toNumber(openingStock)` | Sets initial stock directly | None | Accepts decimals, negatives, NaN→0; initial stock has no traceability. |
| Product edit | `product.controller.js::updateProduct`, line 394: `product.openingStock = toNumber(openingStock); product.save()` | Replaces stock directly | None | Silent stock rewrite; no validation; no concurrency guard; no movement. |
| Product delete | `product.controller.js::deleteProduct` | Removes product and its stock | None | Remaining stock disappears without a movement. |
| Manual stock adjustment | `inventory.controller.js::adjustStock` | Conditional `$inc` with `openingStock >= baseQty` for deductions | Adjustment in/out created after update; stock compensated if movement creation fails | `Math.floor(Number(quantity))` silently truncates decimals and coerces invalid values; add path is unconditional but atomic. |
| Movement delete/reversal | `inventory.controller.js::deleteStockMovement` | Reverses stock, then **deletes** the movement | Original movement deleted | Historical record is rewritten; repeated calls can reverse twice; no compensating-movement preference. |
| Purchase create | `purchase.controller.js::createPurchase` → `buildPurchaseChanges` → `applyStockReceipt` | Adds stock only for `Received` status | Purchase in | Item quantity uses `Math.floor`; negative/decimal values not strictly rejected. |
| Purchase edit | `purchase.controller.js::updatePurchase` | Adds positive received delta for `Received`; cancellation branch reverses all previously received base quantity | Purchase in/out | Same loose parsing; cancellation through edit leaves `receivedQuantity` intact, enabling later double reversal; unit may change after receipt without correction. |
| Purchase receive | `purchase.controller.js::receivePurchase` | CAS on previous `receivedQuantity`, then positive base delta | Purchase in | Same loose parsing; CAS/status filters are not tenant-scoped; duplicate identical receive is skipped but not explicitly reported. |
| Purchase status → Cancelled | `purchase.controller.js::updatePurchaseStatus` | Reverses all received stock, then `purchase.save()` | Purchase out | No version/status CAS; concurrent cancellation can reverse twice; received fields are not zeroed; no negative-stock guard. |
| Purchase delete | `purchase.controller.js::deletePurchase` | Reverses received stock with unconditional `$inc` and **deletes** matching purchase movements | Originals deleted | Can drive stock negative; rewrites movement history; no document version guard; double reversal after cancellation. |
| Sale create | `sale-order.controller.js::createSaleOrder` → `applyStockAdjustments` | Deducts base Pieces at creation | Sale out | Existing intended rule; loose item quantity parsing; deduction is conditional on available stock. |
| Sale edit | `sale-order.controller.js::updateSaleOrder` | Applies signed base-Piece delta before a `__v`-guarded document write | Sale in/out | Concurrency is protected by CAS + compensation; loose item quantity parsing remains. |
| Sale cancel | `sale-order.controller.js::updateSaleOrderStatus` | Restores stock before `order.save()` when not Delivered | Sale in | No CAS; concurrent cancel can restore twice; whole-document save can overwrite a concurrent Phase 2 payment. |
| Sale delete | `sale-order.controller.js::deleteSaleOrder` | Restores stock only for items still marked `stockDeducted` | Sale in | Safe for already-cancelled orders; loose parsing is inherited from stored snapshots. |
| Other sale status transitions | `updateSaleOrderStatus` plain path | No stock effect | None | Whole-document `save()` can overwrite concurrent payment fields. |
| Sale/purchase payments | Phase 2 payment endpoints | No stock effect | None | Verified no stock dependency was introduced. |

### Confirmed bugs

1. **Initial and edited product stock bypass the movement ledger.** Root cause: direct writes to `Product.openingStock` in `createProduct()` and `updateProduct()`.
2. **Product stock accepts invalid values.** Root cause: `toNumber()` coerces malformed values to `0`; decimals and negatives are not rejected; `Math.floor()` in other stock paths silently truncates.
3. **Product delete silently removes stock.** Root cause: `deleteProduct()` has no stock check and no write-off movement.
4. **Movement history is mutable.** Root cause: `DELETE /api/inventory/movements/:id` deletes the movement, and `deletePurchase()` deletes all matching purchase movement records.
5. **Purchase cancellation can double-reverse stock.** Root cause: cancellation reverses stock but leaves `receivedQuantity`/`receivedBaseQuantity` on the purchase, so a later edit or delete reverses again.
6. **Concurrent purchase/sale cancellation is unsafe.** Root cause: both cancellation handlers read then `save()` without a version/status conditional update.
7. **Plain sale/purchase status updates can overwrite Phase 2 payment fields.** Root cause: whole-document `save()` on a stale document instead of a field-scoped conditional update.
8. **Negative stock can be produced by purchase reversal/delete.** Root cause: negative `$inc` operations have no `openingStock >= quantity` guard.
9. **Purchase receiving writes are not fully tenant-scoped.** Root cause: receipt/status conditional filters use only `_id`; the initial read is scoped but all writes should be too.
10. **Unit changes after receipt can desynchronize base Pieces.** Root cause: `buildPurchaseChanges()` recomputes `baseQuantity` from a submitted unit but gates stock updates on the display-unit delta, so a same-number Carton→Box change can overwrite `receivedBaseQuantity` without applying the real base-Piece delta. `receivePurchase()` has the same `delta === 0` skip.
11. **A received purchase can regress to `Draft`/`Ordered` while stock remains added.** Root cause: the generic status branch only blocks reactivation of cancelled purchases and never checks whether received goods are already recorded.
12. **Duplicate movement-delete requests can reverse stock twice.** Root cause: both requests can pass the stock reversal with the same stale movement before `findOneAndDelete()` makes one of them lose; the loser is not compensated.
13. **Fractional legacy base deltas can surface as a 500.** Root cause: `StockMovement.quantity` requires `min: 1` while helpers can compute a floored zero; the local controller error handlers do not translate Mongoose validation errors.
14. **No reservation model exists.** Root cause: reserved stock is a frontend display constant; sale stock is deducted at creation. This is documented as a limitation, not redesigned in Phase 3.

## Step 3 — Proposed implementation plan (approved scope for this phase)

1. Add strict whole-number stock parsing to `backend/src/utils/units.js`:
   - Reject NaN, Infinity, invalid strings, decimals, negative values, missing required values, and values unsafe to convert to base Pieces.
   - Add a strict base-Piece conversion that preserves Piece/Box/Carton factors without changing the existing `toBasePieces()` price/display behavior.
2. Use the strict parser in product create/edit, manual adjustment, sale item validation, purchase item validation, and purchase receiving.
3. Add immutable movement records for product create, product edit stock deltas, and product deletion with remaining stock. Product edit uses a conditional update on `__v` and previous stock so concurrent stock changes cannot be lost.
4. Change movement “delete” into a compensating reversal: keep the original movement, append the opposite movement, and prevent a second reversal.
5. Change purchase delete to append compensating stock movements instead of deleting historical ones, and add negative-stock guards to every reversal.
6. Make sale and purchase lifecycle transitions concurrency-safe:
   - Conditional `__v` + `status !== "Cancelled"` claims for cancellation.
   - Zero received quantities on purchase cancellation; mark sale items `stockDeducted: false` atomically.
   - Field-scoped conditional updates for plain status transitions so Phase 2 payment data is preserved.
   - Tenant-scoped purchase receipt/status conditional filters.
7. Reject received-item unit changes after goods have been received.
8. Keep all existing statuses, unit factors, canonical per-Piece prices, snapshots, tenant checks, auth, and Phase 1/Phase 2 recalculation behavior.
9. Add `backend/test/stock-integrity.test.js` with at least 31 deterministic MongoDB-backed assertions covering every required scenario, including actual persisted stock and movement records.
10. Update `IMPLEMENTATION_PROGRESS.md` with implementation evidence, exact test results, review findings, risks, and final status.

No new payment gateway, no new status, no reservation architecture, no database reset, no production data change, no commit, and no push are part of this plan.

## Step 4 — Implementation evidence

### New/changed source files

| Path | Implemented behavior |
|---|---|
| `backend/src/utils/units.js` | Added `parseWholeQuantity()` and `toBasePiecesStrict()`. Strict parsing accepts only whole numbers / whole-number strings, rejects negatives, decimals, `NaN`, `Infinity`, malformed strings, missing required values and unsafe integers; strict conversion rejects unsupported units and unsafe Piece/Box/Carton multiplication. Existing `toBasePieces()` and pricing/display helpers were left unchanged. |
| `backend/src/models/StockMovement.js` | Added optional `reversesMovement` ObjectId plus a unique partial index so one movement can have at most one compensating reversal. Null/default values are excluded. |
| `backend/src/controllers/product.controller.js` | Product create records opening stock as an immutable `adjustment`. Product edit parses stock strictly, uses `__v` + previous-stock CAS, writes an in/out adjustment for the exact delta, and restores prior fields/movement on standalone failure. Product delete writes a `writeoff` for remaining stock before deletion and compensates on failure. |
| `backend/src/controllers/inventory.controller.js` | Manual adjust uses strict parsing/conversion, a session, and a guarded deduction. Movement “delete” is now an immutable compensating reversal linked by `reversesMovement`; the original is retained, repeat reversal is idempotent, and concurrent duplicates are stopped by the unique index. Legacy fractional movements return 400 rather than 500. |
| `backend/src/controllers/sale-order.controller.js` | Sale item quantities use strict parsing/conversion. Cancellation claims terminal status with `__v`/status CAS, sets `stockDeducted: false` atomically, and never re-saves Phase 2 payment fields. Plain status changes are field-scoped CAS writes. Delete uses a version guard and restores the document snapshot if downstream work fails on standalone MongoDB. |
| `backend/src/controllers/purchase.controller.js` | Purchase quantities/receipts use strict parsing. Stock updates are gated on the base-Piece delta. Received items cannot change product/unit; received purchases cannot regress to `Draft`/`Ordered` through status or edit. Cancellation via status or edit claims the document atomically, zeroes received counters, and reverses only recorded received base Pieces with negative-stock guards. Delete appends compensating movements instead of deleting history. Receive Goods uses one tenant-scoped document claim so concurrent duplicate receipts add stock only once. |

### Contract changes

- `DELETE /api/inventory/movements/:id` now reverses an adjustment instead of deleting it. Response still includes the original `movement` and now also includes the new `reversal`; the message changed from “deleted” to “reversed”. A sequential repeat returns 200 with the existing reversal; a concurrent losing duplicate can return 409 from the unique index.
- Non-adjustment movements are still rejected, with the message updated to “Only stock adjustment entries can be reversed”.
- No route, status enum, auth rule, role rule, price-unit rule, tenant middleware, or payment endpoint was added/removed.

### Phase 1 / Phase 2 preservation

- Customer and supplier financial recalculation calls, tenant `businessId` propagation, `scopedFilter(req, ...)`, and their compensation refreshes remain in place.
- Existing manual payment endpoints, immutable payment records, idempotency keys, replay/conflict handling, CAS updates, cancellation guards and payment-derived paid totals were not rewritten. Field-scoped status writes specifically avoid overwriting `payments`, `paidAmount`, and `financials.paid`.
- Delivered sales are still not restocked; other sales still deduct at creation and restore on cancellation. Draft/Ordered purchases still do not add stock; received goods still add stock only through receipt/GRN paths.

## Step 5 — Tests executed and exact results

From `backend/`:

| Command | Result |
|---|---|
| `npx jest --runInBand test/stock-integrity.test.js` | PASS — 1 suite / 45 tests |
| `npm test -- --runInBand` | PASS — 24 suites / 244 tests |
| `node --check src/utils/units.js` | PASS |
| `node --check src/models/StockMovement.js` | PASS |
| `node --check src/controllers/product.controller.js` | PASS |
| `node --check src/controllers/inventory.controller.js` | PASS |
| `node --check src/controllers/sale-order.controller.js` | PASS |
| `node --check src/controllers/purchase.controller.js` | PASS |
| `node --check test/stock-integrity.test.js` | PASS |
| `node --check test/product-inventory-tenant.test.js` | PASS |

No frontend source file changed in Phase 3, so frontend TypeScript, lint and build commands were not rerun for this phase.

`backend/test/stock-integrity.test.js` contains 45 MongoDB-backed scenarios (requirement: at least 31). Each scenario asserts persisted `Product.openingStock` and/or persisted `StockMovement` documents — not just HTTP status. Coverage includes: product create/edit/delete movements; strict rejection of negative, decimal, `NaN`, `Infinity`, malformed and unsafe inputs; Box/Carton base conversion; manual adjustment and guarded deduction; compensating reversal, idempotent replay and legacy fractional rejection; sale create/edit/cancel/concurrent cancel/delete and payment preservation; overstock and concurrent oversell prevention; purchase receive/repeat/concurrent receive, quantity edit, unit-change lock, status regression lock, cancellation via status and edit, concurrent cancellation, deletion, negative-stock guard and payment preservation.

Updated existing test: `backend/test/product-inventory-tenant.test.js` now asserts the new immutable-reversal contract (owner gets a compensating movement, original remains, repeat reversal is idempotent) and the two tenant-scoped movement records created by opening stock plus manual adjustment.

## Step 6 — Review findings and fixes applied

1. **Concurrent duplicate Receive Goods could roll back the winner’s stock.** Initial per-item CAS allowed the losing request to attempt the status update after its receipt claim failed. Fixed with a single tenant-scoped document claim; the duplicate now returns the already-applied state without applying stock. Covered by a deterministic concurrent test.
2. **Purchase cancellation through `PUT /api/purchases/:id` left received counters set.** Fixed by zeroing `receivedQuantity` / `receivedBaseQuantity` in the final cancelled item set while retaining receipt history. Covered by edit-cancel then delete test.
3. **A received purchase could regress to `Draft`/`Ordered` through the edit endpoint.** Added the same guard used by the status endpoint to `buildPurchaseChanges()`. Covered by a regression test.
4. **Legacy fractional movement reversal could fail schema validation as a 500.** Added an explicit whole-number guard and a regression test that inserts a legacy raw movement and asserts 400 with unchanged stock.
5. **Duplicate schema index warning on `reversesMovement`.** Removed the field-level `index: true` so only the unique partial schema index remains.

No further correctness issue was found in the final diff review. `git diff --check` passed; output contained only the repository’s pre-existing LF/CRLF notices.

## Step 7 — Database and environment evidence

- MongoDB server used for tests is the existing dedicated `MONGODB_TEST_URI`; no development or production database was reset or modified.
- Test collections are cleared only by the existing `clearTestDB()` helper between tests.
- No data migration or destructive migration was run.
- The only schema-level change is the new `reversesMovement` field and its unique partial index. Mongoose creates the index when the model is loaded; existing non-null values are impossible because the field is new in this phase.
- Test MongoDB is standalone (`transactionsSupported: false`). `runWithSession()` therefore provides a session but no ACID transaction; all multi-document changes were verified through the explicit compensation path. No real-transaction atomicity claim is made.

## Step 8 — Final risks and limitations

1. Standalone MongoDB does not verify ACID transaction behavior. Replica-set testing would be required for that guarantee.
2. The unique partial index enforces at most one compensating movement per original movement; concurrent duplicates may receive 409 instead of the sequential idempotent 200.
3. Legacy incorrect stock snapshots were not backfilled; no production data was touched.
4. No reservation model was introduced. Sale stock is still deducted at creation; `reserved: 0` remains display-only.
5. Product `PUT` still treats omitted `openingStock` as zero, matching the existing full-replacement contract; callers must submit the current value to avoid a stock write-off movement.
6. Movement-history immutability is enforced at the application layer plus the reversal index; direct database writes are outside this phase’s control.

## Step 9 — Final scope confirmation

- No Phase 4 work, payment gateway, new status, reservation architecture, UI redesign, unrelated refactor, commit or push was performed.
- HEAD advanced to `43b5198 fix: enforce stock integrity and immutable movements`; Phase 3 is committed and pushed.
- Pre-existing untracked `.agents/` and `skills-lock.json` were preserved untouched.
- Final Phase 3 status: **COMPLETED** (with the documented standalone-transaction and legacy-data limitations above).

---

# Phase 4 — Sales & Purchase Lifecycle Integrity

## Approved scope and decisions

Phase 4 was approved with these decisions:

1. Implement core backend lifecycle fixes plus only minimal frontend alignment required for lifecycle correctness.
2. Add conditional role authorization for sensitive sale/purchase mutations: `owner` and `admin` may perform them; authentication-disabled development mode must remain unchanged.
3. Add tenant fail-closed behavior when authentication is enabled but a valid business context is missing; intentional single-tenant mode with authentication disabled must remain unchanged.
4. Block deletion of `Delivered` sales and preserve their historical records. `Delivered` cancellation continues to follow the existing no-restock rule.
5. Received purchase items cannot be removed or reduced below their already-received quantities.
6. Receiving remains the only authoritative path for adding received-purchase stock. Existing create-with-`Received` and received-quantity-edit behavior from Phase 3 is preserved.
7. Sale stock aggregation uses the resolved `productId`, not the submitted SKU.
8. `amountReceived` greater than the sale total is rejected, not clamped.
9. Payment replay is hardened so a successful recorded payment cannot return 500 merely because a summary refresh fails.
10. No Phase 5, payment gateway, reservation architecture, UI redesign, database reset, production data change, commit, or push.

## Approved implementation plan

1. Record the audit, transition matrix, and this approved plan here before implementation.
2. Add a shared backend lifecycle utility with the actual sale and purchase status definitions and transition rules.
3. Wire the transition rules into sale create/edit/status and purchase create/edit/status paths without weakening Phase 1–3 behavior:
   - Sales allow forward progression (including direct progression to `Delivered`) but reject backwards/regressive transitions, `Credit Hold → Delivered`, and all transitions out of `Cancelled`.
   - `Delivered → Cancelled` remains allowed and does not restock.
   - Purchases keep `Draft`/`Ordered`/`Partially Received`/`Received`/`Cancelled`; Receive Goods remains the authoritative receiving path; received purchases cannot regress to `Draft`/`Ordered`.
4. Fix received purchase item removal/reduction, canonical sale product keying, strict `amountReceived`, scoped purchase receive re-reads, and delivered-sale deletion.
5. Harden payment replay refresh handling.
6. Inspect role/tenant route and test effects before changing middleware/routes; then add conditional role checks and tenant fail-closed behavior.
7. Add MongoDB-backed lifecycle tests and run the full backend suite, syntax checks, `git diff --check`, and frontend checks if frontend files change.
8. Review the diff and report final Phase 4 status with evidence. Do not commit or push.

## Audit findings and disposition

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| VB1 | Critical | Purchase edit could remove a received line item, orphaning stock and losing receipt history. | Resolved: removal is rejected when a line has receipts or received quantity. |
| VB2 | High | Sale status transitions were unrestricted (`Delivered → Processing`, `Credit Hold → Delivered`). | Resolved: forward-only sale transitions in `src/utils/lifecycle.js`; `Delivered → Cancelled` remains valid. |
| VB3 | Medium | Sale stock aggregation keyed submitted SKU while product resolution prefers `productId`. | Resolved: `stockKey()` prefers the resolved valid `productId`. |
| VB4 | Medium | Sale list capped at 200 results. | Deferred by approved scope. |
| VB5 | Medium | Sale `credit` / `warning` snapshot fields were never written. | Deferred by approved scope. |
| VB6 | Low | `amountReceived > total` was silently clamped. | Resolved: rejected with a validation error before any write. |
| VB7 | Medium | Phase 3 commit/status text in this file was stale. | Resolved: corrected above. |
| VB8 | Medium | Purchase Receive Goods used unscoped `findById` re-reads. | Resolved: all three re-reads use tenant-scoped `findPurchase`. |
| R1 | High | No role guard on sensitive sale/purchase mutations. | Resolved: `owner`/`admin` guard active only when `AUTH_ENFORCEMENT=true`. |
| R2 | High | Authenticated but business-context-less requests could fall back to unscoped access. | Resolved: fail-closed 403 when auth is enabled and `req.auth.businessId` is missing/invalid. |
| R3 | Medium | Delivered sale edit/delete could destroy historical records. | Resolved: deletion of `Delivered` sales is blocked; cancellation archives without restock. |
| R4 | Medium | Duplicate payment replay could return 500 if summary refresh failed. | Resolved: replay refresh failures no longer turn a recorded payment into an error. |
| R5 | Medium | Edits overwrite historical price/total snapshots. | Deferred by approved scope (amendment-history schema). |
| R6 | Low | Purchase reversals are not linked via `StockMovement.reversesMovement`. | Deferred by approved scope. |
| R7 | Medium | Frontend edit idempotency-key alignment not addressed. | Deferred by approved scope. |

## Final implementation record

Changed files:

- Modified: `IMPLEMENTATION_PROGRESS.md`
- Modified: `backend/src/controllers/sale-order.controller.js`
- Modified: `backend/src/controllers/purchase.controller.js`
- Modified: `backend/src/middlewares/enforcement.middleware.js`
- Modified: `backend/src/routes/sale-order.routes.js`
- Modified: `backend/src/routes/purchase.routes.js`
- Modified: `backend/test/customer-financials.test.js`
- Modified: `backend/test/supplier-financials.test.js`
- Added: `backend/src/utils/lifecycle.js`
- Added: `backend/test/lifecycle-integrity.test.js`
- Unchanged/preserved: `.agents/`, `skills-lock.json`
- No frontend files were changed; backend lifecycle guards make UI-side status/edit restrictions unnecessary for correctness in this phase.

Verification evidence:

- `npx jest --runInBand test/lifecycle-integrity.test.js`: **1 suite / 14 tests passed**.
- Targeted regression (stock, cancellation, payment, financials, pricing, tenant, actor, middleware): **10 suites / 158 tests passed**.
- Full backend suite `npx jest --runInBand`: **25 suites / 258 tests passed** (Phase 4 added one suite and 14 tests; two Phase 1 test names/assertions were realigned to valid repeated transitions without weakening idempotency coverage).
- `node --check` on every changed/new backend JS file: passed.
- `git diff --check`: passed; only Git's LF-to-CRLF normalization warnings were reported.
- Frontend TypeScript/lint/build: not run because no frontend file changed.

Limitations and unresolved items:

- Deferred by approved scope: sale list 200-result cap, `credit`/`warning` snapshots, amendment-history schema for historical price/total immutability, `StockMovement.reversesMovement` linkage for purchase reversals, and frontend edit idempotency-key alignment.
- Test MongoDB remains standalone, so `runWithSession()` exercises compensating writes rather than ACID transactions.
- Financial recalculation serialization remains process-local.
- No live or production API verification was performed; evidence is local MongoDB-backed tests only.
- Conditional role checks apply only when `AUTH_ENFORCEMENT=true`; auth-disabled single-tenant development mode remains intentionally unchanged.
- No commit or push was performed. Branch: `main`; HEAD remains `43b5198 fix: enforce stock integrity and immutable movements`.

- Final Phase 4 status: **COMPLETED** with the documented deferred items and standalone-transaction limitation above.

---

# Customer Opening Balance & Financial Summary UI Fix

## Approved scope

Approved after the read-only audit:

1. Add a visible Opening Balance input to the Add Customer form, default `0`, accepting non-negative monetary values through the existing `openingBalance` API field.
2. Display the saved backend `openingBalance` in the customer profile.
3. Remove the unsupported frontend-derived `Total Paid` metric; the backend does not expose `totalPaid` and frontend-derived financial summaries are not allowed.
4. Do not add an `Available Credit` field or metric; the backend does not expose one.
5. Preserve backend-authoritative `totalPurchases`, `outstanding`, and `creditLimit` rendering, and preserve opening-balance immutability on update.
6. No backend financial utility, payment, stock, lifecycle, tenant, database, migration, production-data, Phase 5, commit, or push changes.

## Implementation plan

1. Add the input in `frontend/features/customers/components/AddCustomerForm.tsx` using the existing `Field`/input pattern and `form.openingBalance` state.
2. Replace the derived Total Paid card in `CustomerProfileSummary.tsx` with an Opening Balance card backed by `customer.openingBalance`.
3. Remove the now-unused `totalPaid` derivation from `frontend/features/customers/profile.ts`.
4. Strengthen the existing backend profile-response test to assert `openingBalance`.
5. Run frontend typecheck, lint, build, relevant backend tests, full backend suite, and `git diff --check`.
6. Report exact fields already working versus changed fields; do not commit or push.

## Final implementation record

Fields already working before this fix:

- `openingBalance`: accepted and validated by `POST /api/customers`, stored with `min: 0`, returned by the detail API, mapped by `customer.service.ts`, and immutable under `PUT /api/customers`.
- `totalPurchases`: returned by the backend, mapped by `customer.service.ts`, and already rendered in `CustomerProfileSummary.tsx`.
- `outstanding`: returned by the backend, mapped, and rendered as “Current Outstanding”.
- `creditLimit`: returned by the backend, mapped, and rendered as “Credit Limit”; no confusion with outstanding was found.
- `availableCredit`: not exposed by the backend; no new value was invented.

Fields/UI changed:

- `frontend/features/customers/components/AddCustomerForm.tsx`: rendered a visible `Opening Balance (PKR)` number input bound to `form.openingBalance`, default `0`, `min=0`, `step=0.01`, clamped to non-negative values, submitted through the existing `openingBalance` API field.
- `frontend/features/customers/components/CustomerProfileSummary.tsx`: replaced the unsupported frontend-derived `Total Paid` card with a backend-authoritative `Opening Balance` card using `customer.openingBalance`.
- `frontend/features/customers/profile.ts`: removed the unused frontend-derived `totalPaid` calculation; retained the existing credit-limit exposure/headroom display.
- `backend/test/customer-financials.test.js`: asserted `openingBalance` in the customer detail API response.

No backend source, financial utility, payment, stock, lifecycle, or tenant logic was changed. Phase 4 uncommitted work and the untracked `.agents/` / `skills-lock.json` files were preserved.

Verification evidence:

- Frontend `npx tsc --noEmit`: passed.
- Frontend `npm run lint`: passed with 0 errors; 8 pre-existing warnings in unrelated files.
- Frontend `npm run build`: passed; 21 static pages generated successfully.
- Backend `npx jest --runInBand test/customer-financials.test.js`: **1 suite / 13 tests passed**.
- Full backend `npx jest --runInBand`: **25 suites / 258 tests passed**.
- `git diff --check`: passed; only Git LF-to-CRLF normalization warnings were reported.
- No commit or push was performed.

- Final status: **COMPLETED** within the approved scope.
