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
      "gracePeriod": "3days",
      "notes": "Blank security cheque on file.",
      "orders": 0,
      "totalPurchases": 0,
      "outstanding": 25000,
      "createdBy": "Tariq M. (Owner)",
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

Updates the editable contact, classification, route, and notes fields of a
customer. The server preserves `ledgerCode`, credit settings, opening balance,
order counters, purchase totals, outstanding balance, and `createdBy`.

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
`email`, `city`, `address`, `customerType`, `status`, `route`, `ntn`, and
`notes` rules as create. Omitted fields keep their stored values.

### `DELETE /api/customers/:id`

Deletes a customer by Mongo `_id`.

**200 response**

```json
{ "message": "Customer deleted" }
```

**404 response**

```json
{ "message": "Customer not found" }
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
| `creditLimit` | Yes | Number >= 0 |
| `paymentTerms` | Yes | `cod`, `7days`, `15days`, `30days`, `45days` |
| `openingBalance` | No | Number >= 0; defaults to `0` |
| `gracePeriod` | No | `none`, `3days`, `5days`, `7days`; defaults to `none` |
| `notes` | No | Max 500 characters |
| `createdBy` | No | Defaults to `Tariq M. (Owner)` |

`ledgerCode`, `cityLabel`, `routeLabel`, `orders`, `totalPurchases`, and
`outstanding` are server-derived and ignore client input. `outstanding` is
initialized from `openingBalance`.

## Error examples

```json
{ "message": "Full name is required" }
```

```json
{ "message": "Enter a valid 11-digit mobile or PTCL number" }
```

```json
{ "message": "Trade credit limit is required" }
```

```json
{ "message": "Invalid payment terms" }
```
