# Customers API contract

Base path: `/api/customers`

This API follows the existing backend convention: JSON bodies, public routes,
and a stable `{ "message": string }` error shape. Validation failures return
`400`, successful creates return `201`.

## Endpoints

### `GET /api/customers/next-code`

Returns the next auto-allocated ledger code. Callers should display this value
while a new customer form is open.

**200 response**

```json
{ "code": "C-410" }
```

### `GET /api/customers`

Returns all customer records, newest first.

**200 response**

```json
{
  "customers": [
    {
      "_id": "650...",
      "ledgerCode": "C-410",
      "name": "Muhammad Zubair",
      "businessName": "Zubair Enterprises",
      "phone": "+92 300 1234567",
      "altPhone": "+92 321 9876543",
      "email": "accounts@business.pk",
      "city": "Lahore",
      "cityLabel": "Lahore (Central Punjab Hub)",
      "address": "Shop #14, Brandreth Road, Lahore",
      "customerType": "Wholesale",
      "status": "Active",
      "route": "lahore-central",
      "routeLabel": "Lahore Central · Shah Alam & Brandreth Route",
      "ntn": "7349182-3",
      "creditLimit": 100000,
      "paymentTerms": "15days",
      "openingBalance": 25000,
      "openingBalancePaid": 5000,
      "remainingOpeningBalance": 20000,
      "openingBalancePayments": [
        {
          "_id": "650...",
          "amount": 5000,
          "method": "Bank Transfer",
          "reference": "OB-101",
          "paidAt": "2026-11-20T10:00:00.000Z",
          "createdBy": "Owner Name",
          "idempotencyKey": "cust-ob-101",
          "kind": "payment",
          "reversesPaymentId": ""
        }
      ],
      "gracePeriod": "3days",
      "notes": "Blank security cheque on file.",
      "orders": 0,
      "totalPurchases": 0,
      "outstanding": 20000,
      "hasLimit": true,
      "availableCredit": 80000,
      "creditExposurePercent": 20,
      "creditStatus": "within",
      "nearCreditLimit": false,
      "creditLimitExceeded": false,
      "createdBy": "Owner Name",
      "createdAt": "2026-11-17T15:00:00.000Z",
      "updatedAt": "2026-11-17T15:00:00.000Z"
    }
  ]
}
```

### `POST /api/customers`

Creates a customer and opens its accounts-receivable ledger.

**201 response**

```json
{
  "message": "Customer created",
  "customer": { "...": "CustomerDto" }
}
```

### `GET /api/customers/:id`

Returns one customer by Mongo `_id`, using the same `CustomerDto` shape as the
list response. This is used by the customer profile page.

**200 response**

```json
{
  "customer": { "...": "CustomerDto" }
}
```

**404 response**

```json
{ "message": "Customer not found" }
```

### `PUT /api/customers/:id`

Updates the editable contact, classification, route, notes, and `creditLimit`
fields of a customer. The server preserves `ledgerCode`, `paymentTerms`, opening
balance, order counters, purchase totals, outstanding balance, and `createdBy`.
Omitting `creditLimit` keeps its saved value; sending `0` means No Limit Set.

**200 response**

```json
{
  "message": "Customer updated",
  "customer": { "...": "CustomerDto" }
}
```

**404 response**

```json
{ "message": "Customer not found" }
```

The request accepts the same `name`, `businessName`, `phone`, `altPhone`,
`email`, `city`, `address`, `customerType`, `status`, `route`, `ntn`,
`creditLimit`, and `notes` rules as create. Omitted fields keep their stored
values.

### `POST /api/customers/:id/opening-balance-payments`

Appends an opening-balance payment to the customer's embedded, append-only
ledger. It never touches sale payments or sale financials. `createdBy` is always
resolved from the authenticated user and client-supplied `createdBy` is ignored.
Send an `Idempotency-Key` header (or `idempotencyKey` in the body) so retries
replay instead of appending a second record. Writes use a conditional update on
the observed `__v`, so concurrent overpayments are rejected and concurrent
duplicates produce a single record.

**Request body**

| Field | Required | Rules |
| --- | --- | --- |
| `amount` | Yes | Finite number > 0 and <= remaining opening balance |
| `method` | No | `Cash`, `Bank Transfer`, `Cheque`, `Online Transfer`; defaults to `Cash` |
| `reference` | No | String, max 120 characters |
| `idempotencyKey` | No | Header preferred; used to replay identical requests |

