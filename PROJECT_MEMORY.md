# PROJECT_MEMORY.md

> Persistent working memory for the StockFlow inventory system.
> Last updated: **2026-11-20** (optional product flavors feature completed and verified).
> Workspace root: `C:\Users\yasir\Desktop\real projects\inv_system`
>
> This file was created after a full read-only analysis of the current codebase. It intentionally records **verified code behavior**, not assumptions. Where something is only partially implemented or known-broken, it is labelled as such.

---

## 0. How to use this memory / mandatory workflow

For every future task:

1. **Read this file first** at the beginning of the session.
2. **Analyze** the specific request and inspect the relevant code. Treat the codebase as the source of truth.
3. **Create a plan** before modifying any file:
   - what was understood,
   - files/components expected to change,
   - intended implementation,
   - side effects/risks,
   - whether DB/migration/API changes are needed.
4. **Wait for explicit approval** (`Proceed`, `Execute`, `Implement this`, `Go ahead`). Do not start coding before approval.
5. **Execute only the approved plan**. Do not add unrelated changes.
6. **Verify** with the relevant checks (`tsc`, `lint`, `build`, API smoke tests where useful).
7. **Update this memory file** with the actual changes:
   - files changed,
   - behavior added/changed,
   - decisions and reasons,
   - new/removed pending tasks,
   - bugs discovered.
8. Report a concise summary: what changed, files modified, verification, remaining issues.

If a request is ambiguous, ask questions before planning. If an important issue is discovered outside task scope, report it separately instead of fixing it automatically.

---

## 1. Project Overview

**Purpose:** StockFlow is a wholesale inventory/operations UI being built to match the supplied Stitch designs. It covers products, inventory, sales orders, customers, suppliers, and purchases with a MongoDB-backed Express API.

**Root structure** (no root `package.json`, no README, no Git repo):

```text
inv_system/
├── backend/       Express + MongoDB API
├── frontend/      Next.js App Router UI
└── stich ui/      Stitch design references (folder name is misspelled; use exactly "stich ui")
```

**Important:** The workspace is **not a Git repository**. There is no version history or rollback via Git.

**Design reference:** `stich ui/` contains 18 folders. 17 have `code.html` + `screen.png`; `stockflow_operational_utilitarian/` contains `DESIGN.md` only. Design tokens from `DESIGN.md` are reflected in `frontend/app/globals.css`.

### Stitch-to-route mapping

| Stitch folder | Implemented mapping | Status |
|---|---|---|
| `dashboard` | `/` | Implemented |
| `products` | `/products` | Implemented, some header buttons are no-ops |
| `add_product` | `/products/add` | Implemented |
| `inventory` | `/inventory` | Implemented, Transfers tab empty |
| `sales_orders` | `/sales-orders` | Implemented |
| `suppliers` | `/suppliers` | Implemented, some actions not connected |
| `add_supplier` | `/suppliers/add` | Implemented |
| `customers` | `/customers` | Implemented |
| `add_customer` | `/customers/add` | Implemented |
| `customer_profile_ahmed_traders` | `/customers/[id]` | Implemented with real DB data, not hardcoded sample |
| `supplier_detail_karachi_beverage_distributors` | `/suppliers/[id]` | Implemented with real DB data |
| `purchases` | `/purchases` | Implemented |
| `create_purchase_stockflow` | `/purchases/create` | Implemented create/edit form |
| `purchase_detail_stockflow` | `PurchaseDetailDialog.tsx` | Implemented as dialog, not route |
| `record_payment_modal` | Sales/purchase payment dialogs | Implemented |
| `payments_finance` | AppShell nav item only | Not implemented |
| `ai_assistant` | AppShell nav item only | Not implemented |
| `stockflow_operational_utilitarian` | `DESIGN.md` → `globals.css` tokens | Design reference only |

---

## 2. Tech Stack & Dependencies

### Frontend (`frontend/package.json`)

- Next.js **16.4.6** (App Router, Turbopack, Cache Components enabled)
- React / React DOM **19.3.0**
- Tailwind CSS **4.3.3** with `@tailwindcss/turbopack`
- TypeScript **^5**, strict mode
- ESLint **^9**, `eslint-config-next` 16.4.6
- Scripts:
  - `npm run dev` → `next dev`
  - `npm run build` → `next build`
  - `npm start` → `next start`
  - `npm run lint` → `eslint`
- No test script, no test files.
- No `tailwind.config.*` or `postcss.config.*`; Tailwind theme lives in `app/globals.css`.
- No `src/` directory; code lives directly in `app/` and `features/`.

### Backend (`backend/package.json`)

- Node.js + Express **4.21.2**
- Mongoose **8.9.5**
- JWT **9.0.2**, bcryptjs, cookie-parser, cors, dotenv, express-session, multer, cloudinary
- Scripts:
  - `npm run dev` → `nodemon src/server.js`
  - `npm start` → `node src/server.js`
- No lint script, no test script.

### Known current check results

- `node --check` on all 30 backend `.js` files ✅
- `npx tsc --noEmit` ✅
- `npm run lint` → **0 errors, 1 existing warning**: `app/layout.tsx:26` `@next/next/no-page-custom-font` for the Material Symbols Google Fonts `<link>`.
- `npm run build` ✅ (Next.js 16.4.6, all app routes produced successfully).
- Live API smoke test ✅ for flavor create/update, supplier default, purchase line, and sale line, with all test records deleted afterward.
- Live ports used previously: backend `http://localhost:5000`, frontend `http://localhost:3000`.

---

## 3. Project Architecture & Folder Structure

### Backend structure

```text
backend/
├── .env                     (present; contains real credentials — never print values)
├── .env.example             (documented env vars; has duplicate Cloudinary block/stray text)
├── README.md
├── docs/
│   ├── customers-api.md
│   ├── inventory-api.md
│   ├── purchases-api.md
│   ├── sales-orders-api.md
│   └── suppliers-api.md
└── src/
    ├── server.js            loads dotenv, connects DB, listens on PORT || 5000
    ├── app.js               CORS, cookies, session, body parsers, route mounts, error handler
    ├── config/
    │   ├── db.js            MONGODB_URI → mongoose.connect
    │   └── cloudinary.js    requires CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
    ├── middlewares/
    │   ├── auth.middleware.js
    │   ├── error.middleware.js
    │   └── upload.middleware.js   (multer memoryStorage, 5 MB, png/jpeg/jpg)
    ├── models/              User, Product, StockMovement, Customer, Supplier, Purchase, SaleOrder
    ├── routes/              auth, product, inventory, sale-order, supplier, customer, purchase
    ├── controllers/         matching controllers; no dashboard controller
    └── utils/
        ├── db.js            runWithSession() transaction/compensation helper
        └── token.js         JWT sign helpers
```

