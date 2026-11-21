# PROJECT_MEMORY.md

> Persistent working memory for the StockFlow inventory system.
> Last updated: **2026-11-21** (sales-order edit form hides the Order Items section; items remain preserved in payload).
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

**Root structure** (no root `package.json`, no root README):

```text
inv_system/
├── .gitignore     Root ignore rules; excludes "stich ui/" and OS/editor files
├── backend/       Express + MongoDB API
├── frontend/      Next.js App Router UI
└── stich ui/      Stitch design references (folder name is misspelled; use exactly "stich ui")
```

**Git:** The workspace is now a Git repository on branch `main`, tracking `https://github.com/yasiralatif123-spec/Ai-inven-system.git`. `backend/`, `frontend/`, and `PROJECT_MEMORY.md` are committed; `stich ui/` is intentionally ignored and not tracked.

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
- Live multi-flavor smoke test ✅ on `http://localhost:5000`: sale order with `["chese","SALT","mystery"]` canonicalized to `["chese","salt","mystery"]`; supplier defaults `["chese","SALT","mystery"]` stored as `["chese","salt"]` (non-catalog value dropped); purchase line stored as `["chese","salt"]`. All smoke records deleted; LAYS stock was 50 then, and is 5 now after a separate real sale.
- Live receive-only purchase + customer-link smoke test ✅ on `http://localhost:5000` (2026-11-21): purchase create with 2 flavors stored `basePrice=50`, `flavorCount=2`, `unitPrice=100`, `receivedQuantity=0`, no stock change; partial receive added only delta 1 and repeated receive was idempotent; sale with `customerId` stored the link and `?customerId=` filtered correctly; all smoke records deleted and LAYS stock returned to 5.
- Live flavor-stock smoke test ✅ on `http://localhost:5000` (2026-11-21): purchase 10×3 flavors → product 30 / each flavor 10; 2-flavor sale → product 26 / chese+chilli 8; flavor adjustment and sale/purchase deletion restored all balances; all temp business records deleted and leftover immutable sale ledger rows removed directly from MongoDB.
- Live ports used previously: backend `http://localhost:5000`, frontend `http://localhost:3000` (a `next start --port 3100` instance was also observed).

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
- `flavorStocks`: array of `{ flavor, quantity }`; created/updated only when a flavor is actually received, sold, or adjusted. Inventory renders one row per entry. Entries are not removed when quantity reaches `0` (the purchased flavor must remain visible).
- `purchasePrice`, `wholesalePrice`, `retailPrice`
- `taxBracket`, `uom`, `warehouse`, `rackBay`
- `openingStock` — **authoritative product-level total**; for products with `flavorStocks`, it is the sum of all flavor balances (each received/sold quantity is multiplied by selected flavor count)
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
- `partyName` (default `""`) — denormalized counterparty captured at movement time: supplier name for purchases, customer/buyer name for sales.
- `flavor` (single flavor) and `flavorBreakdown: [{ flavor, quantity }]` (multi-flavor purchase/sale lines) — audit context for flavor-level stock changes. `quantity` always stores the product-level total.
- Purchase movements use `type: "purchase"`, `direction: "in"`, reference `<PO> · <GRN ref>` (or `<PO> · STATUS-RECEIVED`) and are created by both status-driven receiving and Receive Goods (legacy `AUTO-STOCK` rows may still exist).
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
- `productFlavors`: `Map<String, String[]>` keyed by product ID for the supplier's default flavors; values are canonicalized against the product's catalog flavors, and stale/product-less values are pruned on save
- `status`: **`Active | On Hold | Inactive`** (different vocabulary from customers)
- `totalPurchases`, `outstanding` — stored, not updated by purchases
- `payableNote`, `payableTone`, `lastPurchaseAt`, `createdBy`
- **No bank/IBAN/account fields exist**, despite a `Contact & Bank Profile` tab label in the UI.

### `Purchase` (`backend/src/models/Purchase.js`)

Embedded sub-schemas:

- Receipt: `quantity`, `receivedQuantity`, `reference`, `notes`, `receivedAt`, `performedBy`
- Item:
  - `productId` is an indexed **String** containing the actual product ID (not duplicated as an ObjectId ref)
  - `name`, `sku`, `flavor` (`String[]`), `quantity`
  - `availableStock` — read-only snapshot at selection
  - `receivedQuantity` — cumulative received; starts at `0` on create
  - `receipts[]`
  - `unit`, `basePrice`, `flavorCount`, `unitPrice`, `discount`, `taxRate`, `taxAmount`, `lineTotal`
    - `basePrice` is the authoritative `Product.purchasePrice` snapshot; `flavorCount` is the number of selected flavors; `unitPrice = basePrice × flavorCount`
- Payment: `amount`, `method`, `reference`, `paidAt`, `createdBy`

Root:

- `purchaseNumber` unique/indexed, generated from base 2041 → `PO-2042`
- `supplier` embedded snapshot (indexed `id`, `code`, `name`, `contact`, `phone`, `hub`, `address`, `ntn`, `paymentTerms`, `productIds[]`, `productFlavors` map of `String[]`)
- `purchaseDate`, `expectedDelivery`, `invoiceNumber`
- `items[]` (validator: at least one)
- `financials` (`subtotal`, `discount`, `tax`, `freight`, `total`)
- `paidAmount`, `payments[]`
- `status`: `Draft | Ordered | Partially Received | Received | Cancelled`
- `notes`, `createdBy`

### `SaleOrder` (`backend/src/models/SaleOrder.js`)

Embedded sub-schemas:

- Item: `name`, `sku`, `flavor` (`String[]`), `productId` ObjectId ref (nullable), `quantity`, `unitLabel`, `basePrice`, `flavorCount`, `unitPrice`, `available`, `stockDeducted`, `lineTotal`
  - `basePrice` is `Product.wholesalePrice`; `flavorCount` is the selected flavor count; `unitPrice = basePrice × flavorCount`
- Credit: `accountName`, `ntn`, `creditLimit`, `currentDues`, `available` — legacy; new orders do not populate meaningfully
- Warning: legacy exposure/approval fields; new orders default to `null`
- Financials: `subtotal`, `discount`, `tax`, `freight`, `total`, `paid`, `outstanding`, `dueDate`

Root:

- `orderNumber` unique/indexed, generated from base 8824 → `SO-8825+`
- `customer` embedded `{ customerId, name, phone, location }`; `customerId` is an indexed `ObjectId` ref `Customer` (nullable) and is used by `GET /api/sale-orders?customerId=<id>`
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
| GET | `/api/sale-orders` | Newest first, limit 200; optional `?customerId=<ObjectId>` |
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
| POST | `/api/purchases` | Recomputes strict flavor pricing; optional `paymentAmount` (0..total) records initial payment atomically; `Received` fully receives with stock/movement, `Draft`/`Ordered` save `receivedQuantity=0` with no stock |
| PUT | `/api/purchases/:id` | Recomputes purchase; `Received` adds only the positive stock delta, other statuses never apply stock |
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
| `customerId` | `GET /api/sale-orders`, customer profile hook | Backend-filter owned orders by linked customer |
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
- Products with received flavors expand into one inventory row per flavor (`Chese Lays`, `Chilli Lays`, `Salt Lays`); product page still shows one product with its flavor list. Products without `flavorStocks` keep the single product row.
- Each flavor row uses the flavor's own available balance and the product's `reorderThreshold` for status and the Min. Safety horizontal bar, so bars differ per flavor.
- Adjust Stock on a flavor row sends `flavor` and updates both that flavor balance and product total; flavorless adjustments are unchanged. Only adjustment movements are deletable and deletion reverses both balances.
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
- Customer↔order resolution uses `SaleOrder.customer.customerId` when present (autocomplete fills it from the saved customer), with phone/name/business fallback for legacy orders.
- Manual orders without a saved customer show a notice.
- New-order catalog prices come from `Product.wholesalePrice`; edit mode preserves saved/manual price unless flavors change.
- Item snapshots store `basePrice` and `flavorCount`; sold-product tables show quantity, flavors, unit price, line total, order date, payment status, and order status.
- Credit Account, NTN, Credit Limit, Current Dues, Credit Days removed from sale order form; no credit warnings.
- Unpaid orders use `dueDate: "Due on receipt"` and `paymentLabel: "Unpaid (Due on receipt)"`; legacy DB fields remain hidden by frontend DTO.

### Customers

**Status:** Implemented, DB-backed, with derived profile data.

