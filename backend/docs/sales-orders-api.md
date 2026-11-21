# Sales orders API contract

Base path: `/api/sale-orders`

The service follows the existing backend convention: JSON bodies and a stable
`{ "message": string }` error shape.

## Stock behavior

Creating a sale order saves the order in MongoDB and immediately adjusts stock
for every item whose SKU matches a catalog product:

- Product `openingStock` is reduced by `quantity × selected flavor count`.
- For flavored products, each selected flavor's `Product.flavorStocks` row is
  reduced by the full ordered quantity. A flavor with insufficient stock blocks
  the sale with `400`.
- An immutable `StockMovement` record is written with `type: "sale"`,
  `direction: "out"`, `reference: "<orderNumber> · SALE"`, the before/after
  product stock values, and `flavorBreakdown` for flavored lines.
- Duplicate SKUs in the same order are combined before stock is validated, so
  two rows for the same product cannot oversell it.
- If stock is insufficient, the request fails with `400` and no order or stock
  movement is saved.
- Items without a SKU that matches a catalog product are still saved on the
  order, but they do not change stock.

Updating an order only applies the **difference** between the saved and new
quantities/flavors. Reducing a quantity restores stock and writes an `in`
movement; increasing it deducts the extra units and writes an `out` movement.
Changing flavors rebalances the affected flavor rows even when the product total
is unchanged. Deleting an order restores the full deducted quantity and writes
an `in` movement. Status and payment updates never change stock.

Orders created before this behavior was introduced are not stock-tracked. When
such an order is edited, its catalog items are treated as newly deducted at
that point; its historical quantity is not deducted again.

## Pricing behavior

For a newly created order, an item whose `sku` (or `productId`) matches a catalog
product is priced from that product's existing `wholesalePrice` field in
MongoDB. The client-supplied `unitPrice` is ignored for those items, so prices
are never hardcoded in the request. The server saves that price on the order
item and computes:

```text
lineTotal = quantity × wholesalePrice
subtotal  = sum(lineTotal)
total     = subtotal - discount + freight
```

Items without a matching catalog product keep the client-supplied `unitPrice`.
Updating an existing order preserves the price already saved on that order, so
legacy orders and manual price adjustments are not silently rewritten.

## Credit fields

`creditAccountName`, `ntn`, `creditLimit`, `currentDues`, `dueDays`, and credit
override fields are no longer accepted from the sales order form. New orders do
not create a credit warning. Unpaid orders use `dueDate: "Due on receipt"` and
`paymentLabel: "Unpaid (Due on receipt)"`. Legacy documents keep their stored
credit fields for historical reference, but they are not shown in the UI.

## Endpoints

### `POST /api/sale-orders`

Creates the order and applies stock adjustments in one transaction when the
MongoDB deployment supports transactions.

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

Updates the order and applies only the stock delta.

### `GET /api/sale-orders`

Returns saved orders, newest first.

### `PATCH /api/sale-orders/:id/status`

Updates fulfillment status only. Stock was already deducted at creation.

### `POST /api/sale-orders/:id/payment`

Records a payment against the saved order. Stock is unchanged.

### `DELETE /api/sale-orders/:id`

Deletes the order and restores stock for items previously deducted.