### Frontend structure

```text
frontend/
├── app/
│   ├── layout.tsx           Inter + JetBrains Mono via next/font; Material Symbols via <link>
│   ├── globals.css          Tailwind v4 @theme tokens from Stitch design spec
│   ├── page.tsx             Dashboard
│   ├── components/AppShell.tsx
│   ├── lib/api.ts           apiFetch; NEXT_PUBLIC_API_URL || http://localhost:5000
│   ├── products/            Product list, add page, detail/edit modals, types/utils/options
│   ├── inventory/           Inventory page, services, components, data, utils
│   └── [other routes]/      thin pages wrapping feature components
└── features/
    ├── dashboard/           components, hooks, services, utils, types
    ├── customers/           components, hooks, services, types, utils
    ├── sales-orders/        components, hooks, services, types, constants, utils
    ├── suppliers/           components, hooks, services, supplierProfile.ts, types
    └── purchases/           components, hooks, services, types, utils, constants
```

**Architecture deviation to remember:** `features/` exists for dashboard/customers/sales-orders/suppliers/purchases, but **products and inventory still live under `app/`**, not `features/`. Do not reorganize without explicit approval.

### Frontend routes

| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Dashboard, DB-backed via derived API calls |
| `/products` | `app/products/page.tsx` | DB-backed list; AI upload/CSV buttons are no-ops |
| `/products/add` | `app/products/add/page.tsx` | DB-backed create form |
| `/inventory` | `app/inventory/page.tsx` | DB-backed; Transfers tab empty |
| `/sales-orders` | `app/sales-orders/page.tsx` | DB-backed |
| `/customers` | `app/customers/page.tsx` | DB-backed |
| `/customers/add` | `app/customers/add/page.tsx` | DB-backed |
| `/customers/[id]` | `app/customers/[id]/page.tsx` | DB-backed profile, derived sections |
| `/suppliers` | `app/suppliers/page.tsx` | DB-backed |
| `/suppliers/add` | `app/suppliers/add/page.tsx` | DB-backed |
| `/suppliers/[id]` | `app/suppliers/[id]/page.tsx` | DB-backed profile, derived sections |
| `/purchases` | `app/purchases/page.tsx` | DB-backed |
| `/purchases/create` | `app/purchases/create/page.tsx` | DB-backed create/edit |

No `app/api/**` route handlers, no `middleware.ts`, no auth pages.

Dynamic profile pages use async `params` with `Suspense` and `params.then(...)`.

---

## 4. Database Schema & Relationships

No custom collection names are declared, so Mongoose defaults apply: `products`, `stockmovements`, `customers`, `suppliers`, `purchases`, `saleorders`, `users`.

No model has custom virtuals or `.pre()/.post()` hooks. All use `{ timestamps: true }`.

### `Product` (`backend/src/models/Product.js`)

- `title`, `sku` (unique), `barcode`
- `category`, `brand`, `description`
- `flavors`: optional `String[]`; normalized to de-duplicated, trimmed values (max 24 flavors, 80 chars each)
- `purchasePrice`, `wholesalePrice`, `retailPrice`
- `taxBracket`, `uom`, `warehouse`, `rackBay`
- `openingStock` — **the single stock balance used everywhere**
- `reorderThreshold`
- `catalogStatus`: `active | draft | discontinued`, default `active`
- `batchTracking`, `expiryDate`
- `climateControlled`, `eligibleForReturn`, `halalPsqcaCertified` — exist in model/type but are not editable in current UI and are dropped by backend update
- `imageUrl`, `imagePublicId` — **single Cloudinary image only**

### `StockMovement` (`backend/src/models/StockMovement.js`)

- `product` ObjectId ref `Product`, indexed
- Denormalized snapshots: `sku`, `productTitle`
- `type`: `adjustment | purchase | sale | return | writeoff`
- `direction`: `in | out`
- `quantity` (min 1), `previousStock`, `newStock`
- `unit`, `reason`, `reference`, `notes`, `performedBy` (default `"Admin"`)
- Purchase movements use `type: "purchase"`, `direction: "in"`, reference `<PO> · AUTO-STOCK` or `<PO> · <GRN ref>`.
- Sale movements use `type: "sale"`, reference `<SO> · SALE`.

### `Customer` (`backend/src/models/Customer.js`)

- `ledgerCode` unique/indexed, generated from base 409 → `C-410`
- `name`, `businessName`, `phone`, `altPhone`, `email`
- `city` + `cityLabel`, `address`
- `customerType`: `Wholesale | Retailer | Distributor | Other`
- `status`: **`Active | Inactive | Blocked`** (do not use supplier statuses here)
- `route` + `routeLabel`, `ntn`
- `creditLimit`, `paymentTerms` (`cod|7days|15days|30days|45days`)
- `openingBalance`, `gracePeriod`, `notes`
- `orders`, `totalPurchases`, `outstanding` — stored counters, but not updated by sale payments
- `createdBy` default `"Tariq M. (Owner)"`

### `Supplier` (`backend/src/models/Supplier.js`)

- `supplierCode` unique/indexed, generated from base 207 → `S-208`
- `name`, `contactPerson`, `phone`, `email`, `address`, `hub`, `region`, `ntn`
- `taxStatus`: `standard | exempt | non-filer`
- `paymentTerms`: `net-15 | net-30 | net-7 | cod | advance`
- `openingBalance`, `graceDays`, `notes`
- `productIds`: ObjectId refs to `Product`
- `productFlavors`: `Map<String, String>` keyed by product ID for the supplier's default flavor; stale/product-less values are pruned on save
- `status`: **`Active | On Hold | Inactive`** (different vocabulary from customers)
- `totalPurchases`, `outstanding` — stored, not updated by purchases
- `payableNote`, `payableTone`, `lastPurchaseAt`, `createdBy`
- **No bank/IBAN/account fields exist**, despite a `Contact & Bank Profile` tab label in the UI.

