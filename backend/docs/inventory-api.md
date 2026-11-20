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

### `POST /api/products/:id/adjust-stock`

Applies a stock adjustment and creates an immutable `StockMovement` ledger entry.
The product route is used because the adjustment targets a product resource.

Request body: `{ direction: "add" | "deduct", quantity: number, reason?, reference?, notes?, performedBy? }`.

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
