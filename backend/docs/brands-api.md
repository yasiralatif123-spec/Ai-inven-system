# Brands API contract

Base path: `/api/brands`

Brands are business-scoped catalog metadata. The router uses the same
`enforceTenantAuth` gate as products, suppliers, customers, and purchases:

- With `AUTH_ENFORCEMENT=false` the legacy public behavior remains.
- With `AUTH_ENFORCEMENT=true` a valid session cookie is required.
- With both `AUTH_ENFORCEMENT=true` and `TENANT_ENFORCEMENT=true`, every read and
  write is scoped to `req.auth.businessId` (derived from the active
  `RefreshSession`). Cross-business IDs return `404`, never `403`.
- `businessId` and `createdByUserId` in request bodies are always ignored.

All errors use the existing `{ "message": string }` shape. Validation failures
are `400`, duplicate names are `409`, and missing/cross-tenant IDs are `404`.

## Brand DTO

```json
{
  "_id": "650...",
  "name": "Dalda Foods Ltd",
  "normalizedName": "dalda foods ltd",
  "description": "Cooking oil and ghee supplier brand.",
  "isActive": true,
  "productCount": 3,
  "businessId": "650...",
  "createdByUserId": "650...",
  "createdAt": "2026-11-25T12:00:00.000Z",
  "updatedAt": "2026-11-25T12:00:00.000Z"
}
```

`productCount` is the number of products currently referencing the brand. It
lets clients warn before deactivation without changing the relationship.

## Endpoints

### `GET /api/brands`

Returns brands for the current business, newest first. Clients that omit
pagination receive the full list, matching the other business list APIs.
Type-ahead clients should send `search`, `active=true`, and a small `limit` so
large catalogs are filtered and bounded on the server.

Query parameters:

| Name | Type | Description |
|---|---|---|
| `search` | string | Case-insensitive literal partial match on `name` / `normalizedName`. Whitespace is collapsed and regex characters are escaped. |
| `active` | `true` / `false` | Optional active-state filter. Use `active=true` for product pickers. |
| `limit` | integer `1`–`100` | Optional page size. Omit for the legacy full list. |
| `page` | integer `1`–`100000` | Optional 1-based page, only meaningful with `limit`. Invalid values return `400`. |

**200 response**

```json
{
  "brands": [{ "...": "BrandDto" }],
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

`total` is the number of brands matching the filter; `hasMore` indicates that
another page is available. Results are unique brand documents in a stable
`createdAt` order, so type-ahead lists do not contain duplicates.

### `GET /api/brands/:id`

Returns one brand. Invalid ObjectIds return `400`; missing or cross-tenant IDs
return `404`.

```json
{ "brand": { "...": "BrandDto" } }
```

### `POST /api/brands`

Creates a brand. `name` is required; `description` is optional; `isActive`
defaults to `true`. Names are trimmed, internal whitespace is collapsed, and
uniqueness is enforced on `(businessId, normalizedName)`.

**201 response**

```json
{
  "message": "Brand created",
  "brand": { "...": "BrandDto" }
}
```

**409 response**

```json
{ "message": "A brand with this name already exists" }
```

### `PUT /api/brands/:id`

Updates `name`, `description`, and optionally `isActive`. The tenant boundary
cannot be changed. Duplicate checks exclude the current brand.

```json
{
  "message": "Brand updated",
  "brand": { "...": "BrandDto" }
}
```

### `PATCH /api/brands/:id/status`

Activates or deactivates a brand. Accepts either `{ "isActive": boolean }` or
`{ "status": "Active" | "Inactive" }`. Deactivation does **not** remove the
brand from existing products; the response `productCount` lets the client warn
the user. Inactive brands are excluded from `GET /api/brands?active=true`.

```json
{
  "message": "Brand deactivated",
  "brand": { "...": "BrandDto", "isActive": false, "productCount": 3 }
}
```

No DELETE endpoint is exposed. Use Active/Inactive status so product
relationships are never silently removed or reassigned.

## Product relationship

`Product.brandId` is an optional `ObjectId` reference to `Brand`. The legacy
`Product.brand` string is retained as a denormalized display snapshot so
existing products, search, pickers, and inventory rows keep working.

On product create/update, when `brandId` is supplied the backend requires an
active brand in the same business and sets `brand` from the saved brand name.
Supplying an invalid, inactive, missing, or cross-tenant brand returns `400`
with `Selected brand is invalid or inactive`. An already-assigned brand may be
inactive when the product is edited without changing that assignment, so
historical products remain editable. Omitting `brandId` keeps legacy free-text
behavior and also allows products with no brand; an explicit empty `brandId`
removes the relationship.