### `Purchase` (`backend/src/models/Purchase.js`)

Embedded sub-schemas:

- Receipt: `quantity`, `receivedQuantity`, `reference`, `notes`, `receivedAt`, `performedBy`
- Item:
  - `productId` is a **String**, not an ObjectId ref
  - `name`, `sku`, `flavor` (optional descriptive string), `quantity`
  - `availableStock` — read-only snapshot at selection
  - `receivedQuantity` — cumulative received
  - `receipts[]`
  - `unit`, `unitPrice`, `discount`, `taxRate`, `taxAmount`, `lineTotal`
- Payment: `amount`, `method`, `reference`, `paidAt`, `createdBy`

Root:

- `purchaseNumber` unique/indexed, generated from base 2041 → `PO-2042`
- `supplier` embedded snapshot (`id`, `code`, `name`, `contact`, `phone`, `hub`, `address`, `ntn`, `paymentTerms`, `productIds[]`, `productFlavors` map)
- `purchaseDate`, `expectedDelivery`, `invoiceNumber`
- `items[]` (validator: at least one)
- `financials` (`subtotal`, `discount`, `tax`, `freight`, `total`)
- `paidAmount`, `payments[]`
- `status`: `Draft | Ordered | Partially Received | Received | Cancelled`
- `notes`, `createdBy`

### `SaleOrder` (`backend/src/models/SaleOrder.js`)

Embedded sub-schemas:

- Item: `name`, `sku`, `flavor` (optional descriptive string), `productId` ObjectId ref (nullable), `quantity`, `unitLabel`, `unitPrice`, `available`, `stockDeducted`, `lineTotal`
- Credit: `accountName`, `ntn`, `creditLimit`, `currentDues`, `available` — legacy; new orders do not populate meaningfully
- Warning: legacy exposure/approval fields; new orders default to `null`
- Financials: `subtotal`, `discount`, `tax`, `freight`, `total`, `paid`, `outstanding`, `dueDate`

Root:

- `orderNumber` unique/indexed, generated from base 8824 → `SO-8825+`
- `customer` embedded `{ name, phone, location }` — **no customerId reference**
- `hub`, `paymentLabel`, `paymentMethod`, `bay`
- `paymentStatus`: `paid | partial | unpaid`
- `status`: `Pending Approval | Processing | Packed | Dispatched | Delivered | Credit Hold`
- `skuCount`, `unitCount`, `amount`, `credit`, `warning`, `financials`
- `createdBy`

### `User` (`backend/src/models/User.js`)

- `name`, unique `email`, `password` (`select: false`), `role` (`admin|staff|user`), `isActive`
- Auth is scaffold-only; see §9.

---

## 5. API Documentation

All business routes are **public**. Only `GET /api/auth/me` uses `authenticate`.

### Mounts (`backend/src/app.js`)

`/api/auth`, `/api/products`, `/api/inventory`, `/api/sale-orders`, `/api/suppliers`, `/api/customers`, `/api/purchases`.

Health: `GET /api/health` → `{ status: "ok", message: "API is running" }`.

### Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | Public; bcrypt hash; duplicate email → 409; no field validation |
| POST | `/api/auth/login` | Public; sets access/refresh cookies + session; **fails with current `.env` because JWT secrets are missing** |
| POST | `/api/auth/logout` | Clears cookies, destroys session |
| GET | `/api/auth/me` | Only protected route |
| GET | `/api/products` | Newest first |
| POST | `/api/products` | `upload.single("image")`; required title/SKU/category/brand; duplicate SKU → 409; Cloudinary upload |
| POST | `/api/products/:id/adjust-stock` | Implemented in `inventory.controller.js`; guarded stock `$inc`; creates adjustment movement |
| PUT | `/api/products/:id` | Image replace/remove; duplicate SKU check; drops 3 compliance booleans |
| DELETE | `/api/products/:id` | Deletes product + Cloudinary image; does not clean up related movements |
| GET | `/api/inventory/movements` | `?limit` clamped 1..200, default 100 |
| DELETE | `/api/inventory/movements/:id` | Only `type: "adjustment"` deletable; reverses stock |
| GET | `/api/sale-orders` | Newest first, limit 200 |
| POST | `/api/sale-orders` | Transactional; wholesale price for catalog items; deducts stock; writes sale movements |
| PUT | `/api/sale-orders/:id` | Accepts ObjectId or order number; applies stock delta only |
| PATCH | `/api/sale-orders/:id/status` | No stock effect |
| POST | `/api/sale-orders/:id/payment` | `0 < amount <= outstanding`; no stock effect |
| DELETE | `/api/sale-orders/:id` | Restores deducted stock; writes `in` movements |
| GET | `/api/suppliers/next-code` | `S-208` base |
| GET | `/api/suppliers` | Newest first |
| GET | `/api/suppliers/:id` | 404 on invalid ObjectId |
| POST | `/api/suppliers` | Validates fields; product IDs validated/pruned; code retry on 11000 |
| PUT | `/api/suppliers/:id` | Preserves accounting fields; prunes stale `productIds` |
| DELETE | `/api/suppliers/:id` | Hard delete |
| GET | `/api/customers/next-code` | `C-410` base |
| GET | `/api/customers` | Newest first |
| GET | `/api/customers/:id` | 404 on invalid ObjectId |
| POST | `/api/customers` | Phone normalization; ledger code retry |
| PUT | `/api/customers/:id` | Preserves credit/accounting fields and counters |
| DELETE | `/api/customers/:id` | Hard delete |
| GET | `/api/purchases/next-code` | `PO-2042` base |
| GET | `/api/purchases` | Optional `?supplierId=<ObjectId>` filter |
| GET | `/api/purchases/:id` | Accepts ObjectId or `purchaseNumber` |
| POST | `/api/purchases` | Full target quantity → stock + AUTO-STOCK receipt/movement |
| PUT | `/api/purchases/:id` | Recomputes purchase; **does not apply stock for newly added items (known bug)** |
| PATCH | `/api/purchases/:id/status` | Rejects receiving statuses; **Cancelled does not reverse stock (known bug)** |
| POST | `/api/purchases/:id/receive` | Cumulative received quantity; only delta added to stock; CAS conflict → 409 |
| POST | `/api/purchases/:id/payment` | `0 < amount <= total - paidAmount` |
| DELETE | `/api/purchases/:id` | Reverses received stock and deletes matching purchase movements |

