# Purchases API

Base path: `/api/purchases`

All endpoints are currently public. The server recomputes item taxes and the purchase total from submitted quantities, prices, discounts, and freight; client-supplied totals are ignored.

## GET `/api/purchases/next-code`

Returns the next available purchase number.

```json
{
  "code": "PO-2042"
}
```

The sequence starts at `PO-2042` and continues from the highest stored `PO-####` number.

## GET `/api/purchases`

Returns saved purchases, newest first. Pass `?supplierId=<supplier _id>` to return
only purchases linked to that supplier. The supplier profile page uses this to
display one supplier's complete purchase history. An invalid `supplierId` returns
`400`.

```json
{
  "purchases": [
    {
      "_id": "665f1d2f8c9a4400f8123456",
      "purchaseNumber": "PO-2042",
      "supplier": {
        "id": "665f1c...",
        "code": "S-208",
        "name": "Karachi Beverage Distributors",
        "contact": "Ahmed Khan",
        "phone": "+923001234567",
        "hub": "Karachi",
        "address": "SITE Industrial Area, Karachi",
        "ntn": "1234567",
        "paymentTerms": "net-15",
        "productIds": ["665f1a...", "665f1b..."]
      },
      "purchaseDate": "2026-11-16T00:00:00.000Z",
      "expectedDelivery": "2026-11-19T00:00:00.000Z",
      "invoiceNumber": "INV-KBD-904",
      "items": [
        {
          "productId": "665f1a...",
          "name": "Coca-Cola 500ml",
          "sku": "SKU-BEV-001",
          "quantity": 100,
          "receivedQuantity": 40,
          "receipts": [
            {
              "quantity": 40,
              "receivedQuantity": 40,
              "reference": "GRN",
              "receivedAt": "2026-11-18T00:00:00.000Z",
              "performedBy": "Tariq M. (Owner)"
            }
          ],
          "unit": "Carton",
          "unitPrice": 1450,
          "discount": 0,
          "taxRate": 18,
          "taxAmount": 26100,
          "lineTotal": 171100
        }
      ],
      "financials": {
        "subtotal": 302000,
        "discount": 2000,
        "tax": 50580,
        "freight": 3500,
        "total": 354080
      },
      "paidAmount": 100000,
      "payments": [
        {
          "amount": 100000,
          "method": "Bank Transfer",
          "reference": "TRF-12345",
          "paidAt": "2026-11-17T00:00:00.000Z"
        }
      ],
      "status": "Ordered",
      "notes": "Deliver to Karachi Central Warehouse.",
      "createdBy": "Tariq M. (Owner)",
      "createdAt": "2026-11-16T10:00:00.000Z",
      "updatedAt": "2026-11-16T10:00:00.000Z"
    }
  ]
}
```

## POST `/api/purchases`

Creates a purchase. `supplierId` must reference an existing supplier. Each item requires `name`, a positive integer `quantity`, and a non-negative `unitPrice`. An optional `paymentAmount` (0 to the computed grand total) records an initial payment atomically: the response returns `paidAmount` set to that value and, when positive, one entry in `payments` with `method` (default `Cash`) and `reference` (falls back to `invoiceNumber`).

When a linked catalog product is selected in the UI, `quantity` starts at `0`; it is the number of units to add. `availableStock` is stored only as a read-only snapshot of the product's current stock. Stock is added only when the purchase is saved with `status: "Received"`: each linked item's full `quantity` is recorded as `receivedQuantity`, added to the product's `openingStock`, and written as a `purchase` stock movement. Saving with `Draft` or `Ordered` does not change stock.

For a flavored product, the full received quantity applies to **each selected flavor**. Three flavors at `quantity: 10` add 10 units to each flavor row and 30 to the product's `openingStock`, matching the `basePrice × flavorCount × quantity` pricing rule. Only flavors that have been received get a `Product.flavorStocks` entry, which is what the inventory page renders as separate rows.

### Request body

```json
{
  "supplierId": "665f1c2f8c9a4400f8123455",
  "purchaseDate": "2026-11-16",
  "expectedDelivery": "2026-11-19",
  "invoiceNumber": "INV-KBD-904",
  "status": "Ordered",
  "freight": 3500,
  "notes": "Deliver to Karachi Central Warehouse.",
  "paymentAmount": 100000,
  "paymentMethod": "Bank Transfer",
  "paymentReference": "TRF-12345",
  "items": [
    {
      "productId": "665f1a...",
      "name": "Coca-Cola 500ml",
      "sku": "SKU-BEV-001",
      "quantity": 100,
      "availableStock": 60,
      "unit": "Carton",
      "unitPrice": 1450,
      "discount": 0,
      "taxRate": 18
    }
  ]
}
```

Accepted `status` values: `Draft`, `Ordered`, `Partially Received`, `Received`, `Cancelled`. The create/edit form exposes `Draft`, `Ordered`, and `Received`; submitting `Received` is a full goods receipt. `Partially Received` is derived by the Receive Goods endpoint, and `Cancelled` is set through the status endpoint.