- CRUD + next-code; search, filters, sort, pagination, CSV export, Cmd/Ctrl+K focus.
- Customer profile loads the customer, backend-filtered orders via `?customerId=`, plus a legacy phone/name pass; it derives:
  - `orders` count
  - `totalPurchases`
  - `outstanding = openingBalance + sum(order.financials.outstanding)`
- Profile actions: Edit, Record Payment, Create Sale prefilled, Delete, order `View` opens `?order=<id>` on Sales page.
- Tabs: Orders/Invoices/Payments/Notes/Activity are real or derived from sale orders.
- Orders tab shows each sold product with flavors, quantity, `unitPrice`, `lineTotal`, order date, payment status, and fulfillment status; CSV export includes the same pricing detail.
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
- Purchase History tab now renders every purchased line with flavors, ordered/received quantity, `basePrice × flavorCount = unitPrice`, line total, PO date, and status; repeated purchases appear as separate PO rows and are included in CSV export.
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
- Purchase lines use strict `Product.purchasePrice`; `unitPrice = purchasePrice × selected flavor count`, and flavored products require at least one flavor.
- Create/edit header now has a status selector (`Draft`, `Ordered`, `Received`). Saving `Received` fully receives the purchase with a `STATUS-RECEIVED` receipt and `purchase` stock movement; saving `Draft`/`Ordered` leaves stock unchanged.
- Partial receiving via GRN still uses cumulative `receivedQuantity`, adds only the new delta, prevents duplicate stock updates, idempotent repeat submissions, 409 on concurrent conflict.
- Delete reverses received stock and removes related purchase movements.
- Saved purchase orders do not update supplier `totalPurchases`/`outstanding`.
- `Upload Supplier Invoice is not connected yet.` notice remains.

---

## 7. Business Logic & Rules

### Stock

- `Product.openingStock` is the authoritative product total; `Product.flavorStocks` holds per-flavor balances for products with flavors. A received/sold quantity applies in full to each selected flavor; total = `quantity × selected flavor count`.
- Only flavors that have been received appear in `flavorStocks` and therefore as separate inventory rows. Rows stay at `0` after being fully sold instead of disappearing.
- Stock deductions/restorations happen for sale orders and purchases/inventory only where explicitly implemented.
- Guard pattern: atomic `$inc` with `openingStock: { $gte: quantity }` where supported; flavor balances use a guarded read-modify-write helper (`backend/src/utils/flavor-stock.js`) with compensations. Standalone Mongo uses compensating reversals via `runWithSession`.
- Movements are audit records; only `adjustment` movements can be deleted through the API.

### Sale order rules

- One flavor/chip costs `Product.wholesalePrice` for sale orders; purchases use strict `Product.purchasePrice`.
- For catalog products with flavors: `Unit Price = selected flavor count × wholesalePrice`, and at least one flavor is required. Products without flavors use the base wholesale price.
- `Item Total = Qty × Unit Price`; quantity stays a separate multiplier; subtotal/total update with discount/freight.
- Catalog prices are authoritative from the database on create, on newly added edit items, and whenever the flavor set changes. Both sale and purchase items store `basePrice`/`flavorCount` snapshots. Manual items keep client-supplied price; unchanged edits preserve the saved snapshot/price from the database record rather than trusting the request body.
- Duplicate SKUs are aggregated before stock validation.
- Insufficient stock → `400` with available/requested; no order saved.
- Order create deducts stock: product total by `quantity × flavor count`, and each selected flavor row by the full quantity. Edit applies only the **delta** (including flavor changes); delete restores full deducted quantity. A flavor with insufficient stock blocks the sale.
- Status and payment updates never touch stock.
- `financials.tax` is computed as 18% embedded tax but **not added to `total`**; `total = subtotal - discount + freight`. This is documented but financially inconsistent.
- Unpaid orders: `dueDate: "Due on receipt"`, `paymentLabel: "Unpaid (Due on receipt)"`.
- Delivered orders archived/hidden from normal workflow.

### Purchase rules

- Quantity (Target) starts at `0` in the form for every new row/product selection/barcode scan.
- `availableStock` is only a stored snapshot; it does not reduce the stock increment.
- Catalog items must have a non-zero `Product.purchasePrice`; no fallback to wholesale/retail price. Flavored catalog items require at least one selected flavor.
- `unitPrice = purchasePrice × selected flavor count`; prices are snapshotted as `basePrice`/`flavorCount`/`unitPrice` and cannot be overridden by the request body.
- Saving with `Received` (POST/PUT) sets each item's `receivedQuantity` to its ordered quantity, appends a `STATUS-RECEIVED` receipt for the positive delta only, increments `Product.openingStock` by `delta × selected flavor count`, increments every selected flavor's `flavorStocks` balance by `delta`, and writes a `purchase`/`in` `StockMovement` with flavor breakdown. Saving again with `Received` is idempotent.
- Saving with `Draft` or `Ordered` adds no stock; new purchases start with `receivedQuantity=0`.
- Receiving via `/receive` still uses **cumulative** `receivedQuantity`; only the positive delta is added to stock, and repeated submissions are idempotent. Both receipt paths share the same stock helper.
- Editing cannot reduce the ordered quantity below what was already received or change a received item’s linked product. PUT only increases `receivedQuantity` when the submitted status is `Received`; other statuses still require GRN.
- Status is derived from `receivedQuantity` on every save/receive; Cancelled remains a terminal status.
- Purchase delete reverses product and flavor stock by cumulative `receivedQuantity`, deletes matching `purchase` movements, and deletes the purchase atomically/compensated.
- Known bug: `PATCH .../status` to Cancelled does not reverse stock.

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
- Purchase target quantity starts at 0; stock is added only through Receive Goods.
- Purchase deletion reverses received stock and removes purchase movements.
- Add Product page now forces a full reload on entry and starts with empty inputs.
- Row action menus use `z-[9999]`; autocomplete dropdowns unchanged.
- Status wording updated: customer `Blocked`, supplier `On Hold`.
- Credit-related fields/warnings removed from sale order form.
- `OrderActionsPopup.tsx` deleted; `OrderActionsMenu.tsx` added.
- Optional product flavors added end-to-end:
  - `Product.flavors[]` create/update via a chip editor in Add/Edit Product; displayed in product detail and product pickers.
  - Sale order items carry optional line `flavor[]`; multi-select appears in create/edit sale forms, including Customer Profile → Create Sale.
  - Purchase line items carry optional line `flavor[]`; multi-select appears in create/edit purchase form and values display in preview/detail/receive views.
  - Suppliers can store default `productFlavors: Record<string, string[]>` per linked product; defaults are applied when that product is selected in purchases.
  - Flavor remains descriptive only: no per-flavor stock or stock-movement changes.
- Sale order flavor-based pricing: catalog unit price is `selected flavor count × Product.wholesalePrice`; the UI shows the live formula, requires at least one flavor for flavored products, and recalculates on create/new items/flavor changes while preserving saved prices on unchanged edits.
- Sale order create form now gives visible validation feedback instead of a silently greyed-out submit button; typing an exact catalog product name/SKU auto-fills SKU and wholesale-derived price; the dialog remounts fresh on every open under `cacheComponents`/`<Activity>`.
- Purchase/sale flavor pricing snapshots and status-driven purchase receiving are implemented; supplier/customer profile tables show detailed product history and sale orders carry actual customer IDs.

---

## 12. Pending Tasks / Not Implemented

### High priority / correctness

1. Fix `PATCH /api/purchases/:id/status` Cancelled path so stock/movements are reversed if anything was received.
2. Wire or intentionally document auth. Current `.env` lacks JWT/session secrets; login is broken.
3. Decide whether to enforce auth on business APIs and build frontend login; this is a large change and must be approved first.
4. Reconcile stored customer/supplier counters with live sale/purchase data, or remove the stale fields/columns.
5. Fix sale-order tax/total inconsistency if tax is meant to be charged.

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

