# Tenancy Foundation (Phase 5)

## Decision

- **Isolation boundary:** `businessId` (Business). Invited users share the Owner's business data.
- **Audit only:** `createdByUserId` is for audit/provenance and **must never be used for authorization**.
- **Rollout flags:** `AUTH_ENFORCEMENT=false`, `TENANT_ENFORCEMENT=false` remain unchanged in Phase 5. No controller behavior/enforcement changes.

## Phase 5 changes

### Model fields (optional, not required yet)

Added to `Product`, `Supplier`, `Customer`, `Purchase`, `SaleOrder`, `StockMovement`:

- `businessId: ObjectId ref Business, default: null, index: true`
- `createdByUserId: ObjectId ref User, default: null` (audit only)

Legacy fields are untouched (`createdBy`, `performedBy`, etc.). Each model that references `Business` or `User` now requires those model files to avoid `MissingSchemaError` on populate.

### Tenant helpers (not wired into controllers yet)

`backend/src/utils/tenant.js`:

- `tenantFilter(req, extra = {})` — returns `{ ...extra, businessId }` for the authenticated request; throws 404 if business context is missing.
- `findOwned(Model, id, req)` — finds by `_id` and `businessId`; returns `null` for invalid/cross-tenant IDs.
- `assertOwned(Model, id, req)` — returns the doc or throws **404** (never 403) for missing/cross-tenant IDs.

Controllers are **not** wired to these helpers in Phase 5.

### Migration script

`npm run migrate:auth-tenancy` (`backend/scripts/migrate-auth-tenancy.js`)

- Reads target DB from `MONGODB_URI`.
- Prints database name first.
- `--dry-run` previews; makes no writes and does not require `--confirm`.
- Real run requires explicit `--confirm`.
- Fails clearly if no owner exists, or if more than one owner exists unless `--business-id <id>` is given.
- Backfills missing `businessId` on: `products`, `suppliers`, `customers`, `purchases`, `saleorders`, `stockmovements`.
- Maps legacy user roles: `staff -> user`. Owner record is never changed; `admin` remains `admin` unless it is the owner (no-op by rule).
- Prints before/after counts per collection. Never deletes anything. Idempotent.

## Planned index changes (Phase 6, after backfill)

**Do not drop or change existing global unique indexes now. Do not add compound indexes yet.** Apply in Phase 6 after backfill is verified and before/with enforcement.

| Collection | Current global unique index | Planned Phase 6 change | Notes |
|---|---|---|---|
| `products` | `sku` unique | Replace with compound unique `(businessId, sku)` | Requires backfill complete; handle legacy null businessId before enforcing. |
| `suppliers` | `supplierCode` unique | Replace with compound unique `(businessId, supplierCode)` | Same. |
| `customers` | `ledgerCode` unique | Replace with compound unique `(businessId, ledgerCode)` | Same. |
| `purchases` | `purchaseNumber` unique | Replace with compound unique `(businessId, purchaseNumber)` | Same. |
| `saleorders` | `orderNumber` unique | Replace with compound unique `(businessId, orderNumber)` | Same. |
| `stockmovements` | none on code | no code index change planned | Has product index; consider `(businessId, createdAt)` for queries in Phase 6. |

Phase 6 migration/index work must be careful with existing data and Mongo index replacement (drop old unique, create new compound unique) in a controlled window.

## Planned number-generator scoping (Phase 6, no behavior change now)

Current generators scan global collections by regex/max number:

| Entity | Field | Current pattern | Current scope | Planned Phase 6 scope |
|---|---|---|---|---|
| Supplier | `supplierCode` | `S-<n>` | global max in `suppliers` | per-`businessId` max/sequence |
| Customer | `ledgerCode` | `C-<n>` | global max in `customers` | per-`businessId` max/sequence |
| Purchase | `purchaseNumber` | `PO-<n>` | global max in `purchases` | per-`businessId` max/sequence |
| Sale Order | `orderNumber` | `SO-<n>` | global max in `saleorders` | per-`businessId` max/sequence |

No behavior change in Phase 5. In Phase 6, generators must be scoped by tenant and protected against collisions (transaction/unique index retry). Existing global numbers remain valid; scoping strategy must avoid reusing/colliding with historical IDs within a business.

## Operator checklist for real migration

1. **Backup the target database first** (mongodump or provider snapshot). Verify restore path.
2. Run dry-run against real DB:
   ```bash
   cd backend
   npm run migrate:auth-tenancy -- --dry-run
   ```
3. Review before/after counts and owner/business selection.
4. Run real migration only after backup and dry-run review:
   ```bash
   cd backend
   npm run migrate:auth-tenancy -- --confirm
   ```
5. If multiple owners exist, select explicitly:
   ```bash
   npm run migrate:auth-tenancy -- --dry-run --business-id <BUSINESS_ID>
   npm run migrate:auth-tenancy -- --confirm --business-id <BUSINESS_ID>
   ```
6. Re-run migration to confirm idempotency (modified counts should be 0).

Do **not** run against production without backup. Do **not** run `create-owner` as part of this migration.

## Phase 6 Part A - Products & Inventory tenant enforcement (implemented)

- **Routes:** `enforceTenantAuth` middleware (`src/middlewares/enforcement.middleware.js`) applied to product and inventory routes.
  - `AUTH_ENFORCEMENT=false`: behave as before (no auth required, no tenant scoping).
  - `AUTH_ENFORCEMENT=true`: authenticate required.
  - `TENANT_ENFORCEMENT=true` (with auth): controllers scope by `req.auth.businessId`.
- **Controllers:** `product.controller.js` and `inventory.controller.js` use tenant helpers (`tenantFilter`, `findOwned`) for list/detail-by-id/detail-by-SKU/create/update/delete/search/adjust-stock/movements/delete-movement. `businessId` and `createdByUserId` are set from `req.auth` on create; any `businessId` in body is ignored; `businessId` cannot be changed on update. Cross-business IDs return **404**.
- **Flavor stock:** `utils/flavor-stock.js` accepts optional `businessId` for tenant-scoped product reads/writes; backward compatible for existing callers (purchases/sale orders not tenant-enforced yet).
- **SKU index:** Product schema declares compound unique `{ businessId: 1, sku: 1 }`; old global `sku.unique` removed from schema. Old global `sku_1` unique index must be dropped only via one-time script (never on app start).

### Index migration script (one-time, real DB only when you choose)

```bash
cd backend
# Backup DB first
npm run migrate:indexes -- --dry-run
npm run migrate:indexes -- --confirm
```

Script: `scripts/migrate-indexes.js`. Prints DB name first, requires `--confirm` for real run, drops old global `sku_1` unique index only if present, creates `businessId_1_sku_1` unique index if missing. Idempotent.