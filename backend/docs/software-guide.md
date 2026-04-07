# PartnerLedger OS Software Guide

## Current Backend Status

The backend currently includes:

- Auth module with register, login, and refresh-token rotation
- Partner module with admin-only creation and automatic wallet provisioning
- Sales module with event-driven revenue recording
- Expenses module with event-driven spend recording
- Core engines for wallets, settlements, insights, alerts, and websocket updates
- Read APIs for dashboard and settlement presentation
- Prisma schema for the core finance system
- Event bus and realtime gateway foundation for later live updates

## Authentication Guide

### Register a user

`POST /api/v1/auth/register`

Request body:

```json
{
  "email": "admin@example.com",
  "fullName": "Admin User",
  "password": "StrongPassword123"
}
```

### Login

`POST /api/v1/auth/login`

Request body:

```json
{
  "email": "admin@example.com",
  "password": "StrongPassword123"
}
```

### Refresh tokens

`POST /api/v1/auth/refresh`

Request body:

```json
{
  "refreshToken": "<jwt-refresh-token>"
}
```

## Partner Module Guide

### Create a partner

`POST /api/v1/partners`

Authorization:

- Bearer token required
- User must have the `ADMIN` role

Request body:

```json
{
  "name": "Partner A",
  "ownership_percentage": 40
}
```

Response shape:

```json
{
  "id": "uuid",
  "name": "Partner A",
  "ownership_percentage": 40,
  "created_at": "2026-04-07T06:00:00.000Z",
  "wallet": {
    "cash_balance": 0,
    "online_balance": 0,
    "total_balance": 0
  }
}
```

### List partners

`GET /api/v1/partners`

Authorization:

- Bearer token required

Returns all partners with their wallet balances.

## Sales Module Guide

### Create a sale

`POST /api/v1/sales`

Authorization:

- Bearer token required
- User must have the `ADMIN` or `PARTNER` role

Request body:

```json
{
  "amount": 500,
  "payment_mode": "cash",
  "received_by": "partner_uuid",
  "timestamp": "2026-04-07T09:30:00.000Z"
}
```

Response shape:

```json
{
  "id": "sale_uuid",
  "amount": 500,
  "payment_mode": "cash",
  "received_by": "partner_uuid",
  "timestamp": "2026-04-07T09:30:00.000Z"
}
```

### List sales

`GET /api/v1/sales`

Authorization:

- Bearer token required

Optional query params:

- `received_by`
- `date_from`
- `date_to`

### Sales event flow

After a sale is saved:

1. The sales service persists the transaction.
2. The module emits `sale.created`.
3. Wallet, settlement, insight, alert, and realtime layers can react independently.

## Expenses Module Guide

### Create an expense

`POST /api/v1/expenses`

Authorization:

- Bearer token required
- User must have the `ADMIN` or `PARTNER` role

Request body:

```json
{
  "amount": 300,
  "category": "inventory",
  "paid_by": "partner_uuid",
  "type": "business",
  "payment_source": "cash",
  "description": "Purchased raw materials",
  "timestamp": "2026-04-07T10:15:00.000Z"
}
```

Response shape:

```json
{
  "id": "expense_uuid",
  "amount": 300,
  "category": "inventory",
  "paid_by": "partner_uuid",
  "type": "business",
  "payment_source": "cash",
  "description": "Purchased raw materials",
  "timestamp": "2026-04-07T10:15:00.000Z"
}
```

### List expenses

`GET /api/v1/expenses`

Authorization:

- Bearer token required

Optional query params:

- `paid_by`
- `category`
- `date_from`
- `date_to`

### Expense event flow

After an expense is saved:

1. The expenses service persists the transaction.
2. The module emits `expense.created`.
3. Wallet, settlement, insight, alert, and realtime layers can react independently.

## Engine Guide

### Wallet Engine

- `sale.created` increases the receiving partner's cash or online balance.
- `expense.created` decreases the paying partner's cash or online balance.
- `total_balance` is always updated in the same atomic wallet write.

### Settlement Engine

- Settlement recalculation runs after `wallet.updated`.
- Profit is computed as `total_sales - total_expenses`.
- Expected share is computed from partner ownership percentage.
- Net balances are matched into a minimized debtor-to-creditor transfer list.

### Insight Engine

Current rules:

- Expense spike over the trailing 3-day average
- Profit drop versus the previous day

### Alert Engine

Current rules:

- Loss day
- Overspending
- No sales
- High imbalance after settlement recalculation

### Realtime Events

The backend now broadcasts:

- `transaction.created`
- `dashboard.update`
- `settlement.updated`
- `insight.generated`
- `alert.triggered`

## Dashboard API Guide

### Get dashboard data

`GET /api/v1/dashboard`

Authorization:

- Bearer token required
- User must have the `ADMIN` or `PARTNER` role

Response shape:

```json
{
  "total_cash": 5000,
  "total_online": 12000,
  "total_sales": 20000,
  "total_expenses": 15000,
  "profit": 5000,
  "partners": [
    {
      "id": "uuid",
      "name": "Partner A",
      "wallet_balance": 3000,
      "ownership_percentage": 40
    }
  ],
  "recent_transactions": {
    "sales": [],
    "expenses": []
  }
}
```

The dashboard query returns:

- aggregate wallet balances
- aggregate sales and expenses
- per-partner wallet totals
- the five most recent sales and expenses

## Settlements API Guide

### Get live settlements

`GET /api/v1/settlements`

Authorization:

- Bearer token required
- User must have the `ADMIN` or `PARTNER` role

Response shape:

```json
{
  "settlements": [
    {
      "from": "Partner A",
      "to": "Partner B",
      "amount": 500
    }
  ]
}
```

This endpoint reads the latest persisted `live-current` settlement batch generated by the `SettlementEngine`.

## Business Rules Implemented

- The first registered user becomes `ADMIN`.
- Later self-registrations default to `VIEWER`.
- Refresh tokens are rotated and persisted securely.
- Partner ownership is validated before creation.
- Wallet records are created in the same database transaction as the partner.
- Sales are recorded without directly mutating wallets or settlement data.
- Expenses are recorded without directly mutating wallets or settlement data.
- Wallets and settlements are now maintained automatically by the engine layer.
- Dashboard and settlement views read directly from engine-maintained data.