1. **Purchase Cancelled status bug** — `PATCH /:id/status` sets Cancelled without reversing stock or deleting movements, unlike DELETE. It also allows received purchases to be moved back to Draft/Ordered.
2. **Sale-order tax not charged** — `financials.tax` is stored but `total` excludes it.
3. **Product edit drops 3 booleans** — `climateControlled`, `eligibleForReturn`, `halalPsqcaCertified` are not updated by PUT.
4. **Login broken with current env** — JWT secrets absent.
5. **Register has no validation** — missing fields can throw 500.
6. **Mongoose ValidationError → 500** unless wrapped by controller.
7. **next-code race** — concurrent callers can receive same code; creates retry on 11000.
8. **`runWithSession()` calls `endSession()` without await**; transaction capability cached process-wide.

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
- Git history is now available, but the initial commit contains the full existing codebase; future commits should stay small and reviewable.
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
- **Superseded (2026-11-21):** purchase creation previously stored `receivedQuantity=0` with no stock and only Receive Goods added stock; this was changed at the user's request.
- Purchase creation/edit form exposes a status selector; `Received` is now a full receipt that adds stock on save, while `Draft`/`Ordered` still store `receivedQuantity=0` and add no stock.
- Repeated `Received` saves add only the positive delta and never duplicate receipts or stock movements; GRN remains available for partial receipts and shares the same stock helper.
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
- Order↔customer resolution prefers the actual `SaleOrder.customer.customerId`; legacy orders without it still use exact phone/name/business matching.
- Purchase pricing uses strict `Product.purchasePrice` with no fallback; sales use `Product.wholesalePrice`.
- Both purchases and sales require at least one flavor for products that declare flavors; both store `basePrice` and `flavorCount` snapshots and multiply them for `unitPrice`.
- Supplier Purchase History and Customer Orders tabs were enriched in place; no duplicate tabs or collections were added.
- Returns & Credit Notes tab remains empty because no returns model/API/records exist.
- Add Product links use plain `<a>` to force full page reload; Add Product form also keyed by pathname with `blankForm()` and `autoComplete="off"`.
- Add Supplier/Add Customer forms reset their state in the submit handler before redirect (Next.js `<Activity>` state preservation); no refresh and no `bfcacheId` used.
- **Superseded (2026-11-21):** flavors were previously descriptive only; stock was product-level and never split by flavor.
- Flavor-wise inventory is now authoritative: `Product.flavorStocks` holds per-flavor balances while `openingStock` remains the product total. Each received/sold quantity applies to every selected flavor, matching the existing flavor-count pricing rule. No separate collection or duplicate product records were introduced.
- No backfill was requested or performed: existing received purchases/sale orders do not populate `flavorStocks` retroactively; new receipts/adjustments do. Existing ordered purchases remain no-stock until received.
- The product page still creates/edits one product with multiple flavors; inventory expands that product into one row per received flavor. Each row's Min. Safety bar uses the flavor's own balance with the product-level `reorderThreshold`.
- Product flavors are normalized server-side: comma/newline/array input accepted, trimmed, de-duplicated case-insensitively, max 24 values and 80 chars each.
- Flavor inputs on Add/Edit Product auto-split comma-separated text as it is typed and commit the trailing value on blur; Enter and "Add flavor" remain optional.
- Sale/purchase line flavor is an optional `String[]` (each value max 120 chars, max 24 values); values may also arrive as a comma/newline-separated string and are split server-side. Case-insensitive matches to catalog flavors are canonicalized to the catalog spelling; non-catalog values are preserved on sale/purchase lines but dropped from supplier defaults.
- Supplier default flavors are stored as `productFlavors: Map<String, String[]>` keyed by product ID and pruned to products currently linked to that supplier.
- Purchase supplier snapshots now include the supplier's `productFlavors` map so edit forms can restore defaults historically; live supplier flavors are preferred when available.
- `StockMovement.partyName` is a denormalized snapshot taken when the movement is written (supplier for purchases, buyer for sales); the ledger is immutable and older movements are not backfilled.

---

## 15. Current Project State & Latest Change Log

### Latest task: Hide Order Items in sale-order edit (completed 2026-11-21)

- **User request:** Sales & Orders page me Edit dialog me "Order Items" section remove karna hai; ye section sirf Add New Sale / Order me dikhe.
- **Approved implementation (direct UI change):** `OrderFormDialog` me edit branch ko `null` kar diya gaya; create branch waise hi render hoti hai. Edit mode me `items` state phir bhi `draftOrderFromSalesOrder(order)` se load hoti hai taake payload, subtotal, discount, paid aur outstanding sahi rahein aur backend stock-delta zero rahe.
- **Validation adjustment:** Edit mode me hidden items ki client-side item validation (name/flavor/quantity/price/stock) skip ki gayi, kyunki user unhe edit kar sakta hi nahi. Backend `buildOrderChanges` apni validation aur pricing snapshots waise hi enforce karta hai. Customer, hub, total, paid>total jaise visible-field checks active rahe.
- **File modified:** `frontend/features/sales-orders/components/OrderFormDialog.tsx`, `PROJECT_MEMORY.md`.
- **No backend/API/DB changes, no new dependencies, no new files.** Add/new sale flow unchanged.
- **Git:** Naya local branch `hide-order-items-in-edit` (base `main` / `dc54dbc`) banaya gaya. User ne abhi commit/push nahi manga — changes uncommitted hain. Existing PR #1 (`fix/purchase-edit-saving-state`) is se unaffected hai.
- **Verification:** `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing warning); `npm run build` ✅ (16 routes).
- **Side effects/risks:** Edit dialog me ab item list nahi dikhti, isliye user wahan se product/qty/price change nahi kar sakta. Agar kisi legacy order ke items backend validation se match na karein to server error dikhega; UI se usse theek nahi kiya ja sakta.

### Previous task: Purchase payment from create/edit page (completed 2026-11-21)

- **User request:** Add/edit purchase page me remaining amount ko paid mein badalne ka option ho; database me `paidAmount` update ho aur remaining sahi rahe, aur jahan jahan paid/remaining dikhte hain wahan effect functional ho.
- **Approved decisions:**
  - Custom partial amount input + **Pay Full Remaining** button; partial aur full dono supported.
  - Edit me current paid se zyada/remaining se zyada amount block; purana payment ledger delete nahi hota (block recommended).
  - Create me initial payment atomic backend contract ke through; edit me additional payment dedicated `/payment` endpoint se.
- **Contract change (POST `/api/purchases`):** Optional `paymentAmount` (0..computed grand total), `paymentMethod` (default `Cash`), `paymentReference` (falls back to `invoiceNumber`). Backend sets `paidAmount` aur, jab amount > 0 ho, ek `payments[]` entry. PUT me ye fields ignore hote hain; existing ledger preserved. Docs updated in `backend/docs/purchases-api.md`.
- **Files modified:**
  - `backend/src/controllers/purchase.controller.js` — create-only initial payment validation/ledger; `DEFAULT_RECEIVED_BY` reuse.
  - `backend/docs/purchases-api.md` — contract updated.
  - `frontend/features/purchases/types.ts` — `CreatePurchasePayload` payment fields.
  - `frontend/features/purchases/constants.ts` — shared `PAYMENT_METHODS`.
  - `frontend/features/purchases/components/RecordPurchasePaymentDialog.tsx` — shared methods constant.
  - `frontend/features/purchases/components/PurchaseSummaryCard.tsx` — payment input, method select, Pay Full Remaining, live remaining-after-payment.
  - `frontend/features/purchases/components/CreatePurchaseView.tsx` — state, validation, create payload, post-save payment for edits.
  - `PROJECT_MEMORY.md` — memory + API table update.
- **No new dependencies, no new files (temp smoke script outside repo only).**
- **Where effect appears:** purchases list table/KPI/payment filter, supplier profile ledger/timeline, purchase detail dialog — sab `paidAmount`/`payments` se derived hain; add/edit se list par wapas aate hi fresh fetch hota hai.
- **Git:** Ye change abhi uncommitted hai; last pushed commit `31bab6c`. Push sirf explicit request par.
- **Verification:** `node --check purchase.controller.js` ✅; `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing warning); `npm run build` ✅ (16 routes). Live API smoke (temp records deleted): initial partial `paidAmount=100`, payments=1; after remaining payment `paidAmount=283.2`, remaining=0, payments=2; no paymentAmount → `paidAmount=0`, payments=0; amount > total → `400`.
- **Side effects/risks:** Edit me payment save ke baad failure par purchase details saved rehte hain aur error dikhta hai (user edit karke payment dobara kar sakta hai). Payment ledger immutable; reduce/clear support nahi.

### Previous task: Paid Amount / Remaining Amount display dropdown (completed 2026-11-21)

