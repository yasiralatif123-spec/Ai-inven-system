# Inventory API contract

Base path: `/api/inventory`

The service follows the existing backend convention: JSON bodies and a stable
`{ "message": string }` error shape.

## Endpoints

### `GET /api/inventory/movements`

Returns all stock movements, newest first.

**200 response**

```json
{ "movements": [] }
```

Each returned movement is a `StockMovement` document. In addition to the stock
fields, it includes `partyName`: the counterparty captured when the movement was
written — the supplier name for `type: "purchase"` (both AUTO-STOCK and GRN
receipts) and the customer/buyer name for `type: "sale"` (create, edit, and
delete). It defaults to `""` for adjustments, returns, write-offs, and older
records created before this field existed. It is a denormalized snapshot because
the ledger is immutable.

Movements for flavored products also include `flavor` (single flavor) and/or
`flavorBreakdown: [{ flavor, quantity }]` (multi-flavor purchases and sales).
`quantity` is the product-level total (`per-flavor quantity × selected flavor
count`). The inventory page groups products into one row per received flavor
using `Product.flavorStocks`; each row's Min. Safety bar is derived from that
flavor's own balance and the product's `reorderThreshold`.

### `POST /api/products/:id/adjust-stock`

Applies a stock adjustment and creates an immutable `StockMovement` ledger entry.
The product route is used because the adjustment targets a product resource.

Request body: `{ direction: "add" | "deduct", quantity: number, flavor?, reason?, reference?, notes? }`. A submitted `performedBy` is ignored; the server records the authenticated user's name from the `User` collection (`System` when unauthenticated).

`flavor` is required when the product already has flavor-stock rows; the adjustment then updates both that flavor's `Product.flavorStocks` balance and the product's `openingStock`. It is optional for flavorless products. The created movement records the same `flavor` and a one-entry `flavorBreakdown`, so deleting the adjustment reverses both balances.

### `DELETE /api/inventory/movements/:id`

Deletes a stock adjustment from MongoDB and reverses its effect on the linked
product's `openingStock`. Only records with `type: "adjustment"` can be deleted;
purchase, sale, return, and write-off records remain immutable audit entries.

**200 response**

```json
{
  "message": "Stock adjustment deleted",
  "product": { "...": "updated Product" },
  "movement": { "...": "deleted StockMovement" }
}
```

**Error responses**

```json
{ "message": "Stock movement not found" }
```

```json
{ "message": "Only stock adjustment entries can be deleted" }
```

```json
{ "message": "Cannot reverse this adjustment because only 4 units remain in stock" }
```

Deleting an addition deducts the quantity again and is rejected when current
stock is insufficient. Deleting a deduction adds the quantity back. The product
balance is restored if the ledger delete fails.
