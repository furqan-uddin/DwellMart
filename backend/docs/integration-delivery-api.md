# Delivery Partner Integration API

Base path: `/api/integrations`

## Authentication

All routes require:

- `x-client-id: <partner-client-id>`
- `x-api-key: <partner-api-key>`

Credential validation order:

1. `IntegrationPartner` collection (preferred)
2. Environment fallback (`INTEGRATION_CLIENT_ID` + `INTEGRATION_API_KEY`)

## Rate limits

- Read APIs: integration read limiter
- Write APIs: integration write limiter

Limits are stricter in production and keyed by `x-client-id + IP`.

## Routes

### 1. List eligible orders

`GET /orders`

Query params:

- `status` (`pending|processing|shipped|NEW|READY_FOR_ASSIGNMENT|ASSIGNED|PICKED_UP|OUT_FOR_DELIVERY|DELIVERY_FAILED`)
- `fromDate` (ISO datetime)
- `toDate` (ISO datetime)
- `page` (default `1`)
- `limit` (default `50`, max `200`)

Response:

```json
{
  "success": true,
  "message": "Orders fetched successfully",
  "data": [
    {
      "orderId": "ORD1001",
      "orderDate": "2026-04-22T10:30:00.000Z",
      "customerName": "Rahul Sharma",
      "phone": "+919876543210",
      "mobile": "+919876543210",
      "paymentMode": "COD",
      "shippingAddress": {
        "addressLine1": "House No 21, Sector 5",
        "addressLine2": "Near Main Market",
        "province": "Uttar Pradesh",
        "country": "India",
        "postalCode": "226001"
      },
      "country": "India",
      "province": "Uttar Pradesh"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  }
}
```

### 2. Fetch one order header

`GET /orders/:orderId`

Response shape is a single order header object in `data`.

### 3. Fetch order item details

`GET /order-details/:orderId`

Response:

```json
{
  "success": true,
  "message": "Order item details fetched successfully",
  "data": [
    {
      "orderId": "ORD1001",
      "itemCode": "ITEM001",
      "qty": 2
    }
  ]
}
```

### 4. Delivery status callback

`POST /orders/:orderId/delivery-status`

Body:

```json
{
  "status": "DELIVERED",
  "timestamp": "2026-04-22T14:15:00.000Z",
  "note": "Delivered successfully",
  "partnerReferenceId": "TP-ORD-123456"
}
```

Allowed statuses:

- `NEW`
- `READY_FOR_ASSIGNMENT`
- `ASSIGNED`
- `PICKED_UP`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `DELIVERY_FAILED`
- `CANCELLED`

Idempotency behavior:

- Duplicate `DELIVERED` callback returns success with duplicate-safe message.
- Terminal regressions are blocked with `409`.

### 5. Optional manual inventory update

`POST /inventory/update`

Only allowed when `POST_DELIVERY` stock mode is enabled.  
Current project default is `AT_ORDER_PLACEMENT`, so this endpoint is intentionally blocked unless explicitly configured.

Body:

```json
{
  "orderId": "ORD1001",
  "items": [
    { "itemCode": "ITEM001", "qty": 2 }
  ]
}
```

Rules:

- Order must be delivered.
- Payload must match full order item quantities exactly.
- Duplicate calls are blocked.

## Integration metadata/audit

`Order.integration` stores:

- `eligibleForPartner`
- `exposedToPartnerAt`
- `deliveryPartnerName`
- `partnerReferenceId`
- `partnerStatus`
- `lastPartnerSyncAt`
- `deliveredAt`
- `inventoryUpdateMode`
- `inventoryUpdatedAfterDelivery`
- `inventoryUpdatedAt`
- `logs[]`

Request-level audit entries are stored in `IntegrationAuditLog`.

## Environment variables

Optional partner auth fallback and stock mode:

- `INTEGRATION_CLIENT_ID`
- `INTEGRATION_API_KEY`
- `INTEGRATION_API_KEY_PEPPER`
- `INTEGRATION_PARTNER_NAME`
- `INTEGRATION_SCOPES` (comma-separated)
- `INTEGRATION_STOCK_UPDATE_STAGE` (`AT_ORDER_PLACEMENT` or `POST_DELIVERY`)