### Frontend API connection

`frontend/app/lib/api.ts`:

```ts
API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
apiFetch(path, init) => fetch(`${API_BASE_URL}${path}`, init);
```

- Native `fetch` only; no Axios.
- No `Authorization`, no `credentials`, no cookies.
- No backend proxy/rewrite.
- All feature services call `apiFetch`; no API calls should be added directly into large UI components.

### Query parameters used by frontend

| Param | Where | Purpose |
|---|---|---|
| `tab`, `product` | `/inventory` | Select tab, open Adjust Stock panel |
| `new`, `order` | `/sales-orders` | Open new-order dialog, open edit dialog for order |
| `edit` | `/suppliers`, `/purchases/create` | Open edit dialog / load purchase |
| `supplierId` | `/purchases`, `/purchases/create` | Filter list / preselect supplier |
| `created`, `updated` | `/purchases` | Show success notice |

`router.refresh()` is used only in `app/products/add/page.tsx` after save. Other views rely on local state/reload tokens.

---

## 6. Implemented Features & Current Functionality

### Dashboard (`/`)

**Status:** Implemented, DB-derived, with caveats.

- `features/dashboard/services/dashboard.service.ts` fetches products, movements, sale orders, suppliers and computes KPIs/charts/recent orders/activity.
- No backend dashboard endpoint; all aggregation is client-side.
- Inputs are capped by backend list limits (movements default 100, sale orders 200), so numbers can be based on partial data.
- Period switcher (daily/weekly/monthly/custom) works; “custom” is fixed 5-day blocks, not a date picker.
- Retry works only in error state; no success-state refresh or polling.
- Quick actions: Create Sale → `/sales-orders?new=1` ✅; Add Product → `/products/add` ✅; Add Customer → `/customers/add` ✅; Create Purchase → `/suppliers` (misleading); Record Payment → `/sales-orders` (generic).

### Products

**Status:** Implemented, DB-backed, with partial header actions.

- List from `/api/products`; derived stats; row click opens detail modal.
- Detail modal deletes product.
- Edit modal supports field edits, image preview/replacement/removal, `PUT /api/products/:id` via FormData.
- Add Product uses `POST /api/products`, one image, preview/removal before submit.
- Header buttons `Upload Invoice with AI` and `Export CSV` have no handlers.
- Compliance booleans (`climateControlled`, `eligibleForReturn`, `halalPsqcaCertified`) exist in types/model but not in UI and cannot be updated via PUT.

### Inventory

**Status:** Mostly implemented, DB-backed.

- Five tabs: overview, movements, adjustments, transfers, alerts.
- Adjust Stock works and persists with audit fields; only adjustment movements are deletable and deletion reverses stock.
- CSV export for overview/alerts.
- Deep links `?tab=`, `?product=` work.
- Reserved stock is always `0` (synthetic).
- Transfers tab is explicitly unimplemented; badge hardcoded `0 transit`; “Transfer Stock” just switches to that empty tab.
- Stock Audit Report PDF button has no handler.
- Stock table checkboxes have no selection state.
- Adjust Stock panel starts open by default.

### Sales & Orders

**Status:** Implemented, DB-backed.

- List/create/edit/status/payment/delete all wired.
- Filters, CSV export, `?new=1` and `?order=` deep links.
- Customer autocomplete with manual fallback; product autocomplete with portal dropdown, keyboard/ARIA roles, live item total.
- No order-detail popup, no Delivered section, no Saved badge (by prior requirement).
- Delivered is archived/hidden from selectable statuses and tabs; disabled option appears only when editing a Delivered order.
- **Row click opens the matching saved customer profile**, not an order detail; edit/payment/etc. are in the 3-dot menu.
- Customer↔order resolution is heuristic (phone/name/business matching) because `SaleOrder` has no `customerId`.
- Manual orders without a saved customer show a notice.
- New-order catalog prices come from `Product.wholesalePrice`; edit mode preserves saved/manual price.
- Credit Account, NTN, Credit Limit, Current Dues, Credit Days removed from sale order form; no credit warnings.
- Unpaid orders use `dueDate: "Due on receipt"` and `paymentLabel: "Unpaid (Due on receipt)"`; legacy DB fields remain hidden by frontend DTO.

### Customers

**Status:** Implemented, DB-backed, with derived profile data.

- CRUD + next-code; search, filters, sort, pagination, CSV export, Cmd/Ctrl+K focus.
- Customer profile loads customer plus sale orders, filters by heuristic match, and derives:
  - `orders` count
  - `totalPurchases`
  - `outstanding = openingBalance + sum(order.financials.outstanding)`
- Profile actions: Edit, Record Payment, Create Sale prefilled, Delete, order `View` opens `?order=<id>` on Sales page.
- Tabs: Orders/Invoices/Payments/Notes/Activity are real or derived from sale orders.
- Invoices/Payments are derived from sale orders, not dedicated APIs.
- Returns & Credit Notes is a static empty placeholder.
- Section 3 removed from frontend (verified: no matching text in source).
- Credit fields (`creditLimit`, `paymentTerms`, `openingBalance`, `gracePeriod`) are create-only; update input omits them.
- Statuses: `Active | Inactive | Blocked`.
- Record Payment from list goes to `/sales-orders` generically; no preselection.

### Suppliers

**Status:** Implemented, DB-backed, with several unconnected actions.

- CRUD + next-code; search, filters, sort, pagination, KPIs, CSV export.
- Add/Edit forms use searchable product multi-select; supplier `productIds` validated/pruned on update.
- Row opens `/suppliers/<id>`.
- Profile loads supplier + purchases filtered by supplier; purchase history/invoices/payments derived from real purchase records.
- No hardcoded dummy bank details; no bank fields exist in schema.
- Statuses: `Active | On Hold | Inactive`.
- `Record Payment`, `Send Statement`, `Aging ledger view`, WHT download, Customize Columns, and AUTO-REFRESH label are not connected.
- Actions menu mostly shows notices; detail-page “Record Payment” navigates to `/purchases?supplierId=...`, not a payment form.

### Purchases

**Status:** Implemented, DB-backed, most complete operational workflow.