- **User request:** Purchases page aur purchases/add page me ek dropdown ho jisme **Paid Amount** aur **Remaining Amount** options hon, fully functional. Clarification ke baad user ne **display toggle** choose kiya (data/ledger change nahi).
- **Approved decision:** Dropdown sirf summary value switch karta hai. Purchases page ke KPI card me total paid vs total outstanding; purchase add/edit page ke summary me current purchase ka paid vs remaining (`Total − Paid`). Default view `Remaining Amount` rakha gaya taaki purana behavior bana rahe.
- **Files modified:**
  - `frontend/features/purchases/purchaseData.ts` — shared `PurchaseAmountView` type aur `PURCHASE_AMOUNT_VIEWS` constant.
  - `frontend/features/purchases/index.ts` — naya type export.
  - `frontend/features/purchases/components/PurchasesSummary.tsx` — Unpaid Balance KPI ab dropdown se Paid Amount / Remaining Amount dikhata hai; badge/subtext/color bhi view ke saath badalte hain.
  - `frontend/features/purchases/components/PurchaseSummaryCard.tsx` — `paidAmount` prop + amount-view dropdown aur computed remaining amount.
  - `frontend/features/purchases/components/CreatePurchaseView.tsx` — editing purchase ka `paidAmount` summary ko pass karta hai.
  - `PROJECT_MEMORY.md` — memory update.
- **No backend/API/DB changes, no new dependencies, no new files.**
- **Git:** Ye change commit `31bab6c` ke baad kiya gaya hai; purchase add page right sidebar removal bhi abhi uncommitted hai. Push sirf explicit request par.
- **Verification:** `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning); `npm run build` ✅ (16 routes).
- **Side effects/risks:** Sirf local UI state; dropdown selection save nahi hoti aur payment ledger par asar nahi karta.

### Previous task: Purchase add page right sidebar removed (completed 2026-11-21)

- **User request:** Purchase add page ka right side section remove karna tha.
- **Approved decision:** Right wali sticky `xl:col-span-4` column remove; main form full width; `PurchaseSummaryCard` items table ke neeche move; chhota “Draft ready to review / purchaseCode” pill remove (code header me pehle se hai). Freight, notes, totals, supplier ledger info aur Preview PO button bache hue hain.
- **Files modified:** `frontend/features/purchases/components/CreatePurchaseView.tsx`, `PROJECT_MEMORY.md`.
- **No backend/API/DB changes, no new dependencies, no new files, no component deleted.**
- **Git:** Ye change commit `31bab6c` (pushed) ke baad kiya gaya hai; abhi uncommitted hai. Push tabhi karna hai jab explicitly kaha jaye.
- **Verification:** `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning); `npm run build` ✅ (16 routes).
- **Side effects/risks:** Purchase add/edit page ab single-column hai; summary neeche aane se preview button thoda neeche milta hai. Koi functionality nahi hati.

### Previous task: Supplier profile row cleanup (completed 2026-11-21)

- **User request:** Supplier profile row me jo extra/faltu cheezein hain unhe remove karna tha, pehle batana tha kya remove hoga.
- **Proposed & approved cleanup (Recommended):**
  - Removed top duplicate product-name list (`purchase.items`) from the Purchased Products cell — line cards already show item names.
  - Removed per-line `date` (Date column already present) and per-line `status` (Status badge already present).
  - Removed per-line `basePrice × flavorCount` pricing formula; `unitPrice` and `lineTotal` remain visible.
  - Hidden the `No invoice reference` fallback; `Invoice #...` / notes now show only when a real reference exists.
  - Per-line `received x/y` kept only for `Partially Received` purchases; removed for others because Ordered/Received columns show totals.
- **Kept unchanged:** Purchase ID, Date, real invoice reference, item name + SKU, `qty @ unitPrice = lineTotal`, Flavor column, Ordered/Received/Total/Paid/Remaining/Status, and full CSV audit detail.
- **Files modified:** `frontend/features/suppliers/components/SupplierPurchaseLedger.tsx`, `PROJECT_MEMORY.md`.
- **No backend/API/DB changes, no new dependencies, no new files.**
- **Git:** Previous uncommitted tasks (dashboard date fix, customer Flavor columns, supplier Flavor column) remain uncommitted; last pushed commit `36e10a4`. This change is also uncommitted unless explicitly asked.
- **Verification:** `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning); `npm run build` ✅ (16 routes).
- **Side effects/risks:** Flavor column alignment now uses one placeholder line only when a real invoice/notes reference exists; both cells stay aligned.

### Previous task: Supplier profile Flavor column (completed 2026-11-21)

- **User request:** Supplier profile me bhi flavor ko alag column me dikhana hai, jaise customer profile me kiya gaya tha.
- **Approved decisions:** Purchase History table me “Purchased Products” ke baad **Flavor** column; har purchase line ka flavor usi column me aligned card me; flavorless ke liye `—`; CSV export me bhi alag `Flavors` column. Order-level rows waise hi rakhe gaye.
- **Files modified:** `frontend/features/suppliers/components/SupplierPurchaseLedger.tsx`, `PROJECT_MEMORY.md`.
- **No backend/API/DB changes, no new dependencies, no new files.**
- **Git:** Dashboard date fix aur customer-profile flavor columns abhi uncommitted hain; last pushed commit `36e10a4`. Ye change bhi uncommitted hai jab tak explicitly na kaha jaye.
- **Verification:** `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning); `npm run build` ✅ (16 routes).
- **Side effects/risks:** Table ek column wider hua; horizontal scroll pehle se maujood hai. Multi-line purchases me flavor cards item cards ke neeche aligned dikhte hain.

### Previous task: Customer profile Flavor column (completed 2026-11-21)

- **User request:** Customer profile item rows were not showing flavor clearly with the item; flavor should appear in its own Flavor column.
- **Approved decisions:** Add a dedicated Flavor column to both the Orders ledger and Invoices table. Keep order-level rows (do not flatten one row per item). Flavorless items show `—`. CSV export also gets a separate `Flavors` column.
- **Files modified:**
  - `frontend/features/customers/components/CustomerOrdersLedger.tsx` — new Flavor column with one aligned flavor card per item; inline flavor removed from item detail and CSV; empty `colSpan` 7 → 8.
  - `frontend/features/customers/components/CustomerInvoices.tsx` — new Flavor column beside Invoice / Order; invoice cell now lists item names only and the flavor cell mirrors the same first two items.
  - `PROJECT_MEMORY.md` — memory update.
- **No backend/API/DB changes, no new dependencies, no new files.**
- **Git:** Dashboard date fix from the previous task is still uncommitted; the last pushed commit remains `36e10a4`. This change is also uncommitted unless explicitly asked.
- **Verification:** `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning); `npm run build` ✅ (16 routes).
- **Side effects/risks:** Table width increased by one column on the customer profile; horizontal scroll is already present. Multi-item orders show flavors as stacked cards aligned with the item cards.

### Previous task: Dashboard sales chart dates made dynamic (completed 2026-11-21)

- **User request:** Dashboard graph dates were effectively fixed; make them dynamic so the chart reflects the current date properly.
- **Bugs found:** Date buckets used an inclusive `00:00` upper bound. Custom ended at today `00:00` (today's orders excluded), weekly ended at Sunday `00:00` (Sunday excluded), and monthly ended at next month's 1st `00:00` (month-end excluded). The dashboard also only recalculated when manually reloaded, so an open page kept stale dates past midnight.
- **Files modified:**
  - `frontend/features/dashboard/utils.ts` — `inRange()` is now `[from, to)`; weekly/custom ranges use exclusive end boundaries; display labels use the real last day; bucket keys use local dates instead of `toISOString()` timezone shifts.
  - `frontend/features/dashboard/hooks/useDashboard.ts` — checks the local date every minute and reloads the dashboard when it changes; initial timestamp is read inside `useEffect` to avoid Next.js 16 current-time prerender errors.
  - `PROJECT_MEMORY.md` — memory update.
- **No backend/API/DB changes, no new dependencies, no new files.**
- **Git:** This change is uncommitted unless explicitly asked; the previous customer-profile/adjust-panel commit is `36e10a4`.
- **Verification:** `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning); `npm run build` ✅ (16 routes). The first build attempt failed with Next.js 16 `blocking-prerender-current-time-client` because `new Date()` was read during render; moving it into `useEffect` fixed it.
- **Side effects/risks:** Bucket boundaries no longer overlap or drop the final day. An idle dashboard triggers one background data reload within ~60 seconds of local midnight.

### Previous task: Inventory Adjust Stock panel hidden by default (completed 2026-11-21)

