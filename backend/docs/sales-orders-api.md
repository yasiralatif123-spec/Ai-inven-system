# Sales orders API contract

Base path: `/api/sale-orders`

The service follows the existing backend convention: JSON bodies and a stable
`{ "message": string }` error shape. When `AUTH_ENFORCEMENT` /
`TENANT_ENFORCEMENT` are enabled, requests are authenticated and scoped to the
caller's business; see `docs/auth-api.md` and `docs/tenancy.md`.

## Stock behavior

Stock is tracked in **base pieces**. `Product.openingStock` is the authoritative
product total, and every sale item stores the original `quantity`, `unitLabel`,
and converted `baseQuantity`:

- Supported units are `Piece` (1), `Box` (12), and `Carton` (24). Conversion is
  centralized in `src/utils/units.js`; the backend is the source of truth.
- Creating an order reduces `openingStock` by each catalog item's `baseQuantity`
  and writes an immutable `StockMovement` with `type: "sale"`,
  `direction: "out"`, `reference: "<orderNumber> - SALE"`, and the original
  quantity/unit plus base-piece quantity.
- Items whose `sku`/`productId` does not match a catalog product are saved but do
  not change stock. Duplicate catalog SKUs in one order are aggregated before
  validation so two rows cannot oversell the same product.
- Insufficient stock returns `400` and saves neither the order nor a movement.
- Updating an order applies only the difference between saved and new
  `baseQuantity` values: a reduction restores stock (`in` movement), an increase
  deducts it (`out` movement). Status and payment updates never change stock.
- Deleting an order restores the still-deducted base quantity. Legacy orders
  without `stockDeducted` items do not change stock.

## Cancellation behavior

`Cancelled` is a terminal fulfillment status. It is assigned **only** through
`PATCH /api/sale-orders/:id/status`; `POST` and `PUT` reject
`status: "Cancelled"` with `400 Use the Cancel action to cancel a sale order`.

When a non-delivered order is cancelled, the backend:

1. Restores the full base-piece quantity for every item with
   `stockDeducted: true`, writing one `sale` / `in` `StockMovement` per product.
2. Marks all items `stockDeducted: false`, so a later delete or repeated cancel
   never restores stock twice.
3. Sets `status: "Cancelled"` in the same session/transaction where supported,
   with compensating reversals on standalone MongoDB.

Additional restrictions:

- **Delivered** orders are not restocked, because the goods have already reached
  the customer. Their items are still marked `stockDeducted: false`.
- A cancelled order cannot be reactivated or edited (`400`). Deleting it is
  still allowed, but performs no second restock.
- Payments cannot be recorded against a cancelled order (`400`). Already
  recorded payments are **not** automatically refunded; refunds are handled
  separately outside this API.

## Pricing behavior

For a newly created order, an item whose `sku` (or `productId`) matches a catalog
product is priced from that product's `wholesalePrice`; the submitted `unitPrice`
is ignored. Manual items keep the client-supplied price. Updating an existing
order preserves the price already saved on that order.

```text
lineTotal = quantity × unitPrice
subtotal  = sum(lineTotal)
total     = subtotal - discount + freight
```

`financials.tax` is stored as an embedded 18% amount but is not included in
`total`. Unpaid orders use `dueDate: "Due on receipt"` and
`paymentLabel: "Unpaid (Due on receipt)"`.

## Endpoints

### `POST /api/sale-orders`

Creates the order and applies stock adjustments in one transaction when the
MongoDB deployment supports transactions. `status: "Cancelled"` is rejected.

**201 response**

```json
{
  "message": "Sale order created",
  "order": { "...": "saved SaleOrder with productId and stockDeducted on each item" }
}
```

**400 response**

```json
{ "message": "Insufficient stock for Coca-Cola. Available: 4, requested: 10" }
```

### `PUT /api/sale-orders/:id`

Updates the order and applies only the stock delta. Cancelled orders cannot be
edited, and `status: "Cancelled"` is rejected here.

### `GET /api/sale-orders`

Returns saved orders, newest first. Optional `?customerId=<ObjectId>` filters by
linked customer.

### `PATCH /api/sale-orders/:id/status`

Updates fulfillment status. Assigning `Cancelled` runs the cancellation flow
above instead of a plain status save. Any other status change on an already
cancelled order returns `400`.

Response for a newly cancelled order:

```json
{ "message": "Sale order cancelled", "order": { "...": "updated SaleOrder" } }
```

### `POST /api/sale-orders/:id/payment`

Records a payment against the saved order. Stock is unchanged. Cancelled orders
return `400`.

### `DELETE /api/sale-orders/:id`

Deletes the order and restores stock only for items still marked
`stockDeducted`. Cancelled orders therefore produce no second restock.