- Full API wiring: list/create/update/delete, status, receive, payment, next-code.
- Create/edit page:
  - loads suppliers + products,
  - `?supplierId=` preselect,
  - `?edit=` loads existing purchase,
  - supplier autocomplete/auto-fill,
  - PO preview/print,
  - clean redirect to `/purchases?created=...` after save.
- List actions: View PO, Receipt History, Receive Goods (GRN), Record Payment, Edit, Cancel, Delete.
- Partial receiving uses cumulative `receivedQuantity`, adds only the new delta, prevents duplicate stock updates, idempotent repeat submissions, 409 on concurrent conflict.
- On create, the full entered **Quantity (Target)** is added to product stock with an `AUTO-STOCK` receipt and `purchase` movement.
- Delete reverses received stock and removes related purchase movements.
- Saved purchase orders do not update supplier `totalPurchases`/`outstanding`.
- `Upload Supplier Invoice is not connected yet.` notice remains.

---

## 7. Business Logic & Rules

### Stock

- `Product.openingStock` is the only stock balance.
- Stock deductions/restorations happen for sale orders and purchases/inventory only where explicitly implemented.
- Guard pattern: atomic `$inc` with `openingStock: { $gte: quantity }` where supported; standalone Mongo uses compensating reversals via `runWithSession`.
- Movements are audit records; only `adjustment` movements can be deleted through the API.

### Sale order rules

- New catalog item unit price is authoritatively `Product.wholesalePrice`; client `unitPrice` is ignored for a matched catalog item.
- Manual items keep client-supplied price; edits preserve saved price.
- `Item Total = Qty × Unit Price`; subtotal/total update with discount/freight.
- Duplicate SKUs are aggregated before stock validation.
- Insufficient stock → `400` with available/requested; no order saved.
- Order create deducts stock; edit applies only the **delta**; delete restores full deducted quantity.
- Status and payment updates never touch stock.
- `financials.tax` is computed as 18% embedded tax but **not added to `total`**; `total = subtotal - discount + freight`. This is documented but financially inconsistent.
- Unpaid orders: `dueDate: "Due on receipt"`, `paymentLabel: "Unpaid (Due on receipt)"`.
- Delivered orders archived/hidden from normal workflow.

### Purchase rules

- Quantity (Target) starts at `0` in the form for every new row/product selection/barcode scan.
- `availableStock` is only a stored snapshot; it no longer reduces the stock increment.
- On create, submitted `quantity` becomes `stockToAdd`, `receivedQuantity`, and an `AUTO-STOCK` receipt; the purchase is therefore fully received when saved.
- Additional receiving via `/receive` uses **cumulative** `receivedQuantity`; only the positive delta is added to stock.
- Editing cannot reduce `receivedQuantity` below what is already received or change a received item’s linked product.
- Status is derived from `receivedQuantity` when receiving; Cancelled is preserved.
- Purchase delete reverses stock by cumulative `receivedQuantity`, deletes matching `purchase` movements, and deletes the purchase atomically/compensated.
- Known bugs: `PUT /api/purchases/:id` does not apply stock for newly added items; `PATCH .../status` to Cancelled does not reverse stock.

### Customer/supplier rules

- Customer phone normalized to `+92 XXX XXXXXXX`; supplier phone formatting differs (`+92 XXXXXXXXX`).
- `next-code` endpoints use max+1 and 5× retry on duplicate key; concurrent callers can get the same suggested code before create retries.
- Stored customer/supplier counters (`orders`, `totalPurchases`, `outstanding`) are initialized/preserved but **not mutated** by sales/purchases; profile UIs derive live values.
- Supplier `productIds` updates prune IDs whose products were deleted, but reject new unknown IDs.
- Customer status list differs from supplier status list; do not mix them.

### Validation/error behavior

- Controller-level ValidationError → 400; ConflictError → 409.
- Generic Mongoose ValidationErrors can surface as 500 through `error.middleware.js`.
- Product create/update duplicate SKU → 409.
- Purchase receive conflict → 409.
- Purchase delete count mismatch → 409.
- Auth register has no validation; login requires missing JWT secrets.

---

## 8. UI/UX Conventions & Design Decisions

- Follow `stich ui/stockflow_operational_utilitarian/DESIGN.md` palette, type scale, density, and status chips; tokens already in `frontend/app/globals.css`.
- Tailwind utility classes only; no new UI library added.
- Compact table-heavy operational layout with fixed `AppShell` sidebar (`w-60`) and sticky footer actions on forms.
- Material Symbols icons via Google Fonts `<link>`; Inter + JetBrains Mono via `next/font/google`.
- Row 3-dot action menus use `z-[9999]`. Autocomplete dropdowns use portals (`z-[200]`, supplier product portal `z-[250]`). Dialogs range `z-[100]` to `z-[400]`, so z-index scale is inconsistent and worth watching.
- Product row has keyboard support (`role="button"`, `tabIndex`, Enter/Space); many other clickable rows do not.
- Dialogs generally use `role="dialog"` and `aria-modal`; autocompletes use combobox/listbox roles.
- CSV export is implemented in several list views (customers, suppliers, purchases, inventory, sales orders).
- Notices use dismissible banners and query params in purchases.
- Add Product links are now plain `<a href="/products/add">` (not `<Link>`) in products page, inventory empty state, and dashboard quick actions, so opening the page performs a **full page load**.
- Add Product page uses `AddProductForm key={pathname}`, `blankForm()`, and `<form autoComplete="off">` so fields are always empty on entry.
- Sales row click opens customer profile; checkbox and 3-dot clicks are isolated from row navigation.
- Supplier profile uses real purchase data; no dummy bank details.
- Customer Section 3 removed from frontend only.

---

## 9. Authentication & Authorization

**Status: Scaffold only; application is effectively unauthenticated.**

Backend:

- `auth.routes.js`: register/login/logout/me.
- `auth.middleware.js` reads `accessToken` cookie or Bearer token, verifies with `JWT_ACCESS_SECRET`, sets `req.user`. Session validity check is commented out.
- Only `/api/auth/me` uses `authenticate`.
- No `authorize` role guard, no refresh endpoint, no revocation/rotation, no CSRF protection.
- `express-session` uses an in-memory store (TODO at `app.js:52`).
- `backend/.env` lacks `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`, `COOKIE_SECRET`, etc., so login will fail with current workspace config. Session secret falls back to `"change_this_session_secret"`.
- CORS allows `CLIENT_URL`, `localhost:3000`, `127.0.0.1:3000`, and no-Origin clients, with `credentials: true`.