- **User request:** The right-side Adjust Stock section on `/inventory` should be hidden by default and only open after clicking Adjust in a row.
- **Approved decision:** Change only the initial `adjustOpen` state to `false`. Existing `openAdjust(row)` already selects the row and opens the panel, and dashboard `?product=...&flavor=...` deep-links still open it explicitly. Header toggle and close behavior were left unchanged as requested.
- **Files modified:** `frontend/app/inventory/page.tsx`, `PROJECT_MEMORY.md`.
- **No backend/API/DB changes, no new dependencies, no new files.**
- **Git:** Sales-order customer navigation was not committed/pushed after the previous task; this change is also uncommitted unless explicitly asked.
- **Verification:** `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning); `npm run build` ✅ (16 routes).
- **Side effects/risks:** None. The table now occupies the full width until the panel is opened.

### Previous task: Sales-order customer click opens exact profile (completed 2026-11-21)

- **User request:** On the sales/orders page, clicking a customer should open that specific customer's profile.
- **Approved decisions:** Use the authoritative saved `order.customerId` first and navigate directly to `/customers/<id>`; keep phone/name resolution only for legacy orders without an ID. `customerId` also takes priority over phone inside the shared matcher.
- **Files modified:**
  - `frontend/features/sales-orders/components/SalesOrdersView.tsx` — `handleOpenCustomer()` direct-navigates by `order.customerId` before falling back to `findCustomerForOrder()`.
  - `frontend/features/customers/utils.ts` — `findCustomerForOrder()` checks `order.customerId` before phone/name, preventing a same-phone customer from winning.
  - `frontend/features/sales-orders/components/OrdersTable.tsx` — customer name is an explicit button with hover feedback and `stopPropagation`; row click still works.
  - `PROJECT_MEMORY.md` — memory update.
- **No backend/API/DB changes, no new dependencies, no auth changes.**
- **Git:** Dashboard flavor alerts were committed and pushed as `2bc5fae`; this customer-navigation change is not committed unless explicitly asked.
- **Verification:** `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning); `npm run build` ✅ (16 routes).
- **Side effects/risks:** Orders with a stale/deleted `customerId` now go straight to the profile route (which shows its own not-found/error state) instead of showing the sales-page notice. Legacy orders without an ID still use the previous fallback.

### Previous task: Flavor-aware dashboard low/critical stock (completed 2026-11-21)

- **User request:** Dashboard LOW STOCK ITEMS / Critical Low Stock should judge stock per purchased flavor and show the flavor name on each alert row.
- **Approved decisions:** Reuse `toStockRows()` so only received flavors produce flavor rows; show **all** low/critical rows (no 5-row cap); count KPI `lowStockCount`/`urgentCount` from the same flavor rows; critical rows sort before low rows. Legacy/flavorless products keep a single product row.
- **Files modified:**
  - `frontend/features/dashboard/utils.ts` — added `collectLowStockRows()`; `getDashboardKpis()` and `getLowStockRows()` now use it, with default limit `0` (all rows).
  - `frontend/features/dashboard/types.ts` — `LowStockRow` gained `productId` and `flavor`.
  - `frontend/features/dashboard/components/CriticalLowStock.tsx` — flavor pill beside product title, “items flagged”, and exact `/inventory?product=<id>&flavor=<flavor>` Adjust Stock link.
  - `frontend/app/inventory/page.tsx` — accepts `?flavor=` and selects the matching flavor row (falls back to the first product row).
  - `PROJECT_MEMORY.md` — memory update.
- **No backend/API/DB changes, no new dependencies, no auth changes.**
- **Git:** Earlier flavor-wise/pricing/receiving work was committed and pushed as `bb5afdf`; this dashboard change is not committed unless explicitly asked.
- **Verification:** `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning); `npm run build` ✅ (16 routes).
- **Side effects/risks:** A product with several low flavors now contributes several rows to the KPI count by design. Fully sold flavor rows at `0` are flagged critical. No historical purchase/sale records were backfilled.

### Previous task: Flavor-wise inventory rows and per-flavor stock (completed 2026-11-21)

- **User request:** A product is still saved once with multiple flavors, but `/inventory` must show one row per purchased flavor (`Chese Lays`, `Chilli Lays`, `Salt Lays`). Each flavor row must have its own stock and Min. Safety bar. A purchase with multiple flavors applies the full quantity to each flavor; sales deduct from the selected flavor rows.
- **Approved decisions:** Full quantity per selected flavor; sales deduct selected flavors; show only flavors that have been purchased; **no backfill** of old records; product-level `openingStock` becomes `quantity × flavor count` for flavored lines.
- **Files created:**
  - `backend/src/utils/flavor-stock.js` — shared `uniqueFlavors`, `totalStockDelta`, `flavorBreakdown`, and guarded `applyFlavorStockChange(s)` with compensations.
- **Files modified:**
  - `backend/src/models/Product.js` — added `flavorStocks: [{ flavor, quantity }]`.
  - `backend/src/models/StockMovement.js` — added `flavor` and `flavorBreakdown`.
  - `backend/src/controllers/purchase.controller.js` — status receipts, GRN, and delete now update every selected flavor and the multiplied product total; movements carry flavor breakdown.
  - `backend/src/controllers/sale-order.controller.js` — weighted stock totals and per-flavor deltas for create/edit/delete, including flavor-only rebalances; movements carry flavor breakdown.
  - `backend/src/controllers/inventory.controller.js` — `adjust-stock` accepts `flavor` (required when flavor rows exist) and reverses flavor + total on movement delete.
  - `frontend/app/products/types.ts` — `Product.flavorStocks`.
  - `frontend/app/inventory/data.ts` — `StockRow.productId`/`flavor`; `StockMovementDto.flavor`/`flavorBreakdown`.
  - `frontend/app/inventory/utils.ts` — `toStockRows()` expands flavored products; Min. Safety uses each flavor's own balance.
  - `frontend/app/inventory/page.tsx`, `components/AdjustStockPanel.tsx`, `services/inventory.service.ts` — render/refresh flavor rows and submit `flavor` on adjustments.
  - `backend/docs/purchases-api.md`, `backend/docs/sales-orders-api.md`, `backend/docs/inventory-api.md`, `PROJECT_MEMORY.md` — contract and memory updates.
- **No new dependencies, no auth changes, no new collection, and no duplicate product/tab/collections.**
- **Verification:**
  - `node --check` on all changed backend JS files ✅.
  - `npx tsc --noEmit` ✅.
  - `npm run lint` ✅ — 0 errors, 1 pre-existing layout font warning.
  - `npm run build` ✅ — all 16 app routes generated.
  - Live API smoke test on `http://localhost:5000` ✅ (temp product/supplier/purchase/sale created and deleted):
    - Purchase `Received`, `quantity=10`, flavors `chese/chilli/salt` → product stock `30`, each flavor `10`, one purchase movement `qty=30` with 3-entry breakdown.
    - Sale `quantity=2`, flavors `chese/chilli` → product `26`, chese/chilli `8`, salt `10`, sale movement `qty=4` with 2-entry breakdown.
    - Flavor adjustment `+3 chese` → chese `11`, product `29`; deleting that adjustment restored chese `8`, product `26`.
    - Sale delete restored all flavors to `10` and product to `30`; purchase delete reduced all flavor rows to `0` and product to `0`.
    - Sale ledger rows are immutable (original + reversal remain); only non-sale smoke movements were cleaned up directly from MongoDB after the test.
- **Follow-up UI refinement (same day):** Inventory table product name is now plain (e.g. `Lays Chips`); a separate **Flavor** column shows `Chese`/`Chilli`/`Salt` (or `—` for flavorless rows). CSV export and the Adjust Stock panel also show the flavor. Files additionally touched: `frontend/app/inventory/utils.ts`, `components/StockTable.tsx`, `components/AdjustStockPanel.tsx`, `page.tsx`. Verified with `npx tsc --noEmit`, `npm run lint` (0 errors, 1 pre-existing warning), and `npm run build` (16 routes).
- **Side effects/risks:** Product-level stock movement quantities for flavored lines are now multiplied by flavor count. Existing already-received flavors do not get historical rows because no backfill was requested. The `Cancelled` status stock-reversal bug remains unchanged.

### Previous task: Status-driven purchase receiving (completed 2026-11-21)