**200 response**

```json
{
  "message": "Opening balance payment recorded",
  "customer": { "...": "CustomerDto with updated openingBalancePaid, remainingOpeningBalance and outstanding" }
}
```

**400 / 409 / 404 responses**

```json
{ "message": "Payment cannot exceed the remaining opening balance (20000)" }
```

```json
{ "message": "This customer changed while the payment was being recorded" }
```

```json
{ "message": "Customer not found" }
```

### `POST /api/customers/:id/opening-balance-payments/:paymentId/reversal`

Appends a reversal for an existing opening-balance payment. The `amount` is
positive, recorded with `kind: "reversal"` and `reversesPaymentId`, and reduces
the net opening balance paid. Total reversals for one payment cannot exceed its
original amount. Corrections are append-only: there is no edit or delete
endpoint for individual records.

**200 response**

```json
{
  "message": "Opening balance payment reversed",
  "customer": { "...": "CustomerDto" }
}
```

### `DELETE /api/customers/:id`

Deletes a customer by Mongo `_id`. A customer linked to any sale order —
including a cancelled order — cannot be deleted, so its sale and embedded
payment history stays intact. A customer with `openingBalance > 0` is also
protected, even when it has no sale history. In both cases the stored balance
and financial records are left unchanged. Only customers with no sale history
and a zero opening balance can be deleted.

**200 response**

```json
{ "message": "Customer deleted" }
```

**404 response**

```json
{ "message": "Customer not found" }
```

**409 responses**

```json
{ "message": "Customer has sale/payment history and cannot be deleted" }
```

```json
{ "message": "Customer has an opening balance and cannot be deleted" }
```

## Create request

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | Non-empty contact-person name |
| `businessName` | Yes | Non-empty trade title |
| `phone` | Yes | 10 digits after country/leading-zero normalization; stored as `+92 XXX XXXXXXX` |
| `email` | No | Valid email when provided |
| `city` | Yes | One of `Lahore`, `Karachi`, `Rawalpindi`, `Faisalabad`, `Multan`, `Peshawar`, `Quetta`, `Gujranwala`, `Sialkot` |
| `altPhone` | No | Same phone rule as `phone` when provided |
| `address` | Yes | Max 300 characters |
| `customerType` | Yes | `Wholesale`, `Retailer`, `Distributor`, `Other` |
| `status` | Yes | `Active`, `Inactive`, `Blocked` |
| `route` | No | `lahore-central`, `lahore-north`, `lahore-south`, `multan-road`, `intercity-gt`, `unassigned`; defaults to `unassigned` |
| `ntn` | No | String |
| `creditLimit` | No | Finite, non-negative monetary value; defaults to `0` (No Limit Set); rounded to 2 decimals |
| `paymentTerms` | Yes | `cod`, `7days`, `15days`, `30days`, `45days` |
| `openingBalance` | No | Number >= 0; defaults to `0` |
| `gracePeriod` | No | `none`, `3days`, `5days`, `7days`; defaults to `none` |
| `notes` | No | Max 500 characters |
| `createdBy` | No | Ignored; server sets the authenticated user's name from the `User` collection (`System` when unauthenticated) |

`ledgerCode`, `cityLabel`, `routeLabel`, `orders`, `totalPurchases`,
`openingBalancePaid`, `remainingOpeningBalance`, `openingBalancePayments`, and
`outstanding` are server-derived and ignore client input. `outstanding` is
`remainingOpeningBalance + salesOutstanding`, where sales outstanding excludes
opening-balance payments entirely.

`availableCredit`, `creditExposurePercent`, `creditStatus`, `nearCreditLimit`,
and `creditLimitExceeded` are also server-derived from `creditLimit` and the
authoritative `outstanding`. `availableCredit` is
`max(creditLimit - outstanding, 0)`. An exposure of 80% or more is `near` and an
outstanding amount greater than a positive limit is `exceeded`; a `creditLimit`
of `0` is `no-limit` and produces no credit-limit alerts. These values are
calculations only: sales are never blocked or rejected by the credit limit.

## Error examples

```json
{ "message": "Full name is required" }
```

```json
{ "message": "Enter a valid 11-digit mobile or PTCL number" }
```

```json
{ "message": "Trade credit limit must be a finite, non-negative number" }
```

```json
{ "message": "Invalid payment terms" }
```