Frontend:

- No login/register pages.
- No `/api/auth/*` calls.
- No `localStorage`, `sessionStorage`, `document.cookie`, `Authorization`, or `credentials` usage.
- `AppShell` hardcodes `Tariq M.`, `Owner`, `ID #001`.
- `Logout` is `href="#"`.

**Decision to remember:** all business APIs are currently public by design/practice. Do not add auth middleware to business routes without explicit approval because it will break the current UI.

---

## 10. External Integrations & Configuration

### Cloudinary

- Backend `config/cloudinary.js` requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- `multer.memoryStorage()`, 5 MB limit, PNG/JPEG/JPG only.
- Folder: `inv_system/products`.
- Stores one `imageUrl` + one `imagePublicId` in `Product`.
- Add/Edit Product supports one image with object-URL preview and removal.
- Delete removes DB record first, then best-effort Cloudinary destroy.
- **Does not satisfy `AGENTS.md` §14** (multiple images, upload progress, full lifecycle). No binary data is stored in MongoDB (that rule is satisfied).

### MongoDB

- `MONGODB_URI` required by `backend/src/config/db.js`.
- `backend/.env` exists and contains real credentials; never print or commit values.
- `runWithSession()` detects transaction support and falls back to compensation on standalone MongoDB.

### Environment variable names (values intentionally omitted)

Documented in `backend/.env.example`: `NODE_ENV`, `PORT`, `CLIENT_URL`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `COOKIE_SECRET`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `COOKIE_DOMAIN`, `SESSION_SECRET`, `SESSION_NAME`, `SESSION_MAX_AGE_MS`, `SESSION_SECURE`, `SESSION_SAME_SITE`, `SESSION_STORE_MONGO_URI` (commented), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Actually present in `backend/.env` (names only): `CLIENT_URL`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_CLOUD_NAME`, `MONGODB_URI`, `PORT`.

Frontend optional: `NEXT_PUBLIC_API_URL`.

### Postman / API docs

- No Postman collection, environment, workspace config, or OpenAPI/Swagger file exists.
- API docs are Markdown files under `backend/docs/`.

---

## 11. Completed Tasks (verified from code and prior work)

- Built UI screens matching Stitch designs for dashboard, products, add product, inventory, sales orders, suppliers, add supplier, customers, add customer, customer profile, supplier profile, purchases, create purchase.
- Replaced dummy rows with real MongoDB data on all major list pages.
- Product detail/edit/delete popups implemented; compliance option UI removed.
- Inventory: five tabs, Adjust Stock persistence, ledger delete with stock reversal/rollback.
- Sales lifecycle: manual + autocomplete customer entry, product dropdown in Item name, row 3-dot menu with Edit/Delete/Record Payment, no order-detail popup/Delivered section/Saved badge.
- Sale orders deduct/restore stock and write `StockMovement` records.
- Wholesale-price-based sale order pricing implemented; backend authoritative on create.
- Customers: Section 3 removed; DB-backed `/customers/[id]`; menu Open Profile/Edit/Delete/Create Sale/Record Payment; statuses `Active|Inactive|Blocked`.
- Sales row click opens matching customer profile; checkbox/menu clicks isolated.
- Suppliers: real list/add/edit/delete/filter/export; product multi-select; row opens supplier profile; selected products render with black text.
- Purchases: fully DB-backed create/edit/preview/print/receive/payment/delete/receipt/history; supplier autocomplete/auto-fill; clean post-save redirect.
- Partial receiving with cumulative received quantity and idempotency/conflict handling.
- Purchase target quantity starts at 0; full entered quantity added to product stock.
- Purchase deletion reverses stock and removes purchase movements.
- Add Product page now forces a full reload on entry and starts with empty inputs.
- Row action menus use `z-[9999]`; autocomplete dropdowns unchanged.
- Status wording updated: customer `Blocked`, supplier `On Hold`.
- Credit-related fields/warnings removed from sale order form.
- `OrderActionsPopup.tsx` deleted; `OrderActionsMenu.tsx` added.
- Optional product flavors added end-to-end:
  - `Product.flavors[]` create/update via a chip editor in Add/Edit Product; displayed in product detail and product pickers.
  - Sale order items carry an optional line `flavor`; selector appears in create/edit sale forms, including Customer Profile → Create Sale.
  - Purchase line items carry an optional line `flavor`; selector appears in create/edit purchase form and values display in preview/detail/receive views.
  - Suppliers can store a default flavor per linked product; the default is applied when that product is selected in purchases.
  - Flavor remains descriptive only: no per-flavor stock, pricing, or stock-movement changes.

---

## 12. Pending Tasks / Not Implemented

### High priority / correctness

1. Fix `PUT /api/purchases/:id` so newly added items add their quantity to stock (currently sets `AUTO-STOCK` receipt without `$inc`).
2. Fix `PATCH /api/purchases/:id/status` Cancelled path so stock/movements are reversed if anything was received.
3. Wire or intentionally document auth. Current `.env` lacks JWT/session secrets; login is broken.
4. Decide whether to enforce auth on business APIs and build frontend login; this is a large change and must be approved first.
5. Reconcile stored customer/supplier counters with live sale/purchase data, or remove the stale fields/columns.
6. Fix sale-order tax/total inconsistency if tax is meant to be charged.

### Partial UI / placeholders

- Inventory Transfers tab (no model/API/records).
- Customer Returns & Credit Notes tab (no returns model/API).
- Payments & Finance, Reports & Analytics, AI Assistant, Notifications, Automations, Staff & Roles, Settings, Help & Support, Logout nav items.
- Global search, notification button, header date/user identity are decorative/hardcoded.
- Product `Upload Invoice with AI`, `Export CSV`, Inventory `Stock Audit Report PDF`.
- Supplier Record Payment/Send Statement/Aging ledger/WHT download/Customize Columns/AUTO-REFRESH.
- Customer list Record Payment is generic; supplier detail Record Payment lands on filtered purchase list.
- Dashboard Create Purchase and Record Payment quick actions are misleading.
- Dashboard has no success-state refresh/polling; “Synced today at” can go stale.
- Dashboard Recent Orders footer count is wrong when more than 5 orders exist.
- Sales order row click opens customer profile; if intended behavior differs, revisit intentionally.
- Create-vs-edit sale product price source mismatch in UI dropdowns.
- Multi-image Cloudinary upload flow required by `AGENTS.md` is not implemented.
- Customer credit fields are create-only; decide if edit should support them.
- Bank details tab label exists with no schema/UI data.
- No automated tests; no backend lint script.

### Documentation/config hygiene

- `.env.example` duplicate Cloudinary block and stray bare `Cloudinary` line.
- `frontend/README.md` is stale create-next-app boilerplate (claims Geist font).
- No product API doc, auth API doc, or root README.
- `docs/suppliers-api.md` has stale phone/payableNote examples.

---

## 13. Known Bugs, Issues & Risks

### Verified backend bugs

1. **Purchase PUT stock bug** — `buildPurchaseChanges()` sets `stockToAdd = quantity` for new items, but `updatePurchase()` does not apply `Product.$inc` or create a movement. Purchase can look received while stock is unchanged.
2. **Purchase Cancelled status bug** — `PATCH /:id/status` sets Cancelled without reversing stock or deleting movements, unlike DELETE. It also allows received purchases to be moved back to Draft/Ordered.
3. **Sale-order tax not charged** — `financials.tax` is stored but `total` excludes it.
4. **Product edit drops 3 booleans** — `climateControlled`, `eligibleForReturn`, `halalPsqcaCertified` are not updated by PUT.
5. **Login broken with current env** — JWT secrets absent.
6. **Register has no validation** — missing fields can throw 500.
7. **Mongoose ValidationError → 500** unless wrapped by controller.
8. **next-code race** — concurrent callers can receive same code; creates retry on 11000.
9. **`runWithSession()` calls `endSession()` without await**; transaction capability cached process-wide.

### Verified frontend issues

- Hardcoded shell date `Today · 16 Nov 2026`, user `Tariq M.`, role `Owner`, ID `#001`, notification badge `3`.
- Sales row click not keyboard accessible.
- Inventory checkboxes have no `checked`/`onChange`.
- Global search has no label or handler; `⌘K` badge but no shortcut.
- Many `href="#"` nav items.
- Z-index scale inconsistent: action menus `z-[9999]` can overlay dialogs/toasts.
- Product compliance flags unused.
- Dashboard recent orders count bug (`Showing {orders.length} of {totals.today}` where `orders` is capped at 5).
- Dashboard quick actions misdirect.
- Pricing mismatch in sale form dropdown vs wholesale-only create logic.
- Customer “Credit Hold” appears in helper logic but is not a selectable customer status.
- “Saved Purchase Order” copy in `PurchaseDetailDialog.tsx` even for existing purchases.