- **User request:** When purchasing from a supplier, product/inventory stock was not increasing. Add a status option on `/purchases/create`; when the status becomes `Received`, product stock should increase on the inventory and product pages.
- **Approved plan:** Keep `Draft`/`Ordered` as no-stock states, make `Received` a full goods receipt on save, preserve GRN for partial receipts, and add only positive deltas so repeated saves cannot double-stock.
- **Files modified:**
  - `backend/src/controllers/purchase.controller.js`
    - Added `STATUS_RECEIPT_REFERENCE` / `STATUS_RECEIPT_NOTES`, shared `createReceiptEntry()`, `applyStockReceipt()`, and `runCompensations()`.
    - `buildPurchaseChanges()` now returns `{ changes, stockUpdates }`; with status `Received` it sets each item's `receivedQuantity` to its ordered quantity, appends a receipt for the positive delta, and ignores any submitted `receivedQuantity`.
    - `POST /api/purchases` and `PUT /api/purchases/:id` now run inside `runWithSession()` and apply stock/movements atomically for `Received`; PUT restores purchase state on compensation in standalone Mongo.
    - `receivePurchase()` now uses the same stock helper and compensation runner as the status path.
  - `backend/docs/purchases-api.md` — corrected stale receive-only/create-time stock documentation and documented delta/idempotency guarantees.
  - `frontend/features/purchases/constants.ts` — added `PURCHASE_FORM_STATUSES` (`Draft`, `Ordered`, `Received`).
  - `frontend/features/purchases/components/CreatePurchaseHeader.tsx` — added a labelled Status selector and a context hint; legacy `Partially Received`/`Cancelled` remain visible but non-selectable when editing.
  - `frontend/features/purchases/components/CreatePurchaseView.tsx` — added status state, reset on new form, load from edited purchase, and submit selected status from both save buttons.
  - `PROJECT_MEMORY.md` — updated API table, purchase rules, decisions, and latest change log.
- **No new dependencies, no auth changes, no schema migration, no new collections/tabs.**
- **Verification:**
  - `node --check backend/src/controllers/purchase.controller.js` ✅.
  - `npx tsc --noEmit` ✅.
  - `npm run lint` ✅ — 0 errors, 1 pre-existing layout font warning.
  - `npm run build` ✅ — all 16 app routes generated.
  - Live API smoke test on `http://localhost:5000` with DairyMilk (`purchasePrice=50`, flavors `milk`/`chocklete`, stock `0`) ✅:
    - `Ordered` create kept stock `0`, `receivedQuantity=0`.
    - Changing to `Received` via PUT added exactly `2`, stored one `STATUS-RECEIVED` receipt, status `Received`.
    - Re-saving `Received` did not change stock or add a second receipt.
    - Direct `Received` create added `1` immediately.
    - Existing `Receive Goods (GRN)` path still added `1` and derived `Received`.
    - All smoke purchases deleted; stock restored to `0`; no smoke movements or purchases remained.
- **Side effects/risks:** Existing `Ordered` purchases are not retroactively received; open/edit them to `Received` or use GRN. The separate `PATCH .../status` Cancelled stock-reversal bug remains unchanged.

### Previous task: Supplier/customer product histories, flavor pricing snapshots, and receive-only purchases (completed 2026-11-21)

- **User request:** Show complete purchased/sold product histories on supplier/customer profiles (quantity, prices, flavors, dates, status); price purchases and sales by `Base Price × selected flavors × quantity`; make purchases add stock only when goods are received; keep backend authoritative and avoid duplicate stock records.
- **Clarified decisions:**
  - Purchase base price is strictly `Product.purchasePrice` (no wholesale/retail fallback); sale base remains `Product.wholesalePrice`.
  - Products with flavors require at least one selected flavor on both purchase and sale lines; flavorless products use 1× pricing.
  - Both `Purchase.items[]` and `SaleOrder.items[]` store `basePrice`, `flavorCount`, and computed `unitPrice` snapshots.
  - Existing IDs are canonical: `Purchase.supplier.id`, `Purchase.items[].productId` strings, and new `SaleOrder.customer.customerId` ObjectId ref; no parallel reference fields.
  - Backend resolves saved customers by submitted `customerId`, then exact phone/name; frontend autocomplete now submits the actual ID and profiles keep a legacy fallback.
  - Purchase create/save adds no stock; only Receive Goods adds cumulative stock.
  - Supplier Purchase History and Customer Orders tabs were enriched in place; no new tabs/collections.
- **Files modified:**
  - Backend:
    - `backend/src/models/Purchase.js` — indexed `supplier.id`/`items[].productId`, `productFlavors` map of `String[]`, added `basePrice`/`flavorCount`.
    - `backend/src/models/SaleOrder.js` — added indexed `customer.customerId` ref and item `basePrice`/`flavorCount`.
    - `backend/src/controllers/purchase.controller.js` — product lookup by actual ID/SKU, strict purchase-price validation, flavor count pricing, snapshot fields, ignored client unit-price overrides, removed create-time stock/movement generation.
    - `backend/src/controllers/sale-order.controller.js` — customer auto-resolution/`customerId`, snapshot fields, authoritative pricing from stored values on unchanged edits, and `?customerId=` filtering.
  - Frontend:
    - `frontend/features/purchases/types.ts`, `utils.ts`, `components/CreatePurchaseView.tsx`, `components/PurchaseItemsTable.tsx` — strict purchase price helpers, recalculation, formula display, validation, payload snapshots, receive-only copy.
    - `frontend/features/sales-orders/types.ts`, `utils.ts`, `services/sale-order.service.ts`, `components/OrderFormDialog.tsx`, `components/CustomerAutocomplete.tsx` — customer ID capture/filter, item snapshots, payload mapping.
    - `frontend/features/customers/hooks/useCustomerProfile.ts`, `utils.ts`, `components/CustomerOrdersLedger.tsx` — linked-order filtering with legacy fallback and detailed sold-product rows/CSV.
    - `frontend/features/suppliers/supplierDetailData.ts`, `supplierProfile.ts`, `components/SupplierPurchaseLedger.tsx` — detailed purchase line mapping and richer history table/CSV.
    - `PROJECT_MEMORY.md` — updated throughout.
- **No new dependencies, no auth changes, no duplicate collections/tabs.**
- **Verification:**
  - `node --check` on all four changed backend files ✅.
  - `npx tsc --noEmit` ✅.
  - `npm run lint` ✅ — 0 errors, 1 pre-existing layout font warning.
  - `npm run build` ✅ — all 16 app routes generated.
  - Live API smoke tests on `http://localhost:5000` with LAYS (`purchasePrice=50`, `wholesalePrice=70`, flavors `chese,salt,chili,neem`) ✅:
    - Purchase create with 2 flavors and submitted `unitPrice=999` stored `basePrice=50`, `flavorCount=2`, `unitPrice=100`, `receivedQuantity=0`; stock stayed 5.
    - Zero-flavor purchase rejected with `Select at least one flavor for LAYS`.
    - Partial receive 1/2 added exactly 1 stock (5→6); repeated same receive was idempotent (stock stayed 6).
    - Sale with customer ID stored `customerId`, `basePrice=70`, `flavorCount=2`, `unitPrice=140`; `?customerId=` returned only that customer's order.
    - All smoke records deleted; LAYS stock restored to 5.
- **Side effects/risks:** Existing purchase/sale records are not retroactively repriced; unchanged edits preserve stored snapshot prices rather than current catalog prices. Legacy purchase snapshots without `basePrice` fall back to stored `unitPrice` in profile tables.

### Previous task: Flavor-based pricing for sale orders (completed 2026-11-21)

- **User request:** In Sales & Orders, the product's stored price is the price of one flavor/chip. Selecting multiple flavors must multiply the item's unit price by the number of selected flavors, with subtotal/final total updating automatically. Quantity must remain a separate multiplier.
- **Clarified decisions:**
  - Per-flavor price for selling is `Product.wholesalePrice`; purchasing continues to use `Product.purchasePrice` and was not changed.
  - A product that has flavors requires at least one selected flavor; zero selected flavors is blocked.
  - On edit, saved/manual price is preserved if the flavor set is unchanged; it is recomputed from the database when flavors change or a new item is added.
  - `Unit Price = flavor count × per-flavor price`; `Line Total = Qty × Unit Price`.
- **Files modified:**
  - `frontend/features/sales-orders/components/OrderFormDialog.tsx`
    - Added `perFlavorPrice()` and `flavorAdjustedUnitPrice()` based on `wholesalePrice`.
    - `selectProduct()`, both flavor-selection handlers, and the create-mode quantity handler now recompute the unit price from the product's DB price and current flavor count.
    - `FlavorSelect` shows `Rs. X / flavor × N flavors = Rs. Y / unit` and is labelled required.
    - Validation adds “select at least one flavor” for flavored products with an empty selection.
    - Removed the obsolete `defaultProductPrice()`/`wholesaleProductPrice()` helpers.
  - `backend/src/controllers/sale-order.controller.js`
    - Added `perFlavorPrice()` and `sameFlavorSet()` helpers.
    - `buildOrderChanges()` now normalizes flavors first, rejects empty flavor selection for flavored products, and sets `effectiveUnitPrice` from DB price × normalized flavor count on create/new items/changed flavors; unchanged edits keep the submitted price.
    - Existing `lineTotal`, subtotal, discount, freight, and total logic consumes the adjusted price unchanged.