### Response

```json
{
  "message": "Purchase created",
  "purchase": {
    "_id": "665f1d2f8c9a4400f8123456",
    "purchaseNumber": "PO-2042",
    "financials": {
      "subtotal": 145000,
      "discount": 0,
      "tax": 26100,
      "freight": 3500,
      "total": 174600
    },
    "status": "Ordered"
  }
}
```

### Validation errors

The endpoint returns `400` with a `message` when:

- the supplier id is missing or does not exist;
- no valid line items are supplied;
- an item is missing a name, has zero/negative quantity, or has a negative price;
- expected delivery is before the purchase date;
- the status is not one of the accepted values;
- `paymentAmount` exceeds the computed purchase total.

## GET `/api/purchases/:id`

Returns one purchase. The `:id` segment accepts either the Mongo `_id` or the `purchaseNumber`.

## PUT `/api/purchases/:id`

Updates an existing purchase. The request body is the same as `POST /api/purchases`, except `paymentAmount`, `paymentMethod`, and `paymentReference` are ignored on update — existing `paidAmount` and `payments` are preserved. Record additional payments through `POST /api/purchases/:id/payment`. Supplier details, items, and financials are recomputed. If the submitted status is `Received`, the server records a receipt only for the positive difference between each item's ordered quantity and its previously received quantity, so repeated saves never add stock twice.

## PATCH `/api/purchases/:id/status`

Updates the non-receiving status. Use `POST /api/purchases/:id/receive` for partial receipts, or save the purchase with `status: "Received"` through `POST`/`PUT` for a full receipt.

```json
{
  "status": "Cancelled"
}
```

## POST `/api/purchases/:id/receive`

Records a goods receipt. Each item's `receivedQuantity` is the **cumulative total received so far** for that product, not the quantity in this delivery. The server only adds the difference between the submitted total and the previously received total to the product's `openingStock`.

```json
{
  "reference": "GRN-2042-01",
  "notes": "Short delivery; balance expected Friday.",
  "performedBy": "Tariq M. (Owner)",
  "items": [
    {
      "itemId": "665f1a...item...",
      "receivedQuantity": 40
    },
    {
      "itemIndex": 1,
      "receivedQuantity": 0
    }
  ]
}
```

- `itemId` is the purchase item's Mongo `_id`. Legacy purchases without item ids can be received using `itemIndex`.
- `receivedQuantity` must be a whole number between the previously received quantity and the ordered quantity.
- Re-submitting the same cumulative quantity is idempotent: no additional stock is added and no duplicate receipt ledger entry is created.
- Concurrent requests are protected with a compare-and-swap update. A losing request receives `409`.
- MongoDB transactions are used when the server is a replica set or sharded cluster. On standalone MongoDB, the server applies the same updates with compensating rollbacks.
- The response returns the updated purchase with `items[].receivedQuantity`, `items[].receipts`, and the derived `Partially Received` or `Received` status.
- Only linked catalog products update stock. Manual items without a valid `productId` are tracked in the receipt ledger but do not change stock.

## POST `/api/purchases/:id/payment`

Records a payment against the purchase.

```json
{
  "amount": 50000,
  "method": "Bank Transfer",
  "reference": "TRF-12345"
}
```

The amount must be greater than zero and cannot exceed `financials.total - paidAmount`. The response returns the updated purchase with a new entry in `payments` and an updated `paidAmount`.

## DELETE `/api/purchases/:id`

Deletes a purchase by Mongo `_id` or `purchaseNumber`.

## Notes

- `paidAmount` and `payments` are returned on every purchase. The frontend derives `remaining` as `financials.total - paidAmount`.
- Saving with `status: "Received"` fully receives the purchase: linked products get their full ordered quantity added to `openingStock` (`quantity × selected flavor count`), with a `STATUS-RECEIVED` receipt and a `purchase` stock movement. Each selected flavor also gets its own `Product.flavorStocks` balance.
- Saving with `Draft` or `Ordered` adds no stock and leaves `receivedQuantity` at `0` for new purchases.
- `/api/purchases/:id/receive` remains available for partial goods receipts and only adds quantities beyond the already recorded `receivedQuantity`; both paths add only the positive delta and are idempotent on repeated submissions.
- Each item stores `availableStock` (read-only stock snapshot at selection), `quantity` (units to add, starting at `0` in the form), `receivedQuantity` (cumulative received), and `remaining = quantity - receivedQuantity` is derived by the frontend.
- Receipts create `StockMovement` entries with `type: "purchase"`, `direction: "in"`, and a reference containing the purchase number. Multi-flavor lines store `flavorBreakdown: [{ flavor, quantity }]`; single-flavor lines also set `flavor`.
- Editing a received purchase cannot reduce `receivedQuantity` below the already received amount or change its linked product.
- Deleting a purchase reverses its received stock and removes the linked `purchase` stock movements in the same transaction.
- Saving a purchase does not currently mutate the supplier's `totalPurchases` or `outstanding` fields.
