# Suppliers API contract

Base path: `/api/suppliers`

The service follows the existing backend convention: JSON bodies and a stable
`{ "message": string }` error shape. Validation failures return `400`, and a
successful create returns `201`.

## Endpoints

### `GET /api/suppliers/next-code`

Returns the next auto-allocated supplier code. Callers should display this value
in the registration form before the supplier is saved.

**200 response**

```json
{ "code": "S-208" }
```

### `GET /api/suppliers`

Returns all supplier records, newest first.

**200 response**

```json
{
  "suppliers": [
    {
      "_id": "650...",
      "supplierCode": "S-208",
      "name": "Dalda Foods Agency",
      "contactPerson": "Mirza Naveed Baig",
      "phone": "+92 42 37661204",
      "email": "naveed.dalda@lhr-distributors.pk",
      "hub": "Lahore (Shah Alam / Badami Bagh)",
      "region": "Lahore",
      "taxStatus": "standard",
      "address": "Plot #24-B, Badami Bagh Industrial Area, Lahore",
      "ntn": "2489102-7",
      "paymentTerms": "net-15",
      "openingBalance": 165000,
      "graceDays": 5,
      "notes": "Bi-weekly delivery via bilty.",
      "productIds": ["650...", "651..."],
      "status": "Active",
      "totalPurchases": 0,
      "outstanding": 165000,
      "payableNote": "Opening Payable",
      "payableTone": "danger",
      "lastPurchaseAt": null,
      "createdBy": "Owner Name",
      "createdAt": "2026-11-17T15:00:00.000Z",
      "updatedAt": "2026-11-17T15:00:00.000Z"
    }
  ]
}
```

### `GET /api/suppliers/:id`

Returns one supplier by Mongo `_id`. This is used by the supplier profile route so
`/suppliers/<id>` always renders the clicked supplier's saved details.

**200 response**

```json
{
  "supplier": { "...": "SupplierDto" }
}
```

**404 response**

```json
{ "message": "Supplier not found" }
```

### `POST /api/suppliers`

Creates a supplier and initializes its payable sub-ledger values.

**201 response**

```json
{
  "message": "Supplier created",
  "supplier": { "...": "SupplierDto" }
}
```

### `PUT /api/suppliers/:id`

Updates the editable supplier profile. The server preserves `supplierCode`,
`status`, `openingBalance`, `totalPurchases`, `outstanding`, `payableNote`,
`payableTone`, `lastPurchaseAt`, and `createdBy`. Changing the distribution hub
recomputes the derived `region`.

**200 response**

```json
{
  "message": "Supplier updated",
  "supplier": { "...": "SupplierDto" }
}
```

**404 response**

```json
{ "message": "Supplier not found" }
```

The request accepts the same `name`, `contactPerson`, `phone`, `email`, `hub`,
`taxStatus`, `address`, `ntn`, `paymentTerms`, `graceDays`, `notes`, and
`productIds` rules as create. Omitted fields keep their stored values.

Product IDs already stored on the supplier are pruned automatically if their
product was later deleted from the catalog. This allows unrelated supplier
details or remaining product links to be edited without an error. New product
IDs submitted in the request must still exist in the catalog.

### `DELETE /api/suppliers/:id`

Deletes a supplier by Mongo `_id`. A supplier linked to any purchase order —
including a cancelled order — cannot be deleted, so its purchase and embedded
payment history stays intact. Suppliers without purchase history can still be
deleted.

**200 response**

```json
{ "message": "Supplier deleted" }
```

**404 response**

```json
{ "message": "Supplier not found" }
```

**409 response**

```json
{ "message": "Supplier has purchase/payment history and cannot be deleted" }
```

## Create request

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | Non-empty string |
| `contactPerson` | Yes | Non-empty string |
| `phone` | Yes | At least 10 digits; normalized to `+92 ...` |
| `address` | Yes | Non-empty string |
| `paymentTerms` | Yes | `net-15`, `net-30`, `net-7`, `cod`, `advance` |
| `email` | No | Valid email when provided |
| `hub` | No | `karachi`, `lahore`, `faisalabad`, `multan`, `rawalpindi` |
| `taxStatus` | No | `standard`, `exempt`, `non-filer`; defaults to `standard` |
| `ntn` | No | String |
| `openingBalance` | No | Number >= 0; defaults to `0` |
| `graceDays` | No | One of `0`, `5`, `10`, `15`; defaults to `5` |
| `notes` | No | Max 500 characters |
| `productIds` | No | Array of Mongo product IDs from the `products` collection; each must exist in the catalog |
| `createdBy` | No | Ignored; server sets the authenticated user's name from the `User` collection (`System` when unauthenticated) |

`supplierCode`, `region`, `status`, `totalPurchases`, `outstanding`,
`payableNote`, and `payableTone` are server-derived and ignore client input.

## Error examples

```json
{ "message": "Supplier name is required" }
```

```json
{ "message": "Payment terms is required" }
```

```json
{ "message": "Opening balance cannot be negative" }
```