### Security / operational risks

- All business APIs public; CORS allows no-Origin clients.
- Real credentials present in `backend/.env` (gitignored, but present in workspace).
- In-memory session store; no CSRF protection; no auth on frontend.
- No Git repository: no history/rollback.
- Backend list limits can make dashboard aggregates partial.
- Product delete leaves related `StockMovement` rows; product/customer/supplier deletes do not check dependencies.

---

## 14. Important Decisions

- Public product/supplier/customer/purchase/sale-order APIs; no auth middleware added to business routes.
- Numbering bases: purchase `PO-2042`, supplier `S-208`, customer ledger `C-410`, sale order `SO-8825+` (base 8824).
- Inventory status derived from stock vs reorder threshold; reserved stock forced to `0`.
- Negative stock blocked with guarded `$inc`; standalone Mongo uses compensating rollbacks via `runWithSession`.
- GRN stock movements use `type: "purchase"`, `direction: "in"`; movement deletion remains limited to `type: "adjustment"`.
- Partial receiving uses cumulative `receivedQuantity`; repeated cumulative submissions are idempotent; concurrent losers get `409`.
- Purchase creation stores `availableStock` but adds the full submitted `quantity` to stock.
- Editing/re-saving a purchase does not re-add stock (except the known PUT bug for newly added items).
- Supplier update prunes stale saved `productIds`; new unknown product IDs still fail validation.
- Purchase row click navigates to `/suppliers/<supplier _id>`; `View PO` remains in the 3-dot menu.
- Bank fields not stored; supplier profile shows saved supplier data only.
- Sale order create deducts stock; edits apply quantity delta; deletes restore stock; status/payment updates never touch stock.
- Catalog SKU items are stock-tracked; items without matching SKU are saved but do not change stock.
- Insufficient sale stock returns `400` with no order/movement saved; duplicate SKUs aggregated before validation.
- Legacy sale orders not retroactively deducted; editing applies stock for catalog items at that point.
- Customer `On Hold` replaced by `Blocked`; supplier statuses still use `On Hold`.
- Credit Account/NTN/Credit Limit/Current Dues/Credit Days removed from sale order form; legacy DB fields remain hidden.
- Unpaid sale orders use `dueDate: "Due on receipt"` and `paymentLabel: "Unpaid (Due on receipt)"`.
- Earlier retail/wholesale qty-based pricing superseded: catalog items always use `Product.wholesalePrice` on create; manual items keep client `unitPrice`; edits preserve saved price.
- QTY/UNITPRICE uppercase label/tag tweak was reverted; labels remain `Qty` / `Unit Price`.
- Customer profile totals derived live from saved sale orders instead of stale DB counters; `total = subtotal - discount + freight`.
- Order↔customer resolution uses phone/name matching because `SaleOrder` has no `customerId`.
- Returns & Credit Notes tab remains empty because no returns model/API/records exist.
- Add Product links use plain `<a>` to force full page reload; Add Product form also keyed by pathname with `blankForm()` and `autoComplete="off"`.
- Flavors are **descriptive only**: stock, pricing, and stock movements remain product-level; `openingStock` is never split by flavor.
- Product flavors are normalized server-side: comma/newline/array input accepted, trimmed, de-duplicated case-insensitively, max 24 values and 80 chars each.
- Sale/purchase line flavor is a plain optional string (max 120 chars); a case-insensitive match to a catalog flavor is canonicalized to the catalog spelling.
- Supplier default flavors are stored as `productFlavors` keyed by product ID and pruned to products currently linked to that supplier.
- Purchase supplier snapshots now include the supplier's `productFlavors` map so edit forms can restore defaults historically; live supplier flavors are preferred when available.

