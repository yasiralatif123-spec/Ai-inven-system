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