- **No DB schema/migration, no new dependencies, no purchase/API-route/auth changes.**
- **Verification:**
  - `node --check backend/src/controllers/sale-order.controller.js` ✅.
  - `npx tsc --noEmit` ✅.
  - `npm run lint` ✅ — 0 errors, 1 pre-existing layout font warning.
  - `npm run build` ✅ — all 16 app routes generated.
  - Live API smoke test on `http://localhost:5000` with LAYS (`wholesalePrice=70`, flavors `chese,salt,chili,neem`) ✅:
    - 1 flavor → `unitPrice=70`, line/subtotal/total `70`.
    - 2 flavors → `unitPrice=140`, line/subtotal/total `140`.
    - 3 flavors → `unitPrice=210`, line/subtotal/total `210`.
    - 0 flavors → rejected: `Select at least one flavor for LAYS`.
    - Edit unchanged with submitted `unitPrice=999` → preserved `999`.
    - Edit changed to 3 flavors with submitted `unitPrice=999` → recomputed `210`.
    - All 3 smoke orders deleted; stock returned to its pre-test value of `5` (a real order `SO-8827` for qty 45 had already reduced stock from 50 to 5).
- **Side effects/risks:** Existing orders are not retroactively repriced. A manual catalog-item price is overwritten only when its flavors change (approved). Products with `wholesalePrice=0` and flavors now block saving because the computed unit price is zero.

### Previous task: Sale order create button silently disabled (fixed 2026-11-21)

- **User report:** On `/sales-orders`, clicking `+ New Sale Order` opened the popup, but the user could not save; the `Create Sale Order` button was greyed out with no explanation.
- **Root cause:** `OrderFormDialog.tsx` computed a `canSubmit` boolean and disabled the submit button whenever customer, item, price, total, hub, payment, or stock checks failed. The silent `if (!canSubmit) return;` in `handleSubmit` meant no feedback was shown when the user clicked it.
- **Approved plan:** Make validation reasons explicit, keep the button clickable so every click gives feedback, auto-fill catalog price/SKU when a typed name matches a product, and reset the dialog state on each open for Next 16 `cacheComponents`/`<Activity>`.
- **Files modified:**
  - `frontend/features/sales-orders/components/OrderFormDialog.tsx`
    - Replaced the single `canSubmit`/`itemsValid` calculation with a `validationIssues: string[]` list covering customer, items, quantity, unit price, stock availability, hub, total, and partial-payment rules.
    - `canSubmit` is now `validationIssues.length === 0`; the issues are rendered in a `role="alert"` block above the footer buttons.
    - Submit button is disabled only while submitting. `handleSubmit` still blocks invalid payloads, but now shows the first issue via the existing error area.
    - Added `applyExactProductMatch()` and wired it as `onCommit` on the create-form product autocomplete: typing an exact catalog title or SKU and blurring fills SKU, unit label, and authoritative wholesale price through the existing `selectProduct()` path.
  - `frontend/features/sales-orders/components/ProductAutocomplete.tsx`
    - Added optional `onCommit?: (value: string) => void`; invoked on input blur before closing the dropdown. Existing behavior is unchanged when the prop is omitted (edit form still uses it without auto-fill).
  - `frontend/features/sales-orders/components/SalesOrdersView.tsx`
    - Added `newOrderDialogKey` state. Both the `+ New Sale Order` button and the `?new=1` dashboard link increment the key before opening, and `NewOrderDialog` receives `key={newOrderDialogKey}` so its state always starts fresh under `<Activity>`.
- **No backend/API/DB changes:** `POST /api/sale-orders` validation is already authoritative (customer/items/positive quantity/non-negative price/subtotal > 0/partial payment/stock). Backend still rejects malformed payloads and returns messages that the form displays.
- **Next.js docs consulted before coding (per `AGENTS.md`):** `node_modules/next/dist/docs/01-app/02-guides/forms.md`, `.../02-guides/preserving-ui-state.md`, and `.../03-api-reference/05-config/01-next-config-js/cacheComponents.md`.
- **Verification:**
  - `npx tsc --noEmit` ✅.
  - `npm run lint` ✅ — 0 errors, 1 pre-existing `app/layout.tsx` custom-font warning.
  - `npm run build` ✅ — all 16 app routes generated.
  - Live API smoke test on `http://localhost:5000` ✅ — created `SO-8825` with `flavor: ["chese","salt"]` and deleted it; stock restored.
- **Side effects/risks:** The submit button can now be clicked with an incomplete form, but `handleSubmit` still prevents the API call and shows the reason. Exact-name auto-fill overwrites manually typed unit price for catalog products on blur, which matches the backend's authoritative wholesale price on create. No dependencies added.

### Previous task: Multiple flavors per sale/purchase line and supplier default (completed 2026-11-20)

- **User request:** One product/item line should be able to carry multiple flavors in purchases and sales, and suppliers should be able to define multiple default flavors per supplied product.
- **Approved plan:** Change line-level `flavor` and supplier `productFlavors` values from a single string to arrays, keep flavor descriptive-only, normalize/canonicalize every value server-side, and replace single-value selects with a reusable multi-select.
- **Backend files modified:**
  - `backend/src/models/SaleOrder.js` — item `flavor` changed from `String` to `[String]` (legacy strings auto-cast by Mongoose).
  - `backend/src/models/Purchase.js` — item `flavor` changed from `String` to `[String]`.
  - `backend/src/models/Supplier.js` — `productFlavors` map values changed from `String` to `[String]`.
  - `backend/src/controllers/sale-order.controller.js` — replaced `normalizeOptionalLabel()` with `normalizeFlavorValues(value, allowedFlavors)`; splits comma/newline/array input, trims, de-duplicates case-insensitively, caps 24 values × 120 chars, canonicalizes to catalog spelling, and stores `flavor: flavors`.
  - `backend/src/controllers/purchase.controller.js` — same array normalization for line flavors (no catalog canonicalization; purchase lines may keep custom labels).
  - `backend/src/controllers/supplier.controller.js` — `normalizeSupplierProducts()` now accepts string or array defaults, splits comma/newline values, canonicalizes against the product's catalog flavors, de-duplicates, and stores only valid arrays.
- **Frontend files created:**
  - `frontend/app/lib/flavors.ts` — `toFlavorArray()` (tolerant of string/array/undefined) and `formatFlavors()` for display.
  - `frontend/app/components/FlavorMultiSelect.tsx` — reusable portal-based checkbox dropdown for options from the selected product's catalog flavors; supports compact table/inline use and closes on outside click.
- **Frontend files modified:**
  - `frontend/features/sales-orders/types.ts`, `utils.ts` — `flavor?: string[]`, array defaults and edit mapping.
  - `frontend/features/sales-orders/components/OrderFormDialog.tsx` — editable item flavors are arrays; `FlavorSelect` now wraps `FlavorMultiSelect`; product selection preserves previously chosen catalog flavors or auto-selects a sole flavor; submit sends arrays.
  - `frontend/features/purchases/types.ts`, `utils.ts` — item/snapshot `flavor?: string[]` and supplier snapshot `productFlavors?: Record<string, string[]>`; CSV/summary rendering joins arrays.
  - `frontend/features/purchases/components/CreatePurchaseView.tsx` — `createRow()` uses `[]`; `defaultFlavorsFor()` returns arrays; edit load, supplier change, and payload all use arrays.
  - `frontend/features/purchases/components/PurchaseItemsTable.tsx` — flavor cell uses `FlavorMultiSelect`.
  - `frontend/features/purchases/components/PurchasePreviewDialog.tsx`, `PurchaseDetailDialog.tsx`, `ReceivePurchaseDialog.tsx` — join flavor arrays for display (legacy strings still handled).
  - `frontend/features/suppliers/types.ts`, `services/supplier.service.ts` — supplier `productFlavors` is `Record<string, string[]>`; DTO mapping normalizes legacy string values.
  - `frontend/features/suppliers/components/ProductMultiSelect.tsx`, `AddSupplierForm.tsx`, `EditSupplierDialog.tsx` — per-product flavor chips are now `FlavorMultiSelect`; handlers accept arrays and prune empty entries.
  - `frontend/features/customers/components/CustomerOrdersLedger.tsx`, `CustomerInvoices.tsx` — sale order summaries display joined flavor arrays.