---

## 15. Current Project State & Latest Change Log

### Latest task: optional product flavors (completed 2026-11-20)

- **Approved plan:** optional `Product.flavors[]`, line-level `flavor` on sale/purchase items, and supplier default `productFlavors` map; descriptive only, no per-flavor stock.
- **Files created:**
  - `frontend/app/products/components/FlavorInput.tsx`
- **Backend files modified:**
  - `backend/src/models/Product.js` — added `flavors: [String]`.
  - `backend/src/controllers/product.controller.js` — added `normalizeFlavors()` and persisted flavors on create/update.
  - `backend/src/models/SaleOrder.js` — added item `flavor`.
  - `backend/src/controllers/sale-order.controller.js` — validates/normalizes line flavor and canonicalizes case-insensitive matches to catalog spelling.
  - `backend/src/models/Purchase.js` — added item `flavor` and supplier snapshot `productFlavors` map.
  - `backend/src/controllers/purchase.controller.js` — validates/stores line flavor and copies supplier flavor defaults into the purchase snapshot.
  - `backend/src/models/Supplier.js` — added `productFlavors` map.
  - `backend/src/controllers/supplier.controller.js` — `normalizeSupplierProducts()` now validates product IDs, prunes stale links, and stores only flavors valid for linked products.
- **Frontend files modified:**
  - `frontend/app/products/types.ts`, `frontend/app/products/add/page.tsx`, `frontend/app/products/components/EditProductModal.tsx`, `frontend/app/products/components/ProductDetailModal.tsx`
  - `frontend/features/sales-orders/types.ts`, `utils.ts`, `components/OrderFormDialog.tsx`, `components/ProductAutocomplete.tsx`
  - `frontend/features/purchases/types.ts`, `utils.ts`, `components/CreatePurchaseView.tsx`, `components/PurchaseItemsTable.tsx`, `components/ProductPicker.tsx`, `components/PurchasePreviewDialog.tsx`, `components/PurchaseDetailDialog.tsx`, `components/ReceivePurchaseDialog.tsx`
  - `frontend/features/suppliers/types.ts`, `services/supplier.service.ts`, `components/ProductMultiSelect.tsx`, `components/AddSupplierForm.tsx`, `components/EditSupplierDialog.tsx`
  - `frontend/features/customers/components/CustomerOrdersLedger.tsx`, `components/CustomerInvoices.tsx` — flavor shown in order summaries.
- **UI behavior added:**
  - Add/Edit Product: chip-based optional flavor editor with Enter/comma support, remove buttons, and product-level stock note.
  - Product detail, sale product autocomplete, and purchase product picker show available flavors.
  - Sale create/edit and purchase create/edit show a flavor select only when the selected product has flavors (or the saved line has a legacy flavor).
  - Supplier add/edit shows a default-flavor select beside each selected product that has flavors.
  - Purchase selection applies the supplier's default flavor; changing suppliers updates/clears line flavors accordingly.
- **Dependencies added:** none.
- **Verification performed:**
  - `node --check` on all 30 backend `.js` files ✅
  - `npx tsc --noEmit` ✅
  - `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning)
  - `npm run build` ✅
  - Live API smoke test on `http://localhost:5000` ✅: product create with duplicate flavors, product update to add Mango, supplier default flavor, purchase line flavor + supplier snapshot, sale line canonicalized from `mango` to `Mango`; all created records deleted in `finally`.
- **Side effects/risks:** saved flavors are descriptive only; existing sale/purchase records without flavor remain valid. Existing supplier defaults are pruned if a product's flavor list changes and the supplier is re-saved.

### Baseline documentation task

- **Task:** Full read-only project analysis and creation of persistent memory.
- **Application code changed:** None.
- **File created:** `C:\Users\yasir\Desktop\real projects\inv_system\PROJECT_MEMORY.md`
- **Verification:** Three independent read-only analysis passes (backend, frontend, project-wide) completed; no application files modified by this task.
- **Memory behavior going forward:** after every future task, update this file with actual changes, decisions, and new/removed pending items.

### Most recent application changes before this memory

Verified present in code:

1. Purchase `Quantity (Target)` starts at `0`; full entered quantity adds to product stock on create; `availableStock` is a snapshot.
2. Purchase delete reverses stock and removes matching purchase movements.
3. Add Product links are plain `<a href="/products/add">` in products/inventory/dashboard so the page loads fresh.
4. Add Product page uses `AddProductForm key={pathname}`, `blankForm()`, and `<form autoComplete="off">`.
5. Sale orders use `Product.wholesalePrice` authoritatively for new catalog items.
6. Sales row click opens matching customer profile.
7. Customer statuses `Active|Inactive|Blocked`; supplier statuses `Active|On Hold|Inactive`.
8. Credit fields/warnings removed from sale order form.
9. Row 3-dot menus use `z-[9999]`.

### Typical verification commands

```powershell
# backend syntax (all JS files)
$files = Get-ChildItem -Path src -Recurse -Filter *.js; foreach ($file in $files) { node --check $file.FullName }

# frontend
npx tsc --noEmit
npm run lint
npm run build
```

Live API smoke tests have been performed against `http://localhost:5000`, including purchase create/delete stock round-trips. When testing live data, always restore stock/cleanup test records.

---

## 16. Quick Reference: Do / Don’t

**Do:**

- Read this memory first.
- Plan → wait for approval → execute → update memory.
- Use existing feature services, hooks, components, and utilities.
- Use Tailwind utility classes and existing design tokens.
- Verify with `tsc`, `lint`, `build`, and API smoke tests where appropriate.
- Preserve existing behavior unless explicitly asked to change it.
- Keep secrets out of docs and responses.

**Don’t:**

- Don’t start coding before approval.
- Don’t add new dependencies without a strong reason and explicit approval.
- Don’t add auth middleware to business APIs by accident.
- Don’t assume Stitch HTML sample data is real app data.
- Don’t rewrite the whole memory file for small changes; patch relevant sections.
- Don’t delete or restructure existing functionality without explaining it in the plan.
- Don’t expose `.env` values.

---

**End of baseline memory.**