- **Verification:**
  - `node --check` on all changed backend files ✅.
  - `npx tsc --noEmit` ✅.
  - `npm run lint` ✅ — 0 errors, 1 pre-existing layout font warning.
  - `npm run build` ✅ — all 16 app routes generated.
  - Live API smoke test on `http://localhost:5000` ✅ — sale order with `["chese","SALT","mystery"]` stored as `["chese","salt","mystery"]`; supplier defaults stored as `["chese","salt"]` with the non-catalog value dropped; purchase line stored as `["chese","salt"]`. All smoke records were deleted and LAYS stock restored to 50.
- **Side effects/risks:** existing sale/purchase/supplier records with string flavors remain readable (frontend `toFlavorArray()` and Mongoose array casting handle them); new writes always use arrays. Non-catalog flavors are intentionally kept on sale/purchase lines but ignored for supplier defaults because defaults must be valid catalog values.
- **Dependencies added:** none.

### Previous task: Comma-typed flavors on Add/Edit Product (completed 2026-11-20)

- **User request:** On `/products/add`, users should be able to type `chese, chili, salt` and have every value saved as a flavor without needing to press Enter. Enter and the "Add flavor" button remain available as optional conveniences.
- **Root cause:** `FlavorInput.tsx` kept typed text in a local `draft` that was not part of the form. Only Enter, comma keydown, or the button moved it into `form.flavors`, so a final value without a trailing comma was lost on Save.
- **File modified:** `frontend/app/products/components/FlavorInput.tsx`
  - Added `normalizeFlavor()` (trim, collapse whitespace, max 80 chars) and `appendFlavors()` (case-insensitive de-duplication).
  - `onChange` now splits on commas, commits each completed part immediately as a chip, and keeps only the trailing part in the input.
  - Added `onBlur={commitAll}` so the final typed value is committed when the user clicks Save or elsewhere.
  - Enter still commits (and prevents form submit) and the "Add flavor" button still commits; both now use `commitAll()`, so a pasted `chese, chili, salt` is split correctly rather than saved as one value.
  - Placeholder changed to `e.g. chese, chili, salt`; helper text now says flavors are added automatically by typing commas.
  - Edit Product uses the same component, so it gets identical behavior.
- **No backend/API changes:** the submitted `form.flavors` array shape and server normalization are unchanged.
- **Verification:** `npx tsc --noEmit` ✅; `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning); `npm run build` ✅ (all 16 routes generated).
- **Dependencies added:** none.

### Previous task: Supplier/buyer names in Live Stock Movements Ledger (completed 2026-11-20)

- **User request:** Show the supplier on purchase movements and the buyer/customer on sale movements as a row in the Inventory page's "Live Stock Movements Ledger", without a page refresh.
- **Approach:** Capture the counterparty as a denormalized `partyName` snapshot on the `StockMovement` at creation time. The ledger is immutable, so no joins or extra list queries are needed. Historical movements are not backfilled (they only carry PO/SO references, no party name).
- **Backend files modified:**
  - `backend/src/models/StockMovement.js` — added `partyName: { type: String, default: "" }`.
  - `backend/src/controllers/purchase.controller.js` — set `partyName` from `created.supplier.name` on AUTO-STOCK create movements and `purchase.supplier.name` on GRN receipt movements.
  - `backend/src/controllers/sale-order.controller.js` — added `partyName` to `applyStockAdjustments()` and passed the order customer name at create (`created.customer.name`), update (`changes.customer.name || order.customer.name`), and delete (`order.customer.name`) call sites.
- **Frontend files modified:**
  - `frontend/app/inventory/data.ts` — `partyName?` on `StockMovementDto`; `partyLabel?`/`partyName?` on `MovementEntry`.
  - `frontend/app/inventory/utils.ts` — `movementToEntry()` copies `partyName` and sets `partyLabel` from type (`purchase → "Supplier"`, `sale → "Buyer"`).
  - `frontend/app/inventory/components/MovementsLedger.tsx` — renders a `Supplier:` / `Buyer:` line in each row when present (with `local_shipping` / `person` icon) and a matching "Party" row in the delete-confirmation grid.
- **Docs modified:** `backend/docs/inventory-api.md` — documented `partyName` in the movements response.
- **UI behavior:** Each new purchase row shows "Supplier: <name>" and each new sale row shows "Buyer: <name>". Adjustment/return/write-off rows and older movements show no party line. Buyer name is the customer name saved on the sale order (typically the business name; orders have no `customerId`).
- **Verification:**
  - `node --check` on the 3 changed backend files ✅
  - `npx tsc --noEmit` ✅
  - `npm run lint` ✅ (0 errors, 1 pre-existing layout font warning)
  - `npm run build` ✅ (all 16 routes generated)
  - Live API smoke test ✅: created a purchase and sale against the running backend; `GET /api/inventory/movements` returned `partyName: "YasirWholsaler"` for the purchase and `"SMOKE Buyer"` for the sale; both test records deleted in `finally` (counts and product stock restored).
- **Dependencies added:** none.

### Previous task: Reset Add Supplier/Add Customer forms after successful save (completed 2026-11-20)

- **User request:** After clicking Save on `/suppliers/add` or `/customers/add`, returning to the Add page via the list's Add button (or browser Back) must show an empty form without a browser refresh.
- **Root cause:** `cacheComponents: true` in `frontend/next.config.ts` makes the App Router keep routes mounted with React `<Activity>`, preserving client state and DOM input values across navigation. Both Add forms only initialized from `EMPTY_FORM` on mount and never reset after a successful save (`AddSupplierForm` reset only for "Save & Add Another"; `AddCustomerForm` had no reset).
- **Approach used:** Followed the bundled Next.js guide `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md` ("Resetting form state on submit", "Resetting stale status messages"). No full reload, no `bfcacheId`, no new dependencies.
- **Frontend files modified:**
  - `frontend/features/suppliers/components/AddSupplierForm.tsx` — added `resetForm()` (fresh `form` with new `productIds: []` / `productFlavors: {}`, clears `error`/`success`); called after successful `createSupplier` in both "Save & Add Another" and normal Save branches (normal branch resets before `router.push("/suppliers")`); added `shouldReset` ref + `useLayoutEffect` cleanup to clear stale messages when Activity hides the page; added `autoComplete="off"` to the form.
  - `frontend/features/customers/components/AddCustomerForm.tsx` — added matching `resetForm()`; called after successful `createCustomer` before `router.push("/customers")`; same `shouldReset`/`useLayoutEffect` cleanup; `autoComplete="off"`.
- **UI behavior:** Save → redirect to list → click Add again (no refresh) now renders empty fields and no stale status message. Unsaved drafts are still preserved if the user leaves without submitting (matches Next.js guidance).
- **Verification:**
  - `npx tsc --noEmit` ✅
  - `npm run lint` ✅ (0 errors, 1 pre-existing `app/layout.tsx` custom-font warning)
  - `npm run build` ✅ (Next.js 16.4.6, all 16 routes generated)
- **Dependencies added:** none.

### Previous task: Git repository initialization and push (completed 2026-11-20)

- **User request:** Create/use the GitHub repository `https://github.com/yasiralatif123-spec/Ai-inven-system.git`, push `backend/`, `frontend/`, and `PROJECT_MEMORY.md`, and do not push `stich ui/`.
- **Files created:**
  - `.gitignore` at the workspace root, ignoring `/stich ui/`, `Thumbs.db`, `desktop.ini`, and `.DS_Store`.
- **Repository setup:**
  - `git init -b main`
  - Remote added as `origin` → `https://github.com/yasiralatif123-spec/Ai-inven-system.git`
  - Local commit identity set to `yasiralatif123-spec` / `yasiralatif123-spec@users.noreply.github.com` (local repo config only).
  - Initial commit: `2f57071 Initial StockFlow backend and frontend import`
  - 196 files committed and pushed to `origin/main`.
- **Excluded from the push:**
  - `stich ui/` via root `.gitignore`.
  - `backend/.env` via existing `backend/.gitignore`.
  - `frontend/node_modules`, `frontend/.next`, `frontend/.env*`, `*.tsbuildinfo`, and `next-env.d.ts` via existing `frontend/.gitignore`.
  - `backend/node_modules` via existing `backend/.gitignore`.
- **Verification:**
  - `git status` clean after commit/push before this memory update.
  - Staged file audit found no `stich ui/` or `.env` files.
  - `git check-ignore -v backend/.env` confirmed the backend secrets file is ignored.
  - `git push -u origin main` succeeded; branch tracks `origin/main`.
- **Dependencies added:** none.

### Previous task: optional product flavors (completed 2026-11-20)

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

1. Purchase `Quantity (Target)` starts at `0`; stock is added only by Receive Goods; `availableStock` is a snapshot.
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
